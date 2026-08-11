# Community Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a customizable community landing page template directly matching the user mockup, with custom data stored as JSON in the database, and an editor inside the community settings dashboard.

**Architecture:** Split responsibilities into three files:
1. `src/app/community/[id]/LandingPageView.tsx` - Displays the high-fidelity public landing page.
2. `src/app/community/[id]/LandingPageEditor.tsx` - Provides form fields to edit the landing page contents.
3. `src/app/community/[id]/page.tsx` - Coordinates views, membership transitions, and handles saves.

**Tech Stack:** React, Next.js (App Router), Tailwind CSS, Lucide icons, Framer Motion.

## Global Constraints
- Customizations must be stored locally; do not push changes to the master branch.
- No AI-generated graphics or illustrations. Use standard Lucide icons and realistic, high-quality Unsplash photography for fallbacks.
- Strictly maintain type safety and avoid placeholder code.

---

### Task 1: Create LandingPageView Component

**Files:**
- Create: `src/app/community/[id]/LandingPageView.tsx`

**Interfaces:**
- Consumes: Community details object, parsed `landingPageConfig` object, and event handlers `onJoin()`, `onViewDashboard()`.
- Produces: Visual public landing page conforming to the mockup image.

- [ ] **Step 1: Write the LandingPageView.tsx file with full design**
  Create the file with full Tailwind styling. Define fallback configurations for Koperasi (Kopjaswara theme) and Perkumpulan (Perahu Kita theme) using real Unsplash images.

