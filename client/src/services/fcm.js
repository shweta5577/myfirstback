import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";
import { getFirebaseApp } from "./firebase";

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

async function getMessagingInstance() {
  const supported = await isSupported().catch(() => false);
  if (!supported) {
    return null;
  }

  const app = getFirebaseApp();
  if (!app) {
    return null;
  }

  return getMessaging(app);
}

export async function requestNotificationPermissionAndToken() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return null;
  }

  if (!vapidKey) {
    console.warn("FCM VAPID key is missing. Set VITE_FIREBASE_VAPID_KEY.");
    return null;
  }

  const messaging = await getMessagingInstance();
  if (!messaging) {
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return null;
  }

  const serviceWorkerRegistration = await navigator.serviceWorker.ready.catch(() => null);

  return getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: serviceWorkerRegistration || undefined
  });
}

export async function subscribeToForegroundNotifications(handler) {
  const messaging = await getMessagingInstance();
  if (!messaging || typeof handler !== "function") {
    return () => {};
  }

  return onMessage(messaging, handler);
}
