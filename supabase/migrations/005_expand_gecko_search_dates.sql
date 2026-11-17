-- MilhaRadar: amplia a cota manual da GeckoAPI para permitir 10 datas por busca.
-- Execute no Supabase SQL Editor antes de usar a nova versão da aplicação.

alter table public.milharadar_gecko_daily_usage
  drop constraint if exists milharadar_gecko_daily_usage_manual_queries_check;

alter table public.milharadar_gecko_daily_usage
  add constraint milharadar_gecko_daily_usage_manual_queries_check
  check (manual_queries between 0 and 10);

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
     and manual_queries < 10
  returning manual_queries into current_used;

  if current_used is null then
    select manual_queries into current_used
      from public.milharadar_gecko_daily_usage
     where usage_date = today;
    return query select false, current_used, greatest(0, 10-current_used);
  else
    return query select true, current_used, greatest(0, 10-current_used);
  end if;
end;
$$;

revoke all on function public.reserve_milharadar_manual_gecko_query() from public, anon, authenticated;
grant execute on function public.reserve_milharadar_manual_gecko_query() to service_role;

create or replace function public.release_milharadar_manual_gecko_query()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  today date := (now() at time zone 'America/Sao_Paulo')::date;
  remaining integer;
begin
  update public.milharadar_gecko_daily_usage
     set manual_queries = greatest(0, manual_queries - 1),
         updated_at = now()
   where usage_date = today
   returning greatest(0, 10-manual_queries) into remaining;

  if remaining is null then return 10; end if;
  return remaining;
end;
$$;

revoke all on function public.release_milharadar_manual_gecko_query() from public, anon, authenticated;
grant execute on function public.release_milharadar_manual_gecko_query() to service_role;
