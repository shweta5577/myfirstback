const { admin, getFirebaseAdminApp, getFirebaseAdminInitError } = require("../config/firebaseAdmin");

const sendNotification = async (token, title, body) => {
  if (!token || typeof token !== "string" || !token.trim()) {
    // eslint-disable-next-line no-console
    console.error("[Push Notification] Missing or invalid FCM token", { tokenType: typeof token });
    return {
      success: false,
      code: "missing-token",
      error: "A valid FCM token is required"
    };
  }

  if (!title || !body) {
    // eslint-disable-next-line no-console
    console.error("[Push Notification] Missing payload fields", {
      hasTitle: Boolean(title),
      hasBody: Boolean(body)
    });
    return {
      success: false,
      code: "missing-payload",
      error: "title and body are required"
    };
  }

  const app = getFirebaseAdminApp();
  if (!app) {
    const initError = getFirebaseAdminInitError();
    // eslint-disable-next-line no-console
    console.error("[Push Notification] Firebase Admin is not configured", {
      code: initError?.code || "firebase-admin/not-configured",
      error: initError?.message || "Firebase Admin is not configured"
    });
    return {
      success: false,
      code: initError?.code || "firebase-admin/not-configured",
      error: initError?.message || "Firebase Admin is not configured"
    };
  }

  try {
    const safeToken = token.trim();
    const messageId = await admin.messaging().send({
      token: safeToken,
      notification: { title, body }
    });

    // eslint-disable-next-line no-console
    console.log("[Push Notification] Push sent successfully", {
      messageId,
      tokenPreview: `${safeToken.slice(0, 8)}...`
    });

    return { success: true, messageId };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[Push Notification] Failed to send push notification", {
      code: error.code || "send-failed",
      message: error.message,
      tokenPreview: typeof token === "string" ? `${token.slice(0, 8)}...` : "invalid-token"
    });
    return {
      success: false,
      code: error.code || "send-failed",
      error: `Failed to send push notification: ${error.message}`
    };
  }
};

module.exports = {
  sendNotification
};
