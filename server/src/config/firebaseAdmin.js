const admin = require("firebase-admin");

let firebaseApp = null;
let firebaseInitError = null;

const loadServiceAccount = () => {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountJson) {
    return null;
  }

  try {
    return JSON.parse(serviceAccountJson);
  } catch (error) {
    const wrappedError = new Error(
      `Invalid Firebase service account JSON: ${error.message}. Ensure FIREBASE_SERVICE_ACCOUNT_JSON is a valid JSON string.`
    );
    wrappedError.code = "firebase-admin/config-error";
    throw wrappedError;
  }
};

const initializeFirebaseAdmin = () => {
  if (firebaseApp) {
    return firebaseApp;
  }

  if (firebaseInitError) {
    return null;
  }

  if (admin.apps.length) {
    firebaseApp = admin.app();
    return firebaseApp;
  }

  try {
    const serviceAccount = loadServiceAccount();
    if (!serviceAccount) {
      firebaseInitError = new Error(
        "Firebase Admin initialization skipped: FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set. " +
        "Push notifications will be disabled until the environment variable is properly configured."
      );
      // eslint-disable-next-line no-console
      console.warn("[Firebase Admin]", firebaseInitError.message);
      return null;
    }

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    // eslint-disable-next-line no-console
    console.log("[Firebase Admin] Successfully initialized with FIREBASE_SERVICE_ACCOUNT_JSON environment variable");
    return firebaseApp;
  } catch (error) {
    firebaseInitError = new Error(`Firebase Admin initialization failed: ${error.message}`);
    firebaseInitError.code = "firebase-admin/init-failed";
    // eslint-disable-next-line no-console
    console.error("[Firebase Admin]", firebaseInitError.message);
    return null;
  }
};

const getFirebaseAdminApp = () => {
  return initializeFirebaseAdmin();
};

const getFirebaseAdminInitError = () => {
  return firebaseInitError;
};

module.exports = {
  admin,
  initializeFirebaseAdmin,
  getFirebaseAdminApp,
  getFirebaseAdminInitError
};
