create or replace function public.health_ping()
returns timestamptz
language sql
stable
security invoker
set search_path = public
as $$
  select now();
$$;

grant execute on function public.health_ping() to anon;
grant execute on function public.health_ping() to authenticated;
