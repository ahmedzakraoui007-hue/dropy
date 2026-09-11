// src/app/shop/[vendor-slug]/page.tsx

import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SectionRenderer from '@/components/store/SectionRenderer'

export default async function StoreHomepage({
  params
}: {
  params: Promise<{ storeSlug: string }>
}) {
  const { storeSlug } = await params
  const supabase = await createClient()

  // Récupérer le store config pour avoir le bon ID si besoin, ou via stores table
  // On utilise store_configs pour la cohérence
  const { data: storeConfig } = await supabase
    .from('store_configs')
    .select('*, seller:seller_profiles(*)')
    .eq('store_slug', storeSlug)
    .single()

  if (!storeConfig) notFound()

  // Need seller_id for pages
  const sellerId = storeConfig.seller_id;

  // Récupérer la page d'accueil et ses sections
  const { data: page } = await supabase
    .from('store_pages')
    .select('*')
    .eq('seller_id', sellerId)
    .eq('page_type', 'homepage')
    .single()

  if (!page) notFound()

  // Trier les sections par ordre
  const sections = (page.sections || []).sort((a: any, b: any) => a.display_order - b.display_order)

  return (
    <div className="store-homepage">
      {sections.map((section: any) => (
        <SectionRenderer
          key={section.id}
          section={section}
          storeId={storeConfig.id} // Passing store_config ID
        />
      ))}
    </div>
  )
}
