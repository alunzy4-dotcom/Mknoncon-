"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const allowedStatuses = new Set([
  "جديد",
  "قيد المراجعة",
  "بانتظار العميل",
  "قيد التنفيذ",
  "مكتمل",
  "ملغي"
]);

export async function updateRequestStatus(formData: FormData) {
  const requestId = String(formData.get("request_id") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!requestId || !allowedStatuses.has(status)) redirect("/admin?error=invalid_status");

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login");

  const { data: admin } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!admin) redirect("/dashboard");

  const { error } = await supabase
    .from("requests")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", requestId);

  if (error) redirect("/admin?error=update_failed");

  await supabase.from("request_events").insert({
    request_id: requestId,
    actor_id: userId,
    event_type: "status_changed",
    visibility: "customer",
    message: `تم تغيير الحالة إلى: ${status}`
  });

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  redirect("/admin?message=status_updated");
}

export async function addAdminNote(formData: FormData) {
  const requestId = String(formData.get("request_id") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!requestId || note.length < 2) redirect("/admin?error=invalid_note");

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login");

  const { data: admin } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!admin) redirect("/dashboard");

  const { error } = await supabase.from("request_events").insert({
    request_id: requestId,
    actor_id: userId,
    event_type: "note",
    visibility: "internal",
    message: note
  });

  if (error) redirect("/admin?error=note_failed");

  revalidatePath("/admin");
  redirect("/admin?message=note_added");
}
