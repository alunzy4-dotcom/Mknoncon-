# Mknoncon V2

نسخة جديدة مستقلة من موقع مكنون كون.

## التقنية
- Next.js 16 Active LTS
- React 19
- Supabase Auth + Database
- @supabase/ssr
- Cookie-based sessions
- Server Actions
- Row Level Security

## مبدأ النشر
لا يتم تحويل mknoncon.com إلى هذه النسخة إلا بعد نجاح الاختبارات على beta.mknoncon.com.

## المطلوب قبل أول تشغيل
1. إنشاء مشروع Supabase جديد باسم mknoncon-v2.
2. تشغيل supabase/migrations/001_init.sql.
3. إضافة متغيرات البيئة من .env.example.
4. ربط المشروع بـ Vercel كـ Preview.
5. اختبار التسجيل، التأكيد، الدخول، الخروج، الطلبات، RLS، الجوال.
