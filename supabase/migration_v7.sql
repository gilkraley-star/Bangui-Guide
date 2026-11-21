-- v7 : notifications, espace agent complet, création de comptes par le personnel, pubs (stats/ordre/paiement), motif de refus, anti-spam
create extension if not exists pgcrypto with schema extensions;

-- 1) Motif de refus
alter table public.places add column if not exists reject_reason text;

-- 2) Notifications dans l'application
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null, body text, link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications(user_id, created_at desc);
alter table public.notifications enable row level security;
drop policy if exists "notif: lecture" on public.notifications;
create policy "notif: lecture" on public.notifications for select using (user_id = auth.uid());
drop policy if exists "notif: maj" on public.notifications;
create policy "notif: maj" on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "notif: suppression" on public.notifications;
create policy "notif: suppression" on public.notifications for delete using (user_id = auth.uid());
grant select, update, delete on public.notifications to authenticated;

create or replace function public.push_notif(u uuid, t text, b text, l text) returns void
language sql security definer set search_path = public as
$$ insert into public.notifications(user_id, title, body, link) select u, t, b, l where u is not null $$;
revoke all on function public.push_notif(uuid, text, text, text) from public, anon, authenticated;

-- fiche validée / refusée -> notifie l'agent ; nouvelle fiche en attente -> notifie les admins
create or replace function public.trg_place_notify() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if new.status = 'pending' then
      insert into notifications(user_id, title, body, link)
        select id, 'Nouvelle fiche à valider', new.name, '#/admin' from profiles where role = 'admin' and id is distinct from new.created_by;
    end if;
  elsif new.status is distinct from old.status and new.created_by is not null then
    if new.status = 'published' then perform push_notif(new.created_by, 'Fiche publiée', new.name || ' est maintenant visible dans l’application.', '#/place/' || new.id);
    elsif new.status = 'rejected' then perform push_notif(new.created_by, 'Fiche refusée', new.name || coalesce(' : ' || new.reject_reason, ''), '#/agent');
    end if;
  end if;
  return new;
end $$;
drop trigger if exists places_notify on public.places;
create trigger places_notify after insert or update of status on public.places for each row execute function public.trg_place_notify();

-- demande d'entreprise : admins prévenus à la création, demandeur prévenu à la décision
create or replace function public.trg_claim_notify() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into notifications(user_id, title, body, link) select id, 'Nouvelle demande d’entreprise', new.business_name, '#/admin/claims' from profiles where role = 'admin';
  elsif new.status is distinct from old.status then
    if new.status = 'approved' then perform push_notif(new.user_id, 'Entreprise validée', new.business_name || ' : votre espace client est prêt.', '#/manage');
    elsif new.status = 'rejected' then perform push_notif(new.user_id, 'Demande refusée', new.business_name, '#/profil');
    end if;
  end if;
  return new;
end $$;
drop trigger if exists claims_notify on public.claims;
create trigger claims_notify after insert or update of status on public.claims for each row execute function public.trg_claim_notify();

-- nouvelle conversation / nouvel avis -> notifie le propriétaire
create or replace function public.trg_conv_notify() returns trigger
language plpgsql security definer set search_path = public as $$
begin perform push_notif((select owner_id from places where id = new.place_id), 'Nouvelle demande', coalesce(new.user_name, 'Un visiteur') || ' vous a écrit.', '#/chat/' || new.id); return new; end $$;
drop trigger if exists conv_notify on public.conversations;
create trigger conv_notify after insert on public.conversations for each row execute function public.trg_conv_notify();

create or replace function public.trg_review_notify() returns trigger
language plpgsql security definer set search_path = public as $$
begin perform push_notif((select owner_id from places where id = new.place_id), 'Nouvel avis ' || new.rating || '/5', left(coalesce(new.comment, ''), 120), '#/manage/' || new.place_id); return new; end $$;
drop trigger if exists review_notify on public.reviews;
create trigger review_notify after insert on public.reviews for each row execute function public.trg_review_notify();

