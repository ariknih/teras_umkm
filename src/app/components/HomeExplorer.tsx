'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Coins,
  GraduationCap,
  ChevronRight,
  MapPin,
  Users
} from 'lucide-react'
import { formatCategoryName } from '@/lib/utils'
import { useSnackbox } from '@/context/SnackboxContext'
import { mockSnackboxProducts } from '@/lib/mock-snackbox'

interface Product {
  id: string
  title: string
  description?: string
  price: number
  category: string
  stock?: number
  imageUrl?: string
  merchantId?: string
  merchant?: {
    name: string
  } | null
}

interface Service {
  id: string
  merchantId: string
  title: string
  description?: string
  category: string
  pricePerSession?: number
  pricePerDay?: number
  sessionDurationMinutes?: number
  maxWorkHoursPerDay?: number
  images?: string[]
  location?: string
  merchant?: {
    name: string
  } | null
}

interface HomeExplorerProps {
  products: Product[]
  services: Service[]
  communities?: any[]
}

const MARKETPLACE_CATEGORIES = [
  { key: '', label: 'Semua Produk', icon: '/images/kategori icon.svg' },
  { key: 'TOKO', label: 'Toko & Ritel', icon: '/images/kategori icon.svg' },
  { key: 'KAFE', label: 'Kafe & Kuliner', icon: '/images/kategori icon.svg' },
  { key: 'MAKANAN_MINUMAN', label: 'Makanan & Minuman', icon: '/images/topup tagihan icon.svg' },
  { key: 'ELEKTRONIK', label: 'Elektronik', icon: '/images/elektronik icon.svg' },
  { key: 'HANDPHONE_AKSESORIS', label: 'Handphone & Aksesoris', icon: '/images/handphone&tablet icon.svg' },
  { key: 'KOMPUTER_AKSESORIS', label: 'Komputer & Aksesoris', icon: '/images/komputer&laptop icon.svg' },
  { key: 'PERAWATAN_KECANTIKAN', label: 'Perawatan & Kecantikan', icon: '/images/perawatan hewan icon.svg' },
  { key: 'FASHION_MUSLIM', label: 'Fashion Muslim', icon: '/images/kategori icon.svg' },
  { key: 'PAKAIAN_WANITA', label: 'Pakaian Wanita', icon: '/images/kategori icon.svg' },
  { key: 'PERLENGKAPAN_RUMAH', label: 'Perlengkapan Rumah', icon: '/images/kategori icon.svg' },
  { key: 'HOBI_KOLEKSI', label: 'Hobi & Koleksi', icon: '/images/keuangan icon.svg' },
  { key: 'OTOMOTIF', label: 'Otomotif', icon: '/images/kategori icon.svg' },
]

const JASA_CATEGORIES = [
  { key: '', label: 'Semua Jasa', icon: '/images/jasa icon.svg' },
  { key: 'Desain & Multimedia', label: 'Desain & Multimedia', icon: '/images/kategori icon.svg' },
  { key: 'Teknologi & IT', label: 'Teknologi & IT', icon: '/images/komputer&laptop icon.svg' },
  { key: 'Konsultasi Bisnis', label: 'Konsultasi Bisnis', icon: '/images/keuangan icon.svg' },
  { key: 'Reparasi & Perawatan', label: 'Reparasi & Perawatan', icon: '/images/elektronik icon.svg' },
  { key: 'Fotografi & Video', label: 'Fotografi & Video', icon: '/images/kategori icon.svg' },
  { key: 'Pendidikan & Kursus Privat', label: 'Pendidikan & Kursus', icon: '/images/kategori icon.svg' },
  { key: 'Kerajinan & Seni', label: 'Kerajinan & Seni', icon: '/images/kategori icon.svg' },
  { key: 'Lainnya', label: 'Lainnya', icon: '/images/kategori icon.svg' },
]

