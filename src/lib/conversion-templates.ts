// High-Conversion Templates Library for Dropy Website Builder
// 46 Templates across 8 categories optimized for Tunisian e-commerce

export interface TemplateVariant {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  config: Record<string, any>;
  conversionTips?: string[];
}

export interface TemplateCategory {
  id: string;
  name: string;
  icon: string;
  templates: TemplateVariant[];
}

// ============================================
// HERO SECTION TEMPLATES (10 variants)
// ============================================

export const HERO_TEMPLATES: TemplateVariant[] = [
  {
    id: 'hero_bold_statement',
    name: 'The Bold Statement',
    description: 'Grande déclaration avec badge, texte gradient et double CTA',
    thumbnail: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80',
    config: {
      variant: 'bold_statement',
      badge: "🔥 Livraison GRATUITE dès 99 TND",
      tagline: "Nouvelle Collection 2025",
      title: "TRANSFORMEZ\nVOTRE STYLE",
      highlightedWord: "STYLE",
      subtitle: "Découvrez notre collection exclusive de prêt-à-porter tunisien.",
      ctaText: "DÉCOUVRIR →",
      ctaLink: "/shop",
      secondaryCtaText: "-30% SOLDES",
      secondaryCtaLink: "/soldes",
      socialProof: "⭐⭐⭐⭐⭐ Plus de 2,000 clients satisfaits",
      backgroundImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=80",
      height: "100vh",
      overlay: 0.4,
      textPosition: "center",
      textColor: "#ffffff",
      animation: "fade-up",
      floatingBadges: [
        { text: "Nouveau", position: "top-right", color: "#10b981" },
        { text: "-30%", position: "bottom-left", color: "#ef4444" }
      ]
    },
    conversionTips: [
      "Le badge d'annonce augmente le CTR de 23%",
      "Le social proof en bas rassure les visiteurs"
    ]
  },
  {
    id: 'hero_split_screen',
    name: 'Split Screen',
    description: 'Layout 50/50 avec contenu et image produit',
    thumbnail: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80',
    config: {
      variant: 'split_screen',
      title: "COLLECTION\nPRINTEMPS\n2025",
      subtitle: "Des pièces uniques pour votre garde-robe",
      ctaText: "SHOP NOW →",
      ctaLink: "/shop",
      trustBadges: [
        { icon: "Truck", text: "Livraison 24-48h" },
        { icon: "RefreshCw", text: "Retours gratuits" }
      ],
      image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80",
      priceLabel: "À partir de",
      price: "49 TND",
      imagePosition: "right",
      backgroundColor: "#fafafa",
      textColor: "#0f172a",
      animation: "slide-in",
      parallax: true
    }
  },
  {
    id: 'hero_product_carousel',
    name: 'Product Showcase Carousel',
    description: 'Carousel de best-sellers avec quick-add',
    thumbnail: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&q=80',
    config: {
      variant: 'product_carousel',
      title: "NOS BEST-SELLERS",
      showNavigation: true,
      autoScroll: true,
      autoScrollInterval: 4000,
      products: [
        { name: "Robe Élégante", price: "89 TND", rating: 5, image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400" },
        { name: "Blazer Premium", price: "129 TND", rating: 4, image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400" },
        { name: "Pantalon Chic", price: "79 TND", rating: 5, image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400" },
        { name: "Top Tendance", price: "49 TND", rating: 5, image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400" }
      ],
      showQuickAdd: true,
      backgroundColor: "#ffffff",
      paddingY: 100,
      animation: "fade-in"
    }
  },
  {
    id: 'hero_countdown_urgency',
    name: 'Countdown Urgency',
    description: 'Vente flash avec compte à rebours',
    thumbnail: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80',
    config: {
      variant: 'countdown',
      badge: "⚡ VENTE FLASH - SE TERMINE DANS:",
      countdownEndDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      title: "JUSQU'À -50%",
      subtitle: "SUR TOUTE LA COLLECTION",
      ctaText: "J'EN PROFITE →",
      ctaLink: "/soldes",
      backgroundGradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      textColor: "#ffffff",
      pulsingCta: true,
      scrollingProducts: true,
      products: [
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200",
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200",
        "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=200"
      ],
      animation: "fade-up",
      paddingY: 120
    }
  },
  {
    id: 'hero_video_background',
    name: 'Video Background',
    description: 'Vidéo en arrière-plan avec overlay glassmorphism',
    thumbnail: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&q=80',
    config: {
      variant: 'video_background',
      videoUrl: "https://videos.pexels.com/video-files/3571264/3571264-uhd_2560_1440_30fps.mp4",
      fallbackImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920",
      title: "DÉCOUVREZ\nL'ÉLÉGANCE\nTUNISIENNE",
      ctaText: "EXPLORER →",
      ctaLink: "/shop",
      glassMorphism: true,
      showSoundToggle: true,
      showScrollIndicator: true,
      overlay: 0.5,
      textColor: "#ffffff",
      height: "100vh",
      animation: "fade-in"
    }
  },
  {
    id: 'hero_instagram_grid',
    name: 'Instagram Style Grid',
    description: 'Grille asymétrique style Instagram avec hotspots',
    thumbnail: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&q=80',
    config: {
      variant: 'instagram_grid',
      images: [
        { src: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600", size: "large", products: [{ name: "Robe", price: "89 TND", x: 30, y: 40 }] },
        { src: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400", size: "small" },
        { src: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400", size: "small" },
        { src: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400", size: "small" },
        { src: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400", size: "small" }
      ],
      instagramHandle: "@votreboutique",
      ctaText: "Suivez-nous sur Instagram",
      showHotspots: true,
      paddingY: 80,
      animation: "fade-up"
    }
  },
  {
    id: 'hero_minimalist_luxury',
    name: 'Minimalist Luxury',
    description: 'Design épuré haute-couture avec typographie serif',
    thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    config: {
      variant: 'minimalist',
      singleWord: "ÉTERNEL.",
      ctaText: "DÉCOUVRIR",
      ctaLink: "/shop",
      ctaStyle: "outlined",
      fontFamily: "Playfair Display",
      backgroundColor: "#fefefe",
      textColor: "#1a1a1a",
      productImage: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
      minimalAnimations: true,
      height: "100vh",
      paddingY: 0
    }
  },
  {
    id: 'hero_category_boxes',
    name: 'Category Boxes',
    description: 'Boîtes de catégories avec compteur d\'articles',
    thumbnail: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&q=80',
    config: {
      variant: 'category_boxes',
      title: "EXPLOREZ NOS COLLECTIONS",
      categories: [
        { name: "FEMME", articleCount: 152, image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600", link: "/femme" },
        { name: "HOMME", articleCount: 98, image: "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=600", link: "/homme" },
        { name: "ENFANT", articleCount: 64, image: "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=600", link: "/enfant" }
      ],
      columns: 3,
      hoverEffect: "zoom-overlay",
      showArticleCount: true,
      backgroundColor: "#ffffff",
      paddingY: 100,
      animation: "fade-up"
    }
  },
  {
    id: 'hero_promo_stack',
    name: 'Promotional Banner Stack',
    description: 'Pile de bannières promotionnelles avec code promo',
    thumbnail: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80',
    config: {
      variant: 'promo_stack',
      announcementBar: "🚚 Livraison gratuite dès 99 TND",
      mainPromo: {
        title: "OFFRE SPÉCIALE",
        subtitle: "Achetez 2, le 3ème OFFERT",
        code: "DROPY3",
        image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600"
      },
      secondaryPromos: [
        { title: "-20% NOUVEAUTÉS", image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400", link: "/nouveautes" },
        { title: "DESTOCKAGE -50%", image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400", link: "/destockage" }
      ],
      showCopyButton: true,
      backgroundColor: "#f8fafc",
      paddingY: 80,
      animation: "fade-up"
    }
  },
  {
    id: 'hero_storytelling',
    name: 'Storytelling Scroll',
    description: 'Narration immersive avec animations au scroll',
    thumbnail: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80',
    config: {
      variant: 'storytelling',
      sections: [
        { text: "NOTRE HISTOIRE", type: "heading" },
        { text: "Née en Tunisie,", type: "line" },
        { text: "inspirée par le monde.", type: "line" },
        { text: "Depuis 2020, nous créons", type: "line" },
        { text: "des pièces qui vous ressemblent.", type: "line" }
      ],
      backgroundImages: [
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1920",
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920"
      ],
      ctaText: "NOTRE HISTOIRE →",
      ctaLink: "/about",
      parallaxEffect: true,
      scrollIndicator: "↓ Scroll pour découvrir",
      height: "200vh",
      animation: "scroll-reveal"
    }
  }
];

// ============================================
// PRODUCT GRID TEMPLATES (8 variants)
// ============================================

export const PRODUCT_GRID_TEMPLATES: TemplateVariant[] = [
  {
    id: 'grid_classic_filters',
    name: 'Classic Grid with Filters',
    description: 'Grille 4 colonnes avec filtres et tri',
    thumbnail: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&q=80',
    config: {
      variant: 'classic_grid',
      title: "NOUVEAUTÉS",
      showFilters: true,
      showSort: true,
      columns: 4,
      mobileColumns: 2,
      productsPerPage: 12,
      loadMoreType: "button",
      showWishlist: true,
      showQuickView: true,
      badges: ["NEW", "SALE", "BESTSELLER"],
      cardStyle: {
        showRating: true,
        showAddToCart: true,
        hoverSecondImage: true,
        priceStyle: "strikethrough"
      },
      filters: ["category", "price", "size", "color"],
      sortOptions: ["newest", "price-asc", "price-desc", "popular"],
      paddingY: 80,
      animation: "fade-up"
    }
  },
  {
    id: 'grid_featured_combo',
    name: 'Featured + Grid Combo',
    description: 'Produit vedette large avec grille 2x2',
    thumbnail: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&q=80',
    config: {
      variant: 'featured_combo',
      featuredProduct: {
        title: "Robe Signature",
        price: "129 TND",
        rating: 5,
        reviews: 128,
        image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800",
        ctaText: "AJOUTER AU PANIER"
      },
      sideProducts: [
        { title: "Top Élégant", price: "79 TND", image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400" },
        { title: "Pantalon Chic", price: "89 TND", image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400" },
        { title: "Blazer Pro", price: "149 TND", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400" },
        { title: "Jupe Midi", price: "69 TND", image: "https://images.unsplash.com/photo-1583496661160-fb5886a0uj1?w=400" }
      ],
      autoRotateFeatured: true,
      rotateInterval: 5000,
      paddingY: 80,
      animation: "fade-in"
    }
  },
  {
    id: 'grid_masonry',
    name: 'Masonry Style',
    description: 'Layout Pinterest avec hauteurs variables',
    thumbnail: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&q=80',
    config: {
      variant: 'masonry',
      columns: 3,
      gutter: 16,
      products: [
        { title: "Look Complet", price: "199 TND", image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=600", height: "tall" },
        { title: "Accessoire", price: "39 TND", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300", height: "short" },
        { title: "Ensemble", price: "159 TND", image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=450", height: "medium" }
      ],
      showOverlayOnHover: true,
      paddingY: 60,
      animation: "masonry-reveal"
    }
  },
  {
    id: 'grid_quick_shop',
    name: 'Quick Shop Hover',
    description: 'Sélection taille et ajout panier au survol',
    thumbnail: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&q=80',
    config: {
      variant: 'quick_shop',
      columns: 4,
      hoverContent: {
        showSizes: true,
        sizes: ["XS", "S", "M", "L", "XL"],
        showAddToCart: true,
        showSecondImage: true
      },
      cardAnimation: "lift",
      quickAddAnimation: "slide-up",
      paddingY: 80,
      animation: "fade-up"
    }
  },
  {
    id: 'grid_category_tabs',
    name: 'Category Tabs',
    description: 'Filtrage par onglets sans rechargement',
    thumbnail: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&q=80',
    config: {
      variant: 'category_tabs',
      tabs: [
        { id: "all", label: "TOUS", active: true },
        { id: "new", label: "NOUVEAUTÉS" },
        { id: "bestseller", label: "BEST-SELLERS" },
        { id: "promo", label: "PROMOS" }
      ],
      tabStyle: "underline",
      columns: 4,
      transitionAnimation: "fade",
      paddingY: 80
    }
  },
  {
    id: 'grid_scrolling_row',
    name: 'Scrolling Row',
    description: 'Carousel horizontal avec peek',
    thumbnail: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&q=80',
    config: {
      variant: 'scrolling_row',
      title: "TENDANCES DU MOMENT",
      viewAllLink: "/shop",
      viewAllText: "VOIR TOUT →",
      scrollType: "drag",
      showArrows: true,
      showDots: true,
      peekAmount: 60,
      cardWidth: 280,
      gap: 20,
      paddingY: 80,
      animation: "fade-in"
    }
  },
  {
    id: 'grid_shop_look',
    name: 'Bundle/Look Grid',
    description: 'Shop the Look avec hotspots cliquables',
    thumbnail: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80',
    config: {
      variant: 'shop_look',
      title: "SHOP THE LOOK",
      lookImage: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800",
      hotspots: [
        { x: 30, y: 25, product: { name: "T-shirt", price: "49 TND", image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=200" } },
        { x: 50, y: 60, product: { name: "Pantalon", price: "89 TND", image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=200" } }
      ],
      showBundleDiscount: true,
      bundleDiscountPercent: 15,
      buyAllCtaText: "ACHETER LE LOOK",
      paddingY: 100,
      animation: "fade-up"
    }
  },
  {
    id: 'grid_recommendations',
    name: 'Recently Viewed / Recommendations',
    description: 'Produits vus récemment et suggestions IA',
    thumbnail: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&q=80',
    config: {
      variant: 'recommendations',
      sections: [
        {
          title: "👀 VUS RÉCEMMENT",
          type: "recently_viewed",
          columns: 4,
          maxItems: 4
        },
        {
          title: "💡 VOUS AIMEREZ AUSSI",
          type: "ai_recommendations",
          columns: 4,
          maxItems: 4
        }
      ],
      cardStyle: "compact",
      showDivider: true,
      paddingY: 60,
      animation: "fade-up"
    }
  }
];

// ============================================
// SOCIAL PROOF TEMPLATES (6 variants)
// ============================================

export const SOCIAL_PROOF_TEMPLATES: TemplateVariant[] = [
  {
    id: 'proof_reviews_carousel',
    name: 'Customer Reviews Carousel',
    description: 'Carousel de témoignages avec photos et badges',
    thumbnail: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=800&q=80',
    config: {
      variant: 'reviews_carousel',
      title: "CE QUE NOS CLIENTS DISENT",
      overallRating: 4.9,
      totalReviews: 1247,
      reviews: [
        {
          text: "Qualité exceptionnelle ! Le tissu est vraiment premium et la coupe parfaite. Je recommande à 100% !",
          rating: 5,
          author: "Sarah M.",
          location: "Tunis",
          avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
          product: "Robe Élégante Noir",
          verified: true,
          date: "Il y a 2 jours"
        },
        {
          text: "Livraison ultra rapide et service client au top. Ma boutique préférée en Tunisie !",
          rating: 5,
          author: "Mohamed K.",
          location: "Sousse",
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100",
          product: "Blazer Premium",
          verified: true,
          date: "Il y a 5 jours"
        },
        {
          text: "Les prix sont imbattables pour cette qualité. J'ai déjà commandé 3 fois !",
          rating: 5,
          author: "Leila B.",
          location: "Sfax",
          avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100",
          product: "Ensemble Complet",
          verified: true,
          date: "Il y a 1 semaine"
        }
      ],
      autoRotate: true,
      rotateInterval: 5000,
      showVerifiedBadge: true,
      showProductPurchased: true,
      ctaText: "VOIR TOUS LES AVIS",
      ctaLink: "/reviews",
      paddingY: 100,
      animation: "fade-up"
    }
  },
  {
    id: 'proof_stats_counter',
    name: 'Stats Counter',
    description: 'Compteurs animés de statistiques clés',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
    config: {
      variant: 'stats_counter',
      stats: [
        { value: 15000, suffix: "+", label: "Clients satisfaits", icon: "Users" },
        { value: 4.9, suffix: "/5", label: "Note moyenne", icon: "Star" },
        { value: 98, suffix: "%", label: "Clients satisfaits", icon: "ThumbsUp" }
      ],
      countUpDuration: 2000,
      triggerOnView: true,
      backgroundColor: "#0f172a",
      textColor: "#ffffff",
      accentColor: "#8b5cf6",
      layout: "horizontal",
      paddingY: 80,
      animation: "counter"
    }
  },
  {
    id: 'proof_instagram_feed',
    name: 'Instagram Feed',
    description: 'Feed Instagram intégré avec hover',
    thumbnail: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=800&q=80',
    config: {
      variant: 'instagram_feed',
      title: "📸 @VOTREBOUTIQUE SUR INSTAGRAM",
      instagramHandle: "@votreboutique",
      images: [
        { src: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400", likes: 234, caption: "Nouvelle collection..." },
        { src: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400", likes: 189, caption: "Style du jour..." },
        { src: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400", likes: 456, caption: "Best-seller..." },
        { src: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400", likes: 321, caption: "Look complet..." },
        { src: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400", likes: 278, caption: "Tendance..." },
        { src: "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400", likes: 198, caption: "Exclusif..." }
      ],
      columns: 6,
      showLikesOnHover: true,
      showCaptionOnHover: true,
      ctaText: "SUIVEZ-NOUS @boutique",
      ctaLink: "https://instagram.com/boutique",
      paddingY: 80,
      animation: "fade-in"
    }
  },
  {
    id: 'proof_trust_badges',
    name: 'Trust Badges Bar',
    description: 'Barre de réassurance avec icônes',
    thumbnail: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&q=80',
    config: {
      variant: 'trust_badges',
      badges: [
        { icon: "Lock", title: "Paiement Sécurisé", description: "100% sécurisé" },
        { icon: "Truck", title: "Livraison Rapide", description: "24-48h" },
        { icon: "RefreshCw", title: "Retours Gratuits", description: "30 jours" },
        { icon: "CreditCard", title: "Paiement en 4x", description: "sans frais" }
      ],
      layout: "horizontal",
      mobileLayout: "grid-2x2",
      backgroundColor: "#f8fafc",
      iconColor: "#8b5cf6",
      showBorder: true,
      paddingY: 60,
      animation: "fade-up"
    }
  },
  {
    id: 'proof_press_logos',
    name: 'As Seen In / Press',
    description: 'Logos presse et partenaires',
    thumbnail: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80',
    config: {
      variant: 'press_logos',
      title: "ILS PARLENT DE NOUS",
      logos: [
        { name: "Forbes", src: "/logos/forbes.svg" },
        { name: "Vogue", src: "/logos/vogue.svg" },
        { name: "Elle", src: "/logos/elle.svg" },
        { name: "GQ", src: "/logos/gq.svg" },
        { name: "Tunisie", src: "/logos/tunisie.svg" }
      ],
      quote: {
        text: "La marque qui révolutionne le e-commerce tunisien",
        source: "Magazine XYZ"
      },
      logoStyle: "grayscale",
      hoverStyle: "color",
      scrollingMarquee: true,
      paddingY: 60,
      animation: "fade-in"
    }
  },
  {
    id: 'proof_live_activity',
    name: 'Live Activity Feed',
    description: 'Notifications d\'achat en temps réel (FOMO)',
    thumbnail: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
    config: {
      variant: 'live_activity',
      title: "🔴 EN DIRECT",
      activities: [
        { type: "purchase", name: "Ahmed", location: "Sousse", product: "T-shirt Blanc", time: "Il y a 2 minutes" },
        { type: "purchase", name: "Fatma", location: "Tunis", product: "Robe Élégante", time: "Il y a 5 minutes" },
        { type: "viewing", count: 15, text: "personnes regardent cette page maintenant" }
      ],
      position: "bottom-left",
      autoRotate: true,
      rotateInterval: 4000,
      showViewerCount: true,
      style: "card",
      animation: "slide-in"
    }
  }
];

// ============================================
// NEWSLETTER & CTA TEMPLATES (5 variants)
// ============================================

export const NEWSLETTER_TEMPLATES: TemplateVariant[] = [
  {
    id: 'newsletter_incentive',
    name: 'Simple with Incentive',
    description: 'Newsletter simple avec code promo',
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
    config: {
      variant: 'incentive',
      icon: "🎁",
      title: "-15% SUR VOTRE PREMIÈRE COMMANDE",
      subtitle: "Inscrivez-vous à notre newsletter pour recevoir votre code promo.",
      placeholder: "Votre email",
      buttonText: "JE M'INSCRIS",
      privacyText: "✓ Pas de spam, promis !",
      successMessage: "Merci ! Vérifiez votre boîte mail.",
      discountCode: "WELCOME15",
      backgroundColor: "#f8fafc",
      accentColor: "#8b5cf6",
      layout: "centered",
      paddingY: 100,
      animation: "fade-up"
    }
  },
  {
    id: 'newsletter_exit_popup',
    name: 'Exit Intent Popup',
    description: 'Popup déclenchée à l\'intention de sortie',
    thumbnail: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80',
    config: {
      variant: 'exit_popup',
      title: "⏰ ATTENDEZ !",
      subtitle: "Avant de partir, profitez de -20% sur votre commande !",
      placeholder: "Votre email",
      buttonText: "OBTENIR MON CODE",
      dismissText: "Non merci, je préfère payer le prix fort.",
      showCountdown: true,
      countdownMinutes: 15,
      triggerOnExit: true,
      triggerAfterScroll: 70,
      showOnce: true,
      discountCode: "STAY20",
      animation: "scale-in"
    }
  },
  {
    id: 'newsletter_banner',
    name: 'Full Width Banner',
    description: 'Bandeau newsletter pleine largeur',
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
    config: {
      variant: 'full_banner',
      title: "REJOIGNEZ LA FAMILLE DROPY",
      benefits: ["Nouveautés", "Promos exclusives", "Conseils style"],
      placeholder: "Votre email",
      buttonText: "S'INSCRIRE",
      backgroundColor: "#7c3aed",
      textColor: "#ffffff",
      layout: "inline",
      paddingY: 60,
      animation: "fade-in"
    }
  },
  {
    id: 'newsletter_product_preview',
    name: 'With Product Preview',
    description: 'Newsletter avec aperçu produits exclusifs',
    thumbnail: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&q=80',
    config: {
      variant: 'product_preview',
      title: "SOYEZ LES PREMIERS !",
      subtitle: "Recevez nos nouveautés en avant-première.",
      productImages: [
        "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=200",
        "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=200",
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200"
      ],
      placeholder: "Votre email",
      buttonText: "JE M'INSCRIS",
      layout: "split",
      imagePosition: "left",
      paddingY: 100,
      animation: "fade-up"
    }
  },
  {
    id: 'newsletter_spin_wheel',
    name: 'Gamified Spin Wheel',
    description: 'Roue de la fortune gamifiée',
    thumbnail: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80',
    config: {
      variant: 'spin_wheel',
      title: "🎡 TENTEZ VOTRE CHANCE !",
      prizes: [
        { label: "-10%", probability: 30, color: "#8b5cf6" },
        { label: "-20%", probability: 25, color: "#ec4899" },
        { label: "-30%", probability: 15, color: "#f59e0b" },
        { label: "LIVRAISON GRATUITE", probability: 20, color: "#10b981" },
        { label: "-50%", probability: 5, color: "#ef4444" },
        { label: "CADEAU", probability: 5, color: "#3b82f6" }
      ],
      placeholder: "Votre email",
      buttonText: "TOURNER LA ROUE",
      guaranteedWin: true,
      spinDuration: 4000,
      animation: "bounce-in"
    }
  }
];

// ============================================
// FOOTER TEMPLATES (4 variants)
// ============================================

export const FOOTER_TEMPLATES: TemplateVariant[] = [
  {
    id: 'footer_complete',
    name: 'Complete Footer',
    description: 'Footer complet avec navigation, paiement et social',
    thumbnail: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&q=80',
    config: {
      variant: 'complete',
      logo: "DROPY",
      tagline: "Votre destination mode en Tunisie",
      columns: [
        {
          title: "BOUTIQUE",
          links: [
            { label: "Nouveautés", url: "/nouveautes" },
            { label: "Femme", url: "/femme" },
            { label: "Homme", url: "/homme" },
            { label: "Soldes", url: "/soldes" }
          ]
        },
        {
          title: "AIDE",
          links: [
            { label: "FAQ", url: "/faq" },
            { label: "Livraison", url: "/livraison" },
            { label: "Retours", url: "/retours" },
            { label: "Contact", url: "/contact" },
            { label: "Guide des tailles", url: "/tailles" }
          ]
        },
        {
          title: "LÉGAL",
          links: [
            { label: "CGV", url: "/cgv" },
            { label: "Mentions légales", url: "/mentions" },
            { label: "Confidentialité", url: "/confidentialite" }
          ]
        },
        {
          title: "CONTACT",
          content: {
            phone: "+216 XX XXX XXX",
            email: "contact@boutique.tn",
            address: "Tunis, Tunisie"
          }
        }
      ],
      social: [
        { platform: "facebook", url: "#" },
        { platform: "instagram", url: "#" },
        { platform: "tiktok", url: "#" }
      ],
      paymentMethods: ["visa", "mastercard", "d17", "flouci", "cod"],
      copyright: "© 2025 Boutique. Tous droits réservés.",
      backgroundColor: "#ffffff",
      textColor: "#1f2937",
      borderTop: true,
      paddingY: 80
    }
  },
  {
    id: 'footer_minimal',
    name: 'Minimal Footer',
    description: 'Footer minimaliste une ligne',
    thumbnail: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&q=80',
    config: {
      variant: 'minimal',
      logo: "DROPY",
      links: [
        { label: "Boutique", url: "/shop" },
        { label: "FAQ", url: "/faq" },
        { label: "Contact", url: "/contact" },
        { label: "CGV", url: "/cgv" }
      ],
      social: [
        { platform: "facebook", url: "#" },
        { platform: "instagram", url: "#" },
        { platform: "tiktok", url: "#" }
      ],
      poweredBy: "Powered by Dropy",
      copyright: "© 2025",
      layout: "single-line",
      backgroundColor: "#fafafa",
      paddingY: 40
    }
  },
  {
    id: 'footer_newsletter',
    name: 'Newsletter Footer',
    description: 'Footer avec newsletter intégrée',
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
    config: {
      variant: 'newsletter',
      logo: "DROPY",
      columns: [
        {
          title: "Navigation",
          links: [
            { label: "Accueil", url: "/" },
            { label: "Boutique", url: "/shop" },
            { label: "Contact", url: "/contact" }
          ]
        }
      ],
      newsletter: {
        title: "NEWSLETTER",
        subtitle: "-15% sur votre 1ère commande",
        placeholder: "Votre email",
        buttonText: "OK"
      },
      social: [
        { platform: "facebook", url: "#" },
        { platform: "instagram", url: "#" },
        { platform: "youtube", url: "#" }
      ],
      legalLinks: [
        { label: "CGV", url: "/cgv" },
        { label: "Mentions légales", url: "/mentions" },
        { label: "Confidentialité", url: "/confidentialite" }
      ],
      copyright: "© 2025",
      backgroundColor: "#0f172a",
      textColor: "#e2e8f0",
      accentColor: "#8b5cf6",
      paddingY: 80
    }
  },
  {
    id: 'footer_mobile_sticky',
    name: 'Sticky Mobile Footer',
    description: 'Navigation fixe mobile avec icônes',
    thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80',
    config: {
      variant: 'mobile_sticky',
      items: [
        { icon: "Home", label: "Home", url: "/" },
        { icon: "Search", label: "Search", url: "/search" },
        { icon: "Heart", label: "Wishlist", url: "/wishlist", badge: true },
        { icon: "User", label: "Account", url: "/account" },
        { icon: "ShoppingBag", label: "Cart", url: "/cart", showBadge: true }
      ],
      showOnMobileOnly: true,
      backgroundColor: "#ffffff",
      activeColor: "#8b5cf6",
      inactiveColor: "#9ca3af",
      showLabels: true,
      height: 64,
      borderTop: true,
      shadow: true
    }
  }
];

// ============================================
// CONTACT & ABOUT TEMPLATES (4 variants)
// ============================================

export const CONTACT_TEMPLATES: TemplateVariant[] = [
  {
    id: 'about_brand_story',
    name: 'Brand Story',
    description: 'Histoire de marque avec fondateur',
    thumbnail: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80',
    config: {
      variant: 'brand_story',
      title: "NOTRE HISTOIRE",
      content: "Fondée en 2020 à Tunis, notre marque est née d'une passion pour la mode accessible et de qualité. Nous croyons que chaque personne mérite de se sentir belle...",
      founderImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600",
      founderName: "Amine Ben Salah",
      founderTitle: "Fondateur & CEO",
      videoUrl: "",
      ctaText: "EN SAVOIR PLUS →",
      ctaLink: "/about",
      layout: "split",
      imagePosition: "right",
      paddingY: 100,
      animation: "fade-up"
    }
  },
  {
    id: 'about_values',
    name: 'Values Grid',
    description: 'Grille des valeurs de marque',
    thumbnail: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80',
    config: {
      variant: 'values_grid',
      title: "NOS VALEURS",
      values: [
        { icon: "Leaf", title: "Qualité", description: "Des matières premium sélectionnées avec soin" },
        { icon: "Sparkles", title: "Éthique", description: "Production responsable en Tunisie" },
        { icon: "Users", title: "Proximité", description: "Service client réactif et à l'écoute" }
      ],
      columns: 3,
      iconStyle: "circle",
      backgroundColor: "#fafafa",
      paddingY: 100,
      animation: "fade-up"
    }
  },
  {
    id: 'contact_form',
    name: 'Contact Form + Info',
    description: 'Formulaire de contact avec informations',
    thumbnail: 'https://images.unsplash.com/photo-1534536281715-e28d76689b4d?w=800&q=80',
    config: {
      variant: 'contact_form',
      title: "CONTACTEZ-NOUS",
      fields: [
        { name: "name", label: "Nom", type: "text", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "subject", label: "Sujet", type: "text", required: true },
        { name: "message", label: "Message", type: "textarea", required: true }
      ],
      buttonText: "ENVOYER",
      successMessage: "Merci ! Nous vous répondrons sous 24h.",
      contactInfo: {
        address: "123 Rue Example, Tunis 1000",
        phone: "+216 XX XXX XXX",
        email: "contact@boutique.tn",
        hours: "Lun-Sam: 9h-18h"
      },
      layout: "split",
      paddingY: 100,
      animation: "fade-up"
    }
  },
  {
    id: 'contact_whatsapp',
    name: 'WhatsApp Direct',
    description: 'Contact direct WhatsApp',
    thumbnail: 'https://images.unsplash.com/photo-1611606063065-ee7946f0787a?w=800&q=80',
    config: {
      variant: 'whatsapp',
      title: "UNE QUESTION ?",
      subtitle: "Discutez avec nous directement !",
      whatsappNumber: "+21612345678",
      buttonText: "💬 CHAT WHATSAPP",
      responseTime: "Réponse en < 5 min",
      alternativePhone: "+216 XX XXX XXX",
      showFloatingButton: true,
      floatingPosition: "bottom-right",
      backgroundColor: "#f0fdf4",
      accentColor: "#25d366",
      paddingY: 80,
      animation: "fade-up"
    }
  }
];

// ============================================
// CART & CHECKOUT TEMPLATES (4 variants)
// ============================================

export const CART_TEMPLATES: TemplateVariant[] = [
  {
    id: 'cart_slideout',
    name: 'Slide-out Cart',
    description: 'Panier latéral avec upsell',
    thumbnail: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
    config: {
      variant: 'slideout',
      title: "VOTRE PANIER",
      emptyMessage: "Votre panier est vide",
      showQuantityControls: true,
      showRemoveButton: true,
      showPromoCode: true,
      promoCodePlaceholder: "Code promo",
      freeShippingThreshold: 99,
      freeShippingMessage: "🚚 Plus que {amount} TND pour la livraison gratuite!",
      showFreeShippingProgress: true,
      checkoutButtonText: "COMMANDER →",
      trustBadges: ["🔒 Paiement 100% sécurisé"],
      upsellTitle: "Complétez votre commande",
      position: "right",
      width: 420,
      animation: "slide-left"
    }
  },
  {
    id: 'cart_full_page',
    name: 'Full Page Cart',
    description: 'Page panier complète avec cross-sell',
    thumbnail: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
    config: {
      variant: 'full_page',
      title: "VOTRE PANIER",
      showBreadcrumb: true,
      tableHeaders: ["PRODUIT", "PRIX", "QTÉ", "TOTAL", ""],
      showContinueShopping: true,
      continueShoppingText: "← CONTINUER LES ACHATS",
      continueShoppingLink: "/shop",
      summary: {
        showSubtotal: true,
        showShipping: true,
        showTotal: true
      },
      crossSell: {
        title: "💡 VOUS AIMEREZ AUSSI",
        maxItems: 3
      },
      checkoutButtonText: "PASSER COMMANDE →",
      paymentIcons: ["visa", "mastercard", "d17"],
      paddingY: 60
    }
  },
  {
    id: 'checkout_one_page',
    name: 'One-Page Checkout',
    description: 'Checkout tout-en-un optimisé',
    thumbnail: 'https://images.unsplash.com/photo-1556742044-3c52d6e88c62?w=800&q=80',
    config: {
      variant: 'one_page',
      title: "FINALISER MA COMMANDE",
      steps: [
        {
          id: "shipping",
          title: "1️⃣ LIVRAISON",
          fields: [
            { name: "firstName", label: "Prénom", type: "text", required: true, width: "half" },
            { name: "lastName", label: "Nom", type: "text", required: true, width: "half" },
            { name: "phone", label: "Téléphone", type: "tel", required: true, width: "full" },
            { name: "address", label: "Adresse", type: "text", required: true, width: "full" },
            { name: "city", label: "Ville", type: "text", required: true, width: "half" },
            { name: "postalCode", label: "Code postal", type: "text", required: false, width: "half" }
          ]
        },
        {
          id: "delivery",
          title: "2️⃣ MODE DE LIVRAISON",
          options: [
            { id: "standard", label: "Standard (48-72h)", price: 0, freeAbove: 99, description: "Gratuit dès 99 TND" },
            { id: "express", label: "Express (24h)", price: 15, description: "+15 TND" }
          ]
        },
        {
          id: "payment",
          title: "3️⃣ PAIEMENT",
          options: [
            { id: "cod", label: "Espèces à la livraison", icon: "Banknote" },
            { id: "card", label: "Carte bancaire", icon: "CreditCard" },
            { id: "d17", label: "D17 / Flouci", icon: "Smartphone" }
          ]
        }
      ],
      orderSummary: {
        title: "RÉCAPITULATIF",
        showItems: true,
        showPromoCode: true
      },
      submitButtonText: "CONFIRMER ET PAYER",
      trustMessage: "🔒 Paiement sécurisé",
      layout: "two-column",
      paddingY: 60
    }
  },
  {
    id: 'checkout_success',
    name: 'Order Success Page',
    description: 'Page de confirmation de commande',
    thumbnail: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
    config: {
      variant: 'success',
      icon: "CheckCircle",
      title: "COMMANDE CONFIRMÉE ! 🎉",
      subtitle: "Merci pour votre confiance",
      orderNumberPrefix: "Commande #",
      showOrderDetails: true,
      showShippingInfo: true,
      showPaymentInfo: true,
      estimatedDelivery: "Livraison estimée: 24-48h",
      trackingMessage: "Vous recevrez un SMS avec le suivi de votre colis.",
      ctaText: "CONTINUER MES ACHATS",
      ctaLink: "/shop",
      showSocialShare: true,
      shareMessage: "Je viens de commander sur @boutique !",
      backgroundColor: "#f0fdf4",
      accentColor: "#10b981",
      paddingY: 100,
      animation: "confetti"
    }
  }
];

// ============================================
// PRODUCT PAGE TEMPLATES (5 variants)
// ============================================

export const PRODUCT_PAGE_TEMPLATES: TemplateVariant[] = [
  {
    id: 'product_gallery_info',
    name: 'Gallery + Info',
    description: 'Galerie produit avec infos complètes',
    thumbnail: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
    config: {
      variant: 'gallery_info',
      layout: "split",
      gallery: {
        showThumbnails: true,
        thumbnailPosition: "bottom",
        enableZoom: true,
        showBadges: true
      },
      productInfo: {
        showBreadcrumb: true,
        showRating: true,
        showReviewCount: true,
        showPrice: true,
        showOriginalPrice: true,
        showDiscount: true,
        showColorSelector: true,
        showSizeSelector: true,
        showSizeGuide: true,
        showQuantitySelector: true,
        showAddToCart: true,
        showWishlist: true,
        showStock: true,
        stockThreshold: 5,
        showDeliveryInfo: true,
        showTrustBadges: true
      },
      tabs: [
        { id: "description", label: "DESCRIPTION" },
        { id: "details", label: "DÉTAILS" },
        { id: "reviews", label: "AVIS" },
        { id: "shipping", label: "LIVRAISON" }
      ],
      stickyAddToCart: true,
      paddingY: 60
    }
  },
  {
    id: 'product_sticky_buy',
    name: 'Sticky Buy Bar',
    description: 'Barre d\'achat fixe au scroll',
    thumbnail: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
    config: {
      variant: 'sticky_buy',
      triggerScroll: 400,
      showProductImage: true,
      showProductName: true,
      showPrice: true,
      showSizeSelector: true,
      buttonText: "AJOUTER AU PANIER",
      position: "bottom",
      backgroundColor: "#ffffff",
      shadow: true,
      animation: "slide-up"
    }
  },
  {
    id: 'product_video_hero',
    name: 'Video Hero Product',
    description: 'Produit avec vidéo en premier plan',
    thumbnail: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
    config: {
      variant: 'video_hero',
      videoUrl: "",
      fallbackImage: "",
      autoplay: true,
      muted: true,
      loop: true,
      showPlayButton: true,
      overlayContent: {
        title: "",
        price: "",
        ctaText: "ACHETER MAINTENANT"
      },
      paddingY: 0
    }
  },
  {
    id: 'product_bundle_builder',
    name: 'Bundle Builder',
    description: 'Constructeur de bundle avec réduction',
    thumbnail: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
    config: {
      variant: 'bundle_builder',
      title: "CRÉEZ VOTRE BUNDLE",
      steps: [
        { label: "Choisissez un haut", category: "tops" },
        { label: "Choisissez un bas", category: "bottoms" },
        { label: "Ajoutez un accessoire", category: "accessories", optional: true }
      ],
      discountTiers: [
        { items: 2, discount: 10 },
        { items: 3, discount: 20 }
      ],
      showTotalSavings: true,
      ctaText: "AJOUTER LE BUNDLE",
      paddingY: 80
    }
  },
  {
    id: 'product_comparison',
    name: 'Product Comparison',
    description: 'Tableau de comparaison de produits',
    thumbnail: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
    config: {
      variant: 'comparison',
      title: "COMPAREZ NOS PRODUITS",
      maxProducts: 4,
      attributes: [
        { key: "price", label: "Prix" },
        { key: "material", label: "Matière" },
        { key: "sizes", label: "Tailles disponibles" },
        { key: "colors", label: "Couleurs" },
        { key: "rating", label: "Note" }
      ],
      highlightDifferences: true,
      showAddToCart: true,
      paddingY: 80
    }
  }
];

// ============================================
// EXPORT ALL TEMPLATES
// ============================================

export const ALL_CONVERSION_TEMPLATES: TemplateCategory[] = [
  {
    id: 'hero',
    name: 'Hero Sections',
    icon: 'Image',
    templates: HERO_TEMPLATES
  },
  {
    id: 'products',
    name: 'Product Grids',
    icon: 'ShoppingBag',
    templates: PRODUCT_GRID_TEMPLATES
  },
  {
    id: 'social_proof',
    name: 'Social Proof',
    icon: 'Star',
    templates: SOCIAL_PROOF_TEMPLATES
  },
  {
    id: 'newsletter',
    name: 'Newsletter & CTA',
    icon: 'Mail',
    templates: NEWSLETTER_TEMPLATES
  },
  {
    id: 'footer',
    name: 'Footer',
    icon: 'Layout',
    templates: FOOTER_TEMPLATES
  },
  {
    id: 'contact',
    name: 'Contact & About',
    icon: 'Info',
    templates: CONTACT_TEMPLATES
  },
  {
    id: 'cart',
    name: 'Cart & Checkout',
    icon: 'ShoppingCart',
    templates: CART_TEMPLATES
  },
  {
    id: 'product_page',
    name: 'Product Page',
    icon: 'Package',
    templates: PRODUCT_PAGE_TEMPLATES
  }
];

export const getTemplatesByCategory = (categoryId: string): TemplateVariant[] => {
  const category = ALL_CONVERSION_TEMPLATES.find(c => c.id === categoryId);
  return category?.templates || [];
};

export const getTemplateById = (templateId: string): TemplateVariant | undefined => {
  for (const category of ALL_CONVERSION_TEMPLATES) {
    const template = category.templates.find(t => t.id === templateId);
    if (template) return template;
  }
  return undefined;
};

export const getTotalTemplateCount = (): number => {
  return ALL_CONVERSION_TEMPLATES.reduce((total, cat) => total + cat.templates.length, 0);
};
