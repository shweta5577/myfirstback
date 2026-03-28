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
  try {
    if (typeof window === "undefined" || !("Notification" in window)) {
      console.warn("[FCM] Notifications are not supported in this environment.");
      return null;
    }

    if (!vapidKey) {
      console.warn("[FCM] VAPID key is missing. Set VITE_FIREBASE_VAPID_KEY.");
      return null;
    }

    const messaging = await getMessagingInstance();
    if (!messaging) {
      console.warn("[FCM] Messaging is not supported or Firebase app is not configured.");
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn(`[FCM] Notification permission not granted: ${permission}`);
      return null;
    }

    const serviceWorkerRegistration = await navigator.serviceWorker.ready.catch(() => null);
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: serviceWorkerRegistration || undefined
    });

    if (!token) {
      console.warn("[FCM] No token returned by Firebase Messaging.");
      return null;
    }

    console.log("[FCM] Token generated:", token);
    return token;
  } catch (error) {
    console.error("[FCM] Failed to request permission or get token:", error);
    return null;
  }
}

export async function subscribeToForegroundNotifications(handler) {
  const messaging = await getMessagingInstance();
  if (!messaging || typeof handler !== "function") {
    return () => {};
  }

  return onMessage(messaging, handler);
}
