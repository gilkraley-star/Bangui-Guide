-- BANGUI GUIDE : jeu de démonstration COMPLET pour les tests (tous les secteurs).
-- Établissements, clients et numéros FICTIFS, tous marqués "(démo)". À exécuter dans Supabase > SQL Editor.
-- Prérequis : migration_v2.sql et migration_v3.sql déjà exécutées.
-- Pour tout supprimer avant le lancement :
--   delete from public.places where description like '%(démo)';
--   delete from auth.users where email like '%@bangui-demo.test';

-- 0) Nettoyage d'une ancienne version
delete from public.places where description like '%(démo)';
delete from auth.users where email like '%@bangui-demo.test';

-- 1) Établissements : au moins 3 par secteur
insert into public.places (name, category, area, address, description, phone, hours, status, verified, sponsored, sponsored_until, on_duty, tags) values
-- Restaurants
('Le Relais de Bangui','restaurant','Centre-ville','Rue du Commerce','Cuisine africaine et internationale, grillades, cadre convivial. (démo)','+236 75 00 00 01','Lun–Dim 7h–23h','published',true,true,'2027-12-31',false,array['Wi-Fi','Parking','Livraison','Paiement mobile']),
('Chez Maman','restaurant','Km5','Avenue de l''Indépendance','Plats du jour et spécialités centrafricaines. (démo)','+236 75 00 00 02','Lun–Sam 8h–21h','published',false,false,null,false,array['Livraison']),
('La Terrasse','restaurant','Bimbo','Route de Bimbo','Restaurant avec terrasse, poissons grillés. (démo)','+236 75 00 00 03','Lun–Dim 10h–23h','published',false,false,null,false,array['Parking']),
('Maquis Le Bon Goût','restaurant','Centre-ville','Centre-ville','Maquis ambiance familiale, brochettes et boissons. (démo)','+236 75 00 00 04','Lun–Dim 16h–2h','published',false,false,null,false,array[]::text[]),
-- Hôtels
('Hôtel Résidence le Central','hotel','Centre-ville','Centre-ville','Hôtel au cœur de Bangui : chambres confortables, restaurant, salle de réunion. (démo)','+236 75 00 00 05','24h/24','published',true,true,'2027-12-31',false,array['Wi-Fi','Restaurant','Climatisation','Parking']),
('Hôtel Oubangui','hotel','Km5','Route de l''aéroport','Hôtel proche de l''aéroport, navette disponible. (démo)','+236 75 00 00 06','24h/24','published',false,false,null,false,array['Wi-Fi','Parking']),
('Auberge de la Paix','hotel','Lakouanga','Lakouanga','Auberge simple et accueillante. (démo)','+236 75 00 00 07','24h/24','published',false,false,null,false,array[]::text[]),
-- Pharmacies
('Pharmacie Centrale','pharmacie','Bimbo','Avenue Barthélemy Boganda','Pharmacie de garde, ouverte jour et nuit. (démo)','+236 75 00 00 08','24h/24','published',true,false,null,true,array['Garde']),
('Pharmacie de la Paix','pharmacie','Lakouanga','Lakouanga','Médicaments et conseils. (démo)','+236 75 00 00 09','Lun–Sam 8h–21h ; Dim 9h–13h','published',false,false,null,false,array[]::text[]),
('Pharmacie du Marché','pharmacie','Km5','Marché central','Pharmacie près du marché. (démo)','+236 75 00 00 10','Lun–Sam 7h30–20h','published',false,false,null,false,array[]::text[]),
('Pharmacie Nouvelle Espérance','pharmacie','Fatima','Fatima','Médicaments, matériel médical, tensiomètres. (démo)','+236 75 00 00 11','Lun–Sam 8h–20h','published',false,false,null,false,array[]::text[]),
-- Banques
('Banque BICICA','banque','Centre-ville','Avenue de France','Agence bancaire, guichet automatique. (démo)','+236 75 00 00 12','Lun–Ven 7h30–15h30 ; Sam 8h–12h','published',true,false,null,false,array['Distributeur']),
('Banque de l''Oubangui','banque','Km5','Km5','Services bancaires et transferts d''argent. (démo)','+236 75 00 00 13','Lun–Ven 7h30–15h30','published',false,false,null,false,array['Distributeur']),
('Microfinance Solidarité','banque','Bégoua','Bégoua','Épargne et micro-crédits pour particuliers et commerçants. (démo)','+236 75 00 00 14','Lun–Sam 8h–16h','published',false,false,null,false,array[]::text[]),
-- Santé
('Clinique Espoir','hopital','Bimbo','Bimbo','Consultations, urgences, maternité. (démo)','+236 75 00 00 15','24h/24','published',false,false,null,true,array['Urgences 24h/24']),
('Centre de Santé de Fouh','hopital','Fouh','Fouh','Soins de base et vaccination. (démo)','+236 75 00 00 16','Lun–Sam 7h30–17h','published',false,false,null,false,array[]::text[]),
('Polyclinique Saint-Joseph','hopital','Centre-ville','Centre-ville','Médecine générale, spécialistes, laboratoire. (démo)','+236 75 00 00 17','Lun–Sam 7h–19h','published',true,false,null,false,array['Laboratoire']),
('Cabinet Dentaire Sourire','hopital','Castors','Castors','Soins dentaires, détartrage, prothèses. (démo)','+236 75 00 00 18','Lun–Ven 8h–17h','published',false,false,null,false,array[]::text[]),
-- Écoles
('École Les Étoiles','ecole','Bimbo','Bimbo','École primaire et collège. (démo)','+236 75 00 00 19','Lun–Ven 7h30–16h','published',false,false,null,false,array[]::text[]),
('Collège Saint-Michel','ecole','Centre-ville','Centre-ville','Collège et lycée, internat disponible. (démo)','+236 75 00 00 20','Lun–Ven 7h30–17h','published',false,false,null,false,array[]::text[]),
('Institut Technique de Bangui','ecole','Km5','Km5','Formations techniques et professionnelles. (démo)','+236 75 00 00 21','Lun–Ven 8h–17h','published',false,false,null,false,array[]::text[]),
-- Universités
('Université Panafricaine de Bangui','universite','Fatima','Fatima','Licences et masters, bibliothèque. (démo)','+236 75 00 00 22','Lun–Ven 8h–18h','published',false,false,null,false,array['Wi-Fi']),
('Institut Supérieur de Gestion','universite','Centre-ville','Centre-ville','Comptabilité, gestion, commerce international. (démo)','+236 75 00 00 23','Lun–Ven 8h–17h','published',false,false,null,false,array[]::text[]),
('École Supérieure d''Informatique','universite','Bangui M''Poko','Bangui M''Poko','Informatique, réseaux, génie logiciel. (démo)','+236 75 00 00 24','Lun–Ven 8h–18h','published',false,false,null,false,array['Wi-Fi']),
-- Transport
('Coopérative Taxis Bangui','transport','Centre-ville','Toute la ville','Taxis et courses à la journée. (démo)','+236 75 00 00 25','24h/24','published',false,false,null,false,array[]::text[]),
('Bangui Moto Express','transport','Km5','Km5','Moto-taxis rapides, livraison de colis. (démo)','+236 75 00 00 26','Lun–Dim 6h–21h','published',false,false,null,false,array['Livraison']),
('Location Auto Oubangui','transport','Centre-ville','Avenue de l''Indépendance','Location de voitures avec ou sans chauffeur. (démo)','+236 75 00 00 27','Lun–Sam 8h–18h','published',false,false,null,false,array[]::text[]),
-- Administration
('Mairie du 3e Arrondissement','admin','Lakouanga','Lakouanga','Actes d''état civil, légalisations. (démo)','+236 75 00 00 28','Lun–Ven 7h30–15h30','published',false,false,null,false,array[]::text[]),
('Centre des Impôts de Bangui','admin','Centre-ville','Centre-ville','Déclarations et paiement des impôts. (démo)','+236 75 00 00 29','Lun–Ven 7h30–15h30','published',false,false,null,false,array[]::text[]),
('Guichet Unique des Entreprises','admin','Centre-ville','Centre-ville','Création et immatriculation d''entreprises. (démo)','+236 75 00 00 30','Lun–Ven 8h–15h','published',false,false,null,false,array[]::text[]),
-- Lieux de culte
('Église Évangélique du Centre','culte','Centre-ville','Centre-ville','Cultes, école du dimanche, chorale. (démo)','+236 75 00 00 31','Dim 8h–12h ; Mer 18h–20h','published',false,false,null,false,array[]::text[]),
('Mosquée du Km5 (démo)','culte','Km5','Km5','Prières quotidiennes et du vendredi. (démo)','+236 75 00 00 32','Lun–Dim 5h–21h','published',false,false,null,false,array[]::text[]),
('Paroisse Saint-Pierre','culte','Bimbo','Bimbo','Messes dominicales et en semaine. (démo)','+236 75 00 00 33','Dim 7h–11h ; Lun–Ven 6h–7h','published',false,false,null,false,array[]::text[]),
-- Commerces
('Bangui Shopping','commerce','Centre-ville','Centre-ville','Électronique, informatique, téléphones, accessoires. (démo)','+236 75 00 00 34','Lun–Sam 8h–19h','published',false,true,'2027-12-31',false,array['Paiement mobile']),
('Boulangerie Espérance','commerce','Km5','Km5','Pain frais et viennoiseries chaque matin. (démo)','+236 75 00 00 35','Lun–Dim 5h30–20h','published',false,false,null,false,array[]::text[]),
('Supermarché Le Marché Frais','commerce','Centre-ville','Centre-ville','Alimentation, produits ménagers. (démo)','+236 75 00 00 36','Lun–Sam 8h–20h','published',false,false,null,false,array['Parking']),
('Quincaillerie Générale','commerce','Gobongo','Gobongo','Outils, matériaux, peinture. (démo)','+236 75 00 00 37','Lun–Sam 7h30–18h','published',false,false,null,false,array[]::text[]),
-- Salons
('Salon Beauté Royale','salon','Km5','Km5','Coiffure, tresses, manucure. (démo)','+236 75 00 00 38','Lun–Sam 8h–19h','published',false,false,null,false,array[]::text[]),
('Barbershop Élégance','salon','Centre-ville','Centre-ville','Coupes hommes, barbe, soins. (démo)','+236 75 00 00 39','Lun–Sam 8h–20h','published',false,false,null,false,array[]::text[]),
('Institut Beauté Naturelle','salon','Castors','Castors','Soins du visage, massages, épilation. (démo)','+236 75 00 00 40','Mar–Sam 9h–18h','published',false,false,null,false,array[]::text[]),
-- Garages
('Garage Moderne Bangui','garage','Zone industrielle','Zone industrielle','Mécanique, vidange, diagnostic. (démo)','+236 75 00 00 41','Lun–Sam 7h30–18h','published',false,false,null,false,array[]::text[]),
('Auto Service Bimbo','garage','Bimbo','Bimbo','Réparation toutes marques, électricité auto. (démo)','+236 75 00 00 42','Lun–Sam 7h30–18h','published',false,false,null,false,array[]::text[]),
('Pneus & Vidange Express','garage','Km5','Km5','Pneus, équilibrage, vidange rapide. (démo)','+236 75 00 00 43','Lun–Sam 7h–19h','published',false,false,null,false,array[]::text[]),
-- BTP
('Centrafrique Construction','btp','Centre-ville','Centre-ville','Construction de maisons, bâtiments, rénovation. (démo)','+236 75 00 00 44','Lun–Ven 7h30–17h','published',false,false,null,false,array[]::text[]),
('Plomberie Électricité Pro','btp','Lakouanga','Lakouanga','Installations et dépannages à domicile. (démo)','+236 75 00 00 45','Lun–Sam 7h–19h','published',false,false,null,false,array[]::text[]),
('Cabinet Plans & Architecture','btp','Fatima','Fatima','Plans, suivi de chantier, permis de construire. (démo)','+236 75 00 00 46','Lun–Ven 8h–17h','published',false,false,null,false,array[]::text[]),
-- Voyages
('Oubangui Voyages','voyage','Centre-ville','Avenue de l''Indépendance','Billets d''avion, réservations, visas. (démo)','+236 75 00 00 47','Lun–Sam 8h–18h','published',false,false,null,false,array[]::text[]),
('Agence Horizon Évasion','voyage','Km5','Km5','Voyages organisés et séjours. (démo)','+236 75 00 00 48','Lun–Sam 8h–17h','published',false,false,null,false,array[]::text[]),
('Express Interurbain','voyage','Bangui M''Poko','Gare routière','Bus vers Bouar, Berbérati, Bambari. (démo)','+236 75 00 00 49','Lun–Dim 5h–18h','published',false,false,null,false,array[]::text[]),
-- Stations-service
('Station Total Fouh','station','Fouh','Route de Fouh','Carburant, boutique, lavage. (démo)','+236 75 00 00 50','Lun–Dim 6h–22h','published',false,false,null,false,array['Parking']),
('Station Oubangui Énergie','station','Centre-ville','Avenue de France','Essence, gasoil, gaz domestique. (démo)','+236 75 00 00 51','24h/24','published',false,false,null,false,array[]::text[]),
('Station Km5 Express','station','Km5','Km5','Carburant et boutique. (démo)','+236 75 00 00 52','Lun–Dim 6h–22h','published',false,false,null,false,array[]::text[]),
-- Organisations
('Association Espoir Jeunesse','organisation','Gobongo','Gobongo','Formation et accompagnement des jeunes. (démo)','+236 75 00 00 53','Lun–Ven 8h–16h','published',false,false,null,false,array[]::text[]),
('Réseau des Femmes Entrepreneures','organisation','Centre-ville','Centre-ville','Appui aux commerçantes et micro-crédits. (démo)','+236 75 00 00 54','Lun–Ven 8h–16h','published',false,false,null,false,array[]::text[]),
('Chambre de Commerce de Bangui','organisation','Centre-ville','Centre-ville','Représentation et appui aux entreprises. (démo)','+236 75 00 00 55','Lun–Ven 7h30–15h30','published',false,false,null,false,array[]::text[]);