-- 3) Espace agent : lire/modifier ses fiches non publiées, articles, propriétaire
drop policy if exists "articles: lecture agent" on public.place_items;
create policy "articles: lecture agent" on public.place_items for select
  using (exists(select 1 from public.places p where p.id = place_id and p.created_by = auth.uid()));

create or replace function public.agent_update_place(p_id uuid, p jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from places where id = p_id and (created_by = auth.uid() and status in ('pending','rejected') and public.is_agent() or public.is_admin())) then raise exception 'Non autorisé'; end if;
  update places set
    name = coalesce(nullif(p->>'name',''), name), category = coalesce(nullif(p->>'category',''), category),
    area = p->>'area', address = p->>'address', phone = p->>'phone', hours = p->>'hours', description = p->>'description',
    lat = case when p ? 'lat' then (p->>'lat')::float else lat end, lng = case when p ? 'lng' then (p->>'lng')::float else lng end,
    photo_url = coalesce(p->>'photo_url', photo_url),
    photos = case when p ? 'photos' then coalesce(array(select jsonb_array_elements_text(p->'photos')), '{}') else photos end,
    tags = case when p ? 'tags' then coalesce(array(select jsonb_array_elements_text(p->'tags')), '{}') else tags end,
    status = case when public.is_admin() then status else 'pending' end,
    reject_reason = case when public.is_admin() then reject_reason else null end
  where id = p_id;
end $$;

create or replace function public.agent_replace_items(p_id uuid, p_items jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare x jsonb;
begin
  if not exists (select 1 from places where id = p_id and (created_by = auth.uid() and status in ('pending','rejected') and public.is_agent() or public.is_admin())) then raise exception 'Non autorisé'; end if;
  delete from place_items where place_id = p_id;
  for x in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) loop
    insert into place_items(place_id, name, description, price, unit, photo_url)
    values (p_id, left(x->>'name', 120), left(x->>'description', 400), nullif(x->>'price','')::numeric, nullif(x->>'unit',''), nullif(x->>'photo_url',''));
  end loop;
end $$;

create or replace function public.agent_set_owner(p_id uuid, p_email text) returns text
language plpgsql security definer set search_path = public as $$
declare u uuid;
begin
  if not exists (select 1 from places where id = p_id and (created_by = auth.uid() and public.is_agent() or public.is_admin())) then raise exception 'Non autorisé'; end if;
  select id into u from auth.users where lower(email) = lower(trim(p_email));
  if u is null then return 'Aucun compte avec cet email'; end if;
  update places set owner_id = u where id = p_id;
  perform push_notif(u, 'Votre fiche est enregistrée', 'Elle sera visible après validation.', '#/manage');
  return 'OK';
end $$;

-- Création d'un compte sans e-mail de confirmation (admin : tous rôles ; agent : clients seulement)
create or replace function public.staff_create_user(p_email text, p_password text, p_name text, p_role text default 'user') returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare uid uuid; em text := lower(trim(p_email));
begin
  if not (public.is_admin() or (public.is_agent() and p_role = 'user')) then raise exception 'Non autorisé'; end if;
  if p_role not in ('user','agent','admin') then raise exception 'Rôle invalide'; end if;
  if em !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Email invalide'; end if;
  select id into uid from auth.users where lower(email) = em;
  if uid is not null then
    if public.is_admin() and p_role <> 'user' then update profiles set role = p_role where id = uid; end if;
    return jsonb_build_object('id', uid, 'existed', true);
  end if;
  if length(coalesce(p_password, '')) < 6 then raise exception 'Mot de passe : 6 caractères minimum'; end if;
  uid := gen_random_uuid();
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
  values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', em, crypt(p_password, gen_salt('bf')), now(),
          '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name', coalesce(nullif(trim(p_name), ''), split_part(em, '@', 1))), now(), now(), '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), uid, uid::text, jsonb_build_object('sub', uid::text, 'email', em, 'email_verified', true), 'email', now(), now(), now());
  if p_role <> 'user' then update profiles set role = p_role where id = uid; end if;
  return jsonb_build_object('id', uid, 'existed', false);
