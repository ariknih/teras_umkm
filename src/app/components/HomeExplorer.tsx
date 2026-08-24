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
  { id: 'near-1', title: 'Risoles Risol', price: 2000, rating: '4.9', sold: '30+', store: 'Kue Basah Mba Ningsih', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=400&q=80' },
  { id: 'near-2', title: 'Klepon', price: 2500, rating: '4.8', sold: '50+', store: 'Kue Basah Mba Ningsih', image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=400&q=80' },
  { id: 'near-3', title: 'Lemper', price: 2500, rating: '4.9', sold: '25+', store: 'Kue Basah Mba Ningsih', image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=400&q=80' },
  { id: 'near-4', title: 'Nagasari', price: 2000, rating: '4.9', sold: '40+', store: 'Kue Basah Mba Ningsih', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80' },
  { id: 'near-5', title: 'Kue Putu', price: 3000, rating: '4.8', sold: '20+', store: 'Kue Basah Mba Ningsih', image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80' },
  { id: 'near-6', title: 'Onde-onde', price: 1500, rating: '4.9', sold: '60+', store: 'Kue Basah Mba Ningsih', image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=400&q=80' },
]

const POPULAR_COMMUNITIES = [
  { id: 'comm-1', title: 'Koperasi Produksi Maju Bersama', badge: 'Koperasi Negeri', desc: 'Koperasi produksi olahan pangan lokal serta mebel kayu dan kerajinan...', members: '45 Anggota', image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=500&q=80' },
  { id: 'comm-2', title: 'Koperasi Produksi Maju Bersama', badge: 'Koperasi Negeri', desc: 'Koperasi produksi olahan pangan lokal serta mebel kayu dan kerajinan...', members: '45 Anggota', image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=500&q=80' },
  { id: 'comm-3', title: 'Koperasi Produksi Maju Bersama', badge: 'Koperasi Negeri', desc: 'Koperasi produksi olahan pangan lokal serta mebel kayu dan kerajinan...', members: '45 Anggota', image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=500&q=80' },
]

const FIGMA_MARKETPLACE_PRODUCTS = [
  { id: 'fg-1', title: 'Lampu LED Strip', price: 1450000, originalPrice: 1950000, discount: '25%', rating: '4.8', sold: '2k+', seller: 'RajaDekor.ID', image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=400&q=80' },
  { id: 'fg-2', title: 'Pik Gitar Set 10', price: 2420000, originalPrice: 2900000, discount: '16%', rating: '4.7', sold: '500+', seller: 'Bintang Musik ID', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80' },
  { id: 'fg-3', title: 'Blouse Katun Import', price: 1150000, originalPrice: 1350000, discount: '15%', rating: '4.9', sold: '1k+', seller: 'Aprikot Fashion', image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=400&q=80' },
  { id: 'fg-4', title: 'Alat Tulis Set', price: 155000, originalPrice: 180000, discount: '14%', rating: '4.6', sold: '250+', seller: 'SmartStationery', image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=400&q=80' },
  { id: 'fg-5', title: 'Lip Tint Velvet', price: 3550000, originalPrice: 4200000, discount: '15%', rating: '4.8', sold: '2.5k+', seller: 'EveryGlow Store', image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=400&q=80' },
  { id: 'fg-6', title: 'Pot Tanaman Keramik', price: 4050000, originalPrice: 4900000, discount: '17%', rating: '4.4', sold: '150+', seller: 'KasaDekor ID', image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=400&q=80' },
  { id: 'fg-7', title: 'Topi Pantai Anyaman', price: 3306000, originalPrice: 3890000, discount: '15%', rating: '4.7', sold: '1.2k+', seller: 'Kria Nusantara', image: 'https://images.unsplash.com/photo-1521369984125-650a00468f42?auto=format&fit=crop&w=400&q=80' },
  { id: 'fg-8', title: 'Tripod Kamera Pro', price: 1550000, originalPrice: 1850000, discount: '16%', rating: '4.9', sold: '800+', seller: 'KameraCenter', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&q=80' },
  { id: 'fg-9', title: 'Sandal Kulit Asli', price: 2806000, originalPrice: 3300000, discount: '15%', rating: '4.8', sold: '2k+', seller: 'Kria Nusantara', image: 'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?auto=format&fit=crop&w=400&q=80' },
  { id: 'fg-10', title: 'Rak Buku Minimalis', price: 2618000, originalPrice: 3100000, discount: '15%', rating: '4.7', sold: '1.5k+', seller: 'SmartFurniture', image: 'https://images.unsplash.com/photo-1594620302200-9a782278ab72?auto=format&fit=crop&w=400&q=80' },
  { id: 'fg-11', title: 'Phone Stand Premium', price: 280500, originalPrice: 350000, discount: '20%', rating: '4.9', sold: '5k+', seller: 'RajaDekor.ID', image: 'https://images.unsplash.com/photo-1586105251261-72a756497a11?auto=format&fit=crop&w=400&q=80' },
  { id: 'fg-12', title: 'Syal Rajut Wool Soft', price: 3056000, originalPrice: 3600000, discount: '15%', rating: '4.8', sold: '900+', seller: 'WeaveCraft ID', image: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=400&q=80' },
  { id: 'fg-13', title: 'Termometer Digital', price: 2490000, originalPrice: 2900000, discount: '14%', rating: '4.6', sold: '400+', seller: 'SehatSentosa', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80' },
  { id: 'fg-14', title: 'Madu Hutan Asli 500ml', price: 1280900, originalPrice: 1600000, discount: '20%', rating: '4.9', sold: '3k+', seller: 'NusantaraHerb', image: 'https://images.unsplash.com/photo-1587049352847-4a222e784d38?auto=format&fit=crop&w=400&q=80' },
  { id: 'fg-15', title: 'Stiker Laptop Pack', price: 2190000, originalPrice: 2600000, discount: '16%', rating: '4.8', sold: '1.8k+', seller: 'PrintArt Studio', image: 'https://images.unsplash.com/photo-1572375992501-4b0892d50c69?auto=format&fit=crop&w=400&q=80' },
  { id: 'fg-16', title: 'Dress Wanita Elegant', price: 3390000, originalPrice: 3990000, discount: '15%', rating: '4.9', sold: '600+', seller: 'VelvetAttire', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=400&q=80' },
  { id: 'fg-17', title: 'Buku Jurnal A5', price: 3500000, originalPrice: 4100000, discount: '14%', rating: '4.7', sold: '1.1k+', seller: 'PaperCraft Studio', image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80' },
  { id: 'fg-18', title: 'Cokelat Batangan', price: 2800000, originalPrice: 3300000, discount: '15%', rating: '4.8', sold: '1.4k+', seller: 'KakaoNusantara', image: 'https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&w=400&q=80' },
  { id: 'fg-19', title: 'Serum Vitamin C', price: 2630000, originalPrice: 3100000, discount: '15%', rating: '4.9', sold: '2.2k+', seller: 'GlowLab ID', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=80' },
  { id: 'fg-20', title: 'Stop Kontak 5 Lubang', price: 1290000, originalPrice: 1500000, discount: '14%', rating: '4.8', sold: '3k+', seller: 'ElektroMatik', image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=400&q=80' },
  { id: 'fg-21', title: 'Obeng Set 25 in 1', price: 1280000, originalPrice: 1600000, discount: '20%', rating: '4.9', sold: '4k+', seller: 'TeknoTools Official', image: 'https://images.unsplash.com/photo-1581783898377-1c85bf937427?auto=format&fit=crop&w=400&q=80' },
  { id: 'fg-22', title: 'Timer Digital Dapur', price: 4700000, originalPrice: 5500000, discount: '14%', rating: '4.7', sold: '700+', seller: 'KitchenExpert Official', image: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?auto=format&fit=crop&w=400&q=80' },
  { id: 'fg-23', title: 'Gelas Tumbler Saloka', price: 1090300, originalPrice: 1300000, discount: '16%', rating: '4.9', sold: '1.5k+', seller: 'Saloka Official', image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80' },
  { id: 'fg-24', title: 'Dompet Kulit Pria', price: 1090500, originalPrice: 1300000, discount: '16%', rating: '4.8', sold: '2k+', seller: 'PusakaLeather', image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=400&q=80' }
]

const FILTER_CHIPS = [
  { key: 'ALL', label: 'Kategori', isDropdown: true },
  { key: 'HANDICRAFT', label: 'Handicraft & Souvenir' },
  { key: 'FNB', label: 'F&B - Olahan Makanan' },
  { key: 'ELEKTRONIK', label: 'Elektronik' },
  { key: 'PERTANIAN', label: 'Pertanian Organik' },
  { key: 'KEUANGAN', label: 'Keuangan' },
  { key: 'KOMPUTER', label: 'Komputer & Laptop' }
]

export default function HomeExplorer({ products, services }: HomeExplorerProps) {
  const [activeTab, setActiveTab] = useState<'MARKETPLACE' | 'JASA'>('MARKETPLACE')
  const [selectedChip, setSelectedChip] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <section className="w-full max-w-[1240px] mx-auto px-3 sm:px-6 py-4 space-y-8">
      
      {/* ── SECTION 1: SALOKA TERDEKAT & SEKITARMU (FIGMA SPEC 1) ── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-[#2DB24A] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs uppercase tracking-wider">
                Saloka Terdekat
              </span>
              <span className="bg-amber-400 text-slate-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-2xs uppercase">
                Graha
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              Jajanan & kue tradisional dari sekitarmu
            </h3>
            <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
              Dibuat langsung oleh pembuat kue tradisional di sekitarmu, higienis, dikemas rapi, diantar segar hangat.
            </p>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 pt-0.5">
              <MapPin size={12} className="text-[#2DB24A]" />
              <span>Minomartani</span>
            </div>
          </div>

          <Link
            href="/market?cat=kuliner"
            className="text-xs font-bold text-[#2DB24A] hover:underline flex items-center gap-1 self-start sm:self-center shrink-0"
          >
            <span>Buka Terdekat</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {/* 6 Horizontal Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-1">
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
                  <p className="text-xs font-extrabold text-[#2DB24A] mt-0.5">
                    Rp {item.price.toLocaleString('id-ID')}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1">
                    <Star size={10} className="fill-amber-400 text-amber-400 shrink-0" />
                    <span>{item.rating}</span>
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
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
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
              className="bg-white rounded-xl border border-slate-200/90 p-3.5 flex gap-3 hover:border-[#2DB24A]/60 shadow-2xs hover:shadow-md transition-all group"
            >
              <img
                src={comm.image}
                alt={comm.title}
                className="w-16 h-16 rounded-xl object-cover shrink-0 group-hover:scale-105 transition-transform"
              />
              <div className="space-y-1 flex-1 min-w-0">
                <span className="bg-[#E8F5E9] text-[#2DB24A] border border-[#C8E6C9] text-[9px] font-bold px-2 py-0.5 rounded shadow-2xs inline-block">
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

      {/* ── SECTION 3: SALOKA ACADEMY & AFFILIATE HUB (2 COLUMNS SIDE BY SIDE - FIGMA SPEC 3) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Column: Saloka Academy */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-base font-bold text-slate-900">Saloka Academy</h3>
            <Link href="/academy" className="text-xs font-bold text-[#2DB24A] hover:underline flex items-center gap-1">
              <span>Belajar di Saloka Academy</span>
              <ChevronRight size={14} />
            </Link>
          </div>
          <Link href="/academy" className="bg-white rounded-xl border border-slate-200/80 p-3 flex gap-3 hover:border-[#2DB24A]/60 shadow-2xs transition-all group">
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=400&q=80"
              alt="Saloka Academy"
              className="w-16 h-16 rounded-xl object-cover shrink-0 group-hover:scale-105 transition-transform"
            />
            <div className="space-y-1">
              <span className="bg-[#E8F5E9] text-[#2DB24A] border border-[#C8E6C9] text-[9px] font-bold px-2 py-0.5 rounded shadow-2xs inline-block">
                Koperasi Negeri
              </span>
              <h4 className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-[#2DB24A]">
                Koperasi Produksi Maju Bersama
              </h4>
              <p className="text-[11px] text-slate-500 line-clamp-2">
                Koperasi produksi olahan pangan lokal serta mebel kayu dan kerajinan...
              </p>
            </div>
          </Link>
        </div>

        {/* Right Column: Affiliate Hub */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-base font-bold text-slate-900">Affiliate Hub</h3>
            <Link href="/affiliate" className="text-xs font-bold text-[#2DB24A] hover:underline flex items-center gap-1">
              <span>Jadi affiliate sekarang</span>
              <ChevronRight size={14} />
            </Link>
          </div>
          <Link href="/affiliate" className="bg-white rounded-xl border border-slate-200/80 p-3 flex gap-3 hover:border-[#2DB24A]/60 shadow-2xs transition-all group">
            <img
              src="https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=400&q=80"
              alt="Affiliate Hub"
              className="w-16 h-16 rounded-xl object-cover shrink-0 group-hover:scale-105 transition-transform"
            />
            <div className="space-y-1">
              <span className="bg-[#E8F5E9] text-[#2DB24A] border border-[#C8E6C9] text-[9px] font-bold px-2 py-0.5 rounded shadow-2xs inline-block">
                Koperasi Negeri
              </span>
              <h4 className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-[#2DB24A]">
                Koperasi Produksi Maju Bersama
              </h4>
              <p className="text-[11px] text-slate-500 line-clamp-2">
                Koperasi produksi olahan pangan lokal serta mebel kayu dan kerajinan...
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* ── SECTION 4: MODE PENCARIAN & KATALOG PRODUK (FIGMA SPEC 4 & 5) ── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-xs space-y-5">
        
        {/* Section Header with Product Marketplace / Booking Jasa Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base sm:text-lg">
              <Search size={18} className="text-[#2DB24A]" />
              <h3>Mode Pencarian</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Mulai dari produk hingga jasa profesional, Saloka punya semuanya!
            </p>
          </div>

          {/* Toggle Buttons matching Figma screenshot 4 */}
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

        {/* Filter Category Chips matching Figma screenshot 4 */}
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => setSelectedChip(chip.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                selectedChip === chip.key
                  ? 'bg-[#2DB24A] text-white shadow-2xs'
                  : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              <span>{chip.label}</span>
            </button>
          ))}
        </div>

        {/* 24 Product Cards Grid (4 Rows x 6 Columns) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5 pt-2">
          {FIGMA_MARKETPLACE_PRODUCTS.map((prod) => (
            <Link
              key={prod.id}
              href="/market"
              className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs hover:shadow-md hover:border-[#2DB24A]/60 transition-all duration-200 flex flex-col justify-between group p-2 text-slate-900"
            >
              <div className="space-y-2">
                {/* Image */}
                <div className="w-full aspect-square bg-slate-50 relative rounded-lg overflow-hidden">
                  <img
                    src={prod.image}
                    alt={prod.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-1 right-1 bg-amber-400 text-slate-900 text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-2xs">
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
                  <p className="text-[10px] text-slate-400 line-through leading-none">
                    Rp {prod.originalPrice.toLocaleString('id-ID')}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 pt-1">
                    <Star size={10} className="fill-amber-400 text-amber-400 shrink-0" />
                    <span>{prod.rating}</span>
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

        {/* Bottom Load More Button matching Figma screenshot */}
        <div className="flex justify-center pt-4">
          <button
            type="button"
            className="px-8 py-2.5 bg-[#2DB24A] hover:bg-[#24943E] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer border-none"
          >
            Lihat lebih banyak produk
          </button>
        </div>

      </div>

    </section>
  )
}
