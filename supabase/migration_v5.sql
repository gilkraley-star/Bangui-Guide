-- v5 : espace administrateur (agents, validation, vue d'ensemble)
create or replace function public.admin_set_role(p_email text, p_role text) returns text
language plpgsql security definer set search_path = public as $$
declare uid uuid;
begin
  if not public.is_admin() then raise exception 'Accès refusé'; end if;
  if p_role not in ('user','agent','admin') then raise exception 'Rôle invalide'; end if;
  select id into uid from auth.users where lower(email) = lower(trim(p_email));
  if uid is null then return 'Utilisateur introuvable'; end if;
  if uid = auth.uid() and p_role <> 'admin' then return 'Vous ne pouvez pas retirer votre propre rôle administrateur'; end if;
  update public.profiles set role = p_role where id = uid;
  return 'OK';
end $$;

create or replace function public.admin_agents() returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Accès refusé'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', p.id, 'name', p.full_name, 'email', u.email, 'since', u.created_at,
      'total', (select count(*) from places x where x.created_by = p.id),
      'pending', (select count(*) from places x where x.created_by = p.id and x.status = 'pending'),
      'published', (select count(*) from places x where x.created_by = p.id and x.status = 'published')) order by u.created_at desc)
    from profiles p join auth.users u on u.id = p.id where p.role = 'agent'), '[]'::jsonb);
end $$;

create or replace function public.admin_pending() returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Accès refusé'; end if;
  return coalesce((select jsonb_agg(to_jsonb(pl) || jsonb_build_object('agent_name', pr.full_name, 'n_items', (select count(*) from place_items i where i.place_id = pl.id)) order by pl.created_at)
    from places pl left join profiles pr on pr.id = pl.created_by where pl.status = 'pending'), '[]'::jsonb);
end $$;

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
    'users', (select count(*) from profiles));
end $$;
grant execute on function public.admin_set_role(text, text), public.admin_agents(), public.admin_pending(), public.admin_overview() to authenticated;
