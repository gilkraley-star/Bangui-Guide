-- Aligne les données de démo sur les maquettes (catalogues, tags, horaires, galeries). Prérequis : migration_v4 + seed_demo_full.
create temp table _al(cat text, only_name text, n text, pr numeric, u text, d text, img text);
insert into _al values
('hotel',null,'Chambre Standard',35000,'nuit',null,'img/room-std.jpg'),('hotel',null,'Chambre Deluxe',55000,'nuit',null,'img/room-dlx.jpg'),('hotel',null,'Suite',80000,'nuit',null,'img/suite.jpg'),
('restaurant',null,'Poulet braisé',5050,null,'Servi avec plantain','img/plat-poulet.jpg'),('restaurant',null,'Poisson grillé',6000,null,'Attiéké et salade','img/plat-poisson.jpg'),('restaurant',null,'Bœuf sauce',7000,null,'Bœuf mijoté, riz','img/plat-boeuf.jpg'),
('pharmacie',null,'Médicaments',null,null,null,null),('pharmacie',null,'Produits de santé',null,null,null,null),('pharmacie',null,'Parapharmacie',null,null,null,null),('pharmacie',null,'Mère & Enfant',null,null,null,null),
('commerce','Bangui Shopping','Smartphones',null,null,null,'img/p-phone.jpg'),('commerce','Bangui Shopping','Ordinateurs',null,null,null,'img/p-pc.jpg'),('commerce','Bangui Shopping','Accessoires',null,null,null,'img/p-audio.jpg'),('commerce','Bangui Shopping','Téléviseurs',null,null,null,'img/p-tv.jpg'),('commerce','Bangui Shopping','Photo & Vidéo',null,null,null,'img/p-photo.jpg'),('commerce','Bangui Shopping','Jeux & Consoles',null,null,null,'img/p-game.jpg'),
('hopital',null,'Urgences 24h/24',null,null,null,null),('hopital',null,'Consultations',null,null,'générales et spécialisées',null),('hopital',null,'Maternité',null,null,'Suivi de grossesse, accouchement',null),('hopital',null,'Laboratoire',null,null,'d''analyses médicales',null),
('universite',null,'Licence Informatique',272500,'an','Bac +3','img/f-info.jpg'),('universite',null,'Réseaux & Télécoms',272500,'an','Bac +3','img/f-reseau.jpg'),
('banque',null,'Ouverture de compte',null,null,null,null),('banque',null,'Cartes bancaires',null,null,null,null),('banque',null,'Transferts d''argent',null,null,null,null),('banque',null,'Crédits & financements',null,null,null,null),
('admin',null,'Actes de naissance',null,null,null,null),('admin',null,'Actes de mariage',null,null,null,null),('admin',null,'Légalisations',null,null,null,null),('admin',null,'Renseignements administratifs',null,null,null,null),
('transport','Location Auto Oubangui','Toyota Corolla',1600,'course en ville','Berline (4 places)','img/v-corolla.jpg'),('transport','Location Auto Oubangui','Toyota Hilux',55000,'journée','4x4 (5 places)','img/v-hilux.jpg'),('transport','Location Auto Oubangui','Toyota Hiace',27750,'journée','Minibus (15 places)','img/v-hiace.jpg'),
('btp',null,'Conception de plans',null,null,'Plans architecturaux, techniques et 3D','img/s-plans.jpg'),('btp',null,'Études & devis',null,null,'Estimation des coûts et accompagnement','img/s-etudes.jpg'),('btp',null,'Suivi de chantier',null,null,'Contrôle et coordination des travaux','img/s-chantier.jpg'),('btp',null,'Rénovation & aménagement',null,null,'Réhabilitation, extension et finitions','img/s-reno.jpg'),
('station',null,'Essence',1100,'litre',null,null),('station',null,'Gasoil',950,'litre',null,null),('station',null,'Gaz domestique 12 kg',8100,null,null,null),('station',null,'Boutique',null,null,null,null),('station',null,'Lavage auto',null,null,null,null),('station',null,'Pneumatique',null,null,null,null),('station',null,'Vidange',null,null,null,null),('station',null,'Distributeur de billets',null,null,null,null),
('voyage',null,'Billets d''avion',null,null,'National & International',null),('voyage',null,'Assistance visa',null,null,null,null),('voyage',null,'Séjours & circuits touristiques',null,null,null,null),('voyage',null,'Réservations hôtels',null,null,null,null),
('voyage',null,'Bangui – Douala',227500,null,'Vol direct','img/r-douala.jpg'),('voyage',null,'Bangui – Yaoundé',254000,null,'Vol direct','img/r-yaounde.jpg'),('voyage',null,'Bangui – Paris',650000,null,'à partir de','img/r-paris.jpg');

