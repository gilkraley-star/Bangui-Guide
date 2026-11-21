-- v9 : facturation (inscription, abonnements, sponsoring), encaissement par l'agent ou l'administrateur, factures visibles dans le compte client

create table if not exists public.tarifs (
  code text primary key, label text not null, amount int not null check (amount >= 0)
);
insert into public.tarifs(code, label, amount) values
  ('inscription', 'Inscription', 25000), ('mensuel', 'Abonnement mensuel', 10000),
  ('annuel', 'Abonnement annuel', 70000), ('sponsoring', 'Sponsoring (par semaine)', 10000)
on conflict (code) do nothing;
alter table public.tarifs enable row level security;
drop policy if exists "tarifs: lecture" on public.tarifs;
create policy "tarifs: lecture" on public.tarifs for select using (true);
drop policy if exists "tarifs: admin" on public.tarifs;
create policy "tarifs: admin" on public.tarifs for all using (public.is_admin()) with check (public.is_admin());
grant select on public.tarifs to anon, authenticated; grant insert, update on public.tarifs to authenticated;

alter table public.places add column if not exists plan text check (plan in ('mensuel','annuel'));
alter table public.places add column if not exists plan_until date;

create sequence if not exists public.invoice_seq;
create sequence if not exists public.receipt_seq;

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  number text unique not null,
  place_id uuid not null references public.places(id) on delete cascade,
  kind text not null check (kind in ('inscription','mensuel','annuel','sponsoring')),
  label text not null,
  qty int not null default 1 check (qty between 1 and 104),
  unit_amount int not null, amount int not null,
  status text not null default 'due' check (status in ('due','paid','cancelled')),
  issued_on date not null default current_date,
  paid_at timestamptz, method text check (method in ('especes','mobile_money','virement','autre')),
  reference text, receipt text, collected_by uuid references auth.users(id), collector_name text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists invoices_place_idx on public.invoices(place_id, created_at desc);
create index if not exists invoices_status_idx on public.invoices(status);
alter table public.invoices enable row level security;
drop policy if exists "factures: lecture" on public.invoices;
create policy "factures: lecture" on public.invoices for select
  using (public.owns_place(place_id) or exists (select 1 from public.places p where p.id = place_id and p.created_by = auth.uid()));
grant select on public.invoices to authenticated;

-- création d'une facture (tarif lu dans la table tarifs)
create or replace function public.create_invoice(p_place uuid, p_kind text, p_qty int default 1) returns uuid
language plpgsql security definer set search_path = public as $$
declare pl places; t tarifs; q int := greatest(1, least(coalesce(p_qty, 1), 104)); new_id uuid; lbl text;
begin
  select * into pl from places where places.id = p_place;
  if pl.id is null then raise exception 'Lieu introuvable'; end if;
  if not (public.is_admin() or (public.is_agent() and pl.created_by = auth.uid() and p_kind in ('inscription','mensuel','annuel'))) then raise exception 'Non autorisé'; end if;
  if p_kind not in ('inscription','mensuel','annuel','sponsoring') then raise exception 'Type de facture invalide'; end if;
  select * into t from tarifs where code = p_kind;
  if p_kind <> 'sponsoring' then q := 1; end if;
  if p_kind = 'inscription' and exists (select 1 from invoices where place_id = p_place and kind = 'inscription' and status <> 'cancelled') then raise exception 'Une facture d’inscription existe déjà'; end if;
  lbl := case p_kind when 'inscription' then 'Inscription Bangui Guide' when 'mensuel' then 'Abonnement mensuel' when 'annuel' then 'Abonnement annuel'
         else 'Sponsoring ' || q || ' semaine' || case when q > 1 then 's' else '' end end;
  insert into invoices(number, place_id, kind, label, qty, unit_amount, amount, created_by)
  values ('FAC-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('invoice_seq')::text, 5, '0'), p_place, p_kind, lbl, q, t.amount, t.amount * q, auth.uid()) returning invoices.id into new_id;
  perform push_notif(pl.owner_id, 'Nouvelle facture', lbl || ' : ' || (t.amount * q) || ' FCFA à payer', '#/manage/' || p_place || '?t=fac');
  return new_id;
end $$;

-- encaissement : l'agent (fiches qu'il a enregistrées) ou l'administrateur ; applique l'abonnement ou le sponsoring payé
create or replace function public.record_payment(p_invoice uuid, p_method text, p_ref text default null) returns text
language plpgsql security definer set search_path = public as $$
declare iv invoices; pl places; rc text; who text;
begin
  select * into iv from invoices where invoices.id = p_invoice;
  if iv.id is null then raise exception 'Facture introuvable'; end if;
  select * into pl from places where places.id = iv.place_id;
  if not (public.is_admin() or (public.is_agent() and pl.created_by = auth.uid())) then raise exception 'Non autorisé'; end if;
  if iv.status <> 'due' then raise exception 'Cette facture n’est plus à payer'; end if;
  if p_method not in ('especes','mobile_money','virement','autre') then raise exception 'Mode de paiement invalide'; end if;
  rc := 'REC-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('receipt_seq')::text, 5, '0');
  select full_name into who from profiles where profiles.id = auth.uid();
  update invoices set status = 'paid', paid_at = now(), method = p_method, reference = nullif(trim(p_ref), ''), receipt = rc, collected_by = auth.uid(), collector_name = who where invoices.id = iv.id;
  if iv.kind = 'mensuel' then update places set plan = 'mensuel', plan_until = (greatest(coalesce(plan_until, current_date), current_date) + interval '1 month')::date where places.id = pl.id;
  elsif iv.kind = 'annuel' then update places set plan = 'annuel', plan_until = (greatest(coalesce(plan_until, current_date), current_date) + interval '1 year')::date where places.id = pl.id;
  elsif iv.kind = 'sponsoring' then update places set sponsored = true, sponsored_until = greatest(coalesce(sponsored_until, now()), now()) + (iv.qty * 7) * interval '1 day' where places.id = pl.id;
  end if;
  perform push_notif(pl.owner_id, 'Paiement reçu', iv.label || ' : ' || iv.amount || ' FCFA (reçu ' || rc || ')', '#/manage/' || pl.id || '?t=fac');
  if not public.is_admin() then
    insert into notifications(user_id, title, body, link) select profiles.id, 'Encaissement par un agent', coalesce(who, 'Agent') || ' : ' || iv.amount || ' FCFA, ' || pl.name, '#/admin' from profiles where role = 'admin';
  end if;
  return rc;
