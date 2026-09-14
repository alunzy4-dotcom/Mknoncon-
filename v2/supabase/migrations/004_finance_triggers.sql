create or replace function public.log_finance_change()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    insert into public.finance_audit_logs(user_id, entity_type, entity_id, action, payload)
    values (old.user_id, case when tg_table_name = 'salary_budgets' then 'budget' else 'expense' end, old.id, 'delete', to_jsonb(old));
    return old;
  end if;

  insert into public.finance_audit_logs(user_id, entity_type, entity_id, action, payload)
  values (new.user_id, case when tg_table_name = 'salary_budgets' then 'budget' else 'expense' end, new.id, lower(tg_op), to_jsonb(new));
  return new;
end;
$$;

create or replace function public.set_finance_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger salary_budgets_audit
after insert or update or delete on public.salary_budgets
for each row execute function public.log_finance_change();

create trigger salary_expenses_audit
after insert or update or delete on public.salary_expenses
for each row execute function public.log_finance_change();

create trigger salary_budgets_updated_at
before update on public.salary_budgets
for each row execute function public.set_finance_updated_at();

create trigger salary_expenses_updated_at
before update on public.salary_expenses
for each row execute function public.set_finance_updated_at();
