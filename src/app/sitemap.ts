import { MetadataRoute } from 'next'
import { DataStore } from '@/lib/data-store'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://saloka.id'

  let productEntries: any[] = []
  try {
    const products = await DataStore.getProducts()
    productEntries = products.map((p) => ({
      url: `${baseUrl}/market/product/${p.id}`,
      lastModified: p.updatedAt || new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }))
  } catch (e) {
    console.error('Error fetching products for sitemap:', e)
  }

  const routes = ['', '/market', '/academy', '/affiliate', '/community', '/privacy', '/terms'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : 0.9,
  }))

  return [...routes, ...productEntries]
}
