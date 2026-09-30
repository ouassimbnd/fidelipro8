# Fideli PME — v14

Cette version renforce le socle SaaS : accès commerçant par mot de passe ou lien sécurisé, rôles propriétaire/responsable/caissier, données client enrichies, consentements et premières campagnes email.

**Avant de déployer, suivre `MISE-EN-SERVICE.md`.** Si votre base utilise la v12, appliquer `supabase/upgrade-v13.sql` puis `supabase/upgrade-v14.sql` pour les nouvelles fonctions ; ne pas réinstaller le schéma complet sur une base existante.

## L’espace commerçant

- Tableau de bord avec les données du programme et les raccourcis de gestion.
- Création d’établissement et exemples de récompenses adaptés : coiffure/barbier, restaurant, café, parfumerie, institut, boulangerie, boutique ou autre commerce.
- Caisse : recherche de client, lecture d’un lien QR digital ou physique, sélection automatique d’une carte scannée, attribution au membre de l’équipe, passage et remise de récompense.
- Clients : points, passages et historique des opérations.
- Récompenses : création de paliers, publication et mise en pause.
- Équipe : ajout, recherche, renommage, activation, désactivation et activité sur 7/30 jours.
- Établissement : informations publiques et lien vers la page client.
- Cartes physiques : statuts traduits, cartes désactivées sans QR réutilisable et pagination de l’inventaire.
- Cartes Wallet : état de configuration Apple et Google.

Les membres de l’équipe sont des profils d’attribution des passages, gérés depuis le compte propriétaire. Cette version n’ajoute pas de comptes employés autonomes ni de gestion multi-établissements.

## Le parcours client

1. Scanner le QR du commerce ou de sa carte physique.
2. S’identifier par email et ouvrir le lien sécurisé.
3. Retrouver sa carte, ses points et ses récompenses.
4. Consulter son historique et modifier son nom affiché.
5. Ajouter sa carte à Apple Wallet ou Google Wallet après activation des intégrations.

Les points sont enregistrés dans Supabase : 10 points par passage validé, 5 points par retour privé après visite, puis déduction du coût de la récompense. Les soldes ne sont pas stockés dans le navigateur.

Les cartes Wallet portent un QR personnel et un lien vers le solde à jour. Les mises à jour automatiques des passes, Apple Push, Google Wallet Push et le paiement sans contact ne sont pas implémentés. Une suppression du compte ne retire pas à distance un pass déjà enregistré sur le téléphone ; l’adhésion supprimée ne peut plus être utilisée en caisse.

## Installation locale

```bash
npm ci
npm run dev
```

Copier `.env.example` dans un fichier d’environnement local et renseigner les variables. Les clés privées restent côté serveur. Ne jamais les préfixer par `NEXT_PUBLIC_` ni les committer.

## Vérifications

```bash
npm run typecheck
npm run build
npm test
```

Les tests Apple nécessitent OpenSSL. Le détail des contrôles exécutés et de leurs limites figure dans `VALIDATION.md`.

## Limites restantes

Cette archive ne contient pas les identifiants de votre Supabase ni les certificats Apple ou clés Google. La mise à jour SQL n’a pas été appliquée à votre base et aucun déploiement n’a été effectué. Les tests Wallet utilisent des identités et clés temporaires.

La facturation des abonnements n’est pas branchée. Les pages légales et l’offre commerciale doivent être renseignées avec vos informations réelles avant le lancement. Fideli reste ici une plateforme de fidélité ; elle n’intègre pas de prise de commande, d’agenda de rendez-vous ou de gestion de stock.
