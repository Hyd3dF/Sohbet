"use client";

import { Avatar } from "@/components/ui/Avatar";
import { AudioPlayer } from "@/components/rooms/AudioPlayer";
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
  const isAttachmentOnly = !hasText && !!att;

  // Own messages with audio/file use a clean outlined style instead of heavy fill
  const isOutlinedBubble = isMine && isAttachmentOnly && (att === "audio" || att === "file");

  return (
    <div
      className={cn(
        "group flex gap-2.5 px-3 sm:px-4",
        isMine ? "flex-row-reverse" : "flex-row",
        grouped ? "mt-0.5" : "mt-4",
      )}
    >
      {/* Avatar column */}
      <div className="w-8 shrink-0 self-start">
        {!grouped && (
          <Avatar
            url={message.author?.avatar_url}
            name={message.author?.display_name || message.author?.username || "?"}
            size={32}
            className={cn(
              "ring-1 shadow-soft",
              isMine ? "ring-accent/30" : "ring-border/40",
            )}
          />
        )}
      </div>

      {/* Content column */}
      <div
        className={cn(
          "max-w-[76%] sm:max-w-[62%] min-w-0 flex flex-col gap-1",
          isMine ? "items-end" : "items-start",
        )}
      >
        {!grouped && (
          <div className={cn(
            "text-xs px-1 font-semibold tracking-tight",
            isMine ? "text-accent-glow/80" : "text-text-muted",
          )}>
            {isMine
              ? (message.author?.display_name || message.author?.username || "Sen")
              : (message.author?.display_name || message.author?.username)}
          </div>
        )}

        <div
          className={cn(
            "break-words text-[14px] leading-relaxed max-w-full",
            isOutlinedBubble
              ? cn(
                  "bg-bg-card/40 border border-accent/25 rounded-2xl",
                  isMine ? "rounded-tr-sm" : "rounded-tl-sm",
                  "px-3.5 py-2.5",
                )
              : isMine
                ? cn(
                    "bubble-mine text-white px-3.5 py-2.5",
                    grouped ? "rounded-2xl rounded-tr-md" : "rounded-2xl rounded-tr-sm",
                    !hasText && att === "image" ? "!p-1.5" : "",
                  )
                : cn(
                    "bg-bg-card border border-border/50 text-text px-3.5 py-2.5",
                    grouped ? "rounded-2xl rounded-tl-md" : "rounded-2xl rounded-tl-sm",
                    !hasText && att === "image" ? "!p-1.5" : "",
                  ),
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
            <div className={hasText ? "mt-2" : ""}>
              <AudioPlayer
                src={message.attachment_url}
                variant={isMine && !isOutlinedBubble ? "mine" : "other"}
              />
            </div>
          )}

          {message.attachment_url && att === "file" && (
            <a
              href={message.attachment_url}
              target="_blank"
              rel="noreferrer"
              className={cn(
                "inline-flex items-center gap-2 text-sm font-medium rounded-xl px-3 py-2",
                isMine
                  ? "bg-white/10 text-white hover:bg-white/20"
                  : "bg-bg-soft text-text hover:bg-bg-hover",
                "transition-colors",
                hasText && "mt-2",
              )}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0" aria-hidden>
                <path d="M21.44 11.05 12.25 20.24a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
              Dosyayı aç
            </a>
          )}
        </div>

        <div
          className={cn(
            "flex items-center gap-1.5 px-1 text-2xs text-text-faint min-h-[1rem]",
            isMine ? "flex-row-reverse" : "flex-row",
            grouped ? "opacity-0 group-hover:opacity-100" : "opacity-60",
          )}
        >
          <time className="tabular-nums">{timeAgo(message.created_at)}</time>
          {canDelete && (
            <button
              onClick={() => onDelete(message.id)}
              className="opacity-0 group-hover:opacity-100 hover:text-danger text-2xs font-medium px-1 rounded"
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
