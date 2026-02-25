import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/seller/',
        '/supplier/',
        '/creator/',
        '/api/',
      ],
    },
    sitemap: 'https://dropy.store/sitemap.xml',
  }
}
