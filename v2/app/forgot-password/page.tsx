import Link from "next/link";
import { sendPasswordReset } from "../actions";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const params = await searchParams;
  const message = typeof params.message === "string" ? params.message : "";
  const error = typeof params.error === "string" ? params.error : "";

  return (
    <main className="auth">
      <section className="auth-card">
        <p className="eyebrow">MK</p>
        <h1>استعادة كلمة المرور</h1>
        <p className="muted">أدخل بريدك وسنرسل رابطًا آمنًا لتعيين كلمة مرور جديدة.</p>

        {message === "sent" && (
          <div className="notice">إذا كان البريد مسجلًا لدينا، فسيصلك رابط الاستعادة.</div>
        )}
        {error && <div className="notice">تعذر استخدام رابط الاستعادة. اطلب رابطًا جديدًا.</div>}

        <form action={sendPasswordReset}>
          <div className="field">
            <label>البريد الإلكتروني</label>
            <input name="email" type="email" autoComplete="email" required />
          </div>
          <button className="btn" type="submit">إرسال رابط الاستعادة</button>
        </form>

        <p><Link href="/login">العودة لتسجيل الدخول</Link></p>
      </section>
    </main>
  );
}
