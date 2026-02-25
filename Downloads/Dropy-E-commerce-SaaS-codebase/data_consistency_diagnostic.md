# Prompt Antigravity : Implémentation des Corrections - CSS Variables Store Builder

---

## CONTEXTE

Le diagnostic a identifié le problème :
- `/design` sauvegarde les couleurs dans `store_configs.colors`
- `/builder` et `SectionRenderer` n'utilisent PAS ces couleurs
- Les composants ont des couleurs hardcodées

## MISSION

Implémenter le système de Variables CSS Globales pour connecter `/design` avec `/builder` et tous les composants.

---

## ÉTAPE 1 : Injection des Variables CSS dans LivePreview

### Fichier à modifier : `components/store-builder/LivePreview.tsx` (ou similaire)

Ajoute une fonction qui injecte les variables CSS depuis `store_configs` :

```typescript
// Fonction pour générer les CSS Variables depuis la config
function generateCSSVariables(config: StoreConfig): string {
  return `
    :root {
      /* Couleurs */
      --primary-color: ${config.colors?.primary || '#00B4A2'};
      --secondary-color: ${config.colors?.secondary || '#1a1a4e'};
      --accent-color: ${config.colors?.accent || '#14a3a8'};
      --background-color: ${config.colors?.background || '#ffffff'};
      --surface-color: ${config.colors?.surface || '#f5f5f5'};
      --text-color: ${config.colors?.text || '#333333'};
      --text-muted-color: ${config.colors?.textMuted || '#666666'};
      --border-color: ${config.colors?.border || '#e0e0e0'};
      --error-color: ${config.colors?.error || '#ef4444'};
      --success-color: ${config.colors?.success || '#22c55e'};
      
      /* Typography */
      --font-heading: ${config.typography?.headingFont || "'Playfair Display', serif"};
      --font-body: ${config.typography?.bodyFont || "'DM Sans', sans-serif"};
      --font-size-base: ${config.typography?.baseFontSize || '16px'};
      
      /* Spacing & Layout */
      --border-radius: ${config.layout?.borderRadius || '8px'};
      --border-radius-lg: ${config.layout?.borderRadiusLg || '16px'};
      --container-max-width: ${config.layout?.containerMaxWidth || '1200px'};
      
      /* Shadows */
      --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
      --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
      --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
    }
  `;
}
```

### Injecter dans l'iframe ou le composant de preview :

```typescript
// Dans le composant LivePreview
useEffect(() => {
  if (iframeRef.current && config) {
    const cssVariables = generateCSSVariables(config);
    
    // Option A : Via postMessage
    iframeRef.current.contentWindow?.postMessage({
      type: 'UPDATE_CSS_VARIABLES',
      payload: cssVariables
    }, '*');
    
    // Option B : Injection directe dans le head de l'iframe
    const iframeDoc = iframeRef.current.contentDocument;
    if (iframeDoc) {
      let styleEl = iframeDoc.getElementById('dropy-css-variables');
      if (!styleEl) {
        styleEl = iframeDoc.createElement('style');
        styleEl.id = 'dropy-css-variables';
        iframeDoc.head.appendChild(styleEl);
      }
      styleEl.textContent = cssVariables;
    }
  }
}, [config]);
```

---

## ÉTAPE 2 : Configurer Tailwind pour utiliser les CSS Variables

### Fichier à modifier : `tailwind.config.js` ou `tailwind.config.ts`

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        // Couleurs dynamiques via CSS Variables
        primary: 'var(--primary-color)',
        secondary: 'var(--secondary-color)',
        accent: 'var(--accent-color)',
        background: 'var(--background-color)',
        surface: 'var(--surface-color)',
        'text-primary': 'var(--text-color)',
        'text-muted': 'var(--text-muted-color)',
        border: 'var(--border-color)',
        error: 'var(--error-color)',
        success: 'var(--success-color)',
      },
      fontFamily: {
        heading: 'var(--font-heading)',
        body: 'var(--font-body)',
      },
      borderRadius: {
        DEFAULT: 'var(--border-radius)',
        lg: 'var(--border-radius-lg)',
      },
      maxWidth: {
        container: 'var(--container-max-width)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      }
    },
  },
}
```

---

## ÉTAPE 3 : Refactorer les Composants de Section

### Exemple : HeroBanner.tsx

```typescript
// AVANT ❌
export function HeroBanner({ content, styles }: HeroBannerProps) {
  return (
    <section 
      className="py-20"
      style={{ backgroundColor: styles?.backgroundColor || '#7C3AED' }}
    >
      <h1 style={{ color: '#ffffff' }}>{content.title}</h1>
      <button style={{ backgroundColor: '#000000' }}>
        {content.ctaText}
      </button>
    </section>
  );
}

