alter table public.profiles
  add column if not exists email text not null default '',
  add column if not exists source text not null default 'الموقع';
