"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { CreateRoomModal } from "@/components/rooms/CreateRoomModal";
import { cn, initialsOf } from "@/lib/utils";
import type { Profile, Room, RoomMember } from "@/lib/types/db";

interface Props {
  me: Profile;
}

interface RoomWithMeta extends Room {
  member_count: number;
  is_member: boolean;
}

export function RoomList({ me }: Props) {
  const [rooms, setRooms] = useState<RoomWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    (async () => {
      try {
        const { data: roomsData } = await supabase
          .from("rooms")
          .select("*")
          .order("created_at", { ascending: false });
        if (cancelled) return;

        const ids = roomsData?.map((r) => r.id) ?? [];
        let members: { room_id: string; user_id: string }[] = [];

        if (ids.length > 0) {
          const { data } = await supabase
            .from("room_members")
            .select("room_id, user_id")
            .in("room_id", ids);
          members = data ?? [];
        }

        const counts = new Map<string, number>();
        const myRooms = new Set<string>();
        members.forEach((m) => {
          counts.set(m.room_id, (counts.get(m.room_id) ?? 0) + 1);
          if (m.user_id === me.id) myRooms.add(m.room_id);
        });

        if (!cancelled) {
          setRooms(
            (roomsData ?? []).map((r) => ({
              ...r,
              member_count: counts.get(r.id) ?? 0,
              is_member: myRooms.has(r.id),
            })),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [me.id]);

  async function joinRoom(roomId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("room_members")
      .insert({ room_id: roomId, user_id: me.id, role: "member" } as RoomMember);
    if (error) {
      alert(error.message);
      return;
    }
    setRooms((prev) =>
      prev.map((r) =>
        r.id === roomId ? { ...r, is_member: true, member_count: r.member_count + 1 } : r,
      ),
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Odalar</h1>
          <p className="text-text-muted text-sm mt-1">
            Arkadaşlarınla sohbet odası kur veya mevcut bir odaya katıl.
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="relative overflow-hidden btn-primary !py-2 !px-3.5 group shrink-0"
        >
          <span className="relative z-10 inline-flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4" aria-hidden>
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span className="hidden sm:inline">Yeni Oda</span>
          </span>
          <span aria-hidden className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[900ms] ease-out bg-gradient-to-r from-transparent via-white/25 to-transparent" />
        </button>
      </header>

      {loading ? (
        <Loading />
      ) : rooms.length === 0 ? (
        <Empty onCreate={() => setCreateOpen(true)} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {rooms.map((r) => (
            <RoomCard key={r.id} room={r} onJoin={() => joinRoom(r.id)} />
          ))}
        </div>
      )}

      <CreateRoomModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        ownerId={me.id}
      />
    </div>
  );
}

function RoomCard({ room, onJoin }: { room: RoomWithMeta; onJoin: () => void }) {
  const fillPct = Math.min(100, Math.round((room.member_count / room.max_members) * 100));
  const initials = initialsOf(room.name) || "#";

  return (
    <article className="glass p-4 flex flex-col gap-3 transition hover:-translate-y-0.5 hover:shadow-lift hover:border-border-strong">
      <div className="flex items-start gap-3">
        <div
          aria-hidden
          className="w-11 h-11 rounded-xl grid place-items-center text-white font-semibold text-base shrink-0 bg-gradient-to-br from-accent to-accent-glow shadow-glow-soft"
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold tracking-tight truncate">{room.name}</h3>
          {room.description ? (
            <p className="text-xs text-text-muted line-clamp-2 mt-0.5 leading-relaxed">
              {room.description}
            </p>
          ) : (
            <p className="text-xs text-text-dim mt-0.5">Açıklama yok</p>
          )}
        </div>
        <PrivacyChip isPrivate={room.is_private} />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-text-dim tabular-nums">
          <span className="inline-flex items-center gap-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" aria-hidden>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
            {room.member_count} / {room.max_members}
          </span>
          <span>{fillPct}%</span>
        </div>
        <div className="h-1 rounded-full bg-bg-inset overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-accent-glow transition-all"
            style={{ width: `${fillPct}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-end pt-1">
        {room.is_member ? (
          <Link href={`/rooms/${room.id}`} className="btn-primary !py-1.5 !px-3 text-sm group">
            <span className="inline-flex items-center gap-1">
              Aç
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </span>
          </Link>
        ) : !room.is_private ? (
          <button onClick={onJoin} className="btn-ghost !py-1.5 !px-3 text-sm">
            Katıl
          </button>
        ) : (
          <span className="text-xs text-text-dim">Davet gerekli</span>
        )}
      </div>
    </article>
  );
}

function PrivacyChip({ isPrivate }: { isPrivate: boolean }) {
  return (
    <span
      className={cn(
        "chip shrink-0",
        isPrivate
          ? "bg-warn/10 border-warn/30 text-warn"
          : "bg-success-soft border-success/30 text-success",
      )}
    >
      {isPrivate ? (
        <>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3" aria-hidden>
            <rect x="4" y="11" width="16" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          Özel
        </>
      ) : (
        <>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3" aria-hidden>
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          Açık
        </>
      )}
    </span>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-text-muted text-sm">
      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v3a5 5 0 0 0-5 5H4z" />
      </svg>
      Yükleniyor…
    </div>
  );
}

function Empty({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="glass p-10 text-center space-y-3 animate-fade-in">
      <div className="mx-auto w-12 h-12 rounded-2xl grid place-items-center bg-accent-soft border border-accent/20 text-accent-glow">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6" aria-hidden>
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />
        </svg>
      </div>
      <div className="font-semibold tracking-tight">Henüz oda yok</div>
      <p className="text-sm text-text-muted max-w-xs mx-auto leading-relaxed">
        İlk odayı sen oluştur — açık ya da özel, kapasiteyi sen belirle.
      </p>
      <button onClick={onCreate} className="btn-primary !py-1.5 !px-3.5 text-sm mt-1">
        + Yeni Oda
      </button>
    </div>
  );
}
