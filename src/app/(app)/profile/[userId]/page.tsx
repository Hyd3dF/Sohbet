import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/Avatar";
import { ProfileEditor } from "@/components/profile/ProfileEditor";
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

  if (user.id === userId) return <ProfileEditor profile={profile} />;
  return <ReadOnlyProfile profile={profile} />;
}

function ReadOnlyProfile({ profile }: { profile: Profile }) {
  const name = profile.display_name || profile.username;
  const memberSince = new Date(profile.created_at).toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "long",
  });

  return (
    <main>
      <ProfileBanner />
      <div className="max-w-2xl mx-auto px-4 -mt-14 pb-12 relative">
        <Avatar
          url={profile.avatar_url}
          name={name}
          size={104}
          className="ring-4 ring-bg shadow-lift"
        />
        <div className="mt-5 space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{name}</h1>
          <div className="text-sm text-text-dim">@{profile.username}</div>
        </div>
        {profile.bio && (
          <p className="mt-5 text-[15px] text-text-muted leading-relaxed whitespace-pre-wrap break-words">
            {profile.bio}
          </p>
        )}
        <div className="mt-6 inline-flex items-center gap-1.5 text-xs text-text-dim">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" aria-hidden>
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          <span>{memberSince}'dan beri üye</span>
        </div>
      </div>
    </main>
  );
}

function ProfileBanner() {
  return (
    <div className="relative h-40 sm:h-52 overflow-hidden border-b border-border">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/30 via-bg-card to-accent-glow/15" />
      <div aria-hidden className="absolute -top-24 -left-10 w-80 h-80 rounded-full bg-accent/30 blur-[90px]" />
      <div aria-hidden className="absolute -bottom-28 right-0 w-80 h-80 rounded-full bg-accent-glow/20 blur-[100px]" />
    </div>
  );
}
