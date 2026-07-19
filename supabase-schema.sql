-- WineYak — Multi-category schema
-- Safe to re-run: drops all existing objects first

drop table if exists public.reviews cascade;
drop table if exists public.products cascade;
drop table if exists public.coffees cascade;
drop table if exists public.brands cascade;
drop table if exists public.profiles cascade;

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.is_admin();

drop policy if exists "Anyone authenticated can upload photos" on storage.objects;
drop policy if exists "Admins can upload photos" on storage.objects;
drop policy if exists "Photos are publicly viewable" on storage.objects;

-- -------------------------------------------------------

-- Profiles (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null,
  is_admin boolean not null default false,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "Profiles viewable by all"
  on public.profiles for select using (true);
create policy "Users can update their own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);

-- security definer so the check works regardless of profiles RLS
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- -------------------------------------------------------

-- Products (shared across all categories)
-- category drives UI labels only; schema is category-agnostic
create table public.products (
  id            uuid default gen_random_uuid() primary key,
  category      text not null check (category in ('coffee', 'ice_cream')),
  brand         text not null,
  variant       text,          -- blend/origin for coffee; flavor for ice cream
  image_url     text,
  raw_price     decimal,       -- price as submitted
  raw_size      decimal,       -- size as submitted
  raw_size_unit text,          -- 'oz', 'lb', 'g', 'pint', 'qt'
  normalized_price decimal,    -- price scaled to category reference unit (coffee=12oz, ice cream=1 pint)
  price_unit    text,          -- 'per_12oz' | 'per_pint'
  roast_type    text,          -- coffee-specific; null for other categories
  notes         text,          -- product-level notes (sourcing, ingredients, etc.)
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique (category, brand, variant)
);

alter table public.products enable row level security;
create policy "Products viewable by all"
  on public.products for select using (true);
create policy "Admins can insert products"
  on public.products for insert to authenticated with check (public.is_admin());
create policy "Admins can update products"
  on public.products for update to authenticated using (public.is_admin());
create policy "Admins can delete products"
  on public.products for delete to authenticated using (public.is_admin());

-- -------------------------------------------------------

-- Reviews (category-agnostic; product_id determines category)
create table public.reviews (
  id                  uuid default gen_random_uuid() primary key,
  product_id          uuid references public.products on delete cascade not null,
  user_id             uuid references auth.users on delete cascade not null,
  rating              integer not null check (rating >= 1 and rating <= 100),
  review_text         text,
  submitted_image_url text,    -- image submitted with this review (used to seed products.image_url on creation)
  created_at          timestamptz default now()
);

alter table public.reviews enable row level security;
create policy "Reviews viewable by all"
  on public.reviews for select using (true);
create policy "Users can insert their own reviews"
  on public.reviews for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update their own reviews"
  on public.reviews for update to authenticated using (auth.uid() = user_id);
create policy "Users can delete own reviews; admins can delete any"
  on public.reviews for delete to authenticated
  using (auth.uid() = user_id or public.is_admin());

-- -------------------------------------------------------

-- Storage bucket for product photos
insert into storage.buckets (id, name, public) values ('coffee-photos', 'coffee-photos', true)
  on conflict (id) do nothing;

create policy "Admins can upload photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'coffee-photos' and public.is_admin());

create policy "Photos are publicly viewable"
  on storage.objects for select
  using (bucket_id = 'coffee-photos');
