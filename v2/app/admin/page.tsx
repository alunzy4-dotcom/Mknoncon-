import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../actions";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type Customer = {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  referral_code: string;
  referred_by: string | null;
  source: string;
  created_at: string;
};

export const dynamic = "force-dynamic";

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("ar");
}

export default async function AdminPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";

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

  const { data: customersData } = await supabase
    .from("profiles")
    .select("id,full_name,phone,email,referral_code,referred_by,source,created_at")
    .order("created_at", { ascending: false });

  const customers = (customersData ?? []) as Customer[];
  const query = normalize(q);
  const filteredCustomers = query
    ? customers.filter((customer) =>
        [
          customer.full_name,
          customer.phone,
          customer.email,
          customer.referral_code,
          customer.referred_by ?? ""
        ].some((value) => normalize(value).includes(query))
      )
    : customers;

  const referredCustomers = customers.filter((customer) => customer.referred_by).length;
  const websiteCustomers = customers.filter((customer) => customer.source === "الموقع").length;

  return (
    <main className="container section">
      <div className="top">
        <div>
          <p className="eyebrow">الإدارة</p>
          <h1>لوحة إدارة مكنون كون</h1>
          <p className="muted">إدارة العملاء المسجلين في الموقع، بينما تعبئة الطلبات تتم عبر Tally.</p>
        </div>
        <form action={signOut}><button className="btn alt" type="submit">تسجيل الخروج</button></form>
      </div>

      <div className="grid cards">
        <article className="card">
          <p className="muted">إجمالي العملاء</p>
          <h2>{customers.length}</h2>
        </article>
        <article className="card">
          <p className="muted">مسجلون من الموقع</p>
          <h2>{websiteCustomers}</h2>
        </article>
        <article className="card">
          <p className="muted">عملاء بالإحالة</p>
          <h2>{referredCustomers}</h2>
        </article>
      </div>

      <section className="panel" style={{ marginTop: 24 }}>
        <div className="top">
          <div>
            <p className="eyebrow">العملاء</p>
            <h2>سجل العملاء</h2>
          </div>
          <span className="status">{filteredCustomers.length} عميل</span>
        </div>

        <form method="get" style={{ margin: "18px 0" }}>
          <div className="field">
            <label htmlFor="q">بحث</label>
            <input
              id="q"
              type="search"
              name="q"
              defaultValue={q}
              placeholder="الاسم أو الجوال أو البريد أو كود الإحالة"
            />
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn" type="submit">بحث</button>
            {q && <a className="btn alt" href="/admin">إلغاء البحث</a>}
          </div>
        </form>

        {!filteredCustomers.length ? (
          <p className="muted">{q ? "لا توجد نتائج مطابقة للبحث." : "لا يوجد عملاء مسجلون حتى الآن."}</p>
        ) : (
          <div className="grid">
            {filteredCustomers.map((customer) => (
              <article className="card" key={customer.id}>
                <div className="top">
                  <div>
                    <h3>{customer.full_name || "بدون اسم"}</h3>
                    <p className="muted" dir="ltr">{customer.email || "بدون بريد"}</p>
                  </div>
                  <span className="status">{customer.source || "الموقع"}</span>
                </div>
                <p><strong>الجوال:</strong> <span dir="ltr">{customer.phone || "—"}</span></p>
                <p><strong>كود الإحالة:</strong> <span dir="ltr">{customer.referral_code || "—"}</span></p>
                <p><strong>المُحيل:</strong> <span dir="ltr">{customer.referred_by || "—"}</span></p>
                <small className="muted">تاريخ التسجيل: {new Date(customer.created_at).toLocaleDateString("ar-SA")}</small>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="panel" style={{ marginTop: 24 }}>
        <p className="eyebrow">الطلبات</p>
        <h2>طلبات الخدمات عبر Tally</h2>
        <p className="muted">العميل يختار الخدمة من لوحة حسابه ثم يكمل نموذج الطلب في Tally. الربط التلقائي لنتائج Tally داخل لوحة الإدارة سيكون خطوة مستقلة.</p>
      </section>
    </main>
  );
}