```tsx
import React from 'react'
import { 
  Users, Wallet, GraduationCap, Building2, Coins, Calendar, PieChart, 
  MapPin, Shield, Star, HelpCircle, ArrowRight, Share2, ChevronRight, Award, Plus, Play
} from 'lucide-react'

// Default Kopjaswara config
export const DEFAULT_KOPERASI_CONFIG = {
  hero: {
    badge: 'KOPERASI PRO',
    title: 'Kopjaswara',
    subtitle: 'Koperasi Jasa dan Usaha Bersama',
    description: 'Wadah kolaborasi untuk UMKM, pengusaha, dan profesional untuk tumbuh bersama dan menciptakan ekonomi kerakyatan yang kuat dan berkelanjutan.',
    coverUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80',
    quoteText: 'Kolaborasi hari ini, kesempatan lebih besar untuk masa depan.',
    quoteAuthor: 'Kopjaswara',
    didirikan: '12 Mei 2020',
    ketua: 'Rijal Assiddiq',
    lokasi: 'Bandung, Jawa Barat',
    anggotaCount: '788+ Anggota'
  },
  benefits: [
    { title: 'Jaringan Luas', description: 'Terhubung dengan ratusan UMKM dan pengusaha di berbagai bidang.', icon: 'Users' },
    { title: 'Akses Permodalan', description: 'Pembiayaan mudah dengan syarat ringan dan proses transparan.', icon: 'Wallet' },
    { title: 'Edukasi & Pelatihan', description: 'Tingkatkan skill melalui pelatihan, webinar, dan mentoring eksklusif.', icon: 'GraduationCap' },
    { title: 'Produk & Layanan', description: 'Nikmati berbagai produk dan layanan koperasi dengan harga khusus.', icon: 'Building2' },
    { title: 'Bagi Hasil (SHU)', description: 'Raih keuntungan dari partisipasi aktif Anda di koperasi.', icon: 'PieChart' }
  ],
  stats: [
    { value: '788+', label: 'Anggota Aktif', desc: 'Bergabung bersama kami', icon: 'Users' },
    { value: '120+', label: 'UMKM Bergabung', desc: 'Bersama tumbuh dan berdaya', icon: 'Building2' },
    { value: 'Rp 1,2 M+', label: 'Transaksi Anggota', desc: 'Total transaksi melalui jaringan koperasi', icon: 'Coins' },
    { value: '50+', label: 'Kegiatan & Event', desc: 'Pelatihan, webinar, dan event bisnis', icon: 'Calendar' }
  ],
  activities: [
    { title: 'Strategi Pemasaran UMKM di Era Digital', category: 'WEBINAR', dateLocation: '18 Mei 2024 • Online', imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=400&q=80' },
    { title: 'Pelatihan Manajemen Keuangan Usaha', category: 'PELATIHAN', dateLocation: '25 Mei 2024 • Bandung', imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=400&q=80' },
    { title: 'Kopjaswara Business Matching', category: 'NETWORKING', dateLocation: '1 Juni 2024 • Bandung', imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=400&q=80' }
  ],
  ctaBanner: {
    text: 'Bergabung sekarang dan jadilah bagian dari ekosistem bisnis yang saling mendukung dan menginspirasi.',
    buttonText: 'Menjadi Anggota Sekarang'
  }
}

// Default Perkumpulan config
export const DEFAULT_PERKUMPULAN_CONFIG = {
  hero: {
    badge: 'KOMUNITAS UMKM',
    title: 'Perahu Kita',
    subtitle: 'Wadah Sinergi & Kolaborasi Pengusaha Yogyakarta',
    description: 'Wadah bagi pelaku usaha, UMKM, dan masyarakat untuk saling berbagi pengalaman, memperluas relasi dan menciptakan peluang bersama.',
    coverUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
    quoteText: 'Sinergi lokal, tumbuh bersama demi kemakmuran bersama.',
    quoteAuthor: 'Perahu Kita',
    didirikan: '25 Juli 2026',
    ketua: 'Super Admin Teras',
    lokasi: 'Kota Yogyakarta, DIY',
    anggotaCount: '1.248+ Anggota'
  },
  benefits: [
    { title: 'Kolaborasi Bisnis', description: 'Temukan mitra strategis untuk memperbesar skala usaha Anda.', icon: 'Users' },
    { title: 'Peluang Pasar', description: 'Akses ke bazar, marketplace, dan jaringan pameran UMKM.', icon: 'Building2' },
    { title: 'Pelatihan Intensif', description: 'Mentoring digital marketing, perizinan, dan foto produk.', icon: 'GraduationCap' },
    { title: 'Diskusi Komunitas', description: 'Saling bertukar ide dan solusi dari tantangan bisnis sehari-hari.', icon: 'Coins' },
    { title: 'Networking Bulanan', description: 'Kopi darat reguler untuk mempererat relasi anggota.', icon: 'Users' }
  ],
  stats: [
    { value: '1.248+', label: 'Anggota Aktif', desc: 'Saling berjejaring dan belajar', icon: 'Users' },
    { value: '156+', label: 'Diskusi Hangat', desc: 'Topik bisnis dan info pasar', icon: 'Coins' },
    { value: '24+', label: 'Event Bulanan', desc: 'Bazar dan pelatihan langsung', icon: 'Calendar' },
    { value: '87+', label: 'Galeri Kegiatan', desc: 'Dokumentasi sinergi anggota', icon: 'Building2' }
  ],
  activities: [
    { title: 'Workshop Branding Produk UMKM DIY', category: 'PELATIHAN', dateLocation: '15 Agustus 2026 • Jogja', imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=400&q=80' },
    { title: 'Bazar UMKM Malioboro Kreatif', category: 'EVENT', dateLocation: '22 Agustus 2026 • Yogyakarta', imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=400&q=80' },
    { title: 'Kopi Darat Sinergi UMKM Sleman', category: 'NETWORKING', dateLocation: '5 September 2026 • Sleman', imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=400&q=80' }
  ],
  ctaBanner: {
    text: 'Sinergikan bisnismu sekarang dan tumbuh bersama ratusan UMKM berprestasi di Yogyakarta!',
    buttonText: 'Gabung Komunitas Sekarang'
  }
}

// Icon mapper helper
const IconMap: { [key: string]: any } = {
  Users, Wallet, GraduationCap, Building2, Coins, Calendar, PieChart, MapPin, Shield
}

interface LandingPageViewProps {
  community: any
  config: any
  onJoin: () => void
  onViewDashboard: () => void
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  community,
  config,
  onJoin,
  onViewDashboard
}) => {
  const isKoperasi = (community?.type || '').toLowerCase() === 'koperasi' || (community?.category || '').toLowerCase() === 'koperasi'
  const defaults = isKoperasi ? DEFAULT_KOPERASI_CONFIG : DEFAULT_PERKUMPULAN_CONFIG
  
  // Merge config with default values safely
  const hero = { ...defaults.hero, ...config?.hero }
  const benefits = config?.benefits?.length === 5 ? config.benefits : defaults.benefits
  const stats = config?.stats?.length === 4 ? config.stats : defaults.stats
  const activities = config?.activities?.length === 3 ? config.activities : defaults.activities
  const ctaBanner = { ...defaults.ctaBanner, ...config?.ctaBanner }

  const renderIcon = (name: string, className = "w-6 h-6") => {
    const Component = IconMap[name] || HelpCircle
    return <Component className={className} />
  }

  return (
    <div className="bg-[#FAFBF9] text-[#1F2937] font-sans antialiased min-h-screen">
      {/* 1. Header / Navbar */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-white/95 backdrop-blur-md border-b border-gray-100 z-50 px-4 md:px-8 flex justify-between items-center shadow-xs">
        <div className="max-w-[1280px] w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
              S
            </div>
            <div>
              <span className="font-extrabold text-slate-950 block text-base leading-tight font-sora">Saloka.id</span>
              <span className="text-[9px] text-gray-500 font-semibold block">Support Local, Empowering Community</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={onViewDashboard}
              className="px-4 py-2 border border-gray-200 hover:border-emerald-600 text-gray-700 hover:text-emerald-700 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer font-sora"
            >
              Lihat Komunitas
            </button>
            <button 
              onClick={onJoin}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer font-sora"
            >
              Menjadi Anggota
            </button>
          </div>
        </div>
      </header>

      {/* Hero Margin offset */}
      <div className="h-20" />

      {/* 2. Hero Section */}
      <section className="py-12 md:py-20 px-4 md:px-8 max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left column info */}
        <div className="space-y-6">
          <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-800 font-extrabold text-[10px] uppercase tracking-wider rounded-lg border border-emerald-200/50 shadow-2xs font-sora">
            {hero.badge || (isKoperasi ? 'KOPERASI PRO' : 'KOMUNITAS UMKM')}
          </span>
          <h1 className="text-4xl md:text-5xl font-black font-sora tracking-tight text-slate-900 leading-tight">
            {hero.title || community?.name}
          </h1>
          <h3 className="text-lg md:text-xl font-bold text-emerald-800 leading-relaxed font-sora">
            {hero.subtitle || community?.slogan || 'Sinergi Bersama untuk Kesejahteraan'}
          </h3>
          <p className="text-sm md:text-base text-gray-600 max-w-xl leading-relaxed">
            {hero.description || community?.description || 'Wadah kolaborasi pelaku usaha untuk tumbuh dan berkembang bersama.'}
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <button 
              onClick={onJoin}
              className="px-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer font-sora"
            >
              <Users className="w-5 h-5" /> {isKoperasi ? 'Menjadi Anggota' : 'Gabung Komunitas'}
            </button>
            <button 
              onClick={onViewDashboard}
              className="px-6 py-3.5 bg-white border border-gray-200 hover:border-emerald-600 text-gray-700 hover:text-emerald-700 font-extrabold text-sm rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer font-sora"
            >
              <Play className="w-4 h-4 text-emerald-600 fill-emerald-600" /> Lihat Dashboard
            </button>
          </div>

          {/* Metadata bar */}
          <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <div>
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Didirikan</span>
                <span className="text-xs font-bold text-gray-800 block">{hero.didirikan}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" />
              <div>
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Ketua</span>
                <span className="text-xs font-bold text-gray-800 block line-clamp-1">{hero.ketua}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" />
              <div>
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Lokasi</span>
                <span className="text-xs font-bold text-gray-800 block line-clamp-1">{hero.lokasi}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <div>
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Anggota</span>
                <span className="text-xs font-bold text-gray-800 block">{hero.anggotaCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column layout with quote */}
        <div className="relative justify-self-center lg:justify-self-end w-full max-w-[500px]">
          <div className="relative rounded-[32px] overflow-hidden shadow-xl border border-gray-100/50 bg-white">
            <img 
              src={hero.coverUrl}
              alt="Community Banner" 
              className="w-full aspect-[4/3] object-cover"
            />
            {/* Soft gradient bottom layer */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          </div>

          {/* Overlapping Quote Box */}
          <div className="absolute -bottom-8 -left-4 md:-left-8 max-w-[320px] p-5 bg-white border border-gray-100 rounded-3xl shadow-xl space-y-2">
            <span className="text-emerald-700 text-4xl font-serif leading-none block h-4">“</span>
            <p className="text-xs font-extrabold text-gray-800 leading-relaxed font-sora">
              {hero.quoteText}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <div className="w-4 h-0.5 bg-emerald-500" />
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                {hero.quoteAuthor}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Advantages Section ("Keuntungan Menjadi Anggota") */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8 space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl md:text-3xl font-black font-sora text-slate-900 tracking-tight">
              Keuntungan Menjadi Anggota
            </h2>
            <p className="text-xs md:text-sm text-gray-500 font-semibold uppercase tracking-wider">
              Mari berkolaborasi dan nikmati akses fasilitas terbaik bersama kami
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {benefits.map((b: any, idx: number) => (
              <div key={idx} className="p-6 bg-[#F9FAF8] border border-gray-100 rounded-2xl text-center space-y-4 hover:border-emerald-500/30 hover:shadow-xs transition-all flex flex-col justify-between items-center">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center">
                  {renderIcon(b.icon || 'Users', 'w-6 h-6')}
                </div>
                <div className="space-y-2 flex-grow flex flex-col justify-center">
                  <h4 className="font-extrabold text-gray-900 text-xs font-sora">{b.title}</h4>
                  <p className="text-[11px] text-gray-500 font-medium leading-relaxed">{b.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Statistics row */}
      <section className="py-12 px-4 md:px-8 max-w-[1280px] mx-auto">
        <div className="p-6 md:p-8 bg-emerald-50/40 border border-emerald-100 rounded-3xl grid grid-cols-2 lg:grid-cols-4 gap-6 items-center shadow-2xs">
          {stats.map((s: any, idx: number) => (
            <div key={idx} className="flex items-center gap-4 p-2">
              <div className="w-12 h-12 rounded-2xl bg-white border border-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-3xs">
                {renderIcon(s.icon || 'Users', 'w-6 h-6')}
              </div>
              <div>
                <span className="text-xl md:text-2xl font-black text-slate-900 block font-sora leading-tight">{s.value}</span>
                <span className="text-xs font-extrabold text-emerald-950 block leading-tight mt-0.5">{s.label}</span>
                <span className="text-[10px] text-emerald-800/80 font-semibold block mt-0.5 leading-none">{s.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Recent Activities Section ("Kegiatan Terbaru") */}
      <section className="py-16 bg-[#F9FAF8] border-t border-gray-100">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8 space-y-12">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <h2 className="text-2xl md:text-3xl font-black font-sora text-slate-900 tracking-tight">
                Kegiatan Terbaru
              </h2>
              <p className="text-xs text-gray-500 font-medium">Program kerja, agenda, dan aktivitas terkini dari kami</p>
            </div>
            <button 
              onClick={onViewDashboard}
              className="text-xs font-extrabold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer font-sora"
            >
              Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map((act: any, idx: number) => (
              <div key={idx} className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-2xs hover:border-emerald-500/20 hover:shadow-xs transition-all flex flex-col justify-between">
                <div>
                  <div className="h-48 overflow-hidden bg-gray-100 relative">
                    <img 
                      src={act.imageUrl} 
                      alt={act.title} 
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-3 left-3 px-2 py-0.5 bg-emerald-700 text-white font-extrabold text-[9px] rounded-md uppercase tracking-wider shadow-sm font-sora">
                      {act.category}
                    </span>
                  </div>
                  <div className="p-5 space-y-2">
                    <h4 className="text-sm font-extrabold text-gray-900 line-clamp-2 leading-relaxed font-sora">
                      {act.title}
                    </h4>
                  </div>
                </div>
                <div className="p-5 pt-0 text-[10px] text-gray-400 font-semibold border-t border-gray-50 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span>{act.dateLocation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Bottom Banner CTA */}
      <section className="py-12 px-4 md:px-8 max-w-[1280px] mx-auto">
        <div className="p-8 md:p-12 bg-emerald-800 text-white rounded-[32px] flex flex-col lg:flex-row items-center justify-between gap-8 shadow-md">
          <div className="space-y-3 text-center lg:text-left max-w-xl">
            <h3 className="text-xl md:text-2xl font-black font-sora leading-snug">
              {ctaBanner.text}
            </h3>
          </div>
          <button 
            onClick={onJoin}
            className="px-6 py-4 bg-white hover:bg-emerald-50 text-emerald-800 font-extrabold text-sm rounded-xl shadow-md transition-all shrink-0 cursor-pointer font-sora flex items-center gap-1.5"
          >
            {ctaBanner.buttonText} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="py-16 bg-slate-900 text-slate-400 border-t border-slate-800 px-4 md:px-8">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-sm shadow-sm">S</div>
              <span className="font-extrabold text-base font-sora">Saloka.id</span>
            </div>
            <p className="text-xs leading-relaxed max-w-xs">
              Platform digital untuk mendukung UMKM, komunitas, dan koperasi agar tumbuh bersama dan berdampak lebih luas.
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="text-white font-extrabold text-xs uppercase tracking-wider font-sora">Platform</h4>
            <ul className="text-xs space-y-2">
              <li><a href="#" className="hover:text-white transition-colors">Marketplace</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Affiliate Hub</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="text-white font-extrabold text-xs uppercase tracking-wider font-sora">Perusahaan</h4>
            <ul className="text-xs space-y-2">
              <li><a href="#" className="hover:text-white transition-colors">Tentang Kami</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Karir</a></li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="text-white font-extrabold text-xs uppercase tracking-wider font-sora">Bantuan</h4>
            <ul className="text-xs space-y-2">
              <li><a href="#" className="hover:text-white transition-colors">Pusat Bantuan</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Syarat & Ketentuan</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Kebijakan Privasi</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-[1280px] mx-auto mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <span>&copy; 2026 Saloka.id. All rights reserved.</span>
          <div className="flex gap-4">
            <span className="hover:text-white cursor-pointer">Instagram</span>
            <span className="hover:text-white cursor-pointer">Facebook</span>
            <span className="hover:text-white cursor-pointer">YouTube</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
```

