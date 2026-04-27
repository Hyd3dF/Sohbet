"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/Avatar";
import { ActivityHeatmap } from "@/components/profile/ActivityHeatmap";
import { ProfileBanner } from "@/components/profile/ProfileBanner";
import { cn, randomFileName } from "@/lib/utils";
import type { Profile } from "@/lib/types/db";

type SaveState = "idle" | "saving" | "saved";

const BIO_MAX = 280;

export function ProfileEditor({ profile }: { profile: Profile }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const initialName = profile.display_name ?? "";
  const initialBio = profile.bio ?? "";
  const [displayName, setDisplayName] = useState(initialName);
  const [bio, setBio] = useState(initialBio);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [save, setSave] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);

  const dirty = displayName !== initialName || bio !== initialBio;

  useEffect(() => {
    if (save !== "saved") return;
    const t = setTimeout(() => setSave("idle"), 2400);
    return () => clearTimeout(t);
  }, [save]);

  async function uploadAvatar(file: File) {
    setAvatarUploading(true);
    setError(null);
    const supabase = createClient();
    const path = `${profile.id}/${randomFileName(file.name)}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { contentType: file.type, upsert: true });
    if (upErr) {
      setError(upErr.message);
      setAvatarUploading(false);
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", profile.id);
    setAvatarUrl(data.publicUrl);
    setAvatarUploading(false);
    router.refresh();
  }

  async function handleSave() {
    if (!dirty) return;
    setSave("saving");
    setError(null);
    const supabase = createClient();
    const { error: e } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
      })
      .eq("id", profile.id);
    if (e) {
      setError(e.message);
      setSave("idle");
      return;
    }
    setSave("saved");
    router.refresh();
  }

  function pickFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) uploadAvatar(f);
    if (fileRef.current) fileRef.current.value = "";
  }

  const displayedName = displayName.trim() || profile.username;
  const bioRemaining = BIO_MAX - bio.length;
  const bioNearLimit = bioRemaining < 40;

  return (
    <main className="pb-16 md:pb-8">
      {/* Banner with heatmap */}
      <ProfileBanner userId={profile.id} />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 -mt-14 pb-12 relative space-y-8">
        <div className="flex items-end gap-4">
          <button
            type="button"
            onClick={() => !avatarUploading && fileRef.current?.click()}
            disabled={avatarUploading}
            aria-label="Profil fotoğrafını değiştir"
            className="relative group rounded-full focus:outline-none focus-visible:shadow-ring-focus"
          >
            <Avatar
              url={avatarUrl}
              name={displayedName}
              size={104}
              className="ring-4 ring-bg shadow-lift transition group-hover:brightness-90"
            />
            <span
              className={cn(
                "absolute inset-0 rounded-full bg-black/55 backdrop-blur-sm grid place-items-center text-white transition",
                avatarUploading
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100",
              )}
            >
              {avatarUploading ? (
                <Spinner large />
              ) : (
                <span className="inline-flex flex-col items-center gap-0.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden>
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  <span className="text-[10px] font-medium tracking-wide">Değiştir</span>
                </span>
              )}
            </span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={pickFile}
            />
          </button>

          <div className="pb-1 min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">
              {displayedName}
            </h1>
            <div className="text-sm text-text-dim">@{profile.username}</div>
          </div>
        </div>

        <section className="mt-8 space-y-5">
          <Field label="Görünen ad" hint={`${displayName.length} / 40`}>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value.slice(0, 40))}
              placeholder={profile.username}
              autoComplete="name"
              className="input-base"
            />
          </Field>

          <Field
            label="Bio"
            hint={
              <span className={cn("tabular-nums", bioNearLimit ? "text-warn" : "text-text-dim")}>
                {bioRemaining}
              </span>
            }
          >
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
              placeholder="Kendinden kısaca bahset…"
              rows={3}
              className="input-base resize-none min-h-[88px] leading-relaxed"
            />
          </Field>

          {error && (
            <div role="alert" className="text-sm rounded-xl px-3.5 py-3 bg-danger-soft border border-danger/30 text-danger animate-fade-in">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="text-xs">
              {save === "saved" ? (
                <span className="inline-flex items-center gap-1.5 text-success animate-fade-in">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" aria-hidden>
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  Kaydedildi
                </span>
              ) : dirty ? (
                <span className="text-text-dim">Kaydedilmemiş değişiklikler.</span>
              ) : (
                <span className="text-text-faint">Tüm değişiklikler kayıtlı.</span>
              )}
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={!dirty || save === "saving"}
              className="relative overflow-hidden btn-primary !py-2 !px-4 group"
            >
              <span className="relative z-10 inline-flex items-center gap-1.5">
                {save === "saving" ? (
                  <>
                    <Spinner /> Kaydediliyor…
                  </>
                ) : (
                  "Kaydet"
                )}
              </span>
              <span aria-hidden className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[900ms] ease-out bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            </button>
          </div>
        </section>

        {/* Aktivite */}
        <section>
          <h2 className="text-xs font-semibold text-text-muted mb-3 tracking-widest uppercase">
            Aktivitem
          </h2>
          <ActivityHeatmap userId={profile.id} />
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-sm font-medium text-text">{label}</label>
        {hint && <span className="text-xs text-text-dim">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Spinner({ large = false }: { large?: boolean }) {
  return (
    <svg
      className={cn("animate-spin", large ? "w-5 h-5" : "w-4 h-4")}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8v3a5 5 0 0 0-5 5H4z"
      />
    </svg>
  );
}
