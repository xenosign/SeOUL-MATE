import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, spokenLanguages } from "@/lib/format";
import type { GuideRequest, Profile } from "@/lib/types";
import { Avatar } from "@/components/avatar";
import { StatusBadge } from "@/components/status-badge";
import { fmt } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { getI18n } from "@/i18n/server";
import { acceptGuide, setRequestStatus, startChat } from "../actions";

type PublicProfile = Pick<
  Profile,
  "id" | "display_name" | "avatar_url" | "nationality" | "languages" | "bio"
>;

const PROFILE_FIELDS = "id, display_name, avatar_url, nationality, languages, bio";

export default async function RequestDetailPage({ params }: PageProps<"/requests/[id]">) {
  const { id } = await params;
  const profile = await requireProfile();
  const { locale, t } = await getI18n();
  const d = t.requests.detail;
  const supabase = await createClient();

  const { data } = await supabase
    .from("guide_requests")
    .select(`*, traveler:profiles!traveler_id(${PROFILE_FIELDS})`)
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const request = data as GuideRequest & { traveler: PublicProfile };

  const isOwner = request.traveler_id === profile.id;

  // Owner sees every guide who reached out
  let rooms: { id: string; guide: PublicProfile }[] = [];
  if (isOwner) {
    const { data: roomData } = await supabase
      .from("chat_rooms")
      .select(`id, guide:profiles!guide_id(${PROFILE_FIELDS})`)
      .eq("request_id", id)
      .order("created_at", { ascending: true });
    rooms = (roomData ?? []) as unknown as typeof rooms;
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <Link href="/requests" className="text-sm text-zinc-500 hover:text-zinc-900">
        {t.nav.back}
      </Link>

      <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-6">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{request.title}</h1>
          <StatusBadge status={request.status} t={t} />
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Info label={d.area} value={request.area} />
          <Info label={d.date} value={formatDate(request.travel_date, locale)} />
          <Info label={d.duration} value={fmt(d.hours, { n: request.duration_hours })} />
          <Info label={d.group} value={fmt(d.people, { n: request.group_size })} />
        </dl>
        {request.languages.length > 0 && (
          <p className="mt-4 text-sm text-zinc-600">🗣 {spokenLanguages(request.languages, t)}</p>
        )}
        {request.description && (
          <p className="mt-4 whitespace-pre-wrap text-zinc-800">{request.description}</p>
        )}
      </div>

      {!isOwner && (
        <>
          <ProfileCard title={d.traveler} person={request.traveler} t={t} />
          {profile.role === "guide" &&
            (request.status === "open" || request.matched_guide_id === profile.id) && (
              <form action={startChat.bind(null, request.id)} className="mt-6">
                <button className="h-12 w-full rounded-xl bg-brand-500 font-medium text-white hover:bg-brand-600">
                  {fmt(d.message, { name: request.traveler.display_name })}
                </button>
              </form>
            )}
        </>
      )}

      {isOwner && (
        <section className="mt-8">
          <h2 className="font-semibold">{fmt(d.guidesReached, { n: rooms.length })}</h2>
          {rooms.length === 0 ? (
            <p className="mt-3 rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500">
              {d.noMessages}
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-3">
              {rooms.map((room) => {
                const isMatched = request.matched_guide_id === room.guide.id;
                return (
                  <li
                    key={room.id}
                    className={`rounded-2xl border bg-white p-4 ${isMatched ? "border-sky-400 ring-2 ring-sky-100" : "border-zinc-200"}`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar src={room.guide.avatar_url} name={room.guide.display_name} size={40} />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">
                          {room.guide.display_name}
                          {isMatched && (
                            <span className="ml-2 text-xs font-medium text-sky-600">{d.yourGuide}</span>
                          )}
                        </p>
                        <p className="truncate text-xs text-zinc-500">
                          {spokenLanguages(room.guide.languages, t) || "—"}
                        </p>
                      </div>
                      <Link
                        href={`/chats/${room.id}`}
                        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50"
                      >
                        {d.chat}
                      </Link>
                      {request.status === "open" && (
                        <form action={acceptGuide.bind(null, request.id, room.guide.id)}>
                          <button className="rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700">
                            {d.accept}
                          </button>
                        </form>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-8 flex flex-wrap gap-2 border-t border-zinc-200 pt-6 text-sm">
            {request.status === "matched" && (
              <>
                <StatusButton id={request.id} status="completed" label={d.markCompleted} primary />
                <StatusButton id={request.id} status="open" label={d.reopen} />
              </>
            )}
            {request.status === "open" && (
              <StatusButton id={request.id} status="cancelled" label={d.cancel} />
            )}
            {request.status === "cancelled" && (
              <StatusButton id={request.id} status="open" label={d.reopen} />
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function ProfileCard({ title, person, t }: { title: string; person: PublicProfile; t: Dictionary }) {
  return (
    <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6">
      <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-500">{title}</h2>
      <div className="mt-3 flex items-center gap-3">
        <Avatar src={person.avatar_url} name={person.display_name} size={48} />
        <div>
          <p className="font-semibold">{person.display_name}</p>
          <p className="text-sm text-zinc-500">
            {[person.nationality, spokenLanguages(person.languages, t)].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>
      {person.bio && <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-700">{person.bio}</p>}
    </section>
  );
}

function StatusButton({
  id,
  status,
  label,
  primary,
}: {
  id: string;
  status: GuideRequest["status"];
  label: string;
  primary?: boolean;
}) {
  return (
    <form action={setRequestStatus.bind(null, id, status)}>
      <button
        className={
          primary
            ? "rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-700"
            : "rounded-lg border border-zinc-300 px-4 py-2 hover:bg-zinc-50"
        }
      >
        {label}
      </button>
    </form>
  );
}
