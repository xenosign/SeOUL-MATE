"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { LANGUAGE_OPTIONS, type UserRole } from "@/lib/types";
import { getI18n } from "@/i18n/server";
import { normalizeInstagram } from "@/lib/instagram";
import { parseAttribution, UTM_COOKIE } from "@/lib/acquisition";

export type ProfileFormState = { error?: string; saved?: boolean };

export async function updateProfile(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");
  const { t } = await getI18n();

  const role = formData.get("role");
  if (role !== "traveler" && role !== "guide") {
    return { error: t.profile.errors.role };
  }
  const displayName = String(formData.get("display_name") ?? "").trim();
  if (!displayName) return { error: t.profile.errors.name };
  // Optional: empty → null, otherwise must be a valid username
  const instagramInput = String(formData.get("instagram") ?? "").trim();
  const instagram = instagramInput ? normalizeInstagram(instagramInput) : null;
  if (instagramInput && !instagram) return { error: t.profile.errors.instagram };

  const languages = formData
    .getAll("languages")
    .map(String)
    .filter((l) => (LANGUAGE_OPTIONS as readonly string[]).includes(l));

  const { error } = await supabase
    .from("profiles")
    .update({
      role: role as UserRole,
      display_name: displayName.slice(0, 50),
      nationality: String(formData.get("nationality") ?? "").trim().slice(0, 50) || null,
      bio: String(formData.get("bio") ?? "").trim().slice(0, 500) || null,
      contact: String(formData.get("contact") ?? "").trim().slice(0, 100) || null,
      instagram,
      languages,
    })
    .eq("id", userId);

  if (error) {
    // unique index profiles_instagram_key
    if (error.code === "23505") return { error: t.profile.errors.instagramTaken };
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  if (formData.get("onboarding")) {
    await recordSignupAttribution(supabase, userId, role);
    redirect(role === "traveler" ? "/requests/new" : "/requests");
  }
  return { saved: true };
}

/** Records the acquisition channel once, when onboarding finishes. Never blocks onboarding. */
async function recordSignupAttribution(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  role: UserRole,
) {
  const cookieStore = await cookies();
  const utm = parseAttribution(cookieStore.get(UTM_COOKIE)?.value);
  // A row without utm_source counts as a direct / unknown signup
  const { error } = await supabase.from("signup_attributions").insert({
    user_id: userId,
    role,
    utm_source: utm?.source ?? null,
    utm_medium: utm?.medium ?? null,
    utm_campaign: utm?.campaign ?? null,
    landing_path: utm?.landing ?? null,
    first_visit_at: utm?.at ?? null,
  });
  // 23505: already recorded (e.g. onboarding form submitted twice)
  if (!error || error.code === "23505") cookieStore.delete(UTM_COOKIE);
}
