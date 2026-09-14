import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FinanceAnalyzer from "./FinanceAnalyzer";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;

  if (!userId) redirect("/login");

  return (
    <main className="container section">
      <div className="top no-print finance-back">
        <Link className="btn alt" href="/dashboard">العودة للوحة العميل</Link>
      </div>
      <FinanceAnalyzer userId={userId} />
    </main>
  );
}
