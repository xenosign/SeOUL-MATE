"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { LANGUAGE_OPTIONS, type UserRole } from "@/lib/types";
import { getI18n } from "@/i18n/server";
import { normalizeInstagram } from "@/lib/instagram";

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
  if (formData.get("onboarding")) redirect(role === "traveler" ? "/requests/new" : "/requests");
  return { saved: true };
}
