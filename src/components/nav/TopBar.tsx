"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types/db";

interface Props {
  profile: Profile;
}

const links = [
  {
    href: "/feed",
    label: "Akış",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden>
        <path d="M3 12h18M3 6h18M3 18h12" />
      </svg>
    ),
  },
  {
    href: "/rooms",
    label: "Odalar",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

export function TopBar({ profile }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-bg/65 backdrop-blur-xl supports-[backdrop-filter]:bg-bg/55">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 sm:gap-3 min-w-0">
          <Link
            href="/feed"
            className="group flex items-center gap-2 font-bold text-lg tracking-tight px-1 -mx-1 rounded-lg focus:outline-none focus-visible:shadow-ring-focus"
          >
            <span className="relative grid place-items-center w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-accent-glow text-white shadow-glow-soft">
              <span className="text-[13px] font-bold leading-none">S</span>
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-success ring-2 ring-bg" aria-hidden />
            </span>
            <span className="hidden sm:inline bg-gradient-to-r from-accent-glow to-accent bg-clip-text text-transparent">
              Sohbet
            </span>
          </Link>

          <nav className="flex items-center gap-1 ml-1 sm:ml-2" aria-label="Birincil">
            {links.map((l) => {
              const active = pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition",
                    "focus:outline-none focus-visible:shadow-ring-focus",
                    active
                      ? "bg-accent-soft text-accent-glow border border-accent/25 shadow-glow-soft"
                      : "text-text-muted border border-transparent hover:text-text hover:bg-bg-soft",
                  )}
                >
                  <span className={cn("transition", active ? "opacity-100" : "opacity-70")}>
                    {l.icon}
                  </span>
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            href={`/profile/${profile.id}`}
            className={cn(
              "group inline-flex items-center gap-2 pl-1 pr-3 py-1 rounded-full transition",
              "border border-border/70 bg-bg-soft/60 hover:bg-bg-hover hover:border-border-strong",
              "focus:outline-none focus-visible:shadow-ring-focus",
            )}
          >
            <Avatar
              url={profile.avatar_url}
              name={profile.display_name || profile.username}
              size={26}
              className="ring-1 ring-border/60"
            />
            <span className="text-sm font-medium hidden sm:inline max-w-[10rem] truncate">
              {profile.display_name || profile.username}
            </span>
          </Link>

          <button
            onClick={logout}
            title="Çıkış"
            aria-label="Çıkış yap"
            className="icon-btn"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]" aria-hidden>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="m16 17 5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
