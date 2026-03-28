const cron = require("node-cron");
const dayjs = require("dayjs");
const Prescription = require("../models/Prescription");
const DoseEvent = require("../models/DoseEvent");
const Notification = require("../models/Notification");
const Medicine = require("../models/Medicine");
const { emitRealtimeEvent } = require("../config/socket");
const { triggerMissedDosePush } = require("./missedDosePush");

const hhmm = (date) => dayjs(date).format("HH:mm");

const runDispenseTick = async () => {
  const now = new Date();
  const currentHHMM = hhmm(now);

  const activePrescriptions = await Prescription.find({
    active: true,
    startDate: { $lte: now },
    endDate: { $gte: now }
  }).populate("medicine");

  // Create pending events for due schedules in the current minute.
  for (const prescription of activePrescriptions) {
    const dueNow = (prescription.timings || []).includes(currentHHMM);
    if (!dueNow) continue;

    const scheduledFor = dayjs(now).second(0).millisecond(0).toDate();

    const exists = await DoseEvent.findOne({ prescription: prescription._id, scheduledFor });
    if (exists) continue;

    const event = await DoseEvent.create({
      prescription: prescription._id,
      patient: prescription.patient,
      scheduledFor,
      status: "pending"
    });

    await Notification.create({
      user: prescription.patient,
      title: "Dose Reminder",
      message: `Please take ${prescription.medicine?.name || "your medicine"}`,
      type: "dose",
      metadata: { eventId: event._id }
    });

    emitRealtimeEvent("dose:scheduled", event);
    emitRealtimeEvent("buzzer:alert", {
      patient: String(prescription.patient),
      message: "Dose scheduled. Buzzer activated."
    });
  }

  const missedBoundary = dayjs(now).subtract(30, "minute").toDate();
  const missedEvents = await DoseEvent.find({
    status: "pending",
    scheduledFor: { $lte: missedBoundary }
  }).limit(100);

  for (const event of missedEvents) {
    event.status = "missed";
    await event.save();

    await Notification.create({
      user: event.patient,
      title: "Missed Dose",
      message: "A scheduled medicine dose was missed",
      type: "alert",
      metadata: { eventId: event._id }
    });

    const pushResult = await triggerMissedDosePush(event.patient, event._id);
    if (!pushResult.sent && pushResult.reason !== "missing-fcm-token") {
      // eslint-disable-next-line no-console
      console.warn("Missed-dose push failed", {
        patient: String(event.patient),
        eventId: String(event._id),
        ...pushResult
      });
    }

    emitRealtimeEvent("dose:missed", event);
  }

  const medicines = await Medicine.find();
  const expiryDays = Number(process.env.EXPIRY_ALERT_DAYS || 30);
  const expiryBoundary = dayjs(now).add(expiryDays, "day").toDate();

  const expiring = medicines.filter((m) => new Date(m.expiryDate) <= expiryBoundary);
  if (expiring.length) {
    emitRealtimeEvent("inventory:expiry-alert", expiring);
  }
};

const startDispenseScheduler = () => {
  cron.schedule("* * * * *", async () => {
    try {
      await runDispenseTick();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Dispense scheduler error", error.message);
    }
  });
};

module.exports = {
  startDispenseScheduler,
  runDispenseTick
};
