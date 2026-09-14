import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../actions";
import { addAdminNote, updateRequestStatus } from "./actions";

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
  const message = typeof params.message === "string" ? params.message : "";
  const error = typeof params.error === "string" ? params.error : "";
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

  const [{ data: customersData }, { data: requests }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,full_name,phone,email,referral_code,referred_by,source,created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("requests")
      .select("id,user_id,service_type,details,status,created_at,updated_at,profiles(full_name,phone,email)")
      .order("created_at", { ascending: false })
  ]);

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

  const totalRequests = requests?.length ?? 0;
  const newRequests = requests?.filter((request) => request.status === "جديد").length ?? 0;
  const activeRequests = requests?.filter((request) => !["مكتمل", "ملغي"].includes(request.status)).length ?? 0;

  return (
    <main className="container section admin-page">
      <div className="top admin-header">
        <div>
          <p className="eyebrow">الإدارة</p>
          <h1>لوحة إدارة مكنون كون</h1>
          <p className="muted">العملاء المسجلون من الموقع وطلبات الخدمات في مكان واحد.</p>
        </div>
        <form action={signOut}><button className="btn alt" type="submit">تسجيل الخروج</button></form>
      </div>

      {message && <div className="notice">تم تنفيذ العملية بنجاح.</div>}
      {error && <div className="notice">تعذر تنفيذ العملية. راجع البيانات وحاول مرة أخرى.</div>}

      <nav className="admin-nav" aria-label="أقسام لوحة الإدارة">
        <a href="#overview">الرئيسية</a>
        <a href="#customers">العملاء</a>
        <a href="#requests">الطلبات</a>
      </nav>

      <section id="overview" className="stat-grid">
        <article className="stat-card">
          <span>إجمالي العملاء</span>
          <strong>{customers.length}</strong>
        </article>
        <article className="stat-card">
          <span>إجمالي الطلبات</span>
          <strong>{totalRequests}</strong>
        </article>
        <article className="stat-card">
          <span>طلبات جديدة</span>
          <strong>{newRequests}</strong>
        </article>
        <article className="stat-card">
          <span>طلبات نشطة</span>
          <strong>{activeRequests}</strong>
        </article>
      </section>

      <section id="customers" className="panel admin-section">
        <div className="top section-heading">
          <div>
            <p className="eyebrow">العملاء</p>
            <h2>سجل العملاء</h2>
            <p className="muted">أي حساب جديد من الموقع يظهر هنا بعد إنشاء ملفه الشخصي.</p>
          </div>
          <span className="status">{filteredCustomers.length} عميل</span>
        </div>

        <form className="admin-search" method="get">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="ابحث بالاسم أو الجوال أو البريد أو كود الإحالة"
          />
          <button className="btn" type="submit">بحث</button>
          {q && <a className="btn alt" href="/admin#customers">إلغاء البحث</a>}
        </form>

        {!filteredCustomers.length ? (
          <p className="muted">{q ? "لا توجد نتائج مطابقة للبحث." : "لا يوجد عملاء مسجلون حتى الآن."}</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>العميل</th>
                  <th>الجوال</th>
                  <th>البريد</th>
                  <th>المصدر</th>
                  <th>كود الإحالة</th>
                  <th>أحاله</th>
                  <th>تاريخ التسجيل</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td><strong>{customer.full_name || "بدون اسم"}</strong></td>
                    <td dir="ltr">{customer.phone || "—"}</td>
                    <td dir="ltr">{customer.email || "—"}</td>
                    <td>{customer.source || "الموقع"}</td>
                    <td dir="ltr">{customer.referral_code || "—"}</td>
                    <td dir="ltr">{customer.referred_by || "—"}</td>
                    <td>{new Date(customer.created_at).toLocaleDateString("ar-SA")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section id="requests" className="admin-section">
        <div className="top section-heading">
          <div>
            <p className="eyebrow">الطلبات</p>
            <h2>إدارة طلبات العملاء</h2>
          </div>
          <span className="status">{totalRequests} طلب</span>
        </div>

        {!requests?.length ? (
          <section className="panel"><p className="muted">لا توجد طلبات حتى الآن.</p></section>
        ) : requests.map((r: any) => (
          <section className="panel request-admin-card" key={r.id}>
            <div className="top">
              <div>
                <h3>{r.service_type}</h3>
                <p className="muted">
                  {r.profiles?.full_name || "عميل"} — {r.profiles?.phone || "بدون جوال"}
                  {r.profiles?.email ? ` — ${r.profiles.email}` : ""}
                </p>
              </div>
              <span className="status">{r.status}</span>
            </div>

            <p>{r.details}</p>
            <small className="muted">{new Date(r.created_at).toLocaleString("ar-SA")}</small>

            <div className="admin-actions-grid">
              <form action={updateRequestStatus}>
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

              <form action={addAdminNote}>
                <input type="hidden" name="request_id" value={r.id} />
                <div className="field">
                  <label>ملاحظة إدارية</label>
                  <textarea name="note" placeholder="اكتب ملاحظة مرتبطة بالطلب..." required />
                </div>
                <button className="btn alt" type="submit">إضافة ملاحظة</button>
              </form>
            </div>
          </section>
        ))}
      </section>
    </main>
  );
}
