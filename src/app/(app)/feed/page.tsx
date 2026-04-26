import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Feed } from "@/components/feed/Feed";

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/login");

  return <Feed me={profile} />;
}
