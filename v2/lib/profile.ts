import type { SupabaseClient, User } from "@supabase/supabase-js";

export async function ensureProfile(supabase: SupabaseClient, user: User) {
  const metadata = user.user_metadata ?? {};
  const referralCode = user.id.replaceAll("-", "").slice(0, 8).toUpperCase();

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      full_name: String(metadata.full_name ?? ""),
      phone: String(metadata.phone ?? ""),
      referral_code: referralCode,
      referred_by: metadata.referral_code ? String(metadata.referral_code) : null
    },
    { onConflict: "id", ignoreDuplicates: true }
  );

  if (error) throw error;
}
