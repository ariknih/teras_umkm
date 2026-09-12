import { getProductById, getProducts } from '@/app/actions/products'
import { getProductReviews } from '@/app/actions/reviews'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { getCurrentUser } from '@/app/actions/auth'
import { cleanProductDescription } from '@/lib/product-variants'
import ProductDetailView from './ProductDetailView'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ aff?: string }>
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const product = await getProductById(id)
  
  if (!product) {
    return {
      title: 'Produk Tidak Ditemukan - Saloka.id',
      description: 'Halaman produk tidak ditemukan di Saloka.id.'
    }
  }

  const cleanedDesc = cleanProductDescription(product.description)
  const desc = cleanedDesc.substring(0, 150) + (cleanedDesc.length > 150 ? '...' : '')

  return {
    title: `${product.title} - Saloka.id`,
    description: desc,
    openGraph: {
      title: `${product.title} - Saloka.id`,
      description: desc,
      images: product.imageUrl ? [{ url: product.imageUrl }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.title} - Saloka.id`,
      description: desc,
      images: product.imageUrl ? [product.imageUrl] : [],
    }
  }
}

export default async function ProductDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { aff } = await searchParams
  
  const product = await getProductById(id)
  if (!product) {
    notFound()
  }

  const user = await getCurrentUser()
  const [reviews, allProducts] = await Promise.all([
    getProductReviews(id),
    getProducts()
  ])

  const relatedProducts = allProducts
    .filter((p: any) => p.id !== product.id && (p.category === product.category || !product.category))
    .slice(0, 6)

  return (
    <ProductDetailView
      product={product}
      reviews={reviews}
      relatedProducts={relatedProducts}
      affCode={aff}
      currentUser={user}
    />
  )
}
