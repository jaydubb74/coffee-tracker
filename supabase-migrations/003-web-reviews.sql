-- Migration 003: aggregated web-review research per product
-- Written only by the /web-reviews skill via the Supabase CLI (postgres role,
-- bypasses RLS). The app reads it publicly and never writes it, so there are
-- deliberately no insert/update/delete policies.

create table if not exists public.product_web_reviews (
  product_id    uuid primary key references public.products on delete cascade,
  snippet       text not null,
  web_score     integer check (web_score >= 1 and web_score <= 100),
  confidence    text not null check (confidence in ('high', 'medium', 'low')),
  sources       jsonb not null default '[]'::jsonb,
  researched_at timestamptz not null default now()
);

alter table public.product_web_reviews enable row level security;

drop policy if exists "Web reviews viewable by all" on public.product_web_reviews;
create policy "Web reviews viewable by all"
  on public.product_web_reviews for select using (true);

select 'product_web_reviews ready' as status;
