import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../actions";
import { updateLeadStatus } from "./actions";

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
  role: "client" | "staff" | "admin";
  marketing_consent: boolean;
  created_at: string;
};

type Lead = {
  id: string;
  source: string;
  form_id: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  service: string | null;
  message: string | null;
  marketing_consent: boolean;
  status: string;
  created_at: string;
};

export const dynamic = "force-dynamic";

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("ar");
}

const statusLabels: Record<string, string> = {
  new: "جديد",
  contacted: "تم التواصل",
  in_progress: "قيد المتابعة",
  completed: "مكتمل",
  closed: "مغلق"
};

export default async function AdminPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const message = typeof params.message === "string" ? params.message : "";
  const error = typeof params.error === "string" ? params.error : "";

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login?next=/admin");

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (currentProfile?.role !== "admin") redirect("/dashboard");

  const [{ data: customersData }, { data: leadsData }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,full_name,phone,email,referral_code,referred_by,source,role,marketing_consent,created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("leads")
      .select("id,source,form_id,full_name,email,phone,service,message,marketing_consent,status,created_at")
      .order("created_at", { ascending: false })
  ]);

  const customers = (customersData ?? []) as Customer[];
  const leads = (leadsData ?? []) as Lead[];
  const query = normalize(q);
  const filteredCustomers = query
    ? customers.filter((customer) =>
        [customer.full_name, customer.phone, customer.email, customer.referral_code, customer.referred_by ?? ""]
          .some((value) => normalize(value).includes(query))
      )
    : customers;

  const newLeads = leads.filter((lead) => lead.status === "new").length;
  const referredCustomers = customers.filter((customer) => customer.referred_by).length;

  return (
    <main className="container section">
      <div className="top">
        <div>
          <p className="eyebrow">الإدارة</p>
          <h1>لوحة إدارة مكنون كون</h1>
          <p className="muted">العملاء المسجلون وطلبات Tally في مكان واحد.</p>
        </div>
        <form action={signOut}><button className="btn alt" type="submit">تسجيل الخروج</button></form>
      </div>

      {message && <div className="notice">تم تنفيذ العملية بنجاح.</div>}
      {error && <div className="notice">تعذر تنفيذ العملية. حاول مرة أخرى.</div>}

      <div className="grid cards">
        <article className="card"><p className="muted">إجمالي العملاء</p><h2>{customers.length}</h2></article>
        <article className="card"><p className="muted">طلبات Tally</p><h2>{leads.length}</h2></article>
        <article className="card"><p className="muted">طلبات جديدة</p><h2>{newLeads}</h2></article>
        <article className="card"><p className="muted">عملاء بالإحالة</p><h2>{referredCustomers}</h2></article>
      </div>

      <section id="leads" className="panel" style={{ marginTop: 24 }}>
        <div className="top">
          <div>
            <p className="eyebrow">طلبات الخدمات</p>
            <h2>العملاء المحتملون من Tally</h2>
          </div>
          <span className="status">{leads.length} طلب</span>
        </div>

        {!leads.length ? (
          <p className="muted">لا توجد طلبات واردة من Tally حتى الآن.</p>
        ) : (
          <div className="grid">
            {leads.map((lead) => (
              <article className="card" key={lead.id}>
                <div className="top">
                  <div>
                    <h3>{lead.full_name || "عميل محتمل"}</h3>
                    <p className="muted">{lead.service || "خدمة غير محددة"}</p>
                  </div>
                  <span className="status">{statusLabels[lead.status] || lead.status}</span>
                </div>
                <p><strong>الجوال:</strong> <span dir="ltr">{lead.phone || "—"}</span></p>
                <p><strong>البريد:</strong> <span dir="ltr">{lead.email || "—"}</span></p>
                <p><strong>المصدر:</strong> {lead.source || "tally"}</p>
                {lead.message && <p><strong>التفاصيل:</strong> {lead.message}</p>}
                <p><strong>موافقة تسويقية:</strong> {lead.marketing_consent ? "نعم" : "لا"}</p>
                <small className="muted">{new Date(lead.created_at).toLocaleString("ar-SA")}</small>

                <form action={updateLeadStatus} style={{ marginTop: 14 }}>
                  <input type="hidden" name="lead_id" value={lead.id} />
                  <div className="field">
                    <label>حالة المتابعة</label>
                    <select name="status" defaultValue={lead.status}>
                      <option value="new">جديد</option>
                      <option value="contacted">تم التواصل</option>
                      <option value="in_progress">قيد المتابعة</option>
                      <option value="completed">مكتمل</option>
                      <option value="closed">مغلق</option>
                    </select>
                  </div>
                  <button className="btn" type="submit">حفظ الحالة</button>
                </form>
              </article>
            ))}
          </div>
        )}
      </section>

      <section id="customers" className="panel" style={{ marginTop: 24 }}>
        <div className="top">
          <div>
            <p className="eyebrow">العملاء</p>
            <h2>سجل العملاء المسجلين</h2>
          </div>
          <span className="status">{filteredCustomers.length} عميل</span>
        </div>

        <form method="get" style={{ margin: "18px 0" }}>
          <div className="field">
            <label htmlFor="q">بحث</label>
            <input id="q" type="search" name="q" defaultValue={q} placeholder="الاسم أو الجوال أو البريد أو كود الإحالة" />
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn" type="submit">بحث</button>
            {q && <a className="btn alt" href="/admin#customers">إلغاء البحث</a>}
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
                  <span className="status">{customer.role}</span>
                </div>
                <p><strong>الجوال:</strong> <span dir="ltr">{customer.phone || "—"}</span></p>
                <p><strong>المصدر:</strong> {customer.source || "الموقع"}</p>
                <p><strong>كود الإحالة:</strong> <span dir="ltr">{customer.referral_code || "—"}</span></p>
                <p><strong>المُحيل:</strong> <span dir="ltr">{customer.referred_by || "—"}</span></p>
                <p><strong>موافقة تسويقية:</strong> {customer.marketing_consent ? "نعم" : "لا"}</p>
                <small className="muted">تاريخ التسجيل: {new Date(customer.created_at).toLocaleDateString("ar-SA")}</small>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
