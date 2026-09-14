create table if not exists public.finance_audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null check (entity_type in ('budget','expense')),
  entity_id uuid not null,
  action text not null check (action in ('insert','update','delete')),
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists finance_audit_logs_user_created_idx
  on public.finance_audit_logs(user_id, created_at desc);

alter table public.finance_audit_logs enable row level security;
grant select, insert on public.finance_audit_logs to authenticated;

create policy "finance_audit_logs_own_select" on public.finance_audit_logs
for select to authenticated using ((select auth.uid()) = user_id);

create policy "finance_audit_logs_own_insert" on public.finance_audit_logs
for insert to authenticated with check ((select auth.uid()) = user_id);
