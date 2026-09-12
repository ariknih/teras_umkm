export interface ProductVariant {
  id: string
  name: string
  price?: number
  stock: number
  imageUrl?: string
  sku?: string
}

export function parseProductVariants(product: any): ProductVariant[] {
  if (!product) return []
  if (Array.isArray(product.variants)) return product.variants
  if (typeof product.variants === 'string') {
    try {
      const parsed = JSON.parse(product.variants)
      if (Array.isArray(parsed)) return parsed
    } catch {}
  }
  if (product.description && typeof product.description === 'string') {
    const match = product.description.match(/<!--\s*VARIANTS_JSON:([\s\S]*?)-->/)
    if (match && match[1]) {
      try {
        const parsed = JSON.parse(match[1])
        if (Array.isArray(parsed)) return parsed
      } catch {}
    }
  }
  return []
}

export function cleanProductDescription(description?: string | null): string {
  if (!description) return ''
  return description.replace(/<!--\s*VARIANTS_JSON:[\s\S]*?-->/g, '').trim()
}
