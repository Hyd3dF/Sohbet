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
    <article className="rounded-2xl border border-border/60 bg-bg-card/70 p-4 sm:p-5 space-y-3.5">
      {/* Header */}
      <header className="flex items-start justify-between gap-3">
        <Link href={`/profile/${post.author.id}`} className="flex items-center gap-3 min-w-0">
          <Avatar
            url={post.author.avatar_url}
            name={post.author.display_name || post.author.username}
            size={38}
            className="shrink-0"
          />
          <div className="min-w-0">
            <div className="font-semibold text-[14.5px] tracking-tight truncate leading-tight">
              {post.author.display_name || post.author.username}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-text-dim mt-0.5">
              <span>@{post.author.username}</span>
              <span aria-hidden>·</span>
              <time className="tabular-nums">{timeAgo(post.created_at)}</time>
            </div>
          </div>
        </Link>

        {isMine && (
          <div className="relative shrink-0">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Gönderi menüsü"
              aria-expanded={menuOpen}
              className="icon-btn !w-8 !h-8 !rounded-lg"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-text-dim" aria-hidden>
                <circle cx="5" cy="12" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="19" cy="12" r="1.5" />
              </svg>
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden />
                <div className="absolute right-0 top-full mt-1 z-20 min-w-[8.5rem] rounded-xl border border-border bg-bg-card p-1">
                  <button
                    onClick={deletePost}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger rounded-lg hover:bg-danger-soft"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden>
                      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                    </svg>
                    Sil
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </header>

      {/* Content */}
      {post.content && (
        <p className="whitespace-pre-wrap break-words text-[14.5px] leading-relaxed text-text">
          {post.content}
        </p>
      )}

      {/* Image */}
      {post.image_url && (
        <div className="overflow-hidden rounded-xl border border-border/50 bg-bg-inset">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.image_url}
            alt=""
            loading="lazy"
            className="w-full max-h-[520px] object-cover"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 pt-2 border-t border-border-soft/70">
        <LikeButton
          postId={post.id}
          userId={me.id}
          initialCount={post.like_count}
          initialLiked={post.liked_by_me}
        />
        <button
          onClick={() => setShowComments((v) => !v)}
          aria-expanded={showComments}
          className={cn(
            "inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm font-medium",
            showComments ? "text-text bg-bg-soft" : "text-text-muted hover:text-text hover:bg-bg-soft",
          )}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="tabular-nums">{post.comment_count}</span>
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="pt-3 border-t border-border-soft/70">
          <CommentSection postId={post.id} me={me} />
        </div>
      )}
    </article>
  );
}
