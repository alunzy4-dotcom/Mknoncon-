create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  referral_code text not null unique,
  referred_by text,
  created_at timestamptz not null default now()
);

create table public.requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  service_type text not null,
  details text not null,
  status text not null default 'جديد'
    check (status in ('جديد','قيد المراجعة','قيد التنفيذ','مكتمل','ملغي')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index requests_user_id_created_at_idx
  on public.requests(user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.requests enable row level security;

create policy "profile_select_own"
on public.profiles for select
to authenticated
using ((select auth.uid()) = id);

create policy "profile_update_own"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "requests_select_own"
on public.requests for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "requests_insert_own"
on public.requests for insert
to authenticated
with check ((select auth.uid()) = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, referral_code, referred_by)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name',''),
    coalesce(new.raw_user_meta_data->>'phone',''),
    upper(substr(replace(new.id::text,'-',''),1,8)),
    nullif(new.raw_user_meta_data->>'referral_code','')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
