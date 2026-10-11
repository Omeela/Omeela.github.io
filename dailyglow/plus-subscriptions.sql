-- DailyGlow Plus: server-managed subscription entitlements.
-- Run separately in Supabase SQL Editor after reviewing the project settings.
-- IMPORTANT: This migration alone does not connect Stripe or enable billing.
create table if not exists public.dailyglow_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  status text not null default 'inactive'
    check (status in ('inactive','trialing','active','past_due','canceled','unpaid','incomplete','incomplete_expired','paused')),
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.dailyglow_subscriptions enable row level security;
-- Signed-in users may inspect only their own entitlement.
drop policy if exists "Read own DailyGlow subscription" on public.dailyglow_subscriptions;
create policy "Read own DailyGlow subscription"
on public.dailyglow_subscriptions for select to authenticated
using ((select auth.uid()) = user_id);
-- Do not grant client insert/update/delete. A verified server-side Stripe
-- webhook must write through a privileged backend (service role), never
-- from GitHub Pages or a browser-supplied subscription status.
revoke insert, update, delete on public.dailyglow_subscriptions from anon, authenticated;
grant select on public.dailyglow_subscriptions to authenticated;
