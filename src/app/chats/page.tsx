import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatTime } from "@/lib/format";
import type { Message, Profile } from "@/lib/types";
import { Avatar } from "@/components/avatar";

type Person = Pick<Profile, "id" | "display_name" | "avatar_url">;
type RoomRow = {
  id: string;
  created_at: string;
  request: { title: string } | null;
  traveler: Person;
  guide: Person;
};

export default async function ChatsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data } = await supabase
    .from("chat_rooms")
    .select(
      `id, created_at,
       request:guide_requests(title),
       traveler:profiles!traveler_id(id, display_name, avatar_url),
       guide:profiles!guide_id(id, display_name, avatar_url)`,
    )
    .or(`traveler_id.eq.${profile.id},guide_id.eq.${profile.id}`);
  const rooms = (data ?? []) as unknown as RoomRow[];

  // Latest message per room (one query, newest first)
  const lastMessage = new Map<string, Message>();
  if (rooms.length > 0) {
    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .in(
        "room_id",
        rooms.map((r) => r.id),
      )
      .order("created_at", { ascending: false })
      .limit(500);
    for (const m of (msgs ?? []) as Message[]) {
      if (!lastMessage.has(m.room_id)) lastMessage.set(m.room_id, m);
    }
  }

  const sorted = rooms
    .map((room) => ({ room, last: lastMessage.get(room.id) }))
    .sort((a, b) =>
      (b.last?.created_at ?? b.room.created_at).localeCompare(a.last?.created_at ?? a.room.created_at),
    );

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Chats</h1>
      {sorted.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500">
          {profile.role === "guide"
            ? "Open a traveler's request and send a message to start chatting."
            : "When a volunteer messages you, the conversation will appear here."}
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-zinc-200 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          {sorted.map(({ room, last }) => {
            const other = room.traveler.id === profile.id ? room.guide : room.traveler;
            return (
              <li key={room.id}>
                <Link href={`/chats/${room.id}`} className="flex items-center gap-3 p-4 hover:bg-zinc-50">
                  <Avatar src={other.avatar_url} name={other.display_name} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate font-medium">{other.display_name}</p>
                      {last && (
                        <span className="shrink-0 text-xs text-zinc-400">{formatTime(last.created_at)}</span>
                      )}
                    </div>
                    <p className="truncate text-xs text-zinc-500">{room.request?.title}</p>
                    <p className="mt-0.5 truncate text-sm text-zinc-700">
                      {last ? last.content : <span className="text-zinc-400">No messages yet</span>}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
