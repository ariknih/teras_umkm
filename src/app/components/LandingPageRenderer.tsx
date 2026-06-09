'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Star, 
  Shield, 
  Zap, 
  MapPin, 
  MessageSquare, 
  Phone, 
  ArrowRight, 
  CheckCircle2, 
  ChevronDown, 
  Globe, 
  DollarSign, 
  Briefcase, 
  ExternalLink,
  Mail,
  User,
  Clock,
  Users,
  Award,
  ArrowUpRight,
  Compass,
  Heart,
  Eye,
  Settings,
  Grid
} from 'lucide-react'

import UserQRCode from '@/components/UserQRCode'

// Custom Instagram SVG Component
const InstagramIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
)

interface LandingPageRendererProps {
  templateId: string
  user: any
  config: any
  products: any[]
  distance?: string | number | null
  badges?: any[]
  isEditable?: boolean
  onWYSIWYGFocus?: (field: string) => void
  onSectionControl?: (secName: string, action: 'up' | 'down' | 'toggle') => void
}

export default function LandingPageRenderer({
  templateId,
  user,
  config,
  products = [],
  distance,
  badges = [],
  isEditable = false,
  onWYSIWYGFocus,
  onSectionControl
}: LandingPageRendererProps) {
  
  // Scoped active FAQ accordion state
  const [activeFaq, setActiveFaq] = useState<number | null>(null)

  // Clean data fallback helper
  const logoUrl = config.logoUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&q=80"
  const title = config.title || user.name
  const bio = config.bio || `Selamat datang di halaman resmi kami. Kami menghadirkan produk dan jasa berkualitas tinggi langsung ke depan pintu Anda.`
  const phone = config.phone || ''
  const instagram = config.instagram || ''
  const locationName = config.locationName || 'Jakarta, Indonesia'

  const activeSections = (config.sections && Array.isArray(config.sections) && config.sections.length > 0)
    ? config.sections
    : ['hero', 'profile', 'features', 'products', 'testimonials', 'map', 'footer']

  // Testimonials fallback
  const testimonialsList = (config.testimonials && Array.isArray(config.testimonials) && config.testimonials.length > 0)
    ? config.testimonials
    : [
        { name: 'Rian S.', quote: 'Kualitas pelayanannya luar biasa. Proses cepat, rapi, dan responsif. Sangat direkomendasikan!', rating: 5 },
        { name: 'Dewi K.', quote: 'Produk asli berkualitas tinggi, tidak mengecewakan sama sekali. Mitra bisnis terpercaya.', rating: 5 }
      ]

  // FAQ fallback
  const faqList = (config.faq && Array.isArray(config.faq) && config.faq.length > 0)
    ? config.faq
    : [
        { question: 'Bagaimana cara melakukan pemesanan?', answer: 'Klik tombol hubungi melalui WhatsApp di halaman ini atau jelajahi etalase produk kami di atas untuk melihat detail lengkap.' },
        { question: 'Apakah menerima pengiriman ke luar kota?', answer: 'Ya, kami melayani pengiriman produk fisik ke seluruh Indonesia dengan partner jasa kirim resmi.' }
      ]

  // Gallery items fallback
  const galleryItems = (config.galleryItems && Array.isArray(config.galleryItems) && config.galleryItems.length > 0)
    ? config.galleryItems
    : [
        { id: 'g1', imageUrl: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400&h=300&fit=crop&q=80', title: 'Aktivitas Usaha', description: 'Dedikasi penuh dalam proses produksi setiap hari.' },
        { id: 'g2', imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop&q=80', title: 'Bahan Berkualitas', description: 'Kami hanya menggunakan material premium pilihan.' }
      ]

  const galleryTitle = config.galleryTitle || 'Galeri Usaha Kami'
  const galleryDesc = config.galleryDesc || 'Dokumentasi suasana, aktivitas, dan portofolio layanan terbaik kami.'

  // Footer data fallback
  const footerText = config.footerText || title
  const footerTagline = config.footerTagline || 'Mitra UMKM Premium terpercaya di Indonesia.'
  const footerCopyright = config.footerCopyright || `© 2026 ${title}. Hak Cipta Dilindungi.`

  // Section defaults for newly supported items
  const pricingTiers = [
    { name: 'Paket Usaha Ringan', price: 'Rp 450.000', desc: 'Cocok untuk kebutuhan personal atau ritel kecil.', features: ['Konsultasi Produk', 'Akses Menu Standard', 'Pengiriman Standard'] },
    { name: 'Paket Kemitraan Premium', price: 'Rp 1.500.000', desc: 'Solusi lengkap untuk kemitraan cafe/toko retail.', features: ['Konsultasi Prioritas', 'Custom Produk Branding', 'Pengiriman Instan/Sameday', 'Diskon Grosir Khusus'] }
  ]

  const benefitsList = [
    { title: 'Kualitas Teruji', desc: 'Setiap produk diproses melalui pengawasan ketat untuk menjaga standard premium.' },
    { title: 'Dukungan Lokal', desc: 'Bahan baku bersumber langsung dari produsen lokal guna memberdayakan komunitas regional.' },
    { title: 'Pengiriman Terjamin', desc: 'Partner logistik terpercaya memastikan pesanan Anda tiba tepat waktu dan dalam kondisi prima.' }
  ]

  const statNumbers = [
    { value: '98%', label: 'Tingkat Kepuasan Pelanggan' },
    { value: '500+', label: 'Pesanan Sukses Dikirim' },
    { value: '50+', label: 'Mitra Usaha Aktif' }
  ]

  const teamMembers = [
    { name: 'Eka Wijaya', role: 'Founder & Head Artisan', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&q=80' },
    { name: 'Sari Utami', role: 'Head of Operations', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&q=80' }
  ]

  const processSteps = [
    { step: '01', title: 'Pilih Layanan', desc: 'Pilih produk atau paket jasa yang sesuai dengan kebutuhan Anda.' },
    { step: '02', title: 'Konsultasi Detail', desc: 'Hubungi WhatsApp kami untuk verifikasi spesifikasi dan alamat kirim.' },
    { step: '03', title: 'Produksi & Kirim', desc: 'Pesanan Anda disiapkan segar dan dikirim dengan kemasan aman.' }
  ]

  const timelineEvents = [
    { year: '2022', title: 'Pendirian Pertama', desc: 'Memulai dari dapur rumahan kecil dengan 2 produk unggulan.' },
    { year: '2024', title: 'Kemitraan UMKM', desc: 'Tumbuh ke 10+ retail dan meresmikan logo premium terdaftar.' },
    { year: '2026', title: 'Platform Digital', desc: 'Bergabung di ekosistem digital terintegrasi Teras UMKM.' }
  ]

  // Hover helper for WYSIWYG elements
  const editOutline = (field: string) => {
    if (!isEditable) return ''
    return 'group/editable relative cursor-pointer hover:outline hover:outline-2 hover:outline-dashed hover:outline-primary/50 hover:bg-primary/5 p-1 rounded transition-all'
  }

  const editBadge = (field: string) => {
    if (!isEditable) return null
    return (
      <span className="btn-primary absolute -top-3.5 -left-1 text-black font-black text-[7px] z-20 pointer-events-none">
        Edit {field}
      </span>
    )
  }

  // Section wrapper to display handles in WYSIWYG mode
  const renderSectionContainer = (secName: string, children: React.ReactNode) => {
    if (!isEditable) return <div key={secName}>{children}</div>

    return (
      <div key={secName} className="group/sec relative border-2 border-transparent hover:border-dashed hover:border-primary/30 p-2 -mx-2 rounded-2xl transition-all">
        {/* Controls Overlay */}
        <div className="absolute top-2 right-2 opacity-0 group-hover/sec:opacity-100 transition-opacity flex items-center gap-1 z-30 pointer-events-auto bg-neutral-900 border border-neutral-800 px-1.5 py-1 rounded-md shadow-lg">
          <button
            onClick={(e) => { e.stopPropagation(); onSectionControl?.(secName, 'up') }}
            className="p-1 hover:text-primary text-text-secondary text-[9px] cursor-pointer"
            title="Pindahkan Ke Atas"
          >
            ▲
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onSectionControl?.(secName, 'down') }}
            className="p-1 hover:text-primary text-text-secondary text-[9px] cursor-pointer"
            title="Pindahkan Ke Bawah"
          >
            ▼
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onSectionControl?.(secName, 'toggle') }}
            className="p-1 hover:text-red-400 text-text-secondary text-[9px] cursor-pointer"
            title="Sembunyikan Seksi"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    )
  }

  /* ==========================================================================
     RENDERER: TEMPLATE 1 - PREMIUM ELEGANT (Minimalist / Light-Dark Tiles)
     ========================================================================== */
  const renderAppleTemplate = () => {
    return (
      <div className="min-h-screen bg-white text-[#1d1d1f] font-sans selection:bg-[#0066cc]/20 pb-16 relative">
        
        {/* Nav 1: Global minimal Nav */}
        <div className="bg-black/95 text-white/60 text-[10px] py-1.5 px-6 flex justify-between items-center tracking-tight font-light border-b border-white/5">
          <div className="flex gap-4">
            <span className="text-white font-bold tracking-widest text-[9px] uppercase">{title}</span>
            <a href="#profile" className="hover:text-white transition-colors">Tentang</a>
            <a href="#products" className="hover:text-white transition-colors">Produk</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Ulasan</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>
          <div className="flex gap-3">
            <span className="btn-primary text-[9px] text-primary border border-primary/20 bg-primary/5">PREMIUM MERCHANT</span>
          </div>
        </div>

        {/* Nav 2: Product Sub-nav */}
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-neutral-200 py-3 px-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {logoUrl && (
              <img src={logoUrl} alt="Logo" className="w-6 h-6 rounded-full object-cover border border-neutral-200" />
            )}
            <span 
              className={`font-semibold text-sm text-[#1d1d1f] ${editOutline('title')}`}
              onClick={() => onWYSIWYGFocus?.('title')}
            >
              {editBadge('Title')}
              {title}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-[#1d1d1f]/60 font-light">
            <a href="#profile" className="hover:text-black transition-colors hidden md:inline">Profil</a>
            <a href="#products" className="hover:text-black transition-colors hidden md:inline">Produk</a>
            {phone && (
              <a 
                href={`https://wa.me/${phone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#0066cc] text-white font-normal px-3.5 py-1.5 rounded-full text-[10px] hover:bg-blue-600 transition-colors"
              >
                Hubungi Kami
              </a>
            )}
          </div>
        </div>

        {/* Dynamic section loops with alternating tiles */}
        <div className="space-y-0">
          {activeSections.map((secName: string, index: number) => {
            const isDark = index % 2 === 1
            const tileBg = isDark ? 'bg-[#1d1d1f] text-white border-b border-black' : 'bg-[#f5f5f7] text-[#1d1d1f] border-b border-neutral-200'
            const titleColor = isDark ? 'text-white' : 'text-[#1d1d1f]'
            const textColor = isDark ? 'text-neutral-400' : 'text-neutral-500'
            const buttonStyle = "bg-[#0066cc] text-white rounded-full hover:bg-blue-600 transition-colors font-medium text-xs px-6 py-2.5 inline-flex items-center gap-1.5"

            const sectionContent = (() => {
              switch (secName) {
                case 'hero':
                  return (
                    <div className="max-w-4xl mx-auto text-center space-y-4">
                      <span className="text-[10px] font-bold text-[#0066cc] uppercase tracking-wider">Premium UMKM Ecosystem</span>
                      <h1 
                        className={`text-4xl md:text-5xl font-semibold tracking-tight leading-none ${titleColor} ${editOutline('title')}`}
                        onClick={() => onWYSIWYGFocus?.('title')}
                      >
                        {editBadge('Title')}
                        {title}
                      </h1>
                      <p 
                        className={`text-base md:text-lg max-w-xl mx-auto font-light leading-relaxed ${textColor} ${editOutline('bio')}`}
                        onClick={() => onWYSIWYGFocus?.('bio')}
                      >
                        {editBadge('Bio')}
                        {bio}
                      </p>
                      <div className="pt-2 flex justify-center gap-3">
                        <a href="#products" className={buttonStyle}>
                          Pelajari Produk
                          <ArrowRight className="w-3.5 h-3.5" />
                        </a>
                      </div>
                      <div className="pt-8 max-w-lg mx-auto aspect-video rounded-2xl overflow-hidden bg-neutral-800/10 border border-neutral-200/50 flex items-center justify-center text-xs text-neutral-400 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
                        {products[0]?.imageUrl ? (
                          <img src={products[0].imageUrl} alt="Featured Product" className="w-full h-full object-cover" />
                        ) : (
                          <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&fit=crop&q=80" alt="Storefront Placeholder" className="w-full h-full object-cover" />
                        )}
                      </div>
                    </div>
                  )

                case 'profile':
                  return (
                    <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                      <div className="space-y-4">
                        <span className="text-[9px] font-bold text-[#0066cc] uppercase tracking-widest block">Tentang Usaha</span>
                        <h2 className={`text-2xl font-semibold tracking-tight ${titleColor}`}>
                          Artisan & Nilai Dedikasi Kami
                        </h2>
                        <p className={`text-xs md:text-sm leading-relaxed ${textColor}`}>
                          {bio}
                        </p>
                      </div>
                      <div className="bg-white/40 backdrop-blur border border-neutral-200/30 p-6 rounded-3xl space-y-4 shadow-sm text-left">
                        <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Informasi Kontak</span>
                        {phone && (
                          <div className="flex items-center gap-3 text-xs text-[#1d1d1f]">
                            <Phone className="w-4 h-4 text-[#0066cc]" />
                            <span>{phone} (Hotline WhatsApp)</span>
                          </div>
                        )}
                        {instagram && (
                          <div className="flex items-center gap-3 text-xs text-[#1d1d1f]">
                            <InstagramIcon className="w-4 h-4 text-pink-500" />
                            <span>{instagram} (Instagram Brand)</span>
                          </div>
                        )}
                        <div className="flex items-center gap-3 text-xs text-[#1d1d1f]">
                          <MapPin className="w-4 h-4 text-red-500" />
                          <span>{locationName}</span>
                        </div>
                      </div>
                    </div>
                  )

                case 'features':
                  return (
                    <div className="max-w-4xl mx-auto space-y-10">
                      <div className="text-center space-y-2">
                        <span className="text-[9px] font-bold text-[#0066cc] uppercase tracking-widest block">Keunggulan</span>
                        <h2 className={`text-2xl md:text-3xl font-semibold tracking-tight ${titleColor}`}>Keunggulan Standard Layanan Kami</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {benefitsList.map((ben: any, bIdx: number) => (
                          <div key={bIdx} className="bg-white/50 border border-neutral-200/40 p-6 rounded-2xl text-left space-y-2">
                            <h3 className="text-sm font-semibold text-[#1d1d1f]">{ben.title}</h3>
                            <p className="text-xs text-neutral-500 leading-relaxed">{ben.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )

                case 'benefits':
                  return (
                    <div className="max-w-4xl mx-auto space-y-8 text-center">
                      <h2 className={`text-2xl font-semibold tracking-tight ${titleColor}`}>Nilai Tambah Pelanggan</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {benefitsList.map((b: any, idx: number) => (
                          <div key={idx} className="p-4 space-y-1">
                            <span className="w-8 h-8 rounded-full bg-blue-50 text-[#0066cc] flex items-center justify-center mx-auto text-xs font-bold">
                              ✓
                            </span>
                            <h4 className="text-xs font-semibold text-[#1d1d1f] pt-2">{b.title}</h4>
                            <p className="text-[11px] text-neutral-500">{b.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )

                case 'products':
                  return (
                    <div id="products" className="max-w-4xl mx-auto space-y-8">
                      <div className="text-center space-y-2">
                        <span className="text-[9px] font-bold text-[#0066cc] uppercase tracking-widest block">Katalog</span>
                        <h2 className={`text-2xl md:text-3xl font-semibold tracking-tight ${titleColor}`}>Produk Terlaris Pilihan Kami</h2>
                      </div>
                      {products.length === 0 ? (
                        <div className="text-xs text-neutral-400 py-8 bg-white/20 border rounded-2xl">Katalog produk belum diunggah oleh merchant.</div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                          {products.map((p: any) => (
                            <div key={p.id} className="bg-white border border-neutral-200/80 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between group">
                              <div className="aspect-square bg-neutral-100 relative overflow-hidden">
                                {p.imageUrl ? (
                                  <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">No Image</div>
                                )}
                              </div>
                              <div className="p-4 space-y-3 text-left flex-grow flex flex-col justify-between">
                                <div>
                                  <span className="text-[8px] font-bold text-[#0066cc] uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-full">{p.category || 'Retail'}</span>
                                  <h3 className="text-xs font-semibold text-[#1d1d1f] mt-1.5 line-clamp-1">{p.title}</h3>
                                  <p className="text-[10px] text-neutral-500 line-clamp-2 mt-1">{p.description}</p>
                                </div>
                                <div className="pt-2 flex items-center justify-between">
                                  <span className="text-xs font-bold text-[#1d1d1f]">Rp {p.price?.toLocaleString('id-ID')}</span>
                                  {phone && (
                                    <a 
                                      href={`https://wa.me/${phone}?text=Halo, saya tertarik dengan produk ${p.title}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-3 py-1 bg-neutral-900 text-white hover:bg-neutral-800 text-[10px] rounded-full font-light"
                                    >
                                      Beli
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )

                case 'testimonials':
                  return (
                    <div className="max-w-4xl mx-auto space-y-8">
                      <h2 className={`text-2xl font-semibold tracking-tight text-center ${titleColor}`}>Suara Pelanggan</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {testimonialsList.map((t: any, idx: number) => (
                          <div key={idx} className="bg-white border border-neutral-100 p-6 rounded-2xl text-left space-y-4 shadow-sm">
                            <p className="text-xs text-neutral-600 italic">"{t.quote}"</p>
                            <div className="flex justify-between items-center border-t border-neutral-100 pt-3">
                              <span className="text-[10px] font-semibold text-[#1d1d1f]">{t.name}</span>
                              <div className="flex gap-0.5 text-amber-500">
                                {Array.from({ length: t.rating }).map((_, i: number) => (
                                  <Star key={i} className="w-3 h-3 fill-current" />
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )

                case 'pricing':
                  return (
                    <div className="max-w-4xl mx-auto space-y-8 text-center">
                      <h2 className={`text-2xl font-semibold tracking-tight ${titleColor}`}>Paket Harga Transparan</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
                        {pricingTiers.map((p: any, idx: number) => (
                          <div key={idx} className="bg-white border border-neutral-200/60 p-6 rounded-2xl shadow-sm text-left space-y-4">
                            <div>
                              <h3 className="text-sm font-semibold text-neutral-800">{p.name}</h3>
                              <span className="text-xl font-bold text-[#0066cc] block mt-1">{p.price}</span>
                            </div>
                            <p className="text-xs text-neutral-500">{p.desc}</p>
                            <ul className="text-[11px] text-neutral-600 space-y-1.5 border-t border-neutral-100 pt-3">
                              {p.features.map((f: any, fi: number) => (
                                <li key={fi} className="flex items-center gap-1.5">
                                  <span className="text-blue-500">✓</span> {f}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )

                case 'faq':
                  return (
                    <div className="max-w-2xl mx-auto space-y-6 text-left">
                      <h2 className={`text-2xl font-semibold tracking-tight text-center ${titleColor}`}>Pertanyaan Umum</h2>
                      <div className="divide-y divide-neutral-200">
                        {faqList.map((f: any, fIdx: number) => (
                          <div key={fIdx} className="py-4">
                            <button 
                              onClick={() => setActiveFaq(activeFaq === fIdx ? null : fIdx)}
                              className="w-full flex justify-between items-center text-xs font-semibold text-[#1d1d1f] hover:text-[#0066cc] transition-colors"
                            >
                              <span>{f.question}</span>
                              <span>{activeFaq === fIdx ? '▲' : '▼'}</span>
                            </button>
                            {activeFaq === fIdx && (
                              <p className="mt-2 text-xs text-neutral-500 leading-relaxed font-light">
                                {f.answer}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )

                case 'statistics':
                  return (
                    <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                      {statNumbers.map((s: any, idx: number) => (
                        <div key={idx} className="space-y-1">
                          <span className="text-3xl font-light text-[#0066cc]">{s.value}</span>
                          <span className="block text-[10px] uppercase tracking-wider text-neutral-500 font-bold">{s.label}</span>
                        </div>
                      ))}
                    </div>
                  )

                case 'social-proof':
                  return (
                    <div className="max-w-4xl mx-auto text-center space-y-4">
                      <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold">Telah Dipercaya Oleh</span>
                      <div className="flex flex-wrap justify-center items-center gap-8 opacity-45">
                        <span className="text-xs font-semibold">ECOSYSTEM PARTNER</span>
                        <span className="text-xs font-semibold">PREMIUM MERCHANT</span>
                        <span className="text-xs font-semibold">TERAS RETAIL</span>
                      </div>
                    </div>
                  )

                case 'cta':
                  return (
                    <div className="max-w-3xl mx-auto bg-gradient-to-tr from-blue-500 to-[#0066cc] text-white p-8 rounded-3xl text-center space-y-4 shadow-lg relative overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
                      <h3 className="text-2xl font-semibold tracking-tight">Siap Memulai Kemitraan Premium?</h3>
                      <p className="text-xs text-white/80 max-w-md mx-auto">Kami siap melayani kebutuhan Anda dengan standard pelayanan terbaik terverifikasi.</p>
                      <div className="pt-2">
                        {phone && (
                          <a href={`https://wa.me/${phone}`} className="bg-white text-[#0066cc] rounded-full hover:bg-neutral-100 font-bold px-6 py-2.5 text-xs inline-block shadow-md">
                            Hubungi Hotline WhatsApp
                          </a>
                        )}
                      </div>
                    </div>
                  )

                case 'gallery':
                  return (
                    <div className="max-w-4xl mx-auto space-y-8">
                      <div className="text-center space-y-2">
                        <span 
                          className={`text-[9px] font-bold text-[#0066cc] uppercase tracking-widest block ${editOutline('galleryTitle')}`}
                          onClick={() => onWYSIWYGFocus?.('galleryTitle')}
                        >
                          {editBadge('Gallery Title')}
                          {galleryTitle}
                        </span>
                        <p 
                          className={`text-xs text-neutral-500 max-w-xl mx-auto ${editOutline('galleryDesc')}`}
                          onClick={() => onWYSIWYGFocus?.('galleryDesc')}
                        >
                          {editBadge('Gallery Desc')}
                          {galleryDesc}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {galleryItems.map((item: any) => (
                          <div key={item.id} className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-neutral-100 group border">
                            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 text-left text-white">
                              <h4 className="text-xs font-bold">{item.title}</h4>
                              <p className="text-[10px] text-white/80 font-light mt-0.5">{item.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )

                case 'team':
                  return (
                    <div className="max-w-4xl mx-auto space-y-8 text-center">
                      <h2 className={`text-2xl font-semibold tracking-tight ${titleColor}`}>Tim Kami</h2>
                      <div className="flex flex-wrap justify-center gap-12">
                        {teamMembers.map((t: any, idx: number) => (
                          <div key={idx} className="space-y-2">
                            <div className="w-16 h-16 rounded-full overflow-hidden border mx-auto">
                              <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <h4 className="text-xs font-semibold text-[#1d1d1f]">{t.name}</h4>
                              <span className="text-[10px] text-neutral-400 block">{t.role}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )

                case 'process':
                  return (
                    <div className="max-w-4xl mx-auto space-y-8 text-center">
                      <h2 className={`text-2xl font-semibold tracking-tight ${titleColor}`}>Cara Pemesanan</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {processSteps.map((p: any, idx: number) => (
                          <div key={idx} className="bg-white/40 border border-neutral-100 p-6 rounded-2xl text-left space-y-2">
                            <span className="text-xl font-bold text-neutral-300 block">{p.step}</span>
                            <h4 className="text-xs font-semibold text-[#1d1d1f]">{p.title}</h4>
                            <p className="text-[10px] text-neutral-500 leading-relaxed">{p.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )

                case 'timeline':
                  return (
                    <div className="max-w-xl mx-auto space-y-8 text-left">
                      <h2 className={`text-2xl font-semibold tracking-tight text-center ${titleColor}`}>Riwayat Usaha</h2>
                      <div className="space-y-6 relative border-l border-neutral-200 pl-4 ml-2">
                        {timelineEvents.map((t: any, idx: number) => (
                          <div key={idx} className="relative space-y-1">
                            <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-[#0066cc]" />
                            <span className="text-[10px] font-bold text-[#0066cc] block">{t.year}</span>
                            <h4 className="text-xs font-semibold text-[#1d1d1f]">{t.title}</h4>
                            <p className="text-[10px] text-neutral-500 leading-relaxed">{t.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )

                case 'lead-capture':
                  return (
                    <div className="max-w-xl mx-auto bg-white border p-6 rounded-2xl shadow-sm text-center space-y-4">
                      <h3 className="text-sm font-semibold text-neutral-800">Dapatkan Penawaran Khusus</h3>
                      <p className="text-[11px] text-neutral-500">Masukkan email Anda untuk menerima pembaruan katalog produk dan harga grosir khusus.</p>
                      <div className="flex gap-2 max-w-sm mx-auto">
                        <input type="email" placeholder="Alamat email Anda..." className="flex-grow px-3 py-1.5 border rounded-lg text-xs" />
                        <button className="bg-[#0066cc] text-white rounded-lg px-4 py-1.5 text-xs">Kirim</button>
                      </div>
                    </div>
                  )

                case 'map':
                  return (
                    <div className="max-w-4xl mx-auto space-y-6">
                      <h2 className={`text-2xl font-semibold tracking-tight text-center ${titleColor}`}>Lokasi Toko Kami</h2>
                      <div className="bg-white border rounded-2xl overflow-hidden p-3 shadow-sm space-y-3">
                        <div className="aspect-[21/9] bg-neutral-100 flex items-center justify-center text-xs text-neutral-400 relative rounded-xl">
                          <MapPin className="w-6 h-6 text-red-500" />
                          <span className="absolute bottom-2 left-2 bg-black/70 text-white text-[9px] px-2 py-0.5 rounded">OSM Map Preview ({locationName})</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-neutral-500">Alamat Usaha: <strong>{locationName}</strong></span>
                          {distance && <span className="text-[#0066cc] font-bold">{distance} dari Anda</span>}
                        </div>
                      </div>
                    </div>
                  )

                default:
                  return null
              }
            })()

            if (!sectionContent) return null

            return renderSectionContainer(
              secName,
              <div key={secName} className={`py-16 px-6 md:px-12 flex flex-col justify-center ${tileBg}`}>
                {sectionContent}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <footer className="bg-[#f5f5f7] border-t border-neutral-200 py-12 px-6 md:px-12 text-left">
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-xs text-[#1d1d1f]/60 font-light pb-8 border-b border-neutral-200">
            <div className="space-y-2">
              <span className="font-semibold text-[#1d1d1f] block uppercase tracking-wider text-[10px]">Teras UMKM</span>
              <p className="leading-relaxed">{footerTagline}</p>
            </div>
            <div className="space-y-2">
              <span className="font-semibold text-[#1d1d1f] block uppercase tracking-wider text-[10px]">Navigasi</span>
              <div className="flex flex-col gap-1.5">
                <a href="#products" className="hover:underline">Belanja Produk</a>
                <span>LMS Academy</span>
                <span>Affiliate</span>
              </div>
            </div>
            <div className="space-y-2">
              <span className="font-semibold text-[#1d1d1f] block uppercase tracking-wider text-[10px]">Kontak</span>
              <div className="flex flex-col gap-1">
                {phone && <span>WhatsApp: {phone}</span>}
                {instagram && <span>Instagram: {instagram}</span>}
              </div>
            </div>
          </div>
          <div className="max-w-4xl mx-auto pt-6 flex justify-between items-center text-[10px] text-neutral-400 font-light">
            <span 
              className={editOutline('footerCopyright')}
              onClick={() => onWYSIWYGFocus?.('footerCopyright')}
            >
              {editBadge('Copyright')}
              {footerCopyright}
            </span>
            <span>Premium Verified Merchant</span>
          </div>
        </footer>
      </div>
    )
  }

  /* ==========================================================================
     RENDERER: TEMPLATE 2 - RETRO DIRECT (HTML 3.2 Retro Table Style)
     ========================================================================== */
  const renderDellTemplate = () => {
    // Ribbon card background color mapping based on index
    const tints = [
      'bg-[#b3bd95]', // Sage
      'bg-[#d77a7a]', // Salmon
      'bg-[#e6915d]', // Peach
      'bg-[#c0d4a7]', // Lime
      'bg-[#9ab6c8]', // Sky
      'bg-[#a5b8c0]', // Steel
      'bg-[#8c9ae0]'  // Periwinkle
    ]

    return (
      <div className="border-[8px] border-black p-2 min-h-screen bg-white text-black font-serif relative selection:bg-neutral-900 selection:text-white">
        
        {/* Top Banner (Pure Black Strip) */}
        <div className="bg-black text-white px-4 py-2.5 flex flex-wrap justify-between items-center border-b-[3px] border-black text-xs font-sans font-bold select-none">
          <div className="flex items-center gap-3">
            <span className="bg-[#e91d2a] px-2 py-0.5 rounded-none font-black text-[10px] tracking-tighter uppercase">{title}</span>
            <span>PLATFORM DIGITAL UMKM INDONESIA.</span>
          </div>
          <div className="flex items-center gap-4 text-[10px]">
            <span className="text-[#e91d2a] font-mono tracking-widest">HOTLINE: {phone || 'DIRECT'}</span>
            <span className="bg-[#fcc20f] text-black px-2 py-0.5 rounded-none shadow-[2px_2px_0px_rgba(255,255,255,0.4)] uppercase">ORDER DIRECT</span>
          </div>
        </div>

        {/* 2-Column Desktop Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-3">
          
          {/* LEFT RAIL (approx 3/12 or 25% width) */}
          <div className="md:col-span-4 lg:col-span-3 space-y-4">
            
            {/* Red CTA Block */}
            <div className="bg-[#e91d2a] text-white border-2 border-black p-4 space-y-3 shadow-[2px_2px_0px_rgba(0,0,0,1)] text-left">
              <h3 className="font-sans font-black text-sm uppercase tracking-wide border-b border-white pb-1.5">Selamat Datang</h3>
              <p className="text-[12px] leading-relaxed">
                Kami siap melayani kebutuhan Anda secara online dengan standard produk berkualitas tinggi. Jelajahi menu dan hubungi WhatsApp kami langsung.
              </p>
              {phone && (
                <div className="bg-black/25 p-2 font-mono text-[11px] text-center border border-white/20">
                  WA: {phone}
                </div>
              )}
            </div>

            {/* Retro Link Box */}
            <div className="border-2 border-black p-3 bg-[#eff4ff] space-y-2 text-left font-sans text-[11px]">
              <span className="font-bold border-b border-black pb-0.5 block">NAVIGASI PROFIL</span>
              <ul className="space-y-1.5">
                <li><a href="#products" className="text-[#0000ee] underline cursor-pointer">Etalase Produk</a></li>
                <li><a href="#profile" className="text-[#0000ee] underline cursor-pointer">Tentang Usaha</a></li>
                <li><a href="#testimonials" className="text-[#0000ee] underline cursor-pointer">Ulasan Pelanggan</a></li>
                <li><a href="#faq" className="text-[#0000ee] underline cursor-pointer">Pertanyaan FAQ</a></li>
              </ul>
            </div>

            {/* PC Mag award seal sticker */}
            <div className="border border-black p-3 bg-white flex flex-col items-center justify-center space-y-2 text-center">
              <div className="w-16 h-16 rounded-full border-4 border-dashed border-[#e91d2a] flex items-center justify-center text-[8px] font-sans font-extrabold text-[#e91d2a] uppercase leading-none p-1">
                TERAS PREMIUM
              </div>
              <span className="text-[9px] font-sans font-bold">UMKM Verified Merchant</span>
            </div>

          </div>

          {/* RIGHT MAIN COLUMN (approx 9/12 or 75% width) */}
          <div className="md:col-span-8 lg:col-span-9 space-y-6">
            
            {activeSections.filter((sec: any) => sec !== 'footer').map((secName: any, secIdx: number) => {
              const tintColor = tints[secIdx % tints.length]
              
              const sectionContent = (() => {
                switch (secName) {
                  case 'hero':
                    return (
                      <div className="space-y-4">
                        {/* Section Header (Stenciled background) */}
                        <div className="bg-[#8e8a25] text-black border-2 border-black px-4 py-2 font-sans font-black text-lg tracking-wider text-left select-none uppercase">
                          PREMIUM MERCHANT PROFILE
                        </div>
                        <div className={`border-2 border-black overflow-hidden shadow-[3px_3px_0px_rgba(0,0,0,1)] text-left`}>
                          <div className="bg-white px-3 py-1.5 font-sans font-bold text-xs uppercase border-b border-black flex justify-between items-center">
                            <span>TITLE & HEADING</span>
                            <span className="bg-[#fcc20f] text-black font-sans font-extrabold text-[8px] px-1.5 py-0.5 border border-black transform rotate-2">NEW!</span>
                          </div>
                          <div className="bg-[#b3bd95] p-5 flex flex-col md:flex-row justify-between items-start gap-4">
                            <div className="space-y-3 flex-grow">
                              <h2 className={`text-xl font-bold font-sans ${editOutline('title')}`} onClick={() => onWYSIWYGFocus?.('title')}>
                                {editBadge('Title')}
                                {title}
                              </h2>
                              <p className={`text-xs leading-relaxed ${editOutline('bio')}`} onClick={() => onWYSIWYGFocus?.('bio')}>
                                {editBadge('Bio')}
                                {bio}
                              </p>
                              {phone && (
                                <a href={`https://wa.me/${phone}`} className="inline-block bg-black text-white font-sans font-bold text-[10px] uppercase border border-black px-3 py-1 mt-2">
                                  Hubungi WhatsApp
                                </a>
                              )}
                            </div>
                            {logoUrl && (
                              <div className="w-20 h-20 border-2 border-black shrink-0 shadow-md bg-white">
                                <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )

                  case 'profile':
                    return (
                      <div className="border-2 border-black overflow-hidden text-left shadow-[3px_3px_0px_rgba(0,0,0,1)]">
                        <div className="bg-white px-3 py-1.5 font-sans font-bold text-xs uppercase border-b border-black">
                          ABOUT MERCHANT
                        </div>
                        <div className={`${tintColor} p-4 text-xs leading-relaxed`}>
                          {bio}
                          <div className="mt-4 pt-3 border-t border-black/10 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] font-sans">
                            {phone && <div><strong>WhatsApp:</strong> {phone}</div>}
                            {instagram && <div><strong>Instagram:</strong> {instagram}</div>}
                            <div><strong>Location:</strong> {locationName}</div>
                          </div>
                        </div>
                      </div>
                    )

                  case 'features':
                    return (
                      <div className="border-2 border-black text-left">
                        <div className="bg-white px-3 py-1 font-sans font-bold text-xs uppercase border-b border-black">
                          STANDARD ADVANTAGES
                        </div>
                        <div className="bg-white p-3 divide-y divide-black/10 font-sans text-xs">
                          {benefitsList.map((ben: any, idx: number) => (
                            <div key={idx} className="py-2.5 space-y-1">
                              <strong>{idx + 1}. {ben.title}</strong>
                              <p className="text-neutral-600 font-serif text-[11px] leading-relaxed pl-3">{ben.desc}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )

                  case 'products':
                    return (
                      <div className="space-y-4">
                        <div className="bg-[#d77a7a] text-black border-2 border-black px-4 py-1.5 font-sans font-black text-sm tracking-wider text-left uppercase">
                          PRODUCT & HARDWARE INVENTORY
                        </div>
                        {products.length === 0 ? (
                          <div className="p-8 text-center border-2 border-black bg-white font-sans text-xs">No active inventory configured.</div>
                        ) : (
                          <div className="space-y-4">
                            {products.map((p: any, idx: number) => {
                              const pTint = tints[idx % tints.length]
                              return (
                                <div key={p.id} className="border-2 border-black overflow-hidden shadow-[2px_2px_0px_rgba(0,0,0,1)] text-left flex flex-col md:flex-row">
                                  {/* Title & info left */}
                                  <div className="flex-grow flex flex-col">
                                    <div className="bg-white px-3 py-1 font-sans font-bold text-xs uppercase border-b border-black flex justify-between items-center">
                                      <span>INVENTORY ITEM: {p.title}</span>
                                      <span className="text-[10px] font-bold text-[#e91d2a]">Rp {p.price?.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className={`${pTint} p-4 flex-grow space-y-2 text-xs`}>
                                      <p className="font-serif leading-relaxed">{p.description}</p>
                                      <div className="pt-2 font-sans flex items-center gap-4 text-[10px]">
                                        <span>Category: <strong>{p.category || 'Standard'}</strong></span>
                                        {phone && (
                                          <a 
                                            href={`https://wa.me/${phone}?text=Halo, saya ingin membeli ${p.title}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-black text-white hover:bg-neutral-800 border px-2 py-0.5 uppercase font-bold"
                                          >
                                            [Order Item]
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  {/* Beveled photo notch right */}
                                  {p.imageUrl && (
                                    <div className="w-full md:w-36 bg-white border-t-2 md:border-t-0 md:border-l-2 border-black flex items-center justify-center p-3 relative overflow-hidden flex-shrink-0">
                                      <img src={p.imageUrl} alt={p.title} className="w-full aspect-[4/3] object-cover border border-black shadow" />
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )

                  case 'testimonials':
                    return (
                      <div className="border-2 border-black text-left shadow-[3px_3px_0px_rgba(0,0,0,1)]">
                        <div className="bg-white px-3 py-1 font-sans font-bold text-xs uppercase border-b border-black">
                          ULASAN PELANGGAN
                        </div>
                        <div className={`${tintColor} p-4 space-y-4`}>
                          {testimonialsList.map((t: any, idx: number) => (
                            <div key={idx} className="bg-white p-3 border border-black font-sans text-xs space-y-1.5">
                              <p className="font-serif italic text-neutral-800">"{t.quote}"</p>
                              <div className="flex justify-between items-center text-[10px] font-bold border-t border-neutral-200 pt-1.5">
                                <span>- {t.name}</span>
                                <span className="text-[#e91d2a]">Rating: {t.rating}/5</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )

                  case 'pricing':
                    return (
                      <div className="border-2 border-black text-left shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                        <div className="bg-white px-3 py-1 font-sans font-bold text-xs uppercase border-b border-black">
                          DAFTAR HARGA LAYANAN
                        </div>
                        <div className="bg-white p-3 divide-y divide-black/10">
                          {pricingTiers.map((p: any, idx: number) => (
                            <div key={idx} className="py-2 flex justify-between items-center text-xs font-sans">
                              <div>
                                <strong>{p.name}</strong>
                                <span className="block text-[10px] text-neutral-500">{p.desc}</span>
                              </div>
                              <span className="font-mono font-bold bg-[#eff4ff] border px-2 py-0.5 border-black">{p.price}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )

                  case 'faq':
                    return (
                      <div className="border-2 border-black text-left">
                        <div className="bg-white px-3 py-1 font-sans font-bold text-xs uppercase border-b border-black">
                          TANYA JAWAB & FAQ
                        </div>
                        <div className="bg-white p-3 font-sans text-xs space-y-3">
                          {faqList.map((f: any, idx: number) => (
                            <div key={idx} className="space-y-1">
                              <strong>Q: {f.question}</strong>
                              <p className="pl-3 font-serif text-[11px] text-neutral-600">A: {f.answer}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )

                  case 'statistics':
                    return (
                      <div className="border-2 border-black p-4 bg-white grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {statNumbers.map((s: any, idx: number) => (
                          <div key={idx} className="border border-black p-2.5 text-center font-sans">
                            <span className="text-xl font-bold font-mono text-[#e91d2a] block">{s.value}</span>
                            <span className="text-[9px] uppercase tracking-wider text-neutral-600 block">{s.label}</span>
                          </div>
                        ))}
                      </div>
                    )

                  case 'social-proof':
                    return (
                      <div className="border border-black p-3 bg-neutral-50 text-center font-sans text-[10px]">
                        <strong>VERIFIED DEALS FOR:</strong> ECOSYSTEM PARTNER · PREMIUM MERCHANT · REGISTERED DIRECT
                      </div>
                    )

                  case 'cta':
                    return (
                      <div className="border-2 border-black p-5 bg-[#e91d2a] text-white space-y-3 text-left">
                        <h4 className="font-sans font-black text-sm uppercase">Hubungi Kami Sekarang!</h4>
                        <p className="text-xs">Kami siap melayani kebutuhan produk Anda secara langsung dengan penawaran terbaik.</p>
                        {phone && (
                          <a href={`https://wa.me/${phone}`} className="inline-block bg-black text-white font-sans font-bold text-[10px] uppercase border border-black px-4 py-1.5 shadow-[2px_2px_0px_white]">
                            Hubungi WhatsApp
                          </a>
                        )}
                      </div>
                    )

                  case 'gallery':
                    return (
                      <div className="border-2 border-black text-left">
                        <div className="bg-white px-3 py-1 font-sans font-bold text-xs uppercase border-b border-black">
                          {galleryTitle}
                        </div>
                        <div className="bg-white p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {galleryItems.map((item: any) => (
                            <div key={item.id} className="border border-black p-2 bg-neutral-50 space-y-2">
                              <img src={item.imageUrl} alt={item.title} className="w-full aspect-[4/3] object-cover border border-black" />
                              <div className="font-sans text-[10px]">
                                <strong>{item.title}</strong>
                                <p className="text-neutral-500 font-serif text-[9px]">{item.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )

                  case 'team':
                    return (
                      <div className="border-2 border-black text-left">
                        <div className="bg-white px-3 py-1 font-sans font-bold text-xs uppercase border-b border-black">
                          TIM KAMI
                        </div>
                        <div className="bg-[#c0d4a7] p-4 flex flex-wrap gap-6 justify-center">
                          {teamMembers.map((t: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-3 bg-white p-2 border border-black shadow">
                              <div className="w-10 h-10 border border-black overflow-hidden flex-shrink-0">
                                <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
                              </div>
                              <div className="font-sans text-[10px] text-left">
                                <span className="font-bold block">{t.name}</span>
                                <span className="text-neutral-500 block text-[9px]">{t.role}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )

                  case 'process':
                    return (
                      <div className="border-2 border-black text-left">
                        <div className="bg-white px-3 py-1 font-sans font-bold text-xs uppercase border-b border-black">
                          PROSEDUR PEMESANAN
                        </div>
                        <div className="bg-white p-3 grid grid-cols-1 sm:grid-cols-3 gap-3 font-sans text-xs">
                          {processSteps.map((p: any, idx: number) => (
                            <div key={idx} className="border border-black p-3 space-y-1.5">
                              <span className="font-bold text-[#e91d2a] font-mono text-sm">{p.step}</span>
                              <strong className="block border-b border-black pb-0.5 uppercase text-[9px]">{p.title}</strong>
                              <p className="font-serif text-[10px] text-neutral-600">{p.desc}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )

                  case 'timeline':
                    return (
                      <div className="border-2 border-black text-left">
                        <div className="bg-white px-3 py-1 font-sans font-bold text-xs uppercase border-b border-black">
                          RIWAYAT PERJALANAN USAHA
                        </div>
                        <div className="bg-white p-3 font-sans text-xs divide-y divide-black/10">
                          {timelineEvents.map((t: any, idx: number) => (
                            <div key={idx} className="py-2 flex items-start gap-4">
                              <span className="font-bold font-mono text-[#e91d2a] shrink-0 border px-1.5 border-black bg-neutral-50">{t.year}</span>
                              <div className="space-y-0.5">
                                <strong>{t.title}</strong>
                                <p className="font-serif text-[11px] text-neutral-500">{t.desc}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )

                  case 'lead-capture':
                    return (
                      <div className="border-2 border-black p-4 bg-[#b3bd95] text-left space-y-2">
                        <span className="font-sans font-bold text-xs block">DAPATKAN UPDATE & PROMO:</span>
                        <div className="flex flex-col sm:flex-row gap-2 font-sans">
                          <input type="email" placeholder="Masukkan alamat email Anda..." className="flex-grow px-2 py-1 bg-white border border-black text-xs rounded-none font-serif" />
                          <button className="bg-black text-white border border-black hover:bg-neutral-800 font-bold px-3 py-1 text-xs rounded-none uppercase">Kirim</button>
                        </div>
                      </div>
                    )

                  case 'map':
                    return (
                      <div className="border-2 border-black text-left shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                        <div className="bg-white px-3 py-1 font-sans font-bold text-xs uppercase border-b border-black">
                          PETA LOKASI OUTLET
                        </div>
                        <div className="bg-white p-3 space-y-3 font-sans text-xs">
                          <div className="aspect-[21/9] bg-[#eff4ff] border border-black flex items-center justify-center relative">
                            <span className="font-mono text-[9px] uppercase bg-white border border-black px-2 py-0.5">MAP GRID PREVIEW ({locationName})</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px]">
                            <span>Address: <strong>{locationName}</strong></span>
                            {distance && <span className="text-[#e91d2a] font-bold">Delta: {distance}</span>}
                          </div>
                        </div>
                      </div>
                    )

                  default:
                    return null
                }
              })()

              if (!sectionContent) return null
              return renderSectionContainer(secName, sectionContent)
            })}

          </div>

        </div>

        {/* Footer rule */}
        <div className="border-b-2 border-green-600 w-full mt-8 mb-4 flex justify-center select-none opacity-45">
          <span className="bg-white px-3 -mb-2 text-[9px] font-sans font-bold tracking-wider text-green-700">ONLINE SERVICE HUB</span>
        </div>

        {/* Footer (Icon-nav label) */}
        <footer className="py-6 font-sans text-xs text-center space-y-4">
          <div className="flex flex-wrap justify-center items-center gap-6 select-none opacity-80">
            <div className="flex flex-col items-center">
              <span className="text-[14px]">🔍</span>
              <span className="font-bold text-[9px] uppercase mt-1">FIND</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[14px]">🏠</span>
              <span className="font-bold text-[9px] uppercase mt-1">HOME</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[14px]">🛍️</span>
              <span className="font-bold text-[9px] uppercase mt-1">ONLINE STORE</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[14px]">🔧</span>
              <span className="font-bold text-[9px] uppercase mt-1">SERVICE & SUPPORT</span>
            </div>
          </div>
          <div className="text-[10px] text-neutral-400 font-serif pt-2">
            <span 
              className={`text-[#0000ee] underline cursor-pointer ${editOutline('footerCopyright')}`}
              onClick={() => onWYSIWYGFocus?.('footerCopyright')}
            >
              {editBadge('Copyright')}
              {footerCopyright}
            </span>
            <span className="block mt-1 font-sans text-[8px]">Best viewed with browser version 3.0 and higher. Web-safe colors verified.</span>
          </div>
        </footer>

      </div>
    )
  }

  /* ==========================================================================
     RENDERER: TEMPLATE 3 - SOFT MARKETPLACE (Soft Canvas Marketplace)
     ========================================================================== */
  const renderAirbnbTemplate = () => {
    return (
      <div className="min-h-screen bg-white text-[#222222] font-sans selection:bg-[#ff385c]/25 pb-16 relative">
        
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-neutral-100 py-3.5 px-6 flex justify-between items-center shadow-sm">
          <span className="text-[#ff385c] font-black text-lg tracking-tight select-none">Teras UMKM</span>
          
          {/* Mock Pill search bar */}
          <div className="hidden md:flex items-center gap-2 border border-neutral-200 shadow-sm rounded-full py-2 px-4 text-xs font-medium cursor-pointer hover:shadow-md transition-shadow">
            <span>{locationName}</span>
            <span className="text-neutral-300">|</span>
            <span>Setiap Hari</span>
            <span className="text-neutral-300">|</span>
            <span className="text-neutral-400">Direct Chat</span>
            <span className="bg-[#ff385c] text-white p-1.5 rounded-full shrink-0">🔍</span>
          </div>

          <span 
            className={`font-semibold text-xs text-neutral-800 ${editOutline('title')}`}
            onClick={() => onWYSIWYGFocus?.('title')}
          >
            {editBadge('Title')}
            {title}
          </span>
        </header>

        {/* Dynamic loop */}
        <div className="max-w-4xl mx-auto px-6 space-y-16 mt-8">
          {activeSections.filter((sec: any) => sec !== 'footer').map((secName: string) => {
            const sectionContent = (() => {
              const heroImage = products[0]?.imageUrl || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&fit=crop&q=80'
              switch (secName) {
                case 'hero':
                  return (
                    <div className="text-left space-y-4">
                      <div className="aspect-[21/9] rounded-2xl overflow-hidden bg-neutral-100 border relative shadow-sm">
                        {heroImage ? (
                          <img src={heroImage} alt="Featured Showcase" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs">No visual</div>
                        )}
                        <span className="absolute top-4 left-4 bg-white/95 text-[#222222] text-[10px] font-bold px-3 py-1 rounded-full shadow-sm">Merchant Favorite</span>
                      </div>
                      <div className="space-y-2">
                        <h1 className={`text-2xl md:text-3xl font-bold tracking-tight text-[#222222] ${editOutline('title')}`} onClick={() => onWYSIWYGFocus?.('title')}>
                          {editBadge('Title')}
                          {title}
                        </h1>
                        <p className={`text-xs md:text-sm text-neutral-500 leading-relaxed font-light ${editOutline('bio')}`} onClick={() => onWYSIWYGFocus?.('bio')}>
                          {editBadge('Bio')}
                          {bio}
                        </p>
                      </div>
                    </div>
                  )

                case 'profile':
                  return (
                    <div className="bg-neutral-50 border border-neutral-200/50 rounded-2xl p-6 text-left space-y-4">
                      <div className="flex items-center gap-3">
                        {logoUrl && (
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-neutral-200 border shrink-0">
                            <img src={logoUrl} alt="Host avatar" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div>
                          <span className="block text-[8px] uppercase tracking-widest text-[#ff385c] font-black">Superhost Merchant</span>
                          <span className="font-bold text-xs text-[#222222]">{title}</span>
                        </div>
                      </div>
                      <p className="text-xs leading-relaxed text-neutral-500 whitespace-pre-line font-light">
                        {bio}
                      </p>
                      <div className="pt-2 flex flex-wrap gap-4 text-[11px] text-neutral-600 font-light border-t border-neutral-200/60 mt-2">
                        {phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-neutral-400" /> WhatsApp: {phone}</span>}
                        {instagram && <span className="flex items-center gap-1.5"><InstagramIcon className="w-3.5 h-3.5 text-neutral-400" /> Instagram: {instagram}</span>}
                        <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-neutral-400" /> {locationName}</span>
                      </div>
                    </div>
                  )

                case 'features':
                  return (
                    <div className="text-left space-y-6">
                      <h3 className="font-bold text-sm text-[#222222] border-b border-neutral-100 pb-2">Amenities / Keunggulan Kami</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {benefitsList.map((ben: any, idx: number) => (
                          <div key={idx} className="flex items-start gap-3">
                            <span className="text-[#ff385c] text-sm shrink-0 pt-0.5">✓</span>
                            <div>
                              <strong className="block text-xs text-[#222222] font-semibold">{ben.title}</strong>
                              <p className="text-[11px] text-neutral-500 leading-relaxed font-light">{ben.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )

                case 'benefits':
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left border-y border-neutral-100 py-6">
                      {benefitsList.map((b: any, idx: number) => (
                        <div key={idx} className="space-y-1">
                          <span className="text-[#ff385c] font-bold text-xs">✓ {b.title}</span>
                          <p className="text-[11px] text-neutral-500 font-light leading-relaxed">{b.desc}</p>
                        </div>
                      ))}
                    </div>
                  )

                case 'products':
                  return (
                    <div id="products" className="space-y-6">
                      <div className="text-left">
                        <h2 className="text-lg font-bold text-[#222222] tracking-tight">Etalase Jasa & Produk Pilihan</h2>
                        <span className="text-[11px] text-neutral-400 block font-light mt-0.5">Pilih produk terbaik langsung dari etalase kami.</span>
                      </div>
                      {products.length === 0 ? (
                        <div className="text-xs text-neutral-400 py-8 bg-neutral-50 text-center border border-dashed rounded-xl">Katalog produk belum ditambahkan.</div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                          {products.map((p: any) => (
                            <div key={p.id} className="text-left space-y-2 group cursor-pointer">
                              <div className="aspect-[4/3] w-full rounded-xl overflow-hidden bg-neutral-100 relative border border-neutral-100">
                                {p.imageUrl ? (
                                  <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">No Image</div>
                                )}
                                <span className="absolute top-2 left-2 bg-white text-[#222222] font-semibold text-[8px] px-2 py-0.5 rounded shadow-sm">Verified Merchant</span>
                                <button className="absolute top-2 right-2 p-1 bg-white/70 hover:bg-white text-[#ff385c] rounded-full shadow-sm text-xs">❤️</button>
                              </div>
                              <div>
                                <span className="text-[8px] font-bold uppercase tracking-wider text-neutral-400">{p.category || 'Retail'}</span>
                                <h3 className="text-xs font-semibold text-[#222222] mt-0.5 truncate">{p.title}</h3>
                                <p className="text-[10px] text-neutral-500 line-clamp-1 mt-0.5 font-light">{p.description}</p>
                                <span className="text-xs font-bold text-[#222222] block mt-1">Rp {p.price?.toLocaleString('id-ID')}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )

                case 'testimonials':
                  return (
                    <div className="space-y-6 text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#ff385c] text-lg">★</span>
                        <h2 className="text-lg font-bold text-[#222222] tracking-tight">
                          Ulasan Pelanggan
                        </h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {testimonialsList.map((t: any, idx: number) => (
                          <div key={idx} className="space-y-2 border-t border-neutral-100 pt-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-[10px] font-bold shrink-0">{t.name[0]}</div>
                              <div>
                                <span className="block text-xs font-semibold text-[#222222]">{t.name}</span>
                                <span className="text-[9px] text-neutral-400 block font-light">Verified User</span>
                              </div>
                            </div>
                            <p className="text-xs text-neutral-500 leading-relaxed font-light">"{t.quote}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )

                case 'pricing':
                  return (
                    <div className="space-y-6 text-left">
                      <h2 className="text-lg font-bold text-[#222222] tracking-tight">Daftar Paket Harga Kemitraan</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {pricingTiers.map((p: any, idx: number) => (
                          <div key={idx} className="border border-neutral-200 p-5 rounded-2xl shadow-sm space-y-3">
                            <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold block">TIER {idx + 1}</span>
                            <h3 className="text-sm font-semibold text-[#222222]">{p.name}</h3>
                            <p className="text-xs text-neutral-500 font-light">{p.desc}</p>
                            <span className="text-lg font-bold text-[#ff385c] block pt-2">{p.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )

                case 'faq':
                  return (
                    <div className="space-y-6 text-left">
                      <h2 className="text-lg font-bold text-[#222222] tracking-tight">Tanya Jawab Pengunjung</h2>
                      <div className="divide-y divide-neutral-100">
                        {faqList.map((f: any, idx: number) => (
                          <div key={idx} className="py-3 space-y-1">
                            <h4 className="text-xs font-semibold text-[#222222]">{f.question}</h4>
                            <p className="text-xs text-neutral-500 leading-relaxed font-light pl-2 border-l border-neutral-200">{f.answer}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )

                case 'statistics':
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-6 border-y border-neutral-100 text-center">
                      {statNumbers.map((s: any, idx: number) => (
                        <div key={idx} className="space-y-1">
                          <span className="text-2xl font-bold text-[#ff385c] block">{s.value}</span>
                          <span className="text-[10px] text-neutral-400 block font-light">{s.label}</span>
                        </div>
                      ))}
                    </div>
                  )

                case 'social-proof':
                  return (
                    <div className="text-left py-4 border-b border-neutral-100">
                      <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block mb-2">Social Validation</span>
                      <p className="text-xs text-[#222222] font-semibold">Telah Diverifikasi Resmi oleh Teras UMKM untuk Pengiriman Domestik.</p>
                    </div>
                  )

                case 'cta':
                  return (
                    <div className="bg-neutral-50 border border-neutral-200/50 p-6 rounded-2xl text-center space-y-4">
                      <h3 className="text-sm font-bold text-[#222222]">Tertarik Dengan Layanan/Produk Kami?</h3>
                      <p className="text-xs text-neutral-500 font-light max-w-sm mx-auto">Ajukan penawaran khusus atau pesan instan sekarang melalui WhatsApp direct hotline.</p>
                      {phone && (
                        <a href={`https://wa.me/${phone}`} className="inline-block bg-[#ff385c] hover:bg-[#e00b41] text-white font-semibold text-xs px-5 py-2.5 rounded-lg shadow-sm">
                          Hubungi Host WhatsApp
                        </a>
                      )}
                    </div>
                  )

                case 'gallery':
                  return (
                    <div className="space-y-6 text-left">
                      <div>
                        <h2 className={`text-lg font-bold text-[#222222] tracking-tight ${editOutline('galleryTitle')}`} onClick={() => onWYSIWYGFocus?.('galleryTitle')}>
                          {editBadge('Gallery Title')}
                          {galleryTitle}
                        </h2>
                        <p className={`text-[11px] text-neutral-500 font-light ${editOutline('galleryDesc')}`} onClick={() => onWYSIWYGFocus?.('galleryDesc')}>
                          {editBadge('Gallery Desc')}
                          {galleryDesc}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {galleryItems.map((item: any) => (
                          <div key={item.id} className="relative rounded-2xl overflow-hidden aspect-[4/3] border">
                            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-4 text-white text-left">
                              <h4 className="text-xs font-bold">{item.title}</h4>
                              <p className="text-[10px] text-white/80 font-light mt-0.5">{item.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )

                case 'team':
                  return (
                    <div className="space-y-6 text-left">
                      <h2 className="text-lg font-bold text-[#222222] tracking-tight">Tim Pelaksana Kami</h2>
                      <div className="flex gap-6 overflow-x-auto pb-2">
                        {teamMembers.map((t: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-3 border border-neutral-100 p-3 rounded-xl min-w-[160px] bg-white">
                            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                              <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="text-left font-sans text-[10px]">
                              <strong className="block text-[#222222]">{t.name}</strong>
                              <span className="text-neutral-400">{t.role}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )

                case 'process':
                  return (
                    <div className="space-y-6 text-left">
                      <h2 className="text-lg font-bold text-[#222222] tracking-tight">Prosedur Pemesanan & Beli</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {processSteps.map((p: any, idx: number) => (
                          <div key={idx} className="bg-neutral-50 p-4 rounded-xl border border-neutral-200/40 text-left space-y-1">
                            <span className="text-xs font-bold text-[#ff385c] font-mono">{p.step}</span>
                            <h4 className="text-xs font-semibold text-[#222222]">{p.title}</h4>
                            <p className="text-[10px] text-neutral-500 font-light leading-relaxed">{p.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )

                case 'timeline':
                  return (
                    <div className="space-y-6 text-left">
                      <h2 className="text-lg font-bold text-[#222222] tracking-tight text-center">Riwayat Perjalanan Kami</h2>
                      <div className="space-y-4 pl-4 border-l-2 border-neutral-100">
                        {timelineEvents.map((t: any, idx: number) => (
                          <div key={idx} className="space-y-0.5 relative">
                            <span className="absolute -left-[21px] top-1.5 w-1.5 h-1.5 rounded-full bg-[#ff385c]" />
                            <span className="text-[9px] font-bold text-[#ff385c] block">{t.year}</span>
                            <h4 className="text-xs font-semibold text-[#222222]">{t.title}</h4>
                            <p className="text-[10px] text-neutral-500 font-light">{t.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )

                case 'lead-capture':
                  return (
                    <div className="border border-neutral-150 p-5 rounded-2xl text-center space-y-3 bg-neutral-50/50">
                      <h3 className="text-xs font-bold text-neutral-800">Dapatkan Kupon Diskon Langganan</h3>
                      <div className="flex gap-2 max-w-sm mx-auto">
                        <input type="email" placeholder="Email Anda..." className="flex-grow px-3 py-1 bg-white border border-neutral-200 rounded-lg text-xs" />
                        <button className="bg-[#ff385c] text-white rounded-lg px-4 py-1 text-xs">Daftar</button>
                      </div>
                    </div>
                  )

                case 'map':
                  return (
                    <div className="space-y-4 text-left">
                      <h2 className="text-lg font-bold text-[#222222] tracking-tight">Lokasi Google Map / Outlet</h2>
                      <div className="border rounded-2xl overflow-hidden shadow-sm p-2 bg-white space-y-2">
                        <div className="aspect-[21/9] bg-neutral-50 flex items-center justify-center text-xs text-neutral-400 relative rounded-xl border">
                          <MapPin className="w-5 h-5 text-[#ff385c]" />
                          <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[8px] px-2 py-0.5 rounded">Map Container Preview ({locationName})</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-neutral-500 px-1">
                          <span>Lokasi: <strong>{locationName}</strong></span>
                          {distance && <span className="text-[#ff385c] font-semibold">{distance} dari Lokasi</span>}
                        </div>
                      </div>
                    </div>
                  )

                default:
                  return null
              }
            })()

            if (!sectionContent) return null
            return renderSectionContainer(secName, sectionContent)
          })}
        </div>

        {/* Footer */}
        <footer className="border-t border-neutral-200 bg-[#f7f7f7] py-12 px-6 md:px-12 text-left mt-16">
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-xs text-neutral-500 font-light pb-8 border-b border-neutral-200">
            <div className="space-y-2">
              <span className="font-bold text-[#222222] block uppercase tracking-wider text-[9px]">Platform Teras UMKM</span>
              <p className="leading-relaxed">{footerTagline}</p>
            </div>
            <div className="space-y-2">
              <span className="font-bold text-[#222222] block uppercase tracking-wider text-[9px]">Sitemap</span>
              <div className="flex flex-col gap-1.5">
                <a href="#products" className="hover:underline">Shop Katalog</a>
                <span>LMS Academy</span>
                <span>Affiliate System</span>
              </div>
            </div>
            <div className="space-y-2">
              <span className="font-bold text-[#222222] block uppercase tracking-wider text-[9px]">Pilihan Kontak</span>
              <div className="flex flex-col gap-1">
                {phone && <span>WhatsApp: {phone}</span>}
                {instagram && <span>Instagram: {instagram}</span>}
              </div>
            </div>
          </div>
          <div className="max-w-4xl mx-auto pt-6 flex justify-between items-center text-[10px] text-neutral-400 font-light">
            <span 
              className={editOutline('footerCopyright')}
              onClick={() => onWYSIWYGFocus?.('footerCopyright')}
            >
              {editBadge('Copyright')}
              {footerCopyright}
            </span>
            <span>Premium Verified Merchant</span>
          </div>
        </footer>

      </div>
    )
  }

  /* ==========================================================================
     RENDERER: TEMPLATE 4 - SPORTY BOLD (Pure Black Canvas / Monospace / Bold)
     ========================================================================== */
  const renderBMWTemplate = () => {
    const dividerStripe = (
      <div className="h-1 w-full bg-gradient-to-r from-[#0066b1] via-[#1c69d4] to-[#e22718] select-none" />
    )

    return (
      <div className="min-h-screen bg-black text-white font-sans selection:bg-[#e22718]/30 pb-16 relative text-left">
        
        {/* Nav */}
        <header className="sticky top-0 z-30 bg-black border-b border-neutral-800 py-3.5 px-6 flex justify-between items-center">
          <div className="flex items-center gap-2 select-none">
            {logoUrl && (
              <img src={logoUrl} alt="Logo" className="w-5 h-5 rounded-none object-cover border border-neutral-700" />
            )}
            <span className="bg-gradient-to-r from-[#0066b1] via-[#1c69d4] to-[#e22718] px-2 py-0.5 text-[8px] font-black text-white rounded-none italic shrink-0">/// PREMIUM</span>
          </div>
          <span 
            className={`font-semibold text-xs text-white uppercase tracking-wider ${editOutline('title')}`}
            onClick={() => onWYSIWYGFocus?.('title')}
          >
            {editBadge('Title')}
            {title}
          </span>
        </header>

        {/* Dynamic section loops with M Tricolor dividers */}
        <div className="space-y-0">
          {activeSections.filter((sec: any) => sec !== 'footer').map((secName: string) => {
            const sectionContent = (() => {
              switch (secName) {
                case 'hero':
                  return (
                    <div className="max-w-4xl mx-auto space-y-6 py-12 px-6">
                      <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">/// PREMIUM MERCHANT PARTNER</span>
                      <h1 
                        className={`text-4xl md:text-5xl font-black uppercase tracking-tight leading-none text-white ${editOutline('title')}`}
                        onClick={() => onWYSIWYGFocus?.('title')}
                      >
                        {editBadge('Title')}
                        {title}
                      </h1>
                      <p 
                        className={`text-xs md:text-sm text-neutral-400 font-light leading-relaxed max-w-2xl border-l border-neutral-700 pl-4 ${editOutline('bio')}`}
                        onClick={() => onWYSIWYGFocus?.('bio')}
                      >
                        {editBadge('Bio')}
                        {bio}
                      </p>
                      <div className="pt-2">
                        <a href="#products" className="inline-block bg-white text-black hover:bg-neutral-200 font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-none">
                          LIHAT KATALOG
                        </a>
                      </div>
                    </div>
                  )

                case 'profile':
                  return (
                    <div className="max-w-3xl mx-auto py-12 px-6 space-y-6">
                      <div className="flex items-center gap-4">
                        {logoUrl && (
                          <img src={logoUrl} alt="Profile" className="w-14 h-14 rounded-none object-cover border-2 border-white shrink-0 shadow-md bg-white" />
                        )}
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-widest text-red-500 block">/// DETAIL PROFIL</span>
                          <h2 className="text-2xl font-black uppercase tracking-tight">PROFIL USAHA</h2>
                        </div>
                      </div>
                      <p className="text-xs text-neutral-300 leading-relaxed font-light whitespace-pre-line">
                        {bio}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-neutral-800">
                        {phone && <div className="text-[11px]"><strong>HUBUNGI WHATSAPP:</strong> <span className="block text-neutral-400">{phone}</span></div>}
                        {instagram && <div className="text-[11px]"><strong>PROFIL INSTAGRAM:</strong> <span className="block text-neutral-400">{instagram}</span></div>}
                        <div className="text-[11px]"><strong>LOKASI OUTLET:</strong> <span className="block text-neutral-400">{locationName}</span></div>
                      </div>
                    </div>
                  )

                case 'features':
                  return (
                    <div className="max-w-4xl mx-auto py-12 px-6 space-y-8">
                      <h2 className="text-2xl font-black uppercase tracking-tight text-center">KEUNGGULAN UTAMA</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {benefitsList.map((ben: any, idx: number) => (
                          <div key={idx} className="bg-neutral-900 border border-neutral-800 p-6 rounded-none space-y-2">
                            <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">KEUNGGULAN {idx + 1}</span>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-white">{ben.title}</h3>
                            <p className="text-[11px] text-neutral-400 leading-relaxed font-light">{ben.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )

                case 'benefits':
                  return (
                    <div className="max-w-4xl mx-auto py-8 px-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center border-y border-neutral-850">
                      {benefitsList.map((b: any, idx: number) => (
                        <div key={idx} className="space-y-1.5 text-left">
                          <span className="text-xs font-bold uppercase tracking-wider text-red-500">/// {b.title}</span>
                          <p className="text-[11px] text-neutral-400 leading-relaxed">{b.desc}</p>
                        </div>
                      ))}
                    </div>
                  )

                case 'products':
                  return (
                    <div id="products" className="max-w-4xl mx-auto py-12 px-6 space-y-8">
                      <h2 className="text-2xl font-black uppercase tracking-tight text-center">ETALASE PRODUK AKTIF</h2>
                      {products.length === 0 ? (
                        <div className="text-xs text-neutral-500 text-center py-10 bg-neutral-900/50 border border-neutral-800">BELUM ADA PRODUK AKTIF.</div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                          {products.map((p: any) => (
                            <div key={p.id} className="bg-neutral-950 border border-neutral-850 rounded-none overflow-hidden flex flex-col justify-between group">
                              <div className="aspect-[16/10] bg-neutral-900 relative overflow-hidden">
                                {p.imageUrl ? (
                                  <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-xs text-neutral-600">NO IMAGE AVAILABLE</div>
                                )}
                              </div>
                              <div className="p-4 space-y-3 flex-grow flex flex-col justify-between">
                                <div>
                                  <span className="text-[8px] font-black uppercase tracking-widest text-red-500 border border-red-500/20 bg-red-500/5 px-2 py-0.5">{p.category || 'PREMIUM'}</span>
                                  <h3 className="text-xs font-black uppercase tracking-wider text-white mt-2 line-clamp-1">{p.title}</h3>
                                  <p className="text-[10px] text-neutral-400 line-clamp-2 mt-1">{p.description}</p>
                                </div>
                                <div className="pt-2 flex items-center justify-between border-t border-neutral-900">
                                  <span className="text-xs font-bold text-white">Rp {p.price?.toLocaleString('id-ID')}</span>
                                  {phone && (
                                    <a 
                                      href={`https://wa.me/${phone}?text=Halo, saya tertarik dengan produk ${p.title}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-3 py-1 bg-white text-black hover:bg-neutral-200 text-[9px] rounded-none font-bold uppercase tracking-wider"
                                    >
                                      PESAN
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )

                case 'testimonials':
                  return (
                    <div className="max-w-4xl mx-auto py-12 px-6 space-y-8">
                      <h2 className="text-2xl font-black uppercase tracking-tight text-center">TESTIMONI PELANGGAN</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {testimonialsList.map((t: any, idx: number) => (
                          <div key={idx} className="bg-neutral-900 border border-neutral-800 p-6 rounded-none text-left space-y-3">
                            <p className="text-xs text-neutral-300 italic">"{t.quote}"</p>
                            <div className="flex justify-between items-center text-[10px] font-bold border-t border-neutral-800 pt-3 text-neutral-400 font-mono">
                              <span>PELANGGAN: {t.name.toUpperCase()}</span>
                              <span className="text-red-500">RATING: {t.rating}/5</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )

                case 'pricing':
                  return (
                    <div className="max-w-4xl mx-auto py-12 px-6 space-y-8 text-center">
                      <h2 className="text-2xl font-black uppercase tracking-tight">DAFTAR HARGA LAYANAN</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
                        {pricingTiers.map((p: any, idx: number) => (
                          <div key={idx} className="bg-neutral-950 border border-neutral-800 p-6 rounded-none text-left space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-wider text-white">{p.name}</h3>
                            <span className="text-xl font-bold font-mono text-red-500 block">{p.price}</span>
                            <p className="text-[11px] text-neutral-400 font-light leading-relaxed">{p.desc}</p>
                            <ul className="text-[10px] text-neutral-300 space-y-1.5 border-t border-neutral-900 pt-3 font-mono">
                              {p.features.map((f: any, fi: number) => (
                                <li key={fi} className="flex items-center gap-1.5">
                                  <span className="text-red-500">///</span> {f.toUpperCase()}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )

                case 'faq':
                  return (
                    <div className="max-w-2xl mx-auto py-12 px-6 space-y-6 text-left">
                      <h2 className="text-2xl font-black uppercase tracking-tight text-center">PERTANYAAN UMUM / FAQ</h2>
                      <div className="divide-y divide-neutral-800">
                        {faqList.map((f: any, idx: number) => (
                          <div key={idx} className="py-4 space-y-1">
                            <h4 className="text-xs font-black uppercase tracking-wider text-white">Q: {f.question.toUpperCase()}</h4>
                            <p className="text-xs text-neutral-400 leading-relaxed font-light pl-4 border-l border-neutral-700">{f.answer}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )

                case 'statistics':
                  return (
                    <div className="max-w-3xl mx-auto py-12 px-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center bg-neutral-900/40 border border-neutral-850">
                      {statNumbers.map((s: any, idx: number) => (
                        <div key={idx} className="space-y-1">
                          <span className="text-3xl font-bold font-mono text-white">{s.value}</span>
                          <span className="block text-[8px] uppercase tracking-widest text-neutral-500 font-bold">{s.label}</span>
                        </div>
                      ))}
                    </div>
                  )

                case 'social-proof':
                  return (
                    <div className="max-w-4xl mx-auto py-6 px-6 text-center border-y border-neutral-850 opacity-40">
                      <span className="text-[8px] font-black uppercase tracking-widest text-neutral-500">PREMIUM MERCHANT VERIFIED</span>
                    </div>
                  )

                case 'cta':
                  return (
                    <div className="max-w-3xl mx-auto py-12 px-6 bg-neutral-900 border-2 border-neutral-800 text-center space-y-4">
                      <h3 className="text-xl font-black uppercase tracking-wider">HUBUNGI KAMI SEKARANG</h3>
                      <p className="text-xs text-neutral-400 font-light max-w-md mx-auto">Hubungi WhatsApp kami untuk informasi lebih lanjut mengenai produk dan layanan kami.</p>
                      <div className="pt-2">
                        {phone && (
                          <a href={`https://wa.me/${phone}`} className="inline-block bg-white text-black hover:bg-neutral-200 font-extrabold text-xs uppercase tracking-widest px-6 py-3 rounded-none">
                            HUBUNGI WHATSAPP
                          </a>
                        )}
                      </div>
                    </div>
                  )

                case 'gallery':
                  return (
                    <div className="max-w-4xl mx-auto py-12 px-6 space-y-8">
                      <div className="text-center space-y-2">
                        <span 
                          className={`text-[9px] font-black text-red-500 uppercase tracking-widest block ${editOutline('galleryTitle')}`}
                          onClick={() => onWYSIWYGFocus?.('galleryTitle')}
                        >
                          {editBadge('Gallery Title')}
                          {galleryTitle}
                        </span>
                        <p 
                          className={`text-xs text-neutral-400 max-w-xl mx-auto font-light ${editOutline('galleryDesc')}`}
                          onClick={() => onWYSIWYGFocus?.('galleryDesc')}
                        >
                          {editBadge('Gallery Desc')}
                          {galleryDesc}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {galleryItems.map((item: any) => (
                          <div key={item.id} className="relative rounded-none overflow-hidden aspect-[4/3] bg-neutral-900 border border-neutral-800 group">
                            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300" />
                            <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 text-left text-white">
                              <h4 className="text-xs font-black uppercase tracking-wider">{item.title}</h4>
                              <p className="text-[10px] text-neutral-400 font-light mt-0.5">{item.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )

                case 'team':
                  return (
                    <div className="max-w-4xl mx-auto py-12 px-6 space-y-8 text-center">
                      <h2 className="text-2xl font-black uppercase tracking-tight">TIM PELAKSANA</h2>
                      <div className="flex flex-wrap justify-center gap-12">
                        {teamMembers.map((t: any, idx: number) => (
                          <div key={idx} className="space-y-2">
                            <div className="w-16 h-16 rounded-none overflow-hidden border border-neutral-800 mx-auto bg-neutral-900">
                              <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <h4 className="text-xs font-black uppercase text-white">{t.name}</h4>
                              <span className="text-[9px] uppercase tracking-wider text-neutral-500 block">{t.role}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )

                case 'process':
                  return (
                    <div className="max-w-4xl mx-auto py-12 px-6 space-y-8 text-center">
                      <h2 className="text-2xl font-black uppercase tracking-tight">PROSEDUR PEMESANAN</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {processSteps.map((p: any, idx: number) => (
                          <div key={idx} className="border border-neutral-850 p-6 rounded-none text-left space-y-2 bg-neutral-950">
                            <span className="text-lg font-bold font-mono text-red-500 block">{p.step}</span>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-white">{p.title}</h4>
                            <p className="text-[10px] text-neutral-400 font-light leading-relaxed">{p.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )

                case 'timeline':
                  return (
                    <div className="max-w-xl mx-auto py-12 px-6 space-y-8 text-left">
                      <h2 className="text-2xl font-black uppercase tracking-tight text-center">RIWAYAT USAHA TIMELINE</h2>
                      <div className="space-y-6 relative border-l border-neutral-800 pl-4 ml-2">
                        {timelineEvents.map((t: any, idx: number) => (
                          <div key={idx} className="relative space-y-1">
                            <span className="absolute -left-[21px] top-1.5 w-2.5 h-1 bg-gradient-to-r from-red-500 to-transparent" />
                            <span className="text-[9px] font-bold text-red-500 font-mono block">{t.year}</span>
                            <h4 className="text-xs font-bold uppercase text-white">{t.title}</h4>
                            <p className="text-[10px] text-neutral-400 font-light leading-relaxed">{t.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )

                case 'lead-capture':
                  return (
                    <div className="max-w-xl mx-auto py-6 px-6 bg-neutral-900 border border-neutral-800 text-center space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-wider">DAPATKAN INFO PROMO TERBARU</h3>
                      <div className="flex gap-2 max-w-sm mx-auto">
                        <input type="email" placeholder="MASUKKAN ALAMAT EMAIL..." className="flex-grow px-3 py-1.5 bg-black border border-neutral-800 text-xs text-white uppercase font-mono rounded-none" />
                        <button className="bg-white text-black hover:bg-neutral-200 font-bold px-4 py-1.5 text-xs uppercase tracking-widest rounded-none">DAFTAR</button>
                      </div>
                    </div>
                  )

                case 'map':
                  return (
                    <div className="max-w-4xl mx-auto py-12 px-6 space-y-6">
                      <h2 className="text-2xl font-black uppercase tracking-tight text-center">PETA LOKASI OUTLET</h2>
                      <div className="border border-neutral-800 rounded-none overflow-hidden p-3 bg-neutral-950 space-y-3">
                        <div className="aspect-[21/9] bg-neutral-900 flex items-center justify-center text-xs text-neutral-600 relative rounded-none border border-neutral-800 select-none">
                          <MapPin className="w-5 h-5 text-red-500" />
                          <span className="absolute bottom-2 left-2 bg-black/90 text-white text-[8px] px-2 py-0.5 border border-neutral-800 font-mono">MAP CONTAINER PREVIEW ({locationName})</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-neutral-500 font-mono">
                          <span>COORDINATES: <strong>{locationName.toUpperCase()}</strong></span>
                          {distance && <span className="text-red-500 font-bold">DELTA: {String(distance).toUpperCase()}</span>}
                        </div>
                      </div>
                    </div>
                  )

                default:
                  return null
              }
            })()

            if (!sectionContent) return null

            return renderSectionContainer(
              secName,
              <div key={secName} className="border-b border-neutral-900 relative">
                {dividerStripe}
                {sectionContent}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <footer className="border-t border-neutral-850 bg-black py-12 px-6 md:px-12 text-left mt-16 font-mono text-[11px] text-neutral-400">
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 pb-8 border-b border-neutral-850">
            <div className="space-y-2">
              <span className="font-bold text-white block uppercase tracking-wider text-[10px]">/// PORTAL</span>
              <p className="leading-relaxed text-neutral-500">{footerTagline.toUpperCase()}</p>
            </div>
            <div className="space-y-2">
              <span className="font-bold text-white block uppercase tracking-wider text-[10px]">PETA SITUS</span>
              <div className="flex flex-col gap-1.5 uppercase text-neutral-500">
                <a href="#products" className="hover:text-white">KATALOG PRODUK</a>
                <span>LMS ACADEMY</span>
                <span>AFILIASI HUB</span>
              </div>
            </div>
            <div className="space-y-2">
              <span className="font-bold text-white block uppercase tracking-wider text-[10px]">HUBUNGI KAMI</span>
              <div className="flex flex-col gap-1 uppercase text-neutral-500">
                {phone && <span>PHONE: {phone}</span>}
                {instagram && <span>INSTA: {instagram}</span>}
              </div>
            </div>
          </div>
          <div className="max-w-4xl mx-auto pt-6 flex justify-between items-center text-[9px] uppercase tracking-wider text-neutral-600">
            <span 
              className={editOutline('footerCopyright')}
              onClick={() => onWYSIWYGFocus?.('footerCopyright')}
            >
              {editBadge('Copyright')}
              {footerCopyright}
            </span>
            <span>/// VERIFIED</span>
          </div>
        </footer>

      </div>
    )
  }

  /* ==========================================================================
     RENDERER: TEMPLATE 5 - CINEMATIC LUXURY (Obsidian / Rosso Corsa / Elegant)
     ========================================================================== */
  const renderFerrariTemplate = () => {
    return (
      <div className="min-h-screen bg-[#181818] text-white font-sans selection:bg-[#da291c]/30 pb-16 relative text-left">
        
        {/* Nav */}
        <header className="sticky top-0 z-30 bg-[#181818] border-b border-[#303030] py-3 px-6 flex justify-between items-center">
          <div className="flex items-center gap-2.5 select-none">
            {logoUrl && (
              <img src={logoUrl} alt="Logo" className="w-5 h-5 rounded-none object-cover border border-neutral-700 shrink-0" />
            )}
            <span className="text-[#da291c] font-black text-sm shrink-0 tracking-tighter uppercase">TERAS PREMIUM</span>
            <span className="text-[9px] font-bold text-neutral-500 tracking-wider">ECOSYSTEM MERCHANT</span>
          </div>
          <span 
            className={`font-semibold text-xs text-white uppercase tracking-wider ${editOutline('title')}`}
            onClick={() => onWYSIWYGFocus?.('title')}
          >
            {editBadge('Title')}
            {title}
          </span>
        </header>

        {/* Dynamic section loops with Rosso Corsa Highlights */}
        <div className="space-y-0">
          {activeSections.filter((sec: string) => sec !== 'footer').map((secName: string) => {
            const sectionContent = (() => {
              switch (secName) {
                case 'hero':
                  return (
                    <div className="max-w-4xl mx-auto space-y-6 py-12 px-6">
                      <span className="text-[10px] font-bold text-[#da291c] uppercase tracking-widest">PARTNER PREMIUM UMKM</span>
                      <h1 
                        className={`text-4xl md:text-5xl font-normal uppercase tracking-tight leading-none text-white ${editOutline('title')}`}
                        onClick={() => onWYSIWYGFocus?.('title')}
                      >
                        {editBadge('Title')}
                        {title}
                      </h1>
                      <p 
                        className={`text-xs md:text-sm text-neutral-400 font-light leading-relaxed max-w-2xl border-l-2 border-[#da291c] pl-4 ${editOutline('bio')}`}
                        onClick={() => onWYSIWYGFocus?.('bio')}
                      >
                        {editBadge('Bio')}
                        {bio}
                      </p>
                      <div className="pt-2">
                        <a href="#products" className="inline-block bg-[#da291c] text-white hover:bg-[#b01e0a] font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-none">
                          LIHAT PRODUK
                        </a>
                      </div>
                    </div>
                  )

                case 'profile':
                  return (
                    <div className="max-w-3xl mx-auto py-12 px-6 space-y-6">
                      <div className="flex items-center gap-4">
                        {logoUrl && (
                          <img src={logoUrl} alt="Profile" className="w-14 h-14 rounded-none object-cover border border-[#303030] shrink-0 shadow-md bg-neutral-900" />
                        )}
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-widest text-[#da291c] block">PROFIL MERCHANT</span>
                          <h2 className="text-2xl font-normal uppercase tracking-tight">TENTANG USAHA</h2>
                        </div>
                      </div>
                      <p className="text-xs text-neutral-300 leading-relaxed font-light whitespace-pre-line">
                        {bio}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-[#303030]">
                        {phone && <div className="text-[11px]"><strong>WHATSAPP HOTLINE:</strong> <span className="block text-neutral-400">{phone}</span></div>}
                        {instagram && <div className="text-[11px]"><strong>PROFIL INSTAGRAM:</strong> <span className="block text-neutral-400">{instagram}</span></div>}
                        <div className="text-[11px]"><strong>ALAMAT OUTLET:</strong> <span className="block text-neutral-400">{locationName}</span></div>
                      </div>
                    </div>
                  )

                case 'features':
                  return (
                    <div className="max-w-4xl mx-auto py-12 px-6 space-y-8">
                      <h2 className="text-2xl font-normal uppercase tracking-tight text-center">KEUNGGULAN UTAMA</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {benefitsList.map((ben: any, idx: number) => (
                          <div key={idx} className="bg-[#303030] border border-[#303030] p-6 rounded-none space-y-2">
                            <span className="text-[9px] font-bold text-[#da291c] uppercase tracking-widest">KEUNGGULAN {idx + 1}</span>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-white">{ben.title}</h3>
                            <p className="text-[11px] text-neutral-400 leading-relaxed font-light">{ben.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )

                case 'benefits':
                  return (
                    <div className="max-w-4xl mx-auto py-8 px-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center border-y border-[#303030]">
                      {benefitsList.map((b: any, idx: number) => (
                        <div key={idx} className="space-y-1.5 text-left">
                          <span className="text-xs font-bold uppercase tracking-wider text-[#da291c]">✓ {b.title}</span>
                          <p className="text-[11px] text-neutral-400 leading-relaxed">{b.desc}</p>
                        </div>
                      ))}
                    </div>
                  )

                case 'products':
                  return (
                    <div id="products" className="max-w-4xl mx-auto py-12 px-6 space-y-8">
                      <h2 className="text-2xl font-normal uppercase tracking-tight text-center">KATALOG PRODUK</h2>
                      {products.length === 0 ? (
                        <div className="text-xs text-neutral-500 text-center py-10 bg-neutral-900/50 border border-[#303030]">BELUM ADA PRODUK YANG DIKONFIGURASI.</div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                          {products.map((p: any) => (
                            <div key={p.id} className="bg-white text-black border border-[#303030] rounded-none overflow-hidden flex flex-col justify-between group">
                              <div className="aspect-[16/10] bg-neutral-100 relative overflow-hidden">
                                {p.imageUrl ? (
                                  <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">NO IMAGE</div>
                                )}
                              </div>
                              <div className="p-4 space-y-3 flex-grow flex flex-col justify-between">
                                <div>
                                  <span className="text-[8px] font-bold uppercase tracking-widest text-[#da291c] border border-[#da291c]/20 bg-[#da291c]/5 px-2 py-0.5">{p.category || 'PRODUK PILIHAN'}</span>
                                  <h3 className="text-xs font-bold uppercase tracking-wider text-black mt-2 line-clamp-1">{p.title}</h3>
                                  <p className="text-[10px] text-neutral-500 line-clamp-2 mt-1">{p.description}</p>
                                </div>
                                <div className="pt-2 flex items-center justify-between border-t border-neutral-100">
                                  <span className="text-xs font-bold text-black">Rp {p.price?.toLocaleString('id-ID')}</span>
                                  {phone && (
                                    <a 
                                      href={`https://wa.me/${phone}?text=Halo, saya tertarik dengan produk ${p.title}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-3 py-1 bg-[#da291c] text-white hover:bg-[#b01e0a] text-[9px] rounded-none font-bold uppercase tracking-wider"
                                    >
                                      PESAN SEKARANG
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )

                case 'testimonials':
                  return (
                    <div className="max-w-4xl mx-auto py-12 px-6 space-y-8">
                      <h2 className="text-2xl font-normal uppercase tracking-tight text-center">ULASAN PELANGGAN</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {testimonialsList.map((t: any, idx: number) => (
                          <div key={idx} className="bg-[#303030] border border-[#303030] p-6 rounded-none text-left space-y-3">
                            <p className="text-xs text-neutral-300 italic">"{t.quote}"</p>
                            <div className="flex justify-between items-center text-[10px] font-bold border-t border-neutral-800 pt-3 text-neutral-400 font-mono">
                              <span>PELANGGAN: {t.name.toUpperCase()}</span>
                              <span className="text-[#da291c]">NILAI: {t.rating}/5</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )

                case 'pricing':
                  return (
                    <div className="max-w-4xl mx-auto py-12 px-6 space-y-8 text-center">
                      <h2 className="text-2xl font-normal uppercase tracking-tight">DAFTAR HARGA LAYANAN</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
                        {pricingTiers.map((p: any, idx: number) => (
                          <div key={idx} className="bg-[#181818] border border-[#303030] p-6 rounded-none text-left space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-white">{p.name}</h3>
                            <span className="text-xl font-bold font-mono text-[#da291c] block">{p.price}</span>
                            <p className="text-[11px] text-neutral-400 font-light leading-relaxed">{p.desc}</p>
                            <ul className="text-[10px] text-neutral-300 space-y-1.5 border-t border-[#303030] pt-3 font-mono">
                              {p.features.map((f: string, fi: number) => (
                                <li key={fi} className="flex items-center gap-1.5">
                                  <span className="text-[#da291c]">✓</span> {f.toUpperCase()}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )

                case 'faq':
                  return (
                    <div className="max-w-2xl mx-auto py-12 px-6 space-y-6 text-left">
                      <h2 className="text-2xl font-normal uppercase tracking-tight text-center">PERTANYAAN UMUM / FAQ</h2>
                      <div className="divide-y divide-[#303030]">
                        {faqList.map((f: any, idx: number) => (
                          <div key={idx} className="py-4 space-y-1">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Q: {f.question.toUpperCase()}</h4>
                            <p className="text-xs text-neutral-400 leading-relaxed font-light pl-4 border-l border-[#da291c]">{f.answer}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )

                case 'statistics':
                  return (
                    <div className="max-w-3xl mx-auto py-12 px-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center bg-[#303030] border border-[#303030]">
                      {statNumbers.map((s: any, idx: number) => (
                        <div key={idx} className="space-y-1">
                          <span className="text-3xl font-bold font-mono text-white">{s.value}</span>
                          <span className="block text-[8px] uppercase tracking-widest text-neutral-400 font-bold">{s.label}</span>
                        </div>
                      ))}
                    </div>
                  )

                case 'social-proof':
                  return (
                    <div className="max-w-4xl mx-auto py-6 px-6 text-center border-y border-[#303030] opacity-40">
                      <span className="text-[8px] font-bold uppercase tracking-widest text-neutral-400">VERIFIED PLATFORM PARTNER</span>
                    </div>
                  )

                case 'cta':
                  return (
                    <div className="max-w-3xl mx-auto py-12 px-6 bg-[#303030] border-2 border-[#303030] text-center space-y-4">
                      <h3 className="text-xl font-normal uppercase tracking-wider">DAPATKAN PENAWARAN TERBAIK</h3>
                      <p className="text-xs text-neutral-400 font-light max-w-md mx-auto">Hubungi kami melalui WhatsApp untuk informasi pemesanan dan pengiriman selengkapnya.</p>
                      <div className="pt-2">
                        {phone && (
                          <a href={`https://wa.me/${phone}`} className="inline-block bg-[#da291c] text-white hover:bg-[#b01e0a] font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-none">
                            HUBUNGI WHATSAPP
                          </a>
                        )}
                      </div>
                    </div>
                  )

                case 'gallery':
                  return (
                    <div className="max-w-4xl mx-auto py-12 px-6 space-y-8">
                      <div className="text-center space-y-2">
                        <span 
                          className={`text-[9px] font-bold text-[#da291c] uppercase tracking-widest block ${editOutline('galleryTitle')}`}
                          onClick={() => onWYSIWYGFocus?.('galleryTitle')}
                        >
                          {editBadge('Gallery Title')}
                          {galleryTitle}
                        </span>
                        <p 
                          className={`text-xs text-neutral-400 max-w-xl mx-auto font-light ${editOutline('galleryDesc')}`}
                          onClick={() => onWYSIWYGFocus?.('galleryDesc')}
                        >
                          {editBadge('Gallery Desc')}
                          {galleryDesc}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {galleryItems.map((item: any) => (
                          <div key={item.id} className="relative rounded-none overflow-hidden aspect-[4/3] bg-[#303030] border border-[#303030] group">
                            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300" />
                            <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 text-left text-white">
                              <h4 className="text-xs font-bold uppercase tracking-wider">{item.title}</h4>
                              <p className="text-[10px] text-neutral-400 font-light mt-0.5">{item.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )

                case 'team':
                  return (
                    <div className="max-w-4xl mx-auto py-12 px-6 space-y-8 text-center">
                      <h2 className="text-2xl font-normal uppercase tracking-tight">TIM KAMI</h2>
                      <div className="flex flex-wrap justify-center gap-12">
                        {teamMembers.map((t: any, idx: number) => (
                          <div key={idx} className="space-y-2">
                            <div className="w-16 h-16 rounded-none overflow-hidden border border-[#303030] mx-auto bg-neutral-900">
                              <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold uppercase text-white">{t.name}</h4>
                              <span className="text-[9px] uppercase tracking-wider text-neutral-500 block">{t.role}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )

                case 'process':
                  return (
                    <div className="max-w-4xl mx-auto py-12 px-6 space-y-8 text-center">
                      <h2 className="text-2xl font-normal uppercase tracking-tight">PROSES LAYANAN</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {processSteps.map((p: any, idx: number) => (
                          <div key={idx} className="border border-[#303030] p-6 rounded-none text-left space-y-2 bg-[#303030]/20">
                            <span className="text-lg font-bold font-mono text-[#da291c] block">{p.step}</span>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-white">{p.title}</h4>
                            <p className="text-[10px] text-neutral-400 font-light leading-relaxed">{p.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )

                case 'timeline':
                  return (
                    <div className="max-w-xl mx-auto py-12 px-6 space-y-8 text-left">
                      <h2 className="text-2xl font-normal uppercase tracking-tight text-center">RIWAYAT USAHA</h2>
                      <div className="space-y-6 relative border-l border-[#303030] pl-4 ml-2">
                        {timelineEvents.map((t: any, idx: number) => (
                          <div key={idx} className="relative space-y-1">
                            <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-[#da291c]" />
                            <span className="text-[9px] font-bold text-[#da291c] font-mono block">{t.year}</span>
                            <h4 className="text-xs font-bold uppercase text-white">{t.title}</h4>
                            <p className="text-[10px] text-neutral-400 font-light leading-relaxed">{t.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )

                case 'lead-capture':
                  return (
                    <div className="max-w-xl mx-auto py-6 px-6 bg-[#303030] border border-[#303030] text-center space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider">DAPATKAN UPDATE & PROMO</h3>
                      <div className="flex gap-2 max-w-sm mx-auto">
                        <input type="email" placeholder="MASUKKAN ALAMAT EMAIL..." className="flex-grow px-3 py-1.5 bg-[#181818] border border-[#303030] text-xs text-white uppercase font-mono rounded-none" />
                        <button className="bg-white text-black hover:bg-neutral-200 font-bold px-4 py-1.5 text-xs uppercase tracking-wider rounded-none">DAFTAR</button>
                      </div>
                    </div>
                  )

                case 'map':
                  return (
                    <div className="max-w-4xl mx-auto py-12 px-6 space-y-6">
                      <h2 className="text-2xl font-normal uppercase tracking-tight text-center">PETA LOKASI OUTLET</h2>
                      <div className="border border-[#303030] rounded-none overflow-hidden p-3 bg-neutral-950 space-y-3">
                        <div className="aspect-[21/9] bg-neutral-900 flex items-center justify-center text-xs text-neutral-600 relative rounded-none border border-[#303030] select-none">
                          <MapPin className="w-5 h-5 text-[#da291c]" />
                          <span className="absolute bottom-2 left-2 bg-black/90 text-white text-[8px] px-2 py-0.5 border border-[#303030] font-mono">PREVIEW LOKASI ({locationName})</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-neutral-500 font-mono">
                          <span>ALAMAT: <strong>{locationName.toUpperCase()}</strong></span>
                          {distance && <span className="text-[#da291c] font-bold">JARAK: {String(distance).toUpperCase()}</span>}
                        </div>
                      </div>
                    </div>
                  )

                default:
                  return null
              }
            })()

            if (!sectionContent) return null

            return renderSectionContainer(
              secName,
              <div key={secName} className="border-b border-[#303030] relative">
                {sectionContent}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <footer className="border-t border-[#303030] bg-[#181818] py-12 px-6 md:px-12 text-left mt-16 font-mono text-[11px] text-neutral-400">
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 pb-8 border-b border-[#303030]">
            <div className="space-y-2">
              <span className="font-bold text-white block uppercase tracking-wider text-[10px]">✓ TERAS PREMIUM</span>
              <p className="leading-relaxed text-neutral-500">{footerTagline.toUpperCase()}</p>
            </div>
            <div className="space-y-2">
              <span className="font-bold text-white block uppercase tracking-wider text-[10px]">SITEMAP</span>
              <div className="flex flex-col gap-1.5 uppercase text-neutral-500">
                <a href="#products" className="hover:text-white">PRODUK KAMI</a>
                <span>LMS ACADEMY</span>
                <span>AFILIASI</span>
              </div>
            </div>
            <div className="space-y-2">
              <span className="font-bold text-white block uppercase tracking-wider text-[10px]">KONTAK KAMI</span>
              <div className="flex flex-col gap-1 uppercase text-neutral-500">
                {phone && <span>TELP: {phone}</span>}
                {instagram && <span>INSTA: {instagram}</span>}
              </div>
            </div>
          </div>
          <div className="max-w-4xl mx-auto pt-6 flex justify-between items-center text-[9px] uppercase tracking-wider text-neutral-600">
            <span 
              className={editOutline('footerCopyright')}
              onClick={() => onWYSIWYGFocus?.('footerCopyright')}
            >
              {editBadge('Copyright')}
              {footerCopyright}
            </span>
            <span>✓ VERIFIED MERCHANT</span>
          </div>
        </footer>

      </div>
    )
  }

  /* ==========================================================================
     RENDERER: TEMPLATE 6 - NEO BRUTALISM (Yellow Canvas / Thick Outlines)
     ========================================================================== */
  const renderBrutalistTemplate = () => {
    const bgClass = "min-h-screen bg-[#f7f3eb] text-[#111111] font-geist selection:bg-[#ffcc00] pb-24 overflow-hidden relative text-left"
    const headerClass = "bg-[#f7f3eb] border-[3px] border-black rounded-none px-6 py-4 flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
    const logoBorder = "w-8 h-8 rounded-none overflow-hidden border-2 border-black"
    const verifiedBadge = "bg-[#ffcc00] border-2 border-black text-[9px] font-black px-2.5 py-1 uppercase tracking-wider rounded-none"
    
    // Section styles
    const heroSectionClass = "space-y-6 text-left border-[3px] border-black p-8 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-none"
    const heroBadgeClass = "inline-block px-3 py-1 bg-[#ff5c5c] text-white border-2 border-black font-black text-[9px] uppercase tracking-wider rounded-none"
    const heroTitleClass = "text-4xl md:text-6xl font-black tracking-tight leading-none uppercase"
    const heroSpanClass = "bg-[#ffcc00] px-2 border-2 border-black inline-block transform -rotate-1"
    const heroTextClass = "text-xs md:text-sm text-zinc-700 max-w-2xl font-bold leading-relaxed border-l-4 border-black pl-4"
    const heroButtonClass = "inline-flex items-center gap-2 px-8 py-4 bg-[#ffcc00] text-black border-[3px] border-black font-black text-xs uppercase tracking-wider hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer rounded-none"

    const aboutSectionClass = "bg-white border-[3px] border-black rounded-none p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-6"
    const aboutTitleBadge = "text-sm font-black uppercase tracking-wider bg-[#ff5c5c] text-white border-2 border-black px-3 py-1.5 w-fit rounded-none"
    const aboutTextClass = "text-xs md:text-sm leading-relaxed font-bold"
    const linkCardClass = "flex items-center gap-3 p-4 bg-[#f7f3eb] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all rounded-none"

    const productsHeaderClass = "flex justify-between items-end pb-3 border-b-[3px] border-black"
    const countBadgeClass = "bg-white border-2 border-black text-[9px] font-black px-3 py-1 rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
    const productEmptyClass = "p-12 text-center border-2 border-black bg-white rounded-none text-xs font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
    const productCardClass = "bg-white border-[3px] border-black rounded-none p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all duration-200 flex flex-col justify-between"
    const productImageContainer = "aspect-[16/10] w-full rounded-none overflow-hidden mb-4 border-2 border-black bg-[#f7f3eb]"
    const productCatClass = "text-[8px] font-black uppercase bg-[#ffcc00] border-2 border-black px-2 py-0.5 rounded-none"
    const productTitleClass = "text-sm font-black mt-3 uppercase tracking-tight line-clamp-1"
    const productPriceClass = "text-xs font-black bg-[#ff5c5c] text-white border-2 border-black px-2.5 py-1 w-fit"
    const productBuyButtonClass = "px-4 py-2 bg-black text-white text-[9px] font-black uppercase tracking-wider border-2 border-black hover:bg-[#ffcc00] hover:text-black transition-colors rounded-none"

    const mapSectionClass = "bg-white border-[3px] border-black p-6 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4"
    const mapDistanceClass = "bg-[#ffcc00] border-2 border-black px-2.5 py-1 text-[9px] font-black uppercase"
    const mapCanvasClass = "relative aspect-[21/9] rounded-none bg-[#f7f3eb] border-2 border-black overflow-hidden flex items-center justify-center"
    const mapAvatarClass = "w-8 h-8 rounded-none border-2 border-black overflow-hidden bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
    const mapTextClass = "bg-white border-2 border-black px-2.5 py-0.5 font-black text-[9px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"

    const faqHeaderClass = "text-sm font-black uppercase tracking-wider pb-2 border-b-[3px] border-black"
    const faqItemClass = "border-2 border-black rounded-none overflow-hidden bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
    const faqButtonClass = "w-full p-4.5 text-left text-xs font-black text-black flex justify-between items-center hover:bg-[#f7f3eb] transition-colors"
    const faqTextClass = "px-5 pb-5 text-xs text-zinc-700 leading-relaxed font-bold border-t-2 border-black pt-3"

    const ctaSectionClass = "p-8 md:p-10 rounded-none border-[3px] border-black text-center space-y-6 bg-[#ff5c5c] text-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
    const ctaButtonClass = "inline-flex items-center gap-2.5 px-8 py-4 bg-white text-black border-2 border-black font-black text-xs uppercase tracking-wider hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer rounded-none"

    return (
      <div className={bgClass}>
        {/* Heavy Brutalist Navbar */}
        <header className="sticky top-4 z-45 max-w-4xl mx-auto px-4 w-full">
          <div className={headerClass}>
            <div className="flex items-center gap-3">
              {logoUrl && (
                <div className={logoBorder}>
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                </div>
              )}
              <span 
                className={`font-black text-xs uppercase tracking-tight ${editOutline('title')}`}
                onClick={() => onWYSIWYGFocus?.('title')}
              >
                {editBadge('Title')}
                {title}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <span className={verifiedBadge}>
                {user.membershipLevel || 'VERIFIED MERCHANT'}
              </span>
              {badges && badges.map((b: any) => (
                <span key={b.id} title={b.desc} className="bg-white border-2 border-black px-2 py-1 text-[8px] font-black uppercase shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                  {b.label}
                </span>
              ))}
              <UserQRCode
                userId={user.id}
                userName={user.name}
                accentColor='#ffcc00'
                qrDarkColor="#111111"
                qrLightColor="#ffffff"
                variant="icon-only"
              />
            </div>
          </div>
        </header>

        {/* Main Container */}
        <main className="max-w-4xl mx-auto px-6 mt-16 space-y-20 relative">
          {activeSections.filter((sec: string) => sec !== 'footer').map((secName: string) => {
            const sectionContent = (() => {
              switch (secName) {
                case 'hero':
                  return (
                    <section className={heroSectionClass}>
                      <div className={heroBadgeClass}>
                        ★ verified merchant
                      </div>
                      <h1 
                        className={`text-4xl md:text-6xl font-black tracking-tight leading-none uppercase ${editOutline('title')}`}
                        onClick={() => onWYSIWYGFocus?.('title')}
                      >
                        {editBadge('Title')}
                        WE MAKE <span className={heroSpanClass}>AWESOME</span> LOCAL PRODUCTS.
                      </h1>
                      <p 
                        className={`text-xs md:text-sm text-zinc-700 max-w-2xl font-bold leading-relaxed border-l-4 border-black pl-4 ${editOutline('bio')}`}
                        onClick={() => onWYSIWYGFocus?.('bio')}
                      >
                        {editBadge('Bio')}
                        {bio}
                      </p>
                      <div className="pt-2">
                        <a href="#products" className={heroButtonClass}>
                          Lihat Produk Usaha
                          <ArrowRight className="w-4 h-4" />
                        </a>
                      </div>
                    </section>
                  )

                case 'profile':
                  return (
                    <section className={aboutSectionClass}>
                      <h3 className={aboutTitleBadge}>
                        Tentang Usaha Kami
                      </h3>
                      <p 
                        className={`text-xs md:text-sm leading-relaxed font-bold ${editOutline('bio')}`}
                        onClick={() => onWYSIWYGFocus?.('bio')}
                      >
                        {editBadge('Bio')}
                        {bio}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-xs font-black">
                        {phone && (
                          <a 
                            href={`https://wa.me/${phone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={linkCardClass}
                          >
                            <Phone className="w-5 h-5" />
                            <div>
                              <span className="block text-[8px] uppercase text-zinc-500 font-bold">WhatsApp</span>
                              <span>{phone}</span>
                            </div>
                          </a>
                        )}
                        {instagram && (
                          <a 
                            href={`https://instagram.com/${instagram}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={linkCardClass}
                          >
                            <InstagramIcon className="w-5 h-5" />
                            <div>
                              <span className="block text-[8px] uppercase text-zinc-500 font-bold">Instagram</span>
                              <span>{instagram}</span>
                            </div>
                          </a>
                        )}
                      </div>
                    </section>
                  )

                case 'features':
                  return (
                    <div className="bg-white border-[3px] border-black p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-6">
                      <span className="text-sm font-black uppercase tracking-wider bg-[#ff5c5c] text-white border-2 border-black px-3 py-1.5 w-fit rounded-none block">
                        Keunggulan Kami
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {benefitsList.map((ben: any, idx: number) => (
                          <div key={idx} className="border-2 border-black rounded-none p-5 bg-[#f7f3eb] shadow-[2px_2px_0px_rgba(0,0,0,1)] space-y-2 text-left">
                            <h3 className="text-xs font-black uppercase tracking-wider text-black">{ben.title}</h3>
                            <p className="text-[11px] text-zinc-700 leading-relaxed font-bold">{ben.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )

                case 'benefits':
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      {benefitsList.map((b: any, idx: number) => (
                        <div key={idx} className="border-2 border-black bg-[#ffcc00] p-4 text-center shadow-[3px_3px_0px_rgba(0,0,0,1)] space-y-2 text-left">
                          <span className="text-xs font-black uppercase tracking-wider text-black block border-b-2 border-black pb-1">✓ {b.title}</span>
                          <p className="text-[11px] text-black font-bold leading-relaxed">{b.desc}</p>
                        </div>
                      ))}
                    </div>
                  )

                case 'products':
                  return (
                    <div id="products" className="space-y-6">
                      <div className={productsHeaderClass}>
                        <h2 className="text-2xl font-black uppercase tracking-tight">Katalog Produk</h2>
                        <span className={countBadgeClass}>Total: {products.length} Item</span>
                      </div>
                      {products.length === 0 ? (
                        <div className={productEmptyClass}>Belum ada produk terkonfigurasi.</div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                          {products.map((p: any) => (
                            <div key={p.id} className={productCardClass}>
                              <div className={productImageContainer}>
                                {p.imageUrl ? (
                                  <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-400">NO IMAGE</div>
                                )}
                              </div>
                              <div className="space-y-3 flex-grow flex flex-col justify-between">
                                <div>
                                  <span className={productCatClass}>{p.category || 'PRODUK'}</span>
                                  <h3 className={productTitleClass}>{p.title}</h3>
                                  <p className="text-[10px] text-zinc-600 line-clamp-2 mt-1 font-bold">{p.description}</p>
                                </div>
                                <div className="pt-2 flex items-center justify-between border-t-2 border-black">
                                  <span className={productPriceClass}>Rp {p.price?.toLocaleString('id-ID')}</span>
                                  {phone && (
                                    <a 
                                      href={`https://wa.me/${phone}?text=Halo, saya tertarik dengan produk ${p.title}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={productBuyButtonClass}
                                    >
                                      Beli
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )

                case 'testimonials':
                  return (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-black uppercase tracking-tight border-b-[3px] border-black pb-2">Ulasan Pelanggan</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {testimonialsList.map((t: any, idx: number) => (
                          <div key={idx} className="bg-white border-2 border-black p-5 shadow-[3px_3px_0px_rgba(0,0,0,1)] text-left space-y-4">
                            <p className="text-xs text-zinc-800 italic font-bold">"{t.quote}"</p>
                            <div className="flex justify-between items-center border-t-2 border-black pt-3">
                              <span className="text-[10px] font-black text-black">{t.name}</span>
                              <div className="flex gap-0.5 text-amber-500">
                                {Array.from({ length: t.rating }).map((_, i) => (
                                  <Star key={i} className="w-3 h-3 fill-current stroke-black stroke-2" />
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )

                case 'pricing':
                  return (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-black uppercase tracking-tight border-b-[3px] border-black pb-2 text-center">Paket Harga</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
                        {pricingTiers.map((p: any, idx: number) => (
                          <div key={idx} className="bg-white border-3 border-black p-6 shadow-[4px_4px_0px_rgba(0,0,0,1)] space-y-4 text-left">
                            <h3 className="text-sm font-black uppercase text-black">{p.name}</h3>
                            <span className="text-lg font-black bg-[#ff5c5c] text-white border-2 border-black px-3 py-1 block w-fit">{p.price}</span>
                            <p className="text-xs text-zinc-600 font-bold">{p.desc}</p>
                            <ul className="text-[10px] text-black font-bold space-y-1.5 border-t-2 border-black pt-3">
                              {p.features.map((f: any, fi: number) => (
                                <li key={fi} className="flex items-center gap-1.5">
                                  <span className="text-[#ff5c5c]">✓</span> {f}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )

                case 'faq':
                  return (
                    <div className="space-y-6 text-left">
                      <h2 className={faqHeaderClass}>Pertanyaan Umum / FAQ</h2>
                      <div className="space-y-3">
                        {faqList.map((f: any, idx: number) => (
                          <div key={idx} className={faqItemClass}>
                            <button 
                              type="button"
                              onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                              className={faqButtonClass}
                            >
                              <span>{f.question}</span>
                              <span className="font-black">{activeFaq === idx ? '▲' : '▼'}</span>
                            </button>
                            {activeFaq === idx && (
                              <p className={faqTextClass}>{f.answer}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )

                case 'statistics':
                  return (
                    <div className="bg-[#ffcc00] border-3 border-black p-6 shadow-[4px_4px_0px_rgba(0,0,0,1)] flex flex-wrap justify-around gap-6 text-center">
                      {statNumbers.map((s: any, idx: number) => (
                        <div key={idx} className="space-y-1">
                          <span className="text-3xl font-black text-black block">{s.value}</span>
                          <span className="block text-[8px] uppercase tracking-wider text-black font-black">{s.label}</span>
                        </div>
                      ))}
                    </div>
                  )

                case 'social-proof':
                  return (
                    <div className="bg-white border-2 border-black p-3 font-bold uppercase tracking-wider text-center shadow-[2px_2px_0px_rgba(0,0,0,1)] text-[10px]">
                      ★ ECOSYSTEM PARTNER · VERIFIED PREMIUM MERCHANT · TERAS RETAIL ★
                    </div>
                  )

                case 'cta':
                  return (
                    <section className={ctaSectionClass}>
                      <h3 className="text-2xl font-black uppercase tracking-tight">Siap Memulai?</h3>
                      <p className="text-xs font-bold max-w-md mx-auto">Hubungi WhatsApp hotline kami untuk konsultasi pesanan dan detail pengiriman sekarang.</p>
                      <div className="pt-2">
                        {phone && (
                          <a href={`https://wa.me/${phone}`} className={ctaButtonClass}>
                            Hubungi WhatsApp
                            <ArrowRight className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </section>
                  )

                case 'gallery':
                  return (
                    <div className="space-y-6">
                      <div className="text-center space-y-2">
                        <span 
                          className={`text-sm font-black uppercase tracking-wider bg-[#ff5c5c] text-white border-2 border-black px-3 py-1.5 w-fit mx-auto block ${editOutline('galleryTitle')}`}
                          onClick={() => onWYSIWYGFocus?.('galleryTitle')}
                        >
                          {editBadge('Gallery Title')}
                          {galleryTitle}
                        </span>
                        <p 
                          className={`text-xs text-zinc-700 max-w-xl mx-auto font-bold ${editOutline('galleryDesc')}`}
                          onClick={() => onWYSIWYGFocus?.('galleryDesc')}
                        >
                          {editBadge('Gallery Desc')}
                          {galleryDesc}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {galleryItems.map((item: any) => (
                          <div key={item.id} className="border-2 border-black bg-white p-2 shadow-[3px_3px_0px_rgba(0,0,0,1)] space-y-2">
                            <img src={item.imageUrl} alt={item.title} className="w-full aspect-[4/3] object-cover border-2 border-black" />
                            <div className="text-left p-1 text-xs">
                              <h4 className="font-black uppercase">{item.title}</h4>
                              <p className="text-[10px] text-zinc-600 font-bold mt-0.5">{item.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )

                case 'team':
                  return (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-black uppercase tracking-tight border-b-[3px] border-black pb-2 text-center">Tim Kami</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-md mx-auto">
                        {teamMembers.map((t: any, idx: number) => (
                          <div key={idx} className="bg-white border-2 border-black p-4 text-center shadow-[3px_3px_0px_rgba(0,0,0,1)] flex items-center gap-4 text-left">
                            <div className="w-12 h-12 border-2 border-black overflow-hidden shrink-0">
                              <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <h4 className="text-xs font-black uppercase text-black">{t.name}</h4>
                              <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold block">{t.role}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )

                case 'process':
                  return (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-black uppercase tracking-tight border-b-[3px] border-black pb-2 text-center">Cara Pemesanan</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {processSteps.map((p: any, idx: number) => (
                          <div key={idx} className="border-2 border-black bg-white p-5 shadow-[3px_3px_0px_rgba(0,0,0,1)] space-y-2 text-left">
                            <span className="text-2xl font-black text-[#ff5c5c] block">{p.step}</span>
                            <h4 className="text-xs font-black uppercase tracking-wider text-black border-b-2 border-black pb-1">{p.title}</h4>
                            <p className="text-[10px] text-zinc-700 font-bold leading-relaxed">{p.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )

                case 'timeline':
                  return (
                    <div className="max-w-xl mx-auto space-y-6">
                      <h2 className="text-2xl font-black uppercase tracking-tight border-b-[3px] border-black pb-2 text-center">Riwayat Usaha</h2>
                      <div className="space-y-4 text-left">
                        {timelineEvents.map((t: any, idx: number) => (
                          <div key={idx} className="border-2 border-black bg-white p-4 shadow-[2px_2px_0px_rgba(0,0,0,1)] flex items-start gap-4">
                            <span className="font-black text-[10px] bg-[#ffcc00] border-2 border-black px-2 py-0.5 shrink-0">{t.year}</span>
                            <div>
                              <h4 className="text-xs font-black uppercase">{t.title}</h4>
                              <p className="text-[10px] text-zinc-600 font-bold mt-0.5">{t.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )

                case 'lead-capture':
                  return (
                    <div className="bg-[#ffcc00] border-3 border-black p-6 text-center space-y-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] max-w-lg mx-auto">
                      <h3 className="text-sm font-black uppercase tracking-wider">Dapatkan Penawaran Khusus</h3>
                      <p className="text-[11px] text-black font-bold">Masukkan email untuk update produk dan promosi grosir menarik lainnya.</p>
                      <div className="flex gap-2 max-w-sm mx-auto flex-col sm:flex-row">
                        <input type="email" placeholder="Email Anda..." className="flex-grow border-2 border-black bg-white px-3 py-2 text-xs rounded-none font-bold outline-none" />
                        <button type="button" className="bg-black text-white hover:bg-neutral-800 font-bold border-2 border-black px-4 py-2 uppercase rounded-none text-xs">Kirim</button>
                      </div>
                    </div>
                  )

                case 'map':
                  return (
                    <div className={mapSectionClass}>
                      <div className="flex justify-between items-center border-b-2 border-black pb-2">
                        <h3 className="text-xs font-black uppercase tracking-wider">Lokasi Outlet</h3>
                        {distance && <span className={mapDistanceClass}>{distance} dari Anda</span>}
                      </div>
                      <div className={mapCanvasClass}>
                        <MapPin className="w-8 h-8 text-black" />
                        <span className="absolute bottom-2 left-2 bg-white border-2 border-black px-2 py-0.5 font-black text-[8px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">OSM PREVIEW ({locationName})</span>
                      </div>
                      <div className="text-xs font-bold text-zinc-800">
                        Alamat Usaha: <span className="underline">{locationName}</span>
                      </div>
                    </div>
                  )

                default:
                  return null
              }
            })()

            if (!sectionContent) return null

            return renderSectionContainer(
              secName,
              <div key={secName} className="py-2 relative">
                {sectionContent}
              </div>
            )
          })}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t-[4px] border-black py-12 px-6 md:px-12 text-left mt-16 font-sans text-xs text-black">
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 pb-8 border-b-2 border-black">
            <div className="space-y-2">
              <span className="font-black text-black block uppercase tracking-wider text-[10px]">Teras UMKM</span>
              <p className="leading-relaxed font-bold text-zinc-600">{footerTagline}</p>
            </div>
            <div className="space-y-2">
              <span className="font-black text-black block uppercase tracking-wider text-[10px]">Navigasi</span>
              <div className="flex flex-col gap-1.5 font-bold">
                <a href="#products" className="hover:underline">Belanja Produk</a>
                <span>LMS Academy</span>
                <span>Affiliate</span>
              </div>
            </div>
            <div className="space-y-2">
              <span className="font-black text-black block uppercase tracking-wider text-[10px]">Kontak</span>
              <div className="flex flex-col gap-1 font-bold text-zinc-600">
                {phone && <span>WhatsApp: {phone}</span>}
                {instagram && <span>Instagram: {instagram}</span>}
              </div>
            </div>
          </div>
          <div className="max-w-4xl mx-auto pt-6 flex justify-between items-center text-[10px] text-black font-bold">
            <span 
              className={editOutline('footerCopyright')}
              onClick={() => onWYSIWYGFocus?.('footerCopyright')}
            >
              {editBadge('Copyright')}
              {footerCopyright}
            </span>
            <span className="bg-[#ffcc00] border-2 border-black px-2 py-0.5 text-[8px] uppercase">Verified Merchant</span>
          </div>
        </footer>
      </div>
    )
  }

  // Fallback to selected template registry
  switch (templateId) {
    case 'template1':
      return renderAppleTemplate()
    case 'template2':
      return renderDellTemplate()
    case 'template3':
      return renderAirbnbTemplate()
    case 'template4':
      return renderBMWTemplate()
    case 'template5':
      return renderFerrariTemplate()
    case 'brutalist':
      return renderBrutalistTemplate()
    default:
      return null
  }
}
