"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/profile";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) redirect("/login?error=invalid_login");

  try {
    await ensureProfile(supabase, data.user);
  } catch {
    redirect("/login?error=profile_setup");
  }

  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const referralCode = String(formData.get("referral_code") ?? "").trim();

  if (fullName.length < 2 || phone.length < 8 || password.length < 8) {
    redirect("/login?mode=signup&error=invalid_signup_data");
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
      data: {
        full_name: fullName,
        phone,
        referral_code: referralCode || null
      }
    }
  });

  if (error || !data.user) redirect("/login?mode=signup&error=signup_failed");

  if (data.session) {
    try {
      await ensureProfile(supabase, data.user);
    } catch {
      redirect("/login?mode=signup&error=profile_setup");
    }
    redirect("/dashboard");
  }

  redirect("/login?message=check_email");
}

export async function sendPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/reset/callback`
  });

  redirect("/forgot-password?message=sent");
}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");

  if (password.length < 8 || password !== confirm) {
    redirect("/reset-password?error=invalid_password");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) redirect("/reset-password?error=update_failed");
  redirect("/login?message=password_updated");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