// APRÈS ✅
export function HeroBanner({ content, styles }: HeroBannerProps) {
  return (
    <section className="py-20 bg-primary">
      <h1 className="text-white font-heading">{content.title}</h1>
      <button className="bg-secondary text-white px-6 py-3 rounded hover:opacity-90">
        {content.ctaText}
      </button>
    </section>
  );
}
```

### Exemple : FeaturedProducts.tsx

```typescript
// AVANT ❌
export function FeaturedProducts({ products }: Props) {
  return (
    <section style={{ backgroundColor: '#f5f5f5' }}>
      <h2 style={{ color: '#333' }}>Nos Produits</h2>
      {products.map(product => (
        <div style={{ border: '1px solid #e0e0e0' }}>
          <span style={{ color: '#7C3AED' }}>{product.price} TND</span>
        </div>
      ))}
    </section>
  );
}

// APRÈS ✅
export function FeaturedProducts({ products }: Props) {
  return (
    <section className="bg-surface py-16">
      <h2 className="text-text-primary font-heading text-3xl">Nos Produits</h2>
      {products.map(product => (
        <div className="border border-border rounded bg-background">
          <span className="text-primary font-bold">{product.price} TND</span>
        </div>
      ))}
    </section>
  );
}
```

### Liste des composants à refactorer :

1. `HeroBanner.tsx`
2. `FeaturedProducts.tsx`
3. `ProductGrid.tsx`
4. `CategoryList.tsx`
5. `Newsletter.tsx`
6. `Footer.tsx`
7. `Header.tsx`
8. `Testimonials.tsx`
9. `ContactForm.tsx`
10. `AboutSection.tsx`
11. Tout composant dans `/components/store-builder/sections/`

### Pattern de refactoring :

| Avant (Hardcodé) | Après (CSS Variable) |
|------------------|---------------------|
| `style={{ backgroundColor: '#7C3AED' }}` | `className="bg-primary"` |
| `style={{ color: '#333' }}` | `className="text-text-primary"` |
| `style={{ borderColor: '#e0e0e0' }}` | `className="border-border"` |
| `style={{ fontFamily: 'Arial' }}` | `className="font-body"` |
| `bg-purple-600` | `bg-primary` |
| `text-gray-800` | `text-text-primary` |
| `border-gray-200` | `border-border` |

---

## ÉTAPE 4 : Nettoyer useThemes.ts

### Fichier : `hooks/store-builder/useThemes.ts`

Quand un thème est appliqué, NE PAS hardcoder les couleurs dans les sections :

```typescript
// AVANT ❌ (Ligne ~87)
const defaultSections = [
  {
    id: generateId(),
    type: 'hero',
    content: { title: 'Bienvenue' },
    styles: {
      backgroundColor: theme.colors.primary,  // ❌ Hardcodé !
      textColor: '#ffffff'
    }
  }
];

// APRÈS ✅
const defaultSections = [
  {
    id: generateId(),
    type: 'hero',
    content: { title: 'Bienvenue' },
    styles: {}  // ✅ Vide ! Les CSS Variables gèrent les couleurs
  }
];
```

### Si des styles custom sont nécessaires (override utilisateur) :

```typescript
// Permettre à l'utilisateur de surcharger UNE section spécifique
// Mais par défaut, laisser vide pour utiliser les CSS Variables
styles: {
  // Seulement si l'utilisateur a explicitement choisi une couleur différente
  ...(userOverrides?.backgroundColor && { 
    backgroundColor: userOverrides.backgroundColor 
  })
}
```

---

## ÉTAPE 5 : Ajouter les CSS Variables dans le Layout de Preview Public

### Fichier : `app/preview/[storeSlug]/layout.tsx` ou `page.tsx`

```typescript
export default async function PreviewLayout({ params, children }) {
  // Fetch store config
  const config = await getStoreConfig(params.storeSlug);
  
  const cssVariables = generateCSSVariables(config);
  
  return (
    <html>
      <head>
        <style dangerouslySetInnerHTML={{ __html: cssVariables }} />
      </head>
      <body className="font-body bg-background text-text-primary">
        {children}
      </body>
    </html>
  );
}
```

---

## ÉTAPE 6 : Créer un Hook/Context pour les CSS Variables

### Fichier : `contexts/StoreThemeContext.tsx`

```typescript
'use client';

