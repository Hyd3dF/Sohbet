"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface Props {
  postId: string;
  userId: string;
  initialCount: number;
  initialLiked: boolean;
}

export function LikeButton({ postId, userId, initialCount, initialLiked }: Props) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(initialLiked);
  const [popKey, setPopKey] = useState(0);
  const [, startTransition] = useTransition();

  async function toggle() {
    const supabase = createClient();
    const newLiked = !liked;
    setLiked(newLiked);
    setCount((c) => c + (newLiked ? 1 : -1));
    if (newLiked) setPopKey((k) => k + 1);
    startTransition(async () => {
      if (newLiked) {
        await supabase.from("post_likes").insert({ post_id: postId, user_id: userId });
      } else {
        await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", userId);
      }
    });
  }

  return (
    <button
      onClick={toggle}
      aria-pressed={liked}
      aria-label={liked ? "Beğeniyi kaldır" : "Beğen"}
      className={cn(
        "group inline-flex items-center gap-1.5 text-sm font-medium transition",
        liked ? "text-accent-glow" : "text-text-muted hover:text-text",
      )}
    >
      <span key={popKey} className={cn("inline-flex", liked && "animate-pop")}>
        <svg
          viewBox="0 0 24 24"
          fill={liked ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-[18px] h-[18px] transition group-hover:scale-110"
          aria-hidden
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </span>
      <span className="tabular-nums">{count}</span>
    </button>
  );
}
