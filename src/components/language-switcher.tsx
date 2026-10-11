"use client";

import { useTransition } from "react";
import { locales, localeNames } from "@/i18n/config";
import { setLocale } from "@/i18n/actions";
import { useI18n } from "@/i18n/client";

export function LanguageSwitcher() {
  const { locale, t } = useI18n();
  const [pending, startTransition] = useTransition();

  return (
    <label className="relative flex items-center">
      <span className="sr-only">{t.nav.language}</span>
      <span aria-hidden className="pointer-events-none absolute left-2 text-sm">
        🌐
      </span>
      <select
        value={locale}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value;
          startTransition(() => setLocale(next));
        }}
        className="h-8 cursor-pointer appearance-none rounded-lg border border-zinc-200 bg-white py-0 pr-2 pl-7 text-sm hover:bg-zinc-50 disabled:opacity-60"
      >
        {locales.map((l) => (
          <option key={l} value={l}>
            {localeNames[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
