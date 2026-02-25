export interface Section {
    id: string
    type: SectionType
    is_visible: boolean
    position: number
    content: Record<string, any>  // Contenu spécifique au type
    styles?: SectionStyles | null
}

export type SectionType =
    | 'hero'
    | 'product_grid'
    | 'text_block'
    | 'image_banner'
    | 'image_text'
    | 'testimonials'
    | 'newsletter'
    | 'features'
    | 'benefits'
    | 'category_grid'
    | 'footer'
    | 'header'

export interface SectionStyles {
    padding?: string
    margin?: string
    background_color?: string
    custom_css?: string
    textAlign?: 'left' | 'center' | 'right'
    textColor?: string
    height?: string
    backgroundColor?: string
}

// Helper pour créer une nouvelle section
export function createSection(type: SectionType, content: Record<string, any>): Section {
    return {
        id: crypto.randomUUID(),
        type,
        is_visible: true,
        position: 0,  // Sera recalculé à l'insertion
        content,
        styles: null
    }
}
