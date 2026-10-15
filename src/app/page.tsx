import Link from "next/link";
import { getI18n } from "@/i18n/server";

export default async function Home() {
  const { t } = await getI18n();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-16 sm:py-24">
      <section className="max-w-2xl">
        <p className="text-sm font-semibold text-brand-500">{t.home.eyebrow}</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{t.home.title}</h1>
        <p className="mt-5 text-lg text-zinc-600">{t.home.intro}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/requests/new"
            className="rounded-xl bg-brand-500 px-5 py-3 font-medium text-white hover:bg-brand-600"
          >
            {t.home.cta}
          </Link>
          <Link
            href="/volunteer"
            className="rounded-xl border border-zinc-300 bg-white px-5 py-3 font-medium hover:bg-zinc-50"
          >
            {t.home.volunteerCta}
          </Link>
        </div>
      </section>

      <section className="mt-20 grid gap-4 sm:grid-cols-3">
        {t.home.steps.map((step, i) => (
          <div key={i} className="rounded-2xl border border-zinc-200 bg-white p-6">
            <span className="text-sm font-semibold text-brand-500">0{i + 1}</span>
            <h2 className="mt-2 font-semibold">{step.title}</h2>
            <p className="mt-2 text-sm text-zinc-600">{step.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
