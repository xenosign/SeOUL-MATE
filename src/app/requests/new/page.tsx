import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { getI18n } from "@/i18n/server";
import { RequestForm } from "./request-form";

export default async function NewRequestPage() {
  const profile = await requireProfile();
  if (profile.role !== "traveler") redirect("/requests");
  const { t } = await getI18n();

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">{t.requests.newTitle}</h1>
      <p className="mt-1 text-sm text-zinc-600">{t.requests.newSubtitle}</p>
      <RequestForm defaultLanguages={profile.languages} />
    </div>
  );
}
