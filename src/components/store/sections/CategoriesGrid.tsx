// src/components/store/sections/CategoriesGrid.tsx
'use client'

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"

interface CategoriesGridProps {
  content: {
    title: string
    subtitle?: string
    layout?: 'grid' | 'carousel'
    gridColumns?: number
    showImageBg?: boolean
    showProductCount?: boolean
  }
  styles?: Record<string, any>
}

export default function CategoriesGrid({ content, styles }: CategoriesGridProps) {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .limit(6)

      if (data) setCategories(data)
      setLoading(false)
    }
    fetchCategories()
  }, [])

  if (loading) return null

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-2">{content.title}</h2>
        {content.subtitle && <p className="text-gray-600">{content.subtitle}</p>}
      </div>

      <div className={`grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-${content.gridColumns || 3}`}>
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/shop/category/${category.id}`}
            className="group relative h-72 rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500"
          >
            <Image
              src={category.image_url || '/placeholder-category.jpg'}
              alt={category.name}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-700"
            />
            <div className={`absolute inset-0 bg-gradient-to-t from-[var(--color-primary)]/80 via-transparent to-transparent opacity-90 transition-opacity`} />

            <div className="absolute inset-0 flex flex-col justify-end p-6">
              <h3 className="text-3xl font-bold mb-2 text-white translate-y-2 group-hover:translate-y-0 transition-transform">{category.name}</h3>
              {content.showProductCount && (
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity delay-100">
                  <div className="h-1 w-8 bg-[var(--color-accent)] rounded-full"></div>
                  <span className="text-sm text-white/90 font-medium">Voir la collection</span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
