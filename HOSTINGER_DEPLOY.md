# ربط Mknoncon.com مع Hostinger عبر GitHub

> مهم: لا تنفذ أول Deploy إلى `public_html` قبل أخذ Backup من ملفات الموقع الحالية، لأن Hostinger قد يستبدل الملفات الموجودة في مجلد النشر.

## الإعداد
1. hPanel > Websites > Mknoncon.com > Dashboard.
2. Advanced > Git.
3. اختر Continue with GitHub.
4. اسمح لتطبيق Hostinger بالوصول إلى المستودع `alunzy4-dotcom/Mknoncon-`.
5. اختر Repository: `alunzy4-dotcom/Mknoncon-`.
6. Branch: `main`.
7. Root directory: `public_html`.
8. بعد التأكد من النسخة الاحتياطية، اختر Deploy.
9. اختبر الصفحة الرئيسية وصفحة `auth.html` بعد النشر.
10. فعّل Auto-deployment فقط بعد نجاح أول نشر واختبار الموقع.

## قواعد أمان
- لا ترفع كلمة مرور FTP إلى GitHub.
- لا ترفع مفاتيح Supabase السرية أو أي service role key.
- يمكن وضع المفاتيح العامة اللازمة للواجهة فقط إذا كانت الخدمة مصممة لذلك ومع تفعيل RLS المناسب.
