-- Bangui Guide v2 : comptes visiteurs, avis, messagerie, articles (menu/chambres/produits), propriétaires.
-- Coller dans Supabase > SQL Editor > Run (une seule fois).

-- 1) Rôles + profil créé automatiquement à l'inscription
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('user','agent','admin'));

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(nullif(new.raw_user_meta_data->>'full_name',''), split_part(new.email,'@',1)), 'user')
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- 2) Colonnes lieux
alter table public.places add column if not exists owner_id uuid references auth.users(id);
alter table public.places add column if not exists tags text[] not null default '{}';

-- 3) Fonctions utilitaires
create or replace function public.owns_place(pid uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select public.is_admin() or exists(select 1 from public.places where id = pid and owner_id = auth.uid()) $$;

create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = public as
$$ select exists(select 1 from public.places where owner_id = auth.uid()) $$;

-- 4) Lecture des lieux : publiés, ou à soi, ou à son propriétaire
drop policy if exists "lieux: lecture" on public.places;
create policy "lieux: lecture" on public.places for select
  using (status = 'published' or created_by = auth.uid() or owner_id = auth.uid() or public.is_admin());

-- Le propriétaire modifie les infos de son lieu via cette fonction (pas les champs sensibles)
create or replace function public.owner_update_place(p_id uuid, p_phone text, p_hours text, p_address text, p_description text, p_tags text[], p_photo_url text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.owns_place(p_id) then raise exception 'Non autorisé'; end if;
  update public.places set phone = p_phone, hours = p_hours, address = p_address, description = p_description,
    tags = coalesce(p_tags, '{}'), photo_url = coalesce(p_photo_url, photo_url) where id = p_id;
end $$;

-- L'admin rattache un lieu au compte d'un propriétaire (par email)
create or replace function public.set_place_owner(p_id uuid, p_email text) returns text
language plpgsql security definer set search_path = public as $$
declare u uuid;
begin
  if not public.is_admin() then raise exception 'Non autorisé'; end if;
  if coalesce(p_email,'') = '' then update public.places set owner_id = null where id = p_id; return 'Propriétaire retiré'; end if;
  select id into u from auth.users where lower(email) = lower(p_email);
  if u is null then return 'Aucun compte avec cet email'; end if;
  update public.places set owner_id = u where id = p_id; return 'Propriétaire défini';
end $$;

-- 5) Articles (menu, chambres, produits, services...)
create table if not exists public.place_items (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  name text not null, description text, price numeric, unit text, photo_url text,
  created_at timestamptz not null default now()
);
create index if not exists place_items_place_idx on public.place_items(place_id);
alter table public.place_items enable row level security;
drop policy if exists "articles: lecture" on public.place_items;
create policy "articles: lecture" on public.place_items for select
  using (exists(select 1 from public.places p where p.id = place_id and p.status = 'published') or public.owns_place(place_id));
drop policy if exists "articles: écriture" on public.place_items;
create policy "articles: écriture" on public.place_items for all using (public.owns_place(place_id)) with check (public.owns_place(place_id));

-- 6) Avis
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  author text, rating int not null check (rating between 1 and 5), comment text check (length(comment) <= 1000),
  created_at timestamptz not null default now(), unique (place_id, user_id)
);
alter table public.reviews enable row level security;
drop policy if exists "avis: lecture" on public.reviews;
create policy "avis: lecture" on public.reviews for select using (true);
drop policy if exists "avis: ajout" on public.reviews;
create policy "avis: ajout" on public.reviews for insert with check (user_id = auth.uid());
drop policy if exists "avis: modif" on public.reviews;
create policy "avis: modif" on public.reviews for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "avis: suppression" on public.reviews;
create policy "avis: suppression" on public.reviews for delete using (user_id = auth.uid() or public.is_admin());

create or replace function public.set_review_author() returns trigger
language plpgsql security definer set search_path = public as $$
begin new.author := (select full_name from public.profiles where id = new.user_id); return new; end $$;
drop trigger if exists reviews_author on public.reviews;
create trigger reviews_author before insert or update on public.reviews for each row execute function public.set_review_author();

create or replace view public.place_stats with (security_invoker = true) as
  select place_id, round(avg(rating)::numeric, 1)::float as avg, count(*)::int as n from public.reviews group by place_id;
grant select on public.place_stats to anon, authenticated;

-- 7) Messagerie visiteur <-> établissement
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  user_name text, last_message text, last_at timestamptz not null default now(),
  unique (place_id, user_id)
);
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id),
  body text not null check (length(body) between 1 and 2000),
  created_at timestamptz not null default now(), read_at timestamptz
);
create index if not exists messages_conv_idx on public.messages(conversation_id, created_at);

create or replace function public.can_access_conv(c uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select exists(select 1 from public.conversations v where v.id = c and (v.user_id = auth.uid() or public.owns_place(v.place_id))) $$;

alter table public.conversations enable row level security;
alter table public.messages enable row level security;
drop policy if exists "conv: lecture" on public.conversations;
create policy "conv: lecture" on public.conversations for select using (user_id = auth.uid() or public.owns_place(place_id));
drop policy if exists "conv: création" on public.conversations;
create policy "conv: création" on public.conversations for insert with check (user_id = auth.uid());
drop policy if exists "msg: lecture" on public.messages;
create policy "msg: lecture" on public.messages for select using (public.can_access_conv(conversation_id));
drop policy if exists "msg: envoi" on public.messages;
create policy "msg: envoi" on public.messages for insert with check (sender_id = auth.uid() and public.can_access_conv(conversation_id));

create or replace function public.touch_conversation() returns trigger
language plpgsql security definer set search_path = public as $$
begin update public.conversations set last_message = left(new.body, 140), last_at = new.created_at where id = new.conversation_id; return new; end $$;
drop trigger if exists messages_touch on public.messages;
create trigger messages_touch after insert on public.messages for each row execute function public.touch_conversation();

create or replace function public.mark_read(c uuid) returns void
language sql security definer set search_path = public as
$$ update public.messages set read_at = now() where conversation_id = c and sender_id <> auth.uid() and read_at is null and public.can_access_conv(c) $$;

-- 8) Photos : agents ET propriétaires peuvent envoyer dans leur dossier
drop policy if exists "photos: agent envoie" on storage.objects;
create policy "photos: agent envoie" on storage.objects for insert
  with check (bucket_id = 'place-photos' and (public.is_agent() or public.is_owner())
              and (storage.foldername(name))[1] = auth.uid()::text);
