"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  onRecorded: (blob: Blob) => void;
  onCancel: () => void;
}

const BAR_COUNT = 28;

export function AudioRecorder({ onRecorded, onCancel }: Props) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [bars, setBars] = useState<number[]>(() => new Array(BAR_COUNT).fill(0));

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        // recorder
        const mr = new MediaRecorder(stream);
        recorderRef.current = mr;
        chunksRef.current = [];
        mr.ondataavailable = (e) => chunksRef.current.push(e.data);
        mr.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          if (blob.size > 0) onRecorded(blob);
        };
        mr.start();
        setRecording(true);
        intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);

        // live waveform
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.7;
        source.connect(analyser);
        audioCtxRef.current = ctx;
        analyserRef.current = analyser;
        sourceRef.current = source;

        const data = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(data);
          const next: number[] = new Array(BAR_COUNT);
          const step = Math.floor(data.length / BAR_COUNT) || 1;
          for (let i = 0; i < BAR_COUNT; i++) {
            const v = data[i * step] ?? 0;
            next[i] = Math.max(0.06, v / 255);
          }
          setBars(next);
          rafRef.current = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        alert("Mikrofon erişimi reddedildi.");
        onCancel();
      }
    })();

    return () => {
      mounted = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      try {
        sourceRef.current?.disconnect();
        analyserRef.current?.disconnect();
        if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
          audioCtxRef.current.close();
        }
      } catch {
        /* noop */
      }
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stop() {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    setRecording(false);
  }

  function cancel() {
    chunksRef.current = [];
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stream.getTracks().forEach((t) => t.stop());
      recorderRef.current.stop();
    }
    onCancel();
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-2xl bg-bg-card border border-border shadow-soft">
      <span className="relative flex w-2.5 h-2.5 shrink-0">
        <span className="absolute inset-0 rounded-full bg-danger animate-ping opacity-70" />
        <span className="relative w-2.5 h-2.5 rounded-full bg-danger" />
      </span>
      <span className="text-sm font-mono tabular-nums text-text">
        {mm}:{ss}
      </span>

      <div className="flex-1 flex items-center justify-center gap-[3px] h-8 px-2">
        {bars.map((v, i) => (
          <span
            key={i}
            className="w-[3px] rounded-full bg-gradient-to-t from-accent to-accent-glow transition-[height] duration-75 ease-out"
            style={{ height: `${Math.max(8, v * 100)}%` }}
          />
        ))}
      </div>

      <button
        onClick={cancel}
        className="text-sm text-text-muted hover:text-danger transition px-2"
        aria-label="Kaydı iptal et"
      >
        İptal
      </button>
      <button
        onClick={stop}
        disabled={!recording}
        aria-label="Kaydı gönder"
        className="w-9 h-9 grid place-items-center rounded-xl bg-gradient-to-br from-accent-glow to-accent text-white shadow-glow-soft hover:shadow-glow active:scale-95 transition disabled:opacity-50"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden>
          <path d="M22 2 11 13" />
          <path d="M22 2 15 22l-4-9-9-4z" />
        </svg>
      </button>
    </div>
  );
}
