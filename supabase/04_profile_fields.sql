-- ============================================================
-- Profile fields migration — run after 02_admin.sql / 03_fix_recursive_rls.sql
-- Adds the fields the Profile page needs, and lets users update their own row
-- (the original schema only ever let users SELECT their profile, not UPDATE it).
-- ============================================================

alter table public.profiles add column phone text;
alter table public.profiles add column address text;

create policy "update own profile" on public.profiles
  for update using (id = auth.uid());
