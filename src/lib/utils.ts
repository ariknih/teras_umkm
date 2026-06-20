import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCategoryName(catVal: string): string {
  if (!catVal) return '';
  const predefined = [
    { name: "Toko & Ritel", value: "TOKO" },
    { name: "Kafe & Kuliner", value: "KAFE" },
    { name: "Jasa & Layanan", value: "JASA" },
    { name: "Lowongan Kerja", value: "KERJAAN" },
    { name: "Elektronik", value: "ELEKTRONIK" },
    { name: "Makanan & Minuman", value: "MAKANAN_MINUMAN" },
    { name: "Komputer & Aksesoris", value: "KOMPUTER_AKSESORIS" },
    { name: "Perawatan & Kecantikan", value: "PERAWATAN_KECANTIKAN" },
    { name: "Handphone & Aksesoris", value: "HANDPHONE_AKSESORIS" },
    { name: "Perlengkapan Rumah", value: "PERLENGKAPAN_RUMAH" },
    { name: "Pakaian Pria", value: "PAKAIAN_PRIA" },
    { name: "Pakaian Wanita", value: "PAKAIAN_WANITA" },
    { name: "Sepatu Pria", value: "SEPATU_PRIA" },
    { name: "Fashion Muslim", value: "FASHION_MUSLIM" },
    { name: "Tas Pria", value: "TAS_PRIA" },
    { name: "Fashion Bayi & Anak", value: "FASHION_BAYI_ANAK" },
    { name: "Aksesoris Fashion", value: "AKSESORIS_FASHION" },
    { name: "Ibu & Bayi", value: "IBU_BAYI" },
    { name: "Jam Tangan", value: "JAM_TANGAN" },
    { name: "Sepatu Wanita", value: "SEPATU_WANITA" },
    { name: "Kesehatan", value: "KESEHATAN" },
    { name: "Tas Wanita", value: "TAS_WANITA" },
    { name: "Hobi & Koleksi", value: "HOBI_KOLEKSI" },
    { name: "Otomotif", value: "OTOMOTIF" },
    { name: "Olahraga & Outdoor", value: "OLAHRAGA_OUTDOOR" },
    { name: "Buku & Alat Tulis", value: "BUKU_ALAT_TULIS" },
    { name: "Souvenir & Pesta", value: "SOUVENIR_PERLENGKAPAN_PESTA" },
    { name: "Fotografi", value: "FOTOGRAFI" },
    { name: "Voucher", value: "VOUCHER" },
    { name: "Deals Sekitar", value: "DEALS_SEKITAR" }
  ];
  const found = predefined.find(p => p.value === catVal || p.value.toLowerCase() === catVal.toLowerCase());
  if (found) return found.name;
  return catVal
    .replace(/_/g, ' ')
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

