'use server'

import { DataStore } from '@/lib/data-store'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'

export async function getProducts(category?: string) {
  return await DataStore.getProducts(category)
}

export async function getProductById(id: string) {
  return await DataStore.getProductById(id)
}

export async function createProduct(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: 'Anda harus masuk terlebih dahulu.' }
  }
  
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const price = parseFloat(formData.get('price') as string)
  const category = formData.get('category') as string
  const stock = parseInt(formData.get('stock') as string)
  const imageUrl = formData.get('imageUrl') as string || undefined
  
  const latitudeStr = formData.get('latitude') as string
  const longitudeStr = formData.get('longitude') as string
  let latitude = latitudeStr ? parseFloat(latitudeStr) : undefined
  let longitude = longitudeStr ? parseFloat(longitudeStr) : undefined

  if (latitude === undefined || longitude === undefined || isNaN(latitude) || isNaN(longitude)) {
    // Fallback to user's saved location coordinates
    const fullUser = await DataStore.findUserById(user.id)
    if (fullUser) {
      latitude = fullUser.latitude || -6.2088
      longitude = fullUser.longitude || 106.8456
    }
  }
  
  if (!title || !description || isNaN(price) || !category || isNaN(stock)) {
    return { error: 'Semua kolom wajib diisi dengan benar.' }
  }
  
  try {
    const product = await DataStore.createProduct({
      title,
      description,
      price,
      category,
      stock,
      imageUrl,
      merchantId: user.id,
      latitude,
      longitude
    })
    
    // Reward 50 XP for posting a product or job request
    await DataStore.addXp(user.id, 50)
    
    revalidatePath('/market')
    revalidatePath('/merchant/dashboard')
    return { success: true, product }
  } catch (e: any) {
    return { error: e.message || 'Gagal menambahkan produk.' }
  }
}

export async function updateProduct(id: string, formData: FormData) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: 'Anda harus masuk terlebih dahulu.' }
  }
  
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const price = parseFloat(formData.get('price') as string)
  const category = formData.get('category') as string
  const stock = parseInt(formData.get('stock') as string)
  const imageUrl = formData.get('imageUrl') as string
  const latitudeStr = formData.get('latitude') as string
  const longitudeStr = formData.get('longitude') as string
  
  const data: any = {}
  if (title) data.title = title
  if (description) data.description = description
  if (!isNaN(price)) data.price = price
  if (category) data.category = category
  if (!isNaN(stock)) data.stock = stock
  if (imageUrl !== undefined) data.imageUrl = imageUrl
  if (latitudeStr) data.latitude = parseFloat(latitudeStr)
  if (longitudeStr) data.longitude = parseFloat(longitudeStr)
  
  try {
    const product = await DataStore.updateProduct(id, user.id, data)
    revalidatePath('/market')
    revalidatePath(`/market/product/${id}`)
    revalidatePath('/merchant/dashboard')
    return { success: true, product }
  } catch (e: any) {
    return { error: e.message || 'Gagal memperbarui produk.' }
  }
}

export async function deleteProduct(id: string) {
  const user = await getCurrentUser()
  if (!user) {
    return { error: 'Anda harus masuk terlebih dahulu.' }
  }
  
  try {
    await DataStore.deleteProduct(id, user.id)
    revalidatePath('/market')
    revalidatePath('/merchant/dashboard')
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal menghapus produk.' }
  }
}
