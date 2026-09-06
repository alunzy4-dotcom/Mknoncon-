"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createRequest(formData: FormData) {
  const serviceType = String(formData.get("service_type") ?? "").trim();
  const details = String(formData.get("details") ?? "").trim();

  if (!serviceType || details.length < 5) {
    redirect("/dashboard?error=invalid_request");
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login");

  const { data: requestRow, error } = await supabase
    .from("requests")
    .insert({
      user_id: userId,
      service_type: serviceType,
      details
    })
    .select("id")
    .single();

  if (error || !requestRow) {
    redirect("/dashboard?error=request_failed");
  }

  await supabase.from("request_events").insert({
    request_id: requestRow.id,
    actor_id: userId,
    event_type: "created",
    message: "تم إنشاء الطلب"
  });

  revalidatePath("/dashboard");
  redirect("/dashboard?message=request_created");
}
