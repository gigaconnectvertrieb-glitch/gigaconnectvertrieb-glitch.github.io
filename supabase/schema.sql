-- Eigenes Schema der Gebiets-App. Im Supabase-SQL-Editor einmal ausführen.

create table if not exists staff (
  id text primary key,
  name text not null,
  role text not null default 'Vertrieb'
);

create table if not exists territories (
  id text primary key,
  name text not null,
  zip text default '',
  city text default '',
  active boolean not null default true,
  center jsonb,
  polygon jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists doors (
  id text primary key,
  territory_id text not null references territories(id) on delete cascade,
  street text default '',
  house text default '',
  zip text default '',
  city text default '',
  lat double precision,
  lng double precision,
  note text default '',
  status text default 'offen',
  kind text default 'efh',
  units jsonb default '[]'::jsonb,
  sort_order integer default 0
);

create table if not exists visits (
  id text primary key,
  door_id text,
  territory_id text,
  user_id text,
  reason text,
  note text default '',
  street text default '',
  house text default '',
  zip text default '',
  city text default '',
  follow_up_on date,
  week_key text default '',
  list_status text default 'offen'
);

create table if not exists territory_members (
  territory_id text not null references territories(id) on delete cascade,
  user_id text not null,
  accepted_at date,
  primary key (territory_id, user_id)
);

alter table staff enable row level security;
alter table territories enable row level security;
alter table doors enable row level security;
alter table visits enable row level security;
alter table territory_members enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['staff','territories','doors','visits','territory_members']
  loop
    execute format('drop policy if exists app_all on %I', t);
    execute format('create policy app_all on %I for all to anon, authenticated using (true) with check (true)', t);
  end loop;
end $$;
