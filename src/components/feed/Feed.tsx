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
    <div className="mx-auto max-w-2xl px-4 py-6 pb-24 md:pb-6">
      <PostComposer
        me={me}
        onLocalAppend={(p) => {
          setPosts((prev) =>
            prev.find((x) => x.id === p.id)
              ? prev
              : [
                  {
                    ...(p as unknown as Post),
                    author: {
                      id: me.id,
                      username: me.username,
                      display_name: me.display_name,
                      avatar_url: me.avatar_url,
                    },
                    like_count: 0,
                    comment_count: 0,
                    liked_by_me: false,
                  },
                  ...prev,
                ],
          );
        }}
      />

      <div className="mt-4 space-y-4">
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
    </div>
  );
}

function FeedLoading() {
  return (
    <div className="space-y-3">
      {[0, 1].map((item) => (
        <div key={item} className="rounded-2xl border border-border/70 bg-bg-card/70 p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="skeleton h-10 w-10 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="skeleton h-3 w-36" />
              <div className="skeleton h-2.5 w-24" />
            </div>
          </div>
          <div className="mt-5 space-y-2">
            <div className="skeleton h-3 w-11/12" />
            <div className="skeleton h-3 w-7/12" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyFeed() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-bg-card/75 p-10 text-center shadow-card animate-fade-in">
      <div aria-hidden className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-accent-glow/45 to-transparent" />
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-accent/20 bg-accent-soft text-accent-glow">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
        </svg>
      </div>
      <div className="mt-4 font-semibold tracking-tight">Akış henüz boş</div>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-text-muted">
        İlk gönderiyi sen paylaş. Fotoğraf ya da kısa bir düşünce akışı başlatmak için yeterli.
      </p>
    </div>
  );
}
