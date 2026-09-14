create table if not exists public.salary_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  month date not null,
  salary numeric(14,2) not null default 0 check (salary >= 0),
  savings_goal numeric(14,2) not null default 0 check (savings_goal >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, month)
);

create table if not exists public.salary_expenses (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references public.salary_budgets(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null default 'أخرى',
  amount numeric(14,2) not null check (amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.salary_budgets enable row level security;
alter table public.salary_expenses enable row level security;

grant select, insert, update, delete on public.salary_budgets to authenticated;
grant select, insert, update, delete on public.salary_expenses to authenticated;

create policy "salary_budgets_own_select" on public.salary_budgets for select to authenticated using ((select auth.uid()) = user_id);
create policy "salary_budgets_own_insert" on public.salary_budgets for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "salary_budgets_own_update" on public.salary_budgets for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "salary_budgets_own_delete" on public.salary_budgets for delete to authenticated using ((select auth.uid()) = user_id);

create policy "salary_expenses_own_select" on public.salary_expenses for select to authenticated using ((select auth.uid()) = user_id);
create policy "salary_expenses_own_insert" on public.salary_expenses for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "salary_expenses_own_update" on public.salary_expenses for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "salary_expenses_own_delete" on public.salary_expenses for delete to authenticated using ((select auth.uid()) = user_id);
