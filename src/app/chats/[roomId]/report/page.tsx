import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fmt } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { ReportForm } from "./report-form";

type RoomRow = {
  id: string;
  traveler: { id: string; display_name: string };
  guide: { id: string; display_name: string };
};

export default async function ReportPage({ params }: PageProps<"/chats/[roomId]/report">) {
  const { roomId } = await params;
  const profile = await requireProfile();
  const { t } = await getI18n();
  const supabase = await createClient();

  // RLS only returns the room if the current user is a participant
  const { data } = await supabase
    .from("chat_rooms")
    .select(
      `id,
       traveler:profiles!traveler_id(id, display_name),
       guide:profiles!guide_id(id, display_name)`,
    )
    .eq("id", roomId)
    .maybeSingle();
  if (!data) notFound();
  const room = data as unknown as RoomRow;
  const other = room.traveler.id === profile.id ? room.guide : room.traveler;

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10">
      <Link href={`/chats/${room.id}`} className="text-sm text-zinc-500 hover:text-zinc-900">
        {t.nav.back}
      </Link>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">
        {fmt(t.report.title, { name: other.display_name })}
      </h1>
      <p className="mt-2 text-sm text-zinc-600">{fmt(t.report.subtitle, { name: other.display_name })}</p>
      <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{t.report.emergency}</p>

      <ReportForm roomId={room.id} />
    </div>
  );
}
