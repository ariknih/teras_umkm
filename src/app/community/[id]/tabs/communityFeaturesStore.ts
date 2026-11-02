'use client'

export interface BusinessMatchingItem {
  id: string
  title: string
  category: string
  location: string
  description: string
  roleType: 'Produsen' | 'Supplier' | 'Distributor' | 'Reseller' | 'Investor'
  imageUrl: string
  contactPhone?: string
  contactEmail?: string
  minOrder?: string
  isBookmarked?: boolean
  createdAt: string
  isCustom?: boolean
}

export interface KolaborasiItem {
  id: string
  title: string
  category: string
  location: string
  description: string
  type: 'Pengembangan Produk' | 'Pemasaran' | 'Distribusi'
  status: 'Buka' | 'Sedang Berjalan' | 'Selesai'
  imageUrl: string
  likesCount: number
  commentsCount: number
  isBookmarked?: boolean
  initiatorName?: string
  contactPhone?: string
  createdAt: string
  isCustom?: boolean
}

export interface MentorItem {
  id: string
  name: string
  roleHeadline: string
  rating: number
  sessionsCount: number
  tags: string[]
  category: string
  avatarUrl: string
  bio: string
  hourlyRate?: string
  contactPhone?: string
  isBookmarked?: boolean
  createdAt: string
  isCustom?: boolean
}

export interface KompetisiItem {
  id: string
  title: string
  scale: string
  deadline: string
  prizeAmount: string
  status: 'Pendaftaran Dibuka' | 'Akan Datang' | 'Selesai'
  imageUrl: string
  organizer?: string
  description: string
  requirements?: string[]
  isBookmarked?: boolean
  createdAt: string
  isCustom?: boolean
}

export interface SupplierItem {
  id: string
  title: string
  category: string
  location: string
  description: string
  images: string[]
  tags: string[]
  contactPhone?: string
  moq?: string
  isBookmarked?: boolean
  createdAt: string
  isCustom?: boolean
}

// ── DEFAULT SEED DATA (MATCHING MOCKUP PRECISELY) ──────────────────────────

export const INITIAL_BUSINESS_MATCHING: BusinessMatchingItem[] = [
  {
    id: 'bm-1',
    title: 'Kopi Nusantara',
    category: 'Food & Beverage',
    location: 'Bandung, Jawa Barat',
    description: 'Produsen kopi bubuk dan biji kopi premium dengan sistem kemitraan grosir dan keagenan luas.',
    roleType: 'Produsen',
    imageUrl: 'https://images.unsplash.com/photo-1509785307050-d4066910ec1e?auto=format&fit=crop&w=400&q=80',
    contactPhone: '6281234567890',
    contactEmail: 'mitra@kopinusantara.id',
    minOrder: '10 Kg',
    isBookmarked: false,
    createdAt: '2026-10-15'
  },
  {
    id: 'bm-2',
    title: 'Tani Makmur',
    category: 'Pertanian',
    location: 'Malang, Jawa Timur',
    description: 'Supplier hasil pertanian segar berkualitas tinggi untuk UMKM kuliner, restoran, dan industri F&B.',
    roleType: 'Supplier',
    imageUrl: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=400&q=80',
    contactPhone: '6281298765432',
    contactEmail: 'halo@tanimakmur.id',
    minOrder: '50 Kg',
    isBookmarked: false,
    createdAt: '2026-10-18'
  },
  {
    id: 'bm-3',
    title: 'Batik Kreasi Jaya',
    category: 'Fashion & Tekstil',
    location: 'Solo, Jawa Tengah',
    description: 'Produsen batik cap dan tulis kontemporer membuka peluang reseller dan distributor antar pulau.',
    roleType: 'Distributor',
    imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=400&q=80',
    contactPhone: '6281311223344',
    contactEmail: 'kerjasama@batikkreasi.com',
    minOrder: '20 Pcs',
    isBookmarked: false,
    createdAt: '2026-10-20'
  }
]

