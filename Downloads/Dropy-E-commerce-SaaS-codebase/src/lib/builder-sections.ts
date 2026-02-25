// Section Library for Builder - Updated
import { 
  ImageIcon, 
  ShoppingBag, 
  Grid, 
  MessageSquare, 
  HelpCircle, 
  Type, 
  Clock, 
  Columns, 
  LogOut, 
  Heart,
  Layout,
  Star,
  Truck,
  Shield,
  RefreshCw,
  Headphones,
  Search,
  Mail,
  Instagram,
  Video,
  Info,
  Zap,
  List,
  FileText,
  User,
  Activity,
  Award
} from "lucide-react";

export const SECTION_LIBRARY = [
  // MARKETING & CONVERSION
  {
    id: 'hero',
    name: 'Hero / Bannière',
    icon: ImageIcon,
    category: 'Marketing & Conversion',
    description: 'Grande bannière avec image de fond et call-to-action',
    thumbnail: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80',
    premium: false
  },
  {
    id: 'promo_banner',
    name: 'Bandeau Promo',
    icon: Zap,
    category: 'Marketing & Conversion',
    description: 'Petit bandeau d\'annonce tout en haut',
    thumbnail: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80',
  },
  {
    id: 'countdown',
    name: 'Compte à Rebours',
    icon: Clock,
    category: 'Marketing & Conversion',
    description: 'Urgence pour promotions limitées',
    thumbnail: 'https://images.unsplash.com/photo-1501139083538-0139583c060f?w=800&q=80',
  },
  {
    id: 'pricing',
    name: 'Table de Tarifs',
    icon: Columns,
    category: 'Marketing & Conversion',
    description: 'Affichez vos différents plans et tarifs',
    thumbnail: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80',
  },
  {
    id: 'newsletter',
    name: 'Newsletter',
    icon: Mail,
    category: 'Marketing & Conversion',
    description: 'Inscription newsletter',
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
  },
  {
    id: 'wishlist',
    name: 'Favoris',
    icon: Heart,
    category: 'Marketing & Conversion',
    description: 'Section de liste d\'envies',
    thumbnail: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=800&q=80',
  },
  {
    id: 'trust_badges',
    name: 'Badges de Confiance',
    icon: Shield,
    category: 'Marketing & Conversion',
    description: 'Icônes de réassurance (Livraison, Garantie, etc.)',
    thumbnail: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&q=80',
  },

  // E-COMMERCE
  {
    id: 'products',
    name: 'Grille Produits',
    icon: ShoppingBag,
    category: 'E-commerce',
    description: 'Affichage produits en grille avec filtres',
    thumbnail: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&q=80',
  },
  {
    id: 'collections',
    name: 'Collections',
    icon: Grid,
    category: 'E-commerce',
    description: 'Catégories de produits avec images',
    thumbnail: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&q=80',
  },
  {
    id: 'product_detail',
    name: 'Détail Produit',
    icon: ShoppingBag,
    category: 'E-commerce',
    description: 'Page de produit complète avec images et variantes',
    thumbnail: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
  },
  {
    id: 'recommended_products',
    name: 'Produits Recommandés',
    icon: Star,
    category: 'E-commerce',
    description: 'Suggestions intelligentes basées sur les préférences',
    thumbnail: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80',
  },
  {
    id: 'checkout',
    name: 'Checkout COD',
    icon: Zap,
    category: 'E-commerce',
    description: 'Tunnel d\'achat optimisé pour le paiement à la livraison',
    thumbnail: 'https://images.unsplash.com/photo-1556742044-3c52d6e88c62?w=800&q=80',
  },

  // CONTENU & INFOS
  {
    id: 'features',
    name: 'Avantages (USPs)',
    icon: Award,
    category: 'Contenu & Infos',
    description: 'Points forts de votre boutique',
    thumbnail: 'https://images.unsplash.com/photo-1454165833767-0220389998df?w=800&q=80',
  },
  {
    id: 'about',
    name: 'À Propos',
    icon: Info,
    category: 'Contenu & Infos',
    description: 'Histoire et mission de la marque',
    thumbnail: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80',
  },
  {
    id: 'blog',
    name: 'Articles Blog',
    icon: Type,
    category: 'Contenu & Infos',
    description: 'Liste articles de blog',
    thumbnail: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&q=80',
  },
  {
    id: 'video',
    name: 'Vidéo',
    icon: Video,
    category: 'Contenu & Infos',
    description: 'Intégration YouTube/Vimeo',
    thumbnail: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&q=80',
  },
  {
    id: 'process_steps',
    name: 'Étapes / Processus',
    icon: List,
    category: 'Contenu & Infos',
    description: 'Expliquez comment ça marche (1, 2, 3...)',
    thumbnail: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&q=80',
  },
  {
    id: 'stats',
    name: 'Chiffres Clés',
    icon: Activity,
    category: 'Contenu & Infos',
    description: 'Affichez vos statistiques (clients, ventes, etc.)',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
  },
  {
    id: 'team',
    name: 'Équipe',
    icon: User,
    category: 'Contenu & Infos',
    description: 'Présentez votre équipe ou vos fondateurs',
    thumbnail: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80',
  },

  // SOCIAL PROOF
  {
    id: 'testimonials',
    name: 'Témoignages',
    icon: MessageSquare,
    category: 'Social Proof',
    description: 'Avis clients avec notes',
    thumbnail: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=800&q=80',
  },
  {
    id: 'logo_carousel',
    name: 'Carousel Logos',
    icon: RefreshCw,
    category: 'Social Proof',
    description: 'Affichage de vos partenaires ou marques',
    thumbnail: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80',
  },

  // SUPPORT & LÉGAL
  {
    id: 'faq',
    name: 'FAQ',
    icon: HelpCircle,
    category: 'Support & Légal',
    description: 'Questions fréquentes en accordéon',
    thumbnail: 'https://images.unsplash.com/photo-1484807352052-23338990c6c6?w=800&q=80',
  },
  {
    id: 'contact',
    name: 'Contact',
    icon: Mail,
    category: 'Support & Légal',
    description: 'Formulaire de contact avec infos',
    thumbnail: 'https://images.unsplash.com/photo-1534536281715-e28d76689b4d?w=800&q=80',
  },
  {
    id: 'shipping_policy',
    name: 'Livraison',
    icon: Truck,
    category: 'Support & Légal',
    description: 'Politique de livraison détaillée',
    thumbnail: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
  },
  {
    id: 'refund_policy',
    name: 'Retours',
    icon: RefreshCw,
    category: 'Support & Légal',
    description: 'Politique de retours et remboursements',
    thumbnail: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?w=800&q=80',
  },
  {
    id: 'privacy_policy',
    name: 'Confidentialité',
    icon: Shield,
    category: 'Support & Légal',
    description: 'Politique de confidentialité',
    thumbnail: 'https://images.unsplash.com/photo-1504384308090-c89eececbfbc?w=800&q=80',
  },
  {
    id: 'terms_conditions',
    name: 'Conditions (CGV)',
    icon: FileText,
    category: 'Support & Légal',
    description: 'Conditions générales de vente',
    thumbnail: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80',
  },

  // LAYOUT
  {
    id: 'footer',
    name: 'Pied de page',
    icon: Layout,
    category: 'Layout',
    description: 'Bas de page avec liens et copyright',
    thumbnail: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&q=80',
  },
  {
    id: 'mega_menu',
    name: 'Mega Menu',
    icon: Layout,
    category: 'Navigation',
    description: 'Menu de navigation avancé multi-colonnes',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
  }
];

