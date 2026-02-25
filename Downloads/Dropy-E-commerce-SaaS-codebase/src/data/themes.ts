// src/data/themes.ts
import { Theme, ThemeConfig, ColorConfig, TypographyConfig, LayoutConfig, HeaderConfig, FooterConfig } from '@/types/store-builder';

export const PREDEFINED_THEMES: Omit<Theme, 'id'>[] = [
  // ===== THÈME 1: MINIMAL ELEGANCE =====
  {
    name: 'Minimal Elegance',
    slug: 'minimal-elegance',
    description: 'Design épuré et sophistiqué, parfait pour les marques de mode et lifestyle',
    thumbnail_url: '/themes/minimal-elegance.jpg',
    preview_url: null,
    category: 'fashion',
    style: 'minimal',
    is_free: true,
    is_featured: true,
    default_config: {
      colors: {
        primary: '#18181b',
        secondary: '#fafafa',
        accent: '#a1a1aa',
        background: '#ffffff',
        text: '#18181b',
        muted: '#71717a'
      },
      typography: {
        heading_font: 'Cormorant Garamond',
        body_font: 'Karla',
        base_size: 16,
        scale_ratio: 1.25
      },
      layout: {
        container_width: 1200,
        border_radius: 'none',
        spacing: 'relaxed',
        product_card_style: 'minimal'
      },
      header: {
        style: 'centered',
        sticky: true,
        transparent_on_hero: true,
        show_search: true,
        show_cart: true,
        show_announcement: false
      },
      footer: {
        style: 'minimal',
        show_newsletter: true,
        newsletter_title: 'Newsletter',
        newsletter_text: 'Inscrivez-vous pour recevoir nos actualités',
        show_social: true,
        show_payment_icons: true
      }
    } as ThemeConfig,
    default_pages: [
      { slug: 'home', title: 'Accueil', is_homepage: true },
      { slug: 'products', title: 'Collection', type: 'catalog' },
      { slug: 'about', title: 'Notre Histoire', type: 'content' },
      { slug: 'contact', title: 'Contact', type: 'contact' },
      { slug: 'faq', title: 'FAQ', type: 'faq' },
      { slug: 'cgv', title: 'CGV', type: 'legal' }
    ],
    available_sections: [
      'hero', 'featured_products', 'image_with_text', 'categories',
      'testimonials', 'newsletter', 'instagram_feed', 'rich_text'
    ]
  },

  // ===== THÈME 2: BOLD STREET =====
  {
    name: 'Bold Street',
    slug: 'bold-street',
    description: 'Style urbain et audacieux, idéal pour le streetwear et les marques jeunes',
    thumbnail_url: '/themes/bold-street.jpg',
    preview_url: null,
    category: 'fashion',
    style: 'urban',
    is_free: true,
    is_featured: true,
    default_config: {
      colors: {
        primary: '#000000',
        secondary: '#ffffff',
        accent: '#ef4444',
        background: '#0a0a0a',
        text: '#fafafa',
        muted: '#a3a3a3'
      },
      typography: {
        heading_font: 'Space Grotesk',
        body_font: 'DM Sans',
        base_size: 16,
        scale_ratio: 1.333
      },
      layout: {
        container_width: 1400,
        border_radius: 'sm',
        spacing: 'compact',
        product_card_style: 'overlay'
      },
      header: {
        style: 'standard',
        sticky: true,
        transparent_on_hero: true,
        show_search: true,
        show_cart: true,
        show_announcement: true,
        announcement_text: '🔥 SOLDES -30% | Code: STREET30',
        announcement_bg: '#ef4444',
        announcement_text_color: '#ffffff'
      },
      footer: {
        style: 'multi_column',
        show_newsletter: true,
        newsletter_title: 'JOIN THE CREW',
        newsletter_text: 'Drops exclusifs et accès early',
        show_social: true,
        show_payment_icons: true
      }
    } as ThemeConfig,
    default_pages: [
      { slug: 'home', title: 'Home', is_homepage: true },
      { slug: 'products', title: 'Shop', type: 'catalog' },
      { slug: 'drops', title: 'New Drops', type: 'catalog' },
      { slug: 'about', title: 'About', type: 'content' },
      { slug: 'contact', title: 'Contact', type: 'contact' },
      { slug: 'faq', title: 'FAQ', type: 'faq' }
    ],
    available_sections: [
      'hero', 'featured_products', 'countdown', 'categories', 'video',
      'banner', 'testimonials', 'newsletter', 'instagram_feed', 'brand_logos'
    ]
  },

  // ===== THÈME 3: ROSE BEAUTY =====
  {
    name: 'Rose Beauty',
    slug: 'rose-beauty',
    description: 'Esthétique douce et féminine, conçu pour les cosmétiques et soins',
    thumbnail_url: '/themes/rose-beauty.jpg',
    preview_url: null,
    category: 'beauty',
    style: 'elegant',
    is_free: true,
    is_featured: false,
    default_config: {
      colors: {
        primary: '#be185d',
        secondary: '#fdf2f8',
        accent: '#ec4899',
        background: '#fffbfc',
        text: '#1f2937',
        muted: '#9ca3af'
      },
      typography: {
        heading_font: 'Playfair Display',
        body_font: 'Nunito Sans',
        base_size: 16,
        scale_ratio: 1.2
      },
      layout: {
        container_width: 1280,
        border_radius: 'xl',
        spacing: 'comfortable',
        product_card_style: 'shadow'
      },
      header: {
        style: 'centered',
        sticky: true,
        transparent_on_hero: false,
        show_search: true,
        show_cart: true,
        show_announcement: true,
        announcement_text: '✨ Livraison offerte dès 80 TND',
        announcement_bg: '#fdf2f8',
        announcement_text_color: '#be185d'
      },
      footer: {
        style: 'multi_column',
        show_newsletter: true,
        newsletter_title: 'Rejoignez notre communauté',
        newsletter_text: 'Conseils beauté et offres exclusives',
        show_social: true,
        show_payment_icons: true
      }
    } as ThemeConfig,
    default_pages: [
      { slug: 'home', title: 'Accueil', is_homepage: true },
      { slug: 'products', title: 'Nos Produits', type: 'catalog' },
      { slug: 'routines', title: 'Routines', type: 'content' },
      { slug: 'about', title: 'Notre Marque', type: 'content' },
      { slug: 'contact', title: 'Contact', type: 'contact' },
      { slug: 'faq', title: 'FAQ', type: 'faq' }
    ],
    available_sections: [
      'hero', 'featured_products', 'categories', 'benefits', 'testimonials',
      'image_with_text', 'video', 'newsletter', 'instagram_feed', 'faq_preview'
    ]
  },

  // ===== THÈME 4: TECHNO =====
  {
    name: 'Techno',
    slug: 'techno',
    description: 'Design futuriste et high-tech pour électronique et gadgets',
    thumbnail_url: '/themes/techno.jpg',
    preview_url: null,
    category: 'electronics',
    style: 'modern',
    is_free: true,
    is_featured: false,
    default_config: {
      colors: {
        primary: '#3b82f6',
        secondary: '#1e293b',
        accent: '#22d3ee',
        background: '#0f172a',
        text: '#f1f5f9',
        muted: '#94a3b8'
      },
      typography: {
        heading_font: 'Inter',
        body_font: 'Inter',
        base_size: 15,
        scale_ratio: 1.25
      },
      layout: {
        container_width: 1400,
        border_radius: 'lg',
        spacing: 'comfortable',
        product_card_style: 'bordered'
      },
      header: {
        style: 'standard',
        sticky: true,
        transparent_on_hero: false,
        show_search: true,
        show_cart: true,
        show_announcement: true,
        announcement_text: '🚀 Nouveautés Tech | Livraison Express',
        announcement_bg: '#1e293b',
        announcement_text_color: '#22d3ee'
      },
      footer: {
        style: 'multi_column',
        show_newsletter: true,
        newsletter_title: 'Tech News',
        newsletter_text: 'Les dernières innovations dans votre inbox',
        show_social: true,
        show_payment_icons: true
      }
    } as ThemeConfig,
    default_pages: [
      { slug: 'home', title: 'Accueil', is_homepage: true },
      { slug: 'products', title: 'Tous les Produits', type: 'catalog' },
      { slug: 'nouveautes', title: 'Nouveautés', type: 'catalog' },
      { slug: 'about', title: 'À Propos', type: 'content' },
      { slug: 'contact', title: 'Support', type: 'contact' },
      { slug: 'faq', title: 'FAQ', type: 'faq' }
    ],
    available_sections: [
      'hero', 'featured_products', 'categories', 'benefits', 'product_grid',
      'banner', 'video', 'countdown', 'newsletter', 'faq_preview'
    ]
  },

  // ===== THÈME 5: FLAVOR =====
  {
    name: 'Flavor',
    slug: 'flavor',
    description: 'Thème gourmand et chaleureux pour l\'alimentaire et la restauration',
    thumbnail_url: '/themes/flavor.jpg',
    preview_url: null,
    category: 'food',
    style: 'playful',
    is_free: true,
    is_featured: false,
    default_config: {
      colors: {
        primary: '#ea580c',
        secondary: '#fef3c7',
        accent: '#16a34a',
        background: '#fffbeb',
        text: '#292524',
        muted: '#78716c'
      },
      typography: {
        heading_font: 'Fraunces',
        body_font: 'Source Sans Pro',
        base_size: 17,
        scale_ratio: 1.2
      },
      layout: {
        container_width: 1200,
        border_radius: 'lg',
        spacing: 'relaxed',
        product_card_style: 'shadow'
      },
      header: {
        style: 'split',
        sticky: true,
        transparent_on_hero: false,
        show_search: true,
        show_cart: true,
        show_announcement: true,
        announcement_text: '🍕 -15% sur votre 1ère commande | Code: YUMMY',
        announcement_bg: '#ea580c',
        announcement_text_color: '#ffffff'
      },
      footer: {
        style: 'multi_column',
        show_newsletter: true,
        newsletter_title: 'Nos recettes secrètes',
        newsletter_text: 'Recevez nos meilleures offres',
        show_social: true,
        show_payment_icons: true
      }
    } as ThemeConfig,
    default_pages: [
      { slug: 'home', title: 'Accueil', is_homepage: true },
      { slug: 'products', title: 'Notre Carte', type: 'catalog' },
      { slug: 'about', title: 'Notre Histoire', type: 'content' },
      { slug: 'contact', title: 'Commander', type: 'contact' },
      { slug: 'faq', title: 'FAQ', type: 'faq' }
    ],
    available_sections: [
      'hero', 'featured_products', 'categories', 'benefits', 'testimonials',
      'image_with_text', 'banner', 'newsletter', 'instagram_feed'
    ]
  },

  // ===== THÈME 6: LUXE NOIR =====
  {
    name: 'Luxe Noir',
    slug: 'luxe-noir',
    description: 'Élégance premium et luxueuse, pour les marques haut de gamme',
    thumbnail_url: '/themes/luxe-noir.jpg',
    preview_url: null,
    category: 'fashion',
    style: 'luxury',
    is_free: false,
    is_featured: true,
    default_config: {
      colors: {
        primary: '#d4af37',
        secondary: '#1a1a1a',
        accent: '#d4af37',
        background: '#0d0d0d',
        text: '#f5f5f5',
        muted: '#737373'
      },
      typography: {
        heading_font: 'Cinzel',
        body_font: 'Raleway',
        base_size: 16,
        scale_ratio: 1.333
      },
      layout: {
        container_width: 1400,
        border_radius: 'none',
        spacing: 'relaxed',
        product_card_style: 'minimal'
      },
      header: {
        style: 'centered',
        sticky: true,
        transparent_on_hero: true,
        show_search: true,
        show_cart: true,
        show_announcement: false
      },
      footer: {
        style: 'minimal',
        show_newsletter: true,
        newsletter_title: 'Privilèges Exclusifs',
        newsletter_text: 'Accédez aux ventes privées',
        show_social: true,
        show_payment_icons: true
      }
    } as ThemeConfig,
    default_pages: [
      { slug: 'home', title: 'Maison', is_homepage: true },
      { slug: 'products', title: 'Collections', type: 'catalog' },
      { slug: 'about', title: 'Maison', type: 'content' },
      { slug: 'contact', title: 'Concierge', type: 'contact' },
      { slug: 'faq', title: 'Services', type: 'faq' }
    ],
    available_sections: [
      'hero', 'featured_products', 'image_with_text', 'video', 'categories',
      'testimonials', 'newsletter', 'rich_text', 'divider'
    ]
  }
];

