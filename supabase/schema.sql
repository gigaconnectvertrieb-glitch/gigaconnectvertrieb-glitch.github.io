-- Einmalig im Supabase SQL Editor ausführen.
create table if not exists public.ll_tours (
  id text primary key,
  data jsonb not null,
  updated_at text not null,
  deleted boolean not null default false
);

create table if not exists public.ll_entries (
  id text primary key,
  tour_id text not null,
  data jsonb not null,
  updated_at text not null,
  deleted boolean not null default false
);

create index if not exists ll_tours_upd on public.ll_tours (updated_at);
create index if not exists ll_entries_upd on public.ll_entries (updated_at);

alter table public.ll_tours enable row level security;
alter table public.ll_entries enable row level security;

drop policy if exists team_all on public.ll_tours;
drop policy if exists team_all on public.ll_entries;
create policy team_all on public.ll_tours for all to anon using (true) with check (true);
create policy team_all on public.ll_entries for all to anon using (true) with check (true);
