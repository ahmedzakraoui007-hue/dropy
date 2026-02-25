export interface ThemeCategory {
    id: string;
    label: string;
}

export interface ThemeColors {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    border: string;
    error?: string;
    success?: string;
}

export interface ThemeTypography {
    headingFont: string;
    bodyFont: string;
    baseFontSize: string;
}

export interface ThemeLayout {
    borderRadius: string;
    containerMaxWidth: string;
    borderRadiusLg?: string;
}

export interface Theme {
    id: string;
    name: string;
    description: string;
    thumbnail?: string;
    category: string;
    colors: ThemeColors;
    typography: ThemeTypography;
    layout: ThemeLayout;
    is_free?: boolean;
    defaultSections?: any[]; // JSON representation of sections
}
