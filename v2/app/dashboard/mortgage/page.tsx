import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MortgageCalculator from "./MortgageCalculator";

export const dynamic = "force-dynamic";

export default async function MortgagePage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login?next=%2Fdashboard%2Fmortgage");

  return (
    <main className="container section">
      <div className="finance-back no-print">
        <Link href="/dashboard">← العودة إلى لوحة العميل</Link>
      </div>
      <MortgageCalculator />
    </main>
  );
}
