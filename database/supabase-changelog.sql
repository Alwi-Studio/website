-- Changelog entries for AlwiNation.
-- Each entry belongs to a freeform "realm" (a backend server / gamemode, e.g. Skyblock),
-- carries a version, and a list of grouped changes (added / changed / fixed / ...).
-- Run this in the Supabase SQL editor. Safe to run more than once.

create table if not exists public.changelog_entries (
  id text primary key,
  slug text not null unique,
  realm text not null default 'General',
  img text,
  version text not null,
  title text not null default '',
  summary text not null default '',
  tag text not null default 'Update',
  date text not null,
  date_value date,
  author text not null default 'AlwiNation Team',
  changes jsonb not null default '[]'::jsonb,
  source text not null default 'admin',
  deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint changelog_entries_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint changelog_entries_changes_size check (octet_length(changes::text) <= 65536)
);

-- For projects created before image support was added:
alter table public.changelog_entries add column if not exists img text;

create index if not exists changelog_entries_updated_at_idx on public.changelog_entries (updated_at desc);
create index if not exists changelog_entries_realm_idx on public.changelog_entries (realm);

alter table public.changelog_entries enable row level security;

drop policy if exists "Public can read changelog entries" on public.changelog_entries;
create policy "Public can read changelog entries"
  on public.changelog_entries
  for select
  using (true);

-- Managed realm list (categories you create and assign to entries).
create table if not exists public.changelog_realms (
  key text primary key,
  realms jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint changelog_realms_known_key check (key = 'main'),
  constraint changelog_realms_size check (octet_length(realms::text) <= 8192)
);

alter table public.changelog_realms enable row level security;

drop policy if exists "Public can read changelog realms" on public.changelog_realms;
create policy "Public can read changelog realms"
  on public.changelog_realms
  for select
  using (true);
