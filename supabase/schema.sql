-- Bangui Guide — schéma Supabase. Coller dans : Supabase > SQL Editor > Run.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null check (role in ('agent','admin'))
);

create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  area text,
  address text,
  phone text,
  hours text,
  description text,
  lat double precision,
  lng double precision,
  photo_url text,
  status text not null default 'pending' check (status in ('pending','published','rejected')),
  verified boolean not null default false,
  sponsored boolean not null default false,
  sponsored_until timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists places_status_idx on public.places(status, created_at desc);
create index if not exists places_cat_idx on public.places(category);

create or replace function public.is_agent() returns boolean
language sql stable security definer set search_path = public as
$$ select exists(select 1 from public.profiles where id = auth.uid() and role in ('agent','admin')) $$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as
$$ select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin') $$;

alter table public.profiles enable row level security;
alter table public.places enable row level security;

drop policy if exists "profil: lire le sien" on public.profiles;
create policy "profil: lire le sien" on public.profiles for select using (id = auth.uid());

drop policy if exists "lieux: lecture" on public.places;
create policy "lieux: lecture" on public.places for select
  using (status = 'published' or created_by = auth.uid() or public.is_admin());

drop policy if exists "lieux: agent crée" on public.places;
create policy "lieux: agent crée" on public.places for insert
  with check (public.is_agent() and created_by = auth.uid() and status = 'pending'
              and verified = false and sponsored = false);

drop policy if exists "lieux: admin modifie" on public.places;
create policy "lieux: admin modifie" on public.places for update
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "lieux: admin supprime" on public.places;
create policy "lieux: admin supprime" on public.places for delete using (public.is_admin());

-- Photos
insert into storage.buckets (id, name, public) values ('place-photos','place-photos', true)
on conflict (id) do nothing;

drop policy if exists "photos: lecture publique" on storage.objects;
create policy "photos: lecture publique" on storage.objects for select using (bucket_id = 'place-photos');

drop policy if exists "photos: agent envoie" on storage.objects;
create policy "photos: agent envoie" on storage.objects for insert
  with check (bucket_id = 'place-photos' and public.is_agent()
              and (storage.foldername(name))[1] = auth.uid()::text);

-- APRÈS avoir créé ton utilisateur (Authentication > Users > Add user),
-- remplace l'email puis exécute pour te donner le rôle admin :
-- insert into public.profiles (id, full_name, role)
--   select id, 'Administrateur', 'admin' from auth.users where email = 'TON_EMAIL';
