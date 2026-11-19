-- Donne une position approximative (autour de Bangui) aux lieux sans coordonnées,
-- pour que les distances (km) et la carte fonctionnent. À remplacer par les vraies positions via l'agent terrain.
update places set
  lat = 4.3612 + ((abs(hashtext(id::text)) % 400) - 200) / 10000.0 * case when area ilike '%km5%' then 1.5 else 1 end,
  lng = 18.5550 + ((abs(hashtext(id::text || 'x')) % 400) - 200) / 10000.0 * case when area ilike '%koudoukou%' then 1.8 else 1 end
where lat is null or lng is null;
