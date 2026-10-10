"use client";

import { useActionState } from "react";
import { LANGUAGE_OPTIONS, type Profile } from "@/lib/types";
import { updateProfile, type ProfileFormState } from "./actions";

const input =
  "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100";

const ROLES = [
  { value: "traveler", label: "Traveler", desc: "I'm visiting Seoul and want a local guide" },
  { value: "guide", label: "Volunteer guide", desc: "I live in Seoul and want to help travelers" },
] as const;

export function ProfileForm({ profile, onboarding }: { profile: Profile; onboarding: boolean }) {
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(updateProfile, {});

  return (
    <form action={action} className="mt-8 flex flex-col gap-6">
      {onboarding && <input type="hidden" name="onboarding" value="1" />}

      <fieldset>
        <legend className="text-sm font-medium">I am a…</legend>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {ROLES.map((r) => (
            <label
              key={r.value}
              className="cursor-pointer rounded-xl border border-zinc-300 bg-white p-4 has-[:checked]:border-rose-400 has-[:checked]:ring-2 has-[:checked]:ring-rose-100"
            >
              <input
                type="radio"
                name="role"
                value={r.value}
                defaultChecked={profile.role === r.value}
                className="sr-only"
                required
              />
              <span className="block font-medium">{r.label}</span>
              <span className="mt-1 block text-xs text-zinc-500">{r.desc}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="text-sm font-medium">
        Name
        <input name="display_name" defaultValue={profile.display_name} required className={input} />
      </label>

      <label className="text-sm font-medium">
        Nationality
        <input
          name="nationality"
          defaultValue={profile.nationality ?? ""}
          placeholder="e.g. United States"
          className={input}
        />
      </label>

      <fieldset>
        <legend className="text-sm font-medium">Languages I speak</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {LANGUAGE_OPTIONS.map((lang) => (
            <label
              key={lang}
              className="cursor-pointer rounded-full border border-zinc-300 bg-white px-3 py-1 text-sm has-[:checked]:border-rose-400 has-[:checked]:bg-rose-50 has-[:checked]:text-rose-700"
            >
              <input
                type="checkbox"
                name="languages"
                value={lang}
                defaultChecked={profile.languages.includes(lang)}
                className="sr-only"
              />
              {lang}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="text-sm font-medium">
        About me
        <textarea
          name="bio"
          rows={4}
          defaultValue={profile.bio ?? ""}
          placeholder="Interests, favorite places in Seoul, travel style…"
          className={input}
        />
      </label>

      <label className="text-sm font-medium">
        Other contact{" "}
        <span className="font-normal text-zinc-500">(optional, shown to chat partners)</span>
        <input
          name="contact"
          defaultValue={profile.contact ?? ""}
          placeholder="KakaoTalk ID, Instagram, WhatsApp…"
          className={input}
        />
      </label>

      {state.error && <p className="text-sm text-rose-600">{state.error}</p>}
      {state.saved && <p className="text-sm text-emerald-600">Saved!</p>}

      <button
        disabled={pending}
        className="h-11 rounded-xl bg-zinc-900 font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
      >
        {pending ? "Saving…" : onboarding ? "Continue" : "Save"}
      </button>
    </form>
  );
}
