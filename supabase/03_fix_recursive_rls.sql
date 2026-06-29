-- ============================================================
-- Fix: infinite recursion in admin RLS policies
-- Run this once if you already ran the original 02_admin.sql
-- ============================================================

drop policy if exists "admins view all profiles" on public.profiles;
drop policy if exists "admins view all accounts" on public.accounts;
drop policy if exists "admins view all transactions" on public.transactions;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

grant execute on function public.is_admin() to authenticated;

create policy "admins view all profiles" on public.profiles
  for select using (public.is_admin());

create policy "admins view all accounts" on public.accounts
  for select using (public.is_admin());

create policy "admins view all transactions" on public.transactions
  for select using (public.is_admin());
