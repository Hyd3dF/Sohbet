"use client";

/**
 * OnlineDot — kullanıcının online/offline durumunu gösteren nokta.
 * userId prop'u varsa Supabase'den durumu çeker, yoksa statik gösterir.
 */

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface Props {
  userId: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function OnlineDot({ userId, size = "md", className }: Props) {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    // İlk yükleme
    supabase
      .from("user_presence")
      .select("is_online, last_seen_at")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data) return;
        // 2 dakika içinde heartbeat geldiyse online say
        const lastSeen = new Date(data.last_seen_at).getTime();
        const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
        setIsOnline(data.is_online && lastSeen > twoMinutesAgo);
      });

    // Realtime güncelleme
    const channel = supabase
      .channel(`presence:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_presence",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (cancelled) return;
          const row = payload.new as { is_online: boolean; last_seen_at: string };
          const lastSeen = new Date(row.last_seen_at).getTime();
          const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
          setIsOnline(row.is_online && lastSeen > twoMinutesAgo);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
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
