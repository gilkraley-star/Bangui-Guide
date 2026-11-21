-- v8 : mots de passe (changement obligatoire pour les comptes créés par le personnel, réinitialisation), pas d'avis sur son propre lieu
alter table public.profiles add column if not exists must_change_pw boolean not null default false;

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
  update profiles set must_change_pw = true where id = uid;
  if p_role <> 'user' then update profiles set role = p_role where id = uid; end if;
  return jsonb_build_object('id', uid, 'existed', false);
end $$;

create or replace function public.pw_changed() returns void
language sql security definer set search_path = public as
$$ update public.profiles set must_change_pw = false where id = auth.uid() $$;

-- Admin : nouveau mot de passe provisoire pour n'importe quel compte
create or replace function public.staff_reset_password(p_email text, p_password text) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare uid uuid;
begin
  if not public.is_admin() then raise exception 'Non autorisé'; end if;
  if length(coalesce(p_password, '')) < 6 then raise exception 'Mot de passe : 6 caractères minimum'; end if;
  select id into uid from auth.users where lower(email) = lower(trim(p_email));
  if uid is null then return 'Aucun compte avec cet email'; end if;
  update auth.users set encrypted_password = crypt(p_password, gen_salt('bf')), updated_at = now() where id = uid;
  update profiles set must_change_pw = true where id = uid;
  return 'OK';
end $$;

-- Agent : nouveau mot de passe provisoire pour le client d'une fiche qu'il a enregistrée ; renvoie l'email du client
create or replace function public.agent_reset_owner_password(p_place uuid, p_password text) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare o uuid; em text;
begin
  if length(coalesce(p_password, '')) < 6 then raise exception 'Mot de passe : 6 caractères minimum'; end if;
  select owner_id into o from places where id = p_place and ((created_by = auth.uid() and public.is_agent()) or public.is_admin());
  if o is null then raise exception 'Non autorisé ou aucun client rattaché'; end if;
  if exists (select 1 from profiles where id = o and role in ('agent','admin')) and not public.is_admin() then raise exception 'Non autorisé'; end if;
  update auth.users set encrypted_password = crypt(p_password, gen_salt('bf')), updated_at = now() where id = o returning email into em;
  update profiles set must_change_pw = true where id = o;
  return em;
end $$;
grant execute on function public.pw_changed(), public.staff_reset_password(text, text), public.agent_reset_owner_password(uuid, text) to authenticated;

-- Pas d'avis sur son propre lieu (propriétaire ou agent qui l'a enregistré)
create or replace function public.set_review_author() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.places where id = new.place_id and (owner_id = new.user_id or created_by = new.user_id)) then raise exception 'Vous ne pouvez pas noter votre propre établissement'; end if;
  new.author := (select full_name from public.profiles where id = new.user_id); return new;
end $$;
