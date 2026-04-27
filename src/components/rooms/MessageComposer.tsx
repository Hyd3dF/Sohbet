"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AudioRecorder } from "@/components/rooms/AudioRecorder";
import { trackActivity } from "@/lib/activity";
import { cn, randomFileName } from "@/lib/utils";
import type { AttachmentType, Message, Profile } from "@/lib/types/db";

interface Props {
  roomId: string;
  me: Profile;
  onLocalAppend?: (
    msg: Message & { author?: Pick<Profile, "id" | "username" | "display_name" | "avatar_url"> },
  ) => void;
}

export function MessageComposer({ roomId, me, onLocalAppend }: Props) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    const max = 120;
    const next = Math.min(ta.scrollHeight, max);
    ta.style.height = next + "px";
    ta.style.overflowY = ta.scrollHeight > max ? "auto" : "hidden";
  }, [text]);

  async function uploadAttachment(blob: Blob, filename: string, type: AttachmentType) {
    const supabase = createClient();
    const path = `${me.id}/${randomFileName(filename)}`;
    const { error } = await supabase.storage
      .from("chat-attachments")
      .upload(path, blob, { contentType: blob.type || "application/octet-stream" });
    if (error) throw error;
    const { data } = supabase.storage.from("chat-attachments").getPublicUrl(path);
    return { url: data.publicUrl, type };
  }

  function authorBundle() {
    return {
      id: me.id,
      username: me.username,
      display_name: me.display_name,
      avatar_url: me.avatar_url,
    };
  }

  async function sendText(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    const content = text.trim();
    setText("");
    const supabase = createClient();
    const { data } = await supabase
      .from("messages")
      .insert({ room_id: roomId, author_id: me.id, content })
      .select("*")
      .single();
    if (data && onLocalAppend) {
      onLocalAppend({ ...(data as Message), author: authorBundle() });
    }
    trackActivity(me.id);
    setSending(false);
  }

  async function sendImage(file: File) {
    setSending(true);
    try {
      const { url, type } = await uploadAttachment(file, file.name, "image");
      const supabase = createClient();
      const { data } = await supabase.from("messages").insert({
        room_id: roomId, author_id: me.id, attachment_url: url, attachment_type: type,
      }).select("*").single();
      if (data && onLocalAppend) {
        onLocalAppend({ ...(data as Message), author: authorBundle() });
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Yükleme hatası");
    } finally {
      setSending(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function sendAudio(blob: Blob) {
    setRecording(false);
    setSending(true);
    try {
      const { url, type } = await uploadAttachment(blob, "audio.webm", "audio");
      const supabase = createClient();
      const { data } = await supabase.from("messages").insert({
        room_id: roomId, author_id: me.id, attachment_url: url, attachment_type: type,
      }).select("*").single();
      if (data && onLocalAppend) {
        onLocalAppend({ ...(data as Message), author: authorBundle() });
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Ses gönderilemedi");
    } finally {
      setSending(false);
    }
  }

  if (recording) {
    return (
      <div className="border-t border-border/40 bg-bg-card/80 backdrop-blur-2xl p-3 sm:p-4">
        <AudioRecorder onRecorded={sendAudio} onCancel={() => setRecording(false)} />
      </div>
    );
  }

  const canSend = !sending && text.trim().length > 0;

  return (
    <div className="bg-bg-card/70 backdrop-blur-2xl px-3 sm:px-4 py-3">
      <form
        onSubmit={sendText}
        className={cn(
          "flex items-end gap-1 bg-bg-inset border border-border/60 rounded-2xl pl-1 pr-1 py-1 transition-all duration-200",
          "focus-within:border-accent/45 focus-within:shadow-ring-focus",
        )}
      >
        <label
          className="icon-btn !w-8 !h-8 !rounded-xl shrink-0 cursor-pointer self-end hover:bg-accent-soft hover:text-accent-glow"
          title="Fotoğraf ekle"
          aria-label="Fotoğraf ekle"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden>
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <circle cx="8.5" cy="9.5" r="1.5" />
            <path d="m21 15-5-5L5 21" />
          </svg>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) sendImage(f); }}
          />
        </label>

        <button
          type="button"
          onClick={() => setRecording(true)}
          className="icon-btn !w-8 !h-8 !rounded-xl shrink-0 self-end hover:bg-accent-soft hover:text-accent-glow"
          title="Ses kaydı"
          aria-label="Ses kaydı"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden>
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M19 10a7 7 0 0 1-14 0M12 18v4M8 22h8" />
          </svg>
        </button>

        <textarea
          ref={taRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendText(e as unknown as React.FormEvent);
            }
          }}
          placeholder="Mesaj yaz..."
          rows={1}
          className="flex-1 bg-transparent border-0 outline-none resize-none text-[14.5px] leading-relaxed py-2 px-2 placeholder:text-text-dim self-center min-h-[2.25rem] max-h-[120px] overflow-y-auto scrollbar-thin"
        />

        <button
          type="submit"
          disabled={!canSend}
          aria-label="Gönder"
          className={cn(
            "shrink-0 w-9 h-9 grid place-items-center rounded-xl transition-all duration-200 self-end",
            canSend
              ? "bubble-mine text-white shadow-glow-soft hover:shadow-glow hover:brightness-110 active:scale-90"
              : "bg-bg-soft text-text-faint cursor-not-allowed",
          )}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]" aria-hidden>
            <path d="M22 2 11 13" />
            <path d="M22 2 15 22l-4-9-9-4z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
