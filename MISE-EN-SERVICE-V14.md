# Mise en service Fideli v14

1. Conserver la base Supabase existante. Ne pas supprimer les tables.
2. Si la base est en v12, exécuter d'abord `supabase/upgrade-v13.sql` puis `supabase/upgrade-v14.sql` dans SQL Editor.
3. Vérifier dans Vercel : `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
4. Dans Supabase Auth > URL Configuration, ajouter le domaine Vercel de production aux Redirect URLs.
5. Tester : création compte commerçant, confirmation email, connexion mot de passe, connexion par lien email, création commerce, QR, inscription client, visite, récompense.
6. Tester avec deux commerces distincts avant tout pilote réel.

## Nouveautés v14
- Connexion commerçant par mot de passe ou lien sécurisé.
- Base de rôles multi-tenant `business_members` : owner / manager / cashier.
- Permissions SQL distinctes pour gestion et caisse.
- Profil client enrichi : téléphone et anniversaire facultatifs.
- Consentement marketing explicite et horodaté.
- Table et écran Campagnes avec brouillons et audience consentante.
- Anti-fraude conservé : une visite par adhésion toutes les 10 minutes.

## Important
L'envoi réel des campagnes email n'est volontairement pas activé : connecter un fournisseur d'envoi (ex. Resend/Brevo) et gérer désinscription/bounce avant production. Les rôles authentifiés sont prêts côté données ; l'invitation autonome d'un responsable/caissier par email reste à connecter avant ouverture de comptes équipe séparés.
