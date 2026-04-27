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
  { gradient: "from-violet-500 to-purple-600", bg: "bg-violet-500/10", ring: "ring-violet-500/20" },
  { gradient: "from-blue-500 to-cyan-500", bg: "bg-blue-500/10", ring: "ring-blue-500/20" },
  { gradient: "from-emerald-500 to-teal-500", bg: "bg-emerald-500/10", ring: "ring-emerald-500/20" },
  { gradient: "from-orange-500 to-red-500", bg: "bg-orange-500/10", ring: "ring-orange-500/20" },
  { gradient: "from-pink-500 to-rose-500", bg: "bg-pink-500/10", ring: "ring-pink-500/20" },
  { gradient: "from-amber-500 to-yellow-500", bg: "bg-amber-500/10", ring: "ring-amber-500/20" },
];

function getRoomColor(id: string) {
  const hash = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return ROOM_COLORS[hash % ROOM_COLORS.length];
}

export function RoomList({ me }: Props) {
  const [rooms, setRooms] = useState<RoomWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");

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

  const filtered = rooms.filter(
    (r) =>
      !search ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase()),
  );
  const myRooms = filtered.filter((r) => r.is_member);
  const otherRooms = filtered.filter((r) => !r.is_member);
  const totalMembers = rooms.reduce((s, r) => s + r.member_count, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-6 space-y-5">
      {/* Compact page header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-text">Odalar</h1>
            <p className="text-xs text-text-dim mt-0.5">Sohbet odaları kur, arkadaşlarınla bağlantıda kal.</p>
          </div>
          {!loading && rooms.length > 0 && (
            <div className="flex items-center gap-1.5 ml-1 flex-shrink-0">
              <StatChip label="oda" value={rooms.length} />
              <StatChip label="üye" value={totalMembers} />
            </div>
          )}
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="btn-primary !py-2 !px-4 shrink-0 text-sm shadow-glow-soft group"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3.5 h-3.5 transition-transform group-hover:rotate-90 duration-200" aria-hidden>
            <path d="M12 5v14M5 12h14" />
          </svg>
          Yeni Oda
        </button>
      </header>

      {/* Search bar */}
      {!loading && rooms.length > 0 && (
        <div className="relative">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim pointer-events-none" aria-hidden>
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Oda ara..."
            className="input-base !pl-10 !py-2.5 !rounded-xl !bg-bg-card/80 !text-sm"
          />
        </div>
      )}

      {loading ? (
        <LoadingGrid />
      ) : rooms.length === 0 ? (
        <Empty onCreate={() => setCreateOpen(true)} />
      ) : (
        <div className="space-y-8">
          {myRooms.length > 0 && (
            <section>
              <SectionHeader icon={<StarIcon />} title="Odalarım" count={myRooms.length} />
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myRooms.map((r) => (
                  <RoomCard key={r.id} room={r} onJoin={() => joinRoom(r.id)} />
                ))}
              </div>
            </section>
          )}

          {otherRooms.length > 0 && (
            <section>
              <SectionHeader icon={<CompassIcon />} title="Keşfet" count={otherRooms.length} />
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {otherRooms.map((r) => (
                  <RoomCard key={r.id} room={r} onJoin={() => joinRoom(r.id)} />
                ))}
              </div>
            </section>
          )}

          {filtered.length === 0 && search && (
            <div className="glass p-12 text-center animate-fade-in">
              <p className="text-text-muted text-sm">Aramayla eşleşen oda bulunamadı.</p>
            </div>
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

function StatChip({ label, value }: { label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent-soft border border-accent/20 text-2xs font-semibold text-accent-glow tabular-nums">
      <span>{value}</span>
      <span className="text-accent-glow/60 font-normal">{label}</span>
    </span>
  );
}

function SectionHeader({ icon, title, count }: { icon: React.ReactNode; title: string; count: number }) {
  return (
    <div className="flex items-center gap-2.5 mb-4 px-1">
      <span className="text-accent-glow">{icon}</span>
      <h2 className="text-sm font-bold text-text tracking-tight">{title}</h2>
      <span className="inline-flex items-center justify-center min-w-[1.375rem] h-[1.375rem] rounded-full bg-accent-soft text-accent-glow text-2xs font-bold tabular-nums px-1.5">
        {count}
      </span>
    </div>
  );
}

function RoomCard({ room, onJoin }: { room: RoomWithMeta; onJoin: () => void }) {
  const fillPct = Math.min(100, Math.round((room.member_count / room.max_members) * 100));
  const initials = initialsOf(room.name) || "#";
  const color = getRoomColor(room.id);
  const isFull = room.member_count >= room.max_members;

  return (
    <article
      className={cn(
        "relative group flex flex-col gap-4 p-5 rounded-2xl border transition-all duration-250 animate-fade-in",
        "bg-bg-card/70 backdrop-blur-sm border-border/60",
        "hover:border-border-strong hover:shadow-lift hover:-translate-y-1",
        room.is_member && "ring-1 ring-accent/10",
      )}
    >
      {room.is_member && (
        <div className="absolute top-3 right-3">
          <span className="flex h-2 w-2">
            <span className="animate-pulse-soft absolute inline-flex h-full w-full rounded-full bg-accent opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-glow" />
          </span>
        </div>
      )}

      <div className="flex items-start gap-3.5">
        <div
          aria-hidden
          className={cn(
            "w-13 h-13 rounded-2xl grid place-items-center text-white font-bold text-lg shrink-0 shadow-soft transition-all duration-300 group-hover:scale-105 group-hover:shadow-lift bg-gradient-to-br",
            color.gradient,
          )}
          style={{ width: "3.25rem", height: "3.25rem" }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <h3 className="font-bold tracking-tight truncate text-[15px] leading-snug">{room.name}</h3>
          {room.description ? (
            <p className="text-xs text-text-muted line-clamp-2 mt-1 leading-relaxed">
              {room.description}
            </p>
          ) : (
            <p className="text-xs text-text-dim mt-1 italic">Açıklama yok</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-text-dim">
        <span className="inline-flex items-center gap-1.5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" aria-hidden>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span className="tabular-nums font-semibold text-text-muted">{room.member_count}</span>
          <span className="opacity-50">/ {room.max_members}</span>
        </span>
        <PrivacyChip isPrivate={room.is_private} />
      </div>

      <div className="space-y-1.5">
        <div className="h-1.5 rounded-full bg-bg-inset overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r",
              fillPct >= 90 ? "from-warn to-orange-400" : color.gradient,
            )}
            style={{ width: `${fillPct}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-end pt-2 border-t border-border-soft/50">
        {room.is_member ? (
          <Link href={`/rooms/${room.id}`} className="btn-primary !py-2 !px-5 text-sm group/btn">
            <span className="inline-flex items-center gap-1.5">
              Gir
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" aria-hidden>
                <path d="m9 18 6-6-6-6" />
              </svg>
            </span>
          </Link>
        ) : isFull ? (
          <span className="text-xs text-text-dim font-medium px-3 py-1.5 rounded-lg bg-bg-inset">Oda dolu</span>
        ) : !room.is_private ? (
          <button onClick={onJoin} className="btn-ghost !py-2 !px-5 text-sm hover:!border-accent/30 hover:!text-accent-glow">
            Katıl
          </button>
        ) : (
          <span className="text-xs text-warn font-medium inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warn-soft">
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
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-2xs font-semibold",
      isPrivate
        ? "bg-warn/10 text-warn border border-warn/20"
        : "bg-success/10 text-success border border-success/20",
    )}>
      {isPrivate ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5" aria-hidden>
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5" aria-hidden>
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      )}
      {isPrivate ? "Özel" : "Açık"}
    </span>
  );
}

function LoadingGrid() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-bg-card/70 border border-border/40 rounded-2xl p-5 space-y-4 animate-pulse">
          <div className="flex items-start gap-3.5">
            <div className="skeleton w-[3.25rem] h-[3.25rem] rounded-2xl" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="skeleton h-4 w-3/4 rounded-lg" />
              <div className="skeleton h-3 w-full rounded-lg" />
            </div>
          </div>
          <div className="skeleton h-1.5 w-full rounded-full" />
          <div className="flex justify-end pt-2 border-t border-border-soft/30">
            <div className="skeleton h-9 w-20 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Empty({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent/10 via-bg-card to-bg-card border border-border/50 p-16 text-center animate-fade-in">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,92,255,0.06),transparent_70%)]" />
      <div className="relative space-y-5">
        <div className="mx-auto w-16 h-16 rounded-2xl grid place-items-center bg-gradient-to-br from-accent to-accent-glow text-white shadow-glow-soft">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8" aria-hidden>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <div>
          <div className="font-extrabold text-xl tracking-tight">Henüz oda yok</div>
          <p className="text-sm text-text-muted mt-2 max-w-xs mx-auto leading-relaxed">
            İlk odayı sen oluştur — açık ya da özel, kapasiteyi sen belirle.
          </p>
        </div>
        <button onClick={onCreate} className="btn-primary !py-2.5 !px-6 shadow-glow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-4 h-4" aria-hidden>
            <path d="M12 5v14M5 12h14" />
          </svg>
          Yeni Oda Oluştur
        </button>
      </div>
    </div>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01z" />
    </svg>
  );
}

function CompassIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" />
    </svg>
  );
}
