"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/Avatar";
import { timeAgo } from "@/lib/utils";
import type { PostComment, Profile } from "@/lib/types/db";

interface CommentRow extends PostComment {
  author?: Pick<Profile, "id" | "username" | "display_name" | "avatar_url">;
}

interface Props {
  postId: string;
  me: Profile;
}

export function CommentSection({ postId, me }: Props) {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("post_comments")
        .select("*, author:profiles!post_comments_author_id_fkey(id,username,display_name,avatar_url)")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (!cancelled) {
        setComments((data as CommentRow[]) ?? []);
        setLoading(false);
      }
    })();

    const channel = supabase
      .channel(`comments:${postId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "post_comments", filter: `post_id=eq.${postId}` },
        async (payload) => {
          const c = payload.new as PostComment;
          const { data: author } = await supabase
            .from("profiles")
            .select("id,username,display_name,avatar_url")
            .eq("id", c.author_id)
            .single();
          setComments((prev) =>
            prev.find((x) => x.id === c.id) ? prev : [...prev, { ...c, author: author ?? undefined }],
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "post_comments", filter: `post_id=eq.${postId}` },
        (payload) => {
          setComments((prev) => prev.filter((x) => x.id !== (payload.old as PostComment).id));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [postId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    const supabase = createClient();
    const content = text.trim();
    setText("");
    await supabase.from("post_comments").insert({
      post_id: postId,
      author_id: me.id,
      content,
    });
  }

  async function remove(id: string) {
    const supabase = createClient();
    await supabase.from("post_comments").delete().eq("id", id);
  }

  return (
    <div className="space-y-3">
      {loading ? (
        <div className="text-xs text-text-dim py-1">Yorumlar yükleniyor…</div>
      ) : comments.length === 0 ? (
        <div className="text-xs text-text-dim py-1">Henüz yorum yok. İlk yorumu sen yaz.</div>
      ) : (
        comments.map((c) => (
          <div key={c.id} className="flex gap-2.5 group/c animate-fade-in">
            <Avatar
              url={c.author?.avatar_url}
              name={c.author?.display_name || c.author?.username || "?"}
              size={28}
              className="ring-1 ring-border/60 mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <div className="bg-bg-soft border border-border-soft rounded-2xl rounded-tl-sm px-3 py-2">
                <div className="text-xs font-medium text-text-muted mb-0.5">
                  {c.author?.display_name || c.author?.username}
                </div>
                <div className="text-sm break-words whitespace-pre-wrap leading-relaxed">
                  {c.content}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1 px-1 text-xs text-text-dim">
                <span className="tabular-nums">{timeAgo(c.created_at)}</span>
                {c.author_id === me.id && (
                  <button
                    onClick={() => remove(c.id)}
                    className="hover:text-danger opacity-0 group-hover/c:opacity-100 transition focus:opacity-100"
                  >
                    Sil
                  </button>
                )}
              </div>
            </div>
          </div>
        ))
      )}

      <form onSubmit={submit} className="flex gap-2.5 pt-1">
        <Avatar
          url={me.avatar_url}
          name={me.display_name || me.username}
          size={28}
          className="ring-1 ring-border/60 mt-1"
        />
        <div className="flex-1 flex items-center gap-1 bg-bg-soft border border-border rounded-full pl-3 pr-1 py-1 transition focus-within:border-accent/50 focus-within:shadow-ring-focus">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Yorum yaz…"
            maxLength={1000}
            className="flex-1 bg-transparent border-0 outline-none text-sm placeholder:text-text-dim"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            aria-label="Yorum gönder"
            className="w-7 h-7 grid place-items-center rounded-full bg-gradient-to-br from-accent-glow to-accent text-white shadow-glow-soft disabled:opacity-40 disabled:shadow-none transition hover:shadow-glow active:scale-95"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" aria-hidden>
              <path d="M22 2 11 13" />
              <path d="M22 2 15 22l-4-9-9-4z" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
