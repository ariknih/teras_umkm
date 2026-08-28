import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const CATEGORY_MAP: Record<string, string> = {
  TOKO: "Toko & Ritel",
  KAFE: "Kafe & Kuliner",
  JASA: "Jasa & Layanan",
  KERJAAN: "Lowongan Kerja",
  ELEKTRONIK: "Elektronik",
  MAKANAN_MINUMAN: "Makanan & Minuman",
  KOMPUTER_AKSESORIS: "Komputer & Aksesoris",
  PERAWATAN_KECANTIKAN: "Perawatan & Kecantikan",
  HANDPHONE_AKSESORIS: "Handphone & Aksesoris",
  PERLENGKAPAN_RUMAH: "Perlengkapan Rumah",
  PAKAIAN_PRIA: "Pakaian Pria",
  PAKAIAN_WANITA: "Pakaian Wanita",
  SEPATU_PRIA: "Sepatu Pria",
  FASHION_MUSLIM: "Fashion Muslim",
  TAS_PRIA: "Tas Pria",
  FASHION_BAYI_ANAK: "Fashion Bayi & Anak",
  AKSESORIS_FASHION: "Aksesoris Fashion",
  IBU_BAYI: "Ibu & Bayi",
  JAM_TANGAN: "Jam Tangan",
  SEPATU_WANITA: "Sepatu Wanita",
  KESEHATAN: "Kesehatan",
  TAS_WANITA: "Tas Wanita",
  HOBI_KOLEKSI: "Hobi & Koleksi",
  OTOMOTIF: "Otomotif",
  OLAHRAGA_OUTDOOR: "Olahraga & Outdoor",
  BUKU_ALAT_TULIS: "Buku & Alat Tulis",
  SOUVENIR_PERLENGKAPAN_PESTA: "Souvenir & Pesta",
  FOTOGRAFI: "Fotografi",
  VOUCHER: "Voucher",
  DEALS_SEKITAR: "Deals Sekitar"
}

export function formatCategoryName(catVal: string): string {
  if (!catVal) return ''
  const upper = catVal.toUpperCase()
  if (CATEGORY_MAP[upper]) return CATEGORY_MAP[upper]
  return catVal
    .replace(/_/g, ' ')
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Standard Haversine distance in km between two GPS coordinates
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Clean standard Indonesian Rupiah currency formatting
 */
export function formatRupiah(amount: number | null | undefined): string {
  return `Rp ${(amount ?? 0).toLocaleString('id-ID')}`
}
