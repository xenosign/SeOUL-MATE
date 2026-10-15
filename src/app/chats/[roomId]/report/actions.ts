"use server";

import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getI18n } from "@/i18n/server";
import { REPORT_REASONS, type ReportReason } from "@/lib/types";

export type ReportFormState = { error?: string; done?: "sent" | "already" };

export async function reportUser(
  roomId: string,
  _prev: ReportFormState,
  formData: FormData,
): Promise<ReportFormState> {
  const profile = await requireProfile();
  const { t } = await getI18n();

  const reason = String(formData.get("reason") ?? "");
  if (!(REPORT_REASONS as readonly string[]).includes(reason)) {
    return { error: t.report.errors.reason };
  }
  const details = String(formData.get("details") ?? "").trim().slice(0, 1000);

  const supabase = await createClient();
  // RLS only returns the room to its participants; the reported user is always the other one
  const { data: room } = await supabase
    .from("chat_rooms")
    .select("traveler_id, guide_id")
    .eq("id", roomId)
    .maybeSingle();
  if (!room) return { error: t.report.errors.failed };
  const reportedUserId = room.traveler_id === profile.id ? room.guide_id : room.traveler_id;

  // RLS only allows reporting someone who has sent at least one message in this room
  const { count } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("room_id", roomId)
    .eq("sender_id", reportedUserId);
  if (!count) return { error: t.report.errors.noMessages };

  const { error } = await supabase.from("reports").insert({
    reporter_id: profile.id,
    reported_user_id: reportedUserId,
    room_id: roomId,
    reason: reason as ReportReason,
    details,
  });
  if (error) {
    // unique (reporter_id, reported_user_id, room_id)
    if (error.code === "23505") return { done: "already" };
    // prepare_report trigger: 10 reports per day
    if (error.code === "P0001") return { error: t.report.errors.limit };
    return { error: t.report.errors.failed };
  }
  return { done: "sent" };
}
