"use client";

import { useEffect } from "react";
import { setOnline, setOffline, heartbeat } from "@/lib/presence";
import { trackActivity } from "@/lib/activity";

interface Props {
  userId: string;
  children: React.ReactNode;
}

const HEARTBEAT_INTERVAL = 30_000; // 30 saniye - presence
const ACTIVITY_INTERVAL = 60_000;  // 1 dakika - aktivite kaydı

export function PresenceProvider({ userId, children }: Props) {
  useEffect(() => {
    // Açılışta online ol ve ilk aktiviteyi kaydet
    setOnline(userId);
    trackActivity(userId);

    // Presence heartbeat (30s)
    const heartbeatTimer = setInterval(() => {
      if (document.visibilityState === "visible") {
        heartbeat(userId);
      }
    }, HEARTBEAT_INTERVAL);

    // Aktivite tracking (60s) — sadece kullanıcı sayfada aktifse
    const activityTimer = setInterval(() => {
      if (document.visibilityState === "visible") {
        trackActivity(userId);
      }
    }, ACTIVITY_INTERVAL);

    function handleBeforeUnload() { setOffline(userId); }
    function handleVisibility() {
      if (document.visibilityState === "hidden") setOffline(userId);
      else {
        setOnline(userId);
        trackActivity(userId);
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(heartbeatTimer);
      clearInterval(activityTimer);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibility);
      setOffline(userId);
    };
  }, [userId]);

  return <>{children}</>;
}
