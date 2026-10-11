import Link from "next/link";
import { formatDate, spokenLanguages } from "@/lib/format";
import type { GuideRequest, Profile } from "@/lib/types";
import { fmt, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { Avatar } from "./avatar";
import { StatusBadge } from "./status-badge";

export type RequestWithTraveler = GuideRequest & {
  traveler: Pick<Profile, "display_name" | "avatar_url" | "nationality"> | null;
};

export function RequestCard({
  request,
  locale,
  t,
}: {
  request: RequestWithTraveler;
  locale: Locale;
  t: Dictionary;
}) {
  return (
    <Link
      href={`/requests/${request.id}`}
      className="block rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-300 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold">{request.title}</h3>
        <StatusBadge status={request.status} t={t} />
      </div>
      <p className="mt-1 text-sm text-zinc-600">
        📍 {request.area} · 📅 {formatDate(request.travel_date, locale)} · ⏱{" "}
        {fmt(t.requests.hoursShort, { n: request.duration_hours })} · 👥 {request.group_size}
      </p>
      {request.description && (
        <p className="mt-3 line-clamp-2 text-sm text-zinc-700">{request.description}</p>
      )}
      <div className="mt-4 flex items-center justify-between gap-3">
        {request.traveler && (
          <span className="flex items-center gap-2 text-sm text-zinc-600">
            <Avatar src={request.traveler.avatar_url} name={request.traveler.display_name} size={24} />
            {request.traveler.display_name}
            {request.traveler.nationality && (
              <span className="text-zinc-400">· {request.traveler.nationality}</span>
            )}
          </span>
        )}
        {request.languages.length > 0 && (
          <span className="truncate text-xs text-zinc-500">{spokenLanguages(request.languages, t)}</span>
        )}
      </div>
    </Link>
  );
}
