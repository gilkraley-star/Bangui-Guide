-- v6 : publicités (sponsoring géré par l'administrateur)
create table if not exists public.ads (
  id uuid primary key default gen_random_uuid(),
  model text not null default 'image' check (model in ('image','text')),
  title text, body text, cta text default 'Découvrir', image_url text,
  place_id uuid references public.places(id) on delete set null,
  link_url text,
  starts_on date, ends_on date,
  active boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.ads enable row level security;
drop policy if exists "ads: lecture" on public.ads;
drop policy if exists "ads: admin" on public.ads;
create policy "ads: lecture" on public.ads for select using ((active and (starts_on is null or starts_on <= current_date) and (ends_on is null or ends_on >= current_date)) or public.is_admin());
create policy "ads: admin" on public.ads for all using (public.is_admin()) with check (public.is_admin());
grant select on public.ads to anon, authenticated;
grant insert, update, delete on public.ads to authenticated;