export const getPlaceholderConfig = (type: string) => {
  switch (type) {
    case 'trust_badges':
      return {
        title: "Pourquoi nous faire confiance ?",
        items: [
          { icon: "Truck", title: "Livraison 24h", description: "Expédition rapide partout en Tunisie" },
          { icon: "Shield", title: "Paiement Sécurisé", description: "Paiement à la livraison 100% sûr" },
          { icon: "RefreshCw", title: "Retours Gratuits", description: "Échange facile sous 14 jours" },
          { icon: "Headphones", title: "Support 7j/7", description: "Une équipe à votre écoute" }
        ],
        layout: 'grid',
        columns: 4,
        animation: "fade-up",
        paddingY: 80,
        backgroundColor: "#f9fafb"
      };
    case 'logo_carousel':
      return {
        title: "Nos Partenaires de Confiance",
        logos: [
          "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=100&fit=crop",
          "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&h=100&fit=crop",
          "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=200&h=100&fit=crop",
          "https://images.unsplash.com/photo-1551434678-e076c223a692?w=200&h=100&fit=crop",
          "https://images.unsplash.com/photo-1599305445671-ac291c95aba9?w=200&h=100&fit=crop"
        ],
        animation: "fade-in",
        paddingY: 60
      };
    case 'promo_banner':
      return {
        text: "🚀 OFFRE DE LANCEMENT : -20% sur tout le site avec le code DROPY20 | Livraison gratuite dès 100 DT",
        backgroundColor: "#7c3aed",
        textColor: "#ffffff",
        link: "/shop",
        fontSize: 12,
        height: 40
      };
    case 'process_steps':
      return {
        title: "Votre commande en 3 étapes simples",
        steps: [
          { title: "Sélection", description: "Choisissez vos articles préférés parmi notre large catalogue." },
          { title: "Confirmation", description: "Validez votre panier et entrez vos coordonnées de livraison." },
          { title: "Réception", description: "Recevez votre colis chez vous et payez à la livraison." }
        ],
        animation: "slide-up",
        paddingY: 100,
        columns: 3
      };
    case 'pricing':
      return {
        title: "Des offres adaptées à vos besoins",
        plans: [
          { name: "Starter", price: "0", period: "TND", features: ["1 Boutique", "10 Produits", "Support Email", "Domaine .dropy.store"] },
          { name: "Pro", price: "49", period: "TND/mois", features: ["Boutiques Illimitées", "Produits Illimités", "Support 24/7", "Domaine Personnalisé", "Analytics"], popular: true },
          { name: "Business", price: "149", period: "TND/mois", features: ["Tout en Pro", "Account Manager", "API Access", "Priorité de stock"] }
        ],
        animation: "fade-up",
        paddingY: 100,
        backgroundColor: "#f8fafc"
      };
    case 'stats':
      return {
        title: "Rejoignez la communauté",
        stats: [
          { label: "Clients", value: "10,000+" },
          { label: "Livraisons", value: "25k+" },
          { label: "Villes", value: "350+" },
          { label: "Satisfaction", value: "4.9/5" }
        ],
        backgroundColor: "#0f172a",
        textColor: "#ffffff",
        animation: "counter",
        paddingY: 80
      };
    case 'team':
      return {
        title: "L'Équipe derrière le succès",
        members: [
          { name: "Amine Ben Salah", role: "Directeur Général", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop" },
          { name: "Sarah Mansour", role: "Responsable Clientèle", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop" },
          { name: "Mohamed Dridi", role: "Expert Logistique", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop" }
        ],
        animation: "fade-up",
        paddingY: 100
      };
    case 'collections':
      return {
        title: "Nos Catégories",
        columns: 3,
        items: [
          { title: "Mode Femme", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600", link: "/shop" },
          { title: "Mode Homme", image: "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=600", link: "/shop" },
          { title: "Accessoires", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600", link: "/shop" }
        ],
        animation: "fade-up",
        paddingY: 100
      };
    case 'hero':
    return {
      variant: 'classic', 
      title: "Vendez en ligne dès aujourd'hui",
      subtitle: "La solution n°1 en Tunisie pour créer votre boutique de dropshipping sans stock.",
      backgroundImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1920",
      ctaText: "Créer ma Boutique",
      ctaLink: "/inscription",
      secondaryCtaText: "Voir les Tarifs",
      secondaryCtaLink: "/pricing",
      textPosition: "center",
      height: 700,
      overlay: 0.5,
      textColor: "#ffffff",
      badge: "Nouveau : Templates 2026",
      animation: "fade-up"
    };
  case 'checkout':
    return {
      title: "Finalisez votre commande",
      subtitle: "Paiement en espèces à la livraison (COD)",
      buttonText: "Confirmer la commande",
      successMessage: "Merci ! Votre commande a été reçue et sera traitée sous peu.",
      animation: "fade-in",
      paddingY: 80,
      backgroundColor: "#ffffff"
    };
  case 'products':
    return {
      title: "Nos Meilleures Ventes",
      subtitle: "Les produits les plus populaires cette semaine",
      layout: 'grid',
      columns: 4,
      limit: 8,
      showPrice: true,
      showAddToCart: true,
      animation: "fade-up",
      paddingY: 100,
      items: [
        { title: "Produit Premium 1", price: "89.00", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600" },
        { title: "Produit Premium 2", price: "129.00", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600" },
        { title: "Produit Premium 3", price: "59.00", image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600" },
        { title: "Produit Premium 4", price: "199.00", image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600" }
      ]
    };
  case 'features':
    return {
      title: "Une solution complète",
      features: [
        {
          icon: "Zap",
          title: "Lancement Rapide",
          description: "Votre boutique est en ligne en quelques minutes."
        },
        {
          icon: "ShoppingBag",
          title: "Catalogue Produits",
          description: "Accès direct à des milliers de produits gagnants."
        },
        {
          icon: "Truck",
          title: "Logistique Intégrée",
          description: "Nous gérons l'expédition et les retours pour vous."
        },
        {
          icon: "Shield",
          title: "Paiement Sécurisé",
          description: "Système de paiement fiable pour vous et vos clients."
        }
      ],
      layout: 'grid',
      columns: 4,
      animation: "fade-up",
      paddingY: 100
    };
  case 'testimonials':
    return {
      title: "Ils réussissent avec nous",
      columns: 3,
      testimonials: [
        {
          name: "Amira Ben Ali",
          avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
          rating: 5,
          text: "Dropy a totalement changé ma façon de travailler. J'ai pu lancer ma marque sans aucun stock initial.",
          location: "Tunis"
        },
        {
          name: "Mohamed Trabelsi",
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
          rating: 5,
          text: "Le support est incroyable et la plateforme est très intuitive. Mes ventes ont doublé en 3 mois.",
          location: "Sousse"
        },
        {
          name: "Leila Gharbi",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
          rating: 5,
          text: "La meilleure solution e-commerce en Tunisie. Les templates sont magnifiques et convertissent très bien.",
          location: "Sfax"
        }
      ],
      animation: "fade-up",
      paddingY: 100
    };
  case 'faq':
    return {
      title: "Tout ce qu'il faut savoir",
      faqs: [
        {
          question: "Ai-je besoin de stock pour commencer ?",
          answer: "Non, avec Dropy, vous vendez les produits de nos fournisseurs partenaires. Nous gérons le stock et l'envoi."
        },
        {
          question: "Quels sont les délais de livraison en Tunisie ?",
          answer: "En général, vos clients reçoivent leurs commandes sous 24h à 72h selon le gouvernorat."
        },
        {
          question: "Comment suis-je payé ?",
          answer: "Les gains de vos ventes sont versés sur votre compte Dropy et vous pouvez les retirer par virement ou D17."
        }
      ],
      animation: "fade-up",
      paddingY: 100
    };
  case 'newsletter':
    return {
      title: "Ne manquez aucune opportunité",
      subtitle: "Recevez nos guides exclusifs et nos nouveaux produits gagnants chaque semaine.",
      buttonText: "Rejoindre la Communauté",
      placeholder: "votre@email.tn",
      backgroundColor: "#7c3aed",
      textColor: "#ffffff",
      animation: "fade-up",
      paddingY: 120
    };
    case 'about':
      return {
        title: "Notre Mission",
        content: `
          <h3>Démocratiser le e-commerce</h3>
          <p>Dropy est née de la volonté de démocratiser le e-commerce en Tunisie. Nous croyons que chaque entrepreneur mérite les meilleurs outils pour réussir.</p>
          <p>Notre plateforme combine technologie de pointe et expertise locale pour vous offrir une expérience de vente inégalée.</p>
        `,
        image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200",
        imagePosition: 'right',
        animation: "fade-up",
        paddingY: 100
      };
    case 'shipping_policy':
      return {
        title: "Politique de Livraison",
        content: `
          <h3>Délais de livraison</h3>
          <p>Toutes les commandes sont traitées sous 24h. La livraison à domicile prend généralement entre 24h et 72h selon votre gouvernorat.</p>
          <h3>Frais de livraison</h3>
          <p>Les frais de livraison sont fixés à 7 DT pour toute la Tunisie. La livraison est offerte pour toute commande supérieure à 100 DT.</p>
          <h3>Suivi de commande</h3>
          <p>Vous recevrez un SMS de confirmation dès l'expédition de votre colis avec un lien de suivi en temps réel.</p>
        `,
        animation: "fade-in",
        paddingY: 80
      };
    case 'refund_policy':
      return {
        title: "Politique de Retour et Remboursement",
        content: `
          <h3>Conditions de retour</h3>
          <p>Vous disposez d'un délai de 14 jours après réception de votre commande pour demander un échange ou un retour si le produit ne vous convient pas.</p>
          <h3>État des produits</h3>
          <p>Les articles doivent être retournés dans leur emballage d'origine, non utilisés et avec toutes leurs étiquettes.</p>
          <h3>Processus de remboursement</h3>
          <p>Une fois le retour validé, nous procédons au remboursement ou à l'émission d'un bon d'achat sous 5 jours ouvrés.</p>
        `,
        animation: "fade-in",
        paddingY: 80
      };
    case 'privacy_policy':
      return {
        title: "Politique de Confidentialité",
        content: `
          <h3>Collecte des données</h3>
          <p>Nous collectons uniquement les informations nécessaires au traitement de vos commandes et à l'amélioration de votre expérience d'achat.</p>
          <h3>Sécurité</h3>
          <p>Vos données sont protégées par des protocoles de sécurité avancés et ne sont jamais partagées avec des tiers à des fins publicitaires.</p>
          <h3>Vos droits</h3>
          <p>Conformément à la loi tunisienne, vous disposez d'un droit d'accès, de modification et de suppression de vos données personnelles.</p>
        `,
        animation: "fade-in",
        paddingY: 80
      };
    case 'terms_conditions':
      return {
        title: "Conditions Générales de Vente",
        content: `
          <h3>Objet</h3>
          <p>Les présentes conditions régissent la vente des produits présentés sur notre boutique en ligne.</p>
          <h3>Prix et Paiement</h3>
          <p>Nos prix sont indiqués en Dinars Tunisiens (TND). Le paiement s'effectue en espèces à la livraison (Cash on Delivery).</p>
          <h3>Responsabilité</h3>
          <p>Nous nous engageons à fournir des descriptions précises de nos produits et à assurer un service de qualité.</p>
        `,
        animation: "fade-in",
        paddingY: 80
      };
    case 'footer':
    return {
      brandName: "DROPY",
      description: "La plateforme e-commerce leader en Tunisie.",
      copyright: "© 2026 Dropy. Fait avec passion à Tunis.",
      address: "Lac 2, Tunis, Tunisie",
      phone: "+216 71 000 000",
      backgroundColor: "#ffffff",
      textColor: "#0f172a",
      links: [
        { label: "Accueil", url: "/" },
        { label: "Boutique", url: "/shop" },
        { label: "Contact", url: "/contact" }
      ],
      social: [
        { platform: "facebook", url: "#" },
        { platform: "instagram", url: "#" }
      ],
      animation: "fade-in"
    };
  case 'recommended_products':
    return {
      title: "Sélectionné pour vous",
      algorithm: "bestsellers",
      limit: 4,
      columns: 4,
      showPrice: true,
      showAddToCart: true,
      animation: "fade-up",
      paddingY: 80,
      items: [
        { title: "Coup de Cœur 1", price: "79.00", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600" },
        { title: "Coup de Cœur 2", price: "99.00", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600" },
        { title: "Coup de Cœur 3", price: "149.00", image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600" },
        { title: "Coup de Cœur 4", price: "59.00", image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600" }
      ]
    };
  case 'mega_menu':
    return {
      brandName: "DROPY",
      logo: "",
      sticky: true,
      transparent: false,
      menuItems: [
        { label: "Accueil", link: "/" },
        { label: "Femme", link: "/shop", megaMenu: true, columns: [{ title: "Vêtements", links: [{ label: "Robes", url: "/shop" }] }] },
        { label: "Homme", link: "/shop" },
        { label: "Contact", link: "/contact" }
      ]
    };
  case 'video':
    return {
      title: "Découvrez notre univers",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      aspectRatio: "16/9",
      autoplay: false,
      paddingY: 100
    };
  case 'wishlist':
    return {
      title: "Mes Favoris",
      emptyMessage: "Votre liste d'envies est vide.",
      buttonText: "Continuer le shopping",
      paddingY: 80
    };
  default:
    return { paddingY: 100, animation: "fade-up", title: "Nouvelle Section" };
  }
};
