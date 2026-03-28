import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import {
  requestNotificationPermissionAndToken,
  subscribeToForegroundNotifications
} from "../services/fcm";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const signup = async (payload) => {
    const { data } = await api.post("/auth/signup", payload);
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  useEffect(() => {
    let unsubscribe = () => {};

    const setupForegroundListener = async () => {
      unsubscribe = await subscribeToForegroundNotifications((payload) => {
        const title = payload?.notification?.title || "New notification";
        const body = payload?.notification?.body || "You have a new update.";
        // Keep handling lightweight in foreground and let UI evolve later.
        console.info("FCM foreground message:", payload);
        if (Notification.permission === "granted") {
          new Notification(title, { body });
        }
      });
    };

    setupForegroundListener();
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    const saveToken = async () => {
      const fcmToken = await requestNotificationPermissionAndToken();
      if (!fcmToken) {
        return;
      }

      try {
        await api.post("/save-token", { token: fcmToken });
      } catch (error) {
        console.error("Unable to save FCM token", error);
      }
    };

    saveToken();
  }, [user]);

  const value = useMemo(
    () => ({ user, isAuthenticated: Boolean(user), login, signup, logout }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
