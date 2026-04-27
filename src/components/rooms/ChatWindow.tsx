"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { MessageBubble } from "@/components/rooms/MessageBubble";
import { MessageComposer } from "@/components/rooms/MessageComposer";
import { MemberList } from "@/components/rooms/MemberList";
import { RoomSettings } from "@/components/rooms/RoomSettings";
import { VoiceCall } from "@/components/voice/VoiceCall";
import { cn, initialsOf } from "@/lib/utils";
import type { Message, Profile, Room, RoomRole } from "@/lib/types/db";

interface MessageRow extends Message {
  author?: Pick<Profile, "id" | "username" | "display_name" | "avatar_url">;
}

interface Props {
  room: Room;
  me: Profile;
  initialRole: RoomRole | null;
}

const ROOM_GRADIENT_PAIRS = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-orange-500 to-red-500",
  "from-pink-500 to-rose-500",
  "from-amber-500 to-yellow-500",
];

function getRoomGradient(id: string) {
  const hash = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return ROOM_GRADIENT_PAIRS[hash % ROOM_GRADIENT_PAIRS.length];
}

export function ChatWindow({ room, me, initialRole }: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole] = useState<RoomRole | null>(initialRole);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (isDesktop && showMembers) setShowMembers(false);
  }, [isDesktop, showMembers]);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!myRole) {
      router.replace("/rooms");
      return;
    }
    const supabase = createClient();
    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from("messages")
        .select("*, author:profiles!messages_author_id_fkey(id,username,display_name,avatar_url)")
        .eq("room_id", room.id)
        .order("created_at", { ascending: true })
        .limit(200);
      if (!cancelled) {
        setMessages((data as MessageRow[]) ?? []);
        setLoading(false);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "instant" as ScrollBehavior }), 50);
      }
    })();

    const channel = supabase
      .channel(`room:${room.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${room.id}` },
        async (payload) => {
          const m = payload.new as Message;
          const { data: author } = await supabase
            .from("profiles")
            .select("id,username,display_name,avatar_url")
            .eq("id", m.author_id)
            .single();
          setMessages((prev) =>
            prev.find((x) => x.id === m.id) ? prev : [...prev, { ...m, author: author ?? undefined }],
          );
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 30);
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "messages", filter: `room_id=eq.${room.id}` },
        (payload) => {
          setMessages((prev) => prev.filter((x) => x.id !== (payload.old as Message).id));
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_members",
          filter: `room_id=eq.${room.id}`,
        },
        async () => {
          const { data } = await supabase
            .from("room_members")
            .select("role")
            .eq("room_id", room.id)
            .eq("user_id", me.id)
            .maybeSingle();
          if (!data) {
            router.replace("/rooms");
          } else {
            setMyRole(data.role as RoomRole);
          }
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [room.id, me.id, myRole, router]);

  async function deleteMessage(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("messages").delete().eq("id", id);
    if (error) alert(error.message);
  }

  if (!myRole) return null;

  const roomMark = initialsOf(room.name) || "#";
  const gradient = getRoomGradient(room.id);

  return (
    <div className="h-[100dvh] flex overflow-hidden bg-bg">
      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-bg-card/90 backdrop-blur-2xl shrink-0">
          <div className="px-3 sm:px-5 h-[3.75rem] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/rooms"
              aria-label="Odalara dön"
              className="icon-btn !w-8 !h-8 -ml-1 hover:bg-accent-soft hover:text-accent-glow"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden>
                <path d="m15 18-6-6 6-6" />
              </svg>
            </Link>
            <div
              aria-hidden
              className={cn(
                "w-9 h-9 rounded-xl grid place-items-center text-white font-bold text-sm shrink-0 shadow-glow-soft bg-gradient-to-br",
                gradient,
              )}
            >
              {roomMark}
            </div>
            <div className="min-w-0">
              <div className="font-bold tracking-tight truncate leading-snug text-[15px]">
                {room.name}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={cn(
                  "inline-flex items-center gap-1 px-1.5 py-px rounded text-[10px] font-semibold",
                  room.is_private ? "bg-warn/10 text-warn" : "bg-success/10 text-success",
                )}>
                  {room.is_private ? "Özel" : "Açık"}
                </span>
                <span className="text-[11px] text-text-dim tabular-nums">{room.max_members} üye</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setVoiceOpen(true)}
              className="icon-btn hover:bg-success/10 hover:text-success"
              aria-label="Görüntülü/sesli arama başlat"
              title="Görüntülü/sesli arama"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]" aria-hidden>
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </button>
            <button
              onClick={() => setShowMembers((v) => !v)}
              aria-label="Üyeleri göster/gizle"
              aria-expanded={showMembers}
              className={cn("icon-btn md:hidden", showMembers && "bg-accent-soft text-accent-glow")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]" aria-hidden>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </button>
            {myRole === "owner" && (
            <button
              onClick={() => setSettingsOpen(true)}
              aria-label="Oda ayarları"
              className="icon-btn hover:bg-accent-soft hover:text-accent-glow"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]" aria-hidden>
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
            )}
          </div>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-border/70 to-transparent" />
        </header>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto py-5 px-0 sm:px-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-text-muted text-sm">
              <div className="w-10 h-10 rounded-xl grid place-items-center bg-bg-card border border-border/50">
                <svg className="animate-spin w-5 h-5 text-accent" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v3a5 5 0 0 0-5 5H4z" />
                </svg>
              </div>
              Mesajlar yükleniyor...
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-20 space-y-4 animate-fade-in">
              <div className="mx-auto w-16 h-16 rounded-2xl grid place-items-center bg-gradient-to-br from-accent/15 to-accent/5 border border-accent/20 text-accent-glow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7" aria-hidden>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div>
                <div className="font-bold text-base">Sohbeti sen başlat</div>
                <p className="text-sm text-text-dim mt-1">İlk mesaj senden gelsin.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-0.5">
              {messages.map((m, i) => {
                const prev = messages[i - 1];
                const grouped =
                  !!prev &&
                  prev.author_id === m.author_id &&
                  new Date(m.created_at).getTime() -
                    new Date(prev.created_at).getTime() <
                    5 * 60 * 1000;
                return (
                  <MessageBubble
                    key={m.id}
                    message={m}
                    meId={me.id}
                    myRole={myRole}
                    onDelete={deleteMessage}
                    grouped={grouped}
                  />
                );
              })}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <MessageComposer
          roomId={room.id}
          me={me}
          onLocalAppend={(m) => {
            setMessages((prev) => (prev.find((x) => x.id === m.id) ? prev : [...prev, m]));
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 30);
          }}
        />
      </div>

      {/* Desktop sidebar */}
      {isDesktop && (
        <aside className="flex flex-col w-64 border-l border-border/40 bg-bg/60 backdrop-blur-sm overflow-hidden">
          <div className="px-4 h-[3.75rem] flex items-center justify-between shrink-0 bg-bg-card/60">
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-accent-glow" aria-hidden>
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span className="text-xs font-bold text-text-muted tracking-wide uppercase">
                Üyeler
              </span>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-border/70 to-transparent shrink-0" />
          <div className="flex-1 overflow-y-auto p-2">
            <MemberList
              roomId={room.id}
              meId={me.id}
              myRole={myRole}
              ownerId={room.owner_id}
            />
          </div>
        </aside>
      )}

      {/* Mobile: member panel overlay */}
      {!isDesktop && showMembers && mounted && createPortal(
        <>
          <div
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowMembers(false)}
            aria-hidden
          />
          <div className="fixed top-0 right-0 bottom-0 z-[101] w-[82vw] max-w-xs flex flex-col bg-bg border-l border-border/50 shadow-lift animate-slide-in-right">
            <div className="px-4 py-4 border-b border-border/50 flex items-center justify-between shrink-0 bg-bg-card/80 backdrop-blur">
              <div className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-accent-glow" aria-hidden>
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span className="text-sm font-bold text-text tracking-tight">Üyeler</span>
              </div>
              <button
                onClick={() => setShowMembers(false)}
                className="icon-btn !w-8 !h-8"
                aria-label="Kapat"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4" aria-hidden>
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <MemberList
                roomId={room.id}
                meId={me.id}
                myRole={myRole}
                ownerId={room.owner_id}
              />
            </div>
          </div>
        </>,
        document.body
      )}

      <RoomSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        room={room}
        isOwner={myRole === "owner"}
      />

      {voiceOpen && (
        <VoiceCall
          roomId={room.id}
          me={me}
          onClose={() => setVoiceOpen(false)}
        />
      )}
    </div>
  );
}
