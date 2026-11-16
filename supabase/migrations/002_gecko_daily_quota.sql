-- MilhaRadar: limite global de consultas manuais GeckoAPI
-- Execute este arquivo no Supabase SQL Editor. Não altera nem recria as tabelas existentes.

create table if not exists public.milharadar_gecko_daily_usage (
  usage_date date primary key,
  manual_queries integer not null default 0 check (manual_queries between 0 and 3),
  alert_queries integer not null default 0 check (alert_queries >= 0),
  updated_at timestamptz not null default now()
);

alter table public.milharadar_gecko_daily_usage enable row level security;

create or replace function public.reserve_milharadar_manual_gecko_query()
returns table (allowed boolean, used integer, remaining integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  today date := (now() at time zone 'America/Sao_Paulo')::date;
  current_used integer;
begin
  insert into public.milharadar_gecko_daily_usage (usage_date)
  values (today)
  on conflict (usage_date) do nothing;

  update public.milharadar_gecko_daily_usage
     set manual_queries = manual_queries + 1,
         updated_at = now()
   where usage_date = today
     and manual_queries < 3
  returning manual_queries into current_used;

  if current_used is null then
    select manual_queries into current_used
      from public.milharadar_gecko_daily_usage
     where usage_date = today;
    return query select false, current_used, greatest(0, 3-current_used);
  else
    return query select true, current_used, greatest(0, 3-current_used);
  end if;
end;
$$;

revoke all on function public.reserve_milharadar_manual_gecko_query() from public, anon, authenticated;
grant execute on function public.reserve_milharadar_manual_gecko_query() to service_role;

comment on table public.milharadar_gecko_daily_usage is
  'Contagem diária de consultas GeckoAPI. Cota manual (3/dia) separada das consultas de alertas.';
