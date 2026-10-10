"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { LANGUAGE_OPTIONS, type UserRole } from "@/lib/types";

export type ProfileFormState = { error?: string; saved?: boolean };

export async function updateProfile(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");

  const role = formData.get("role");
  if (role !== "traveler" && role !== "guide") {
    return { error: "Please choose whether you are a traveler or a guide." };
  }
  const displayName = String(formData.get("display_name") ?? "").trim();
  if (!displayName) return { error: "Please enter your name." };

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
      languages,
    })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  if (formData.get("onboarding")) redirect(role === "traveler" ? "/requests/new" : "/requests");
  return { saved: true };
}
