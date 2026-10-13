import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Message, Profile, RequestStatus } from "@/lib/types";
import { Avatar } from "@/components/avatar";
import { StatusBadge } from "@/components/status-badge";
import { InstagramLink } from "@/components/instagram-link";
import { fmt } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { ChatRoom } from "./chat-room";

type Person = Pick<Profile, "id" | "display_name" | "avatar_url" | "contact" | "instagram">;
type RoomRow = {
  id: string;
  request: { id: string; title: string; status: RequestStatus; matched_guide_id: string | null };
  traveler: Person;
  guide: Person;
};

export default async function ChatRoomPage({ params }: PageProps<"/chats/[roomId]">) {
  const { roomId } = await params;
  const profile = await requireProfile();
  const { t } = await getI18n();
  const supabase = await createClient();

  // RLS only returns the room if the current user is a participant
  const { data } = await supabase
    .from("chat_rooms")
    .select(
      `id,
       request:guide_requests(id, title, status, matched_guide_id),
       traveler:profiles!traveler_id(id, display_name, avatar_url, contact, instagram),
       guide:profiles!guide_id(id, display_name, avatar_url, contact, instagram)`,
    )
    .eq("id", roomId)
    .maybeSingle();
  if (!data) notFound();
  const room = data as unknown as RoomRow;

  const { data: msgs } = await supabase
    .from("messages")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: false })
    .limit(100);
  const initialMessages = ((msgs ?? []) as Message[]).reverse();

  const me = room.traveler.id === profile.id ? room.traveler : room.guide;
  const other = room.traveler.id === profile.id ? room.guide : room.traveler;

  return (
    <div className="mx-auto flex h-[calc(100dvh-3.5rem)] w-full max-w-3xl flex-col px-0 sm:px-4 sm:py-4">
      <div className="flex items-center gap-3 border-b border-zinc-200 bg-white px-4 py-3 sm:rounded-t-2xl sm:border">
        <Link href="/chats" className="text-zinc-500 hover:text-zinc-900" aria-label={t.chats.backToChats}>
          ←
        </Link>
        <Avatar src={other.avatar_url} name={other.display_name} size={36} />
        <div className="min-w-0 flex-1">
          <p className="flex items-baseline gap-2 truncate font-medium">
            {other.display_name}
            {other.instagram && <InstagramLink username={other.instagram} className="text-xs font-normal" />}
          </p>
          <Link
            href={`/requests/${room.request.id}`}
            className="block truncate text-xs text-zinc-500 hover:underline"
          >
            {room.request.title}
          </Link>
        </div>
        <StatusBadge status={room.request.status} t={t} />
      </div>

      {other.contact && (
        <p className="border-x border-zinc-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
          {fmt(t.chats.contact, { name: other.display_name })} <span className="font-medium">{other.contact}</span>
        </p>
      )}

      <ChatRoom
        roomId={room.id}
        me={{ id: me.id, display_name: me.display_name }}
        other={{ id: other.id, display_name: other.display_name, avatar_url: other.avatar_url }}
        initialMessages={initialMessages}
      />
    </div>
  );
}
