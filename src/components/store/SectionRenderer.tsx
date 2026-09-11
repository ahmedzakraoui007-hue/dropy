import { Section } from '@/types/store-sections'
import HeroBanner from './sections/HeroBanner'
import FeaturedProducts from './sections/FeaturedProducts'
import CategoriesGrid from './sections/CategoriesGrid'
import PromoBanner from './sections/PromoBanner'
import Testimonials from './sections/Testimonials'
import IconGrid from './sections/IconGrid'
import Newsletter from './sections/Newsletter'

const SECTION_COMPONENTS: Record<string, React.ComponentType<any>> = {
  hero: HeroBanner,
  featured_products: FeaturedProducts,
  product_grid: FeaturedProducts, // Alias
  categories: CategoriesGrid,     // Alias
  categories_grid: CategoriesGrid,
  category_grid: CategoriesGrid,
  promo_banner: PromoBanner,
  testimonials: Testimonials,
  benefits: IconGrid,
  icon_grid: IconGrid,
  newsletter: Newsletter,
}

interface SectionRendererProps {
  section: Section
  isPreview?: boolean
  storeId?: string
}

export default function SectionRenderer({ section, isPreview = false, storeId }: SectionRendererProps) {
  const { type, content, is_visible, styles } = section

  if (!is_visible && !isPreview) return null

  const SectionComponent = SECTION_COMPONENTS[type]

  if (!SectionComponent) {
    console.warn(`Section type unknown: ${type}`)
    return (
      <div className="p-8 border-2 border-dashed border-gray-200 text-center text-gray-400">
        Section type "{type}" not implemented yet
      </div>
    )
  }

  return (
    <div
      id={`section-${section.id}`}
      style={{
        backgroundColor: styles?.backgroundColor,
        padding: styles?.padding,
        margin: styles?.margin,
        color: styles?.textColor,
        textAlign: styles?.textAlign,
        minHeight: styles?.height,
        ...styles?.custom_css ? JSON.parse(styles.custom_css || '{}') : {}
      }}
      data-section-type={type}
    >
      <SectionComponent
        content={content}
        styles={styles}
        isPreview={isPreview}
        storeId={storeId}
      />
    </div>
  )
}
