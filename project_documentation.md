# 📘 Dropy SaaS - Documentation Technique Complète

## 1. 🏗️ Architecture & Technologies

Dropy est une plateforme SaaS e-commerce multi-vendeurs (type Shopify) construite sur une architecture moderne **Next.js 15** (App Router) et **Supabase**.

### Stack Technique
- **Frontend/Framework**: Next.js 15.1.0 (App Router, Server Components)
- **Langage**: TypeScript 5
- **Base de Données & Auth**: Supabase (PostgreSQL, GoTrue)
- **Styling**: TailwindCSS 4, Shadcn/UI (Radix Primitives), Framer Motion
- **Icons**: Lucide React
- **Paiement**: Stripe / (Prêt pour Flouci au besoin)
- **Tests**: Playwright (E2E)

### Structure du Projet
Le code est organisé dans `src/` avec l'approche "Feature-First" via Next.js App Router.

```
src/
├── app/                        # Routes de l'application (File-based Routing)
│   ├── (landing)/              # Site marketing principal Dropy
│   ├── [storeSlug]/            # 🛍️ STOREFRONT (Boutiques publiques)
│   ├── admin/                  # 🛡️ PORTAIL ADMIN
│   ├── seller/                 # 💼 PORTAIL VENDEUR (Dashboard)
│   │   ├── store-builder/      #    └── Constructeur de site
│   │   └── ...                 #    └── Produits, Commandes, Paramètres
│   ├── supplier/               # 🏭 PORTAIL FOURNISSEUR
│   ├── creator/                # 🎨 PORTAIL CRÉATEUR (UGC)
│   ├── api/                    # API Routes (REST endpoints)
│   └── auth/callback/          # Gestionnaire de retour OAuth
├── components/                 # Composants React
│   ├── store-builder/          # Composants spécifiques au Website Builder
│   ├── storefront/             # Composants pour les boutiques publiques
│   ├── ui/                     # Bibliothèque de composants (Boutons, Inputs...)
│   └── ...
├── lib/                        # Utilitaires & Config (Supabase, Utils)
├── hooks/                      # Custom Hooks (useThemes, etc.)
└── types/                      # Définitions TypeScript (Database, Props)
```

---

## 2. 🧩 Modules Principaux

### 2.1. Authentification & Routing (`middleware.ts`)
Le système gère plusieurs rôles (Seller, Supplier, Admin, Creator) et le routage des boutiques.
- **Middleware** : Intercepte toutes les requêtes pour :
    - Gérer les sessions Supabase (`updateSession`).
    - Protéger les routes `/seller`, `/admin`, etc.
    - Router les boutiques : si le premier segment n'est pas réservé (ex: `/ma-boutique`), il charge la boutique correspondante.
- **OAuth** : `src/app/auth/callback/route.ts` gère la connexion Google et redirige intelligemment vers le bon dashboard (éviter le statut "pending").

### 2.2. Portail Vendeur (`/seller`)
Le cœur de l'application pour les marchands.
- **Dashboard** : Vue d'ensemble des ventes et commandes.
- **Store Builder** (`/seller/store-builder`) : Outil No-Code pour créer sa boutique.
    - **ThemeGallery** : Choix de templates.
    - **LivePreview** : Prévisualisation en temps réel (iframe).
    - **SectionEditor** : Modification des textes, images, couleurs.
    - **UseThemes Hook** : Logique d'application des thèmes et gestion des sections.
- **Gestion Produits** : Importation depuis le catalogue fournisseur ou création.

