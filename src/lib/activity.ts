/**
 * Kullanıcı aktivitesini user_activity tablosuna kaydeder.
 * Her "önemli eylem" (mesaj gönderme, post paylaşma, yorum yapma) için çağrılır.
 */
import { createClient } from "@/lib/supabase/client";

export async function trackActivity(userId: string) {
  const supabase = createClient();
  const today = new Date().toISOString().split("T")[0]; // "2025-04-27"

  // Bugünün kaydı varsa +1, yoksa yeni satır
  await supabase.rpc("increment_activity", {
    p_user_id: userId,
    p_date: today,
  });
}