end $$;
grant execute on function public.agent_update_place(uuid, jsonb), public.agent_replace_items(uuid, jsonb), public.agent_set_owner(uuid, text), public.staff_create_user(text, text, text, text) to authenticated;

-- 4) Stockage : supprimer ses propres photos (et l'admin toutes)
drop policy if exists "photos: suppression" on storage.objects;
create policy "photos: suppression" on storage.objects for delete
  using (bucket_id = 'place-photos' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- 5) Publicités : annonceur, montant, paiement, statistiques
alter table public.ads add column if not exists advertiser text;
alter table public.ads add column if not exists amount int;
alter table public.ads add column if not exists paid boolean not null default false;
create table if not exists public.ad_events (
  id bigint generated always as identity primary key,
  ad_id uuid not null references public.ads(id) on delete cascade,
  kind text not null check (kind in ('view','click')),
  created_at timestamptz not null default now()
);
create index if not exists ad_events_idx on public.ad_events(ad_id, kind);
alter table public.ad_events enable row level security;
drop policy if exists "ad_events: ajout" on public.ad_events;
create policy "ad_events: ajout" on public.ad_events for insert to anon, authenticated with check (true);
drop policy if exists "ad_events: lecture" on public.ad_events;
create policy "ad_events: lecture" on public.ad_events for select using (public.is_admin());
grant insert on public.ad_events to anon, authenticated; grant select on public.ad_events to authenticated;

create or replace function public.admin_ad_stats() returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Accès refusé'; end if;
  return coalesce((select jsonb_object_agg(ad_id, jsonb_build_object('views', v, 'clicks', c)) from
    (select ad_id, count(*) filter (where kind = 'view') v, count(*) filter (where kind = 'click') c from ad_events group by ad_id) s), '{}'::jsonb);
end $$;
grant execute on function public.admin_ad_stats() to authenticated;

-- 6) Anti-gonflage des statistiques : au plus 40 évènements / minute / fiche (ou pub) / type
create or replace function public.trg_event_limit() returns trigger
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if tg_table_name = 'place_events' then
    select count(*) into n from place_events where place_id = new.place_id and kind = new.kind and created_at > now() - interval '1 minute';
  else
    select count(*) into n from ad_events where ad_id = new.ad_id and kind = new.kind and created_at > now() - interval '1 minute';
  end if;
  if n >= 40 then return null; end if;
  return new;
end $$;
drop trigger if exists place_events_limit on public.place_events;
create trigger place_events_limit before insert on public.place_events for each row execute function public.trg_event_limit();
drop trigger if exists ad_events_limit on public.ad_events;
create trigger ad_events_limit before insert on public.ad_events for each row execute function public.trg_event_limit();

-- 7) Vue d'ensemble : revenus des pubs
create or replace function public.admin_overview() returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Accès refusé'; end if;
  return jsonb_build_object(
    'published', (select count(*) from places where status = 'published'),
    'pending', (select count(*) from places where status = 'pending'),
    'rejected', (select count(*) from places where status = 'rejected'),
    'agents', (select count(*) from profiles where role = 'agent'),
    'owners', (select count(distinct owner_id) from places where owner_id is not null),
    'claims', (select count(*) from claims where status = 'pending'),
    'sponsored', (select count(*) from places where sponsored and (sponsored_until is null or sponsored_until >= current_date)),
    'users', (select count(*) from profiles),
    'ads', (select count(*) from ads where active and (ends_on is null or ends_on >= current_date)),
    'revenue', (select coalesce(sum(amount), 0) from ads where paid));
end $$;
