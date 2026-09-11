export const premiumTemplates = [
  {
    id: "beauty-glowskin",
    name: "GlowSkin (Beauté)",
    category: "beauty",
    thumbnail: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&h=225&fit=crop",
    sections: [
      { type: "hero", config: { title: "Retrouvez une peau lumineuse en 7 jours", subtitle: "Formule naturelle, résultats prouvés. Livraison gratuite en Tunisie.", buttonText: "Commander maintenant", backgroundImage: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1920", height: 600, overlay: 0.4, ctaText: "Commander maintenant", ctaLink: "/shop" } },
      { type: "features", config: { title: "Pourquoi choisir GlowSkin ?", features: [{ title: "100% Naturel", description: "Sans produits chimiques" }, { title: "Efficacité prouvée", description: "Résultats en 1 semaine" }, { title: "Garantie 30j", description: "Satisfait ou remboursé" }] } },
      { type: "products", config: { title: "Nos Best-Sellers", columns: 3, limit: 3 } },
      { type: "testimonials", config: { title: "Elles adorent GlowSkin", testimonials: [{ name: "Sonia M.", text: "Ma peau revit enfin ! Je recommande à 100%." }, { name: "Amira K.", text: "Le meilleur sérum que j'ai testé." }] } },
      { type: "faq", config: { title: "Vos Questions", faqs: [{ question: "Convient-il aux peaux sensibles ?", answer: "Oui, notre formule est testée dermatologiquement." }] } },
      { type: "footer", config: { copyright: "© 2026 GlowSkin Beauty." } }
    ],
    theme_config: {
      colors: { primary: "#ec4899", secondary: "#fdf2f8", accent: "#f9a8d4", background: "#ffffff", text: "#1f2937" },
      fonts: { heading: "Playfair Display", body: "Inter" },
      spacing: { borderRadius: "full" }
    }
  },
  {
    id: "fitness-fitburn",
    name: "FitBurn (Fitness)",
    category: "sport",
    thumbnail: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=225&fit=crop",
    sections: [
      { type: "hero", config: { title: "Perds 3 kg en 30 jours", subtitle: "L'équipement ultime pour transformer votre corps à la maison.", buttonText: "Démarrer ma transformation", backgroundImage: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1920", height: 600, overlay: 0.5, ctaText: "Démarrer", ctaLink: "/shop" } },
      { type: "stats", config: { title: "La communauté FitBurn", stats: [{ label: "Avis vérifiés", value: "1,200+" }, { label: "Clients actifs", value: "5,000+" }] } },
      { type: "products", config: { title: "Équipement Recommandé", columns: 3, limit: 3 } },
      { type: "features", config: { title: "Le Bonus FitBurn", features: [{ title: "Plan PDF Gratuit", description: "Inclus après votre achat" }, { title: "Coaching 24/7", description: "Support par nos experts" }] } },
      { type: "footer", config: { copyright: "© 2026 FitBurn Fitness." } }
    ],
    theme_config: {
      colors: { primary: "#ef4444", secondary: "#111827", accent: "#fca5a5", background: "#ffffff", text: "#111827" },
      fonts: { heading: "Inter", body: "Inter" },
      spacing: { borderRadius: "md" }
    }
  },
  {
    id: "home-cozyhome",
    name: "CozyHome (Maison)",
    category: "home",
    thumbnail: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&h=225&fit=crop",
    sections: [
      { type: "hero", config: { title: "Créez une ambiance chaleureuse", subtitle: "L'éclairage intelligent pour un intérieur unique.", buttonText: "Voir les luminaires", backgroundImage: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1920", height: 600, overlay: 0.4, ctaText: "Découvrir", ctaLink: "/shop" } },
      { type: "collections", config: { 
        title: "Parcourez nos styles", 
        columns: 3,
        items: [
          { title: "Salon", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600", link: "/shop" },
          { title: "Chambre", image: "https://images.unsplash.com/photo-1505691722218-269c6323030c?w=600", link: "/shop" },
          { title: "Cuisine", image: "https://images.unsplash.com/photo-1556911220-e152744ad497?w=600", link: "/shop" }
        ]
      } },
      { type: "products", config: { title: "Sélection du moment", columns: 4, limit: 4 } },
      { type: "features", config: { title: "Offre Exclusive", features: [{ title: "Bundle Déco", description: "2 achetés = -20% sur tout" }] } },
      { type: "footer", config: { copyright: "© 2026 CozyHome Lights." } }
    ],
    theme_config: {
      colors: { primary: "#d97706", secondary: "#fffbeb", accent: "#fbbf24", background: "#ffffff", text: "#451a03" },
      fonts: { heading: "Outfit", body: "Outfit" },
      spacing: { borderRadius: "md" }
    }
  },
  {
    id: "fashion-minimal",
    name: "Fashion Minimal",
    category: "fashion",
    thumbnail: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=225&fit=crop",
    sections: [
      { type: "hero", config: { title: "Nouvelle Collection 2026", subtitle: "L'élégance au quotidien", buttonText: "Découvrir", backgroundImage: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1920", height: 700, overlay: 0.4, ctaText: "Découvrir", ctaLink: "/shop" } },
      { type: "collections", config: { 
        title: "Nos Catégories", 
        columns: 3,
        items: [
          { title: "Femme", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600", link: "/shop" },
          { title: "Homme", image: "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=600", link: "/shop" },
          { title: "Accessoires", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600", link: "/shop" }
        ]
      } },
      { type: "products", config: { title: "Articles Tendances", columns: 4, limit: 8 } },
      { type: "testimonials", config: { title: "Ce que disent nos clients", testimonials: [{ name: "Amira", text: "Qualité exceptionnelle !" }] } },
      { type: "footer", config: { copyright: "© 2026 Fashion Minimal. Fait en Tunisie." } }
    ],
    theme_config: {
      colors: { primary: "#000000", secondary: "#ffffff" },
      fonts: { heading: "Playfair Display", body: "Inter" }
    }
  },
    {
      id: "beauty-pastel",
      name: "Beauty Pastel",
      category: "beauty",
      thumbnail: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400&h=225&fit=crop",
      sections: [
        { type: "hero", config: { title: "Révélez votre beauté", subtitle: "Produits cosmétiques naturels et bio", buttonText: "Explorer", backgroundImage: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=1920", height: 600, overlay: 0.3, ctaText: "Explorer", ctaLink: "/shop" } },
        { type: "collections", config: { 
          title: "Soin & Maquillage", 
          columns: 2,
          items: [
            { title: "Soins Visage", image: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600", link: "/shop" },
            { title: "Maquillage", image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600", link: "/shop" }
          ]
        } },
        { type: "products", config: { title: "Nos Coups de Cœur", columns: 4, limit: 8 } },
        { type: "testimonials", config: { title: "Elles adorent", testimonials: [{ name: "Sonia", text: "Ma peau revit !" }] } },
        { type: "footer", config: { copyright: "© 2026 Beauty Pastel." } }
      ],
      theme_config: {
        colors: { primary: "#ec4899", secondary: "#fdf2f8" },
        fonts: { heading: "Playfair Display", body: "Inter" }
      }
    },
    {
      id: "conversion-master",
      name: "Conversion Master (Prêt-à-Vendre)",
      category: "general",
      thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=225&fit=crop",
      sections: [
        { type: "promo_banner", config: { text: "🚀 LIVRAISON GRATUITE dès 100 DT d'achat partout en Tunisie !", backgroundColor: "#1e1b4b", textColor: "#ffffff" } },
        { type: "hero", config: { title: "Le Produit qui Change votre Quotidien", subtitle: "Découvrez notre sélection exclusive. Qualité premium garantie et livraison rapide à domicile.", backgroundImage: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1920", height: 650, overlay: 0.5, ctaText: "ACHETER MAINTENANT", ctaLink: "/shop", badge: "STOCK LIMITÉ - PLUS QUE 15 ARTICLES" } },
        { type: "trust_badges", config: { title: "Pourquoi nos clients nous choisissent", columns: 4, items: [{ icon: "Truck", title: "Livraison 48h", description: "Partout en Tunisie" }, { icon: "Shield", title: "Paiement COD", description: "Payez à la réception" }, { icon: "RefreshCw", title: "Retours Faciles", description: "Satisfait ou remboursé" }, { icon: "Headphones", title: "Support Client", description: "7j/7 par téléphone" }] } },
        { type: "products", config: { title: "Nos Offres Irrésistibles", columns: 4, limit: 4 } },
        { type: "features", config: { title: "Les Bénéfices pour Vous", layout: 'grid', columns: 3, features: [{ icon: "Zap", title: "Performance", description: "Efficacité prouvée dès la première utilisation." }, { icon: "Star", title: "Qualité", description: "Matériaux premium sélectionnés avec soin." }, { icon: "Heart", title: "Confort", description: "Conçu pour une utilisation quotidienne sans effort." }] } },
        { type: "testimonials", config: { title: "Ce que disent nos clients", testimonials: [{ name: "Amine T.", text: "Service impeccable et produit conforme à la description. Je recommande vivement !", location: "Tunis" }, { name: "Sarah B.", text: "Livraison rapide en 24h à Sousse. Très satisfaite de mon achat.", location: "Sousse" }] } },
        { type: "faq", config: { title: "Questions Fréquentes", faqs: [{ question: "Comment se passe le paiement ?", answer: "Vous payez en espèces directement au livreur une fois que vous avez reçu votre colis." }, { question: "Quels sont les délais ?", answer: "Nous expédions vos commandes sous 24h. La livraison prend 1 à 2 jours ouvrables." }] } },
        { type: "newsletter", config: { title: "Rejoignez nos 5000+ clients", subtitle: "Recevez nos offres exclusives et codes promo par email.", backgroundColor: "#4f46e5" } },
        { type: "footer", config: { brandName: "MA BOUTIQUE PRO", description: "Votre partenaire confiance pour vos achats en ligne en Tunisie.", copyright: "© 2026 Ma Boutique Pro. Tous droits réservés." } }
      ],
      theme_config: {
        colors: { primary: "#4f46e5", secondary: "#f5f3ff", accent: "#f59e0b", background: "#ffffff", text: "#111827" },
        fonts: { heading: "Inter", body: "Inter" },
        spacing: { borderRadius: "md" }
      }
    }
  ];

