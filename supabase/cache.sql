-- Einmalig im Supabase SQL Editor ausführen (gemeinsamer Cache für Straßen/Hausnummern).
create table if not exists public.ll_cache (
  key text primary key,
  data jsonb not null,
  updated_at text not null
);

alter table public.ll_cache enable row level security;
drop policy if exists team_all on public.ll_cache;
create policy team_all on public.ll_cache for all to anon using (true) with check (true);
