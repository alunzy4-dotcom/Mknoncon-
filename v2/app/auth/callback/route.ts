import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/profile";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login?error=auth_callback", origin));
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    try {
      await ensureProfile(supabase, user);
    } catch {
      return NextResponse.redirect(new URL("/login?error=profile_setup", origin));
    }
  }

  return NextResponse.redirect(new URL(next, origin));
}
