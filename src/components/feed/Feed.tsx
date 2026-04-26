"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PostComposer } from "@/components/feed/PostComposer";
import { PostCard, type PostWithMeta } from "@/components/feed/PostCard";
import type { Post, Profile } from "@/lib/types/db";

interface Props {
  me: Profile;
}

export function Feed({ me }: Props) {
  const [posts, setPosts] = useState<PostWithMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function loadAll() {
      try {
        const { data: postsData } = await supabase
          .from("posts")
          .select(
            "*, author:profiles!posts_author_id_fkey(id,username,display_name,avatar_url)",
          )
          .order("created_at", { ascending: false })
          .limit(50);
        if (cancelled) return;

        const ids = postsData?.map((p) => p.id) ?? [];

        let likes: { post_id: string }[] = [];
        let myLikes: { post_id: string }[] = [];
        let comments: { post_id: string }[] = [];

        if (ids.length > 0) {
          const [l, ml, c] = await Promise.all([
            supabase.from("post_likes").select("post_id").in("post_id", ids),
            supabase.from("post_likes").select("post_id").eq("user_id", me.id).in("post_id", ids),
            supabase.from("post_comments").select("post_id").in("post_id", ids),
          ]);
          likes = l.data ?? [];
          myLikes = ml.data ?? [];
          comments = c.data ?? [];
        }

        const likeCounts = new Map<string, number>();
        likes.forEach((l) => likeCounts.set(l.post_id, (likeCounts.get(l.post_id) ?? 0) + 1));
        const myLikeSet = new Set(myLikes.map((l) => l.post_id));
        const commentCounts = new Map<string, number>();
        comments.forEach((c) =>
          commentCounts.set(c.post_id, (commentCounts.get(c.post_id) ?? 0) + 1),
        );

        const enriched: PostWithMeta[] = (postsData ?? []).map((p) => ({
          ...(p as unknown as Post),
          author: (p as unknown as PostWithMeta).author,
          like_count: likeCounts.get(p.id) ?? 0,
          comment_count: commentCounts.get(p.id) ?? 0,
          liked_by_me: myLikeSet.has(p.id),
        }));
        if (!cancelled) setPosts(enriched);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAll();

    const channel = supabase
      .channel("feed:posts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        async (payload) => {
          const p = payload.new as Post;
          const { data: author } = await supabase
            .from("profiles")
            .select("id,username,display_name,avatar_url")
            .eq("id", p.author_id)
            .single();
          if (!author) return;
          setPosts((prev) =>
            prev.find((x) => x.id === p.id)
              ? prev
              : [
                  {
                    ...p,
                    author,
                    like_count: 0,
                    comment_count: 0,
                    liked_by_me: false,
                  },
                  ...prev,
                ],
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "posts" },
        (payload) => {
          setPosts((prev) => prev.filter((x) => x.id !== (payload.old as Post).id));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [me.id]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <PostComposer me={me} />
      {loading ? (
        <FeedLoading />
      ) : posts.length === 0 ? (
        <EmptyFeed />
      ) : (
        posts.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            me={me}
            onDelete={(id) => setPosts((prev) => prev.filter((x) => x.id !== id))}
          />
        ))
      )}
    </div>
  );
}

function FeedLoading() {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-text-muted text-sm">
      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v3a5 5 0 0 0-5 5H4z" />
      </svg>
      Yükleniyor…
    </div>
  );
}

function EmptyFeed() {
  return (
    <div className="glass p-10 text-center space-y-3 animate-fade-in">
      <div className="mx-auto w-12 h-12 rounded-2xl grid place-items-center bg-accent-soft border border-accent/20 text-accent-glow">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6" aria-hidden>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
        </svg>
      </div>
      <div className="font-semibold tracking-tight">Akış henüz boş</div>
      <p className="text-sm text-text-muted max-w-xs mx-auto leading-relaxed">
        İlk gönderiyi sen paylaş — fotoğraf veya bir kaç satır metin. Arkadaşların anlık görür.
      </p>
    </div>
  );
}
