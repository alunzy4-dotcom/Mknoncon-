# Mknoncon V2 — Deployment

## 1. Supabase
أنشئ مشروعًا جديدًا باسم `mknoncon-v2`.

ثم:
1. افتح SQL Editor.
2. شغّل `supabase/migrations/001_init.sql`.
3. من Authentication > URL Configuration:
   - Site URL = رابط البيئة التجريبية.
   - أضف `/auth/callback` و `/auth/reset/callback` ضمن Redirect URLs.
4. فعّل Email/Password.
5. للإنتاج اربط SMTP مخصصًا قبل استقبال العملاء.

## 2. Vercel
اربط مستودع GitHub:
`alunzy4-dotcom/Mknoncon-`

الإعدادات:
- Branch: `mknoncon-v2`
- Root Directory: `v2`
- Framework: Next.js

Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SITE_URL`

ابدأ أولًا بعنوان Vercel التجريبي أو `beta.mknoncon.com`.

## 3. المدير الأول
أنشئ حسابًا طبيعيًا من الموقع، أكد البريد، ثم شغّل:
`supabase/ADMIN_SETUP.sql`
بعد استبدال `ADMIN_EMAIL_HERE`.

## 4. اختبار قبل التحويل
من جهاز تطوير أو GitHub Action:
`SMOKE_BASE_URL=https://beta.mknoncon.com node scripts/smoke.mjs`

ثم اختبر يدويًا:
- إنشاء حساب.
- تأكيد البريد.
- تسجيل الدخول والخروج.
- إغلاق Safari وفتحه مجددًا.
- استعادة كلمة المرور.
- إنشاء طلب.
- فتح الطلب وسجل التحديثات.
- تغيير الحالة من الإدارة.
- التأكد أن العميل يرى التحديث ولا يرى الملاحظات الداخلية.
- حساب عميل ثانٍ لا يرى طلبات العميل الأول.

## 5. قاعدة التحويل
لا يتم ربط `mknoncon.com` بالنسخة الجديدة إلا بعد نجاح الاختبارات السابقة.
