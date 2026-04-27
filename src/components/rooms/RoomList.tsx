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

const ROOM_COLORS = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-orange-500 to-red-500",
  "from-pink-500 to-rose-500",
  "from-amber-500 to-yellow-500",
];

function getRoomColor(id: string) {
  const hash = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return ROOM_COLORS[hash % ROOM_COLORS.length];
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

    return () => { cancelled = true; };
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

  const myRooms = rooms.filter((r) => r.is_member);
  const otherRooms = rooms.filter((r) => !r.is_member);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Header */}
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Odalar</h1>
          <p className="text-text-muted text-sm mt-1">
            Sohbet odaları kur, arkadaşlarınla bağlantıda kal.
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="btn-primary !py-2 !px-4 shrink-0 group"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="w-4 h-4 transition-transform group-hover:rotate-90 duration-200" aria-hidden>
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span className="hidden sm:inline">Yeni Oda</span>
        </button>
      </header>

      {loading ? (
        <LoadingGrid />
      ) : rooms.length === 0 ? (
        <Empty onCreate={() => setCreateOpen(true)} />
      ) : (
        <div className="space-y-8">
          {myRooms.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-text-dim uppercase tracking-widest mb-3 px-1">
                Odalarım · {myRooms.length}
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {myRooms.map((r) => (
                  <RoomCard key={r.id} room={r} onJoin={() => joinRoom(r.id)} />
                ))}
              </div>
            </section>
          )}

          {otherRooms.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-text-dim uppercase tracking-widest mb-3 px-1">
                Keşfet · {otherRooms.length}
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {otherRooms.map((r) => (
                  <RoomCard key={r.id} room={r} onJoin={() => joinRoom(r.id)} />
                ))}
              </div>
            </section>
          )}
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
  const colorClass = getRoomColor(room.id);
  const isFull = room.member_count >= room.max_members;

  return (
    <article className="glass group flex flex-col gap-4 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift hover:border-border-strong animate-fade-in">
      {/* Room header */}
      <div className="flex items-start gap-3">
        <div
          aria-hidden
          className={cn(
            "w-12 h-12 rounded-2xl grid place-items-center text-white font-bold text-base shrink-0 shadow-soft transition-transform group-hover:scale-105 duration-200 bg-gradient-to-br",
            colorClass,
          )}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold tracking-tight truncate leading-snug">{room.name}</h3>
            <PrivacyChip isPrivate={room.is_private} />
          </div>
          {room.description ? (
            <p className="text-xs text-text-muted line-clamp-2 mt-1 leading-relaxed">
              {room.description}
            </p>
          ) : (
            <p className="text-xs text-text-dim mt-1 italic">Açıklama yok</p>
          )}
        </div>
      </div>

      {/* Member progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-text-dim">
          <span className="inline-flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" aria-hidden>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span className="tabular-nums font-medium">{room.member_count}</span>
            <span className="opacity-50">/ {room.max_members}</span>
          </span>
          <span className={cn("font-semibold tabular-nums", fillPct >= 90 ? "text-warn" : "text-text-dim")}>
            {fillPct}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-bg-inset overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500 bg-gradient-to-r",
              fillPct >= 90 ? "from-warn to-orange-400" : colorClass,
            )}
            style={{ width: `${fillPct}%` }}
          />
        </div>
      </div>

      {/* Action */}
      <div className="flex items-center justify-end pt-1 border-t border-border-soft">
        {room.is_member ? (
          <Link href={`/rooms/${room.id}`} className="btn-primary !py-1.5 !px-4 text-sm group/btn">
            <span className="inline-flex items-center gap-1.5">
              Gir
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" aria-hidden>
                <path d="m9 18 6-6-6-6" />
              </svg>
            </span>
          </Link>
        ) : isFull ? (
          <span className="text-xs text-text-dim font-medium">Oda dolu</span>
        ) : !room.is_private ? (
          <button onClick={onJoin} className="btn-ghost !py-1.5 !px-4 text-sm">
            Katıl
          </button>
        ) : (
          <span className="text-xs text-warn font-medium inline-flex items-center gap-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" aria-hidden>
              <rect x="4" y="11" width="16" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            Davet gerekli
          </span>
        )}
      </div>
    </article>
  );
}

function PrivacyChip({ isPrivate }: { isPrivate: boolean }) {
  return (
    <span className={cn("chip shrink-0", isPrivate ? "chip-warn" : "chip-success")}>
      {isPrivate ? "Özel" : "Açık"}
    </span>
  );
}

function LoadingGrid() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="glass p-4 space-y-4 animate-pulse">
          <div className="flex items-start gap-3">
            <div className="skeleton w-12 h-12 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-3/4 rounded" />
              <div className="skeleton h-3 w-full rounded" />
            </div>
          </div>
          <div className="skeleton h-1.5 w-full rounded-full" />
          <div className="flex justify-end">
            <div className="skeleton h-8 w-20 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Empty({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="glass p-12 text-center space-y-4 animate-fade-in">
      <div className="mx-auto w-14 h-14 rounded-2xl grid place-items-center bg-accent-soft border border-accent/20 text-accent-glow">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7" aria-hidden>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <div>
        <div className="font-bold text-lg tracking-tight">Henüz oda yok</div>
        <p className="text-sm text-text-muted mt-2 max-w-xs mx-auto leading-relaxed">
          İlk odayı sen oluştur — açık ya da özel, kapasiteyi sen belirle.
        </p>
      </div>
      <button onClick={onCreate} className="btn-primary !py-2 !px-5">
        + Yeni Oda Oluştur
      </button>
    </div>
  );
}
