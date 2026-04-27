"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface Props {
  userId: string;
}

const COLS = 24; // mobilde sığacak kadar sütun
const ROWS = 7;

function getIntensity(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 10) return 3;
  return 4;
}

const intensityClass: Record<number, string> = {
  0: "bg-white/[0.04]",
  1: "bg-white/15",
  2: "bg-white/30",
  3: "bg-white/55",
  4: "bg-white/85",
};

export function ProfileBanner({ userId }: Props) {
  const [data, setData] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    async function load() {
      try {
        const since = new Date();
        since.setDate(since.getDate() - COLS * 7);
        const { data: rows } = await supabase
          .from("user_activity")
          .select("date, action_count")
          .eq("user_id", userId)
          .gte("date", since.toISOString().split("T")[0]);
        if (cancelled) return;
        const map = new Map<string, number>();
        rows?.forEach((r) => map.set(r.date, r.action_count));
        setData(map);
      } catch {}
    }
    load();
    return () => { cancelled = true; };
  }, [userId]);

  // Grid oluştur
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const dayOfWeek = (today.getDay() + 6) % 7;
  const gridStart = new Date(today);
  gridStart.setDate(gridStart.getDate() - dayOfWeek - (COLS - 1) * 7);

  const cols: { date: string; count: number }[][] = [];
  for (let c = 0; c < COLS; c++) {
    const col: { date: string; count: number }[] = [];
    for (let r = 0; r < ROWS; r++) {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + c * 7 + r);
      const dateStr = date.toISOString().split("T")[0];
      col.push({ date: dateStr, count: data.get(dateStr) ?? 0 });
    }
    cols.push(col);
  }

  return (
    <div className="relative h-44 sm:h-56 overflow-hidden">
      {/* Mor gradient zemin */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#3d1d8a] via-[#1a1035] to-[#0f0823]" />

      {/* Glow noktaları */}
      <div aria-hidden className="absolute -top-20 -left-10 w-72 h-72 rounded-full bg-accent/30 blur-[80px]" />
      <div aria-hidden className="absolute -bottom-20 right-0 w-72 h-72 rounded-full bg-accent-glow/25 blur-[90px]" />

      {/* Heatmap kutucukları arka planda */}
      <div className="absolute inset-0 flex items-center justify-center px-4 py-6 opacity-90">
        <div className="flex gap-[3px] w-full max-w-md h-full items-center">
          {cols.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-[3px] flex-1 h-full justify-center">
              {col.map((day) => {
                const intensity = getIntensity(day.count);
                const isFuture = day.date > todayStr;
                return (
                  <div
                    key={day.date}
                    className={cn(
                      "rounded-[3px] flex-1 transition-all duration-500",
                      isFuture ? "opacity-0" : intensityClass[intensity],
                    )}
                    style={{
                      animationDelay: `${ci * 30}ms`,
                      animation: "fadeIn 600ms ease-out both",
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Üst karartma — okunabilirlik için */}
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/30 to-transparent" />
    </div>
  );
}
