create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  referral_code text not null unique,
  referred_by text,
  created_at timestamptz not null default now()
);

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  service_type text not null,
  details text not null,
  status text not null default 'جديد'
    check (status in ('جديد','قيد المراجعة','بانتظار العميل','قيد التنفيذ','مكتمل','ملغي')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.request_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('created','status_changed','note')),
  visibility text not null default 'customer'
    check (visibility in ('customer','internal')),
  message text,
  created_at timestamptz not null default now()
);

create index requests_user_id_created_at_idx
  on public.requests(user_id, created_at desc);

create index request_events_request_id_created_at_idx
  on public.request_events(request_id, created_at asc);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = auth.uid()
  );
$$;

alter table public.profiles enable row level security;
alter table public.admin_users enable row level security;
alter table public.requests enable row level security;
alter table public.request_events enable row level security;

create policy "admin_users_select_self"
on public.admin_users for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "profiles_select_own_or_admin"
on public.profiles for select
to authenticated
using ((select auth.uid()) = id or public.is_admin());

create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check ((select auth.uid()) = id);

create policy "requests_select_own_or_admin"
on public.requests for select
to authenticated
using ((select auth.uid()) = user_id or public.is_admin());

create policy "requests_insert_own"
on public.requests for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "requests_admin_update"
on public.requests for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "events_select_related_or_admin"
on public.request_events for select
to authenticated
using (
  public.is_admin()
  or (
    visibility = 'customer'
    and exists (
      select 1 from public.requests r
      where r.id = request_id and r.user_id = (select auth.uid())
    )
  )
);

create policy "events_insert_created_by_owner"
on public.request_events for insert
to authenticated
with check (
  event_type = 'created'
  and actor_id = (select auth.uid())
  and exists (
    select 1 from public.requests r
    where r.id = request_id and r.user_id = (select auth.uid())
  )
);

create policy "events_insert_admin"
on public.request_events for insert
to authenticated
with check (public.is_admin() and actor_id = (select auth.uid()));

-- لا يوجد trigger على auth.users.
-- إنشاء profile يتم من خادم التطبيق بعد نجاح المصادقة.
