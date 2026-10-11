-- DailyGlow 3.0: run once in Supabase SQL Editor
create table if not exists public.dailyglow_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.dailyglow_profiles enable row level security;
revoke all on public.dailyglow_profiles from anon;
grant select, insert, update, delete on public.dailyglow_profiles to authenticated;
drop policy if exists "Read own DailyGlow data" on public.dailyglow_profiles;
drop policy if exists "Create own DailyGlow data" on public.dailyglow_profiles;
drop policy if exists "Update own DailyGlow data" on public.dailyglow_profiles;
drop policy if exists "Delete own DailyGlow data" on public.dailyglow_profiles;
create policy "Read own DailyGlow data" on public.dailyglow_profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy "Create own DailyGlow data" on public.dailyglow_profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own DailyGlow data" on public.dailyglow_profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Delete own DailyGlow data" on public.dailyglow_profiles for delete to authenticated using ((select auth.uid()) = user_id);
