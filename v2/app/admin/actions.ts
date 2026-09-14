"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const allowedLeadStatuses = new Set([
  "new",
  "contacted",
  "in_progress",
  "completed",
  "closed"
]);

async function requireAdmin() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login?next=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.role !== "admin") redirect("/dashboard");
  return supabase;
}

export async function updateLeadStatus(formData: FormData) {
  const leadId = String(formData.get("lead_id") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!leadId || !allowedLeadStatuses.has(status)) {
    redirect("/admin?error=invalid_lead_status#leads");
  }

  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("leads")
    .update({ status })
    .eq("id", leadId);

  if (error) redirect("/admin?error=lead_update_failed#leads");

  revalidatePath("/admin");
  redirect("/admin?message=lead_updated#leads");
}
