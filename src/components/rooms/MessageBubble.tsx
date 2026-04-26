"use client";

import { Avatar } from "@/components/ui/Avatar";
import { cn, timeAgo } from "@/lib/utils";
import type { Message, Profile, RoomRole } from "@/lib/types/db";

interface Props {
  message: Message & {
    author?: Pick<Profile, "id" | "username" | "display_name" | "avatar_url">;
  };
  meId: string;
  myRole: RoomRole | null;
  onDelete: (id: string) => void;
  grouped?: boolean;
}

export function MessageBubble({ message, meId, myRole, onDelete, grouped = false }: Props) {
  const isMine = message.author_id === meId;
  const canDelete = isMine || myRole === "owner" || myRole === "admin";
  const hasText = !!message.content;
  const att = message.attachment_type;

  return (
    <div
      className={cn(
        "group flex gap-2 px-3",
        isMine ? "flex-row-reverse" : "flex-row",
        grouped ? "mt-0.5" : "mt-3",
      )}
    >
      <div className="w-8 shrink-0">
        {!isMine && !grouped && (
          <Avatar
            url={message.author?.avatar_url}
            name={message.author?.display_name || message.author?.username || "?"}
            size={32}
            className="ring-1 ring-border/60"
          />
        )}
      </div>

      <div
        className={cn(
          "max-w-[75%] min-w-0 flex flex-col",
          isMine ? "items-end" : "items-start",
        )}
      >
        {!isMine && !grouped && (
          <div className="text-xs text-text-muted mb-1 px-1 font-medium">
            {message.author?.display_name || message.author?.username}
          </div>
        )}

        <div
          className={cn(
            "px-3.5 py-2 break-words text-[15px] leading-relaxed shadow-soft transition",
            isMine
              ? "bg-gradient-to-br from-accent-glow to-accent text-white"
              : "bg-bg-card border border-border text-text",
            // iOS-style asymmetric corners — softened on grouped messages
            isMine
              ? grouped
                ? "rounded-2xl rounded-r-md"
                : "rounded-2xl rounded-br-md"
              : grouped
                ? "rounded-2xl rounded-l-md"
                : "rounded-2xl rounded-bl-md",
            !hasText && att ? "p-1.5" : "",
          )}
        >
          {hasText && <div className="whitespace-pre-wrap">{message.content}</div>}
          {message.attachment_url && att === "image" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={message.attachment_url}
              alt=""
              loading="lazy"
              className={cn(
                "rounded-xl max-h-72 object-cover",
                hasText && "mt-2",
              )}
            />
          )}
          {message.attachment_url && att === "audio" && (
            <audio
              controls
              src={message.attachment_url}
              className={cn("max-w-full", hasText && "mt-2")}
            />
          )}
          {message.attachment_url && att === "file" && (
            <a
              href={message.attachment_url}
              target="_blank"
              rel="noreferrer"
              className={cn(
                "inline-flex items-center gap-1.5 underline underline-offset-2",
                hasText && "mt-2",
              )}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden>
                <path d="M21.44 11.05 12.25 20.24a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
              Dosya
            </a>
          )}
        </div>

        <div
          className={cn(
            "flex items-center gap-2 px-1 mt-1 text-2xs text-text-dim transition",
            isMine ? "flex-row-reverse" : "flex-row",
            grouped && "opacity-0 group-hover:opacity-100",
          )}
        >
          <span className="tabular-nums">{timeAgo(message.created_at)}</span>
          {canDelete && (
            <button
              onClick={() => onDelete(message.id)}
              className="opacity-0 group-hover:opacity-100 hover:text-danger focus:opacity-100 transition"
            >
              Sil
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
