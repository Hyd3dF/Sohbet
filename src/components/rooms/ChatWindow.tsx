"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { MessageBubble } from "@/components/rooms/MessageBubble";
import { MessageComposer } from "@/components/rooms/MessageComposer";
import { MemberList } from "@/components/rooms/MemberList";
import { RoomSettings } from "@/components/rooms/RoomSettings";
import { initialsOf } from "@/lib/utils";
import type { Message, Profile, Room, RoomRole } from "@/lib/types/db";

interface MessageRow extends Message {
  author?: Pick<Profile, "id" | "username" | "display_name" | "avatar_url">;
}

interface Props {
  room: Room;
  me: Profile;
  initialRole: RoomRole | null;
}

export function ChatWindow({ room, me, initialRole }: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole] = useState<RoomRole | null>(initialRole);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
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

  return (
    <div className="h-[100dvh] flex overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="sticky top-0 z-20 border-b border-border/70 bg-bg/65 backdrop-blur-xl supports-[backdrop-filter]:bg-bg/55 px-4 h-14 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/rooms"
              aria-label="Odalara dön"
              className="icon-btn !w-8 !h-8 -ml-1"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden>
                <path d="m15 18-6-6 6-6" />
              </svg>
            </Link>
            <div
              aria-hidden
              className="w-9 h-9 rounded-xl grid place-items-center text-white font-semibold text-sm shrink-0 bg-gradient-to-br from-accent to-accent-glow shadow-glow-soft"
            >
              {roomMark}
            </div>
            <div className="min-w-0">
              <div className="font-semibold tracking-tight truncate leading-tight">
                {room.name}
              </div>
              <div className="text-xs text-text-muted truncate flex items-center gap-1.5">
                <span className={room.is_private ? "text-warn" : "text-success"}>
                  {room.is_private ? "Özel" : "Açık"}
                </span>
                <span aria-hidden>·</span>
                <span className="tabular-nums">maks {room.max_members} üye</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowMembers((v) => !v)}
              aria-label="Üyeleri göster/gizle"
              aria-expanded={showMembers}
              className="icon-btn md:hidden"
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
              className="icon-btn"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]" aria-hidden>
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto py-4 px-1 sm:px-2 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-text-muted text-sm">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v3a5 5 0 0 0-5 5H4z" />
              </svg>
              Mesajlar yükleniyor…
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-text-muted py-16 space-y-2 animate-fade-in">
              <div className="mx-auto w-12 h-12 rounded-2xl grid place-items-center bg-accent-soft border border-accent/20 text-accent-glow">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6" aria-hidden>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div className="text-sm">Sohbeti sen başlat — ilk mesaj senden gelsin.</div>
            </div>
          ) : (
            messages.map((m, i) => {
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
            })
          )}
          <div ref={bottomRef} />
        </div>

        <MessageComposer roomId={room.id} me={me} />
      </div>

      {/* Desktop: sidebar sabit, Mobile: fixed overlay */}
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col w-72 border-l border-border bg-bg-soft/30 backdrop-blur-sm overflow-hidden">
        <div className="px-4 py-3 bg-bg-soft/80 backdrop-blur border-b border-border/70 flex items-center justify-between shrink-0">
          <span className="text-2xs uppercase tracking-wider font-semibold text-text-muted">
            Üyeler
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <MemberList
            roomId={room.id}
            meId={me.id}
            myRole={myRole}
            ownerId={room.owner_id}
          />
        </div>
      </aside>

      {/* Mobile: tam ekran overlay panel */}
      {showMembers && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden animate-fade-in"
            onClick={() => setShowMembers(false)}
            aria-hidden
          />
          {/* Panel — sağdan kayar, tam yükseklik, bottom nav YOK zaten oda sayfasında */}
          <div className="fixed top-0 right-0 bottom-0 z-40 w-[80vw] max-w-xs flex flex-col bg-bg border-l border-border shadow-lift md:hidden animate-slide-in-right">
            <div className="px-4 py-4 border-b border-border/70 flex items-center justify-between shrink-0 bg-bg-soft/80 backdrop-blur">
              <span className="text-sm font-semibold text-text tracking-tight">Üyeler</span>
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
        </>
      )}

      <RoomSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        room={room}
        isOwner={myRole === "owner"}
      />
    </div>
  );
}
