import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/merchant/dashboard/', '/api/'],
    },
    sitemap: 'https://salokaid.vercel.app/sitemap.xml',
  }
}
