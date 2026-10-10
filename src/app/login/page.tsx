import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { LoginButtons } from "./login-buttons";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, error } = await searchParams;
  const profile = await getCurrentProfile();
  if (profile) redirect(typeof next === "string" ? next : "/requests");

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
      <h1 className="text-2xl font-bold tracking-tight">Welcome to SeOUL MATE</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Sign in to request a free local guide, or to volunteer as one.
      </p>
      {error && (
        <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          Sign-in failed. Please try again.
        </p>
      )}
      <LoginButtons next={typeof next === "string" ? next : undefined} />
    </div>
  );
}
