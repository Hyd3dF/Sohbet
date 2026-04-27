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

const navLinks = [
  {
    href: "/feed",
    label: "Akış",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: "/rooms",
    label: "Odalar",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
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
    <>
      {/* Desktop/Tablet TopBar */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-bg/70 backdrop-blur-2xl supports-[backdrop-filter]:bg-bg/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link
            href="/feed"
            className="group flex items-center gap-2.5 font-bold tracking-tight rounded-xl px-1 focus:outline-none focus-visible:shadow-ring-focus"
          >
            <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-accent-glow to-accent grid place-items-center shadow-glow-soft">
              <span className="text-white text-sm font-black leading-none">S</span>
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success ring-2 ring-bg animate-pulse-soft" aria-hidden />
            </div>
            <span className="hidden sm:inline text-lg bg-gradient-to-r from-text to-text-muted bg-clip-text text-transparent group-hover:from-accent-glow group-hover:to-accent transition-all duration-300">
              Sohbet
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Ana menü">
            {navLinks.map((l) => {
              const active = pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150",
                    "focus:outline-none focus-visible:shadow-ring-focus",
                    active
                      ? "bg-accent-soft text-accent-glow border border-accent/20"
                      : "text-text-muted hover:text-text hover:bg-bg-soft border border-transparent",
                  )}
                >
                  {l.icon(active)}
                  {l.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <Link
              href={`/profile/${profile.id}`}
              className={cn(
                "group inline-flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-2xl transition-all duration-150",
                "border border-border/60 bg-bg-soft/50 hover:bg-bg-hover hover:border-border-strong",
                "focus:outline-none focus-visible:shadow-ring-focus",
                pathname.startsWith("/profile") && "border-accent/20 bg-accent-soft/40",
              )}
            >
              <Avatar
                url={profile.avatar_url}
                name={profile.display_name || profile.username}
                size={28}
                className="ring-1 ring-white/10"
              />
              <span className="text-sm font-medium hidden sm:inline max-w-[8rem] truncate text-text">
                {profile.display_name || profile.username}
              </span>
            </Link>

            <button
              onClick={logout}
              title="Çıkış"
              aria-label="Çıkış yap"
              className="icon-btn text-text-dim hover:text-danger"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]" aria-hidden>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="bottom-nav" aria-label="Mobil menü">
        {navLinks.map((l) => {
          const active = pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "bottom-nav-item",
                active && "active",
              )}
            >
              <span className={cn(
                "transition-transform duration-150",
                active ? "scale-110" : "scale-100",
              )}>
                {l.icon(active)}
              </span>
              <span className={cn(
                "text-[10px] font-semibold tracking-wide",
                active ? "opacity-100" : "opacity-50",
              )}>
                {l.label}
              </span>
            </Link>
          );
        })}

        <Link
          href={`/profile/${profile.id}`}
          className={cn(
            "bottom-nav-item",
            pathname.startsWith("/profile") && "active",
          )}
        >
          <Avatar
            url={profile.avatar_url}
            name={profile.display_name || profile.username}
            size={26}
            className={cn(
              "ring-2 transition-all",
              pathname.startsWith("/profile") ? "ring-accent-glow" : "ring-border",
            )}
          />
          <span className={cn(
            "text-[10px] font-semibold tracking-wide",
            pathname.startsWith("/profile") ? "opacity-100 text-accent-glow" : "opacity-50",
          )}>
            Profil
          </span>
        </Link>
      </nav>
    </>
  );
}
