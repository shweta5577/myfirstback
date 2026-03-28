const { admin, getFirebaseAdminApp, getFirebaseAdminInitError } = require("../config/firebaseAdmin");

const sendNotification = async (token, title, body) => {
  if (!token || typeof token !== "string") {
    return {
      success: false,
      code: "missing-token",
      error: "FCM token is required"
    };
  }

  if (!title || !body) {
    return {
      success: false,
      code: "missing-payload",
      error: "title and body are required"
    };
  }

  const app = getFirebaseAdminApp();
  if (!app) {
    const initError = getFirebaseAdminInitError();
    return {
      success: false,
      code: initError?.code || "firebase-admin/not-configured",
      error: initError?.message || "Firebase Admin is not configured"
    };
  }

  try {
    const messageId = await admin.messaging(app).send({
      token,
      notification: { title, body }
    });

    return { success: true, messageId };
  } catch (error) {
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
