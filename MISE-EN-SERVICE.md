# Fideli v13 — installer les améliorations

## 1. Remplacer le code, en conservant vos secrets

Sauvegarder le dépôt et la base existants. Importer les sources de cette archive dans une branche, puis exécuter `npm ci`, `npm run typecheck`, `npm run build` et `npm test`. Déployer d’abord un aperçu Vercel pour la recette.

Ne pas remplacer vos variables privées par les valeurs vides de `.env.example`.

## 2. Mettre à jour Supabase

### Si votre base utilise déjà Fideli v12

Dans le SQL Editor de **votre projet Fideli**, exécuter `supabase/upgrade-v13.sql`.

Ce script ajoute :

- `customer_history` : historique paginé accessible uniquement au client propriétaire de l’adhésion, avec la sécurité RLS existante.
- `rename_cashier` : renommage d’un membre réservé au propriétaire du commerce, sans perdre ses visites.

Il n’efface aucune donnée et conserve le barème actuel. Ne pas réexécuter `schema.sql` sur une base existante pour cette seule mise à jour : le schéma initial contient une réinstallation des politiques d’accès.

### Pour une nouvelle base

Exécuter `supabase/schema.sql`, puis `supabase/upgrade-v13.sql`. Configurer Auth et l’accès Data API comme pour la v12. Les nouvelles fonctions sont accordées au rôle `authenticated` ; les tables existantes conservent leurs règles RLS.

### Vérifier la mise à jour

```sql
select to_regprocedure('public.customer_history(uuid,integer,integer)');
select to_regprocedure('public.rename_cashier(uuid,text)');
```

Les deux résultats doivent être non nuls. Ensuite, réaliser la recette client/commerçant ci-dessous avec vos comptes réels. Les fonctions SQL n’ont pas pu être exécutées sur une base PostgreSQL pendant cette livraison ; leur application et leur recette restent nécessaires.

## 3. Fixer l’adresse publique des QR et emails

Dans les variables Vercel, définir :

```text
APP_URL=https://votre-domaine-public.fr
```

Utiliser uniquement le domaine, sans `/business`, sans paramètres et sans adresse de déploiement d’aperçu. Le système prend `APP_URL` en priorité, sinon le domaine fourni par `VERCEL_PROJECT_PRODUCTION_URL`. Si aucune adresse publique valide n’est disponible, les QR ne sont pas générés sur un domaine distant.

Dans **Settings > Deployment Protection**, vérifier que ce domaine de production est accessible au public. Ouvrir le domaine en navigation privée sur un téléphone avant de télécharger les QR.

Les QR déjà imprimés avec une ancienne adresse ne changent pas tout seuls. Retélécharger et réimprimer ceux qui pointent vers un déploiement Vercel protégé. Les cartes marquées « Perdue · désactivée » restent inutilisables ; créer une nouvelle carte physique si nécessaire.

Dans Supabase Auth, configurer le Site URL et autoriser les redirections vers ce domaine, notamment `/auth/callback` et le retour de récupération de mot de passe utilisé par le projet. Les emails clients et les nouveaux comptes commerçants utilisent l’adresse publique canonique.

