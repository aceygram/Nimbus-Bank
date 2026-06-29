-- ============================================================
-- Nimbus Bank — Admin migration
-- Run AFTER schema.sql, in the same SQL Editor.
-- ============================================================

-- 1. New columns
alter table public.profiles add column is_admin boolean not null default false;
alter table public.accounts add column frozen boolean not null default false;

-- 2. Transactions need a type for manual admin adjustments
alter table public.transactions drop constraint if exists transactions_type_check;
alter table public.transactions
  add constraint transactions_type_check check (type in ('transfer', 'deposit', 'bill', 'adjustment'));

-- ============================================================
-- ADMIN VISIBILITY — admins can read every row, not just their own.
-- (Writes from the frontend still only happen through the SECURITY
-- DEFINER functions below, which check is_admin themselves.)
-- ============================================================
create policy "admins view all profiles" on public.profiles
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "admins view all accounts" on public.accounts
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "admins view all transactions" on public.transactions
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- ============================================================
-- ADMIN: manually credit/debit a balance (e.g. "load test funds",
-- correct a demo mistake). Logs every adjustment to the ledger so
-- there's no balance change without a paper trail.
-- ============================================================
create or replace function public.admin_adjust_balance(
  p_account_id uuid,
  p_amount numeric,
  p_note text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean;
  v_new_balance numeric;
  v_account_name text;
begin
  select is_admin into v_is_admin from public.profiles where id = auth.uid();
  if not coalesce(v_is_admin, false) then
    raise exception 'Not authorized';
  end if;

  if p_amount = 0 then
    raise exception 'Amount must be non-zero';
  end if;

  update public.accounts
  set balance = balance + p_amount
  where id = p_account_id
  returning balance into v_new_balance;

  if v_new_balance is null then
    raise exception 'Account not found';
  end if;

  select p.full_name into v_account_name
  from public.accounts a join public.profiles p on p.id = a.user_id
  where a.id = p_account_id;

  if p_amount > 0 then
    insert into public.transactions (to_account_id, to_name, from_name, amount, type, note)
    values (p_account_id, v_account_name, 'Nimbus admin', p_amount, 'adjustment', p_note);
  else
    insert into public.transactions (from_account_id, from_name, to_name, amount, type, note)
    values (p_account_id, v_account_name, 'Nimbus admin', abs(p_amount), 'adjustment', p_note);
  end if;

  return json_build_object('success', true, 'new_balance', v_new_balance);
end;
$$;

grant execute on function public.admin_adjust_balance(uuid, numeric, text) to authenticated;

-- ============================================================
-- ADMIN: freeze / unfreeze an account
-- ============================================================
create or replace function public.admin_set_frozen(
  p_account_id uuid,
  p_frozen boolean
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean;
begin
  select is_admin into v_is_admin from public.profiles where id = auth.uid();
  if not coalesce(v_is_admin, false) then
    raise exception 'Not authorized';
  end if;

  update public.accounts set frozen = p_frozen where id = p_account_id;

  return json_build_object('success', true);
end;
$$;

grant execute on function public.admin_set_frozen(uuid, boolean) to authenticated;

-- ============================================================
-- Replace transfer_funds to honor the frozen flag on both sides.
-- Same atomic locking behavior as before, with two new checks.
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
  v_from_frozen boolean;
  v_to_account_id uuid;
  v_to_frozen boolean;
  v_from_name text;
  v_to_name text;
begin
  if p_amount <= 0 then
    raise exception 'Amount must be greater than zero';
  end if;

  select balance, user_id, frozen into v_from_balance, v_from_user, v_from_frozen
  from public.accounts
  where id = p_from_account_id
  for update;

  if v_from_user is null then
    raise exception 'Sender account not found';
  end if;

  if v_from_user <> auth.uid() then
    raise exception 'Not authorized to transfer from this account';
  end if;

  if v_from_frozen then
    raise exception 'This account is frozen — contact support';
  end if;

  if v_from_balance < p_amount then
    raise exception 'Insufficient funds';
  end if;

  select id, frozen into v_to_account_id, v_to_frozen
  from public.accounts
  where account_number = p_to_account_number
  for update;

  if v_to_account_id is null then
    raise exception 'Recipient account number not found';
  end if;

  if v_to_account_id = p_from_account_id then
    raise exception 'Cannot transfer to the same account';
  end if;

  if v_to_frozen then
    raise exception 'Recipient account is frozen and cannot receive transfers';
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

-- ============================================================
-- Make yourself an admin — run this LAST, with your own email.
-- ============================================================
update public.profiles set is_admin = true where email = 'ace4facebook@gmail.com';
