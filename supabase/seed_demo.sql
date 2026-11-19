-- DONNÉES DE DÉMONSTRATION (établissements fictifs) — marquées "(démo)".
-- Pour les supprimer avant le lancement : delete from public.places where description like '%(démo)';
delete from public.places where description like '%(démo)';
insert into public.places (name, category, area, address, description, status, verified, sponsored, sponsored_until, tags) values
('Le Relais de Bangui','restaurant','Centre-ville','Rue du Commerce','Cuisine africaine et internationale, grillades, cadre convivial. (démo)','published',true,true,'2027-12-31',array['Wi-Fi','Parking','Livraison','Paiement mobile']),
('Chez Maman','restaurant','Km5','Avenue de l''Indépendance','Plats du jour et spécialités centrafricaines. (démo)','published',false,false,null,array['Livraison']),
('La Terrasse','restaurant','Bimbo','Route de Bimbo','Restaurant avec terrasse, poissons grillés. (démo)','published',false,false,null,array['Parking']),
('Maquis Le Bon Goût','restaurant','Centre-ville','Centre-ville','Maquis ambiance familiale, brochettes et boissons. (démo)','published',false,false,null,array[]::text[]),
('Hôtel Résidence le Central','hotel','Centre-ville','Centre-ville','Hôtel au cœur de Bangui : chambres confortables, restaurant, salle de réunion. (démo)','published',true,true,'2027-12-31',array['Wi-Fi','Restaurant','Piscine','Parking']),
('Hôtel Oubangui','hotel','Km5','Route de l''aéroport','Hôtel proche de l''aéroport, navette disponible. (démo)','published',false,false,null,array['Wi-Fi','Parking']),
('Auberge de la Paix','hotel','Lakouanga','Lakouanga','Auberge simple et accueillante. (démo)','published',false,false,null,array[]::text[]),
('Pharmacie Centrale','pharmacie','Bimbo','Avenue Barthélemy Boganda','Pharmacie ouverte jusqu''à 21h. (démo)','published',true,false,null,array[]::text[]),
('Pharmacie de la Paix','pharmacie','Lakouanga','Lakouanga','Médicaments et conseils, service de garde. (démo)','published',false,false,null,array[]::text[]),
('Pharmacie du Marché','pharmacie','Km5','Marché central','Pharmacie près du marché. (démo)','published',false,false,null,array[]::text[]),
('Banque BICICA','banque','Centre-ville','Avenue de France','Agence bancaire, guichet automatique. (démo)','published',true,false,null,array[]::text[]),
('Banque de l''Oubangui','banque','Km5','Km5','Services bancaires et transferts d''argent. (démo)','published',false,false,null,array[]::text[]),
('Clinique Espoir','hopital','Bimbo','Bimbo','Consultations, urgences, maternité. (démo)','published',false,false,null,array['Urgences 24h/24']),
('Centre de Santé de Fouh','hopital','Fouh','Fouh','Soins de base et vaccination. (démo)','published',false,false,null,array[]::text[]),
('Bangui Shopping','commerce','Centre-ville','Centre-ville','Électronique, informatique, téléphones, accessoires. (démo)','published',false,true,'2027-12-31',array['Paiement mobile']),
('Boulangerie Espérance','commerce','Km5','Km5','Pain frais et viennoiseries chaque matin. (démo)','published',false,false,null,array[]::text[]),
('Supermarché Le Marché Frais','commerce','Centre-ville','Centre-ville','Alimentation, produits ménagers. (démo)','published',false,false,null,array['Parking']),
('Station Total Fouh','station','Fouh','Route de Fouh','Carburant, boutique, lavage. (démo)','published',false,false,null,array['Parking']),
('École Les Étoiles','ecole','Bimbo','Bimbo','École primaire et collège. (démo)','published',false,false,null,array[]::text[]),
('Université Panafricaine de Bangui','universite','Fatima','Fatima','Licences et masters, bibliothèque. (démo)','published',false,false,null,array['Wi-Fi']),
('Coopérative Taxis Bangui','transport','Centre-ville','Toute la ville','Taxis et courses à la journée. (démo)','published',false,false,null,array[]::text[]),
('Garage Moderne Bangui','garage','Zone industrielle','Zone industrielle','Mécanique, vidange, diagnostic. (démo)','published',false,false,null,array[]::text[]),
('Salon Beauté Royale','salon','Km5','Km5','Coiffure, tresses, manucure. (démo)','published',false,false,null,array[]::text[]),
('Oubangui Voyages','voyage','Centre-ville','Avenue de l''Indépendance','Billets d''avion, réservations, visas. (démo)','published',false,false,null,array[]::text[]);

insert into public.place_items (place_id, name, price, unit, description)
select p.id, v.n, v.pr, v.u, v.d from public.places p join (values
 ('Le Relais de Bangui','Poulet braisé',5000,null,'Plat'),('Le Relais de Bangui','Bœuf sauce',7000,null,'Plat'),('Le Relais de Bangui','Poisson grillé',6500,null,'Plat'),
 ('Chez Maman','Sauce feuilles de manioc',3500,null,'Plat'),('Chez Maman','Poisson fumé',4500,null,'Plat'),
 ('Hôtel Résidence le Central','Chambre Standard',25000,'nuit',null),('Hôtel Résidence le Central','Chambre Confort',35000,'nuit',null),('Hôtel Résidence le Central','Suite',50000,'nuit',null),
 ('Hôtel Oubangui','Chambre simple',20000,'nuit',null),('Hôtel Oubangui','Chambre double',30000,'nuit',null),
 ('Bangui Shopping','PC Portable',350000,null,null),('Bangui Shopping','Smartphone',120000,null,null),('Bangui Shopping','Imprimante',95000,null,null)
) as v(pn,n,pr,u,d) on v.pn=p.name where p.description like '%(démo)';
