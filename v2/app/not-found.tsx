import Link from "next/link";

export default function NotFound() {
  return (
    <main className="auth">
      <section className="auth-card">
        <p className="eyebrow">404</p>
        <h1>الصفحة غير موجودة</h1>
        <p className="muted">الرابط الذي فتحته غير موجود أو لم يعد متاحًا.</p>
        <Link className="btn" href="/">العودة للرئيسية</Link>
      </section>
    </main>
  );
}
