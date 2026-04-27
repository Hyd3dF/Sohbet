"use client";

import { useEffect, useId, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/Avatar";
import { OnlineDot } from "@/components/presence/OnlineDot";
import { cn } from "@/lib/utils";
import type { Profile, RoomMember, RoomRole } from "@/lib/types/db";

export interface MemberRow extends RoomMember {
  profile: Pick<Profile, "id" | "username" | "display_name" | "avatar_url">;
}

interface Props {
  roomId: string;
  meId: string;
  myRole: RoomRole | null;
  ownerId: string;
}

const ROLE_ORDER: Record<RoomRole, number> = { owner: 0, admin: 1, member: 2 };

export function MemberList({ roomId, meId, myRole, ownerId }: Props) {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const instanceId = useId();

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function load() {
      const { data } = await supabase
        .from("room_members")
        .select("*, profile:profiles(id,username,display_name,avatar_url)")
        .eq("room_id", roomId);
      if (!cancelled) setMembers((data as MemberRow[]) ?? []);
    }
    load();

    const channel = supabase
      .channel(`members:${roomId}:${instanceId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_members", filter: `room_id=eq.${roomId}` },
        () => load(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [roomId, instanceId]);

  const canManage = myRole === "owner" || myRole === "admin";

  async function changeRole(userId: string, role: RoomRole) {
    const supabase = createClient();
    const { error } = await supabase
      .from("room_members")
      .update({ role })
      .eq("room_id", roomId)
      .eq("user_id", userId);
    if (error) alert(error.message);
  }

  async function removeMember(userId: string) {
    if (!confirm("Bu üyeyi odadan çıkarmak istiyor musun?")) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("room_members")
      .delete()
      .eq("room_id", roomId)
      .eq("user_id", userId);
    if (error) alert(error.message);
  }

  const sorted = [...members].sort((a, b) => {
    const r = ROLE_ORDER[a.role] - ROLE_ORDER[b.role];
    if (r !== 0) return r;
    const an = a.profile?.display_name || a.profile?.username || "";
    const bn = b.profile?.display_name || b.profile?.username || "";
    return an.localeCompare(bn, "tr");
  });

  const grouped = {
    owner: sorted.filter((m) => m.role === "owner"),
    admin: sorted.filter((m) => m.role === "admin"),
    member: sorted.filter((m) => m.role === "member"),
  };

  return (
    <div className="space-y-3">
      {grouped.owner.length > 0 && (
        <MemberGroup label="Sahip" members={grouped.owner} meId={meId} ownerId={ownerId} canManage={canManage} myRole={myRole} onChangeRole={changeRole} onRemove={removeMember} />
      )}
      {grouped.admin.length > 0 && (
        <MemberGroup label="Yetkililer" members={grouped.admin} meId={meId} ownerId={ownerId} canManage={canManage} myRole={myRole} onChangeRole={changeRole} onRemove={removeMember} />
      )}
      {grouped.member.length > 0 && (
        <MemberGroup label="Üyeler" members={grouped.member} meId={meId} ownerId={ownerId} canManage={canManage} myRole={myRole} onChangeRole={changeRole} onRemove={removeMember} />
      )}
    </div>
  );
}

function MemberGroup({
  label, members, meId, ownerId, canManage, myRole, onChangeRole, onRemove,
}: {
  label: string;
  members: MemberRow[];
  meId: string;
  ownerId: string;
  canManage: boolean;
  myRole: RoomRole | null;
  onChangeRole: (userId: string, role: RoomRole) => void;
  onRemove: (userId: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 px-2 mb-1.5">
        <span className="text-2xs uppercase tracking-wider font-bold text-text-dim">{label}</span>
        <span className="text-2xs tabular-nums text-text-faint font-medium">{members.length}</span>
      </div>
      <div className="space-y-0.5">
        {members.map((m) => {
          const isOwner = m.user_id === ownerId;
          const isMe = m.user_id === meId;
          const canActOnThis =
            canManage && !isOwner && !isMe &&
            (myRole === "owner" || (myRole === "admin" && m.role !== "owner"));

          return (
            <div
              key={m.user_id}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-bg-hover/60 transition-colors group"
            >
              <div className="relative shrink-0">
                <Avatar
                  url={m.profile?.avatar_url}
                  name={m.profile?.display_name || m.profile?.username || "?"}
                  size={34}
                  className="ring-1 ring-border/40"
                />
                <span className="absolute -bottom-0.5 -right-0.5">
                  <OnlineDot userId={m.user_id} size="sm" className="ring-2 ring-bg" />
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold truncate leading-tight">
                    {m.profile?.display_name || m.profile?.username}
                  </span>
                  {isMe && (
                    <span className="text-2xs px-1.5 py-0.5 rounded bg-accent-soft text-accent-glow font-bold uppercase tracking-wider">
                      sen
                    </span>
                  )}
                </div>
                <RoleBadge role={m.role} />
              </div>

              {canActOnThis && (
                <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex items-center gap-0.5">
                  {m.role === "member" && (
                    <button
                      onClick={() => onChangeRole(m.user_id, "admin")}
                      title="Yetkili yap"
                      aria-label="Yetkili yap"
                      className="w-7 h-7 grid place-items-center rounded-lg text-text-muted hover:text-success hover:bg-success/10 transition-colors"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" aria-hidden>
                        <path d="m18 15-6-6-6 6" />
                      </svg>
                    </button>
                  )}
                  {m.role === "admin" && myRole === "owner" && (
                    <button
                      onClick={() => onChangeRole(m.user_id, "member")}
                      title="Üye yap"
                      aria-label="Üye yap"
                      className="w-7 h-7 grid place-items-center rounded-lg text-text-muted hover:text-text hover:bg-bg-soft transition-colors"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" aria-hidden>
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => onRemove(m.user_id)}
                    title="Odadan çıkar"
                    aria-label="Odadan çıkar"
                    className="w-7 h-7 grid place-items-center rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5" aria-hidden>
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: RoomRole }) {
  const map: Record<RoomRole, { label: string; cls: string; icon: React.ReactNode }> = {
    owner: {
      label: "Sahip",
      cls: "bg-warn/12 text-warn border-warn/25",
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5" aria-hidden>
          <path d="M3 7l4 5 5-7 5 7 4-5v10H3z" />
        </svg>
      ),
    },
    admin: {
      label: "Yetkili",
      cls: "bg-success/10 text-success border-success/25",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5" aria-hidden>
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ),
    },
    member: {
      label: "Üye",
      cls: "bg-bg-soft text-text-dim border-border/50",
      icon: null,
    },
  };
  const r = map[role];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded-md border text-[10px] font-semibold",
        r.cls,
      )}
    >
      {r.icon}
      {r.label}
    </span>
  );
}
