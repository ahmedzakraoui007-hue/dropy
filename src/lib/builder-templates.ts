export interface BuilderTemplate {
  id: string;
  name: string;
  description: string;
  category: "Fashion" | "Tech" | "Beauty" | "Food" | "Business" | "Creative" | "Health";
  thumbnail: string;
  sections: any[];
  theme_config?: any;
}

export const BUILDER_TEMPLATES: BuilderTemplate[] = [
  {
    id: "fashion-luxe",
    name: "Fashion Luxe",
    description: "Un template élégant pour les boutiques de mode haut de gamme.",
    category: "Fashion",
    thumbnail: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80",
    sections: [
      { type: "hero", config: { title: "Nouvelle Collection Été", subtitle: "L'élégance à la tunisienne", backgroundImage: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1920", height: 700, overlay: 0.4, ctaText: "Découvrir", ctaLink: "/shop" } },
      { type: "products", config: { title: "Nos Best-Sellers", columns: 3, limit: 6 } },
      { type: "features", config: { title: "Pourquoi nous choisir ?", features: [{ title: "Qualité Premium", description: "Matières nobles" }, { title: "Livraison Express", description: "24h/48h" }] } },
      { type: "testimonials", config: { title: "Ils nous font confiance", testimonials: [{ name: "Sonia", text: "Parfait !" }] } },
      { type: "footer", config: { brandName: "Luxe Fashion" } }
    ],
    theme_config: {
      colors: { primary: "#000000", secondary: "#ffffff", accent: "#d4af37" },
      typography: { fontHeading: "Playfair Display", scale: 105 }
    }
  },
  {
    id: "tech-minimal",
    name: "Tech Minimal",
    description: "Design épuré et futuriste pour les produits technologiques.",
    category: "Tech",
    thumbnail: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80",
    sections: [
      { type: "hero", config: { title: "Innovez votre Quotidien", subtitle: "Technologie de pointe", backgroundImage: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1920", height: 600, overlay: 0.5, ctaText: "Acheter", ctaLink: "/shop" } },
      { type: "collections", config: { 
        title: "Nos Catégories", 
        columns: 3,
        items: [
          { title: "Smartphones", image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600", link: "/shop" },
          { title: "Audio", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600", link: "/shop" },
          { title: "Gadgets", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600", link: "/shop" }
        ]
      } },
      { type: "products", config: { title: "Derniers Gadgets", columns: 4, limit: 8 } },
      { type: "footer", config: { brandName: "NextTech" } }
    ],
    theme_config: {
      colors: { primary: "#0066ff", secondary: "#000000", accent: "#00f2ff" },
      typography: { fontHeading: "Space Grotesk", scale: 100 }
    }
  },
  {
    id: "beauty-glow",
    name: "Beauty Glow",
    description: "Doux et raffiné pour les cosmétiques et soins.",
    category: "Beauty",
    thumbnail: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80",
    sections: [
      { type: "hero", config: { title: "Révélez votre Éclat", subtitle: "Soins naturels & Bio", backgroundImage: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=1920", height: 600, overlay: 0.3, ctaText: "Explorer", ctaLink: "/shop" } },
      { type: "features", config: { title: "Nos Ingrédients", features: [{ title: "Bio", description: "Certifié" }] } },
      { type: "products", config: { title: "Collection Beauté", columns: 3, limit: 6 } },
      { type: "footer", config: { brandName: "Beauty Glow" } }
    ],
    theme_config: {
      colors: { primary: "#ff85a1", secondary: "#fff0f3", accent: "#ffb3c1" },
      typography: { fontHeading: "Inter", scale: 100 }
    }
  },
  {
    id: "gourmet-tunisie",
    name: "Gourmet Tunisie",
    description: "Chaleureux pour les produits du terroir et la gastronomie.",
    category: "Food",
    thumbnail: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
    sections: [
      { type: "hero", config: { title: "Saveurs de nos Régions", subtitle: "Le meilleur du terroir", backgroundImage: "https://images.unsplash.com/photo-1476224488681-aba355370021?w=1920", height: 600, overlay: 0.4, ctaText: "Commander", ctaLink: "/shop" } },
      { type: "collections", config: { 
        title: "Nos Spécialités", 
        columns: 2,
        items: [
          { title: "Huile d'Olive", image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600", link: "/shop" },
          { title: "Épices", image: "https://images.unsplash.com/photo-1506484334402-40ff22e05639?w=600", link: "/shop" }
        ]
      } },
      { type: "products", config: { title: "Sélection du Chef", columns: 3, limit: 6 } },
      { type: "footer", config: { brandName: "Gourmet TN" } }
    ],
    theme_config: {
      colors: { primary: "#8b4513", secondary: "#fff8dc", accent: "#cd853f" },
      typography: { fontHeading: "Playfair Display", scale: 105 }
    }
    },
    {
      id: "conversion-master",
      name: "Conversion Master (Recommandé)",
      description: "Le template ultime optimisé pour le marché tunisien. Inclus badges de confiance, FAQ et tunnel optimisé.",
      category: "Business",
      thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
      sections: [
        { type: "promo_banner", config: { text: "🚚 Livraison Gratuite dès 100 DT | Paiement à la livraison", backgroundColor: "#7c3aed" } },
        { type: "hero", config: { 
          title: "Vendez Plus, Plus Vite", 
          subtitle: "La boutique prête-à-l'emploi pour les entrepreneurs tunisiens ambitieux.", 
          backgroundImage: "https://images.unsplash.com/photo-1556742044-3c52d6e88c62?w=1920",
          badge: "ÉDITION LIMITÉE 2026",
          ctaText: "Voir les Produits",
          ctaLink: "/shop"
        } },
        { type: "trust_badges", config: { 
          layout: 'row',
          items: [
            { icon: "Truck", title: "Livraison 24/48h", description: "Expédition nationale" },
            { icon: "Shield", title: "Paiement COD", description: "Payez à la réception" },
            { icon: "RefreshCw", title: "Échange Facile", description: "Sous 14 jours" }
          ]
        } },
        { type: "products", config: { title: "Coups de Cœur de la Semaine", columns: 4, limit: 4 } },
        { type: "features", config: { 
          title: "Pourquoi nous choisir ?", 
          columns: 3,
          features: [
            { title: "Service Client Local", description: "Basé à Tunis, disponible 7j/7" },
            { title: "Qualité Garantie", description: "Produits vérifiés par nos experts" },
            { title: "Paiement Sécurisé", description: "Transaction cash à la livraison" }
          ]
        } },
        { type: "testimonials", config: { title: "Avis de nos Clients", testimonials: [
          { name: "Amine", location: "Tunis", text: "Meilleur service client !", rating: 5, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100" },
          { name: "Sonia", location: "Sousse", text: "Livraison super rapide.", rating: 5, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" }
        ] } },
        { type: "faq", config: { title: "Questions Fréquentes", faqs: [
          { question: "Comment se passe la livraison ?", answer: "Nous livrons par Aramex ou First Delivery sous 24h à 48h." },
          { question: "Puis-je payer par carte ?", answer: "Pour le moment, nous privilégions le paiement en espèces à la livraison." }
        ] } },
        { type: "footer", config: { brandName: "DROPY STORE", address: "Lac 2, Tunis" } }
      ],
      theme_config: {
        colors: { primary: "#7c3aed", secondary: "#4f46e5", accent: "#06b6d4" },
        typography: { fontHeading: "Montserrat", scale: 100 },
        spacing: { borderRadius: "md" }
      }
    }
  ];

