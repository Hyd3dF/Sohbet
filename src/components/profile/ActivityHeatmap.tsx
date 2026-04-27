"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface Props {
  userId: string;
}

type ActivityDay = { date: string; count: number };

const WEEKS = 30;
const MONTH_LABELS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
const DAY_LABELS = ["Pzt", "", "Çar", "", "Cum", "", "Paz"];

const cellClass: Record<number, string> = {
  0: "bg-[#0a0d14] ring-white/[0.035]",
  1: "bg-[#24324a] ring-[#40577d]/45",
  2: "bg-[#3d4f79] ring-[#6684bf]/50",
  3: "bg-[#7158d8] ring-accent-glow/55 shadow-[0_0_14px_rgba(124,92,255,0.22)]",
  4: "bg-[#a090ff] ring-accent-glow/70 shadow-[0_0_18px_rgba(160,144,255,0.34)]",
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

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} dk`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) return mins ? `${hours}s ${mins}dk` : `${hours}s`;
  const days = Math.floor(hours / 24);
  const restHours = hours % 24;
  return restHours ? `${days}g ${restHours}s` : `${days}g`;
}

export function ActivityHeatmap({ userId }: Props) {
  const [data, setData] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function load() {
      try {
        const since = new Date();
        since.setDate(since.getDate() - WEEKS * 7);

        const { data: rows, error } = await supabase
          .from("user_activity")
          .select("date, action_count")
          .eq("user_id", userId)
          .gte("date", toDateKey(since))
          .order("date", { ascending: true });

        if (cancelled) return;
        if (error) {
          setLoading(false);
          return;
        }

        const next = new Map<string, number>();
        rows?.forEach((row) => next.set(row.date, row.action_count));
        setData(next);
        setLoading(false);
      } catch {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const { weeks, monthMarkers, stats, todayStr } = useMemo(() => {
    const today = new Date();
    const todayKey = toDateKey(today);
    const dayOfWeek = (today.getDay() + 6) % 7;
    const gridStart = new Date(today);
    gridStart.setDate(gridStart.getDate() - dayOfWeek - (WEEKS - 1) * 7);

    const builtWeeks: ActivityDay[][] = [];
    for (let w = 0; w < WEEKS; w++) {
      const week: ActivityDay[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(gridStart);
        date.setDate(gridStart.getDate() + w * 7 + d);
        const key = toDateKey(date);
        week.push({ date: key, count: data.get(key) ?? 0 });
      }
      builtWeeks.push(week);
    }

    const markers: { weekIdx: number; label: string }[] = [];
    builtWeeks.forEach((week, i) => {
      const firstDay = new Date(week[0].date);
      if (firstDay.getDate() <= 7) {
        markers.push({ weekIdx: i, label: MONTH_LABELS[firstDay.getMonth()] });
      }
    });

    let total = 0;
    let thisWeek = 0;
    let activeDays = 0;
    data.forEach((count, date) => {
      total += count;
      if (count > 0) activeDays += 1;
      const day = new Date(date);
      const diff = Math.floor((today.getTime() - day.getTime()) / 86_400_000);
      if (diff >= 0 && diff < 7) thisWeek += count;
    });

    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const count = data.get(toDateKey(date)) ?? 0;
      if (count > 0) streak += 1;
      else if (i > 0) break;
    }

    return {
      weeks: builtWeeks,
      monthMarkers: markers,
      todayStr: todayKey,
      stats: {
        total,
        thisWeek,
        streak,
        activeDays,
        average: activeDays ? Math.round(total / activeDays) : 0,
      },
    };
  }, [data]);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-[74px] rounded-xl" />
          ))}
        </div>
        <div className="skeleton h-52 rounded-2xl" />
      </div>
    );
  }

  const statCards = [
    { label: "Aktif süre", value: formatDuration(stats.total), meta: "toplam" },
    { label: "Seri", value: `${stats.streak} gün`, meta: "kesintisiz" },
    { label: "Bu hafta", value: formatDuration(stats.thisWeek), meta: `${stats.average} dk/gün` },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {statCards.map((item, index) => (
          <div
            key={item.label}
            className="relative overflow-hidden rounded-xl border border-border/80 bg-bg-card/80 px-3 py-3 shadow-card"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-glow/50 to-transparent" />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-text-dim">
                {item.label}
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-accent-glow/80 shadow-[0_0_10px_rgba(160,144,255,0.65)]" />
            </div>
            <div className="mt-2 text-xl font-bold leading-none text-text tabular-nums">
              {item.value}
            </div>
            <div className="mt-1.5 flex items-end gap-[3px] h-4" aria-hidden>
              {Array.from({ length: 8 }).map((_, i) => {
                const height = 4 + ((i + index * 2) % 5) * 3;
                return (
                  <span
                    key={i}
                    className="w-full rounded-t-sm bg-accent/25"
                    style={{ height }}
                  />
                );
              })}
            </div>
            <div className="mt-1 text-[10px] text-text-faint">{item.meta}</div>
          </div>
        ))}
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-bg-card/80 p-3 shadow-card">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),transparent_34%)]" />

        <div className="relative flex items-center justify-between gap-3 border-b border-border-soft pb-3">
          <div>
            <div className="text-sm font-semibold text-text">Kullanım ritmi</div>
            <div className="text-xs text-text-dim">
              Son {WEEKS} hafta boyunca aktif kalınan dakikalar
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-text-dim">
            <span>Az</span>
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className={cn("h-2.5 w-2.5 rounded-[3px] ring-1", cellClass[i])}
              />
            ))}
            <span>Çok</span>
          </div>
        </div>

        <div className="relative mt-3 overflow-x-auto pb-1">
          <div className="flex min-w-fit gap-1.5">
            <div className="mt-5 flex shrink-0 flex-col gap-1.5 pr-1">
              {DAY_LABELS.map((label, i) => (
                <div
                  key={`${label}-${i}`}
                  className="flex h-[11px] items-center text-[9px] font-medium leading-none text-text-faint"
                >
                  {label}
                </div>
              ))}
            </div>

            <div>
              <div className="mb-1.5 flex gap-1.5">
                {weeks.map((_, i) => {
                  const marker = monthMarkers.find((m) => m.weekIdx === i);
                  return (
                    <div
                      key={i}
                      className="w-[11px] text-[9px] font-medium leading-none text-text-faint"
                    >
                      {marker?.label ?? ""}
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-1.5">
                {weeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-1.5">
                    {week.map((day, di) => {
                      const intensity = getIntensity(day.count);
                      const isFuture = day.date > todayStr;
                      const isToday = day.date === todayStr;
                      return (
                        <div
                          key={day.date}
                          className={cn(
                            "h-[11px] w-[11px] rounded-[3px] ring-1 transition duration-200",
                            "hover:z-10 hover:scale-[1.8] hover:ring-white/35",
                            isToday && "outline outline-1 outline-offset-1 outline-accent-glow/70",
                            isFuture ? "opacity-0 pointer-events-none" : cellClass[intensity],
                          )}
                          style={{
                            animation: "fadeIn 420ms ease-out both",
                            animationDelay: `${wi * 10 + di * 18}ms`,
                          }}
                          title={`${day.date}: ${day.count} dk aktif`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 border-t border-border-soft pt-3 text-[10px] text-text-dim">
          <span>{stats.activeDays} aktif gün</span>
          <div className="flex items-center gap-1.5 sm:hidden">
            <span>Az</span>
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className={cn("h-2.5 w-2.5 rounded-[3px] ring-1", cellClass[i])}
              />
            ))}
            <span>Çok</span>
          </div>
        </div>
      </div>
    </div>
  );
}
