import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../actions";
import { addAdminNote, updateRequestStatus } from "./actions";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }: Props) {
  const params = await searchParams;
  const message = typeof params.message === "string" ? params.message : "";
  const error = typeof params.error === "string" ? params.error : "";

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login");

  const { data: admin } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!admin) redirect("/dashboard");

  const { data: requests } = await supabase
    .from("requests")
    .select("id,user_id,service_type,details,status,created_at,updated_at,profiles(full_name,phone)")
    .order("created_at", { ascending: false });

  return (
    <main className="container section">
      <div className="top">
        <div>
          <p className="eyebrow">الإدارة</p>
          <h1>إدارة طلبات مكنون كون</h1>
        </div>
        <form action={signOut}><button className="btn alt" type="submit">تسجيل الخروج</button></form>
      </div>

      {message && <div className="notice">تم تنفيذ العملية بنجاح.</div>}
      {error && <div className="notice">تعذر تنفيذ العملية. راجع البيانات وحاول مرة أخرى.</div>}

      {!requests?.length ? (
        <section className="panel"><p className="muted">لا توجد طلبات حتى الآن.</p></section>
      ) : requests.map((r: any) => (
        <section className="panel" key={r.id}>
          <div className="top">
            <div>
              <h2>{r.service_type}</h2>
              <p className="muted">{r.profiles?.full_name || "عميل"} — {r.profiles?.phone || "بدون جوال"}</p>
            </div>
            <span className="status">{r.status}</span>
          </div>

          <p>{r.details}</p>
          <small className="muted">{new Date(r.created_at).toLocaleString("ar-SA")}</small>

          <form action={updateRequestStatus} style={{ marginTop: 16 }}>
            <input type="hidden" name="request_id" value={r.id} />
            <div className="field">
              <label>تغيير الحالة</label>
              <select name="status" defaultValue={r.status}>
                <option>جديد</option>
                <option>قيد المراجعة</option>
                <option>بانتظار العميل</option>
                <option>قيد التنفيذ</option>
                <option>مكتمل</option>
                <option>ملغي</option>
              </select>
            </div>
            <button className="btn" type="submit">حفظ الحالة</button>
          </form>

          <form action={addAdminNote} style={{ marginTop: 16 }}>
            <input type="hidden" name="request_id" value={r.id} />
            <div className="field">
              <label>ملاحظة إدارية</label>
              <textarea name="note" placeholder="اكتب ملاحظة مرتبطة بالطلب..." required />
            </div>
            <button className="btn alt" type="submit">إضافة ملاحظة</button>
          </form>
        </section>
      ))}
    </main>
  );
}
