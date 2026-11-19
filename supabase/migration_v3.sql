-- Bangui Guide : migration v3 (à exécuter une fois dans Supabase > SQL Editor, après migration_v2.sql)

-- 1) Garde / disponibilité
alter table public.places add column if not exists on_duty boolean not null default false;
alter table public.place_items add column if not exists available boolean not null default true;

-- 2) Réponse de l'entreprise aux avis
alter table public.reviews add column if not exists owner_reply text check (length(owner_reply) <= 600);
alter table public.reviews add column if not exists owner_reply_at timestamptz;
create or replace function public.reply_review(p_id uuid, p_reply text) returns void
language plpgsql security definer set search_path = public as $$
declare pid uuid;
begin
  select place_id into pid from public.reviews where id = p_id;
  if pid is null or not public.owns_place(pid) then raise exception 'Non autorisé'; end if;
  update public.reviews set owner_reply = nullif(trim(p_reply), ''), owner_reply_at = now() where id = p_id;
end $$;

-- 3) Statut des demandes (messages)
alter table public.conversations add column if not exists status text not null default 'nouvelle'
  check (status in ('nouvelle','confirmee','refusee','traitee'));
create or replace function public.set_conv_status(c uuid, s text) returns void
language plpgsql security definer set search_path = public as $$
declare pid uuid;
begin
  select place_id into pid from public.conversations where id = c;
  if pid is null or not public.owns_place(pid) then raise exception 'Non autorisé'; end if;
  update public.conversations set status = s where id = c;
end $$;

-- 4) Statistiques par fiche
create table if not exists public.place_events (
  id bigint generated always as identity primary key,
  place_id uuid not null references public.places(id) on delete cascade,
  kind text not null check (kind in ('view','call','message','route','whatsapp')),
  created_at timestamptz not null default now()
);
create index if not exists place_events_idx on public.place_events(place_id, created_at desc);
alter table public.place_events enable row level security;
drop policy if exists "events: ajout" on public.place_events;
create policy "events: ajout" on public.place_events for insert to anon, authenticated with check (true);
drop policy if exists "events: lecture" on public.place_events;
create policy "events: lecture" on public.place_events for select using (public.owns_place(place_id));

create or replace function public.owner_stats(p_id uuid)
returns table(kind text, n7 int, n30 int)
language plpgsql security definer set search_path = public as $$
begin
  if not public.owns_place(p_id) then raise exception 'Non autorisé'; end if;
  return query select e.kind,
    count(*) filter (where e.created_at > now() - interval '7 days')::int,
    count(*) filter (where e.created_at > now() - interval '30 days')::int
  from public.place_events e where e.place_id = p_id group by e.kind;
end $$;

-- 5) Inscription d'une entreprise (demande validée par l'administrateur)
create table if not exists public.claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  place_id uuid references public.places(id) on delete set null,
  business_name text not null check (length(business_name) between 2 and 120),
  category text, area text, phone text, message text check (length(message) <= 600),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);
alter table public.claims enable row level security;
drop policy if exists "claims: ajout" on public.claims;
create policy "claims: ajout" on public.claims for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "claims: lecture" on public.claims;
create policy "claims: lecture" on public.claims for select using (user_id = auth.uid() or public.is_admin());

create or replace function public.decide_claim(c uuid, ok boolean) returns text
language plpgsql security definer set search_path = public as $$
declare r public.claims; pid uuid;
begin
  if not public.is_admin() then raise exception 'Non autorisé'; end if;
  select * into r from public.claims where id = c;
  if r.id is null then raise exception 'Demande introuvable'; end if;
  if not ok then update public.claims set status = 'rejected' where id = c; return 'Refusée'; end if;
  pid := r.place_id;
  if pid is null then
    insert into public.places(name, category, area, phone, status, owner_id, created_by)
    values (r.business_name, coalesce(r.category, 'commerce'), r.area, r.phone, 'published', r.user_id, r.user_id) returning id into pid;
  else
    update public.places set owner_id = r.user_id where id = pid;
  end if;
  update public.claims set status = 'approved', place_id = pid where id = c;
  return 'Approuvée';
end $$;

-- 6) Interrupteurs entreprise : garde et disponibilité
create or replace function public.owner_set_duty(p_id uuid, p_on boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.owns_place(p_id) then raise exception 'Non autorisé'; end if;
  update public.places set on_duty = p_on where id = p_id;
end $$;
