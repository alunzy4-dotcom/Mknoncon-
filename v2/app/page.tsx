import Link from "next/link";

export default function Home() {
  return (
    <>
      <header className="header">
        <div className="container nav">
          <Link className="brand" href="/">
            مكنون كون
            <small>لخدمات الأعمال</small>
          </Link>
          <div className="links">
            <Link href="#services">الخدمات</Link>
          </div>
          <div>
            <Link className="btn alt" href="/login">تسجيل الدخول</Link>{" "}
            <Link className="btn" href="/login?mode=signup">إنشاء حساب</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="container">
            <p className="eyebrow">مكنون كون لخدمات الأعمال</p>
            <h1>نحوّل تعقيد الأعمال إلى خطوات واضحة قابلة للتنفيذ</h1>
            <p className="lead">
              استشارات وحلول تنفيذية للأفراد والمنشآت، مع حساب عميل آمن يتيح تقديم الطلبات ومتابعتها من مكان واحد.
            </p>
            <p>
              <Link className="btn" href="/login?mode=signup">ابدأ الآن</Link>
            </p>
          </div>
        </section>

        <section className="section" id="services">
          <div className="container">
            <p className="eyebrow">الخدمات</p>
            <h2>مجالات متكاملة لاحتياج العميل</h2>
            <div className="grid cards">
              <article className="card"><h3>الاستشارات المالية</h3><p className="muted">تحليل مالي، خطط سيولة، تمويل واستثمار.</p></article>
              <article className="card"><h3>حلول الأعمال</h3><p className="muted">دراسات جدوى، تطوير إجراءات وخطط تنفيذ.</p></article>
              <article className="card"><h3>الخدمات العقارية</h3><p className="muted">دعم القرارات العقارية والتقييم والمتابعة.</p></article>
              <article className="card"><h3>الخدمات الحكومية</h3><p className="muted">متابعة التراخيص والمعاملات الرسمية.</p></article>
              <article className="card"><h3>الحلول الرقمية</h3><p className="muted">مواقع، أتمتة، ذكاء اصطناعي وتكاملات.</p></article>
              <article className="card"><h3>خدمات مخصصة</h3><p className="muted">طلبات خاصة تُقيّم وتُسند للمختص المناسب.</p></article>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
