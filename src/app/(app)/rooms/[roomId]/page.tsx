import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChatWindow } from "@/components/rooms/ChatWindow";
import type { RoomRole } from "@/lib/types/db";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/login");

  const { data: room } = await supabase.from("rooms").select("*").eq("id", roomId).single();
  if (!room) notFound();

  const { data: membership } = await supabase
    .from("room_members")
    .select("role")
    .eq("room_id", roomId)
    .eq("user_id", user.id)
    .maybeSingle();

  const initialRole = (membership?.role ?? null) as RoomRole | null;

  if (!initialRole) {
    if (room.is_private) {
      return (
        <main className="max-w-md mx-auto p-8 text-center space-y-3">
          <h1 className="text-xl font-semibold">Bu oda özel</h1>
          <p className="text-text-muted">
            Sadece davet edilen üyeler bu odayı görüntüleyebilir.
          </p>
        </main>
      );
    }
    return (
      <main className="max-w-md mx-auto p-8 text-center space-y-3">
        <h1 className="text-xl font-semibold">{room.name}</h1>
        <p className="text-text-muted">{room.description ?? "Bu odaya katıl ve sohbete dahil ol."}</p>
        <form
          action={async () => {
            "use server";
            const supabase = await createClient();
            await supabase
              .from("room_members")
              .insert({ room_id: roomId, user_id: user.id, role: "member" });
            redirect(`/rooms/${roomId}`);
          }}
        >
          <button className="btn-primary mt-2">Odaya Katıl</button>
        </form>
      </main>
    );
  }

  return <ChatWindow room={room} me={profile} initialRole={initialRole} />;
}
