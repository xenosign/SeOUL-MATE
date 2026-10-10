import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/** Returns the signed-in user's profile, or null. Deduplicated per request. */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, role, nationality, languages, bio, contact")
    .eq("id", userId)
    .single();

  return (profile as Profile | null) ?? null;
});

/** Requires a signed-in user who has finished onboarding (picked a role). */
export async function requireProfile(): Promise<Profile & { role: NonNullable<Profile["role"]> }> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!profile.role) redirect("/profile?onboarding=1");
  return profile as Profile & { role: NonNullable<Profile["role"]> };
}
