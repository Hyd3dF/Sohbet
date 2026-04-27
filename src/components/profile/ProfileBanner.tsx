"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface Props {
  userId: string;
}

type ActivityDay = { date: string; count: number };

const COLS = 34;
const ROWS = 7;

const cellClass: Record<number, string> = {
  0: "bg-white/[0.035]",
  1: "bg-[#2c3856]/75",
  2: "bg-[#4d5f90]/80",
  3: "bg-[#7c5cff]/80",
  4: "bg-[#a090ff]",
};

function getIntensity(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 10) return 3;
  return 4;
}

function toDateKey(date: Date) {
  return date.toISOString().split("T")[0];
}

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
          .gte("date", toDateKey(since));

        if (cancelled) return;
        const next = new Map<string, number>();
        rows?.forEach((row) => next.set(row.date, row.action_count));
        setData(next);
      } catch {}
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const { cols, total, bestDay } = useMemo(() => {
    const today = new Date();
    const todayStr = toDateKey(today);
    const dayOfWeek = (today.getDay() + 6) % 7;
    const gridStart = new Date(today);
    gridStart.setDate(gridStart.getDate() - dayOfWeek - (COLS - 1) * 7);

    let sum = 0;
    let best = 0;
    const built: ActivityDay[][] = [];

    for (let c = 0; c < COLS; c++) {
      const col: ActivityDay[] = [];
      for (let r = 0; r < ROWS; r++) {
        const date = new Date(gridStart);
        date.setDate(gridStart.getDate() + c * 7 + r);
        const dateStr = toDateKey(date);
        const count = dateStr > todayStr ? 0 : data.get(dateStr) ?? 0;
        sum += count;
        best = Math.max(best, count);
        col.push({ date: dateStr, count });
      }
      built.push(col);
    }

    return { cols: built, total: sum, bestDay: best };
  }, [data]);

  return (
    <div className="relative h-44 overflow-hidden sm:h-56">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#0b0d18_0%,#111628_42%,#120d25_100%)]" />
      <div className="absolute inset-0 opacity-80 bg-[radial-gradient(ellipse_at_50%_0%,rgba(124,92,255,0.20),transparent_62%)]" />

      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-glow/45 to-transparent" />
      <div className="absolute left-1/2 top-5 h-20 w-[42rem] -translate-x-1/2 rounded-full border border-white/[0.035]" />

      <div
        className="absolute inset-x-0 top-4 mx-auto flex max-w-4xl justify-center px-4 opacity-95"
        style={{
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 18%, black 78%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, black 18%, black 78%, transparent 100%)",
        }}
      >
        <div className="flex w-full max-w-3xl gap-1.5">
          {cols.map((col, ci) => (
            <div key={ci} className="flex flex-1 flex-col gap-1.5">
              {col.map((day, ri) => {
                const intensity = getIntensity(day.count);
                return (
                  <span
                    key={day.date}
                    className={cn(
                      "h-3 min-w-2 rounded-[4px] transition duration-500",
                      cellClass[intensity],
                    )}
                    style={{
                      animation: "fadeIn 560ms ease-out both",
                      animationDelay: `${ci * 14 + ri * 18}ms`,
                      boxShadow:
                        intensity >= 3
                          ? "0 0 18px rgba(124, 92, 255, 0.22)"
                          : undefined,
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-bg via-bg/85 to-transparent" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,9,16,0.92),transparent_28%,transparent_72%,rgba(8,9,16,0.92))]" />

      <div className="absolute bottom-7 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-bg/45 px-3 py-1.5 text-[11px] font-medium text-text-muted backdrop-blur-md">
        <span className="h-1.5 w-1.5 rounded-full bg-accent-glow shadow-[0_0_12px_rgba(160,144,255,0.85)]" />
        <span>{total} dk toplam</span>
        <span className="h-3 w-px bg-border" />
        <span>en iyi gün {bestDay} dk</span>
      </div>
    </div>
  );
}
