"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface Props {
  userId: string;
}

interface DayActivity {
  date: string; // "2025-04-27"
  count: number;
}

// Son 52 hafta = 364 gün
const WEEKS = 26; // mobilde 26 hafta göster
const DAYS_PER_WEEK = 7;

function getIntensity(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 10) return 3;
  return 4;
}

const intensityClass: Record<number, string> = {
  0: "bg-bg-inset border border-border/40",
  1: "bg-accent/20 border border-accent/20",
  2: "bg-accent/40 border border-accent/30",
  3: "bg-accent/65 border border-accent/50",
  4: "bg-accent border border-accent-glow/50 shadow-glow-soft",
};

const DAY_LABELS = ["Pzt", "", "Çar", "", "Cum", "", "Paz"];
const MONTH_LABELS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

export function ActivityHeatmap({ userId }: Props) {
  const [data, setData] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<{ date: string; count: number } | null>(null);
  const [stats, setStats] = useState({ total: 0, streak: 0, thisWeek: 0 });

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const since = new Date();
      since.setDate(since.getDate() - WEEKS * 7);

      const { data: rows } = await supabase
        .from("user_activity")
        .select("date, action_count")
        .eq("user_id", userId)
        .gte("date", since.toISOString().split("T")[0])
        .order("date", { ascending: true });

      const map = new Map<string, number>();
      let total = 0;
      rows?.forEach((r) => {
        map.set(r.date, r.action_count);
        total += r.action_count;
      });
      setData(map);

      // streak hesapla
      let streak = 0;
      const today = new Date();
      for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split("T")[0];
        if (map.has(key) && (map.get(key) ?? 0) > 0) {
          streak++;
        } else if (i > 0) {
          break;
        }
      }

      // bu hafta
      let thisWeek = 0;
      for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        thisWeek += map.get(d.toISOString().split("T")[0]) ?? 0;
      }

      setStats({ total, streak, thisWeek });
      setLoading(false);
    }

    load();
  }, [userId]);

  // Grid oluştur — son WEEKS hafta
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // Haftanın başına hizala (Pazartesi)
  const dayOfWeek = (today.getDay() + 6) % 7; // 0=Pzt
  const gridStart = new Date(today);
  gridStart.setDate(gridStart.getDate() - dayOfWeek - (WEEKS - 1) * 7);

  const weeks: DayActivity[][] = [];
  for (let w = 0; w < WEEKS; w++) {
    const week: DayActivity[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + w * 7 + d);
      const dateStr = date.toISOString().split("T")[0];
      week.push({ date: dateStr, count: data.get(dateStr) ?? 0 });
    }
    weeks.push(week);
  }

  // Ay etiketleri
  const monthMarkers: { weekIdx: number; label: string }[] = [];
  weeks.forEach((week, i) => {
    const firstDay = new Date(week[0].date);
    if (firstDay.getDate() <= 7) {
      monthMarkers.push({ weekIdx: i, label: MONTH_LABELS[firstDay.getMonth()] });
    }
  });

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="skeleton h-4 w-32 rounded" />
        <div className="skeleton h-24 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Toplam aktivite", value: stats.total },
          { label: "Güncel seri", value: `${stats.streak} gün` },
          { label: "Bu hafta", value: stats.thisWeek },
        ].map((s) => (
          <div key={s.label} className="glass p-3 text-center space-y-0.5">
            <div className="text-lg font-bold text-text tabular-nums">{s.value}</div>
            <div className="text-[10px] text-text-dim font-medium leading-tight">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <div className="glass p-4 overflow-x-auto">
        <div className="flex gap-1">
          {/* Gün etiketleri */}
          <div className="flex flex-col gap-[3px] mr-1 mt-5">
            {DAY_LABELS.map((label, i) => (
              <div key={i} className="h-[10px] text-[8px] text-text-faint leading-none flex items-center">
                {label}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="flex-1">
            {/* Ay etiketleri */}
            <div className="flex mb-1" style={{ gap: "3px" }}>
              {weeks.map((_, i) => {
                const marker = monthMarkers.find((m) => m.weekIdx === i);
                return (
                  <div key={i} className="flex-1 text-[8px] text-text-faint leading-none min-w-[10px]">
                    {marker?.label ?? ""}
                  </div>
                );
              })}
            </div>

            {/* Cells */}
            <div className="flex" style={{ gap: "3px" }}>
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col" style={{ gap: "3px" }}>
                  {week.map((day) => {
                    const intensity = getIntensity(day.count);
                    const isFuture = day.date > todayStr;
                    return (
                      <div
                        key={day.date}
                        className={cn(
                          "rounded-[3px] cursor-default transition-transform hover:scale-125",
                          isFuture ? "opacity-0 pointer-events-none" : intensityClass[intensity],
                        )}
                        style={{ width: 10, height: 10 }}
                        onMouseEnter={() => setTooltip({ date: day.date, count: day.count })}
                        onMouseLeave={() => setTooltip(null)}
                        title={`${day.date}: ${day.count} aktivite`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div className="mt-3 text-xs text-text-muted text-center animate-fade-in">
            <span className="font-semibold text-text">{tooltip.count}</span> aktivite ·{" "}
            {new Date(tooltip.date + "T00:00:00").toLocaleDateString("tr-TR", {
              day: "numeric", month: "long", year: "numeric",
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-end gap-1.5 mt-3">
          <span className="text-[9px] text-text-faint">Az</span>
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={cn("rounded-[3px]", intensityClass[i])}
              style={{ width: 10, height: 10 }}
            />
          ))}
          <span className="text-[9px] text-text-faint">Çok</span>
        </div>
      </div>
    </div>
  );
}
