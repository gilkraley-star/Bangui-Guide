# Bangui Guide

Application Android (Capacitor + Vite + Supabase).

## Mise en route (une seule fois)
1. Crée un projet gratuit sur https://supabase.com
2. SQL Editor : exécute `supabase/schema.sql`, puis `supabase/seed.sql` (lieux publics vérifiés).
3. Authentication > Users > Add user : crée ton compte (email + mot de passe), puis exécute le petit bloc `insert into public.profiles ...` en bas de schema.sql pour te donner le rôle admin.
4. Authentication > Sign In / Providers : désactive « Allow new users to sign up » (seul l'admin crée les agents).
5. Project Settings > API : copie « Project URL » et « anon public key » dans `src/config.js`, commit, push.
6. GitHub > Actions > « Build APK » > dernier run > Artifacts > `BanguiGuide-debug-apk`.

Ajouter un agent : Supabase > Authentication > Users > Add user, puis `insert into public.profiles (id, full_name, role) select id, 'Nom', 'agent' from auth.users where email = '...';`

## Version 2
Exécuter aussi `supabase/migration_v2.sql` (comptes visiteurs, avis, messagerie, menu/chambres/produits, propriétaires).
Authentication > Sign In / Providers : activer « Allow new users to sign up » et désactiver « Confirm email ».

`design/maquette/` : maquette de design d'origine (non utilisée par l'app).
