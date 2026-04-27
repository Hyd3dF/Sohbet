"use client";

import { useEffect, useState } from "react";
import { presenceStore } from "@/lib/presence-store";
import { cn } from "@/lib/utils";

interface Props {
  userId: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function OnlineDot({ userId, size = "md", className }: Props) {
  const [isOnline, setIsOnline] = useState(() => presenceStore.isOnline(userId));

  useEffect(() => {
    presenceStore.fetchUser(userId);
    setIsOnline(presenceStore.isOnline(userId));
    const unsub = presenceStore.subscribe((id, online) => {
      if (id === userId) setIsOnline(online);
    });
    return unsub;
  }, [userId]);

  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-2.5 h-2.5",
    lg: "w-3 h-3",
  };

  if (!isOnline) {
    return (
      <span
        aria-label="Çevrimdışı"
        className={cn(
          "block rounded-full bg-bg-soft border border-border",
          sizeClasses[size],
          className,
        )}
      />
    );
  }

  return (
    <span aria-label="Çevrimiçi" className={cn("relative inline-flex", sizeClasses[size], className)}>
      <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-60" />
      <span className="relative rounded-full bg-success w-full h-full block" />
    </span>
  );
}
