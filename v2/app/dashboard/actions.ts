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
  if (!claims?.claims?.sub) redirect("/login");

  const { error } = await supabase.rpc("create_customer_request", {
    p_service_type: serviceType,
    p_details: details
  });

  if (error) {
    redirect("/dashboard?error=request_failed");
  }

  revalidatePath("/dashboard");
  redirect("/dashboard?message=request_created");
}