end $$;

create or replace function public.cancel_invoice(p_invoice uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Non autorisé'; end if;
  update invoices set status = 'cancelled' where invoices.id = p_invoice and status = 'due';
end $$;

-- résumé pour l'administrateur
create or replace function public.admin_billing_summary() returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Accès refusé'; end if;
  return jsonb_build_object(
    'due', (select coalesce(sum(amount), 0) from invoices where status = 'due'),
    'due_n', (select count(*) from invoices where status = 'due'),
    'paid', (select coalesce(sum(amount), 0) from invoices where status = 'paid'),
    'paid_month', (select coalesce(sum(amount), 0) from invoices where status = 'paid' and paid_at >= date_trunc('month', now())),
    'expiring', (select count(*) from places where plan_until is not null and plan_until < current_date + 7),
    'by_collector', coalesce((select jsonb_agg(jsonb_build_object('name', coalesce(collector_name, '—'), 'total', t, 'n', n) order by t desc)
      from (select collector_name, sum(amount) t, count(*) n from invoices where status = 'paid' group by collector_name) s), '[]'::jsonb));
end $$;
grant execute on function public.create_invoice(uuid, text, int), public.record_payment(uuid, text, text), public.cancel_invoice(uuid), public.admin_billing_summary() to authenticated;

-- à la publication d'une fiche : facture d'inscription automatique
create or replace function public.trg_place_invoice() returns trigger
language plpgsql security definer set search_path = public as $$
declare t tarifs;
begin
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published')
     and not exists (select 1 from invoices where place_id = new.id and kind = 'inscription' and status <> 'cancelled') then
    select * into t from tarifs where code = 'inscription';
    insert into invoices(number, place_id, kind, label, unit_amount, amount, created_by)
    values ('FAC-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('invoice_seq')::text, 5, '0'), new.id, 'inscription', 'Inscription Bangui Guide', t.amount, t.amount, auth.uid());
    perform push_notif(new.owner_id, 'Nouvelle facture', 'Inscription Bangui Guide : ' || t.amount || ' FCFA à payer', '#/manage/' || new.id || '?t=fac');
  end if;
  return new;
end $$;
drop trigger if exists places_invoice on public.places;
create trigger places_invoice after insert or update of status on public.places for each row execute function public.trg_place_invoice();

-- vue d'ensemble : montants facturés
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
    'revenue', (select coalesce(sum(amount), 0) from ads where paid),
    'inv_paid', (select coalesce(sum(amount), 0) from invoices where status = 'paid'),
    'inv_due', (select coalesce(sum(amount), 0) from invoices where status = 'due'));
end $$;
