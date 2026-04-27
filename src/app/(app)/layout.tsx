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
        <div className="glass p-8 max-w-md text-center space-y-4 shadow-lift">
          <div className="w-12 h-12 rounded-2xl bg-accent-soft border border-accent/20 grid place-items-center mx-auto">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-accent-glow">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight">Profil hazırlanıyor</h1>
          <p className="text-text-muted text-sm leading-relaxed">
            Hesabın oluşturuldu ama profil kaydın görünmüyor. Sayfayı yenile veya çıkış yapıp tekrar gir.
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar profile={profile} />
      {/* pb-safe adds padding for mobile bottom nav */}
      <div className="flex-1 pb-safe md:pb-0">{children}</div>
    </div>
  );
}
