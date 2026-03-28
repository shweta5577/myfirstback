const dayjs = require("dayjs");
const Prescription = require("../models/Prescription");
const DoseEvent = require("../models/DoseEvent");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { emitRealtimeEvent } = require("../config/socket");

const getPatientDashboard = async (req, res) => {
  const patientId = req.user._id;
  const now = new Date();

  // Get patient user info with ID and code
  const patient = await User.findById(patientId).select("_id name email patientCode role createdAt");

  const prescriptions = await Prescription.find({ patient: patientId, active: true })
    .populate("medicine")
    .populate("doctor", "name email");

  const upcomingEvents = await DoseEvent.find({
    patient: patientId,
    scheduledFor: { $gte: dayjs(now).subtract(2, "hour").toDate() }
  })
    .sort({ scheduledFor: 1 })
    .limit(20)
    .populate({
      path: "prescription",
      populate: { path: "medicine" }
    });

  const history = await DoseEvent.find({ patient: patientId })
    .sort({ scheduledFor: -1 })
    .limit(30)
    .populate({
      path: "prescription",
      populate: { path: "medicine" }
    });

  return res.json({ patient, prescriptions, upcomingEvents, history });
};

const markDoseTaken = async (req, res) => {
  const { eventId, method = "manual" } = req.body;

  const event = await DoseEvent.findOne({ _id: eventId, patient: req.user._id });
  if (!event) return res.status(404).json({ message: "Dose event not found" });

  event.status = "taken";
  event.takenAt = new Date();
  event.verificationMethod = method;
  await event.save();

  await Notification.create({
    user: req.user._id,
    title: "Dose Logged",
    message: "Medicine marked as taken",
    type: "dose"
  });

  emitRealtimeEvent("dose:updated", event);
  return res.json({ message: "Dose marked as taken", event });
};

const triggerVoiceReminder = async (req, res) => {
  const payload = {
    userId: String(req.user._id),
    message: "Time to take your medicine",
    triggeredAt: new Date().toISOString()
  };

  emitRealtimeEvent("voice:reminder", payload);
  return res.json({
    message: "Voice reminder triggered",
    simulatedAudio: "/audio/reminder.mp3",
    payload
  });
};

module.exports = {
  getPatientDashboard,
  markDoseTaken,
  triggerVoiceReminder
};
