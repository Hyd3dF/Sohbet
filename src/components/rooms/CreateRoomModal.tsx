"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  ownerId: string;
}

export function CreateRoomModal({ open, onClose, ownerId }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [maxMembers, setMaxMembers] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("rooms")
      .insert({
        name: name.trim(),
        description: description.trim() || null,
        owner_id: ownerId,
        is_private: isPrivate,
        max_members: maxMembers,
      })
      .select()
      .single();
    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }
    if (data) {
      setLoading(false);
      onClose();
      router.push(`/rooms/${data.id}`);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <form onSubmit={submit} className="space-y-5">
        {/* Modal header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl grid place-items-center bg-gradient-to-br from-accent to-accent-glow text-white shadow-glow-soft shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5" aria-hidden>
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">Yeni Oda</h2>
            <p className="text-xs text-text-dim">Sohbet odası oluştur ve arkadaşlarını davet et.</p>
          </div>
        </div>

        <div className="h-px bg-border/50" />

        <div>
          <label className="text-sm font-medium text-text-muted block mb-2">Oda Adı</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Yakın Arkadaşlar"
            maxLength={60}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-text-muted block mb-2">Açıklama <span className="text-text-dim font-normal">(opsiyonel)</span></label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Bu oda ne hakkında?"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-text-muted block mb-2">Maks. Üye</label>
            <Input
              type="number"
              min={2}
              max={1000}
              value={maxMembers}
              onChange={(e) => setMaxMembers(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-text-muted block mb-2">Gizlilik</label>
            <button
              type="button"
              onClick={() => setIsPrivate((v) => !v)}
              className={cn(
                "w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 border",
                isPrivate
                  ? "bg-warn/10 border-warn/30 text-warn hover:bg-warn/15"
                  : "bg-success/10 border-success/30 text-success hover:bg-success/15",
              )}
            >
              {isPrivate ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden>
                  <rect x="4" y="11" width="16" height="10" rx="2" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              )}
              {isPrivate ? "Özel" : "Açık"}
            </button>
          </div>
        </div>
        {error && (
          <div className="text-sm text-danger bg-danger-soft rounded-xl px-4 py-2.5 border border-danger/20">
            {error}
          </div>
        )}

        <div className="h-px bg-border/50" />

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>
            İptal
          </Button>
          <Button type="submit" disabled={loading || !name.trim()}>
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v3a5 5 0 0 0-5 5H4z" />
                </svg>
                Oluşturuluyor...
              </span>
            ) : "Oluştur"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
