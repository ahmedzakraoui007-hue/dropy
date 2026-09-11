// src/types/store-builder.ts

// ===== THÈMES =====
export type ThemeCategory = 'fashion' | 'electronics' | 'beauty' | 'food' | 'sports' | 'home' | 'kids' | 'general';
export type ThemeStyle = 'minimal' | 'bold' | 'elegant' | 'playful' | 'modern' | 'classic' | 'luxury' | 'urban';

export interface Theme {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  thumbnail_url: string;
  preview_url: string | null;
  category: ThemeCategory;
  style: ThemeStyle;
  default_config: ThemeConfig;
  default_pages: DefaultPage[];
  available_sections: SectionType[];
  is_free: boolean;
  is_featured: boolean;
}

export interface DefaultPage {
  slug: string;
  title: string;
  type?: PageType;
  is_homepage?: boolean;
  sections?: any[]; // Allow sections definition in seed data
}

// ===== CONFIGURATION =====
export interface ThemeConfig {
  colors: ColorConfig;
  typography: TypographyConfig;
  layout: LayoutConfig;
  header: HeaderConfig;
  footer: FooterConfig;
}

export interface ColorConfig {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  muted: string;
  textMuted?: string;
  border?: string;
}

export interface TypographyConfig {
  heading_font: string;
  body_font: string;
  base_size: number;
  scale_ratio: number;
}

export interface LayoutConfig {
  container_width: number;
  border_radius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  spacing: 'compact' | 'comfortable' | 'relaxed';
  product_card_style?: 'minimal' | 'bordered' | 'shadow' | 'overlay';
}

export interface HeaderConfig {
  style: 'standard' | 'centered' | 'minimal' | 'split';
  sticky: boolean;
  transparent_on_hero: boolean;
  show_search: boolean;
  show_cart: boolean;
  show_announcement: boolean;
  announcement_text?: string;
  announcement_link?: string;
  announcement_bg?: string;
  announcement_text_color?: string;
}

export interface FooterConfig {
  style: 'simple' | 'multi_column' | 'centered' | 'minimal';
  show_newsletter: boolean;
  newsletter_title?: string;
  newsletter_text?: string;
  show_social: boolean;
  show_payment_icons: boolean;
  copyright_text?: string;
  columns?: FooterColumn[];
}

export interface FooterColumn {
  title: string;
  links: { label: string; href: string }[];
}

// ===== STORE CONFIG =====
export interface StoreConfig {
  id: string;
  seller_id: string;
  theme_id: string | null;
  store_name: string;
  store_slug: string;
  store_tagline: string | null;
  logo_url: string | null;
  logo_dark_url: string | null;
  favicon_url: string | null;
  colors: Partial<ColorConfig>;
  typography: Partial<TypographyConfig>;
  layout: Partial<LayoutConfig>;
  header_config: Partial<HeaderConfig>;
  footer_config: Partial<FooterConfig>;
  social_links: SocialLinks;
  contact_info: ContactInfo;
  seo_config: SEOConfig;
  custom_css: string | null;
  is_published: boolean;
  published_at: string | null;
}

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  whatsapp?: string;
  twitter?: string;
  youtube?: string;
}

export interface ContactInfo {
  email?: string;
  phone?: string;
  address?: string;
  working_hours?: string;
}

export interface SEOConfig {
  default_title_suffix?: string;
  meta_description?: string;
  og_image?: string;
  google_analytics_id?: string;
  facebook_pixel_id?: string;
}

// ===== PAGES =====
export type PageType = 'homepage' | 'catalog' | 'content' | 'contact' | 'faq' | 'legal' | 'custom';

