create table if not exists public.site_pages (
  key text primary key,
  site jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_pages_known_key check (key = 'main'),
  constraint site_pages_size check (octet_length(site::text) <= 65536)
);

alter table public.site_pages enable row level security;
drop policy if exists "Public can read site pages" on public.site_pages;
create policy "Public can read site pages" on public.site_pages for select using (true);
