-- ============================================================
-- Bills migration — run after 04_profile_fields.sql
-- Real recurring billers + an atomic "Pay Now" that actually debits a real
-- account and logs to the same transactions ledger everything else uses.
-- ============================================================

create table public.billers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  category text not null default 'other' check (category in ('utilities', 'rent', 'subscription', 'insurance', 'other')),
  amount numeric(14,2) not null check (amount > 0),
  due_date date not null,
  autopay boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.billers enable row level security;

create policy "view own billers" on public.billers
  for select using (user_id = auth.uid());

create policy "insert own billers" on public.billers
  for insert with check (user_id = auth.uid());

create policy "update own billers" on public.billers
  for update using (user_id = auth.uid());

create policy "delete own billers" on public.billers
  for delete using (user_id = auth.uid());

-- ============================================================
-- Pay a biller from a real account — same atomic-locking pattern as
-- transfer_funds. Advances the biller's due_date by one month afterward
-- so "Upcoming Bills" reflects the next cycle, same as a real autopay
-- system would.
-- ============================================================
create or replace function public.pay_bill(
  p_biller_id uuid,
  p_account_id uuid
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_biller record;
  v_account_balance numeric;
  v_account_user uuid;
  v_payer_name text;
begin
  select * into v_biller from public.billers where id = p_biller_id and user_id = auth.uid();
  if v_biller is null then
    raise exception 'Biller not found';
  end if;

  select balance, user_id into v_account_balance, v_account_user
  from public.accounts
  where id = p_account_id
  for update;

  if v_account_user is null or v_account_user <> auth.uid() then
    raise exception 'Not authorized to pay from this account';
  end if;

  if v_account_balance < v_biller.amount then
    raise exception 'Insufficient funds';
  end if;

  select full_name into v_payer_name from public.profiles where id = auth.uid();

  update public.accounts set balance = balance - v_biller.amount where id = p_account_id;

  insert into public.transactions (from_account_id, from_name, to_name, amount, type, note)
  values (p_account_id, v_payer_name, v_biller.name, v_biller.amount, 'bill', v_biller.category);

  update public.billers set due_date = due_date + interval '1 month' where id = p_biller_id;

  return json_build_object('success', true, 'biller_name', v_biller.name);
end;
$$;

grant execute on function public.pay_bill(uuid, uuid) to authenticated;