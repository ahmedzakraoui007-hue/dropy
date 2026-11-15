# Dropy Vendeur

Application mobile (Android et iOS) des vendeurs Dropy, construite avec Expo SDK 58 et Expo Router.

## Fonctions

- Connexion avec le compte vendeur Dropy (vendeur, admin ou agent validé)
- Accueil : ventes du jour, commandes à confirmer, ventes des 7 derniers jours
- Commandes : filtres par statut, recherche, mise à jour en temps réel, appel et WhatsApp du client, confirmation et annulation
- Produits : mise en vente ou masquage, prix, prix barré et stock
- Boutique : lien, partage, langue FR / AR, notifications, déconnexion
- Notification push à chaque nouvelle commande

## Lancer en local

```bash
cd mobile
npm install
npx expo start
```

Le fichier `mobile/.env` contient les variables publiques `EXPO_PUBLIC_*` (les mêmes que dans `eas.json`).

## Builds

```bash
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build --profile preview --platform android
```

`eas init` ajoute le `projectId` dans `app.json`, nécessaire aux notifications push.

## Côté serveur

- `requireUser` accepte `Authorization: Bearer <access_token>` en plus des cookies.
- `POST /api/mobile/push-token` enregistre le jeton Expo du téléphone, `DELETE` le retire.
- Migration `supabase/migrations/20261115090000_push_tokens.sql` : table `push_tokens`.
- Chaque nouvelle commande envoie une notification au vendeur (`src/lib/push.ts`).
