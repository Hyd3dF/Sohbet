"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/Avatar";
import { trackActivity } from "@/lib/activity";
import { cn, randomFileName } from "@/lib/utils";
import type { Profile } from "@/lib/types/db";

interface Props {
  me: Profile;
  onLocalAppend?: (post: {
    id: string;
    author_id: string;
    content: string;
    image_url: string | null;
    created_at: string;
  }) => void;
}

const MAX = 4000;

export function PostComposer({ me, onLocalAppend }: Props) {
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const name = me.display_name || me.username;
  const expanded = focused || content.length > 0 || !!preview;
  const canPost = !loading && (content.trim().length > 0 || !!file);
  const remaining = MAX - content.length;
  const nearLimit = remaining < 200;

  function pickFile(f: File | null) {
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function submit() {
    if (!content.trim() && !file) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();

    try {
      let imageUrl: string | null = null;
      if (file) {
        const path = `${me.id}/${randomFileName(file.name)}`;
        const { error: upErr } = await supabase.storage
          .from("post-images")
          .upload(path, file, { contentType: file.type });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("post-images").getPublicUrl(path);
        imageUrl = data.publicUrl;
      }

      const { data: inserted, error: insErr } = await supabase
        .from("posts")
        .insert({ author_id: me.id, content: content.trim() || "", image_url: imageUrl })
        .select("*")
        .single();
      if (insErr) throw insErr;
      if (inserted && onLocalAppend) onLocalAppend(inserted);

      trackActivity(me.id);
      setContent("");
      pickFile(null);
      setFocused(false);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Paylaşılamadı");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className={cn(
        "rounded-2xl border bg-bg-card/70",
        expanded ? "border-border" : "border-border/60",
      )}
    >
      {!expanded ? (
        <button
          type="button"
          onClick={() => setFocused(true)}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
        >
          <Avatar url={me.avatar_url} name={name} size={38} />
          <span className="flex-1 text-[14.5px] text-text-dim">Aklında ne var?</span>
          <span className="hidden sm:inline-flex rounded-lg border border-border bg-bg-inset/60 px-3 py-1.5 text-xs font-semibold text-text-muted">
            Paylaş
          </span>
        </button>
      ) : (
        <div className="p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar
                url={me.avatar_url}
                name={name}
                size={44}
                className="ring-2 ring-bg-inset/90"
              />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-text">{name}</div>
                <div className="text-xs text-text-dim">@{me.username}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setFocused(false);
                if (!content && !preview) setError(null);
              }}
              className="icon-btn !h-8 !w-8 !rounded-lg"
              aria-label="Paylaşım alanını kapat"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" className="h-4 w-4" aria-hidden>
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-bg-inset/65 transition focus-within:border-accent/45 focus-within:shadow-ring-focus">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setFocused(true)}
              placeholder="Bugün neler oluyor?"
              maxLength={MAX}
              rows={4}
              className="min-h-[124px] w-full resize-none bg-transparent px-4 py-3 text-[15px] leading-relaxed text-text outline-none placeholder:text-text-dim"
            />

            {preview && (
              <div className="relative mx-3 mb-3 overflow-hidden rounded-xl border border-border bg-bg-inset group/img animate-fade-in">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="" className="max-h-[420px] w-full object-cover" />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-0 transition group-hover/img:opacity-100" />
                <button
                  type="button"
                  onClick={() => {
                    pickFile(null);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                  aria-label="Fotoğrafı kaldır"
                  className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/65 text-white backdrop-blur transition hover:bg-black/85"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4" aria-hidden>
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {error && (
            <div role="alert" className="mt-3 rounded-xl border border-danger/30 bg-danger-soft px-3.5 py-3 text-sm text-danger animate-fade-in">
              {error}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-border-soft pt-3">
            <div className="flex min-w-0 items-center gap-2">
              <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-border bg-bg-inset px-3 text-sm font-medium text-text-muted transition hover:border-accent/40 hover:bg-accent-soft hover:text-accent-glow">
                <ImageIcon />
                <span>{preview ? "Değiştir" : "Fotoğraf ekle"}</span>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                />
              </label>
              {(content.length > 0 || nearLimit) && (
                <span
                  className={cn(
                    "text-xs tabular-nums",
                    nearLimit ? "text-warn" : "text-text-dim",
                  )}
                >
                  {remaining}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={submit}
              disabled={!canPost}
              className="btn-primary !h-9 !px-5 text-sm"
            >
              {loading ? (
                <>
                  <Spinner /> Paylaşılıyor...
                </>
              ) : (
                "Paylaş"
              )}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function ImageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v3a5 5 0 0 0-5 5H4z" />
    </svg>
  );
}
