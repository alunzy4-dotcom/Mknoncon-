"use client";

export default function GlobalError({
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <main className="auth">
          <section className="auth-card">
            <p className="eyebrow">مكنون كون</p>
            <h1>حدث خطأ غير متوقع</h1>
            <p className="muted">
              لم يتم تنفيذ العملية. يمكنك المحاولة مرة أخرى دون فقدان بيانات حسابك.
            </p>
            <button className="btn" onClick={() => reset()}>
              المحاولة مرة أخرى
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
