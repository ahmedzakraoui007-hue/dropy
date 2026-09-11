import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://dropy.store'
  const now = new Date()
  
    const landingPages = [
      '',
      '/vendeurs',
      '/fournisseurs',
      '/createurs',
      '/tarifs',
      '/a-propos',
      '/contact',
      '/faq',
      '/aide',
      '/carrieres',
      '/login',
      '/inscription',
      '/conditions-utilisation',
      '/politique-confidentialite',
      '/mentions-legales',
      '/demande-en-attente',
    ]

  return landingPages.map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : 0.8,
  }))
}
