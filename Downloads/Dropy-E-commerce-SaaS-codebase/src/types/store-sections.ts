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
    | 'featured_products'
    | 'recommended_products'
    | 'text_block'
    | 'image_banner'
    | 'image_text'
    | 'image_with_text'
    | 'testimonials'
    | 'newsletter'
    | 'features'
    | 'benefits'
    | 'category_grid'
    | 'categories'
    | 'collection_grid'
    | 'promo_banner'
    | 'countdown'
    | 'banner'
    | 'pricing'
    | 'wishlist'
    | 'checkout'
    | 'video'
    | 'rich_text'
    | 'about_preview'
    | 'process_steps'
    | 'stats'
    | 'team'
    | 'brand_logos'
    | 'instagram_feed'
    | 'faq_preview'
    | 'contact'
    | 'shipping_policy'
    | 'refund_policy'
    | 'privacy_policy'
    | 'terms_conditions'
    | 'trust_badges'
    | 'blog_preview'
    | 'faq'
    | 'blog'
    | 'about'
    | 'collections'
    | 'product_detail'
    | 'product_compare'
    | 'spacer'
    | 'custom_html'
    | 'mega_menu'
    | 'divider'
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
