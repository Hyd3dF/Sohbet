"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import type { Room } from "@/lib/types/db";

interface Props {
  open: boolean;
  onClose: () => void;
  room: Room;
  isOwner: boolean;
}

export function RoomSettings({ open, onClose, room, isOwner }: Props) {
  const router = useRouter();
  const [name, setName] = useState(room.name);
  const [description, setDescription] = useState(room.description ?? "");
  const [maxMembers, setMaxMembers] = useState(room.max_members);
  const [isPrivate, setIsPrivate] = useState(room.is_private);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("rooms")
      .update({
        name: name.trim(),
        description: description.trim() || null,
        max_members: maxMembers,
        is_private: isPrivate,
      })
      .eq("id", room.id);
    setLoading(false);
    if (error) {
      alert(error.message);
      return;
    }
    onClose();
    router.refresh();
  }

  async function destroy() {
    if (!confirm(`"${room.name}" odasını kalıcı olarak silmek istiyor musun?`)) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("rooms").delete().eq("id", room.id);
    setLoading(false);
    if (error) {
      alert(error.message);
      return;
    }
    router.push("/rooms");
  }

  async function leave() {
    if (!confirm("Odadan çıkmak istiyor musun?")) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from("room_members")
      .delete()
      .eq("room_id", room.id)
      .eq("user_id", user.id);
    if (error) {
      alert(error.message);
      return;
    }
    router.push("/rooms");
  }

  return (
    <Modal open={open} onClose={onClose} title="Oda Ayarları">
      <div className="space-y-4">
        <div>
          <label className="text-sm text-text-muted block mb-1.5">Oda Adı</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} disabled={!isOwner} />
        </div>
        <div>
          <label className="text-sm text-text-muted block mb-1.5">Açıklama</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!isOwner}
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
              disabled={!isOwner}
            />
          </div>
          <div>
            <label className="text-sm text-text-muted block mb-1.5">Gizlilik</label>
            <button
              type="button"
              onClick={() => isOwner && setIsPrivate((v) => !v)}
              className="btn-ghost w-full"
              disabled={!isOwner}
            >
              {isPrivate ? "🔒 Özel" : "🌍 Açık"}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 justify-between pt-3 border-t border-border">
          {!isOwner && (
            <Button variant="danger" onClick={leave}>
              Odadan Çık
            </Button>
          )}
          {isOwner && (
            <Button variant="danger" onClick={destroy} disabled={loading}>
              Odayı Sil
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="ghost" onClick={onClose}>
              Kapat
            </Button>
            {isOwner && (
              <Button onClick={save} disabled={loading}>
                Kaydet
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
