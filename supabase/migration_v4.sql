-- v4 : galerie de photos multiples pour les fiches
alter table public.places add column if not exists photos text[] not null default '{}';

create or replace function public.owner_set_photos(p_id uuid, p_photos text[])
returns void language plpgsql security definer set search_path = public as $$
begin
  if not (public.owns_place(p_id) or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')) then
    raise exception 'Accès refusé';
  end if;
  update public.places set photos = coalesce(p_photos, '{}') where id = p_id;
end $$;
grant execute on function public.owner_set_photos(uuid, text[]) to authenticated;
