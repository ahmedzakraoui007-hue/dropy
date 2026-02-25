// src/app/shop/[vendor-slug]/[...slug]/page.tsx

import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SectionRenderer from '@/components/store/SectionRenderer'

export default async function StoreDynamicPage({ 
  params 
}: { 
  params: { 'vendor-slug': string, slug: string[] } 
}) {
  const { 'vendor-slug': vendorSlug, slug } = await params
  const supabase = await createClient()
  const pageSlug = slug.join('/')
  
  // Récupérer le store
  const { data: store } = await supabase
    .from('stores')
    .select('*')
    .eq('slug', vendorSlug)
    .single()
  
  if (!store) notFound()
  
  // Récupérer la page et ses sections
  const { data: page } = await supabase
    .from('store_pages')
    .select(`
      *,
      sections:store_sections(*)
    `)
    .eq('store_id', store.id)
    .eq('slug', pageSlug)
    .single()
  
  if (!page) notFound()
  
  // Trier les sections par ordre
  const sections = (page.sections || []).sort((a: any, b: any) => a.display_order - b.display_order)
  
  return (
    <div className={`store-page page-${page.page_type}`}>
      {sections.map((section: any) => (
        <SectionRenderer 
          key={section.id} 
          section={section} 
        />
      ))}
    </div>
  )
}
