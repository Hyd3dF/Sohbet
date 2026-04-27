"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { ActivityHeatmap } from "@/components/profile/ActivityHeatmap";
import { ProfileBanner } from "@/components/profile/ProfileBanner";
import { OnlineDot } from "@/components/presence/OnlineDot";
import type { Profile } from "@/lib/types/db";

export function ReadOnlyProfile({ profile }: { profile: Profile }) {
  const name = profile.display_name || profile.username;
  const memberSince = new Date(profile.created_at).toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "long",
  });

  return (
    <main className="pb-16 md:pb-8">
      {/* Banner with heatmap */}
      <div className="relative">
        <ProfileBanner userId={profile.id} />
        <Link
          href="/feed"
          className="absolute top-4 left-4 icon-btn bg-bg/40 backdrop-blur border border-white/10 z-10"
          aria-label="Geri"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden>
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between -mt-14 mb-5">
          <div className="relative">
            <Avatar url={profile.avatar_url} name={name} size={96} className="ring-4 ring-bg shadow-lift" />
            <span className="absolute bottom-1 right-1">
              <OnlineDot userId={profile.id} size="lg" className="ring-2 ring-bg" />
            </span>
          </div>
        </div>

        <div className="space-y-0.5 mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{name}</h1>
          <div className="text-sm text-text-dim">@{profile.username}</div>
        </div>

        {profile.bio && (
          <p className="text-[15px] text-text-muted leading-relaxed whitespace-pre-wrap break-words mb-5">
            {profile.bio}
          </p>
        )}

        <div className="inline-flex items-center gap-1.5 text-xs text-text-dim mb-8">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" aria-hidden>
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          <span>{memberSince}&apos;dan beri üye</span>
        </div>

        {/* Aktivite */}
        <section>
          <h2 className="text-xs font-semibold text-text-muted mb-3 tracking-widest uppercase">
            Aktivite
          </h2>
          <ActivityHeatmap userId={profile.id} />
        </section>
      </div>
    </main>
  );
}