export const INITIAL_KOLABORASI: KolaborasiItem[] = [
  {
    id: 'kol-1',
    title: 'Pengembangan Kemasan Produk UMKM',
    category: 'Desain Produk',
    location: 'Yogyakarta, DIY',
    description: 'Mencari partner desainer packaging dan percetakan kemasan food-grade untuk efisiensi biaya cetak massal.',
    type: 'Pengembangan Produk',
    status: 'Buka',
    imageUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=400&q=80',
    likesCount: 5,
    commentsCount: 0,
    isBookmarked: false,
    initiatorName: 'Rudi Hartono (Owner Snack Mantap)',
    contactPhone: '6281223344556',
    createdAt: '2026-10-20'
  },
  {
    id: 'kol-2',
    title: 'Kerja Sama Distribusi di Retail Modern',
    category: 'Distribusi',
    location: 'Jakarta, DKI Jakarta',
    description: 'Mencari partner konsolidasi produk makanan ringan lokal untuk kurasi bersama masuk ke jaringan ritel minimarket modern.',
    type: 'Distribusi',
    status: 'Buka',
    imageUrl: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=400&q=80',
    likesCount: 5,
    commentsCount: 1,
    isBookmarked: false,
    initiatorName: 'Dewi Sartika (UMKM Bersatu)',
    contactPhone: '6281556677889',
    createdAt: '2026-10-22'
  },
  {
    id: 'kol-3',
    title: 'Kargo Bersama Logistik Jawa - Bali',
    category: 'Pemasaran',
    location: 'Surabaya, Jawa Timur',
    description: 'Patungan armada truk logistik pendingin (chiller) untuk pengiriman produk frozen food ke distributor Bali.',
    type: 'Pemasaran',
    status: 'Buka',
    imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80',
    likesCount: 8,
    commentsCount: 3,
    isBookmarked: false,
    initiatorName: 'Koperasi Kuliner Mandiri',
    contactPhone: '6281998877665',
    createdAt: '2026-10-23'
  }
]

export const INITIAL_MENTOR: MentorItem[] = [
  {
    id: 'mnt-1',
    name: 'Andi Pratama',
    roleHeadline: 'Digital Marketing & Ads Specialist',
    rating: 4.8,
    sessionsCount: 120,
    tags: ['Digital Marketing', 'E-commerce', 'Meta Ads'],
    category: 'Pemasaran',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    bio: 'Praktisi digital performance marketing selama 8+ tahun. Berhasil membantu lebih dari 150 brand UMKM bertumbuh melalui funnel iklan terarah dan optimasi marketplace.',
    hourlyRate: 'Gratis untuk Anggota',
    contactPhone: '6281122334455',
    isBookmarked: false,
    createdAt: '2026-10-10'
  },
  {
    id: 'mnt-2',
    name: 'Siti Lestari',
    roleHeadline: 'Manajemen Usaha & Tata Kelola Keuangan',
    rating: 4.9,
    sessionsCount: 95,
    tags: ['Manajemen', 'Keuangan', 'Perpajakan'],
    category: 'Keuangan',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    bio: 'Konsultan keuangan UMKM bersertifikat. Fokus pada pemisahan keuangan pribadi & usaha, pembukuan digital, dan persiapan pengajuan pendanaan usaha.',
    hourlyRate: 'Gratis untuk Anggota',
    contactPhone: '6281234567800',
    isBookmarked: false,
    createdAt: '2026-10-12'
  },
  {
    id: 'mnt-3',
    name: 'Budi Santoso',
    roleHeadline: 'Legalitas Usaha & Sertifikasi Halal',
    rating: 4.9,
    sessionsCount: 84,
    tags: ['NIB', 'Halal', 'BPOM', 'HAKI'],
    category: 'Legalitas',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    bio: 'Pendamping proses legalitas produk UMKM. Membantu pengurusan izin edar P-IRT, Sertifikasi Halal Kemenag, dan perlindungan merek HAKI.',
    hourlyRate: 'Gratis untuk Anggota',
    contactPhone: '6281399887766',
    isBookmarked: false,
    createdAt: '2026-10-14'
  }
]

