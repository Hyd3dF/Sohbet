"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  src: string;
  variant?: "mine" | "other";
}

function fmt(s: number) {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function AudioPlayer({ src, variant = "other" }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setCurrent(a.currentTime);
    const onMeta = () => setDuration(a.duration);
    const onEnd = () => { setPlaying(false); setCurrent(0); };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("durationchange", onMeta);
    a.addEventListener("ended", onEnd);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("durationchange", onMeta);
      a.removeEventListener("ended", onEnd);
    };
  }, []);

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      a.play();
      setPlaying(true);
    } else {
      a.pause();
      setPlaying(false);
    }
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const a = audioRef.current;
    const t = trackRef.current;
    if (!a || !t || !duration) return;
    const rect = t.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    a.currentTime = pct * duration;
    setCurrent(a.currentTime);
  }

  const pct = duration > 0 ? (current / duration) * 100 : 0;
  const isMine = variant === "mine";

  return (
    <div className="flex items-center gap-2.5 min-w-[200px] sm:min-w-[220px]">
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Duraklat" : "Oynat"}
        className={cn(
          "shrink-0 w-9 h-9 rounded-full grid place-items-center transition-all duration-150 active:scale-90",
          isMine
            ? "bg-white/15 hover:bg-white/25 text-white"
            : "bg-accent/15 hover:bg-accent/25 text-accent-glow",
        )}
      >
        {playing ? (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5" aria-hidden>
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 translate-x-px" aria-hidden>
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div
          ref={trackRef}
          onClick={seek}
          className={cn(
            "h-1 rounded-full cursor-pointer overflow-hidden",
            isMine ? "bg-white/20" : "bg-bg-soft",
          )}
        >
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-100",
              isMine ? "bg-white" : "bg-accent-glow",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className={cn(
          "text-[10.5px] tabular-nums font-medium",
          isMine ? "text-white/70" : "text-text-dim",
        )}>
          {fmt(current)} / {duration ? fmt(duration) : "0:00"}
        </span>
      </div>
    </div>
  );
}
