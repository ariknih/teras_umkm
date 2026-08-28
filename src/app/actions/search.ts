'use server'

import { DataStore } from '@/lib/data-store'

export interface GlobalSearchResult {
  products: any[]
  services: any[]
  communities: any[]
  recommendedProducts: any[]
  recommendedServices: any[]
  totalMatches: number
}

export async function searchGlobalAction(query: string): Promise<GlobalSearchResult> {
  const cleanQuery = (query || '').trim().toLowerCase()

  try {
    const [allProducts, allServices, allCommunities] = await Promise.all([
      DataStore.getProducts(),
      DataStore.getServices({ isActive: true }),
      DataStore.getCommunities()
    ])

    // Curated recommendations (fallback top items)
    const recommendedProducts = (allProducts || []).slice(0, 6)
    const recommendedServices = (allServices || []).slice(0, 6)

    if (!cleanQuery) {
      return {
        products: [],
        services: [],
        communities: [],
        recommendedProducts,
        recommendedServices,
        totalMatches: 0
      }
    }

    // Filter Products
    const products = (allProducts || []).filter((p: any) => {
      const title = (p.title || '').toLowerCase()
      const desc = (p.description || '').toLowerCase()
      const cat = (p.category || '').toLowerCase()
      const merchant = (p.merchant?.name || '').toLowerCase()
      return title.includes(cleanQuery) || desc.includes(cleanQuery) || cat.includes(cleanQuery) || merchant.includes(cleanQuery)
    }).slice(0, 8)

    // Filter Services
    const services = (allServices || []).filter((s: any) => {
      const title = (s.title || '').toLowerCase()
      const desc = (s.description || '').toLowerCase()
      const cat = (s.category || '').toLowerCase()
      const loc = (s.location || '').toLowerCase()
      const merchant = (s.merchant?.name || '').toLowerCase()
      return title.includes(cleanQuery) || desc.includes(cleanQuery) || cat.includes(cleanQuery) || loc.includes(cleanQuery) || merchant.includes(cleanQuery)
    }).slice(0, 8)

    // Filter Communities
    const communities = (allCommunities || []).filter((c: any) => {
      const name = (c.name || '').toLowerCase()
      const desc = (c.description || '').toLowerCase()
      const dom = (c.domisili || '').toLowerCase()
      const type = (c.type || '').toLowerCase()
      return name.includes(cleanQuery) || desc.includes(cleanQuery) || dom.includes(cleanQuery) || type.includes(cleanQuery)
    }).slice(0, 6)

    const totalMatches = products.length + services.length + communities.length

    return {
      products,
      services,
      communities,
      recommendedProducts,
      recommendedServices,
      totalMatches
    }
  } catch (error) {
    console.error('searchGlobalAction error:', error)
    return {
      products: [],
      services: [],
      communities: [],
      recommendedProducts: [],
      recommendedServices: [],
      totalMatches: 0
    }
  }
}
