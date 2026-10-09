-- Ledgerly schema for Supabase. Run this in Supabase SQL Editor.
-- Row-level security ensures users can access only their own financial records.

create extension if not exists pgcrypto;

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('expense', 'income')),
  amount numeric(12,2) not null check (amount > 0),
  category text not null,
  description text not null default '',
  transaction_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, transaction_date desc);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  monthly_limit numeric(12,2) not null check (monthly_limit > 0),
  month date not null,
  created_at timestamptz not null default now(),
  unique (user_id, category, month)
);

create index if not exists budgets_user_month_idx
  on public.budgets (user_id, month);

alter table public.transactions enable row level security;
alter table public.budgets enable row level security;

drop policy if exists "Users manage own transactions" on public.transactions;
create policy "Users manage own transactions"
  on public.transactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage own budgets" on public.budgets;
create policy "Users manage own budgets"
  on public.budgets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