-- 2) Positions approximatives (pour les km et la carte) autour de Bangui
update public.places set
  lat = 4.3612 + ((abs(hashtext(id::text)) % 400) - 200) / 10000.0,
  lng = 18.5550 + ((abs(hashtext(id::text || 'x')) % 400) - 200) / 10000.0
where description like '%(démo)';

-- 3) Menus, chambres, produits, services (par secteur ; prix légèrement variables)
create temporary table _tpl (cat text, n text, pr int, u text, d text, av boolean default true) on commit drop;
insert into _tpl values
('restaurant','Poulet braisé',5000,null,'Servi avec plantain',true),('restaurant','Bœuf sauce',7000,null,'Riz ou manioc',true),('restaurant','Poisson grillé',6500,null,'Capitaine du fleuve',true),('restaurant','Sauce feuilles de manioc',3500,null,null,false),('restaurant','Brochettes de bœuf',3000,null,'Portion de 5',true),
('hotel','Chambre Standard',25000,'nuit','Lit double, ventilateur',true),('hotel','Chambre Confort',35000,'nuit','Climatisation, TV',true),('hotel','Suite',60000,'nuit','Salon, climatisation, petit-déjeuner',false),
('pharmacie','Paracétamol 500 mg',500,null,'Boîte de 16',true),('pharmacie','Sérum de réhydratation',700,null,null,true),('pharmacie','Moustiquaire imprégnée',4000,null,null,true),('pharmacie','Test de paludisme',1500,null,null,true),
('banque','Ouverture de compte',5000,null,'Pièce d''identité requise',true),('banque','Transfert d''argent',1000,null,'Frais fixes',true),('banque','Carte bancaire',7500,null,null,true),
('hopital','Consultation générale',5000,null,null,true),('hopital','Analyses de sang',8000,null,'Résultats sous 24h',true),('hopital','Échographie',15000,null,null,true),('hopital','Vaccination',2500,null,null,true),
('ecole','Inscription',25000,'an',null,true),('ecole','Scolarité primaire',60000,'trimestre',null,true),('ecole','Cantine',15000,'mois',null,true),
('universite','Inscription',50000,'an',null,true),('universite','Licence',250000,'an',null,true),('universite','Master',400000,'an',null,true),
('transport','Course en ville',1500,null,'Prix de base',true),('transport','Course à la journée',25000,null,null,true),('transport','Transfert aéroport',8000,null,null,true),
('admin','Acte de naissance',2000,null,'Pièces à fournir sur place',true),('admin','Légalisation de document',1000,null,null,true),('admin','Certificat de résidence',2500,null,null,true),
('culte','Culte principal',0,null,null,true),('culte','Étude biblique / enseignement',0,null,null,true),
('commerce','PC Portable',350000,null,null,true),('commerce','Smartphone',120000,null,null,true),('commerce','Imprimante',95000,null,null,false),('commerce','Pain (baguette)',150,null,null,true),
('salon','Coiffure femme',5000,null,null,true),('salon','Tresses',10000,null,null,true),('salon','Coupe homme',2000,null,null,true),('salon','Manucure',4000,null,null,true),
('garage','Vidange',15000,null,null,true),('garage','Diagnostic électronique',10000,null,null,true),('garage','Changement de plaquettes',20000,null,null,true),
('btp','Devis gratuit',0,null,'Déplacement inclus à Bangui',true),('btp','Maçonnerie',15000,'m²',null,true),('btp','Plomberie (intervention)',10000,null,null,true),
('voyage','Billet Bangui – Douala',250000,null,null,true),('voyage','Assistance visa',50000,null,null,true),('voyage','Réservation hôtel',10000,null,null,true),
('station','Essence',1000,'litre',null,true),('station','Gasoil',950,'litre',null,true),('station','Gaz domestique 12 kg',9000,null,null,true),
('organisation','Adhésion',5000,'an',null,true),('organisation','Formation entrepreneuriat',20000,null,null,true);
insert into public.place_items (place_id, name, price, unit, description, available)
select p.id, t.n, case when t.pr = 0 then 0 else greatest(100, round(t.pr * (0.9 + (abs(hashtext(p.id::text || t.n)) % 25) / 100.0) / 50) * 50) end, t.u, t.d,
       t.av and (abs(hashtext(p.id::text || t.n)) % 7 <> 0)
