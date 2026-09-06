import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../actions";
import { createRequest } from "./actions";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardPage({ searchParams }: Props) {
  const params = await searchParams;
  const message = typeof params.message === "string" ? params.message : "";
  const error = typeof params.error === "string" ? params.error : "";
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login");

  const [{ data: profile }, { data: requests }] = await Promise.all([
    supabase.from("profiles").select("full_name,phone,referral_code").eq("id", userId).maybeSingle(),
    supabase.from("requests").select("id,service_type,details,status,created_at").eq("user_id", userId).order("created_at", { ascending: false })
  ]);

  return (
    <main className="container section">
      <div className="top">
        <div>
          <p className="eyebrow">لوحة العميل</p>
          <h1>مرحبًا {profile?.full_name || ""}</h1>
        </div>
        <form action={signOut}><button className="btn alt" type="submit">تسجيل الخروج</button></form>
      </div>

      {message === "request_created" && <div className="notice">تم إرسال طلبك بنجاح.</div>}
      {error === "invalid_request" && <div className="notice">اكتب تفاصيل الطلب بشكل أوضح قبل الإرسال.</div>}
      {error === "request_failed" && <div className="notice">تعذر حفظ الطلب. لم يتم فقدان الجلسة؛ حاول مرة أخرى.</div>}

      <section className="panel">
        <h2>بيانات الحساب</h2>
        <p className="muted">{profile?.phone || "—"}</p>
        <p>كود الإحالة: <strong>{profile?.referral_code || "—"}</strong></p>
      </section>

      <section className="panel">
        <h2>طلب جديد</h2>
        <form action={createRequest}>
          <div className="field">
            <label>نوع الخدمة</label>
            <select name="service_type" required>
              <option value="">اختر الخدمة</option>
              <option>استشارات مالية</option>
              <option>حلول أعمال</option>
              <option>دراسة جدوى</option>
              <option>خدمات عقارية</option>
              <option>خدمات حكومية</option>
              <option>حلول رقمية</option>
              <option>أخرى</option>
            </select>
          </div>
          <div className="field"><label>تفاصيل الطلب</label><textarea name="details" required /></div>
          <button className="btn" type="submit">إرسال الطلب</button>
        </form>
      </section>

      <section className="panel">
        <h2>طلباتي</h2>
        {!requests?.length ? <p className="muted">لا توجد طلبات حتى الآن.</p> : requests.map((r) => (
          <article className="request" key={r.id}>
            <div className="top"><strong>{r.service_type}</strong><span className="status">{r.status}</span></div>
            <p>{r.details}</p>
            <small className="muted">{new Date(r.created_at).toLocaleString("ar-SA")}</small>
            <p><Link href={`/dashboard/requests/${r.id}`}>عرض تفاصيل الطلب وسجل التحديثات</Link></p>
          </article>
        ))}
      </section>
    </main>
  );
}