delete from public.place_items where place_id in (select p.id from public.places p join (select distinct cat, only_name from _al) a on a.cat = p.category and (a.only_name is null or a.only_name = p.name) where p.description like '%(démo)');
insert into public.place_items (place_id, name, price, unit, description, photo_url, available)
select p.id, a.n, a.pr, a.u, a.d, a.img, true from public.places p join _al a on a.cat = p.category and (a.only_name is null or a.only_name = p.name) where p.description like '%(démo)';

update public.places set tags = array['Wi-Fi gratuit','Climatisation','Restaurant','Parking sécurisé','Sécurité 24h/24'] where category = 'hotel' and description like '%(démo)';
update public.places set tags = array['Livraison à Bangui','Produits garantis','Paiement sécurisé'] where name = 'Bangui Shopping';
update public.places set tags = array['Avec chauffeur','Véhicules assurés','Bien entretenus','Réservation rapide'], description = 'Location de véhicules avec ou sans chauffeur à Bangui. (démo)' where name = 'Location Auto Oubangui';
update public.places set tags = array['Inscriptions ouvertes','Année académique 2026–2027'] where category = 'universite' and description like '%(démo)';
update public.places set tags = array['Garde 24/24'], hours = 'Lun–Sam 7h–21h ; Dim 8h–20h', on_duty = true where name = 'Pharmacie Centrale';
update public.places set hours = '24h/24', tags = array['Urgences 24h/24'] where category = 'hopital' and name in ('Clinique Espoir','Polyclinique Saint-Joseph') and description like '%(démo)';
update public.places set hours = 'Lun–Ven 7h30–15h30' where category = 'admin' and description like '%(démo)';
update public.places set hours = 'Lun–Sam 8h–19h' where name = 'Bangui Shopping';
update public.places set hours = 'Lun–Ven 8h–15h30' where name = 'Banque BICICA';
update public.places set hours = '24h/24' where category = 'station' and description like '%(démo)';

-- galeries du carrousel
update public.places set photos = case category
  when 'hotel' then array['img/h-hotel.jpg','img/room-std.jpg','img/room-dlx.jpg','img/suite.jpg']
  when 'restaurant' then array['img/ex-relais.jpg','img/ex-terrasse.jpg','img/ex-maman.jpg','img/ex-maquis.jpg']
  when 'pharmacie' then array['img/h-pharma.jpg','img/pharmacie.jpg']
  when 'commerce' then array['img/h-shop.jpg','img/p-phone.jpg','img/p-pc.jpg']
  when 'hopital' then array['img/h-hopital.jpg']
  when 'universite' then array['img/h-univ.jpg','img/f-info.jpg','img/f-reseau.jpg']
  when 'banque' then array['img/h-banque.jpg']
  when 'admin' then array['img/h-mairie.jpg']
  when 'transport' then array['img/h-auto.jpg','img/v-corolla.jpg','img/v-hilux.jpg','img/v-hiace.jpg']
  when 'btp' then array['img/h-btp.jpg','img/s-plans.jpg','img/s-chantier.jpg','img/s-reno.jpg']
  when 'station' then array['img/h-station.jpg']
  when 'voyage' then array['img/h-voyage.jpg','img/r-douala.jpg','img/r-paris.jpg']
  else '{}'::text[] end
where description like '%(démo)';
