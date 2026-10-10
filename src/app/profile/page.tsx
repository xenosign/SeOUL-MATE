import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { Avatar } from "@/components/avatar";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage({ searchParams }: PageProps<"/profile">) {
  const { onboarding } = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const isOnboarding = Boolean(onboarding) || !profile.role;

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10">
      <div className="flex items-center gap-4">
        <Avatar src={profile.avatar_url} name={profile.display_name} size={56} />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isOnboarding ? "Set up your profile" : "My profile"}
          </h1>
          <p className="text-sm text-zinc-600">
            {isOnboarding
              ? "Tell us a bit about yourself so travelers and guides can get to know you."
              : "This is what others see when you chat."}
          </p>
        </div>
      </div>

      <ProfileForm profile={profile} onboarding={isOnboarding} />

      {!isOnboarding && (
        <form action="/auth/signout" method="post" className="mt-10 border-t border-zinc-200 pt-6">
          <button className="text-sm text-zinc-500 hover:text-zinc-900">Sign out</button>
        </form>
      )}
    </div>
  );
}
