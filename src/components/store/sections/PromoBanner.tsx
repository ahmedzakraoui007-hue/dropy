// src/components/store/sections/PromoBanner.tsx
'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"

interface PromoBannerProps {
  content: {
    title: string
    description?: string
    ctaText?: string
    ctaLink?: string
    backgroundColor?: string
    textColor?: string
  }
  styles?: Record<string, any>
}

export default function PromoBanner({ content, styles }: PromoBannerProps) {
  return (
    <section
      className="py-12 px-4 text-center"
      style={{
        backgroundColor: content.backgroundColor || styles?.backgroundColor || 'var(--color-primary)',
        color: content.textColor || styles?.textColor || 'var(--color-background)'
      }}
    >
      <div className="container mx-auto">
        <h2 className="text-2xl md:text-4xl font-bold mb-4">{content.title}</h2>
        {content.description && <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">{content.description}</p>}
        {content.ctaText && content.ctaLink && (
          <Link href={content.ctaLink}>
            <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-gray-100 px-8">
              {content.ctaText}
            </Button>
          </Link>
        )}
      </div>
    </section>
  )
}
