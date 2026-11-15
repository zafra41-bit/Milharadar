-- MilhaRadar: armazenamento de alertas e inscrições Web Push
-- Execute este script no Supabase SQL Editor.
-- As tabelas são acessadas somente pelas funções server-side usando service_role.
-- Não crie políticas públicas para anon/authenticated.

create extension if not exists pgcrypto;

create table if not exists public.milharadar_alerts (
  id uuid primary key default gen_random_uuid(),
  device_token_hash text not null,
  origin jsonb not null,
  destination jsonb not null,
  months jsonb not null default '[]'::jsonb,
  duration_days integer not null check (duration_days between 1 and 60),
  passengers integer not null check (passengers between 1 and 9),
  program text not null default 'TudoAzul',
  target_points_per_pax integer not null check (target_points_per_pax > 0),
  active boolean not null default true,
  last_checked_at timestamptz,
  last_notified_hash text,
  last_match jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists milharadar_alerts_device_idx
  on public.milharadar_alerts (device_token_hash);
create index if not exists milharadar_alerts_active_idx
  on public.milharadar_alerts (active) where active = true;

create table if not exists public.milharadar_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  device_token_hash text not null unique,
  subscription jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.milharadar_alerts enable row level security;
alter table public.milharadar_push_subscriptions enable row level security;

comment on table public.milharadar_alerts is
  'Alertas privados do MilhaRadar; acesso somente pelo backend com service_role.';
comment on table public.milharadar_push_subscriptions is
  'Inscrições Web Push privadas; acesso somente pelo backend com service_role.';
