"use client";

import { useActionState } from "react";
import Link from "next/link";
import { REPORT_REASONS } from "@/lib/types";
import { useI18n } from "@/i18n/client";
import { reportUser, type ReportFormState } from "./actions";

export function ReportForm({ roomId }: { roomId: string }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState<ReportFormState, FormData>(
    reportUser.bind(null, roomId),
    {},
  );

  if (state.done) {
    return (
      <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6">
        <p className="font-medium">{state.done === "sent" ? t.report.done : t.report.already}</p>
        <Link href={`/chats/${roomId}`} className="mt-4 inline-block text-sm text-brand-600 hover:underline">
          {t.report.back}
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="mt-8 flex flex-col gap-6">
      <fieldset>
        <legend className="text-sm font-medium">{t.report.reason}</legend>
        <div className="mt-2 flex flex-col gap-2">
          {REPORT_REASONS.map((reason) => (
            <label
              key={reason}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm has-[:checked]:border-brand-400 has-[:checked]:ring-2 has-[:checked]:ring-brand-100"
            >
              <input type="radio" name="reason" value={reason} required className="accent-brand-500" />
              {t.report.reasons[reason]}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="text-sm font-medium">
        {t.report.details}
        <textarea
          name="details"
          rows={4}
          maxLength={1000}
          placeholder={t.report.detailsPlaceholder}
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
      </label>

      {state.error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>
      )}

      <button
        disabled={pending}
        className="h-12 rounded-xl bg-zinc-900 font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
      >
        {pending ? t.report.sending : t.report.submit}
      </button>
    </form>
  );
}
