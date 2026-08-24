'use client'

import React, { useState, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Tag,
  Truck,
  Coins,
  Zap,
  Building2,
  GraduationCap,
  Wrench,
  ArrowUpDown,
  Search,
  History,
  TrendingUp,
  X,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Star,
  Users
} from 'lucide-react'
import { formatCategoryName } from '@/lib/utils'

interface Product {
  id: string
  title: string
  description?: string
  price: number
  category: string
  stock?: number
  imageUrl?: string
  merchantId?: string
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
}

interface HomeExplorerProps {
  products: Product[]
  services: Service[]
}

const NEARBY_ITEMS = [
  { id: 'near-1', title: 'Risoles Mayu', price: 2000, rating: '4.6', sold: '25', store: 'Kelurahan Cihapit, Bandung', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=400&q=80' },
  { id: 'near-2', title: 'Klepon', price: 2000, rating: '4.6', sold: '25', store: 'Kelurahan Cihapit, Bandung', image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=400&q=80' },
  { id: 'near-3', title: 'Lemper', price: 2500, rating: '4.6', sold: '25', store: 'Kelurahan Cihapit, Bandung', image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=400&q=80' },
  { id: 'near-4', title: 'Nagasari', price: 2000, rating: '4.6', sold: '25', store: 'Kelurahan Cihapit, Bandung', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80' },
  { id: 'near-5', title: 'Kue Putu', price: 3000, rating: '4.6', sold: '25', store: 'Kelurahan Cihapit, Bandung', image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80' },
  { id: 'near-6', title: 'Onde-onde', price: 1500, rating: '4.6', sold: '25', store: 'Kelurahan Cihapit, Bandung', image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=400&q=80' },
]

const POPULAR_COMMUNITIES = [
  { id: 'comm-1', title: 'Koperasi Produksi Maju Bersama', badge: 'Koperasi Reguler', desc: 'Koperasi produksi resmi pelaku usaha mikro kecil dan menengah...', members: '0 Anggota', image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=500&q=80' },
  { id: 'comm-2', title: 'Koperasi Produksi Maju Bersama', badge: 'Koperasi Reguler', desc: 'Koperasi produksi resmi pelaku usaha mikro kecil dan menengah...', members: '0 Anggota', image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=500&q=80' },
  { id: 'comm-3', title: 'Koperasi Produksi Maju Bersama', badge: 'Koperasi Reguler', desc: 'Koperasi produksi resmi pelaku usaha mikro kecil dan menengah...', members: '0 Anggota', image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=500&q=80' },
]

const FIGMA_MARKETPLACE_PRODUCTS = [
  { id: 'fg-1', title: 'Lampu LED Strip', price: 1450000, originalPrice: 2042254, discount: '23%', rating: '4.6', sold: '0', seller: 'RajaGadget ID', image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=400&q=80' },
  { id: 'fg-2', title: 'Pick Gitar Set 12', price: 2400000, originalPrice: 2666667, discount: '20%', rating: '4.7', sold: '250+', seller: 'BintangShop ID', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80' },
  { id: 'fg-3', title: 'Blouse Katun Import', price: 1150000, originalPrice: 1642857, discount: '29%', rating: '4.6', sold: '5+', seller: 'KaryaNusantara', image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=400&q=80' },
  { id: 'fg-4', title: 'Alat Tulis Set', price: 150000, originalPrice: 208333, discount: '17%', rating: '4.4', sold: '100+', seller: 'BeautyHaul ID', image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=400&q=80' },
  { id: 'fg-5', title: 'Lip Tint Velvet', price: 3950000, originalPrice: 4759036, discount: '29%', rating: '3.3', sold: '25+', seller: 'TechZone Store', image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=400&q=80' },
  { id: 'fg-6', title: 'Pot Tanaman Ceramic', price: 4000000, originalPrice: 5555556, discount: '10%', rating: '4.4', sold: '100+', seller: 'MitraUsaha ID', image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=400&q=80' },
  { id: 'fg-7', title: 'Topi Pantai Anyaman', price: 3306000, originalPrice: 3890000, discount: '29%', rating: '4.7', sold: '1.2k+', seller: 'Kria Nusantara', image: 'https://images.unsplash.com/photo-1521369984125-650a00468f42?auto=format&fit=crop&w=400&q=80' },
  { id: 'fg-8', title: 'Tripod Kamera Pro', price: 1550000, originalPrice: 1850000, discount: '25%', rating: '4.9', sold: '800+', seller: 'KameraCenter', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&q=80' },
  { id: 'fg-9', title: 'Sandal Kulit Asli', price: 2806000, originalPrice: 3300000, discount: '23%', rating: '4.8', sold: '2k+', seller: 'Kria Nusantara', image: 'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?auto=format&fit=crop&w=400&q=80' },
  { id: 'fg-10', title: 'Rak Buku Minimalis', price: 2618000, originalPrice: 3100000, discount: '5%', rating: '4.7', sold: '1.5k+', seller: 'SmartFurniture', image: 'https://images.unsplash.com/photo-1594620302200-9a782278ab72?auto=format&fit=crop&w=400&q=80' },
  { id: 'fg-11', title: 'Phone Case Premium', price: 280500, originalPrice: 350000, discount: '29%', rating: '4.9', sold: '5k+', seller: 'RajaGadget ID', image: 'https://images.unsplash.com/photo-1586105251261-72a756497a11?auto=format&fit=crop&w=400&q=80' },
  { id: 'fg-12', title: 'Syal Pashmina Silk', price: 3056000, originalPrice: 3600000, discount: '11%', rating: '4.8', sold: '900+', seller: 'WeaveCraft ID', image: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=400&q=80' }
]

const FILTER_CHIPS = [
  { key: 'ALL', label: 'Kategori', icon: '/images/kategori icon.svg' },
  { key: 'HANDPHONE', label: 'Handphone & Tablet', icon: '/images/handphone&tablet icon.svg' },
  { key: 'TOPUP', label: 'Top-Up & Tagihan', icon: '/images/topup tagihan icon.svg' },
  { key: 'ELEKTRONIK', label: 'Elektronik', icon: '/images/elektronik icon.svg' },
  { key: 'HEWAN', label: 'Perawatan Hewan', icon: '/images/perawatan hewan icon.svg' },
  { key: 'KEUANGAN', label: 'Keuangan', icon: '/images/keuangan icon.svg' },
  { key: 'KOMPUTER', label: 'Komputer & Laptop', icon: '/images/komputer&laptop icon.svg' }
]

export default function HomeExplorer({ products, services }: HomeExplorerProps) {
  const [activeTab, setActiveTab] = useState<'MARKETPLACE' | 'JASA'>('MARKETPLACE')
  const [selectedChip, setSelectedChip] = useState('ALL')

  return (
    <section className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 md:px-8 py-4 space-y-6 sm:space-y-7">
      
      {/* ── SECTION 1: SALOKA TERDEKAT & SEKITARMU (FIGMA SPEC 1 & 2) ── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-[#E8F5E9] text-[#2DB24A] border border-[#C8E6C9] text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
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
              <span className="bg-[#EBF3FE] text-[#1E40AF] text-[11px] font-bold px-3 py-1 rounded-full inline-flex items-center gap-1 cursor-pointer hover:bg-[#DBEAFE] transition-colors">
                📍 Menampilkan
              </span>
            </div>
          </div>

          <Link
            href="/market?cat=kuliner"
            className="text-xs font-bold text-[#2DB24A] hover:underline flex items-center gap-1 self-start sm:self-center shrink-0"
          >
            <span>Buka Snackbox</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {/* 6 Horizontal Cards Grid matching Figma screenshot 2 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5 pt-1">
          {NEARBY_ITEMS.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs hover:shadow-md hover:border-[#2DB24A]/60 transition-all duration-200 flex flex-col justify-between group p-2 text-slate-900"
            >
              <div className="space-y-2">
                <div className="w-full aspect-square bg-slate-50 relative rounded-lg overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-[#2DB24A] transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-xs font-extrabold text-slate-900 mt-0.5">
                    Rp {item.price.toLocaleString('id-ID')}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1">
                    <img src="/images/Star.svg" alt="Rating" className="w-2.5 h-2.5 object-contain shrink-0" />
                    <span className="font-bold text-slate-700">{item.rating}</span>
                    <span>·</span>
                    <span>Terjual {item.sold}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                    {item.store}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 2: KOMUNITAS POPULER (FIGMA SPEC 2) ── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-2xs space-y-4">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {POPULAR_COMMUNITIES.map((comm, idx) => (
            <Link
              key={idx}
              href="/community"
              className="bg-[#F8FAFC] rounded-xl border border-slate-200/80 p-3.5 flex gap-3 hover:border-[#2DB24A]/60 shadow-2xs hover:shadow-md transition-all group"
            >
              <img
                src={comm.image}
                alt={comm.title}
                className="w-16 h-16 rounded-xl object-cover shrink-0 group-hover:scale-105 transition-transform"
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

      {/* ── SECTION 3: SALOKA ACADEMY & AFFILIATE HUB (2 COLUMNS SIDE BY SIDE) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left Column: Saloka Academy */}
        <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-base font-extrabold text-slate-900">Saloka Academy</h3>
            <Link href="/academy" className="text-xs font-bold text-[#2DB24A] hover:underline flex items-center gap-1">
              <span>Belajar di Saloka Academy</span>
              <ChevronRight size={14} />
            </Link>
          </div>
          <Link href="/academy" className="bg-[#F8FAFC] rounded-xl border border-slate-200/80 p-3 flex gap-3 hover:border-[#2DB24A]/60 shadow-2xs transition-all group">
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=400&q=80"
              alt="Saloka Academy"
              className="w-16 h-16 rounded-xl object-cover shrink-0 group-hover:scale-105 transition-transform"
            />
            <div className="space-y-1">
              <span className="bg-white text-[#2DB24A] border border-[#2DB24A]/40 text-[9px] font-bold px-2 py-0.5 rounded shadow-2xs inline-block">
                Koperasi Reguler
              </span>
              <h4 className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-[#2DB24A]">
                Koperasi Produksi Maju Bersama
              </h4>
              <p className="text-[11px] text-slate-500 line-clamp-2">
                Koperasi produksi resmi pelaku usaha mikro kecil dan menengah...
              </p>
              <div className="flex items-center gap-1 text-[10px] text-slate-400 pt-0.5">
                <Users size={10} />
                <span>0 Anggota</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Right Column: Affiliate Hub */}
        <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-base font-extrabold text-slate-900">Affiliate Hub</h3>
            <Link href="/affiliate" className="text-xs font-bold text-[#2DB24A] hover:underline flex items-center gap-1">
              <span>Jadi affiliate sekarang</span>
              <ChevronRight size={14} />
            </Link>
          </div>
          <Link href="/affiliate" className="bg-[#F8FAFC] rounded-xl border border-slate-200/80 p-3 flex gap-3 hover:border-[#2DB24A]/60 shadow-2xs transition-all group">
            <img
              src="https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=400&q=80"
              alt="Affiliate Hub"
              className="w-16 h-16 rounded-xl object-cover shrink-0 group-hover:scale-105 transition-transform"
            />
            <div className="space-y-1">
              <span className="bg-white text-[#2DB24A] border border-[#2DB24A]/40 text-[9px] font-bold px-2 py-0.5 rounded shadow-2xs inline-block">
                Koperasi Reguler
              </span>
              <h4 className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-[#2DB24A]">
                Koperasi Produksi Maju Bersama
              </h4>
              <p className="text-[11px] text-slate-500 line-clamp-2">
                Koperasi produksi resmi pelaku usaha mikro kecil dan menengah...
              </p>
              <div className="flex items-center gap-1 text-[10px] text-slate-400 pt-0.5">
                <Users size={10} />
                <span>0 Anggota</span>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* ── SECTION 4: MODE PENCARIAN & KATALOG PRODUK (FIGMA SPEC 3) ── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-2xs space-y-5">
        
        {/* Section Header with Product Marketplace / Booking Jasa Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base sm:text-lg">
              <img src="/images/search green icon.svg" alt="Mode Pencarian" className="w-5 h-5 object-contain" />
              <h3>Mode Pencarian</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Mulai dari produk hingga jasa profesional, Saloka punya semuanya!
            </p>
          </div>

          {/* Toggle Buttons matching Figma screenshot 3 */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 self-start sm:self-center shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('MARKETPLACE')}
              className={`px-4 py-2 rounded-lg font-extrabold text-xs transition-all cursor-pointer border-none ${
                activeTab === 'MARKETPLACE'
                  ? 'bg-[#2DB24A] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-transparent'
              }`}
            >
              Product Marketplace
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('JASA')}
              className={`px-4 py-2 rounded-lg font-extrabold text-xs transition-all cursor-pointer border-none ${
                activeTab === 'JASA'
                  ? 'bg-[#2DB24A] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-transparent'
              }`}
            >
              Booking Jasa
            </button>
          </div>
        </div>

        {/* Filter Category Chips with User Custom SVGs matching Figma screenshot 3 */}
        <div className="flex gap-2.5 overflow-x-auto pb-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => setSelectedChip(chip.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 shrink-0 border ${
                selectedChip === chip.key
                  ? 'bg-[#2DB24A] text-white border-[#2DB24A] shadow-2xs'
                  : 'bg-white border-slate-200/90 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <img src={chip.icon} alt={chip.label} className="w-4 h-4 object-contain" />
              <span>{chip.label}</span>
            </button>
          ))}
        </div>

        {/* 12 Product Cards Grid (2 Rows x 6 Columns) matching Figma screenshot 3 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5 pt-2">
          {FIGMA_MARKETPLACE_PRODUCTS.map((prod) => (
            <Link
              key={prod.id}
              href="/market"
              className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs hover:shadow-md hover:border-[#2DB24A]/60 transition-all duration-200 flex flex-col justify-between group p-2.5 text-slate-900"
            >
              <div className="space-y-2">
                {/* Image */}
                <div className="w-full aspect-square bg-slate-50 relative rounded-xl overflow-hidden">
                  <img
                    src={prod.image}
                    alt={prod.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-1.5 right-1.5 bg-[#FFF3D6] text-[#D97706] border border-[#FDE68A] text-[10px] font-extrabold px-1.5 py-0.5 rounded-md shadow-2xs">
                    {prod.discount}
                  </span>
                </div>

                {/* Content */}
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-[#2DB24A] transition-colors leading-tight">
                    {prod.title}
                  </h4>
                  <p className="text-xs font-extrabold text-slate-900 leading-tight">
                    Rp {prod.price.toLocaleString('id-ID')}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <span className="line-through">Rp {prod.originalPrice.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 pt-0.5">
                    <img src="/images/Star.svg" alt="Rating" className="w-2.5 h-2.5 object-contain shrink-0" />
                    <span className="font-bold text-slate-700">{prod.rating}</span>
                    <span>·</span>
                    <span>Terjual {prod.sold}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-1">
                    {prod.seller}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>

    </section>
  )
}