export default function HomeExplorer({ products = [], services = [], communities = [] }: HomeExplorerProps) {
  const [activeTab, setActiveTab] = useState<'MARKETPLACE' | 'JASA'>('MARKETPLACE')
  const [selectedCategory, setSelectedCategory] = useState('')
  const { kelurahan } = useSnackbox()

  const handleTabChange = (tab: 'MARKETPLACE' | 'JASA') => {
    setActiveTab(tab)
    setSelectedCategory('')
  }

  const activeCategoryList = activeTab === 'MARKETPLACE' ? MARKETPLACE_CATEGORIES : JASA_CATEGORIES

  const filteredProducts = useMemo(() => {
    if (!products || products.length === 0) return []
    let list = [...products]
    if (selectedCategory) {
      list = list.filter(p => (p.category || '').toUpperCase() === selectedCategory.toUpperCase())
    }
    return list.slice(0, 12)
  }, [products, selectedCategory])

  const filteredServices = useMemo(() => {
    if (!services || services.length === 0) return []
    let list = [...services]
    if (selectedCategory) {
      list = list.filter(s => (s.category || '').toLowerCase() === selectedCategory.toLowerCase())
    }
    return list.slice(0, 12)
  }, [services, selectedCategory])

  const localSnackboxProducts = useMemo(() => {
    return mockSnackboxProducts.filter(p => p.kelurahanId === kelurahan.id).slice(0, 6)
  }, [kelurahan.id])

  const displayCommunities = useMemo(() => {
    if (communities && communities.length > 0) {
      const getMemberCount = (c: any) => c._count?.members ?? c.membersCount ?? (c.members?.length || 1)
      return [...communities]
        .sort((a, b) => getMemberCount(b) - getMemberCount(a))
        .slice(0, 3)
        .map((c: any) => ({
          id: c.id,
          title: c.name,
          badge: c.type === 'KOPERASI' ? 'Koperasi Resmi' : 'Perkumpulan UMKM',
          desc: c.description || 'Komunitas pelaku UMKM untuk kolaborasi, permodalan, dan promosi bersama.',
          members: `${getMemberCount(c)} Anggota`,
          image: c.avatarUrl || c.coverUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=2DB24A&color=ffffff&bold=true`,
          href: `/community/${c.id}`
        }))
    }
    return [
      {
        id: 'comm-dummy-1',
        title: 'Perahu Kita',
        badge: 'Perkumpulan UMKM',
        desc: 'Wadah bagi pelaku usaha, UMKM, dan masyarakat untuk saling berbagi pengalaman dan peluang bersama.',
        members: '1 Anggota',
        image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=150&h=150&fit=crop&q=80',
        href: '/community/comm-dummy-1'
      },
      {
        id: 'comm-dummy-2',
        title: 'Koperasi Produksi Maju Bersama',
        badge: 'Koperasi Resmi',
        desc: 'Koperasi produksi resmi pelaku usaha mikro kecil untuk pengadaan bahan baku bersama dan bagi hasil SHU.',
        members: '1 Anggota',
        image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=150&h=150&fit=crop&q=80',
        href: '/community/comm-dummy-2'
      },
      {
        id: 'comm-dummy-3',
        title: 'Asosiasi Kuliner Kreatif Jogja',
        badge: 'Perkumpulan UMKM',
        desc: 'Wadah kolaborasi pemilik usaha kuliner kreatif untuk peningkatan mutu, sertifikasi halal, dan pemasaran.',
        members: '1 Anggota',
        image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=150&h=150&fit=crop&q=80',
        href: '/community/comm-dummy-3'
      }
    ]
  }, [communities])

  return (
    <section className="w-full max-w-[1240px] mx-auto px-3.5 sm:px-6 py-4 sm:py-6">
      
      {/* ── SNACKBOX ─────────────────────────────────────────────────────── */}
      <div id="snackbox" className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xs space-y-4 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-[#E8F8EE] text-[#2DB24A] border border-[#C8E6C9] text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                <img src="/images/jasa icon.svg" alt="Snackbox" className="w-3.5 h-3.5 object-contain" />
                <span>Snackbox Saloka</span>
              </span>
              <span className="bg-[#FFF3D6] text-[#D97706] text-[10px] font-black px-2.5 py-1 rounded-full shadow-2xs uppercase tracking-wide">
                ★ BARU
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
              Jajanan & kue tradisional dari kelurahanmu
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
              Dibuat langsung oleh pembuat kue di sekitarmu! Dipesan, digoreng/dikukus, diantar selagi hangat.
            </p>
            <div className="flex items-center gap-1.5 pt-0.5">
              <span className="bg-[#EBF3FE] text-[#1E40AF] text-[11px] font-bold px-3 py-1 rounded-full inline-flex items-center gap-1">
                📍 Menampilkan Kel. {kelurahan.name}
              </span>
            </div>
          </div>

          <Link
            href="/snackbox"
            className="text-xs font-bold text-[#2DB24A] hover:underline flex items-center gap-1 self-start sm:self-center shrink-0"
          >
            <span>Buka Snackbox</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {/* Snackbox Products Grid */}
        {localSnackboxProducts.length === 0 ? (
          <div className="text-center py-10 rounded-xl bg-[#F5F7FA] border border-slate-200/80">
            <h4 className="font-bold text-xs text-slate-700 mb-0.5">
              Dapur di Kelurahan {kelurahan.name} Sedang Dikurasi
            </h4>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto mb-3">
              Anda tetap bisa memesan pilihan kue lezat dari kelurahan sekitar.
            </p>
            <Link
              href="/snackbox"
              className="inline-block px-4 py-1.5 rounded-lg bg-[#2DB24A] hover:bg-[#24943E] text-white text-xs font-bold transition-all shadow-xs"
            >
              Pilih Kelurahan Lain
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3.5 pt-1">
            {localSnackboxProducts.map((product) => {
              const discountPct = product.originalPrice
                ? Math.round((1 - product.price / product.originalPrice) * 100)
                : null
              return (
                <Link
                  key={product.id}
                  href="/snackbox"
                  className="group flex flex-col bg-white border border-slate-200/90 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-[0_4px_16px_0_rgba(45,178,74,0.12)] hover:border-[#2DB24A]/50 h-full relative cursor-pointer"
                >
                  <div className="aspect-square w-full bg-slate-100 relative overflow-hidden">
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      loading="lazy"
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    />
                    {discountPct !== null && (
                      <div className="absolute top-2 left-2 bg-[#E8F8EE] text-[#2DB24A] font-extrabold text-[10px] px-1.5 py-0.5 rounded-md border border-[#C8E6C9] shadow-2xs">
                        {discountPct}%
                      </div>
                    )}
                    {product.portionWeight && (
                      <div className="absolute bottom-2 left-2 bg-slate-900/75 backdrop-blur-xs text-white text-[9px] font-semibold px-1.5 py-0.5 rounded">
                        ±{product.portionWeight}
                      </div>
                    )}
                  </div>

                  <div className="p-2.5 flex-1 flex flex-col justify-between space-y-1.5">
                    <div>
                      <h4 className="text-xs font-medium text-slate-800 line-clamp-2 min-h-[32px] leading-snug group-hover:text-[#2DB24A] transition-colors">
                        {product.title}
                      </h4>
                      <div className="pt-1">
                        <p className="text-sm font-extrabold text-slate-900 leading-tight">
                          Rp {product.price.toLocaleString('id-ID')}
                        </p>
                        {product.originalPrice && discountPct !== null && (
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <span className="text-[10px] text-slate-400 line-through">
                              Rp {product.originalPrice.toLocaleString('id-ID')}
                            </span>
                            <span className="bg-[#E8F8EE] text-[#2DB24A] font-extrabold text-[9px] px-1 py-0.2 rounded border border-[#C8E6C9]">
                              {discountPct}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-1.5 border-t border-slate-100 space-y-1">
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <span className="text-amber-500 font-bold">★ {product.rating}</span>
                        <span>•</span>
                        <span>{product.soldCount} terjual</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 truncate">
                        <span className="text-[#2DB24A] font-bold">✔</span>
                        <span className="truncate">{product.kelurahanName}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* ── KOMUNITAS POPULER ────────────────────────────────────────────── */}
      <div id="komunitas-populer" className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xs space-y-4 mb-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
            Komunitas Populer
          </h3>
          <Link
            href="/community"
            className="text-xs font-bold text-[#2DB24A] hover:underline flex items-center gap-1"
          >
            <span>Lihat semua komunitas</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
          {displayCommunities.map((comm, idx) => (
            <Link
              key={comm.id || idx}
              href={comm.href}
              className="bg-[#F8FAFC] rounded-2xl border border-slate-200/80 p-3.5 flex gap-3 hover:border-[#2DB24A]/60 shadow-2xs hover:shadow-md transition-all group"
            >
              <img
                src={comm.image}
                alt={comm.title}
                className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-100 group-hover:scale-105 transition-transform"
              />
              <div className="space-y-1 flex-1 min-w-0">
                <span className="bg-white text-[#2DB24A] border border-[#2DB24A]/40 text-[9px] font-bold px-2 py-0.5 rounded shadow-2xs inline-block">
                  {comm.badge}
                </span>
                <h4 className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-[#2DB24A] transition-colors">
                  {comm.title}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {comm.desc}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 pt-0.5">
                  <Users size={10} />
                  <span>{comm.members}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── SALOKA ACADEMY & AFFILIATE HUB (2 COLUMNS SIDE BY SIDE) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mb-5">
        {/* ── SALOKA ACADEMY ── */}
        <div id="saloka-academy" className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-base font-extrabold text-slate-900">Saloka Academy</h3>
            <Link href="/academy" className="text-xs font-bold text-[#2DB24A] hover:underline flex items-center gap-1">
              <span>Belajar di Saloka Academy</span>
              <ChevronRight size={14} />
            </Link>
          </div>
          <Link href="/academy" className="bg-[#F8FAFC] rounded-2xl border border-slate-200/80 p-3 flex gap-3 hover:border-[#2DB24A]/60 shadow-2xs transition-all group">
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=400&q=80"
              alt="Saloka Academy"
              className="w-16 h-16 rounded-xl object-cover shrink-0 group-hover:scale-105 transition-transform"
            />
            <div className="space-y-1 flex-1 min-w-0">
              <span className="bg-white text-[#2DB24A] border border-[#2DB24A]/40 text-[9px] font-bold px-2 py-0.5 rounded shadow-2xs inline-block">
                Kelas & Pelatihan Bisnis
              </span>
              <h4 className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-[#2DB24A]">
                Saloka Academy LMS
              </h4>
              <p className="text-[11px] text-slate-500 line-clamp-2">
                Tingkatkan omzet dan keahlian usaha melalui kursus digital marketing, keuangan, dan sertifikasi halal.
              </p>
              <div className="flex items-center gap-1 text-[10px] text-slate-400 pt-0.5">
                <GraduationCap size={10} />
                <span>Pelatihan Terstruktur & Sertifikat</span>
              </div>
            </div>
          </Link>
        </div>

        {/* ── AFFILIATE HUB ── */}
        <div id="affiliate-hub" className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-base font-extrabold text-slate-900">Affiliate Hub</h3>
            <Link href="/affiliate" className="text-xs font-bold text-[#2DB24A] hover:underline flex items-center gap-1">
              <span>Jadi affiliate sekarang</span>
              <ChevronRight size={14} />
            </Link>
          </div>
          <Link href="/affiliate" className="bg-[#F8FAFC] rounded-2xl border border-slate-200/80 p-3 flex gap-3 hover:border-[#2DB24A]/60 shadow-2xs transition-all group">
            <img
              src="https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=400&q=80"
              alt="Affiliate Hub"
              className="w-16 h-16 rounded-xl object-cover shrink-0 group-hover:scale-105 transition-transform"
            />
            <div className="space-y-1 flex-1 min-w-0">
              <span className="bg-white text-[#2DB24A] border border-[#2DB24A]/40 text-[9px] font-bold px-2 py-0.5 rounded shadow-2xs inline-block">
                Komisi Referral Multi-Tier
              </span>
              <h4 className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-[#2DB24A]">
                Saloka Affiliate System
              </h4>
              <p className="text-[11px] text-slate-500 line-clamp-2">
                Bagikan link produk atau komunitas dan dapatkan penghasilan komisi multi-level secara otomatis.
              </p>
              <div className="flex items-center gap-1 text-[10px] text-slate-400 pt-0.5">
                <Coins size={10} />
                <span>Komisi Langsung Masuk Saldo</span>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* ── MODE PENCARIAN ───────────────────────────────────────────────── */}
      <div id="mode-pencarian" className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xs space-y-4 mb-5">
        
        {/* Section Header with Product Marketplace / Booking Jasa Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div>
            <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base sm:text-lg">
              <img src="/images/search green icon.svg" alt="Mode Pencarian" className="w-5 h-5 object-contain" />
              <h3>Katalog Produk & Jasa</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Jelajahi produk UMKM pilihan dan layanan profesional langsung dari database Saloka.
            </p>
          </div>

          {/* Toggle Buttons */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 self-start sm:self-center shrink-0">
            <button
              type="button"
              onClick={() => handleTabChange('MARKETPLACE')}
              className={`px-3.5 sm:px-4 py-2 rounded-lg font-extrabold text-xs transition-all cursor-pointer border-none ${
                activeTab === 'MARKETPLACE'
                  ? 'bg-[#2DB24A] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-transparent'
              }`}
            >
              Product Marketplace
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('JASA')}
              className={`px-3.5 sm:px-4 py-2 rounded-lg font-extrabold text-xs transition-all cursor-pointer border-none ${
                activeTab === 'JASA'
                  ? 'bg-[#2DB24A] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-transparent'
              }`}
            >
              Booking Jasa
            </button>
          </div>
        </div>

        {/* Filter Category Chips aligned with Marketplace & Jasa DB */}
        <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-hide -mx-1 px-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {activeCategoryList.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => setSelectedCategory(chip.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 border ${
                selectedCategory === chip.key
                  ? 'bg-[#2DB24A] text-white border-[#2DB24A] shadow-2xs font-bold'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <img src={chip.icon} alt={chip.label} className="w-3.5 h-3.5 object-contain" />
              <span>{chip.label}</span>
            </button>
          ))}
        </div>

        {/* Product / Service Cards Grid */}
        {activeTab === 'MARKETPLACE' ? (
          filteredProducts.length === 0 ? (
            <div className="text-center py-12 bg-[#F8FAFC] rounded-2xl border border-slate-200/80">
              <p className="text-xs sm:text-sm font-bold text-slate-700">Belum ada produk di kategori ini</p>
              <Link href="/market" className="mt-2 inline-block text-xs text-[#2DB24A] font-bold hover:underline">
                Lihat semua produk di Marketplace →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3.5 pt-1">
              {filteredProducts.map((prod) => {
                const productId = prod.id || ''
                const idNum = Math.abs(parseInt(productId.slice(-3), 36) || 0)
                const discount = (idNum % 3 === 0) ? (10 + (idNum % 5) * 5) : 0
                const originalPrice = discount ? Math.round(prod.price * (100 / (100 - discount))) : prod.price
                const rating = (4.5 + (idNum % 5) * 0.1).toFixed(1)
                const sold = (idNum % 10) * 25 + 10
                const storeNames = ['Moell Store', 'Gallery Gadget', 'Wuben Light ID', 'Stanley ID', 'OMG Store', 'Infiniti Gadget']
                const storeName = prod.merchant?.name || storeNames[idNum % storeNames.length]

                return (
                  <Link
                    key={prod.id}
                    href={`/market/product/${prod.id}`}
                    className="group flex flex-col bg-white border border-slate-200/90 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-[0_4px_16px_0_rgba(45,178,74,0.12)] hover:border-[#2DB24A]/50 h-full relative cursor-pointer"
                  >
                    {/* Image */}
                    <div className="w-full aspect-square bg-slate-100 relative overflow-hidden shrink-0">
                      {prod.imageUrl ? (
                        <img
                          src={prod.imageUrl}
                          alt={prod.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                          <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">{formatCategoryName(prod.category)}</span>
                        </div>
                      )}
                      {discount > 0 && (
                        <div className="absolute top-2 left-2 bg-[#E8F8EE] text-[#2DB24A] font-extrabold text-[10px] px-1.5 py-0.5 rounded-md border border-[#C8E6C9] shadow-2xs">
                          {discount}%
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2 bg-slate-900/75 backdrop-blur-xs text-white text-[9px] font-semibold px-1.5 py-0.5 rounded">
                        {formatCategoryName(prod.category)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-2.5 flex-1 flex flex-col justify-between space-y-1.5">
                      <div>
                        <h4 className="text-xs font-medium text-slate-800 line-clamp-2 min-h-[32px] leading-snug group-hover:text-[#2DB24A] transition-colors">
                          {prod.title}
                        </h4>
                        <div className="pt-1">
                          <p className="text-sm font-extrabold text-slate-900 leading-tight">
                            {prod.price === 0 ? 'Gratis' : `Rp ${prod.price.toLocaleString('id-ID')}`}
                          </p>
                          {discount > 0 && (
                            <div className="flex items-center gap-1.5 pt-0.5">
                              <span className="text-[10px] text-slate-400 line-through">
                                Rp {originalPrice.toLocaleString('id-ID')}
                              </span>
                              <span className="bg-[#E8F8EE] text-[#2DB24A] font-extrabold text-[9px] px-1 py-0.2 rounded border border-[#C8E6C9]">
                                {discount}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-1.5 border-t border-slate-100 space-y-1">
                        <div className="flex items-center gap-1 text-[10px] text-slate-500">
                          <span className="text-amber-500 font-bold">★ {rating}</span>
                          <span>•</span>
                          <span>{sold}+ terjual</span>
                        </div>
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 truncate flex-1 min-w-0">
                            <span className="text-[#2DB24A] font-bold text-xs shrink-0">✔</span>
                            <span className="truncate font-medium text-slate-600">{storeName}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-lg bg-[#2DB24A] hover:bg-[#24943E] text-white text-[9px] font-bold shadow-2xs shrink-0">
                            + Keranjang
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )
        ) : (
          filteredServices.length === 0 ? (
            <div className="text-center py-12 bg-[#F8FAFC] rounded-2xl border border-slate-200/80">
              <p className="text-xs sm:text-sm font-bold text-slate-700">Belum ada layanan jasa di kategori ini</p>
              <Link href="/jasa" className="mt-2 inline-block text-xs text-[#2DB24A] font-bold hover:underline">
                Lihat semua jasa & layanan →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3.5 pt-1">
              {filteredServices.map((service) => {
                const image = service.images?.[0] || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80'
                return (
                  <Link
                    key={service.id}
                    href={`/jasa/${service.id}`}
                    className="group flex flex-col bg-white border border-slate-200/90 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-[0_4px_16px_0_rgba(45,178,74,0.12)] hover:border-[#2DB24A]/50 h-full relative cursor-pointer"
                  >
                    {/* Image */}
                    <div className="w-full aspect-square bg-slate-100 relative overflow-hidden shrink-0">
                      <img
                        src={image}
                        alt={service.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute bottom-2 left-2 bg-blue-600/80 backdrop-blur-xs text-white text-[9px] font-semibold px-1.5 py-0.5 rounded">
                        {service.category || 'Jasa'}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-2.5 flex-1 flex flex-col justify-between space-y-1.5">
                      <div>
                        <h4 className="text-xs font-medium text-slate-800 line-clamp-2 min-h-[32px] leading-snug group-hover:text-[#2DB24A] transition-colors">
                          {service.title}
                        </h4>
                        <div className="pt-1">
                          <p className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight">
                            {service.pricePerSession
                              ? `Rp ${service.pricePerSession.toLocaleString('id-ID')} / sesi`
                              : service.pricePerDay
                              ? `Rp ${service.pricePerDay.toLocaleString('id-ID')} / hari`
                              : 'Hubungi Penyedia'}
                          </p>
                        </div>
                      </div>

                      <div className="pt-1.5 border-t border-slate-100 space-y-1">
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 truncate">
                          <MapPin size={10} className="text-[#2DB24A] shrink-0" />
                          <span className="truncate">{service.location || 'Online / Terdekat'}</span>
                        </div>
                        <div className="pt-0.5">
                          <span className="w-full text-center block py-1 rounded-lg bg-[#2DB24A] hover:bg-[#24943E] text-white text-[10px] font-bold shadow-2xs">
                            Booking Jasa
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )
        )}

        {/* Footer View All CTA */}
        <div className="pt-2 text-center">
          <Link
            href={activeTab === 'MARKETPLACE' ? (selectedCategory ? `/market?category=${selectedCategory}` : '/market') : '/jasa'}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2DB24A] hover:underline"
          >
            <span>{activeTab === 'MARKETPLACE' ? 'Lihat Semua Produk di Marketplace' : 'Lihat Semua Layanan di Jasa'}</span>
            <ChevronRight size={14} />
          </Link>
        </div>

      </div>

    </section>
  )
}
