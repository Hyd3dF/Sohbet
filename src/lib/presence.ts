/**
 * Presence yardımcı fonksiyonları
 * user_presence tablosu ile online/offline durumu yönetimi
 */

import { createClient } from "@/lib/supabase/client";

// Kullanıcıyı online olarak işaretle
export async function setOnline(userId: string) {
  const supabase = createClient();
  await supabase.from("user_presence").upsert(
    { user_id: userId, is_online: true, last_seen_at: new Date().toISOString() },
    { onConflict: "user_id" },
  );
}

// Kullanıcıyı offline olarak işaretle
export async function setOffline(userId: string) {
  const supabase = createClient();
  await supabase.from("user_presence").upsert(
    { user_id: userId, is_online: false, last_seen_at: new Date().toISOString() },
    { onConflict: "user_id" },
  );
}

// Son görülme zamanını güncelle (heartbeat)
export async function heartbeat(userId: string) {
  const supabase = createClient();
  await supabase.from("user_presence").upsert(
    { user_id: userId, is_online: true, last_seen_at: new Date().toISOString() },
    { onConflict: "user_id" },
  );
}
