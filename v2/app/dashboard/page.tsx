import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../actions";

export const dynamic = "force-dynamic";

const TALLY_FORM_URL = "https://tally.so/r/kdoLl1";

const services = [
  { name: "استشارات مالية", description: "تمويل، التزامات، حلول مالية ودراسة الخيارات المناسبة." },
  { name: "حلول أعمال", description: "ترتيب فكرة مشروع أو تطوير نشاط قائم وخطة التنفيذ." },
  { name: "دراسة جدوى", description: "تقدير التكاليف والإيرادات والجدوى الأولية للمشروع." },
  { name: "خدمات عقارية", description: "طلبات واستشارات تتعلق بالعقار والتمويل العقاري." },
  { name: "خدمات حكومية", description: "مساعدة في الطلبات والإجراءات والخدمات الحكومية." },
  { name: "حلول رقمية", description: "مواقع، نماذج، أتمتة وربط الأدوات الرقمية." },
  { name: "أخرى", description: "أي طلب لا يندرج تحت الخدمات السابقة." }
];

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function tallyUrl(service: string) {
  const params = new URLSearchParams({ service, source: "website" });
  return `${TALLY_FORM_URL}?${params.toString()}`;
}

export default async function DashboardPage({ searchParams }: Props) {
  const params = await searchParams;
  const message = typeof params.message === "string" ? params.message : "";
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,phone,email,referral_code")
    .eq("id", userId)
    .maybeSingle();

  return (
    <main className="container section">
      <div className="top">
        <div>
          <p className="eyebrow">لوحة العميل</p>
          <h1>مرحبًا {profile?.full_name || ""}</h1>
        </div>
        <form action={signOut}><button className="btn alt" type="submit">تسجيل الخروج</button></form>
      </div>

      {message === "request_sent" && <div className="notice">تم إرسال طلبك بنجاح وسنتابع معك.</div>}

      <section className="panel">
        <h2>بيانات الحساب</h2>
        <p className="muted">{profile?.phone || "—"}</p>
        <p className="muted" dir="ltr">{profile?.email || "—"}</p>
        <p>كود الإحالة: <strong>{profile?.referral_code || "—"}</strong></p>
      </section>

      <div className="dashboard-tools">
        <section className="panel finance-entry">
          <div>
            <p className="eyebrow">أداة مالية</p>
            <h2>حاسبة الراتب والمصروفات</h2>
            <p className="muted">سجّل دخلك والتزاماتك، واحصل على الفائض أو العجز وتوزيع المصروفات مع حفظ شهري في حسابك.</p>
          </div>
          <Link className="btn" href="/dashboard/finance">فتح الحاسبة</Link>
        </section>

        <section className="panel finance-entry mortgage-entry">
          <div>
            <p className="eyebrow">وفق تعليمات ساما</p>
            <h2>حاسبة نسبة الاستقطاع والتمويل العقاري</h2>
            <p className="muted">تحسب حدود 25% و33.33% و45% و55% و65% حسب حالة العميل وشريحة الدخل والدعم السكني.</p>
          </div>
          <Link className="btn" href="/dashboard/mortgage">فتح الحاسبة</Link>
        </section>
      </div>

      <section className="panel">
        <p className="eyebrow">طلب خدمة</p>
        <h2>اختر الخدمة التي تحتاجها</h2>
        <p className="muted">بعد اختيار الخدمة سيفتح نموذج مكنون كون في Tally لإكمال تفاصيل الطلب.</p>

        <div className="grid cards">
          {services.map((service) => (
            <article className="card" key={service.name}>
              <h3>{service.name}</h3>
              <p className="muted">{service.description}</p>
              <a className="btn" href={tallyUrl(service.name)}>تعبئة الطلب</a>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
