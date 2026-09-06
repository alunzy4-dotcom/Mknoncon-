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

async function requireAdmin() {
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
  return supabase;
}

export async function updateRequestStatus(formData: FormData) {
  const requestId = String(formData.get("request_id") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!requestId || !allowedStatuses.has(status)) {
    redirect("/admin?error=invalid_status");
  }

  const supabase = await requireAdmin();
  const { error } = await supabase.rpc("admin_update_request_status", {
    p_request_id: requestId,
    p_status: status
  });

  if (error) redirect("/admin?error=update_failed");

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  redirect("/admin?message=status_updated");
}

export async function addAdminNote(formData: FormData) {
  const requestId = String(formData.get("request_id") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (!requestId || note.length < 2) {
    redirect("/admin?error=invalid_note");
  }

  const supabase = await requireAdmin();
  const { error } = await supabase.rpc("admin_add_request_note", {
    p_request_id: requestId,
    p_note: note
  });

  if (error) redirect("/admin?error=note_failed");

  revalidatePath("/admin");
  redirect("/admin?message=note_added");
}
