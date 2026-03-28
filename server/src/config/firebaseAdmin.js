const path = require("path");
const admin = require("firebase-admin");

let firebaseApp = null;
let firebaseInitError = null;

const loadServiceAccount = () => {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    }

    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const resolvedPath = path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      // eslint-disable-next-line global-require, import/no-dynamic-require
      return require(resolvedPath);
    }

    return null;
  } catch (error) {
    const wrappedError = new Error(`Invalid Firebase service account configuration: ${error.message}`);
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

  const serviceAccount = loadServiceAccount();
  if (!serviceAccount) {
    // eslint-disable-next-line no-console
    console.warn("Firebase Admin credentials are missing. Push notifications are disabled.");
    return null;
  }

  try {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    // eslint-disable-next-line no-console
    console.log("Firebase Admin initialized successfully");
    return firebaseApp;
  } catch (error) {
    firebaseInitError = new Error(`Firebase Admin initialization failed: ${error.message}`);
    firebaseInitError.code = "firebase-admin/init-failed";
    // eslint-disable-next-line no-console
    console.error(firebaseInitError.message);
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