### 2.3. Storefront (`/[storeSlug]`)
Les boutiques publiques générées par les vendeurs.
- **Layout Dynamique** : `src/app/[storeSlug]/layout.tsx` injecte les variables CSS (couleurs, polices) définies par le vendeur.
- **Page d'Accueil** : `page.tsx` charge et rend les sections (`SectionRenderer`) stockées en base de données.
- **Check** : `src/app/[storeSlug]/checkout` (Tunnel d'achat).

### 2.4. Portail Fournisseur (`/supplier`)
Pour les fournisseurs qui mettent à disposition leurs produits.
- **Catalogue** : Gestion des stocks et prix de gros.
- **Commandes** : Réception des commandes dropshipping à expédier.

### 2.5. Portail Admin (`/admin`)
Super-vision de la plateforme.
- Gestion des utilisateurs, validation des fournisseurs, modération.

---

## 3. 💾 Modèle de Données (Supabase)

Principales tables (schéma simplifié) :
- `profiles` : Utilisateurs et Rôles.
- `stores` : Informations de base de la boutique (nom, slug).
- `store_configs` : Configuration visuelle (logo, couleurs, thème actif).
- `store_pages` : Pages de la boutique (Accueil, Contact).
    - Colonne `sections` (JSON) : Structure du contenu de la page.
- `store_sections` : (Legacy/Relational) Sections individuelles.
- `products` : Catalogue global (Fournisseurs).
- `store_products` : Produits importés dans une boutique (Vendeurs).
- `orders` : Commandes clients.

---

## 4. 🛠️ Flux Clés (Workflows)

### A. Onboarding Vendeur
1. Inscription (`/inscription`) → Création `auth.users` + `profiles`.
2. Redirection `/seller/onboarding` → Création de la boutique (`stores`).
3. Accès Dashboard → Sélection Thème → Import Produits.

### B. Création de Boutique (Builder)
1. Le vendeur choisit un thème dans `ThemeGallery`.
2. `useThemes.applyTheme` copie la config et les sections par défaut dans `store_configs` et `store_pages`.
3. Le vendeur édite via le panneau latéral (`SectionEditor`).
4. Les modifications sont sauvegardées en temps réel (ou via bouton Save) dans Supabase.
5. La vue "Preview" (`/preview/...`) charge ces données dynamiquement.

### C. Achat Client (Storefront)
1. Visite `dropy.store/ma-boutique`.
2. Middleware détecte `ma-boutique` → Rend `src/app/[storeSlug]/page.tsx`.
3. Ajout panier (Context React Local).
4. Checkout → Création `orders` → Paiement (Stripe/Cash).

---

## 5. 🚀 Déploiement & Environnement

### Variables d'Environnement (`.env.local`)
```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...       # Pour les seeds/admin
NEXT_PUBLIC_APP_URL=https://dropy.store
NEXT_PUBLIC_STORE_DOMAIN=dropy.store
```

### Scripts Utiles
- `npm run dev` : Lancer le serveur local (Port 3000).
- `npm run build` : Compiler pour la production.
- `npm run test:e2e` : Lancer les tests Playwright.
- `npm run seed` : Peupler la base de données avec des données de test.

---

## 6. 🗺️ Sitemap & Listing des URLs

Voici l'inventaire exhaustif des routes détectées dans le projet.

### 🏠 Site Public & Landing
- `/` (Landing Page)
- `/a-propos`, `/contact`, `/faq`, `/aide`
- `/tarifs`, `/vendeurs`, `/fournisseurs`, `/createurs`
- `/carrieres`
- `/politique-confidentialite`, `/conditions-utilisation`, `/mentions-legales`
- `/inscription`, `/login`, `/forgot-password`, `/auth/reset-password`
- `/track` (Suivi de commande global)
- `/demande-en-attente` (Page d'attente d'approbation)

### 🛍️ Storefront (Boutiques)
Structure : `dropy.store/[nom-boutique]`
- `/[storeSlug]` : Page d'accueil de la boutique
- `/[storeSlug]/checkout` : Tunnel de commande
- `/[storeSlug]/[...slug]` : Pages dynamiques (Produits, Collections, Pages statiques)
- `/preview/[slug]/[pageSlug]` : Mode aperçu (pour le Builder)

### 💼 Portail Vendeur (`/seller`)
- `/seller/dashboard`
- **Produits** : `/seller/products`, `/seller/products/new`, `/seller/products/import`, `/seller/products/my-products`
- **Commandes** : `/seller/orders`, `/seller/orders/[id]`
- **Boutique** : 
  - `/seller/store-builder` (Éditeur)
  - `/seller/store/settings`, `/seller/store/pages`, `/seller/store/menus`, `/seller/store/domains`
- **Marketing** : `/seller/analytics`, `/seller/customers`
- **UGC** : `/seller/ugc`, `/seller/ugc/briefs/new`
- **Finance** : `/seller/subscription`, `/seller/settings`

### 🏭 Portail Fournisseur (`/supplier`)
- `/supplier/dashboard`
- **Produits** : `/supplier/products` (Catalogue), `/supplier/products/new`
- **Commandes** : `/supplier/orders` (Dropshipping), `/supplier/shipping`
- `/supplier/settings`

### 🎨 Portail Créateur (`/creator`)
- `/creator/dashboard`
- **Missions** : `/creator/opportunities` (Offres), `/creator/missions` (En cours)
- **Portfolio** : `/creator/portfolio`
- `/creator/payments`, `/creator/settings`

### 🛡️ Portail Admin (`/admin`)
- `/admin/dashboard`
- **Gestion** : `/admin/users`, `/admin/sellers`, `/admin/suppliers`, `/admin/creators`
- **Produits** : `/admin/products` (Catalogue global)
- **Contenu** : `/admin/content`, `/admin/content/briefs`, `/admin/content/reviews`
- **Finance** : `/admin/subscriptions`, `/admin/escrow` (Paiements UGC)
- `/admin/settings`, `/admin/support`

### 🔌 API Routes (Backend)
- **Auth** : `/api/auth/signup`, `/api/auth/forgot-password`, `/auth/callback`
- **Paiements (Stripe)** : 
  - `/api/stripe/create-checkout-session`
  - `/api/stripe/create-subscription`, `/api/stripe/manage-subscription`
  - `/api/stripe/webhooks`
- **Commandes & Logistique** : 
  - `/api/store/orders`
  - `/api/supplier/orders/[id]/accept`, `.../prepare`, `.../ready`
  - `/api/webhooks/delivery`
- **Média & Contenu** : 
  - `/api/media/unsplash/search`
  - `/api/reviews/...` (Product, Store, Supplier, Creator)
  - `/api/ugc/briefs/...`
- **Admin** : `/api/analytics/visit`, `/api/admin/users/status`

---
