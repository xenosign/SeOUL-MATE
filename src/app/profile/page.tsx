import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { getI18n } from "@/i18n/server";
import { Avatar } from "@/components/avatar";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage({ searchParams }: PageProps<"/profile">) {
  const { onboarding } = await searchParams;
  const [profile, { t }] = await Promise.all([getCurrentProfile(), getI18n()]);
  if (!profile) redirect("/login");

  const isOnboarding = Boolean(onboarding) || !profile.role || !profile.instagram;

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10">
      <div className="flex items-center gap-4">
        <Avatar src={profile.avatar_url} name={profile.display_name} size={56} />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isOnboarding ? t.profile.setupTitle : t.profile.title}
          </h1>
          <p className="text-sm text-zinc-600">
            {isOnboarding ? t.profile.setupSubtitle : t.profile.subtitle}
          </p>
        </div>
      </div>

      <ProfileForm profile={profile} onboarding={isOnboarding} />

      {!isOnboarding && (
        <form action="/auth/signout" method="post" className="mt-10 border-t border-zinc-200 pt-6">
          <button className="text-sm text-zinc-500 hover:text-zinc-900">{t.nav.signOut}</button>
        </form>
      )}
    </div>
  );
}
