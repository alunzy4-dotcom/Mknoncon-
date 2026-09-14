import type { SupabaseClient, User } from "@supabase/supabase-js";

export async function ensureProfile(supabase: SupabaseClient, user: User) {
  const { data: existing, error: selectError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) return;

  const metadata = user.user_metadata ?? {};
  const referralCode = user.id.replaceAll("-", "").slice(0, 8).toUpperCase();

  const { error } = await supabase.from("profiles").insert({
    id: user.id,
    full_name: String(metadata.full_name ?? ""),
    phone: String(metadata.phone ?? ""),
    email: String(user.email ?? ""),
    source: "الموقع",
    referral_code: referralCode,
    referred_by: metadata.referral_code ? String(metadata.referral_code) : null
  });

  if (error) throw error;
}
