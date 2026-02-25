// src/components/store/sections/Newsletter.tsx
'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"

interface NewsletterProps {
  content: {
    title: string
    description?: string
    placeholder?: string
    buttonText?: string
    successMessage?: string
    layout?: 'inline' | 'stacked'
  }
  styles?: Record<string, any>
}

export default function Newsletter({ content, styles }: NewsletterProps) {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      setSubmitted(true)
      setEmail('')
    }
  }

  return (
    <section className="container mx-auto px-4 py-12 text-center">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold mb-4" style={{ color: styles?.textColor }}>{content.title}</h2>
        {content.description && (
          <p className="text-lg mb-8 opacity-90" style={{ color: styles?.textColor }}>
            {content.description}
          </p>
        )}

        {submitted ? (
          <div className="bg-green-100 text-green-800 p-4 rounded-lg font-medium">
            {content.successMessage || "Merci ! Vous avez été inscrit avec succès."}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={`flex flex-col sm:flex-row gap-4 justify-center ${content.layout === 'stacked' ? 'sm:flex-col items-center' : ''}`}>
            <Input
              type="email"
              placeholder={content.placeholder || "votre@email.com"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="max-w-sm bg-white"
            />
            <Button type="submit" size="lg" className="bg-white text-primary hover:bg-gray-100 font-bold px-8">
              {content.buttonText || "S'inscrire"}
            </Button>
          </form>
        )}
      </div>
    </section>
  )
}
