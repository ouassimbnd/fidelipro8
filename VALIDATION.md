# Vérifications de Fideli v13

## Contrôles réalisés

- Vérification TypeScript du projet.
- Compilation Next.js de production des pages et des routes serveur.
- Tests `tests/core.cjs` : adresse canonique, refus des URL invalides, retours de connexion internes, reconnaissance des QR, adaptation des catégories métier et traduction du statut de carte perdue.
- Génération Google Wallet : vérification cryptographique de la signature RSA-SHA256, du domaine public, de l’identifiant stable et du QR de caisse.
- Route Google Wallet avec client Supabase simulé : connexion absente/invalide, identifiant invalide, adhésion non détenue, service non configuré et émission autorisée ; propriété de la carte vérifiée et réponse sans cache.
- Tests `tests/wallet.cjs` : génération Apple `.pkpass` avec certificat temporaire ; route Apple avec client Supabase simulé et codes 401/400/404/503/200.

La clé et les certificats temporaires des tests ne sont pas des identifiants Apple/Google utilisables en production. Les tests de routes ne remplacent pas les règles RLS de votre base réelle.

## Contrôles à réaliser sur votre environnement

Aucun accès à votre Supabase, à Vercel ou aux comptes Apple/Google n’a été fourni. Aucune donnée réelle n’a été modifiée et aucun déploiement n’a été effectué.

Le script `supabase/upgrade-v13.sql` est fourni, mais n’a pas été exécuté sur un PostgreSQL de test ni sur votre base. Il faut l’appliquer et vérifier les scénarios d’historique et de renommage décrits dans le guide.

La recette visuelle et interactive en navigateur n’a pas pu être validée dans cet environnement : le navigateur local disponible s’arrête au lancement. Les dispositions mobiles ont été implémentées et la compilation les inclut, mais la vérification sur iPhone/Android et ordinateur reste nécessaire.

La compilation locale utilise une adaptation temporaire de la télémétrie mémoire, nécessaire dans cet environnement limité. Elle n’est pas incluse dans le code livré et ne modifie pas le fonctionnement de production.

La recette complète figure dans `MISE-EN-SERVICE.md`.
