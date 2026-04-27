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
        "group flex gap-2.5 px-3 sm:px-4",
        isMine ? "flex-row-reverse" : "flex-row",
        grouped ? "mt-0.5" : "mt-4",
      )}
    >
      {/* Avatar */}
      <div className="w-8 shrink-0 mt-auto">
        {!isMine && !grouped && (
          <Avatar
            url={message.author?.avatar_url}
            name={message.author?.display_name || message.author?.username || "?"}
            size={32}
            className="ring-1 ring-white/10"
          />
        )}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[78%] sm:max-w-[65%] min-w-0 flex flex-col gap-1",
          isMine ? "items-end" : "items-start",
        )}
      >
        {/* Author name */}
        {!isMine && !grouped && (
          <div className="text-xs text-text-muted px-1 font-semibold">
            {message.author?.display_name || message.author?.username}
          </div>
        )}

        {/* Bubble content */}
        <div
          className={cn(
            "px-3.5 py-2.5 break-words text-[14.5px] leading-relaxed max-w-full",
            isMine
              ? "bubble-mine text-white shadow-glow-soft"
              : "bg-bg-card border border-border text-text shadow-soft",
            // Corner radius
            isMine
              ? grouped
                ? "rounded-2xl rounded-tr-md"
                : "rounded-2xl rounded-tr-sm"
              : grouped
                ? "rounded-2xl rounded-tl-md"
                : "rounded-2xl rounded-tl-sm",
            !hasText && att ? "p-1.5" : "",
          )}
        >
          {hasText && (
            <span className="whitespace-pre-wrap">{message.content}</span>
          )}

          {message.attachment_url && att === "image" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={message.attachment_url}
              alt=""
              loading="lazy"
              className={cn("rounded-xl max-h-72 max-w-full object-cover", hasText && "mt-2")}
            />
          )}
          {message.attachment_url && att === "audio" && (
            <audio
              controls
              src={message.attachment_url}
              className={cn("max-w-full w-56", hasText && "mt-2")}
            />
          )}
          {message.attachment_url && att === "file" && (
            <a
              href={message.attachment_url}
              target="_blank"
              rel="noreferrer"
              className={cn(
                "inline-flex items-center gap-1.5 underline underline-offset-2 text-sm",
                hasText && "mt-2 block",
              )}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0" aria-hidden>
                <path d="M21.44 11.05 12.25 20.24a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
              Dosya
            </a>
          )}
        </div>

        {/* Time + delete */}
        <div
          className={cn(
            "flex items-center gap-2 px-1 text-2xs text-text-faint",
            isMine ? "flex-row-reverse" : "flex-row",
            grouped ? "opacity-0 group-hover:opacity-100 transition-opacity" : "opacity-70",
          )}
        >
          <time className="tabular-nums">{timeAgo(message.created_at)}</time>
          {canDelete && (
            <button
              onClick={() => onDelete(message.id)}
              className="opacity-0 group-hover:opacity-100 hover:text-danger transition-opacity text-2xs"
              aria-label="Mesajı sil"
            >
              Sil
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
