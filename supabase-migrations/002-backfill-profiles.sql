-- Migration 002: backfill profiles for users created before the profiles
-- table existed (the handle_new_user trigger only covers new signups).

insert into public.profiles (id, display_name)
select id, coalesce(raw_user_meta_data->>'display_name', split_part(email, '@', 1))
from auth.users
on conflict (id) do nothing;

update public.profiles set is_admin = true
where id in (select id from auth.users where email = 'joshwetzel@gmail.com');

select u.email, p.display_name, p.is_admin
from public.profiles p join auth.users u on u.id = p.id
order by p.is_admin desc;
