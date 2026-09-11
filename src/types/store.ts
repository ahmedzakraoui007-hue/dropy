// src/types/store.ts

export type PageType = 
  | 'homepage' 
  | 'products' 
  | 'product_detail' 
  | 'about' 
  | 'contact' 
  | 'cart' 
  | 'checkout' 
  | 'order_confirmation'

export type SectionType =
  | 'hero_banner'
  | 'featured_products'
  | 'categories_grid'
  | 'promo_banner'
  | 'testimonials'
  | 'icon_grid'
  | 'newsletter'
  | 'page_header'
  | 'products_listing'
  | 'product_details'
  | 'product_tabs'
  | 'related_products'
  | 'text_with_image'
  | 'team_grid'
  | 'contact_form'
  | 'cart_items'
  | 'product_recommendations'
  | 'checkout_form'
  | 'order_confirmation'
  | 'info_cards'

export interface Store {
  id: string
  vendor_id: string
  name: string
  slug: string
  description?: string
  logo_url?: string
  theme: string
  primary_color: string
  secondary_color: string
  status: 'draft' | 'published'
  is_active: boolean
  published_at?: string
  created_at: string
  updated_at: string
}

export interface StorePage {
  id: string
  store_id: string
  slug: string
  title: string
  page_type: PageType
  is_published: boolean
  is_visible_in_menu: boolean
  is_system_page: boolean
  menu_order: number
  sections?: StoreSection[]
}

export interface StoreSection {
  id: string
  store_page_id: string
  section_type: SectionType
  name: string
  display_order: number
  is_visible: boolean
  is_locked: boolean
  content: Record<string, any>
  styles: {
    backgroundColor?: string
    padding?: string
    margin?: string
    textAlign?: 'left' | 'center' | 'right'
    textColor?: string
    height?: string
  }
  animation?: 'fade-in' | 'slide-up' | 'none'
  visible_on: Array<'desktop' | 'tablet' | 'mobile'>
}

export interface SectionTemplate {
  id: string
  section_type: SectionType
  name: string
  description: string
  category: string
  thumbnail_url?: string
  default_content: Record<string, any>
  default_styles: Record<string, any>
  content_schema: Record<string, any>
  is_active: boolean
  is_premium: boolean
}
