-- Devolve a reserva manual quando a chamada GeckoAPI falha.
-- Execute após as migrations 002 e 003 no Supabase SQL Editor.
create or replace function public.release_milharadar_manual_gecko_query()
returns integer language plpgsql security definer set search_path = public as $$
declare today date := (now() at time zone 'America/Sao_Paulo')::date; remaining integer;
begin
 update public.milharadar_gecko_daily_usage
 set manual_queries=greatest(0,manual_queries-1),updated_at=now()
 where usage_date=today returning greatest(0,3-manual_queries) into remaining;
 if remaining is null then return 3; end if;
 return remaining;
end; $$;
revoke all on function public.release_milharadar_manual_gecko_query() from public,anon,authenticated;
grant execute on function public.release_milharadar_manual_gecko_query() to service_role;