export const INITIAL_KOMPETISI: KompetisiItem[] = [
  {
    id: 'kmp-1',
    title: 'Lomba Inovasi Produk UMKM 2026',
    scale: 'Nasional',
    deadline: '15 Nov 2026',
    prizeAmount: 'Rp 100.000.000',
    status: 'Pendaftaran Dibuka',
    imageUrl: 'https://images.unsplash.com/photo-1578269174936-2709b6aeb913?auto=format&fit=crop&w=400&q=80',
    organizer: 'Kementerian Koperasi & Saloka Foundation',
    description: 'Kompetisi karya inovasi produk olahan lokal Indonesia dengan nilai tambah ekonomi dan potensi ekspor yang tinggi.',
    requirements: [
      'Pelaku UMKM terdaftar di Saloka.id',
      'Memiliki izin legalitas minimal NIB',
      'Produk orisinal buatan dalam negeri',
      'Mengirimkan video pitching maksimal 3 menit'
    ],
    isBookmarked: false,
    createdAt: '2026-10-10'
  },
  {
    id: 'kmp-2',
    title: 'Kompetisi Digital Marketing UMKM',
    scale: 'Tingkat Nasional',
    deadline: '20 Nov 2026',
    prizeAmount: 'Rp 50.000.000',
    status: 'Pendaftaran Dibuka',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80',
    organizer: 'Saloka Digital Institute',
    description: 'Tantangan pemasaran digital: adu strategi konten kreatif, peningkatan engagement media sosial, dan konversi penjualan.',
    requirements: [
      'Memiliki akun media sosial aktif (Instagram/TikTok)',
      'Memiliki etalase toko digital di Saloka Market',
      'Portofolio kampanye pemasaran 3 bulan terakhir'
    ],
    isBookmarked: false,
    createdAt: '2026-10-12'
  },
  {
    id: 'kmp-3',
    title: 'UMKM Go Global Challenge',
    scale: 'Ekspor',
    deadline: '10 Des 2026',
    prizeAmount: 'Rp 200.000.000',
    status: 'Pendaftaran Dibuka',
    imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80',
    organizer: 'Asosiasi Eksportir UMKM Nusantara',
    description: 'Program akselerasi dan pendanaan ekspansi ekspor untuk produk kerajinan, rempah, dan busana muslim siap pasar internasional.',
    requirements: [
      'Kapasitas produksi minimal 1.000 pcs per bulan',
      'Kemasan telah memenuhi standar internasional',
      'Lolos kurasi tim ahli kurator Saloka'
    ],
    isBookmarked: false,
    createdAt: '2026-10-15'
  }
]

export const INITIAL_SUPPLIER: SupplierItem[] = [
  {
    id: 'spl-1',
    title: 'PT Sumber Bahan Pangan',
    category: 'Bahan Baku Makanan',
    location: 'Sleman, DIY',
    description: 'Produsen dan distributor beras premium, tepung terigu, dan gula pasir curah dengan harga grosir langsung dari pabrik.',
    images: [
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=300&q=80',
      'https://images.unsplash.com/photo-1627483262268-9c2b5b2834b5?auto=format&fit=crop&w=300&q=80'
    ],
    tags: ['Beras', 'Tepung', 'Gula'],
    moq: 'Min. 50 Kg',
    contactPhone: '6281234567891',
    isBookmarked: false,
    createdAt: '2026-10-12'
  },
  {
    id: 'spl-2',
    title: 'Toko Plastik Jaya',
    category: 'Kemasan',
    location: 'Surabaya, Jawa Timur',
    description: 'Pusat grosir kemasan botol plastik, standing pouch aluminium foil, dan paper box food-grade untuk aneka olahan UMKM.',
    images: [
      'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=300&q=80',
      'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=300&q=80'
    ],
    tags: ['Plastik', 'Paper Box', 'Standing Pouch'],
    moq: 'Min. 100 Pcs',
    contactPhone: '6281333444555',
    isBookmarked: false,
    createdAt: '2026-10-14'
  },
  {
    id: 'spl-3',
    title: 'Rempah Barokah Alam',
    category: 'Bumbu & Rempah',
    location: 'Semarang, Jawa Tengah',
    description: 'Supplier bubuk rempah murni (bawang putih bubuk, cabai giling kering, kunyit murni, lada hitam) tanpa bahan pengawet.',
    images: [
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=300&q=80',
      'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=300&q=80'
    ],
    tags: ['Rempah Bubuk', 'Bumbu Dapur', 'Herbal'],
    moq: 'Min. 5 Kg',
    contactPhone: '6281778899001',
    isBookmarked: false,
    createdAt: '2026-10-18'
  }
]

// ── LOCAL STORAGE HELPER ────────────────────────────────────────────────────

export function loadFeatureData<T>(communityId: string, featureKey: string, defaultData: T[]): T[] {
  if (typeof window === 'undefined') return defaultData
  try {
    const raw = localStorage.getItem(`saloka_comm_${communityId}_${featureKey}`)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch (_) {}
  return defaultData
}

export function saveFeatureData<T>(communityId: string, featureKey: string, data: T[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(`saloka_comm_${communityId}_${featureKey}`, JSON.stringify(data))
  } catch (_) {}
}
