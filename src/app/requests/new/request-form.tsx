"use client";

import { useActionState } from "react";
import { LANGUAGE_OPTIONS } from "@/lib/types";
import { useI18n } from "@/i18n/client";
import { createRequest, type RequestFormState } from "../actions";

const input =
  "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100";

export function RequestForm({ defaultLanguages }: { defaultLanguages: string[] }) {
  const { t } = useI18n();
  const f = t.requests.form;
  const [state, action, pending] = useActionState<RequestFormState, FormData>(createRequest, {});
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={action} className="mt-8 flex flex-col gap-5">
      <label className="text-sm font-medium">
        {f.title}
        <input name="title" required maxLength={100} placeholder={f.titlePlaceholder} className={input} />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="text-sm font-medium">
          {f.area}
          <input name="area" required placeholder={f.areaPlaceholder} className={input} />
        </label>
        <label className="text-sm font-medium">
          {f.date}
          <input name="travel_date" type="date" required min={today} className={input} />
        </label>
        <label className="text-sm font-medium">
          {f.duration}
          <input name="duration_hours" type="number" min={1} max={12} defaultValue={3} className={input} />
        </label>
        <label className="text-sm font-medium">
          {f.groupSize}
          <input name="group_size" type="number" min={1} max={20} defaultValue={1} className={input} />
        </label>
      </div>

      <fieldset>
        <legend className="text-sm font-medium">{f.languages}</legend>
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
                defaultChecked={defaultLanguages.includes(lang)}
                className="sr-only"
              />
              {t.spokenLanguages[lang]}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="text-sm font-medium">
        {f.description}
        <textarea
          name="description"
          rows={5}
          maxLength={2000}
          placeholder={f.descriptionPlaceholder}
          className={input}
        />
      </label>

      {state.error && <p className="text-sm text-rose-600">{state.error}</p>}

      <button
        disabled={pending}
        className="h-11 rounded-xl bg-rose-500 font-medium text-white hover:bg-rose-600 disabled:opacity-60"
      >
        {pending ? f.posting : f.post}
      </button>
    </form>
  );
}
