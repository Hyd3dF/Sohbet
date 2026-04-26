import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/nav/TopBar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
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

  if (!profile) {
    return (
      <main className="min-h-screen grid place-items-center p-6">
        <div className="glass p-6 max-w-md text-center space-y-3">
          <h1 className="text-xl font-semibold">Profil hazırlanıyor</h1>
          <p className="text-text-muted text-sm">
            Hesabın oluşturuldu ama profil kaydın görünmüyor. Sayfayı yenile veya çıkış yapıp
            tekrar gir.
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar profile={profile} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
