import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileEditor } from "@/components/profile/ProfileEditor";
import { ReadOnlyProfile } from "@/components/profile/ReadOnlyProfile";
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
