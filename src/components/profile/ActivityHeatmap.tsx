"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface Props {
  userId: string;
}

const WEEKS = 26;

function getIntensity(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 10) return 3;
  return 4;
}

const intensityClass: Record<number, string> = {
  0: "bg-bg-inset border border-border/40",
  1: "bg-accent/25 border border-accent/30",
  2: "bg-accent/50 border border-accent/40",
  3: "bg-accent/75 border border-accent-glow/50",
  4: "bg-accent-glow border border-accent-glow shadow-glow-soft",
};

const MONTH_LABELS = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
const DAY_LABELS = ["Pzt","","Çar","","Cum","","Paz"];

export function ActivityHeatmap({ userId }: Props) {
  const [data, setData] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, streak: 0, thisWeek: 0 });

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
          .gte("date", since.toISOString().split("T")[0])
          .order("date", { ascending: true });

        if (cancelled) return;
        if (error) {
          // Tablo yok ya da hata — sessizce boş göster
          setLoading(false);
          return;
        }

        const map = new Map<string, number>();
        let total = 0;
        rows?.forEach((r) => { map.set(r.date, r.action_count); total += r.action_count; });
        setData(map);

        let streak = 0;
        const today = new Date();
        for (let i = 0; i < 365; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const key = d.toISOString().split("T")[0];
          if ((map.get(key) ?? 0) > 0) streak++;
          else if (i > 0) break;
        }
        let thisWeek = 0;
        for (let i = 0; i < 7; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          thisWeek += map.get(d.toISOString().split("T")[0]) ?? 0;
        }
        setStats({ total, streak, thisWeek });
        setLoading(false);
      } catch {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [userId]);

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const dayOfWeek = (today.getDay() + 6) % 7;
  const gridStart = new Date(today);
  gridStart.setDate(gridStart.getDate() - dayOfWeek - (WEEKS - 1) * 7);

  const weeks: { date: string; count: number }[][] = [];
  for (let w = 0; w < WEEKS; w++) {
    const week: { date: string; count: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + w * 7 + d);
      const dateStr = date.toISOString().split("T")[0];
      week.push({ date: dateStr, count: data.get(dateStr) ?? 0 });
    }
    weeks.push(week);
  }

  const monthMarkers: { weekIdx: number; label: string }[] = [];
  weeks.forEach((week, i) => {
    const firstDay = new Date(week[0].date);
    if (firstDay.getDate() <= 7) {
      monthMarkers.push({ weekIdx: i, label: MONTH_LABELS[firstDay.getMonth()] });
    }
  });

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          {[0,1,2].map((i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}
        </div>
        <div className="skeleton h-32 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Toplam", value: stats.total, icon: "💜" },
          { label: "Seri", value: `${stats.streak} gün`, icon: "🔥" },
          { label: "Bu hafta", value: stats.thisWeek, icon: "✨" },
        ].map((s) => (
          <div key={s.label} className="glass p-3 text-center space-y-0.5">
            <div className="text-lg font-bold text-text tabular-nums">{s.value}</div>
            <div className="text-[10px] text-text-dim font-medium uppercase tracking-wide">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="glass p-4 overflow-x-auto">
        <div className="flex gap-1 min-w-fit">
          {/* Gün etiketleri */}
          <div className="flex flex-col gap-[3px] mr-1.5 mt-5 shrink-0">
            {DAY_LABELS.map((label, i) => (
              <div key={i} className="h-[11px] text-[9px] text-text-faint leading-none flex items-center font-medium">
                {label}
              </div>
            ))}
          </div>
          <div className="flex-1 min-w-0">
            {/* Ay etiketleri */}
            <div className="flex mb-1.5" style={{ gap: "3px" }}>
              {weeks.map((_, i) => {
                const marker = monthMarkers.find((m) => m.weekIdx === i);
                return (
                  <div key={i} className="text-[9px] text-text-faint leading-none font-medium" style={{ width: 11 }}>
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
                          "rounded-[3px] cursor-default transition-transform hover:scale-150 hover:z-10",
                          isFuture ? "opacity-0 pointer-events-none" : intensityClass[intensity],
                        )}
                        style={{ width: 11, height: 11 }}
                        title={`${day.date}: ${day.count} aktivite`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-1.5 mt-4 pt-3 border-t border-border-soft">
          <span className="text-[10px] text-text-dim font-medium">Az</span>
          {[0,1,2,3,4].map((i) => (
            <div key={i} className={cn("rounded-[3px]", intensityClass[i])} style={{ width: 11, height: 11 }} />
          ))}
          <span className="text-[10px] text-text-dim font-medium">Çok</span>
        </div>
      </div>
    </div>
  );
}
