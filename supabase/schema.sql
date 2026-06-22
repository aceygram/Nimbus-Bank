-- ============================================================
-- Nimbus Bank — Supabase schema
-- Run this once in your Supabase project: Dashboard → SQL Editor → New query → paste → Run
-- ============================================================

-- 1. PROFILES — one row per signed-up user
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

-- 2. ACCOUNTS — a user can hold more than one (checking, savings, ...)
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  account_number text not null unique,
  account_type text not null default 'checking' check (account_type in ('checking', 'savings')),
  balance numeric(14,2) not null default 0 check (balance >= 0),
  currency text not null default 'USD',
  created_at timestamptz not null default now()
);

-- 3. TRANSACTIONS — the ledger. from_name/to_name are denormalized at write
--    time so the dashboard never needs a join to show "who" in the feed.
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  from_account_id uuid references public.accounts(id),
  to_account_id uuid references public.accounts(id),
  from_name text,
  to_name text,
  amount numeric(14,2) not null check (amount > 0),
  type text not null default 'transfer' check (type in ('transfer', 'deposit', 'bill')),
  note text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- ACCOUNT NUMBER GENERATION
-- 12-digit number, grouped as 4-4-4 for display. Retries on collision.
-- ============================================================
create or replace function public.generate_account_number()
returns text
language plpgsql
as $$
declare
  new_number text;
  already_taken boolean;
begin
  loop
    new_number := lpad(floor(random() * 1000000000000)::text, 12, '0');
    select exists(select 1 from public.accounts where account_number = new_number) into already_taken;
    if not already_taken then
      exit;
    end if;
  end loop;
  return new_number;
end;
$$;

-- ============================================================
-- NEW USER → auto-create profile + a checking account with a starter
-- balance of $1,000 (clearly a demo bonus, not real money) so the
-- dashboard isn't empty right after signup.
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', 'New user'), new.email);

  insert into public.accounts (user_id, account_number, account_type, balance)
  values (new.id, public.generate_account_number(), 'checking', 1000.00);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- LOOKUP — let the sender see who they're paying before confirming
-- ============================================================
create or replace function public.lookup_account(p_account_number text)
returns table(full_name text, account_type text)
language sql
security definer
set search_path = public
as $$
  select p.full_name, a.account_type
  from public.accounts a
  join public.profiles p on p.id = a.user_id
  where a.account_number = p_account_number;
$$;

grant execute on function public.lookup_account(text) to authenticated;

-- ============================================================
-- THE CORE PIECE — atomic transfer.
-- Row locks (FOR UPDATE) mean two transfers touching the same account at
-- the same instant queue safely instead of racing — balances can never
-- desync. Runs as one transaction: if anything after the locks fails,
-- everything rolls back, including any partial debit/credit.
-- ============================================================
create or replace function public.transfer_funds(
  p_from_account_id uuid,
  p_to_account_number text,
  p_amount numeric,
  p_note text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from_balance numeric;
  v_from_user uuid;
  v_to_account_id uuid;
  v_from_name text;
  v_to_name text;
begin
  if p_amount <= 0 then
    raise exception 'Amount must be greater than zero';
  end if;

  -- lock sender row first
  select balance, user_id into v_from_balance, v_from_user
  from public.accounts
  where id = p_from_account_id
  for update;

  if v_from_user is null then
    raise exception 'Sender account not found';
  end if;

  if v_from_user <> auth.uid() then
    raise exception 'Not authorized to transfer from this account';
  end if;

  if v_from_balance < p_amount then
    raise exception 'Insufficient funds';
  end if;

  -- lock receiver row
  select id into v_to_account_id
  from public.accounts
  where account_number = p_to_account_number
  for update;

  if v_to_account_id is null then
    raise exception 'Recipient account number not found';
  end if;

  if v_to_account_id = p_from_account_id then
    raise exception 'Cannot transfer to the same account';
  end if;

  select full_name into v_from_name from public.profiles where id = v_from_user;
  select p.full_name into v_to_name
  from public.accounts a join public.profiles p on p.id = a.user_id
  where a.id = v_to_account_id;

  update public.accounts set balance = balance - p_amount where id = p_from_account_id;
  update public.accounts set balance = balance + p_amount where id = v_to_account_id;

  insert into public.transactions (from_account_id, to_account_id, from_name, to_name, amount, type, note)
  values (p_from_account_id, v_to_account_id, v_from_name, v_to_name, p_amount, 'transfer', p_note);

  return json_build_object('success', true, 'to_name', v_to_name);
end;
$$;

grant execute on function public.transfer_funds(uuid, text, numeric, text) to authenticated;

-- ============================================================
-- ROW LEVEL SECURITY — users only ever see their own data.
-- The functions above are SECURITY DEFINER so they can still read/write
-- across rows internally; RLS only restricts direct table access from
-- the frontend.
-- ============================================================
alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.transactions enable row level security;

create policy "view own profile" on public.profiles
  for select using (id = auth.uid());

create policy "view own accounts" on public.accounts
  for select using (user_id = auth.uid());

create policy "view own transactions" on public.transactions
  for select using (
    from_account_id in (select id from public.accounts where user_id = auth.uid())
    or to_account_id in (select id from public.accounts where user_id = auth.uid())
  );
