"use client";

import { useEffect } from "react";
import { setOnline, setOffline, heartbeat } from "@/lib/presence";

interface Props {
  userId: string;
  children: React.ReactNode;
}

const HEARTBEAT_INTERVAL = 30_000;

export function PresenceProvider({ userId, children }: Props) {
  useEffect(() => {
    setOnline(userId);
    const interval = setInterval(() => heartbeat(userId), HEARTBEAT_INTERVAL);

    function handleBeforeUnload() { setOffline(userId); }
    function handleVisibility() {
      if (document.visibilityState === "hidden") setOffline(userId);
      else setOnline(userId);
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibility);
      setOffline(userId);
    };
  }, [userId]);

  return <>{children}</>;
}
