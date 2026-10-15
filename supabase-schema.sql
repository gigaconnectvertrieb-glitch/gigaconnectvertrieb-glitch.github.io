-- ============================================================
-- E1 Gebietstracker - Supabase Schema
-- Im Supabase Dashboard unter "SQL Editor" ausführen.
-- ============================================================

-- Gebiete (z. B. "Groß-Zimmern")
create table if not exists public.gebiete (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  street text,
  bounds jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Adressen (jede Hausnummer einzeln)
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  gebiet_id uuid not null references public.gebiete(id) on delete cascade,
  street_name text not null,
  house_number text not null,
  lat double precision,
  lng double precision,
  status text not null default 'unvisited'
    check (status in ('unvisited', 'nicht_da', 'kein_interesse', 'abschluss')),
  visited_by text,
  visited_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Einmal pro Straße + Hausnummer pro Gebiet
create unique index if not exists addresses_unique_idx
  on public.addresses (gebiet_id, street_name, house_number);

-- Indizes für schnelles Laden
create index if not exists addresses_gebiet_idx on public.addresses (gebiet_id);
create index if not exists addresses_status_idx on public.addresses (status);

-- ============================================================
-- Row Level Security
-- Öffnen für den anon-Key (Team-App ohne Login).
-- ============================================================
alter table public.gebiete enable row level security;
alter table public.addresses enable row level security;

drop policy if exists "gebiete_all" on public.gebiete;
create policy "gebiete_all" on public.gebiete
  for all using (true) with check (true);

drop policy if exists "addresses_all" on public.addresses;
create policy "addresses_all" on public.addresses
  for all using (true) with check (true);

-- ============================================================
-- Realtime aktivieren (für Live-Sync zwischen euch beiden)
-- Falls Tabellen schon in publication sind, ignorieren
-- ============================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'gebiete'
  ) then
    alter publication supabase_realtime add table public.gebiete;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'addresses'
  ) then
    alter publication supabase_realtime add table public.addresses;
  end if;
exception when others then
  null;
end $$;