- [ ] **Step 2: Commit files**

```bash
git add src/app/community/[id]/LandingPageView.tsx
git commit -m "feat: add community landing page view component"
```

---

### Task 2: Create LandingPageEditor Component

**Files:**
- Create: `src/app/community/[id]/LandingPageEditor.tsx`

**Interfaces:**
- Consumes: Initial configuration object `config`, callback `onSave(newConfig: any)` to store content.
- Produces: Expandable/accordion configurations forms, image upload controllers.

- [ ] **Step 1: Write the LandingPageEditor.tsx file**
  Implement form rendering inside settings with fields mapped for editing the Hero quote, Stats row, Benefits grid, and activities. Support image uploads.

```tsx
import React, { useState } from 'react'
import { Plus, Trash2, Upload, Loader2, Sparkles, AlertCircle } from 'lucide-react'
import { goeyToast } from 'goey-toast'

interface LandingPageEditorProps {
  community: any
  config: any
  onSave: (updatedConfig: any) => Promise<void>
}

export const LandingPageEditor: React.FC<LandingPageEditorProps> = ({
  community,
  config,
  onSave
}) => {
  const isKoperasi = (community?.type || '').toLowerCase() === 'koperasi' || (community?.category || '').toLowerCase() === 'koperasi'
  
  // Local form states
  const [heroBadge, setHeroBadge] = useState(config?.hero?.badge || (isKoperasi ? 'KOPERASI PRO' : 'KOMUNITAS UMKM'))
  const [heroTitle, setHeroTitle] = useState(config?.hero?.title || community?.name || '')
  const [heroSubtitle, setHeroSubtitle] = useState(config?.hero?.subtitle || '')
  const [heroDescription, setHeroDescription] = useState(config?.hero?.description || '')
  const [heroCoverUrl, setHeroCoverUrl] = useState(config?.hero?.coverUrl || '')
  const [heroQuoteText, setHeroQuoteText] = useState(config?.hero?.quoteText || '')
  const [heroQuoteAuthor, setHeroQuoteAuthor] = useState(config?.hero?.quoteAuthor || '')
  const [heroDidirikan, setHeroDidirikan] = useState(config?.hero?.didirikan || '12 Mei 2020')
  const [heroKetua, setHeroKetua] = useState(config?.hero?.ketua || '')
  const [heroLokasi, setHeroLokasi] = useState(config?.hero?.lokasi || '')
  const [heroAnggotaCount, setHeroAnggotaCount] = useState(config?.hero?.anggotaCount || '')

  // Advantages (exactly 5 items)
  const defaultBenefits = [
    { title: 'Jaringan Luas', description: 'Terhubung dengan ratusan UMKM.', icon: 'Users' },
    { title: 'Akses Permodalan', description: 'Pembiayaan mudah dengan syarat ringan.', icon: 'Wallet' },
    { title: 'Edukasi & Pelatihan', description: 'Webinar dan mentoring eksklusif.', icon: 'GraduationCap' },
    { title: 'Produk & Layanan', description: 'Nikmati produk koperasi harga khusus.', icon: 'Building2' },
    { title: 'Bagi Hasil (SHU)', description: 'Raih keuntungan dari partisipasi aktif.', icon: 'PieChart' }
  ]
  const [benefits, setBenefits] = useState<any[]>(
    config?.benefits?.length === 5 ? config.benefits : defaultBenefits
  )

  // Stats (exactly 4 items)
  const defaultStats = [
    { value: '788+', label: 'Anggota Aktif', desc: 'Bergabung bersama kami', icon: 'Users' },
    { value: '120+', label: 'UMKM Bergabung', desc: 'Bersama tumbuh dan berdaya', icon: 'Building2' },
    { value: 'Rp 1,2 M+', label: 'Transaksi Anggota', desc: 'Total transaksi', icon: 'Coins' },
    { value: '50+', label: 'Kegiatan & Event', desc: 'Webinar & bisnis', icon: 'Calendar' }
  ]
  const [stats, setStats] = useState<any[]>(
    config?.stats?.length === 4 ? config.stats : defaultStats
  )

  // Activities (exactly 3 items)
  const defaultActivities = [
    { title: 'Strategi Pemasaran UMKM', category: 'WEBINAR', dateLocation: '18 Mei 2024 • Online', imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400' },
    { title: 'Pelatihan Keuangan', category: 'PELATIHAN', dateLocation: '25 Mei 2024 • Bandung', imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400' },
    { title: 'Business Matching', category: 'NETWORKING', dateLocation: '1 Juni 2024 • Bandung', imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=400' }
  ]
  const [activities, setActivities] = useState<any[]>(
    config?.activities?.length === 3 ? config.activities : defaultActivities
  )

  // CTA Banner
  const [ctaText, setCtaText] = useState(config?.ctaBanner?.text || 'Bergabung sekarang dan jadilah bagian dari ekosistem bisnis.')
  const [ctaButtonText, setCtaButtonText] = useState(config?.ctaBanner?.buttonText || 'Menjadi Anggota Sekarang')

  const [saving, setSaving] = useState(false)
  const [uploadingHero, setUploadingHero] = useState(false)
  const [uploadingActivity, setUploadingActivity] = useState<number | null>(null)

  const handleUploadImage = async (file: File, type: 'hero' | { activityIdx: number }) => {
    const isHero = type === 'hero'
    const setUploading = isHero ? setUploadingHero : (val: boolean) => setUploadingActivity(val ? type.activityIdx : null)
    
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'community-landing')
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd
      })
      if (!res.ok) throw new Error('Gagal mengunggah gambar.')
      const data = await res.json()
      
      if (isHero) {
        setHeroCoverUrl(data.url)
      } else {
        const updated = [...activities]
        updated[type.activityIdx].imageUrl = data.url
        setActivities(updated)
      }
      goeyToast.success('Gambar berhasil diunggah!')
    } catch (e: any) {
      goeyToast.error(e.message || 'Gagal mengunggah.')
    } finally {
      setUploading(false)
    }
  }

  const handleBenefitChange = (index: number, key: string, value: string) => {
    const updated = [...benefits]
    updated[index][key] = value
    setBenefits(updated)
  }

  const handleStatChange = (index: number, key: string, value: string) => {
    const updated = [...stats]
    updated[index][key] = value
    setStats(updated)
  }

  const handleActivityChange = (index: number, key: string, value: string) => {
    const updated = [...activities]
    updated[index][key] = value
    setActivities(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    const newConfig = {
      hero: {
        badge: heroBadge,
        title: heroTitle,
        subtitle: heroSubtitle,
        description: heroDescription,
        coverUrl: heroCoverUrl,
        quoteText: heroQuoteText,
        quoteAuthor: heroQuoteAuthor,
        didirikan: heroDidirikan,
        ketua: heroKetua,
        lokasi: heroLokasi,
        anggotaCount: heroAnggotaCount
      },
      benefits,
      stats,
      activities,
      ctaBanner: {
        text: ctaText,
        buttonText: ctaButtonText
      }
    }

    try {
      await onSave(newConfig)
      goeyToast.success('Landing page berhasil diperbarui!')
    } catch (e) {
      goeyToast.error('Gagal memperbarui konfigurasi landing page.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 border border-gray-200/80 rounded-2xl shadow-xs text-xs font-medium text-slate-700">
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-sm font-extrabold text-slate-900 font-sora">Desain & Tampilan Landing Page</h3>
        <p className="text-[10px] text-gray-400 mt-1">Konfigurasi visual landing page publik yang dapat dilihat oleh pengunjung sebelum bergabung.</p>
      </div>

      {/* 1. Hero Section Fields */}
      <div className="space-y-4">
        <h4 className="font-extrabold text-[#0F5132] uppercase tracking-wider border-l-4 border-emerald-600 pl-2">1. Bagian Hero & Identitas Utama</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-bold">Badge Hero</label>
            <input type="text" value={heroBadge} onChange={e => setHeroBadge(e.target.value)} className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:border-[#2DB24A] outline-none" required />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-bold">Nama Komunitas (Judul)</label>
            <input type="text" value={heroTitle} onChange={e => setHeroTitle(e.target.value)} className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:border-[#2DB24A] outline-none" required />
          </div>
          <div className="col-span-full">
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-bold">Sub-Slogan (Slogan Tebal)</label>
            <input type="text" value={heroSubtitle} onChange={e => setHeroSubtitle(e.target.value)} className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:border-[#2DB24A] outline-none" required />
          </div>
          <div className="col-span-full">
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-bold">Deskripsi Hero</label>
            <textarea value={heroDescription} onChange={e => setHeroDescription(e.target.value)} rows={3} className="w-full px-3.5 py-2 border border-gray-200 rounded-xl focus:border-[#2DB24A] outline-none" required />
          </div>
          <div className="col-span-full">
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-bold">Foto Utama Landing Page (Collage Cover)</label>
            <div className="flex gap-4 items-center">
              <input type="text" value={heroCoverUrl} onChange={e => setHeroCoverUrl(e.target.value)} placeholder="https://..." className="flex-1 px-3.5 py-2 border border-gray-200 rounded-xl focus:border-[#2DB24A] outline-none" />
              <label className="px-4 py-2 bg-slate-50 border border-gray-200 hover:bg-slate-100 rounded-xl cursor-pointer flex items-center gap-1.5 font-bold transition-all shadow-3xs shrink-0">
                {uploadingHero ? <Loader2 className="w-4 h-4 animate-spin text-emerald-700" /> : <Upload className="w-4 h-4 text-gray-500" />}
                Unggah Foto
                <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUploadImage(e.target.files[0], 'hero')} />
              </label>
            </div>
          </div>
        </div>

        {/* Hero Metadata */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-bold">Didirikan</label>
            <input type="text" value={heroDidirikan} onChange={e => setHeroDidirikan(e.target.value)} className="w-full px-3.5 py-2 border border-gray-200 rounded-xl outline-none" required />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-bold">Ketua</label>
            <input type="text" value={heroKetua} onChange={e => setHeroKetua(e.target.value)} className="w-full px-3.5 py-2 border border-gray-200 rounded-xl outline-none" required />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-bold">Lokasi</label>
            <input type="text" value={heroLokasi} onChange={e => setHeroLokasi(e.target.value)} className="w-full px-3.5 py-2 border border-gray-200 rounded-xl outline-none" required />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-bold">Stat Anggota</label>
            <input type="text" value={heroAnggotaCount} onChange={e => setHeroAnggotaCount(e.target.value)} className="w-full px-3.5 py-2 border border-gray-200 rounded-xl outline-none" required />
          </div>
        </div>

        {/* Hero Quote details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="md:col-span-2">
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-bold">Kata Kutipan (Quote Card)</label>
            <input type="text" value={heroQuoteText} onChange={e => setHeroQuoteText(e.target.value)} className="w-full px-3.5 py-2 border border-gray-200 rounded-xl outline-none" required />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-bold">Penulis Kutipan (Quote Author)</label>
            <input type="text" value={heroQuoteAuthor} onChange={e => setHeroQuoteAuthor(e.target.value)} className="w-full px-3.5 py-2 border border-gray-200 rounded-xl outline-none" required />
          </div>
        </div>
      </div>

      {/* 2. Benefits Fields */}
      <div className="space-y-4 pt-4 border-t border-gray-100">
        <h4 className="font-extrabold text-[#0F5132] uppercase tracking-wider border-l-4 border-emerald-600 pl-2">2. Keuntungan Menjadi Anggota (5 Item Grid)</h4>
        <div className="space-y-3">
          {benefits.map((b, idx) => (
            <div key={idx} className="flex gap-4 items-center bg-gray-50/50 p-4 border border-gray-200/50 rounded-2xl">
              <span className="font-extrabold text-sm text-emerald-800 font-sora">#{idx + 1}</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
                <div>
                  <label className="block text-[9px] text-gray-400 font-bold mb-0.5">Judul Keuntungan</label>
                  <input type="text" value={b.title} onChange={e => handleBenefitChange(idx, 'title', e.target.value)} className="w-full px-3 py-1.5 border border-gray-200 rounded-xl bg-white outline-none" required />
                </div>
                <div>
                  <label className="block text-[9px] text-gray-400 font-bold mb-0.5">Deskripsi Singkat</label>
                  <input type="text" value={b.description} onChange={e => handleBenefitChange(idx, 'description', e.target.value)} className="w-full px-3 py-1.5 border border-gray-200 rounded-xl bg-white outline-none" required />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Statistics Fields */}
      <div className="space-y-4 pt-4 border-t border-gray-100">
        <h4 className="font-extrabold text-[#0F5132] uppercase tracking-wider border-l-4 border-emerald-600 pl-2">3. Data Statistik (4 Item Metric)</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {stats.map((s, idx) => (
            <div key={idx} className="bg-gray-50/50 p-4 border border-gray-200/50 rounded-2xl space-y-3">
              <span className="font-black text-xs text-slate-800 font-sora block">Metrik #{idx + 1}</span>
              <div>
                <label className="block text-[9px] text-gray-400 font-bold mb-0.5">Nilai Utama (e.g. 788+ atau Rp 1,2 M+)</label>
                <input type="text" value={s.value} onChange={e => handleStatChange(idx, 'value', e.target.value)} className="w-full px-3 py-1.5 border border-gray-200 rounded-xl bg-white outline-none" required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] text-gray-400 font-bold mb-0.5">Label (e.g. Anggota Aktif)</label>
                  <input type="text" value={s.label} onChange={e => handleStatChange(idx, 'label', e.target.value)} className="w-full px-3 py-1.5 border border-gray-200 rounded-xl bg-white outline-none" required />
                </div>
                <div>
                  <label className="block text-[9px] text-gray-400 font-bold mb-0.5">Keterangan Kecil</label>
                  <input type="text" value={s.desc} onChange={e => handleStatChange(idx, 'desc', e.target.value)} className="w-full px-3 py-1.5 border border-gray-200 rounded-xl bg-white outline-none" required />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Activities Fields */}
      <div className="space-y-4 pt-4 border-t border-gray-100">
        <h4 className="font-extrabold text-[#0F5132] uppercase tracking-wider border-l-4 border-emerald-600 pl-2">4. Kegiatan Terbaru (3 Item)</h4>
        <div className="space-y-4">
          {activities.map((act, idx) => (
            <div key={idx} className="bg-gray-50/50 p-4 border border-gray-200/50 rounded-2xl space-y-3">
              <span className="font-black text-xs text-slate-800 font-sora block">Kegiatan #{idx + 1}</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-[9px] text-gray-400 font-bold mb-0.5">Judul Kegiatan</label>
                  <input type="text" value={act.title} onChange={e => handleActivityChange(idx, 'title', e.target.value)} className="w-full px-3 py-1.5 border border-gray-200 rounded-xl bg-white outline-none" required />
                </div>
                <div>
                  <label className="block text-[9px] text-gray-400 font-bold mb-0.5">Kategori (Badge)</label>
                  <input type="text" value={act.category} onChange={e => handleActivityChange(idx, 'category', e.target.value)} className="w-full px-3 py-1.5 border border-gray-200 rounded-xl bg-white outline-none" required />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] text-gray-400 font-bold mb-0.5">Tanggal & Lokasi (e.g. 18 Mei 2024 • Online)</label>
                  <input type="text" value={act.dateLocation} onChange={e => handleActivityChange(idx, 'dateLocation', e.target.value)} className="w-full px-3 py-1.5 border border-gray-200 rounded-xl bg-white outline-none" required />
                </div>
                <div>
                  <label className="block text-[9px] text-gray-400 font-bold mb-0.5">URL Gambar Kegiatan</label>
                  <div className="flex gap-2 items-center">
                    <input type="text" value={act.imageUrl} onChange={e => handleActivityChange(idx, 'imageUrl', e.target.value)} placeholder="https://..." className="flex-1 px-3 py-1.5 border border-gray-200 rounded-xl bg-white outline-none" required />
                    <label className="px-3 py-1.5 bg-slate-50 border border-gray-200 hover:bg-slate-100 rounded-xl cursor-pointer flex items-center gap-1 font-bold transition-all shrink-0">
                      {uploadingActivity === idx ? <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" /> : <Upload className="w-3.5 h-3.5 text-gray-500" />}
                      Unggah
                      <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUploadImage(e.target.files[0], { activityIdx: idx })} />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. CTA Banner Fields */}
      <div className="space-y-4 pt-4 border-t border-gray-100">
        <h4 className="font-extrabold text-[#0F5132] uppercase tracking-wider border-l-4 border-emerald-600 pl-2">5. Banner Promosi Bawah</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-bold">Teks Ajakan Promosi</label>
            <input type="text" value={ctaText} onChange={e => setCtaText(e.target.value)} className="w-full px-3.5 py-2 border border-gray-200 rounded-xl outline-none" required />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1 font-bold">Label Tombol</label>
            <input type="text" value={ctaButtonText} onChange={e => setCtaButtonText(e.target.value)} className="w-full px-3.5 py-2 border border-gray-200 rounded-xl outline-none" required />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-6 border-t border-gray-100 flex justify-end">
        <button type="submit" disabled={saving} className="px-6 py-3 bg-[#2DB24A] hover:bg-[#0F5132] disabled:bg-emerald-300 text-white font-extrabold rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center gap-2 font-sora">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {saving ? 'Menyimpan...' : 'Perbarui Landing Page'}
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Commit files**

```bash
git add src/app/community/[id]/LandingPageEditor.tsx
git commit -m "feat: add community landing page editor component"
```

---

### Task 3: Integrate View and Settings inside page.tsx

**Files:**
- Modify: `src/app/community/[id]/page.tsx`

- [ ] **Step 1: Edit page.tsx**
  Modify `src/app/community/[id]/page.tsx` to handle the `viewMode` state toggle, conditionally render `LandingPageView`, and integrate `LandingPageEditor` in the Settings ("Pengaturan") dashboard tab.

Let's locate where the page returns the JSX in `src/app/community/[id]/page.tsx`.
Around line 1224:
```tsx
  return (
    <div className="min-h-screen bg-[#F5F7F9] text-[#111827] pt-24 pb-20 px-3 md:px-8 font-sans">
      <div className="max-w-[1280px] mx-auto space-y-6">
```
We will modify this to:
```tsx
  // Render Landing Page as the default view
  if (viewMode === 'landing') {
    let parsedConfig = {}
    if (community?.landingPageConfig) {
      try {
        parsedConfig = JSON.parse(community.landingPageConfig)
      } catch (_) {}
    }
    return (
      <LandingPageView 
        community={community}
        config={parsedConfig}
        onJoin={handleJoin}
        onViewDashboard={() => setViewMode('dashboard')}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F7F9] text-[#111827] pt-24 pb-20 px-3 md:px-8 font-sans">
      {/* Existing dashboard sidebar/tabs code... */}
```
And inside the Settings ("Pengaturan") tab layout (which we can view in the file), we'll add the editor.
Wait, let's search for "Pengaturan" tab content inside `src/app/community/[id]/page.tsx` to know exactly where to render `LandingPageEditor`.

- [ ] **Step 2: Save and verify compilation**
  Run: `npm run build`
  Verify there are no TypeScript compile errors in Next.js build.

- [ ] **Step 3: Commit integration**
```bash
git add src/app/community/[id]/page.tsx
git commit -m "feat: integrate landing page view and editor inside community page"
```
