-- ============================================================
-- Accounts overview, Cards, and Currency Exchange migration
-- Run after 05_bills.sql
-- ============================================================

-- 1. Accounts can now be 'business' too, and optionally carry a savings goal
alter table public.accounts drop constraint if exists accounts_account_type_check;
alter table public.accounts
  add constraint accounts_account_type_check check (account_type in ('checking', 'savings', 'business'));
alter table public.accounts add column goal_amount numeric(14,2);

-- 2. More transaction types: card purchases and currency exchanges
alter table public.transactions drop constraint if exists transactions_type_check;
alter table public.transactions
  add constraint transactions_type_check check (type in ('transfer', 'deposit', 'bill', 'adjustment', 'card_purchase', 'exchange'));

-- ============================================================
-- CARDS
-- ============================================================
create table public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  card_type text not null default 'debit' check (card_type in ('debit', 'credit')),
  nickname text not null default 'Nimbus Card',
  last4 text not null,
  expiry_month int not null,
  expiry_year int not null,
  status text not null default 'active' check (status in ('active', 'frozen', 'reported_lost')),
  spending_limit numeric(14,2) not null default 5000,
  monthly_spend numeric(14,2) not null default 0,
  allow_online boolean not null default true,
  allow_international boolean not null default true,
  allow_contactless boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.cards enable row level security;

create policy "view own cards" on public.cards for select using (user_id = auth.uid());

-- ============================================================
-- WALLETS — foreign-currency holdings. USD itself isn't a wallet row;
-- USD lives in your checking/savings/business accounts. EUR/GBP/BTC are
-- separate balances you buy into and sell back out of via Exchange.
-- ============================================================
create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  currency text not null check (currency in ('EUR', 'GBP', 'BTC')),
  balance numeric(18,8) not null default 0 check (balance >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, currency)
);

alter table public.wallets enable row level security;

create policy "view own wallets" on public.wallets for select using (user_id = auth.uid());

-- give every new signup empty EUR/GBP/BTC wallets so Accounts Overview
-- never has to handle a "wallet doesn't exist yet" case in the UI
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

  insert into public.wallets (user_id, currency) values
    (new.id, 'EUR'), (new.id, 'GBP'), (new.id, 'BTC');

  return new;
end;
$$;

