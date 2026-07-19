-- Migration 001: admin role + tightened RLS
-- Additive and idempotent — safe to run against the live database.
-- After this runs:
--   * profiles.is_admin flags admins (joshwetzel@gmail.com is set below)
--   * products: only admins can insert/update/delete
--   * reviews: anyone signed in can insert/update their own; delete own OR admin
--   * storage uploads: admin-only (photos are only used when creating products)
--   * profiles: display names publicly readable (they're shown on public reviews)

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- security definer so the check works regardless of profiles RLS
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

-- Products: admin-only writes
drop policy if exists "Authenticated users can insert products" on public.products;
drop policy if exists "Authenticated users can update products" on public.products;
drop policy if exists "Authenticated users can delete products" on public.products;
drop policy if exists "Admins can insert products" on public.products;
drop policy if exists "Admins can update products" on public.products;
drop policy if exists "Admins can delete products" on public.products;

create policy "Admins can insert products"
  on public.products for insert to authenticated with check (public.is_admin());
create policy "Admins can update products"
  on public.products for update to authenticated using (public.is_admin());
create policy "Admins can delete products"
  on public.products for delete to authenticated using (public.is_admin());

-- Reviews: delete own or admin (insert/update stay own-only)
drop policy if exists "Users can delete their own reviews" on public.reviews;
drop policy if exists "Users can delete own reviews; admins can delete any" on public.reviews;

create policy "Users can delete own reviews; admins can delete any"
  on public.reviews for delete to authenticated
  using (auth.uid() = user_id or public.is_admin());

-- Storage: admin-only uploads
drop policy if exists "Anyone authenticated can upload photos" on storage.objects;
drop policy if exists "Admins can upload photos" on storage.objects;

create policy "Admins can upload photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'coffee-photos' and public.is_admin());

-- Profiles: reviewer display names are shown on public review pages
drop policy if exists "Profiles are viewable by authenticated users" on public.profiles;
drop policy if exists "Profiles viewable by all" on public.profiles;

create policy "Profiles viewable by all"
  on public.profiles for select using (true);

-- Flag the admin account
update public.profiles set is_admin = true
where id in (select id from auth.users where email = 'joshwetzel@gmail.com');

-- Verify: should list exactly one row (the admin)
select u.email, p.display_name, p.is_admin
from public.profiles p join auth.users u on u.id = p.id
where p.is_admin;
