// src/components/store/sections/HeroBanner.tsx
'use client'

import { Button } from "@/components/ui/button"
import Link from "next/link"

interface HeroBannerProps {
  content: {
    title: string
    subtitle?: string
    ctaText?: string
    ctaLink?: string
    backgroundImage?: string
    overlay?: boolean
    overlayOpacity?: number
  }
  styles?: Record<string, any>
}

export default function HeroBanner({ content, styles }: HeroBannerProps) {
  return (
    <section
      className="relative flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage: content.backgroundImage ? `url(${content.backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        height: styles?.height || '500px'
      }}
    >
      {content.overlay && (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: content.overlayOpacity || 0.4 }}
        />
      )}

      <div className="relative z-10 container mx-auto px-4 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 tracking-tight drop-shadow-md" style={{ color: styles?.textColor || '#ffffff' }}>
          {content.title}
        </h1>
        {content.subtitle && (
          <p className="text-lg sm:text-xl md:text-2xl mb-8 max-w-2xl mx-auto font-medium drop-shadow-sm" style={{ color: styles?.textColor || '#ffffff' }}>
            {content.subtitle}
          </p>
        )}
        {content.ctaText && content.ctaLink && (
          <Link href={content.ctaLink}>
            <Button size="lg" className="bg-[var(--color-primary)] hover:opacity-90 text-[var(--color-secondary)] px-8 py-6 text-lg rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95">
              {content.ctaText}
            </Button>
          </Link>
        )}
      </div>
    </section>
  )
}
