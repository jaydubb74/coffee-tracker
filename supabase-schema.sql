-- Run this in your Supabase SQL editor to set up the database
-- Safe to run multiple times — drops existing objects first

-- Drop existing tables (cascade handles dependencies)
drop table if exists public.reviews cascade;
drop table if exists public.ratings cascade;
drop table if exists public.coffees cascade;
drop table if exists public.brands cascade;
drop table if exists public.profiles cascade;

-- Drop existing trigger and function
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Drop existing storage policies
drop policy if exists "Anyone authenticated can upload photos" on storage.objects;
drop policy if exists "Photos are publicly viewable" on storage.objects;

-- -------------------------------------------------------

-- Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select to authenticated using (true);
create policy "Users can update their own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);

-- Auto-create profile on signup
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

-- Brands table
create table public.brands (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  created_at timestamptz default now()
);

alter table public.brands enable row level security;
create policy "Brands viewable by all"
  on public.brands for select using (true);
create policy "Authenticated users can insert brands"
  on public.brands for insert to authenticated with check (true);

-- Coffees table (a unique brand + blend product)
create table public.coffees (
  id uuid default gen_random_uuid() primary key,
  brand_id uuid references public.brands on delete cascade not null,
  blend text,
  roast_type text,
  photo_url text,
  created_at timestamptz default now(),
  unique (brand_id, blend)
);

alter table public.coffees enable row level security;
create policy "Coffees viewable by all"
  on public.coffees for select using (true);
create policy "Authenticated users can insert coffees"
  on public.coffees for insert to authenticated with check (true);
create policy "Authenticated users can update coffees"
  on public.coffees for update to authenticated using (true);
create policy "Authenticated users can delete coffees"
  on public.coffees for delete to authenticated using (true);

-- Reviews table (individual tasting sessions — multiple allowed per coffee per user)
create table public.reviews (
  id uuid default gen_random_uuid() primary key,
  coffee_id uuid references public.coffees on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  score integer not null check (score >= 1 and score <= 100),
  notes text,
  created_at timestamptz default now()
);

alter table public.reviews enable row level security;
create policy "Reviews viewable by all"
  on public.reviews for select using (true);
create policy "Users can insert their own reviews"
  on public.reviews for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update their own reviews"
  on public.reviews for update to authenticated using (auth.uid() = user_id);
create policy "Users can delete their own reviews"
  on public.reviews for delete to authenticated using (auth.uid() = user_id);

-- Storage bucket for coffee photos (skip if already exists)
insert into storage.buckets (id, name, public) values ('coffee-photos', 'coffee-photos', true)
  on conflict (id) do nothing;

create policy "Anyone authenticated can upload photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'coffee-photos');

create policy "Photos are publicly viewable"
  on storage.objects for select
  using (bucket_id = 'coffee-photos');
