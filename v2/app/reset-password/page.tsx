import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updatePassword } from "../actions";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ResetPasswordPage({ searchParams }: Props) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : "";

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) redirect("/forgot-password");

  return (
    <main className="auth">
      <section className="auth-card">
        <p className="eyebrow">MK</p>
        <h1>كلمة مرور جديدة</h1>
        {error && <div className="notice">تأكد أن كلمتي المرور متطابقتان ومن 8 أحرف على الأقل.</div>}

        <form action={updatePassword}>
          <div className="field">
            <label>كلمة المرور الجديدة</label>
            <input name="password" type="password" minLength={8} autoComplete="new-password" required />
          </div>
          <div className="field">
            <label>تأكيد كلمة المرور</label>
            <input name="confirm_password" type="password" minLength={8} autoComplete="new-password" required />
          </div>
          <button className="btn" type="submit">حفظ كلمة المرور</button>
        </form>
      </section>
    </main>
  );
}
