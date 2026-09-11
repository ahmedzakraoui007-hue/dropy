# Analyse Architecture Store Builder Dropy

**Date** : 30 Janvier 2025
**Version** : 1.0
**Auteur** : Antigravity

---

## 1. Résumé Exécutif

L'architecture du Store Builder de Dropy repose sur une séparation claire entre la **configuration globale** (Thème, Design) et le **contenu spécifique** (Pages). Le système utilise **Supabase** comme source de vérité et synchronise l'état local via des hooks React personnalisés (`usePageEditor`, `useStoreSettings`). L'éditeur de page (`/builder/[UUID]`) est centré sur l'édition d'une page unique identifiée par son UUID, avec une prévisualisation en temps réel via `iframe` et `postMessage`.

---

## 2. Parcours Utilisateur & Rôle des Pages

Voici le tableau récapitulatif des routes analysées :

| Route | Rôle Principal | Données Modifiées | Interactions Clés |
|-------|----------------|-------------------|-------------------|
| `/themes` | Sélection du style visuel de base | `store_configs.theme_id` | Applique des presets (couleurs, fonts, sections par défaut). |
| `/design` | Personnalisation de l'identité visuelle | `store_configs` (colors, typography, logo) | Hérite du thème mais surcharge les valeurs. Sauvegarde immédiate. |
| `/pages` | Gestion de l'arborescence du site | `store_pages` (CRUD) | Création de pages, SEO, suppression. Point d'entrée vers le Builder. |
| `/builder/[UUID]` | Éditeur visuel de contenu | `store_pages.sections` | Drag & Drop, édition de texte, ajout de sections. **L'UUID est l'ID de la page.** |
| `/navigation` | Configuration des menus | `store_menus` (probablement) | Gestion des liens Header/Footer. |
| `/settings` | Paramètres généraux boutique | `store_configs` (nom, contact, domaine) | Configuration hors-design (SEO global, Analytics). |
| `/preview` | Prévisualisation globale | Aucune (Lecture seule) | Rend le site comme le client le verra (sans interface d'admin). |

---

## 3. Diagramme de Flux (User Flow)

```ascii
┌─────────────────────────────────────────────────────────────────────────┐
│                    STORE BUILDER - PARCOURS TYPE                        │
└─────────────────────────────────────────────────────────────────────────┘

1. INITIALISATION
   [ /themes ] ──► Choix du Thème ──► [ Sauvegardé en DB ]
                                            │
                                            ▼
2. IDENTITÉ VISUELLE                    [ /design ]
                                            │
   (Couleurs, Logo, Fonts) ◄── Modifier ────┤
                                            │
                                            ▼
3. STRUCTURE & CONTENU                  [ /pages ]
                                            │
           ┌─────────────────────── Créer / Sélectionner ──────────────────────┐
           ▼                                                                   ▼
   [ /builder/UUID_PAGE_1 ]                                          [ /builder/UUID_PAGE_2 ]
   (Accueil)                                                         (Contact / Produit)
      │                                                                   │
      ├─► Ajout Sections (Hero, Produits...)                              │
      ├─► Drag & Drop                                                     │
      └─► SAUVEGARDE (sections: [...])                                    │
                                            │
                                            ▼
4. NAVIGATION                           [ /navigation ]
                                            │
                               (Lier les pages aux menus Header/Footer)
                                            │
                                            ▼
5. PUBLICATION                          [ /preview ]
                                            │
                                     [ PUBLIER LE SITE ]
```

---

## 4. Modèle de Données (Confirmé)

Le modèle repose principalement sur deux tables Supabase :

### A. `store_configs` (Configuration Globale)
Contient tout ce qui est constant sur tout le site.
```typescript
interface StoreConfig {
  id: string; // UUID
  seller_id: string;
  theme_id: string; // Référence le thème choisi
  store_slug: string; // ex: "mon-shop"
  
  // Design System Global
  colors: { primary: string, secondary: string, ... };
  typography: { heading_font: string, body_font: string };
  layout: { border_radius: string, ... };
  
  // Assets
  logo_url: string;
  favicon_url: string;
}
```

### B. `store_pages` (Contenu des Pages)
Contient le contenu spécifique à chaque URL.
```typescript
interface StorePage {
  id: string; // UUID (C'est ce qui est dans l'URL /builder/[UUID])
  store_id: string; // Lien vers le store
  slug: string; // ex: "accueil", "contact"
  title: string;
  page_type: 'home' | 'product' | 'custom';
  
  // Le contenu est un tableau JSON de sections
  sections: [
    {
      id: "section_123",
      type: "hero",
      content: { title: "Bienvenue", image: "..." },
      settings: { padding: "large" }
    },
    {
      id: "section_456",
      type: "featured_products",
      content: { count: 8 }
    }
  ];
  
  is_published: boolean;
}
```

---

## 5. Flux de Données & État

1.  **Chargement** : Chaque page (`/design`, `/builder`) utilise un hook (`useStoreConfig`, `usePageEditor`) qui fetch les données depuis Supabase au chargement.
2.  **Modification** :
    *   **Design** : Modifie l'état local React -> Déclenche un `update` Supabase (souvent au `blur` ou via bouton, ou immédiat selon l'implémentation).
    *   **Builder** :
        *   Modifie le tableau `sections` en local.
        *   Envoie un message `postMessage` à l'iframe de preview pour mise à jour instantanée (sans rechargement).
        *   **Sauvegarde** : Auto-save (implémenté récemment) + Bouton manuel "Sauvegarder".
3.  **Preview** : Le composant `LivePreview` agit comme un pont. Il prend les données React (état courant) et les injecte dans l'iframe, permettant de voir les changements *avant* qu'ils ne soient en base de données (optimiste) ou synchronisés.

---

## 6. Réponses aux Questions Spécifiques

### Q: Que représente l'UUID dans `/builder/[UUID]` ?
**R: C'est l'ID de la Page (`store_pages.id`).**
Ce n'est **pas** l'ID du Store. Cela signifie que l'éditeur est "Page-Centric". Vous éditez une page à la fois. Pour éditer tout le site, vous naviguez de page en page via `/pages`.

### Q: Comment les données circulent ?
**R:**
*   **Supabase** est la "Single Source of Truth".
*   **React State** sert de tampon pour l'édition rapide.
*   **PostMessage** assure la synchro visuelle avec l'iframe.

### Q: Architecture Technique ?
**R:**
*   **Next.js App Router** : Chaque dossier dans `app/seller/store-builder/` est une route.
*   **Hooks** : Logique métier encapsulée dans `src/hooks/store-builder/`.
*   **Composants** : `/components/store-builder/` contient la logique UI (Sidebar, Preview, Editor).

---

## 7. Recommandations

1.  **Confirmer la suppression de page** : Ajouter une confirmation "Danger" pour éviter la suppression accidentelle de la page d'accueil. (Fait partiellement).
2.  **Navigation inter-pages dans le Builder** : Actuellement, il faut revenir à `/pages` pour changer de page à éditer. Ajouter un dropdown dans le header du Builder pour changer de page rapidement améliorerait le flux (ex: passer de "Accueil" à "Contact").
3.  **Global Sections** : Si vous modifiez le "Footer" dans le Builder d'une page, est-ce que ça se met à jour partout ?
    *   *Analyse* : Le Footer semble être dans `store_config` (Global). Il faudrait s'assurer que l'éditeur distingue bien "Section de Page" (unique) et "Section Globale" (Header/Footer).
