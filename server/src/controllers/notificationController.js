const Notification = require("../models/Notification");
const User = require("../models/User");
const { sendNotification } = require("../services/pushNotification");
const { triggerMissedDosePush } = require("../services/missedDosePush");

const getMyNotifications = async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(100);
  return res.json(notifications);
};

const markNotificationRead = async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { read: true },
    { new: true }
  );

  if (!notification) return res.status(404).json({ message: "Notification not found" });
  return res.json(notification);
};

const saveFcmToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token || typeof token !== "string" || !token.trim()) {
      // eslint-disable-next-line no-console
      console.error("[FCM][API /save-token] Invalid token payload", {
        userId: req.user?._id?.toString?.(),
        tokenType: typeof token
      });
      return res.status(400).json({ message: "Valid FCM token is required" });
    }

    const safeToken = token.trim();
    const tokenPreview = `${safeToken.slice(0, 10)}...`;

    // eslint-disable-next-line no-console
    console.log("[FCM][API /save-token] Saving token", {
      userId: req.user?._id?.toString?.(),
      tokenPreview
    });

    await User.findByIdAndUpdate(req.user._id, {
      $set: { fcmToken: safeToken },
      $addToSet: { fcmTokens: safeToken }
    });

    // eslint-disable-next-line no-console
    console.log("[FCM][API /save-token] Token saved", {
      userId: req.user?._id?.toString?.(),
      tokenPreview
    });

    return res.json({ success: true, message: "FCM token saved" });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[FCM][API /save-token] Failed to save token", {
      userId: req.user?._id?.toString?.(),
      error: error.message
    });
    return res.status(500).json({ message: "Unable to save FCM token", error: error.message });
  }
};

const sendPushNotification = async (req, res) => {
  try {
    const { token, title, body } = req.body;
    // eslint-disable-next-line no-console
    console.log("[FCM][API /notifications/push] Sending push request", {
      requestedBy: req.user?._id?.toString?.(),
      tokenPreview: typeof token === "string" ? `${token.slice(0, 10)}...` : "invalid-token",
      hasTitle: Boolean(title),
      hasBody: Boolean(body)
    });

    const result = await sendNotification(token, title, body);
    if (result.success) {
      // eslint-disable-next-line no-console
      console.log("[FCM][API /notifications/push] Push sent", {
        requestedBy: req.user?._id?.toString?.(),
        messageId: result.messageId
      });
      return res.json({ message: "Push notification sent", ...result });
    }

    const status =
      result.code === "missing-token" ||
      result.code === "missing-payload" ||
      result.code === "messaging/invalid-registration-token" ||
      result.code === "messaging/invalid-argument"
        ? 400
        : 500;

    return res.status(status).json({ message: "Unable to send push notification", ...result });
  } catch (error) {
    return res.status(500).json({ message: "Unable to send push notification", error: error.message });
  }
};

const sendPushToUser = async (req, res) => {
  try {
    const { userId, title, body } = req.body;

    if (!userId || !title || !body) {
      return res.status(400).json({ message: "userId, title, and body are required" });
    }

    const targetUser = await User.findById(userId).select("fcmToken fcmTokens");
    if (!targetUser) {
      return res.status(404).json({ message: "Target user not found" });
    }

    const tokens = [...new Set([targetUser.fcmToken, ...(targetUser.fcmTokens || [])].filter(Boolean))];

    // eslint-disable-next-line no-console
    console.log("[FCM][API /notifications/push/user] Loaded target user tokens", {
      requestedBy: req.user?._id?.toString?.(),
      targetUserId: userId,
      tokenCount: tokens.length,
      tokenPreviews: tokens.slice(0, 3).map((item) => `${item.slice(0, 10)}...`)
    });

    if (!tokens.length) {
      return res.status(400).json({ message: "Target user has no FCM tokens" });
    }

    const results = [];
    const invalidTokens = [];

    for (const token of tokens) {
      // Send one-by-one to capture per-token failures and clean stale tokens.
      const response = await sendNotification(token, title, body);
      if (response.success) {
        results.push({ token, status: "sent", messageId: response.messageId });
      } else {
        const code = response.code || "unknown";
        results.push({ token, status: "failed", code, error: response.error });
        if (code === "messaging/invalid-registration-token" || code === "messaging/registration-token-not-registered") {
          invalidTokens.push(token);
        }
      }
    }

    if (invalidTokens.length > 0) {
      const shouldClearSingleToken = targetUser.fcmToken && invalidTokens.includes(targetUser.fcmToken);
      await User.findByIdAndUpdate(userId, {
        ...(shouldClearSingleToken ? { $set: { fcmToken: null } } : {}),
        $pull: { fcmTokens: { $in: invalidTokens } }
      });
    }

    const sentCount = results.filter((item) => item.status === "sent").length;
    return res.json({
      message: "Push dispatch completed",
      sentCount,
      failedCount: results.length - sentCount,
      removedInvalidTokens: invalidTokens.length,
      results
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to send user push notification", error: error.message });
  }
};

const simulateMissedDosePush = async (req, res) => {
  try {
    const { userId, eventId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const result = await triggerMissedDosePush(userId, eventId);
    if (!result.sent && result.reason === "missing-patient") {
      return res.status(404).json({ message: "Target user not found" });
    }

    return res.json({
      message: "Missed-dose push simulation completed",
      ...result
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to simulate missed-dose push", error: error.message });
  }
};

module.exports = {
  getMyNotifications,
  markNotificationRead,
  saveFcmToken,
  sendPushNotification,
  sendPushToUser,
  simulateMissedDosePush
};
