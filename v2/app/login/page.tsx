import Link from "next/link";
import { signIn, signUp } from "../actions";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const errorMessages: Record<string, string> = {
  invalid_login: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
  signup_failed: "تعذر إنشاء الحساب. قد يكون البريد مسجلًا مسبقًا أو البيانات غير صالحة.",
  invalid_signup_data: "راجع الاسم والجوال وكلمة المرور ثم حاول مرة أخرى.",
  profile_setup: "تمت المصادقة لكن تعذر تجهيز ملف العميل. لم يتم تحويلك للوحة حفاظًا على سلامة الحساب.",
  auth_callback: "رابط تأكيد البريد غير صالح أو منتهي.",
  missing_code: "رابط التأكيد غير مكتمل."
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const signup = params.mode === "signup";
  const message = typeof params.message === "string" ? params.message : "";
  const error = typeof params.error === "string" ? params.error : "";

  return (
    <main className="auth">
      <section className="auth-card">
        <p className="eyebrow">MK</p>
        <h1>{signup ? "إنشاء حساب" : "تسجيل الدخول"}</h1>
        <p className="muted">حسابك هو بوابتك لتقديم الطلبات ومتابعتها.</p>

        {message === "check_email" && <div className="notice">تم إنشاء الحساب. راجع بريدك لتأكيد التسجيل ثم افتح الرابط.</div>}
        {message === "password_updated" && <div className="notice">تم تحديث كلمة المرور. يمكنك تسجيل الدخول الآن.</div>}
        {error && <div className="notice">{errorMessages[error] ?? "تعذر إكمال العملية. حاول مرة أخرى."}</div>}

        {signup ? (
          <form action={signUp}>
            <div className="field"><label>الاسم الكامل</label><input name="full_name" required /></div>
            <div className="field"><label>رقم الجوال</label><input name="phone" inputMode="tel" autoComplete="tel" required /></div>
            <div className="field"><label>البريد الإلكتروني</label><input name="email" type="email" autoComplete="email" required /></div>
            <div className="field"><label>كلمة المرور</label><input name="password" type="password" minLength={8} autoComplete="new-password" required /></div>
            <div className="field"><label>كود الإحالة - اختياري</label><input name="referral_code" /></div>
            <button className="btn" type="submit">إنشاء الحساب</button>
            <p className="muted">لديك حساب؟ <Link href="/login">تسجيل الدخول</Link></p>
          </form>
        ) : (
          <form action={signIn}>
            <div className="field"><label>البريد الإلكتروني</label><input name="email" type="email" autoComplete="email" required /></div>
            <div className="field"><label>كلمة المرور</label><input name="password" type="password" autoComplete="current-password" required /></div>
            <button className="btn" type="submit">تسجيل الدخول</button>
            <p><Link href="/forgot-password">نسيت كلمة المرور؟</Link></p>
            <p className="muted">ليس لديك حساب؟ <Link href="/login?mode=signup">إنشاء حساب</Link></p>
          </form>
        )}

        <p><Link href="/">العودة للرئيسية</Link></p>
      </section>
    </main>
  );
}
