-- Lieux publics dont les informations ont été vérifiées sur des sources publiques.
-- Pas de photo : elles seront ajoutées sur le terrain par les agents.
insert into public.places (name, category, area, address, phone, description, lat, lng, status, verified) values
('Mairie de Bangui','admin','Centre-ville','Rue Valéry Giscard d''Estaing, BP 789, Bangui','+236 21 61 88 24','Hôtel de Ville de Bangui.',null,null,'published',true),
('Cathédrale Notre-Dame de Bangui','culte','Centre-ville','Centre-ville, près du stade Barthélemy Boganda','', 'Cathédrale catholique, siège de l''archidiocèse de Bangui, construite en 1937.',4.3706,18.5797,'published',true),
('Église Notre-Dame d''Afrique','culte','Km5','Km5, Bangui','', 'Église catholique du quartier Km5.',4.39786,18.55727,'published',true),
('Grande Mosquée de Bangui','culte','Koudoukou','Quartier Koudoukou, Bangui','', 'Grande mosquée de Bangui, trois minarets.',null,null,'published',true),
('Hôpital Communautaire de Bangui','hopital','Bangui','Bangui','', 'Hôpital public.',null,null,'published',true),
('Hôpital de l''Amitié','hopital','Bangui','Bangui','', 'Hôpital universitaire, coopération sino-centrafricaine.',null,null,'published',true);
