"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createRequest(formData: FormData) {
  const serviceType = String(formData.get("service_type") ?? "").trim();
  const details = String(formData.get("details") ?? "").trim();
  if (!serviceType || !details) return;

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return;

  await supabase.from("requests").insert({
    user_id: userId,
    service_type: serviceType,
    details
  });

  revalidatePath("/dashboard");
}