import { createContext, useContext, useEffect } from 'react';
import { StoreConfig } from '@/types';

interface StoreThemeContextValue {
  config: StoreConfig | null;
  cssVariables: string;
}

const StoreThemeContext = createContext<StoreThemeContextValue | null>(null);

export function StoreThemeProvider({ 
  config, 
  children 
}: { 
  config: StoreConfig; 
  children: React.ReactNode 
}) {
  const cssVariables = generateCSSVariables(config);
  
  // Injecter les variables CSS dans le document
  useEffect(() => {
    const styleId = 'dropy-theme-variables';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement;
    
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    
    styleEl.textContent = cssVariables;
    
    return () => {
      styleEl?.remove();
    };
  }, [cssVariables]);
  
  return (
    <StoreThemeContext.Provider value={{ config, cssVariables }}>
      {children}
    </StoreThemeContext.Provider>
  );
}

export const useStoreTheme = () => {
  const context = useContext(StoreThemeContext);
  if (!context) {
    throw new Error('useStoreTheme must be used within StoreThemeProvider');
  }
  return context;
};
```

---

## CHECKLIST DE VALIDATION

Après implémentation, teste ces scénarios :

### Test 1 : Changement de couleur primaire
- [ ] Va dans `/design`
- [ ] Change la couleur primaire de bleu à rouge
- [ ] Va dans `/builder`
- [ ] ✅ Les boutons et éléments primaires sont maintenant rouges

### Test 2 : Changement de thème
- [ ] Va dans `/themes`
- [ ] Applique un nouveau thème
- [ ] ✅ Les pages existantes adoptent les nouvelles couleurs (pas les anciennes hardcodées)

### Test 3 : Preview synchronisée
- [ ] Modifie une couleur dans `/design`
- [ ] Va dans `/preview`
- [ ] ✅ La preview publique montre les nouvelles couleurs

### Test 4 : Nouvelle section
- [ ] Dans `/builder`, ajoute une nouvelle section (Hero, Products, etc.)
- [ ] ✅ La section utilise automatiquement les couleurs de `/design`
- [ ] ❌ La section n'a PAS de couleurs hardcodées

---

## ORDRE D'IMPLÉMENTATION

```
1. generateCSSVariables() function
   ↓
2. tailwind.config.js (ajouter les couleurs)
   ↓
3. StoreThemeContext.tsx (créer le context)
   ↓
4. LivePreview.tsx (injecter les variables)
   ↓
5. PreviewLayout.tsx (injecter côté serveur)
   ↓
6. Refactorer les composants (un par un)
   ↓
7. Nettoyer useThemes.ts
   ↓
8. Tester tous les scénarios
```

---

## RÉSULTAT FINAL ATTENDU

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FLUX DE DONNÉES CORRIGÉ                              │
└─────────────────────────────────────────────────────────────────────────┘

/design                          
    │ Sauvegarde
    ▼
store_configs.colors = { primary: "#FF0000", ... }
    │
    ▼
StoreThemeProvider / LivePreview
    │ Génère
    ▼
:root {
  --primary-color: #FF0000;
  --secondary-color: ...
}
    │
    ▼
Tous les composants (HeroBanner, FeaturedProducts, etc.)
    │ Utilisent
    ▼
className="bg-primary" → background-color: var(--primary-color) → #FF0000

✅ COHÉRENCE TOTALE !
```

---

Commence par l'Étape 1 et montre-moi le code modifié. On valide étape par étape.