export interface StorePage {
  id: string;
  seller_id: string;
  slug: string;
  title: string;
  page_type: PageType;
  sections: PageSection[];
  content_html: string | null;
  faq_items: FAQItem[];
  seo_title: string | null;
  seo_description: string | null;
  seo_image: string | null;
  no_index: boolean;
  is_published: boolean;
  is_homepage: boolean;
  is_system: boolean;
  show_in_navigation: boolean;
  sort_order: number;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

// ===== SECTIONS =====
import { Section, SectionType } from './store-sections';
export type { SectionType };

export type PageSection = Section;

// Section Data Types
export interface HeroSectionData {
  style: 'fullscreen' | 'split' | 'minimal' | 'video';
  background_type: 'image' | 'video' | 'color';
  background_image?: string;
  background_video?: string;
  background_color?: string;
  overlay_opacity: number;
  title: string;
  subtitle?: string;
  cta_text?: string;
  cta_link?: string;
  cta_style?: 'primary' | 'secondary' | 'outline';
  secondary_cta_text?: string;
  secondary_cta_link?: string;
  text_alignment: 'left' | 'center' | 'right';
  text_color: 'light' | 'dark';
  height: 'full' | 'large' | 'medium' | 'small';
}

export interface FeaturedProductsSectionData {
  title: string;
  subtitle?: string;
  display: 'grid' | 'carousel' | 'list';
  columns: 2 | 3 | 4 | 5;
  count: number;
  source: 'newest' | 'bestsellers' | 'featured' | 'sale' | 'manual';
  product_ids?: string[]; // Si source = 'manual'
  show_view_all: boolean;
  view_all_link?: string;
}

export interface CategoriesSectionData {
  title: string;
  subtitle?: string;
  display: 'grid' | 'carousel' | 'list';
  style: 'card' | 'overlay' | 'minimal';
  columns: 2 | 3 | 4 | 6;
  categories: {
    id: string;
    name: string;
    image: string;
    link: string;
  }[];
}

export interface BenefitsSectionData {
  title?: string;
  display: 'row' | 'grid';
  items: {
    icon: string; // Lucide icon name
    title: string;
    description: string;
  }[];
}

export interface TestimonialsSectionData {
  title: string;
  subtitle?: string;
  display: 'carousel' | 'grid' | 'masonry';
  testimonials: {
    id: string;
    name: string;
    avatar?: string;
    rating: number;
    text: string;
    product?: string;
  }[];
}

export interface NewsletterSectionData {
  title: string;
  subtitle?: string;
  background_type: 'color' | 'image';
  background_color?: string;
  background_image?: string;
  button_text: string;
  success_message: string;
}

export interface BannerSectionData {
  style: 'full' | 'contained';
  background_type: 'color' | 'image' | 'gradient';
  background_color?: string;
  background_image?: string;
  gradient_from?: string;
  gradient_to?: string;
  title: string;
  subtitle?: string;
  cta_text?: string;
  cta_link?: string;
  text_color: 'light' | 'dark';
}

export interface CountdownSectionData {
  title: string;
  subtitle?: string;
  end_date: string; // ISO date
  background_color?: string;
  cta_text?: string;
  cta_link?: string;
  expired_message: string;
}

export interface ImageWithTextSectionData {
  layout: 'image_left' | 'image_right';
  image: string;
  title: string;
  text: string;
  cta_text?: string;
  cta_link?: string;
}

export interface VideoSectionData {
  title?: string;
  video_type: 'youtube' | 'vimeo' | 'upload';
  video_url: string;
  thumbnail?: string;
  autoplay: boolean;
  full_width: boolean;
}

export interface RichTextSectionData {
  content: string; // HTML
  max_width: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  alignment: 'left' | 'center' | 'right';
}

export type SectionData = Record<string, any>;

// ===== NAVIGATION =====
export interface MenuItem {
  id: string;
  label: string;
  type: 'page' | 'category' | 'product' | 'external' | 'dropdown';
  value: string;
  open_new_tab?: boolean;
  children?: MenuItem[];
}

export interface StoreMenu {
  id: string;
  seller_id: string;
  location: 'header' | 'footer' | 'mobile';
  items: MenuItem[];
}

export interface StoreBuilderChecklist {
  design: {
    completed: boolean;
    details: {
      hasLogo: boolean;
      hasColors: boolean;
      hasHero: boolean;
    };
  };
  pages: {
    completed: boolean;
    count: number;
    hasHomepage: boolean;
  };
  navigation: {
    completed: boolean;
    headerCount: number;
    footerCount: number;
  };
  domain: {
    completed: boolean;
    domain: string | null;
    isVerified: boolean;
  };
  overall: number;
}

export type NavigationItem = MenuItem;

export interface StoreSettings extends Partial<StoreConfig> {
  primary_color?: string;
  font_heading?: string;
}

// ===== MÉDIA =====
export interface StoreMedia {
  id: string;
  filename: string;
  file_url: string;
  file_type: 'image' | 'video';
  file_size: number;
  width?: number;
  height?: number;
  alt_text?: string;
  folder: string;
  created_at: string;
}

// ===== DOMAINE =====
export interface StoreDomain {
  id: string;
  seller_id: string;
  domain: string;
  domain_type: 'subdomain' | 'custom';
  verification_token: string | null;
  is_verified: boolean;
  verified_at: string | null;
  ssl_status: 'pending' | 'provisioning' | 'active' | 'error';
  ssl_expires_at: string | null;
  is_primary: boolean;
  is_active: boolean;
  required_dns_records: DNSRecord[];
}

export interface DNSRecord {
  type: 'A' | 'CNAME' | 'TXT';
  name: string;
  value: string;
}
