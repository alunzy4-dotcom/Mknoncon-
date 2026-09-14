do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'user_role'
  ) then
    create type public.user_role as enum ('client', 'staff', 'admin');
  end if;
end $$;

alter table public.profiles
  add column if not exists role public.user_role not null default 'client',
  add column if not exists marketing_consent boolean not null default false,
  add column if not exists consent_at timestamptz;

update public.profiles p
set role = 'admin'
where exists (
  select 1 from public.admin_users a where a.user_id = p.id
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'
    );
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.is_admin() from anon;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "profiles_update_own_safe" on public.profiles;
create policy "profiles_update_own_safe"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

revoke update on public.profiles from authenticated;
grant update (full_name, phone, marketing_consent, consent_at) on public.profiles to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_marketing_consent boolean := false;
  v_referral_code text;
begin
  v_marketing_consent := lower(coalesce(new.raw_user_meta_data ->> 'marketing_consent', 'false')) in ('true','1','yes','on');
  v_referral_code := upper(left(replace(new.id::text, '-', ''), 8));

  insert into public.profiles (
    id, full_name, phone, email, referral_code, referred_by, source,
    role, marketing_consent, consent_at
  ) values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.email, ''),
    v_referral_code,
    nullif(new.raw_user_meta_data ->> 'referral_code', ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'source', ''), 'الموقع'),
    'client',
    v_marketing_consent,
    case when v_marketing_consent then now() else null end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'tally',
  form_id text,
  full_name text,
  email text,
  phone text,
  service text,
  message text,
  marketing_consent boolean not null default false,
  consent_at timestamptz,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  response_id text
);

alter table public.leads enable row level security;

drop policy if exists "admin reads leads" on public.leads;
create policy "admin reads leads"
on public.leads for select
to authenticated
using (public.is_admin());

drop policy if exists "admin updates leads" on public.leads;
create policy "admin updates leads"
on public.leads for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_email_idx on public.leads (email);
create unique index if not exists leads_response_id_unique_idx
  on public.leads(response_id)
  where response_id is not null;

revoke insert on public.leads from anon, authenticated;
