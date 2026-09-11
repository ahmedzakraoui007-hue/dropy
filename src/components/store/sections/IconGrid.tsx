// src/components/store/sections/IconGrid.tsx
'use client'

import * as Icons from "lucide-react"

interface IconGridProps {
  content: {
    title?: string
    subtitle?: string
    layout?: 'horizontal' | 'grid'
    columns?: number
    items: Array<{
      id: number
      icon: string
      title: string
      description: string
    }>
  }
  styles?: Record<string, any>
}

export default function IconGrid({ content, styles }: IconGridProps) {
  return (
    <section className="container mx-auto px-4 py-12">
      {(content.title || content.subtitle) && (
        <div className="text-center mb-12">
          {content.title && <h2 className="text-3xl font-bold mb-2">{content.title}</h2>}
          {content.subtitle && <p className="text-gray-600">{content.subtitle}</p>}
        </div>
      )}

      <div className={`grid gap-8 ${
        content.layout === 'horizontal' 
          ? 'grid-cols-1 md:grid-cols-4' 
          : `grid-cols-1 md:grid-cols-${content.columns || 3}`
      }`}>
        {content.items?.map((item) => {
          const IconComponent = (Icons as any)[item.icon] || Icons.HelpCircle
          return (
            <div key={item.id} className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                <IconComponent className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">{item.title}</h3>
              <p className="text-gray-600 leading-relaxed">{item.description}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
