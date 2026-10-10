import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { RequestForm } from "./request-form";

export default async function NewRequestPage() {
  const profile = await requireProfile();
  if (profile.role !== "traveler") redirect("/requests");

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Request a local guide</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Volunteers will see your request together with your profile and message you.
      </p>
      <RequestForm defaultLanguages={profile.languages} />
    </div>
  );
}
