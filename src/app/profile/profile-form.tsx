"use client";

import { useActionState } from "react";
import { LANGUAGE_OPTIONS, type Profile } from "@/lib/types";
import { useI18n } from "@/i18n/client";
import { updateProfile, type ProfileFormState } from "./actions";

const input =
  "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100";

const ROLES = ["traveler", "guide"] as const;

export function ProfileForm({ profile, onboarding }: { profile: Profile; onboarding: boolean }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(updateProfile, {});

  return (
    <form action={action} className="mt-8 flex flex-col gap-6">
      {onboarding && <input type="hidden" name="onboarding" value="1" />}

      <fieldset>
        <legend className="text-sm font-medium">{t.profile.iAm}</legend>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {ROLES.map((role) => (
            <label
              key={role}
              className="cursor-pointer rounded-xl border border-zinc-300 bg-white p-4 has-[:checked]:border-brand-400 has-[:checked]:ring-2 has-[:checked]:ring-brand-100"
            >
              <input
                type="radio"
                name="role"
                value={role}
                defaultChecked={profile.role === role}
                className="sr-only"
                required
              />
              <span className="block font-medium">{t.profile.roles[role].label}</span>
              <span className="mt-1 block text-xs text-zinc-500">{t.profile.roles[role].desc}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="text-sm font-medium">
        {t.profile.name}
        <input name="display_name" defaultValue={profile.display_name} required className={input} />
      </label>

      <label className="text-sm font-medium">
        {t.profile.nationality}
        <input
          name="nationality"
          defaultValue={profile.nationality ?? ""}
          placeholder={t.profile.nationalityPlaceholder}
          className={input}
        />
      </label>

      <fieldset>
        <legend className="text-sm font-medium">{t.profile.languages}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {LANGUAGE_OPTIONS.map((lang) => (
            <label
              key={lang}
              className="cursor-pointer rounded-full border border-zinc-300 bg-white px-3 py-1 text-sm has-[:checked]:border-brand-400 has-[:checked]:bg-brand-50 has-[:checked]:text-brand-700"
            >
              <input
                type="checkbox"
                name="languages"
                value={lang}
                defaultChecked={profile.languages.includes(lang)}
                className="sr-only"
              />
              {t.spokenLanguages[lang]}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="text-sm font-medium">
        {t.profile.about}
        <textarea
          name="bio"
          rows={4}
          defaultValue={profile.bio ?? ""}
          placeholder={t.profile.aboutPlaceholder}
          className={input}
        />
      </label>

      <label className="text-sm font-medium">
        {t.profile.contact}{" "}
        <span className="font-normal text-zinc-500">{t.profile.contactHint}</span>
        <input
          name="contact"
          defaultValue={profile.contact ?? ""}
          placeholder={t.profile.contactPlaceholder}
          className={input}
        />
      </label>

      {state.error && <p className="text-sm text-rose-600">{state.error}</p>}
      {state.saved && <p className="text-sm text-emerald-600">{t.profile.saved}</p>}

      <button
        disabled={pending}
        className="h-11 rounded-xl bg-zinc-900 font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
      >
        {pending ? t.profile.saving : onboarding ? t.profile.continue : t.profile.save}
      </button>
    </form>
  );
}
