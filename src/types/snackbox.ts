export type SnackboxCategory =
  | 'Semua'
  | 'Snack Manis'
  | 'Snack Gurih'
  | 'Kue Tradisional'
  | 'Kue Basah'
  | 'Kue Kering'
  | 'Makanan Ringan'
  | 'Jajanan'
  | 'Cemilan'
  | 'Snack Kekinian'

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
  kelurahanId: string
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
