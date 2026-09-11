import { StoreConfig } from '@/types/store-builder';

export function generateCSSVariables(config: StoreConfig | null): string {
    if (!config) return '';

    const colors = config.colors || {};
    const typography = config.typography || {};
    const layout = config.layout || {};

    return `
    :root {
      /* Colors - Mapping to Tailwind v4 variables */
      --primary: ${colors.primary || '#00B4A2'};
      --primary-foreground: #ffffff;
      
      --secondary: ${colors.secondary || '#1a1a4e'};
      --secondary-foreground: #ffffff;
      
      --accent: ${colors.accent || '#14a3a8'};
      --accent-foreground: #ffffff;
      
      --background: ${colors.background || '#ffffff'};
      --foreground: ${colors.text || '#333333'};
      
      --muted: ${colors.muted || '#f5f5f5'};
      --muted-foreground: ${colors.textMuted || '#666666'};
      
      --border: ${colors.border || '#e0e0e0'};
      
      /* Typography */
      --font-heading: ${typography.heading_font || "'Inter', sans-serif"};
      --font-sans: ${typography.body_font || "'Inter', sans-serif"};
      
      /* Layout */
      --radius: ${layout.border_radius === 'none' ? '0px' : layout.border_radius === 'lg' ? '1rem' : layout.border_radius === 'full' ? '9999px' : '0.5rem'};
    }
  `;
}
