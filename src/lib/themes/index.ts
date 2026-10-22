import { Theme } from '@/types/themes';
import { buildHomeSections } from './home-sections';

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
        defaultSections: buildHomeSections('general'),
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
        defaultSections: buildHomeSections('home'),
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
        defaultSections: buildHomeSections('jewelry'),
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
        defaultSections: buildHomeSections('streetwear'),
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
        defaultSections: buildHomeSections('tech'),
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
        defaultSections: buildHomeSections('craft'),
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
        defaultSections: buildHomeSections('electronics'),
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
        defaultSections: buildHomeSections('beauty'),
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
        defaultSections: buildHomeSections('sport'),
    },
];

export function getThemeById(id: string): Theme | undefined {
    return themes.find(theme => theme.id === id);
}

export function getThemesByCategory(category: string): Theme[] {
    return themes.filter(theme => theme.category === category);
}