Les variables indispensables restent `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. La suppression du compte nécessite aussi `SUPABASE_SERVICE_ROLE_KEY`, côté serveur uniquement.

## 4. Apple Wallet, sur iPhone

Créer un Pass Type ID dans Apple Developer, puis son certificat de signature avec la clé privée correspondante. Obtenir le certificat intermédiaire Apple WWDR adapté. Exporter les certificats et la clé au format PEM, puis les encoder en base64.

| Variable serveur | Contenu |
| --- | --- |
| `APPLE_PASS_TYPE_IDENTIFIER` | Identifiant `pass.…` correspondant au certificat |
| `APPLE_TEAM_IDENTIFIER` | Team ID Apple |
| `APPLE_SIGNER_CERT_BASE64` | Certificat de signature PEM encodé en base64 |
| `APPLE_SIGNER_KEY_BASE64` | Clé privée PEM encodée en base64 |
| `APPLE_SIGNER_KEY_PASSPHRASE` | Mot de passe de la clé si elle est chiffrée |
| `APPLE_WWDR_CERT_BASE64` | Certificat intermédiaire PEM encodé en base64 |

Par exemple, `openssl base64 -A -in fichier.pem` encode un fichier. Ne jamais inclure la clé privée dans le dépôt ou une variable publique.

Après redéploiement, ouvrir l’espace d’un vrai client sur iPhone, télécharger `fideli.pkpass`, l’ouvrir et accepter l’ajout dans Wallet. La présence des variables ne prouve pas que les certificats sont valides.

## 5. Google Wallet, sur Android

Créer un compte émetteur Google Wallet, activer Google Wallet API dans le projet Google Cloud, créer un compte de service et lui accorder l’accès Developer dans la console Google Wallet. Générer une clé privée du compte de service.

| Variable serveur | Contenu |
| --- | --- |
| `GOOGLE_WALLET_ISSUER_ID` | Identifiant numérique de l’émetteur |
| `GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL` | Email du compte de service autorisé |
| `GOOGLE_WALLET_PRIVATE_KEY_BASE64` | Clé privée PEM encodée en base64 |
| `GOOGLE_WALLET_CLASS_ID` | Facultatif : classe existante au format `ISSUER_ID.nom_classe` |

Sans classe renseignée, le lien signé contient une classe Generic `ISSUER_ID.fideli` et l’objet du client. Le JWT est signé côté serveur avec la clé du compte de service. La clé privée PEM correspond au champ `private_key` du fichier JSON du compte de service, pas au fichier JSON entier.

En mode de démonstration Google, seuls les comptes de test autorisés peuvent enregistrer les passes. Obtenir l’accès de publication Google avant de proposer cette fonction à tous les clients. Tester le bouton depuis un compte client sur Android après redéploiement.

## 6. Recette fonctionnelle avant publication

1. Créer un commerce de coiffure, restaurant ou parfumerie ; vérifier les suggestions adaptées et la première récompense.
2. Modifier son activité, ses coordonnées et ses horaires ; vérifier sa page d’inscription.
3. Scanner son QR depuis un téléphone sans compte Vercel. La page Fideli doit s’ouvrir directement.
4. S’inscrire par email, confirmer le lien et vérifier que la bonne carte se crée. Refaire le parcours avec un client déjà inscrit : pas de nouvelle carte ni de perte de points.
5. Créer une carte physique, l’associer au client, puis tester la déclaration de perte et le remplacement.
6. Retrouver un client en caisse par nom, identifiant et lien de QR ; vérifier qu’un changement de recherche désélectionne l’ancien client.
7. Valider un passage et vérifier +10 points. Une deuxième validation dans les 10 minutes doit être refusée par la base.
8. Envoyer un retour privé et vérifier +5 points et la ligne d’historique. Le retour ne peut être récompensé qu’une fois par visite.
9. Remettre une récompense et vérifier la déduction et l’historique correspondant.
10. Ajouter un membre d’équipe, lui attribuer une visite, modifier son nom puis le désactiver ; l’historique doit rester conservé.
11. Modifier le profil client ; vérifier que ses cartes et points sont conservés.
12. Avec un deuxième client et un deuxième commerce, vérifier que les historiques, passes et actions en caisse restent limités à leur propriétaire.
13. Tester Apple Wallet sur iPhone et Google Wallet sur Android avec les vrais certificats/comptes.
14. Vérifier le menu, les formulaires et les tableaux sur téléphone, ainsi que les erreurs réseau et les sessions expirées.

Les passes Wallet ne contiennent pas de solde figé : le lien ouvre le profil à jour. Les mises à jour automatiques de passes, le paiement sans contact, les comptes employés autonomes et la facturation d’abonnements ne sont pas inclus.

## Documentation de référence

- Vercel, Deployment Protection : https://vercel.com/docs/deployment-protection
- Supabase, connexion par email : https://supabase.com/docs/guides/auth/auth-email-passwordless
- Apple, Pass Design and Creation : https://developer.apple.com/library/archive/documentation/UserExperience/Conceptual/PassKit_PG/Creating.html
- Google Wallet, émission Web : https://developers.google.com/wallet/generic/web
- Google Wallet, JWT : https://developers.google.com/wallet/generic/use-cases/jwt