-- ============================================================
-- OPEN A NEW ACCOUNT (savings/business) — same number generator as signup
-- ============================================================
create or replace function public.open_account(p_account_type text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account_id uuid;
  v_number text;
begin
  if p_account_type not in ('savings', 'business') then
    raise exception 'Can only open savings or business accounts here';
  end if;

  v_number := public.generate_account_number();

  insert into public.accounts (user_id, account_number, account_type, balance)
  values (auth.uid(), v_number, p_account_type, 0)
  returning id into v_account_id;

  return json_build_object('success', true, 'account_id', v_account_id, 'account_number', v_number);
end;
$$;

grant execute on function public.open_account(text) to authenticated;

-- ============================================================
-- ORDER A NEW CARD
-- ============================================================
create or replace function public.order_card(
  p_account_id uuid,
  p_card_type text,
  p_nickname text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_card_id uuid;
  v_last4 text;
begin
  select user_id into v_owner from public.accounts where id = p_account_id;
  if v_owner is null or v_owner <> auth.uid() then
    raise exception 'Not authorized for this account';
  end if;

  v_last4 := lpad(floor(random() * 10000)::text, 4, '0');

  insert into public.cards (user_id, account_id, card_type, nickname, last4, expiry_month, expiry_year)
  values (
    auth.uid(), p_account_id, p_card_type, p_nickname, v_last4,
    extract(month from now())::int, extract(year from now())::int + 4
  )
  returning id into v_card_id;

  return json_build_object('success', true, 'card_id', v_card_id, 'last4', v_last4);
end;
$$;

grant execute on function public.order_card(uuid, text, text) to authenticated;

-- ============================================================
-- CARD STATUS (freeze / unfreeze / report lost)
-- ============================================================
create or replace function public.card_set_status(p_card_id uuid, p_status text)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_status not in ('active', 'frozen', 'reported_lost') then
    raise exception 'Invalid status';
  end if;

  update public.cards set status = p_status where id = p_card_id and user_id = auth.uid();
  if not found then
    raise exception 'Card not found';
  end if;

  return json_build_object('success', true);
end;
$$;

grant execute on function public.card_set_status(uuid, text) to authenticated;

-- ============================================================
-- CARD CONTROLS (online / international / contactless toggles)
-- ============================================================
create or replace function public.card_update_controls(
  p_card_id uuid,
  p_allow_online boolean,
  p_allow_international boolean,
  p_allow_contactless boolean
)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.cards
  set allow_online = p_allow_online,
      allow_international = p_allow_international,
      allow_contactless = p_allow_contactless
  where id = p_card_id and user_id = auth.uid();

  if not found then
    raise exception 'Card not found';
  end if;

  return json_build_object('success', true);
end;
$$;

grant execute on function public.card_update_controls(uuid, boolean, boolean, boolean) to authenticated;

-- ============================================================
-- ADJUST MONTHLY SPENDING LIMIT
-- ============================================================
create or replace function public.card_adjust_limit(p_card_id uuid, p_new_limit numeric)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_new_limit <= 0 then
    raise exception 'Limit must be positive';
  end if;

  update public.cards set spending_limit = p_new_limit where id = p_card_id and user_id = auth.uid();
  if not found then
    raise exception 'Card not found';
  end if;

  return json_build_object('success', true);
end;
$$;

grant execute on function public.card_adjust_limit(uuid, numeric) to authenticated;

-- ============================================================
-- SIMULATE A CARD PURCHASE — demo-only "test data" generator. Real
-- atomic debit + limit check + ledger entry, same pattern as everything
-- else; there's just no real merchant network behind it.
-- ============================================================
create or replace function public.card_simulate_purchase(
  p_card_id uuid,
  p_merchant text,
  p_amount numeric,
  p_category text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_card record;
  v_account_balance numeric;
  v_payer_name text;
begin
  if p_amount <= 0 then
    raise exception 'Amount must be positive';
  end if;

  select * into v_card from public.cards where id = p_card_id and user_id = auth.uid();
  if v_card is null then
    raise exception 'Card not found';
  end if;
  if v_card.status <> 'active' then
    raise exception 'Card is not active';
  end if;
  if v_card.monthly_spend + p_amount > v_card.spending_limit then
    raise exception 'This would exceed your monthly spending limit';
  end if;

  select balance into v_account_balance from public.accounts where id = v_card.account_id for update;
  if v_account_balance < p_amount then
    raise exception 'Insufficient funds in linked account';
  end if;

  select full_name into v_payer_name from public.profiles where id = auth.uid();

  update public.accounts set balance = balance - p_amount where id = v_card.account_id;
  update public.cards set monthly_spend = monthly_spend + p_amount where id = p_card_id;

  insert into public.transactions (from_account_id, from_name, to_name, amount, type, note)
  values (v_card.account_id, v_payer_name, p_merchant, p_amount, 'card_purchase', p_category);

  return json_build_object('success', true);
end;
$$;

grant execute on function public.card_simulate_purchase(uuid, text, numeric, text) to authenticated;

-- ============================================================
-- CURRENCY EXCHANGE
-- Rates are fetched live in the browser (open.er-api.com for fiat,
-- CoinGecko for BTC) and passed in already computed. This function trusts
-- the converted amount from the client rather than re-fetching the rate
-- itself — a real production system would re-verify server-side (e.g. via
-- pg_net or an edge function); documented as a known simplification here.
-- ============================================================
create or replace function public.exchange_currency(
  p_account_id uuid,
  p_currency text,
  p_usd_amount numeric,
  p_foreign_amount numeric,
  p_direction text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account_owner uuid;
  v_account_balance numeric;
  v_wallet_balance numeric;
begin
  if p_direction not in ('buy', 'sell') then
    raise exception 'Invalid direction';
  end if;
  if p_usd_amount <= 0 or p_foreign_amount <= 0 then
    raise exception 'Amounts must be positive';
  end if;

  select balance, user_id into v_account_balance, v_account_owner
  from public.accounts where id = p_account_id for update;

  if v_account_owner is null or v_account_owner <> auth.uid() then
    raise exception 'Not authorized for this account';
  end if;

  if p_direction = 'buy' then
    if v_account_balance < p_usd_amount then
      raise exception 'Insufficient USD balance';
    end if;

    update public.accounts set balance = balance - p_usd_amount where id = p_account_id;

    insert into public.wallets (user_id, currency, balance)
    values (auth.uid(), p_currency, p_foreign_amount)
    on conflict (user_id, currency) do update set balance = wallets.balance + p_foreign_amount;

    insert into public.transactions (from_account_id, from_name, to_name, amount, type, note)
    values (p_account_id, 'USD', p_currency, p_usd_amount, 'exchange', p_foreign_amount::text || ' ' || p_currency);
  else
    select balance into v_wallet_balance from public.wallets
    where user_id = auth.uid() and currency = p_currency for update;

    if v_wallet_balance is null or v_wallet_balance < p_foreign_amount then
      raise exception 'Insufficient % balance', p_currency;
    end if;

    update public.wallets set balance = balance - p_foreign_amount
    where user_id = auth.uid() and currency = p_currency;

    update public.accounts set balance = balance + p_usd_amount where id = p_account_id;

    insert into public.transactions (from_account_id, from_name, to_name, amount, type, note)
    values (p_account_id, p_currency, 'USD', p_usd_amount, 'exchange', p_foreign_amount::text || ' ' || p_currency);
  end if;

  return json_build_object('success', true);
end;
$$;

grant execute on function public.exchange_currency(uuid, text, numeric, numeric, text) to authenticated;