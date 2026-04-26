"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/Avatar";
import { cn, randomFileName } from "@/lib/utils";
import type { Profile } from "@/lib/types/db";

interface Props {
  me: Profile;
}

const MAX = 4000;

export function PostComposer({ me }: Props) {
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
      const { error: insErr } = await supabase
        .from("posts")
        .insert({ author_id: me.id, content: content.trim() || "", image_url: imageUrl });
      if (insErr) throw insErr;
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

  const expanded = focused || content.length > 0 || !!preview;
  const canPost = !loading && (content.trim().length > 0 || !!file);
  const remaining = MAX - content.length;
  const nearLimit = remaining < 200;

  return (
    <div
      className={cn(
        "glass p-4 transition-all duration-200",
        expanded && "shadow-lift border-border-strong",
      )}
    >
      <div className="flex gap-3">
        <Avatar
          url={me.avatar_url}
          name={me.display_name || me.username}
          size={40}
          className="mt-1 ring-1 ring-border/60"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Aklında ne var?"
          maxLength={MAX}
          rows={expanded ? 4 : 1}
          className={cn(
            "flex-1 bg-transparent border-0 resize-none text-[15px] leading-relaxed",
            "placeholder:text-text-dim text-text outline-none focus:outline-none",
            "transition-all duration-200",
          )}
        />
      </div>

      {preview && (
        <div className="relative mt-3 rounded-xl overflow-hidden border border-border group/img animate-fade-in">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="" className="w-full max-h-96 object-cover" />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition" />
          <button
            type="button"
            onClick={() => pickFile(null)}
            aria-label="Fotoğrafı kaldır"
            className="absolute top-2 right-2 w-8 h-8 rounded-full grid place-items-center bg-black/60 hover:bg-black/80 backdrop-blur text-white transition"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4" aria-hidden>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {error && (
        <div role="alert" className="mt-3 text-sm rounded-lg px-3 py-2 bg-danger-soft border border-danger/30 text-danger animate-fade-in">
          {error}
        </div>
      )}

      <div
        className={cn(
          "flex items-center justify-between gap-3 transition-all duration-200 overflow-hidden",
          expanded ? "mt-3 max-h-16 opacity-100" : "max-h-0 opacity-0 mt-0",
        )}
      >
        <div className="flex items-center gap-1">
          <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-text-muted hover:text-accent-glow hover:bg-accent-soft cursor-pointer transition">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]" aria-hidden>
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="8.5" cy="9.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
            <span className="hidden sm:inline">Fotoğraf</span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        <div className="flex items-center gap-3">
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
          <button
            type="button"
            onClick={submit}
            disabled={!canPost}
            className="relative overflow-hidden btn-primary !py-1.5 !px-4 text-sm group"
          >
            <span className="relative z-10 inline-flex items-center gap-1.5">
              {loading ? "Paylaşılıyor..." : "Paylaş"}
            </span>
            <span aria-hidden className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[900ms] ease-out bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          </button>
        </div>
      </div>
    </div>
  );
}
