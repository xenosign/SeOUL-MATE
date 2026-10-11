import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { defaultLocale, isLocale, locales, LOCALE_COOKIE, type Locale } from "./config";
import en, { type Dictionary } from "./dictionaries/en";
import ko from "./dictionaries/ko";
import ja from "./dictionaries/ja";
import zh from "./dictionaries/zh";

const dictionaries: Record<Locale, Dictionary> = { en, ko, ja, zh };

/** Picks the best supported locale from an Accept-Language header. */
function matchAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null;
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { lang: tag.toLowerCase().split("-")[0], q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { lang } of ranked) {
    if ((locales as readonly string[]).includes(lang)) return lang as Locale;
  }
  return null;
}

/** Current locale: cookie (set by the language switcher) → Accept-Language → default. */
export const getLocale = cache(async (): Promise<Locale> => {
  const cookieValue = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(cookieValue)) return cookieValue;
  return matchAcceptLanguage((await headers()).get("accept-language")) ?? defaultLocale;
});

export async function getI18n() {
  const locale = await getLocale();
  return { locale, t: dictionaries[locale] };
}

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}
