import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/Avatar";
import { ProfileEditor } from "@/components/profile/ProfileEditor";
import { ActivityHeatmap } from "@/components/profile/ActivityHeatmap";
import { OnlineDot } from "@/components/presence/OnlineDot";
import type { Profile } from "@/lib/types/db";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (!profileData) notFound();
  const profile = profileData as Profile;

  if (user.id === userId) {
    return <ProfileEditor profile={profile} />;
  }
  return <ReadOnlyProfile profile={profile} />;
}

function ReadOnlyProfile({ profile }: { profile: Profile }) {
  const name = profile.display_name || profile.username;
  const memberSince = new Date(profile.created_at).toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "long",
  });

  return (
    <main className="pb-16 md:pb-8">
      {/* Banner */}
      <div className="relative h-44 sm:h-56 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/40 via-bg-card to-accent-glow/20" />
        <div aria-hidden className="absolute -top-20 -left-10 w-72 h-72 rounded-full bg-accent/35 blur-[80px]" />
        <div aria-hidden className="absolute -bottom-20 right-10 w-72 h-72 rounded-full bg-accent-glow/25 blur-[90px]" />
        {/* Back button */}
        <Link
          href="/feed"
          className="absolute top-4 left-4 icon-btn bg-bg/40 backdrop-blur border border-white/10"
          aria-label="Geri"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden>
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Avatar row */}
        <div className="flex items-end justify-between -mt-14 mb-5">
          <div className="relative">
            <Avatar
              url={profile.avatar_url}
              name={name}
              size={96}
              className="ring-4 ring-bg shadow-lift"
            />
            <span className="absolute bottom-1 right-1">
              <OnlineDot userId={profile.id} size="lg" className="ring-2 ring-bg" />
            </span>
          </div>
        </div>

        {/* Name & username */}
        <div className="space-y-0.5 mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{name}</h1>
          <div className="text-sm text-text-dim">@{profile.username}</div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-[15px] text-text-muted leading-relaxed whitespace-pre-wrap break-words mb-5">
            {profile.bio}
          </p>
        )}

        {/* Member since */}
        <div className="inline-flex items-center gap-1.5 text-xs text-text-dim mb-8">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" aria-hidden>
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          <span>{memberSince}&apos;dan beri üye</span>
        </div>

        {/* Activity Heatmap */}
        <section>
          <h2 className="text-sm font-semibold text-text-muted mb-3 tracking-wide uppercase text-xs">
            Aktivite
          </h2>
          <ActivityHeatmap userId={profile.id} />
        </section>
      </div>
    </main>
  );
}
