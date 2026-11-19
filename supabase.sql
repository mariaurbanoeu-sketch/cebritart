-- El taller de Cebritart · base de dades compartida (Supabase / Postgres)
-- Copia-ho tot al SQL Editor del projecte de Supabase i prem "Run".

-- 1) L'Ofrena: un comptador per mes. Com que la clau és 'AAAA-MM', cada mes comença de zero tot sol.
create table if not exists public.ofrena_rams (
  mes   text primary key,              -- p. ex. '2026-11'
  total integer not null default 0
);

-- 2) L'indult: un vot per navegador i any faller (es pot canviar fins al 14 de març).
create table if not exists public.indult_vots (
  any_faller integer not null,          -- p. ex. 2027 (vots del 20/03/2026 al 14/03/2027)
  votant     uuid    not null,
  ninot      text    not null,
  creat      timestamptz not null default now(),
  primary key (any_faller, votant)
);

-- Ningú no pot llegir ni escriure les taules directament: només a través de les funcions de baix.
alter table public.ofrena_rams enable row level security;
alter table public.indult_vots enable row level security;

-- Suma un ram al mes actual i torna el total
create or replace function public.ofrena_suma(p_mes text)
returns integer language sql security definer set search_path = public as $$
  insert into ofrena_rams (mes, total) values (p_mes, 1)
  on conflict (mes) do update set total = ofrena_rams.total + 1
  returning total;
$$;

-- Total de rams del mes
create or replace function public.ofrena_total(p_mes text)
returns integer language sql security definer set search_path = public as $$
  select coalesce((select total from ofrena_rams where mes = p_mes), 0);
$$;

-- Vota (o canvia el vot). Si p_ninot és buit, retira el vot. Les votacions es tanquen del 15 al 19 de març.
create or replace function public.indult_vota(p_any integer, p_votant uuid, p_ninot text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if extract(month from now() at time zone 'Europe/Madrid') = 3
     and extract(day from now() at time zone 'Europe/Madrid') between 15 and 19 then
    return;
  end if;
  if coalesce(p_ninot, '') = '' then
    delete from indult_vots where any_faller = p_any and votant = p_votant;
  else
    insert into indult_vots (any_faller, votant, ninot) values (p_any, p_votant, left(p_ninot, 120))
    on conflict (any_faller, votant) do update set ninot = excluded.ninot, creat = now();
  end if;
end;
$$;

-- El guanyador només es pot consultar a partir del 15 de març de l'any faller
create or replace function public.indult_guanyador(p_any integer)
returns text language sql security definer set search_path = public as $$
  select ninot from indult_vots
  where any_faller = p_any
    and now() >= make_timestamptz(p_any, 3, 15, 0, 0, 0, 'Europe/Madrid')
  group by ninot order by count(*) desc, min(creat) asc limit 1;
$$;

grant execute on function public.ofrena_suma(text), public.ofrena_total(text),
  public.indult_vota(integer, uuid, text), public.indult_guanyador(integer) to anon;
