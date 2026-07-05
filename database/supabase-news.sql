create table if not exists public.news_posts (
  id text primary key,
  slug text not null unique,
  img text,
  title text not null,
  description text not null,
  category text not null default 'Announcement',
  date text not null,
  date_value date,
  author text not null default 'AlwiNation Team',
  reading_time text not null default '2 min read',
  featured boolean not null default false,
  body jsonb not null default '[]'::jsonb,
  highlights jsonb not null default '[]'::jsonb,
  source text not null default 'admin',
  deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint news_posts_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint news_posts_body_size check (octet_length(body::text) <= 65536),
  constraint news_posts_highlights_size check (octet_length(highlights::text) <= 4096)
);

create index if not exists news_posts_updated_at_idx on public.news_posts (updated_at desc);

alter table public.news_posts enable row level security;

drop policy if exists "Public can read news posts" on public.news_posts;
create policy "Public can read news posts"
  on public.news_posts
  for select
  using (true);
