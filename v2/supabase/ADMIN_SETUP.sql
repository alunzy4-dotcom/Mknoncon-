-- شغّل هذا الملف بعد إنشاء حساب المدير الأول وتأكيد بريده.
-- استبدل البريد أدناه ببريد المدير الفعلي.

insert into public.admin_users (user_id)
select id
from auth.users
where lower(email) = lower('ADMIN_EMAIL_HERE')
on conflict (user_id) do nothing;

-- تحقق:
select au.email, a.created_at
from public.admin_users a
join auth.users au on au.id = a.user_id;
