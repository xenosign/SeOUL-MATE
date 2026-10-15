import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.volunteer.metaTitle, description: t.volunteer.intro };
}

/** Public landing page for recruiting volunteer guides (linked from posts, QR codes, etc.). */
export default async function VolunteerPage() {
  const [profile, { t }] = await Promise.all([getCurrentProfile(), getI18n()]);

  let cta: { href: string; label: string; note?: string };
  if (!profile) {
    cta = { href: `/login?next=${encodeURIComponent("/profile?role=guide")}`, label: t.volunteer.cta };
  } else if (!profile.role) {
    cta = { href: "/profile?role=guide", label: t.volunteer.cta };
  } else if (profile.role === "guide") {
    cta = { href: "/requests", label: t.volunteer.ctaGuide };
  } else {
    cta = { href: "/profile", label: t.volunteer.ctaProfile, note: t.volunteer.ctaSwitch };
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-16 sm:py-24">
      <section className="max-w-2xl">
        <p className="text-sm font-semibold text-brand-500">{t.volunteer.eyebrow}</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{t.volunteer.title}</h1>
        <p className="mt-5 text-lg text-zinc-600">{t.volunteer.intro}</p>
        <div className="mt-8">
          <Link
            href={cta.href}
            className="inline-block rounded-xl bg-brand-500 px-5 py-3 font-medium text-white hover:bg-brand-600"
          >
            {cta.label}
          </Link>
          {cta.note && <p className="mt-3 text-sm text-zinc-500">{cta.note}</p>}
        </div>
      </section>

      <section className="mt-20">
        <h2 className="text-xl font-bold tracking-tight">{t.volunteer.stepsTitle}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {t.volunteer.steps.map((step, i) => (
            <div key={i} className="rounded-2xl border border-zinc-200 bg-white p-6">
              <span className="text-sm font-semibold text-brand-500">0{i + 1}</span>
              <h3 className="mt-2 font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-zinc-600">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="font-semibold">{t.volunteer.principlesTitle}</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-600">
          {t.volunteer.principles.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
