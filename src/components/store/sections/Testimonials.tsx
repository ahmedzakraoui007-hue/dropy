// src/components/store/sections/Testimonials.tsx
'use client'

import { Star } from "lucide-react"
import Image from "next/image"

interface TestimonialsProps {
  content: {
    title: string
    testimonials: Array<{
      id: number
      author: string
      rating: number
      text: string
      date?: string
      authorImage?: string
    }>
  }
  styles?: Record<string, any>
}

export default function Testimonials({ content, styles }: TestimonialsProps) {
  return (
    <section className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold">{content.title}</h2>
      </div>

      <div className="grid gap-8 grid-cols-1 md:grid-cols-3">
        {content.testimonials?.map((testimonial) => (
          <div key={testimonial.id} className="bg-gray-50 p-6 rounded-2xl shadow-sm">
            <div className="flex gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-4 h-4 ${i < testimonial.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                />
              ))}
            </div>
            <p className="text-gray-700 mb-6 italic">"{testimonial.text}"</p>
            <div className="flex items-center gap-3">
              {testimonial.authorImage && (
                <div className="relative w-12 h-12 rounded-full overflow-hidden">
                  <Image src={testimonial.authorImage} alt={testimonial.author} fill className="object-cover" />
                </div>
              )}
              <div>
                <div className="font-semibold">{testimonial.author}</div>
                {testimonial.date && <div className="text-xs text-gray-500">{testimonial.date}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
