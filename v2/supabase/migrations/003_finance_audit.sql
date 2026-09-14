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

create or replace function public.set_finance_updated_at()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.log_finance_change()
returns trigger language plpgsql security invoker set search_path = public as $$
declare
  v_user_id uuid;
  v_entity_id uuid;
  v_payload jsonb;
begin
  if tg_op = 'DELETE' then
    v_user_id := old.user_id;
    v_entity_id := old.id;
    v_payload := to_jsonb(old);
  else
    v_user_id := new.user_id;
    v_entity_id := new.id;
    v_payload := to_jsonb(new);
  end if;

  insert into public.finance_audit_logs(user_id, entity_type, entity_id, action, payload)
  values (v_user_id, case when tg_table_name = 'salary_budgets' then 'budget' else 'expense' end, v_entity_id, lower(tg_op), v_payload);

  return coalesce(new, old);
end;
$$;

create trigger salary_budgets_updated_at before update on public.salary_budgets
for each row execute function public.set_finance_updated_at();

create trigger salary_expenses_updated_at before update on public.salary_expenses
for each row execute function public.set_finance_updated_at();

create trigger salary_budgets_audit after insert or update or delete on public.salary_budgets
for each row execute function public.log_finance_change();

create trigger salary_expenses_audit after insert or update or delete on public.salary_expenses
for each row execute function public.log_finance_change();