// ===== FONTES DISPONIBLES =====
export const AVAILABLE_FONTS = {
  headings: [
    { name: 'Cormorant Garamond', category: 'serif' },
    { name: 'Playfair Display', category: 'serif' },
    { name: 'Cinzel', category: 'serif' },
    { name: 'Fraunces', category: 'serif' },
    { name: 'Space Grotesk', category: 'sans-serif' },
    { name: 'Plus Jakarta Sans', category: 'sans-serif' },
    { name: 'Inter', category: 'sans-serif' },
    { name: 'Outfit', category: 'sans-serif' },
    { name: 'Syne', category: 'sans-serif' },
    { name: 'Cabinet Grotesk', category: 'sans-serif' },
    { name: 'Clash Display', category: 'sans-serif' },
    { name: 'Satoshi', category: 'sans-serif' },
    // Arabe
    { name: 'Tajawal', category: 'arabic' },
    { name: 'Cairo', category: 'arabic' },
    { name: 'Almarai', category: 'arabic' }
  ],
  body: [
    { name: 'Karla', category: 'sans-serif' },
    { name: 'DM Sans', category: 'sans-serif' },
    { name: 'Nunito Sans', category: 'sans-serif' },
    { name: 'Inter', category: 'sans-serif' },
    { name: 'Lato', category: 'sans-serif' },
    { name: 'Source Sans Pro', category: 'sans-serif' },
    { name: 'Raleway', category: 'sans-serif' },
    { name: 'Work Sans', category: 'sans-serif' },
    // Arabe
    { name: 'Tajawal', category: 'arabic' },
    { name: 'Cairo', category: 'arabic' },
    { name: 'Almarai', category: 'arabic' }
  ]
};

// ===== PRESET COULEURS =====
export const COLOR_PRESETS = [
  { name: 'Noir & Blanc', primary: '#000000', accent: '#000000', background: '#ffffff' },
  { name: 'Océan', primary: '#0ea5e9', accent: '#22d3ee', background: '#f0f9ff' },
  { name: 'Forêt', primary: '#16a34a', accent: '#22c55e', background: '#f0fdf4' },
  { name: 'Corail', primary: '#f43f5e', accent: '#fb7185', background: '#fff1f2' },
  { name: 'Lavande', primary: '#8b5cf6', accent: '#a78bfa', background: '#faf5ff' },
  { name: 'Sable', primary: '#d97706', accent: '#f59e0b', background: '#fffbeb' },
  { name: 'Nuit', primary: '#6366f1', accent: '#818cf8', background: '#0f172a' },
  { name: 'Rose Gold', primary: '#be185d', accent: '#ec4899', background: '#fdf2f8' }
];
