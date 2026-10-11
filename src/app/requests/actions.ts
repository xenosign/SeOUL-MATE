"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { getI18n } from "@/i18n/server";
import { LANGUAGE_OPTIONS, type RequestStatus } from "@/lib/types";

export type RequestFormState = { error?: string };

export async function createRequest(
  _prev: RequestFormState,
  formData: FormData,
): Promise<RequestFormState> {
  const profile = await requireProfile();
  const { t } = await getI18n();
  if (profile.role !== "traveler") return { error: t.requests.errors.travelerOnly };

  const title = String(formData.get("title") ?? "").trim();
  const area = String(formData.get("area") ?? "").trim();
  const travelDate = String(formData.get("travel_date") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const durationHours = Number(formData.get("duration_hours") ?? 3);
  const groupSize = Number(formData.get("group_size") ?? 1);
  const languages = formData
    .getAll("languages")
    .map(String)
    .filter((l) => (LANGUAGE_OPTIONS as readonly string[]).includes(l));

  if (!title || !area || !/^\d{4}-\d{2}-\d{2}$/.test(travelDate)) {
    return { error: t.requests.errors.required };
  }
  if (travelDate < new Date().toISOString().slice(0, 10)) {
    return { error: t.requests.errors.pastDate };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("guide_requests")
    .insert({
      traveler_id: profile.id,
      title: title.slice(0, 100),
      area: area.slice(0, 100),
      travel_date: travelDate,
      description: description.slice(0, 2000),
      duration_hours: Math.min(12, Math.max(1, Math.round(durationHours) || 3)),
      group_size: Math.min(20, Math.max(1, Math.round(groupSize) || 1)),
      languages,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/requests");
  redirect(`/requests/${data.id}`);
}

/** Guide reaches out to a traveler: opens (or reuses) a 1:1 chat room for the request. */
export async function startChat(requestId: string) {
  const profile = await requireProfile();
  if (profile.role !== "guide") throw new Error("Only guides can contact travelers.");

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("chat_rooms")
    .select("id")
    .eq("request_id", requestId)
    .eq("guide_id", profile.id)
    .maybeSingle();
  if (existing) redirect(`/chats/${existing.id}`);

  const { data: request } = await supabase
    .from("guide_requests")
    .select("traveler_id")
    .eq("id", requestId)
    .single();
  if (!request) throw new Error("Request not found.");

  const { data: room, error } = await supabase
    .from("chat_rooms")
    .insert({ request_id: requestId, traveler_id: request.traveler_id, guide_id: profile.id })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  revalidatePath("/chats");
  redirect(`/chats/${room.id}`);
}

/** Traveler picks a guide for their request. */
export async function acceptGuide(requestId: string, guideId: string) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("guide_requests")
    .update({ status: "matched", matched_guide_id: guideId })
    .eq("id", requestId)
    .eq("traveler_id", profile.id)
    .eq("status", "open");
  if (error) throw new Error(error.message);

  revalidatePath(`/requests/${requestId}`);
  revalidatePath("/requests");
}

/** Traveler marks a request completed / cancelled, or reopens it. */
export async function setRequestStatus(requestId: string, status: RequestStatus) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const patch: { status: RequestStatus; matched_guide_id?: null } = { status };
  if (status === "open") patch.matched_guide_id = null;

  const { error } = await supabase
    .from("guide_requests")
    .update(patch)
    .eq("id", requestId)
    .eq("traveler_id", profile.id);
  if (error) throw new Error(error.message);

  revalidatePath(`/requests/${requestId}`);
  revalidatePath("/requests");
}
