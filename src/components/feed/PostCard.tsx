"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/Avatar";
import { LikeButton } from "@/components/feed/LikeButton";
import { CommentSection } from "@/components/feed/CommentSection";
import { cn, timeAgo } from "@/lib/utils";
import type { Post, Profile } from "@/lib/types/db";

export interface PostWithMeta extends Post {
  author: Pick<Profile, "id" | "username" | "display_name" | "avatar_url">;
  like_count: number;
  comment_count: number;
  liked_by_me: boolean;
}

interface Props {
  post: PostWithMeta;
  me: Profile;
  onDelete?: (id: string) => void;
}

export function PostCard({ post, me, onDelete }: Props) {
  const [showComments, setShowComments] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isMine = post.author_id === me.id;

  async function deletePost() {
    setMenuOpen(false);
    if (!confirm("Bu gönderiyi silmek istediğine emin misin?")) return;
    const supabase = createClient();
    await supabase.from("posts").delete().eq("id", post.id);
    onDelete?.(post.id);
  }

  return (
    <article className="glass p-5 space-y-3 animate-fade-in transition hover:border-border-strong">
      <header className="flex items-start justify-between gap-3">
        <Link href={`/profile/${post.author.id}`} className="flex items-center gap-3 group min-w-0">
          <Avatar
            url={post.author.avatar_url}
            name={post.author.display_name || post.author.username}
            className="ring-1 ring-border/60 transition group-hover:ring-accent/60"
          />
          <div className="min-w-0">
            <div className="font-semibold text-[15px] tracking-tight truncate group-hover:text-accent-glow transition">
              {post.author.display_name || post.author.username}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-text-dim">
              <span>@{post.author.username}</span>
              <span aria-hidden>·</span>
              <span className="tabular-nums">{timeAgo(post.created_at)}</span>
            </div>
          </div>
        </Link>

        {isMine && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Gönderi menüsü"
              aria-expanded={menuOpen}
              className="icon-btn !w-8 !h-8"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden>
                <circle cx="5" cy="12" r="1.6" />
                <circle cx="12" cy="12" r="1.6" />
                <circle cx="19" cy="12" r="1.6" />
              </svg>
            </button>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                  aria-hidden
                />
                <div className="absolute right-0 top-full mt-1 z-20 min-w-[10rem] glass-flat shadow-lift p-1 animate-fade-in">
                  <button
                    onClick={deletePost}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-sm text-danger rounded-lg hover:bg-danger-soft transition"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden>
                      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                      <path d="M10 11v6M14 11v6" />
                    </svg>
                    Sil
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </header>

      {post.content && (
        <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-text">
          {post.content}
        </p>
      )}

      {post.image_url && (
        <div className="rounded-xl overflow-hidden border border-border bg-bg-inset">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.image_url}
            alt=""
            loading="lazy"
            className="w-full max-h-[600px] object-cover"
          />
        </div>
      )}

      <div className="flex items-center gap-1 pt-1 -mx-1.5">
        <span className="px-1.5">
          <LikeButton
            postId={post.id}
            userId={me.id}
            initialCount={post.like_count}
            initialLiked={post.liked_by_me}
          />
        </span>
        <button
          onClick={() => setShowComments((v) => !v)}
          aria-expanded={showComments}
          className={cn(
            "inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm font-medium transition",
            showComments
              ? "text-text bg-bg-soft"
              : "text-text-muted hover:text-text hover:bg-bg-soft",
          )}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]" aria-hidden>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="tabular-nums">{post.comment_count}</span>
        </button>
      </div>

      {showComments && (
        <div className="pt-3 border-t border-border-soft">
          <CommentSection postId={post.id} me={me} />
        </div>
      )}
    </article>
  );
}
