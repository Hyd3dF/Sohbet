/**
 * Tek bir global presence store.
 * Tüm OnlineDot bileşenleri tek bir channel paylaşır.
 */
import { createClient } from "@/lib/supabase/client";

type Listener = (userId: string, isOnline: boolean) => void;

class PresenceStore {
  private cache = new Map<string, { is_online: boolean; last_seen_at: string }>();
  private listeners = new Set<Listener>();
  private channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;
  private subscribed = false;
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    this.ensureChannel();
    return () => {
      this.listeners.delete(listener);
    };
  }

  isOnline(userId: string): boolean {
    const row = this.cache.get(userId);
    if (!row) return false;
    const lastSeen = new Date(row.last_seen_at).getTime();
    const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
    return row.is_online && lastSeen > twoMinutesAgo;
  }

  async fetchUser(userId: string) {
    if (this.cache.has(userId)) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("user_presence")
      .select("user_id, is_online, last_seen_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (data) {
      this.cache.set(data.user_id, { is_online: data.is_online, last_seen_at: data.last_seen_at });
      this.notify(data.user_id);
    }
  }

  private notify(userId: string) {
    const isOnline = this.isOnline(userId);
    this.listeners.forEach((l) => l(userId, isOnline));
  }

  private notifyAll() {
    this.cache.forEach((_, userId) => this.notify(userId));
  }

  private ensureChannel() {
    if (this.subscribed) return;
    this.subscribed = true;
    const supabase = createClient();

    this.channel = supabase
      .channel("global-presence")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_presence" },
        (payload) => {
          const row = payload.new as { user_id: string; is_online: boolean; last_seen_at: string };
          if (!row || !row.user_id) return;
          this.cache.set(row.user_id, {
            is_online: row.is_online,
            last_seen_at: row.last_seen_at,
          });
          this.notify(row.user_id);
        },
      )
      .subscribe();

    // Her 60 saniyede bir kontrol et — heartbeat timeout için
    this.refreshTimer = setInterval(() => this.notifyAll(), 60_000);
  }
}

export const presenceStore = new PresenceStore();