from public.places p join _tpl t on t.cat = p.category where p.description like '%(démo)';

-- 4) Clients de démonstration (comptes fictifs, sans connexion possible) + avis avec leurs noms
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change, email_change_token_new)
select '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', v.em || '@bangui-demo.test', crypt(gen_random_uuid()::text, gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('full_name', v.nm), now(), now(), '', '', '', ''
from (values ('marie','Marie Ngaïssona'),('jean','Jean-Pierre Yakité'),('fatou','Fatou Mahamat'),('aime','Aimé Dologuélé'),('christelle','Christelle Bangui'),('david','David Kolingba'),('sandrine','Sandrine Zokoué'),('ibrahim','Ibrahim Saleh')) as v(em, nm);

insert into public.reviews (place_id, user_id, author, rating, comment, created_at)
select p.id, u.id, u.raw_user_meta_data->>'full_name',
  case when abs(hashtext(p.id::text || u.id::text || 'r')) % 10 < 5 then 5 when abs(hashtext(p.id::text || u.id::text || 'r')) % 10 < 8 then 4 else 3 end,
  (array['Très bon accueil, je recommande.','Service rapide et prix corrects.','Propre et bien situé, facile à trouver.','Personnel sympathique et professionnel.','Bon rapport qualité-prix.','Un peu d''attente mais le résultat vaut le coup.','J''y retournerai sans hésiter.','Très satisfait, merci à toute l''équipe.'])[1 + abs(hashtext(p.id::text || u.id::text || 'c')) % 8],
  now() - ((abs(hashtext(p.id::text || u.id::text || 'd')) % 60) || ' days')::interval
from public.places p cross join auth.users u
where p.description like '%(démo)' and u.email like '%@bangui-demo.test' and abs(hashtext(p.id::text || u.id::text)) % 100 < 38;

-- Réponses d'établissement sur quelques avis
update public.reviews set owner_reply = 'Merci pour votre confiance, à très bientôt !', owner_reply_at = now()
where abs(hashtext(id::text)) % 4 = 0 and user_id in (select id from auth.users where email like '%@bangui-demo.test');
