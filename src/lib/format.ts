import { intlLocale, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";

export function formatDate(date: string, locale: Locale) {
  return new Date(date + (date.length === 10 ? "T00:00:00" : "")).toLocaleDateString(
    intlLocale[locale],
    { month: "short", day: "numeric", year: "numeric", weekday: "short" },
  );
}

export function formatTime(iso: string, locale: Locale) {
  return new Date(iso).toLocaleTimeString(intlLocale[locale], {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Localized, comma-separated names for spoken-language values stored in the DB */
export function spokenLanguages(langs: string[], t: Dictionary) {
  return langs
    .map((l) => t.spokenLanguages[l as keyof Dictionary["spokenLanguages"]] ?? l)
    .join(", ");
}

export const STATUS_STYLE = {
  open: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  matched: "bg-sky-50 text-sky-700 ring-sky-600/20",
  completed: "bg-zinc-100 text-zinc-600 ring-zinc-500/20",
  cancelled: "bg-rose-50 text-rose-700 ring-rose-600/20",
} as const;
