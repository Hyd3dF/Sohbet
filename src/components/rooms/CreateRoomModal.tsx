"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

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
    <Modal open={open} onClose={onClose} title="Yeni Oda">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-sm text-text-muted block mb-1.5">Oda Adı</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Yakın Arkadaşlar"
            maxLength={60}
            required
          />
        </div>
        <div>
          <label className="text-sm text-text-muted block mb-1.5">Açıklama (opsiyonel)</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Bu oda ne hakkında?"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-text-muted block mb-1.5">Maks. Üye</label>
            <Input
              type="number"
              min={2}
              max={1000}
              value={maxMembers}
              onChange={(e) => setMaxMembers(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-sm text-text-muted block mb-1.5">Gizlilik</label>
            <button
              type="button"
              onClick={() => setIsPrivate((v) => !v)}
              className="btn-ghost w-full"
            >
              {isPrivate ? "🔒 Özel" : "🌍 Açık"}
            </button>
          </div>
        </div>
        {error && <div className="text-sm text-danger">{error}</div>}
        <div className="flex gap-2 justify-end pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            İptal
          </Button>
          <Button type="submit" disabled={loading || !name.trim()}>
            {loading ? "Oluşturuluyor..." : "Oluştur"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
