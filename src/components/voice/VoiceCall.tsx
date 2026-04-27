"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Room,
  RoomEvent,
  RemoteParticipant,
  LocalParticipant,
  Participant,
  Track,
  createLocalAudioTrack,
  ConnectionState,
} from "livekit-client";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types/db";

interface Props {
  roomId: string;
  me: Profile;
  onClose: () => void;
}

interface ParticipantInfo {
  identity: string;
  name: string;
  isSpeaking: boolean;
  isMuted: boolean;
  isLocal: boolean;
}

export function VoiceCall({ roomId, me, onClose }: Props) {
  const [room] = useState(() => new Room());
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected);
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateParticipants = useCallback((r: Room) => {
    const all: ParticipantInfo[] = [];

    // Kendimiz
    const local = r.localParticipant;
    all.push({
      identity: local.identity,
      name: local.name || local.identity,
      isSpeaking: local.isSpeaking,
      isMuted: local.isMicrophoneEnabled === false,
      isLocal: true,
    });

    // Diğerleri
    r.remoteParticipants.forEach((p: RemoteParticipant) => {
      all.push({
        identity: p.identity,
        name: p.name || p.identity,
        isSpeaking: p.isSpeaking,
        isMuted: !p.isMicrophoneEnabled,
        isLocal: false,
      });
    });

    setParticipants(all);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function connect() {
      try {
        // Token al
        const res = await fetch("/api/livekit-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomId: `voice-${roomId}`,
            userId: me.id,
            username: me.display_name || me.username,
          }),
        });

        if (!res.ok) throw new Error("Token alınamadı");
        const { token } = await res.json();
        if (cancelled) return;

        const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL!;

        // Room event'leri
        room.on(RoomEvent.ConnectionStateChanged, (state) => {
          setConnectionState(state);
        });
        room.on(RoomEvent.ParticipantConnected, () => updateParticipants(room));
        room.on(RoomEvent.ParticipantDisconnected, () => updateParticipants(room));
        room.on(RoomEvent.ActiveSpeakersChanged, () => updateParticipants(room));
        room.on(RoomEvent.TrackMuted, () => updateParticipants(room));
        room.on(RoomEvent.TrackUnmuted, () => updateParticipants(room));

        await room.connect(livekitUrl, token, {
          autoSubscribe: true,
        });

        if (cancelled) { room.disconnect(); return; }

        // Mikrofonu aç
        await room.localParticipant.setMicrophoneEnabled(true);
        updateParticipants(room);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Bağlantı hatası");
      }
    }

    connect();

    return () => {
      cancelled = true;
      room.disconnect();
    };
  }, [room, roomId, me, updateParticipants]);

  async function toggleMute() {
    const enabled = room.localParticipant.isMicrophoneEnabled;
    await room.localParticipant.setMicrophoneEnabled(!enabled);
    setIsMuted(enabled);
    updateParticipants(room);
  }

  async function leave() {
    await room.disconnect();
    onClose();
  }

  const statusLabel: Record<ConnectionState, string> = {
    [ConnectionState.Disconnected]: "Bağlantı kesildi",
    [ConnectionState.Connecting]: "Bağlanıyor…",
    [ConnectionState.Connected]: "Bağlandı",
    [ConnectionState.Reconnecting]: "Yeniden bağlanıyor…",
    [ConnectionState.SignalReconnecting]: "Sinyal yeniden bağlanıyor…",
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm glass shadow-lift rounded-3xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center border-b border-border/50">
          <div className="inline-flex items-center gap-2 chip-accent mb-2">
            <span className="relative flex w-2 h-2">
              <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-75" />
              <span className="relative w-2 h-2 rounded-full bg-success" />
            </span>
            {connectionState === ConnectionState.Connected
              ? `${participants.length} kişi`
              : statusLabel[connectionState]}
          </div>
          <h2 className="text-lg font-bold tracking-tight">Ses Araması</h2>
          {error && <p className="text-xs text-danger mt-1">{error}</p>}
        </div>

        {/* Participants */}
        <div className="px-4 py-5 space-y-2 max-h-60 overflow-y-auto">
          {participants.length === 0 ? (
            <div className="text-center text-text-dim text-sm py-4">
              Katılımcı bekleniyor…
            </div>
          ) : (
            participants.map((p) => (
              <div
                key={p.identity}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-200",
                  p.isSpeaking
                    ? "bg-success/10 border border-success/30"
                    : "bg-bg-soft border border-border/40",
                )}
              >
                {/* Avatar halkası */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-full grid place-items-center text-white font-bold text-sm shrink-0 transition-all duration-200",
                    p.isSpeaking
                      ? "bg-success shadow-[0_0_12px_rgba(34,197,94,0.5)] scale-105"
                      : "bg-accent/60",
                  )}
                >
                  {(p.name?.[0] || "?").toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">
                    {p.name}
                    {p.isLocal && (
                      <span className="ml-1.5 text-[10px] text-accent-glow font-normal">(Sen)</span>
                    )}
                  </div>
                  <div className="text-xs text-text-dim">
                    {p.isSpeaking ? "Konuşuyor…" : p.isMuted ? "Sessiz" : "Dinliyor"}
                  </div>
                </div>

                {/* Mute indicator */}
                {p.isMuted && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-danger shrink-0" aria-label="Sessiz">
                    <line x1="1" y1="1" x2="23" y2="23" />
                    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                )}
              </div>
            ))
          )}
        </div>

        {/* Controls */}
        <div className="px-6 pb-6 pt-2 flex items-center justify-center gap-4 border-t border-border/40">
          {/* Mute */}
          <button
            onClick={toggleMute}
            className={cn(
              "w-14 h-14 rounded-full grid place-items-center transition-all duration-150 active:scale-90",
              isMuted
                ? "bg-danger/20 border-2 border-danger text-danger"
                : "bg-bg-soft border-2 border-border text-text hover:border-border-strong",
            )}
            aria-label={isMuted ? "Sesi aç" : "Sesi kapat"}
          >
            {isMuted ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6" aria-hidden>
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6" aria-hidden>
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
              </svg>
            )}
          </button>

          {/* Kapat */}
          <button
            onClick={leave}
            className="w-16 h-16 rounded-full grid place-items-center bg-danger text-white shadow-[0_4px_20px_rgba(239,68,68,0.4)] transition-all duration-150 active:scale-90 hover:brightness-110"
            aria-label="Aramayı bitir"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7" aria-hidden>
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" transform="rotate(135 12 12)" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
