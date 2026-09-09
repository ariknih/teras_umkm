import { Kelurahan, DeliveryOption, PaymentMethodOption } from '@/types/snackbox'

export const mockKelurahans: Kelurahan[] = [
  {
    id: 'kel-menteng',
    name: 'Menteng',
    kecamatan: 'Menteng',
    kota: 'Jakarta Pusat',
    province: 'DKI Jakarta',
    postalCode: '10310',
    itemCount: 18
  },
  {
    id: 'kel-tebet-barat',
    name: 'Tebet Barat',
    kecamatan: 'Tebet',
    kota: 'Jakarta Selatan',
    province: 'DKI Jakarta',
    postalCode: '12810',
    itemCount: 22
  },
  {
    id: 'kel-senayan',
    name: 'Senayan',
    kecamatan: 'Kebayoran Baru',
    kota: 'Jakarta Selatan',
    province: 'DKI Jakarta',
    postalCode: '12190',
    itemCount: 16
  },
  {
    id: 'kel-kelapa-gading-timur',
    name: 'Kelapa Gading Timur',
    kecamatan: 'Kelapa Gading',
    kota: 'Jakarta Utara',
    province: 'DKI Jakarta',
    postalCode: '14240',
    itemCount: 20
  },
  {
    id: 'kel-rawamangun',
    name: 'Rawamangun',
    kecamatan: 'Pulo Gadung',
    kota: 'Jakarta Timur',
    province: 'DKI Jakarta',
    postalCode: '13220',
    itemCount: 14
  },
  {
    id: 'kel-kebon-jeruk',
    name: 'Kebon Jeruk',
    kecamatan: 'Kebon Jeruk',
    kota: 'Jakarta Barat',
    province: 'DKI Jakarta',
    postalCode: '11530',
    itemCount: 15
  },
  {
    id: 'kel-bintaro',
    name: 'Bintaro',
    kecamatan: 'Pesanggrahan',
    kota: 'Jakarta Selatan',
    province: 'DKI Jakarta',
    postalCode: '12330',
    itemCount: 19
  },
  {
    id: 'kel-beji',
    name: 'Beji',
    kecamatan: 'Beji',
    kota: 'Kota Depok',
    province: 'Jawa Barat',
    postalCode: '16421',
    itemCount: 12
  }
]

export const defaultKelurahan: Kelurahan = mockKelurahans[0]

export const mockDeliveryOptions: DeliveryOption[] = [
  {
    id: 'del-ekonomi',
    name: 'Ekonomi Saloka Courier',
    serviceType: 'Reguler (Tepat Waktu Acara)',
    estimate: 'Sampai sebelum jam acara (Pagi / Siang)',
    price: 15000,
    description: 'Dikirim dengan kurir motor berpendingin khusus makanan.'
  },
  {
    id: 'del-instant',
    name: 'Instant Dedicated Courier',
    serviceType: 'Langsung Antar (1-2 Jam)',
    estimate: '1-2 jam setelah pesanan siap',
    price: 28000,
    description: 'Khusus pesanan mendadak atau butuh kepastian waktu ketat.'
  },
  {
    id: 'del-van',
    name: 'Mobil Box Saloka VIP (Pesanan Besar)',
    serviceType: 'Kargo Ber-AC (>100 Box)',
    estimate: 'Sesuai jadwal pengiriman acara',
    price: 50000,
    description: 'Dilengkapi rak susun agar box snack tetap rapi dan tidak tumpuk tertindih.'
  }
]

export const mockPaymentMethods: PaymentMethodOption[] = [
  {
    id: 'pay-bca',
    name: 'BCA Virtual Account',
    code: 'BCA_VA',
    category: 'VA',
    iconText: 'BCA',
    accountNumber: '8830 1928 3482 1000'
  },
  {
    id: 'pay-mandiri',
    name: 'Mandiri Virtual Account',
    code: 'MANDIRI_VA',
    category: 'VA',
    iconText: 'MANDIRI',
    accountNumber: '8910 8823 4910 2000'
  },
  {
    id: 'pay-bri',
    name: 'BRI Virtual Account',
    code: 'BRI_VA',
    category: 'VA',
    iconText: 'BRI',
    accountNumber: '1280 4491 0284 3000'
  },
  {
    id: 'pay-qris',
    name: 'QRIS Saloka (Semua E-Wallet / Bank)',
    code: 'QRIS',
    category: 'QRIS',
    iconText: 'QRIS'
  },
  {
    id: 'pay-salokapay',
    name: 'SalokaPay Balance',
    code: 'SALOKAPAY',
    category: 'SALOKAPAY',
    iconText: 'SALOKA'
  }
]
