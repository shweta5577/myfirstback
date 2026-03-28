const User = require("../models/User");
const { sendNotification } = require("./pushNotification");

const buildMissedDoseBody = (eventId) => {
  const suffix = eventId ? ` (Event: ${eventId})` : "";
  return `A scheduled medicine dose was missed.${suffix}`;
};

const triggerMissedDosePush = async (patientId, eventId) => {
  if (!patientId) {
    return { sent: false, reason: "missing-patient" };
  }

  const user = await User.findById(patientId).select("fcmToken");
  if (!user?.fcmToken) {
    return { sent: false, reason: "missing-fcm-token" };
  }

  const result = await sendNotification(user.fcmToken, "Missed Dose", buildMissedDoseBody(eventId));
  if (result.success) {
    return { sent: true, messageId: result.messageId };
  }

  return {
    sent: false,
    reason: "send-failed",
    code: result.code || "unknown",
    error: result.error
  };
};

module.exports = {
  triggerMissedDosePush
};
