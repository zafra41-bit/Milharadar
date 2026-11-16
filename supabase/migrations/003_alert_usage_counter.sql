-- Registra consultas do monitoramento separadamente da cota manual.
create or replace function public.record_milharadar_alert_gecko_query()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  today date := (now() at time zone 'America/Sao_Paulo')::date;
  total integer;
begin
  insert into public.milharadar_gecko_daily_usage (usage_date, alert_queries)
  values (today, 1)
  on conflict (usage_date) do update
    set alert_queries = public.milharadar_gecko_daily_usage.alert_queries + 1,
        updated_at = now()
  returning alert_queries into total;
  return total;
end;
$$;
revoke all on function public.record_milharadar_alert_gecko_query() from public, anon, authenticated;
grant execute on function public.record_milharadar_alert_gecko_query() to service_role;
