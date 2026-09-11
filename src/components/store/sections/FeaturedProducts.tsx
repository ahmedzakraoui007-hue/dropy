// src/components/store/sections/FeaturedProducts.tsx
'use client'

import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useCart } from "@/context/CartContext"

interface FeaturedProductsProps {
  content: {
    title: string
    subtitle?: string
    count?: number
    columns?: number
    source?: 'newest' | 'bestsellers' | 'sale' | 'featured' | 'manual' | 'category'
    category_id?: string
    product_ids?: string[]
    show_view_all?: boolean
    view_all_link?: string
    showPrice?: boolean
    showAddToCart?: boolean
  }
  styles?: Record<string, any>
  storeId?: string
}

export default function FeaturedProducts({ content, styles, storeId }: FeaturedProductsProps) {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const { addItem } = useCart()

  useEffect(() => {
    async function fetchProducts() {
      if (!storeId) {
        setLoading(false)
        return
      }

      let query = supabase
        .from('store_products')
        .select(`
          *,
          product:products(*)
        `)
        .eq('store_id', storeId)
        .eq('is_active', true)

      // Apply source filters
      if (content.source === 'newest') {
        // query = query.order('created_at', { ascending: false }) // Column might be missing on store_products
      } else if (content.source === 'sale') {
        // Assume compare_at_price > selling_price logic
        // This might need a complex filter or just fetch and filter in JS if not simple
      } else if (content.source === 'category' && content.category_id) {
        query = query.eq('category_id', content.category_id)
      } else if (content.source === 'manual' && content.product_ids?.length) {
        query = query.in('product_id', content.product_ids)
      }

      const { data } = await query.limit(content.count || 8)

      if (data) {
        setProducts(data.map(item => ({
          ...item,
          name: item.name || item.product?.name,
          price: item.selling_price,
          image: item.images?.[0] || item.product?.images?.[0]
        })))
      }
      setLoading(false)
    }
    fetchProducts()
  }, [content, storeId])

  if (loading) return <div className="p-12 text-center">Chargement des produits...</div>

  const columns = content.columns || 4
  const gridColsClass = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 md:grid-cols-3',
    4: 'sm:grid-cols-2 md:grid-cols-4',
    5: 'sm:grid-cols-2 md:grid-cols-5'
  }[columns as 2 | 3 | 4 | 5] || 'sm:grid-cols-2 md:grid-cols-4'

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-2 text-foreground">{content.title}</h2>
        {content.subtitle && <p className="text-muted-foreground">{content.subtitle}</p>}
      </div>

      <div className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-${content.columns || 4}`}>
        {products.map((product) => (
          <div key={product.id} className="group bg-[var(--color-secondary)]/50 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-[var(--color-primary)]/10">
            <Link href={`/${storeId}/product/${product.id}`} className="block">
              <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
                <Image
                  src={product.image || '/placeholder-product.jpg'}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />

                {content.showAddToCart !== false && (
                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <Button
                      className="w-full bg-[var(--color-primary)] text-[var(--color-background)] hover:opacity-90 shadow-lg"
                      onClick={(e) => {
                        e.preventDefault();
                        addItem({
                          productId: product.id,
                          name: product.name,
                          price: product.price,
                          image: product.image
                        })
                      }}
                    >
                      Ajouter au panier
                    </Button>
                  </div>
                )}
              </div>
            </Link>
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-1 truncate text-[var(--color-primary)] opacity-80">{product.name}</h3>
              {content.showPrice !== false && (
                <div className="font-bold text-xl text-[var(--color-primary)]">
                  {product.price} TND
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {content.show_view_all && (
        <div className="text-center mt-12">
          <Button variant="outline" asChild className="border-2 border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-colors px-8 rounded-full">
            <Link href={content.view_all_link || '/products'}>
              Voir tout les produits
            </Link>
          </Button>
        </div>
      )}
    </section>
  )
}
