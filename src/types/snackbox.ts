// Matches the real Prisma ProductCategory enum values usable for Snackbox
// (see SNACKBOX_ELIGIBLE_CATEGORIES in merchant/dashboard/page.tsx), plus 'Semua' as the "all" filter.
export type SnackboxCategory =
  | 'Semua'
  | 'KUE_TRADISIONAL'
  | 'SNACK_GURIH'
  | 'SNACK_MANIS'
  | 'KUE_KERING'
  | 'JAJANAN_PASAR'
  | 'MAKANAN_MINUMAN'
  | 'KAFE'

export type BoxType = 'reguler' | 'borongan'

export interface Kelurahan {
  id: string
  name: string
  kecamatan: string
  kota: string
  province: string
  postalCode: string
  itemCount?: number
}

export interface SnackboxProduct {
  id: string
  title: string
  description: string
  price: number
  originalPrice?: number
  imageUrl: string
  category: SnackboxCategory
  kelurahanName: string
  rating: number
  reviewCount: number
  soldCount: number
  isTrending?: boolean
  isBestSeller?: boolean
  tags?: string[]
  minOrder?: number
  stock: number
  portionWeight?: string // e.g. "65g"
  merchantId?: string
}

export interface SnackboxCartItem {
  product: SnackboxProduct
  quantity: number
  selected: boolean
}

export interface SnackboxCart {
  items: SnackboxCartItem[]
  boxType: BoxType
  boxCount: number
  kelurahanId: string
  kelurahanName: string
}

export interface DeliveryOption {
  id: string
  name: string
  serviceType: string
  estimate: string
  price: number
  description: string
}

export interface PaymentMethodOption {
  id: string
  name: string
  code: string
  category: 'VA' | 'EWALLET' | 'QRIS' | 'SALOKAPAY'
  iconText: string
  accountNumber?: string
}

export interface CheckoutSummary {
  subtotalPerBox: number
  totalItemsPerBox: number
  boxCount: number
  subtotalGross: number
  deliveryFee: number
  insuranceFee: number
  serviceFee: number
  discountAmount: number
  totalBill: number
}
