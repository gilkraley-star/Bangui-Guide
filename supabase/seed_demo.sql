-- DONNÉES DE DÉMONSTRATION (établissements fictifs de la maquette).
-- À SUPPRIMER avant le lancement : delete from public.places where description like '[DÉMO]%';
insert into public.places (name, category, area, address, description, status, verified, sponsored, sponsored_until, tags) values
('Le Relais de Bangui','restaurant','Centre-ville','Rue du Commerce, Bangui','[DÉMO] Restaurant, grill et cuisine africaine et internationale dans un cadre agréable et convivial.','published',false,true,'2027-12-31',array['Wi-Fi','Parking','Livraison','Paiement mobile']),
('Hôtel Résidence le Central','hotel','Centre-ville','Centre-ville, Bangui','[DÉMO] Hôtel au cœur de Bangui : chambres confortables, restaurant et salle de réunion.','published',false,true,'2027-12-31',array['Wi-Fi','Restaurant','Piscine','Parking']),
('Bangui Shopping','commerce','Centre-ville','Centre-ville, Bangui','[DÉMO] Électronique, informatique, téléphones, accessoires et articles de bureau.','published',false,false,null,array['Wi-Fi','Paiement mobile']),
('Pharmacie Centrale','pharmacie','Centre-ville','Centre-ville, Bangui','[DÉMO] Pharmacie ouverte jusqu''à 21h.','published',false,false,null,array[]::text[]),
('Boulangerie Espérance','commerce','Km5','Km5, Bangui','[DÉMO] Pain frais et viennoiseries chaque matin.','published',false,false,null,array[]::text[]),
('Station Total Km5','station','Km5','Km5, Bangui','[DÉMO] Carburant disponible.','published',false,false,null,array[]::text[]);

insert into public.place_items (place_id, name, price, unit, description)
select p.id, v.n, v.pr, v.u, v.d from public.places p join (values
 ('Le Relais de Bangui','Poulet braisé',5000,null,'Plat'),('Le Relais de Bangui','Bœuf sauce',7000,null,'Plat'),('Le Relais de Bangui','Poisson grillé',6500,null,'Plat'),
 ('Hôtel Résidence le Central','Chambre Standard',25000,'nuit',null),('Hôtel Résidence le Central','Chambre Confort',35000,'nuit',null),('Hôtel Résidence le Central','Suite',50000,'nuit',null),
 ('Bangui Shopping','PC Portable',350000,null,null),('Bangui Shopping','Smartphone',120000,null,null),('Bangui Shopping','Imprimante',95000,null,null)
) as v(pn,n,pr,u,d) on v.pn=p.name where p.description like '[DÉMO]%';
