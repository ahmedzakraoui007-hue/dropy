import { Theme } from '@/types/themes';

export const themes: Theme[] = [
    {
        id: 'minimal',
        name: 'Minimal',
        description: 'Design épuré et moderne avec beaucoup d\'espace blanc',
        thumbnail: '/themes/minimal-preview.png',
        category: 'modern',
        is_free: true,
        colors: {
            primary: '#000000',
            secondary: '#333333',
            accent: '#666666',
            background: '#ffffff',
            surface: '#f5f5f5',
            text: '#1a1a1a',
            textMuted: '#666666',
            border: '#e5e5e5',
        },
        typography: {
            headingFont: "'Inter', sans-serif",
            bodyFont: "'Inter', sans-serif",
            baseFontSize: '16px',
        },
        layout: {
            borderRadius: '4px',
            containerMaxWidth: '1200px',
        },
        defaultSections: [
            {
                id: crypto.randomUUID(),
                type: 'hero',
                content: {
                    title: 'Bienvenue dans notre boutique',
                    subtitle: 'Découvrez notre collection',
                    ctaText: 'Voir les produits',
                    ctaLink: '/shop/products',
                    overlay: true,
                    overlayOpacity: 0.2
                },
                is_visible: true,
                styles: {}
            },
            {
                id: crypto.randomUUID(),
                type: 'featured_products',
                content: {
                    title: 'Produits populaires',
                    count: 4,
                    columns: 4
                },
                is_visible: true,
                styles: {}
            },
        ],
    },

    {
        id: 'modern',
        name: 'Modern',
        description: 'Style contemporain avec des couleurs vives',
        thumbnail: '/themes/modern-preview.png',
        category: 'modern',
        is_free: true,
        colors: {
            primary: '#00B4A2',
            secondary: '#1a1a4e',
            accent: '#14a3a8',
            background: '#ffffff',
            surface: '#f8f9fa',
            text: '#333333',
            textMuted: '#666666',
            border: '#e0e0e0',
        },
        typography: {
            headingFont: "'Playfair Display', serif",
            bodyFont: "'DM Sans', sans-serif",
            baseFontSize: '16px',
        },
        layout: {
            borderRadius: '8px',
            containerMaxWidth: '1200px',
        },
        defaultSections: [
            { id: crypto.randomUUID(), type: 'hero', content: { title: 'Modern Living', subtitle: 'Elevate your space with our curated collection.', ctaText: 'Shop Now', ctaLink: '/shop/products', overlay: false }, is_visible: true, styles: {} },
            { id: crypto.randomUUID(), type: 'featured_products', content: { title: 'New Arrivals', count: 4, columns: 4 }, is_visible: true, styles: {} },
            { id: crypto.randomUUID(), type: 'newsletter', content: { title: 'Join the Community', subtitle: 'Get 10% off your first order.' }, is_visible: true, styles: {} }
        ],
    },

    {
        id: 'elegant',
        name: 'Elegant',
        description: 'Design sophistiqué pour les marques premium',
        thumbnail: '/themes/elegant-preview.png',
        category: 'luxury',
        is_free: false,
        colors: {
            primary: '#1a1a1a',
            secondary: '#c9a961',
            accent: '#d4af37',
            background: '#fefefe',
            surface: '#f9f9f9',
            text: '#1a1a1a',
            textMuted: '#555555',
            border: '#e8e8e8',
        },
        typography: {
            headingFont: "'Cormorant Garamond', serif",
            bodyFont: "'Lato', sans-serif",
            baseFontSize: '16px',
        },
        layout: {
            borderRadius: '0px',
            containerMaxWidth: '1100px',
        },
        defaultSections: [
            { id: crypto.randomUUID(), type: 'hero', content: { title: 'Timeless Elegance', subtitle: 'Luxury defined in every detail.', ctaText: 'Discover Collection', ctaLink: '/shop/products', overlay: true, overlayOpacity: 0.3 }, is_visible: true, styles: {} },
            { id: crypto.randomUUID(), type: 'featured_products', content: { title: 'Signature Collection', count: 3, columns: 3 }, is_visible: true, styles: {} },
            { id: crypto.randomUUID(), type: 'testimonials', content: { title: 'Client Stories' }, is_visible: true, styles: {} }
        ],
    },

    {
        id: 'bold',
        name: 'Bold',
        description: 'Design audacieux avec des couleurs vibrantes',
        thumbnail: '/themes/bold-preview.png',
        category: 'creative',
        is_free: false,
        colors: {
            primary: '#FF6B6B',
            secondary: '#4ECDC4',
            accent: '#FFE66D',
            background: '#ffffff',
            surface: '#f7f7f7',
            text: '#2d3436',
            textMuted: '#636e72',
            border: '#dfe6e9',
        },
        typography: {
            headingFont: "'Poppins', sans-serif",
            bodyFont: "'Open Sans', sans-serif",
            baseFontSize: '16px',
        },
        layout: {
            borderRadius: '12px',
            containerMaxWidth: '1280px',
        },
        defaultSections: [
            { id: crypto.randomUUID(), type: 'hero', content: { title: 'BE BOLD.', subtitle: 'Stand out from the crowd.', ctaText: 'GRAB IT', ctaLink: '/shop/products', overlay: false }, is_visible: true, styles: {} },
            { id: crypto.randomUUID(), type: 'featured_products', content: { title: 'Trending Now', count: 4, columns: 2 }, is_visible: true, styles: {} },
            { id: crypto.randomUUID(), type: 'promo_banner', content: { title: 'FLASH SALE', subtitle: '50% OFF EVERYTHING' }, is_visible: true, styles: {} }
        ],
    },

    {
        id: 'dark',
        name: 'Dark Mode',
        description: 'Thème sombre élégant',
        thumbnail: '/themes/dark-preview.png',
        category: 'dark',
        is_free: true,
        colors: {
            primary: '#00B4A2',
            secondary: '#6366f1',
            accent: '#22d3ee',
            background: '#0f0f0f',
            surface: '#1a1a1a',
            text: '#ffffff',
            textMuted: '#a0a0a0',
            border: '#2a2a2a',
        },
        typography: {
            headingFont: "'Space Grotesk', sans-serif",
            bodyFont: "'Inter', sans-serif",
            baseFontSize: '16px',
        },
        layout: {
            borderRadius: '8px',
            containerMaxWidth: '1200px',
        },
        defaultSections: [
            { id: crypto.randomUUID(), type: 'hero', content: { title: 'NEXT GEN', subtitle: 'The future of shopping is here.', ctaText: 'Explore', ctaLink: '/shop/products', overlay: true, overlayOpacity: 0.6 }, is_visible: true, styles: {} },
            { id: crypto.randomUUID(), type: 'featured_products', content: { title: 'Best Sellers', count: 4, columns: 4 }, is_visible: true, styles: {} }
        ],
    },

    {
        id: 'artisan',
        name: 'Artisan',
        description: 'Parfait pour les produits artisanaux tunisiens',
        thumbnail: '/themes/artisan-preview.png',
        category: 'traditional',
        is_free: false,
        colors: {
            primary: '#8B4513',
            secondary: '#D2691E',
            accent: '#CD853F',
            background: '#FFF8F0',
            surface: '#FAF0E6',
            text: '#3E2723',
            textMuted: '#6D4C41',
            border: '#D7CCC8',
        },
        typography: {
            headingFont: "'Amiri', serif",
            bodyFont: "'Cairo', sans-serif",
            baseFontSize: '16px',
        },
        layout: {
            borderRadius: '4px',
            containerMaxWidth: '1100px',
        },
        defaultSections: [
            { id: crypto.randomUUID(), type: 'hero', content: { title: 'Fait avec Amour', subtitle: 'Artisanat authentique et durable.', ctaText: 'Découvrir', ctaLink: '/shop/products', overlay: true, overlayOpacity: 0.2 }, is_visible: true, styles: {} },
            { id: crypto.randomUUID(), type: 'featured_products', content: { title: 'Créations Récentes', count: 3, columns: 3 }, is_visible: true, styles: {} },
            { id: crypto.randomUUID(), type: 'newsletter', content: { title: 'Restez informé', subtitle: 'Inscrivez-vous à notre newsletter.' }, is_visible: true, styles: {} }
        ],
    },


    {
        id: 'electro',
        name: 'Electro',
        description: 'Tech & High Performance',
        thumbnail: '/themes/electro-preview.png',
        category: 'modern',
        is_free: false,
        colors: {
            primary: '#0F172A', // Slate 900
            secondary: '#3B82F6', // Blue 500
            accent: '#EF4444', // Red 500
            background: '#F8FAFC', // Slate 50
            surface: '#FFFFFF',
            text: '#1E293B',
            textMuted: '#64748B',
            border: '#E2E8F0',
        },
        typography: {
            headingFont: "'Outfit', sans-serif",
            bodyFont: "'Inter', sans-serif",
            baseFontSize: '16px',
        },
        layout: {
            borderRadius: '6px',
            containerMaxWidth: '1400px',
        },
        defaultSections: [
            { id: crypto.randomUUID(), type: 'promo_banner', content: { title: 'Livraison Gratuite', description: 'Sur toute commande de plus de 200 TND' }, is_visible: true, styles: { backgroundColor: '#3B82F6' } },
            { id: crypto.randomUUID(), type: 'hero', content: { title: 'Dernière Technologie', subtitle: 'Découvrez les gadgets de demain, aujourd\'hui.', ctaText: 'Acheter Maintenant', ctaLink: '/shop/products', overlay: true, overlayOpacity: 0.7 }, is_visible: true, styles: {} },
            { id: crypto.randomUUID(), type: 'icon_grid', content: { title: 'Pourquoi Nous Choisir', columns: 3, items: [{ id: 1, icon: 'ShieldCheck', title: 'Garantie 2 Ans', description: 'Protection complète incluse.' }, { id: 2, icon: 'Truck', title: 'Livraison Express', description: '24/48h partout en Tunisie.' }, { id: 3, icon: 'Headphones', title: 'Support 7/7', description: 'Une équipe experte à votre écoute.' }] }, is_visible: true, styles: {} },
            { id: crypto.randomUUID(), type: 'categories_grid', content: { title: 'Nos Catégories', gridColumns: 3, showProductCount: true }, is_visible: true, styles: {} },
            { id: crypto.randomUUID(), type: 'featured_products', content: { title: 'Nouveautés', count: 4, columns: 4, source: 'newest' }, is_visible: true, styles: {} }
        ],
    },

    {
        id: 'glow',
        name: 'Glow',
        description: 'Beauté & Bien-être',
        thumbnail: '/themes/glow-preview.png',
        category: 'luxury',
        is_free: false,
        colors: {
            primary: '#BE185D', // Pink 700
            secondary: '#FCE7F3', // Pink 100
            accent: '#FBCFE8', // Pink 200
            background: '#FFF1F2', // Rose 50
            surface: '#FFFFFF',
            text: '#881337', // Rose 900
            textMuted: '#9D174D',
            border: '#FECDD3',
        },
        typography: {
            headingFont: "'Playfair Display', serif",
            bodyFont: "'Lato', sans-serif",
            baseFontSize: '16px',
        },
        layout: {
            borderRadius: '20px',
            containerMaxWidth: '1200px',
        },
        defaultSections: [
            { id: crypto.randomUUID(), type: 'hero', content: { title: 'Révélez Votre Éclat', subtitle: 'Soins naturels pour une peau radieuse.', ctaText: 'Voir la Collection', ctaLink: '/shop/products', overlay: false }, is_visible: true, styles: {} },
            { id: crypto.randomUUID(), type: 'icon_grid', content: { layout: 'horizontal', items: [{ id: 1, icon: 'Leaf', title: '100% Naturel', description: '' }, { id: 2, icon: 'Heart', title: 'Non testé sur animaux', description: '' }, { id: 3, icon: 'Sparkles', title: 'Résultats prouvés', description: '' }] }, is_visible: true, styles: {} },
            { id: crypto.randomUUID(), type: 'featured_products', content: { title: 'Les Indispensables', count: 3, columns: 3 }, is_visible: true, styles: {} },
            { id: crypto.randomUUID(), type: 'testimonials', content: { title: 'Elles nous font confiance' }, is_visible: true, styles: {} },
            { id: crypto.randomUUID(), type: 'newsletter', content: { title: 'Rejoignez le club Glow', subtitle: '-10% sur votre première commande.' }, is_visible: true, styles: {} }
        ],
    },

    {
        id: 'pulse',
        name: 'Pulse',
        description: 'Sport & Performance',
        thumbnail: '/themes/pulse-preview.png',
        category: 'modern',
        is_free: true,
        colors: {
            primary: '#DC2626', // Red 600
            secondary: '#171717', // Neutral 900
            accent: '#EF4444', // Red 500
            background: '#0A0A0A', // Neutral 950
            surface: '#171717', // Neutral 900
            text: '#FFFFFF',
            textMuted: '#A3A3A3',
            border: '#404040',
        },
        typography: {
            headingFont: "'Teko', sans-serif",
            bodyFont: "'Roboto Condensed', sans-serif",
            baseFontSize: '18px',
        },
        layout: {
            borderRadius: '0px',
            containerMaxWidth: '100%',
        },
        defaultSections: [
            { id: crypto.randomUUID(), type: 'hero', content: { title: 'DOMINEZ LE JEU', subtitle: 'Équipement pro pour athlètes exigeants.', ctaText: 'SHOPPER MAINTENANT', ctaLink: '/shop/products', overlay: true, overlayOpacity: 0.5 }, is_visible: true, styles: {} },
            { id: crypto.randomUUID(), type: 'categories_grid', content: { title: 'PAR SPORT', gridColumns: 4 }, is_visible: true, styles: {} },
            { id: crypto.randomUUID(), type: 'promo_banner', content: { title: 'SUMMER SALE', description: 'JUSQU\'À -50% SUR TOUT LE SITE', ctaText: 'PROFITER', backgroundColor: '#DC2626', textColor: '#FFFFFF' }, is_visible: true, styles: {} },
            { id: crypto.randomUUID(), type: 'featured_products', content: { title: 'TRENDING NOW', count: 4, columns: 4 }, is_visible: true, styles: {} }
        ],
    },
];

export function getThemeById(id: string): Theme | undefined {
    return themes.find(theme => theme.id === id);
}

export function getThemesByCategory(category: string): Theme[] {
    return themes.filter(theme => theme.category === category);
}
