import React from 'react'
import Image from 'next/image'
import {
  Users, Wallet, GraduationCap, Building2, Coins, Calendar, PieChart,
  MapPin, Shield, Star, HelpCircle, ArrowRight, Share2, ChevronRight, Award, Plus, Play, Sliders
} from 'lucide-react'

// Default Kopjaswara config (Koperasi)
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
  vision: 'Menjadi koperasi terdepan dalam memberdayakan pelaku UMKM melalui pemanfaatan teknologi digital, kolaborasi berkelanjutan, dan kemudahan akses finansial demi mewujudkan kemandirian ekonomi kerakyatan.',
  missions: [
    'Menyediakan platform teknologi digital yang mudah diakses guna mendukung percepatan usaha dan perluasan pasar anggota.',
    'Memfasilitasi pembiayaan usaha mikro secara fleksibel, amanah, dan dengan persyaratan yang memudahkan.',
    'Menyelenggarakan program pelatihan keterampilan bisnis, manajerial, dan keuangan secara berkala demi meningkatkan daya saing.'
  ],
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

// Default Perkumpulan config (Perkumpulan)
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
    ketua: 'Super Admin Saloka',
    lokasi: 'Kota Yogyakarta, DIY',
    anggotaCount: '1.248+ Anggota'
  },
  vision: 'Membangun ekosistem komunitas UMKM yang solid, adaptif, dan berdaya saing global untuk memajukan perekonomian lokal secara inklusif.',
  missions: [
    'Memperluas jejaring kemitraan strategis antar pelaku UMKM untuk meningkatkan kapasitas produksi dan distribusi.',
    'Menjadi wadah advokasi, berbagi pengalaman, dan pendampingan legalitas serta perizinan usaha bagi para anggota.',
    'Mengembangkan program promosi terintegrasi dan kolaboratif guna memperkuat brand lokal.'
  ],
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

// Default Business config
export const DEFAULT_BUSINESS_CONFIG = {
  hero: {
    badge: 'BISNIS & UMKM',
    title: 'Kemitraan Bisnis',
    subtitle: 'Kolaborasi • Inovasi • Sejahtera Bersama Komunitas Bisnis & UMKM',
    description: 'Wadah kolaborasi pelaku usaha untuk tumbuh dan berkembang bersama melalui sinergi, inovasi digital, dan jejaring pasar nasional.',
    coverUrl: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80',
    quoteText: 'Sinergi bisnis menciptakan peluang tanpa batas.',
    quoteAuthor: 'Komunitas Bisnis',
    didirikan: '1 Juni 2026',
    ketua: 'Pengurus Bisnis',
    lokasi: 'Jakarta, Indonesia',
    anggotaCount: '500+ Mitra'
  },
  vision: 'Menjadi akselerator pertumbuhan bisnis UMKM Indonesia melalui sinergi, inovasi digital, dan jejaring pasar nasional.',
  missions: [
    'Menyediakan program business matching bulanan antar pelaku usaha.',
    'Mentransformasikan proses bisnis tradisional anggota menuju era digital.',
    'Membuka jalur kemitraan dengan instansi pemerintah maupun swasta.'
  ],
  benefits: [
    { title: 'Business Matching', description: 'Temukan mitra bisnis strategis untuk ekspansi pasar.', icon: 'Users' },
    { title: 'Digitalisasi UMKM', description: 'Pendampingan transformasi digital operasional usaha.', icon: 'Building2' },
    { title: 'Akses Permodalan', description: 'Koneksi ke lembaga keuangan dan investor strategis.', icon: 'Wallet' },
    { title: 'Sharing Session', description: 'Belajar langsung dari pakar industri dan mentor bisnis.', icon: 'GraduationCap' },
    { title: 'Kemitraan Luas', description: 'Akses program kemitraan B2B skala nasional.', icon: 'Coins' }
  ],
  stats: [
    { value: '500+', label: 'Mitra Aktif', desc: 'Saling bersinergi', icon: 'Users' },
    { value: '120+', label: 'UMKM Go Digital', desc: 'Siap bersaing global', icon: 'Building2' },
    { value: '12+', label: 'Business Matching', desc: 'Event temu bisnis tahunan', icon: 'Calendar' },
    { value: '50+', label: 'Partner Strategis', desc: 'Instansi pendukung usaha', icon: 'Coins' }
  ],
  activities: [
    { title: 'Business Matching & Networking Summit', category: 'EVENT', dateLocation: '20 September 2026 • Jakarta', imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=400&q=80' },
    { title: 'Workshop Digital Marketing & SEO UMKM', category: 'PELATIHAN', dateLocation: '27 September 2026 • Online', imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=400&q=80' },
    { title: 'Sinergi B2B Expo & Investor Pitching', category: 'NETWORKING', dateLocation: '10 Oktober 2026 • Bandung', imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=400&q=80' }
  ],
  ctaBanner: {
    text: 'Sinergikan bisnismu sekarang dan temukan peluang tanpa batas bersama ratusan UMKM berprestasi!',
    buttonText: 'Ajukan Kolaborasi Sekarang'
  }
}

// Default Education config
export const DEFAULT_EDUCATION_CONFIG = {
  hero: {
    badge: 'PENDIDIKAN & AKADEMI',
    title: 'Akademi Bisnis',
    subtitle: 'Belajar Bisnis Sejak Dini, Wujudkan Ide Jadi Nyata',
    description: 'Mencetak wirausahawan masa depan yang kompeten, beretika, dan berwawasan teknologi melalui pendidikan bisnis praktis.',
    coverUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
    quoteText: 'Ilmu adalah modal terbaik untuk membangun masa depan usaha.',
    quoteAuthor: 'Akademi Bisnis',
    didirikan: '15 April 2026',
    ketua: 'Rektor Akademi',
    lokasi: 'Yogyakarta, Indonesia',
    anggotaCount: '3.000+ Siswa'
  },
  vision: 'Mencetak wirausahawan masa depan yang kompeten, beretika, dan berwawasan teknologi melalui pendidikan bisnis berkelanjutan.',
  missions: [
    'Menyelenggarakan kelas bisnis praktis dengan mentor berpengalaman.',
    'Menyediakan perpustakaan digital dan studi kasus bisnis riil.',
    'Membina inkubasi startup pelajar/mahasiswa hingga mandiri.'
  ],
  benefits: [
    { title: 'Mentoring Ahli', description: 'Bimbingan 1-on-1 dengan pelaku industri sukses.', icon: 'Users' },
    { title: 'Kurikulum Praktis', description: 'Materi belajar siap pakai tanpa teori rumit.', icon: 'GraduationCap' },
    { title: 'Inkubator Bisnis', description: 'Fasilitas pendampingan rintisan usaha baru.', icon: 'Building2' },
    { title: 'Jejaring Alumni', description: 'Relasi luas dengan alumni di berbagai bidang.', icon: 'Users' },
    { title: 'Sertifikasi Resmi', description: 'Bukti kompetensi kelulusan berstandar industri.', icon: 'Shield' }
  ],
  stats: [
    { value: '3.000+', label: 'Siswa & Alumni', desc: 'Belajar dan bertumbuh', icon: 'Users' },
    { value: '45+', label: 'Mentor Ahli', desc: 'Praktisi bisnis berpengalaman', icon: 'Building2' },
    { value: '80+', label: 'Kelas Berjalan', desc: 'Topik bisnis terlengkap', icon: 'Calendar' },
    { value: '15+', label: 'Startup Terinkubasi', desc: 'Siap meluncur ke pasar', icon: 'Coins' }
  ],
  activities: [
    { title: 'Pitching Day & Rintisan Usaha Baru', category: 'INKUBASI', dateLocation: '15 Oktober 2026 • Yogyakarta', imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=400&q=80' },
    { title: 'Basic Entrepreneurship Bootcamp', category: 'KELAS', dateLocation: '22 Oktober 2026 • Online', imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=400&q=80' },
    { title: 'Alumni Gathering & Mentor Sharing Session', category: 'NETWORKING', dateLocation: '5 November 2026 • Jogja', imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=400&q=80' }
  ],
  ctaBanner: {
    text: 'Tingkatkan skill dan wujudkan ide bisnismu sekarang bersama para mentor berpengalaman!',
    buttonText: 'Daftar Kelas Sekarang'
  }
}

// Default Culinary config
export const DEFAULT_CULINARY_CONFIG = {
  hero: {
    badge: 'KULINER & KATERING',
    title: 'Komunitas Kuliner',
    subtitle: 'Bersama Memajukan Industri Kuliner Kreatif',
    description: 'Membangun ekosistem kuliner kreatif yang mandiri, berdaya saing tinggi, dan menyajikan rasa Nusantara terbaik.',
    coverUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    quoteText: 'Rasa terbaik lahir dari kolaborasi bahan pilihan dan sinergi pelaku usaha.',
    quoteAuthor: 'Komunitas Kuliner',
    didirikan: '10 Maret 2026',
    ketua: 'Pengurus Kuliner',
    lokasi: 'Bandung, Indonesia',
    anggotaCount: '1.200+ Chef'
  },
  vision: 'Membangun ekosistem kuliner kreatif yang mandiri, berdaya saing tinggi, dan menyajikan rasa Nusantara terbaik.',
  missions: [
    'Menghubungkan pelaku UMKM kuliner dengan supplier bahan baku berkualitas.',
    'Memfasilitasi pelatihan higienitas, standar penyajian, dan sertifikasi halal.',
    'Mempromosikan produk kuliner anggota melalui festival makanan.'
  ],
  benefits: [
    { title: 'Suplai Bahan Baku', description: 'Akses langsung ke supplier tangan pertama terjangkau.', icon: 'Wallet' },
    { title: 'Pelatihan Dapur', description: 'Standar kebersihan, keamanan pangan, & manajemen dapur.', icon: 'GraduationCap' },
    { title: 'Sertifikasi Halal', description: 'Pendampingan sertifikasi halal dan izin P-IRT.', icon: 'Shield' },
    { title: 'Festival Kuliner', description: 'Ikut serta dalam pameran & expo kuliner eksklusif.', icon: 'Calendar' },
    { title: 'Dapur Bersama', description: 'Fasilitas memasak higienis bersama sesama anggota.', icon: 'Building2' }
  ],
  stats: [
    { value: '1.200+', label: 'Anggota Aktif', desc: 'Pelaku usaha kuliner', icon: 'Users' },
    { value: '350+', label: 'Menu Kreatif', desc: 'Produk kuliner terdaftar', icon: 'Building2' },
    { value: '18+', label: 'Festival Makanan', desc: 'Diselenggarakan tahunan', icon: 'Calendar' },
    { value: '87+', label: 'Mitra Supplier', desc: 'Bahan baku berkualitas', icon: 'Coins' }
  ],
  activities: [
    { title: 'Bandung Culinary Festival & Food Expo', category: 'EVENT', dateLocation: '12 November 2026 • Bandung', imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=400&q=80' },
    { title: 'Pelatihan Sertifikasi Halal & Higienitas Dapur', category: 'PELATIHAN', dateLocation: '19 November 2026 • Online', imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=400&q=80' },
    { title: 'Temu Bisnis Supplier Bahan Baku Kuliner', category: 'NETWORKING', dateLocation: '3 Desember 2026 • Bandung', imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=400&q=80' }
  ],
  ctaBanner: {
    text: 'Temukan kuliner terbaik Nusantara atau daftarkan produk kuliner Anda untuk tumbuh bersama!',
    buttonText: 'Jelajahi Merchant Sekarang'
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
  isCanManage?: boolean
  isMember?: boolean
  onEdit?: () => void
  products?: any[]
  officialProducts?: any[]
  memberProducts?: any[]
  onAddProduct?: (target?: 'community' | 'member') => void
  onNavigateToProducts?: (target?: 'community' | 'member') => void
  realStats?: any
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  community,
  config,
  onJoin,
  onViewDashboard,
  isCanManage = false,
  isMember = false,
  onEdit,
  products = [],
  officialProducts = [],
  memberProducts = [],
  onAddProduct,
  onNavigateToProducts,
  realStats
}) => {
  const nameLower = (community?.name || '').toLowerCase()
  const catLower = (community?.category || '').toLowerCase()
  const typeLower = (community?.type || '').toLowerCase()

  // Strict templateType check with backward-compatible auto-detection for older communities
  const templateType = community?.templateType || (
    typeLower === 'koperasi' || catLower === 'koperasi' || nameLower.includes('koperasi') ? 'Koperasi' :
    catLower === 'kuliner' || catLower === 'culinary' || nameLower.includes('kuliner') ? 'Culinary' :
    catLower === 'business' || nameLower.includes('kopjaswara') || nameLower.includes('bisnis') || nameLower.includes('umkm') ? 'Business' :
    catLower === 'education' || nameLower.includes('pelajar') || nameLower.includes('pengusaha') || nameLower.includes('pendidikan') ? 'Education' :
    'Community'
  )

  const isKoperasi = templateType === 'Koperasi'
  const isKuliner = templateType === 'Culinary'
  const isBusiness = templateType === 'Business'
  const isEducation = templateType === 'Education'

  const defaults = 
    isKoperasi ? DEFAULT_KOPERASI_CONFIG :
    isBusiness ? DEFAULT_BUSINESS_CONFIG :
    isEducation ? DEFAULT_EDUCATION_CONFIG :
    isKuliner ? DEFAULT_CULINARY_CONFIG :
    DEFAULT_PERKUMPULAN_CONFIG
  
  const dummyCommunityProducts = [
    {
      id: '',
      name: `Kaos Resmi & Seragam ${community?.name || 'Komunitas'}`,
      price: 95000,
      category: 'Merchandise & Seragam',
      imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=80',
      description: 'Seragam resmi berbahan Cotton Combed 24s premium dengan bordir logo resmi komunitas.',
      merchantName: `Resmi ${community?.name || 'Komunitas'}`
    },
    {
      id: '',
      name: 'Paket Bahan Baku Produksi Bersama',
      price: 150000,
      category: 'Bahan Baku',
      imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&auto=format&fit=crop&q=80',
      description: 'Bahan baku berkualitas pilihan hasil pengadaan kolektif komunitas untuk efisiensi modal usaha.',
      merchantName: `Resmi ${community?.name || 'Komunitas'}`
    },
    {
      id: '',
      name: 'Paket Usaha Kemitraan & Banner Promosi',
      price: 350000,
      category: 'Paket Usaha',
      imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=500&auto=format&fit=crop&q=80',
      description: 'Starter kit lengkap media promosi, SOP operasional, dan materi branding resmi komunitas.',
      merchantName: `Resmi ${community?.name || 'Komunitas'}`
    },
    {
      id: '',
      name: 'Topi & Tumbler Eksklusif Komunitas',
      price: 65000,
      category: 'Merchandise & Seragam',
      imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=80',
      description: 'Aksesoris resmi edisi terbatas untuk menunjang kegiatan kopdar dan event komunitas.',
      merchantName: `Resmi ${community?.name || 'Komunitas'}`
    }
  ]

  const dummyMemberProducts = [
    {
      id: '',
      name: 'Kopi Arabika Java Preanger Premium',
      price: 75000,
      category: 'MAKANAN & MINUMAN',
      imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400',
      description: 'Kopi biji sangrai pilihan dari perkebunan Jawa Barat dengan cita rasa fruity & herbal.',
      merchantName: 'Kopi Saloka'
    },
    {
      id: '',
      name: 'Tas Kulit Asli Garut Handmade',
      price: 350000,
      category: 'FASHION & AKSESORIS',
      imageUrl: 'https://images.unsplash.com/photo-1547949003-9792a18a2601?w=400',
      description: 'Tas kulit sapi asli pull-up dengan jahitan tangan kuat dan desain elegan vintage.',
      merchantName: 'Garut Leather'
    },
    {
      id: '',
      name: 'Madu Murni Hutan Sumbawa Alami',
      price: 120000,
      category: 'KESEHATAN',
      imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400',
      description: 'Madu mentah tanpa pasteurisasi dari nektar bunga hutan liar Sumbawa kaya enzim alami.',
      merchantName: 'CV Madu Alami'
    },
    {
      id: '',
      name: 'Sepatu Kulit Formal Pria Oxford',
      price: 450000,
      category: 'FASHION & AKSESORIS',
      imageUrl: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=400',
      description: 'Sepatu formal premium sol karet nyaman untuk kerja dan acara resmi.',
      merchantName: 'Footwear Induk'
    }
  ]
  
  // Showcase config options
  const isProductShowcaseEnabled = config?.productShowcase?.enabled !== false
  const productSourceType: 'community' | 'member' = config?.productShowcase?.sourceType || 'community'
  
  const isMemberSource = productSourceType === 'member'
  const targetProducts = isMemberSource 
    ? (memberProducts && memberProducts.length > 0 ? memberProducts : dummyMemberProducts)
    : (officialProducts && officialProducts.length > 0 ? officialProducts : dummyCommunityProducts)

  
  // Merge config with default values safely, prioritizing community data from DB!
  const hero = {
    badge: config?.hero?.badge || (isKoperasi ? 'KOPERASI' : 'KOMUNITAS UMKM'),
    title: config?.hero?.title || community?.name || (isKoperasi ? 'Kopjaswara' : 'Perahu Kita'),
    subtitle: config?.hero?.subtitle || community?.slogan || (isKoperasi ? 'Koperasi Jasa dan Usaha Bersama' : 'Wadah Sinergi & Kolaborasi Pengusaha'),
    description: config?.hero?.description || community?.description || (isKoperasi ? 'Wadah kolaborasi untuk UMKM, pengusaha, dan profesional untuk tumbuh bersama.' : 'Wadah bagi pelaku usaha, UMKM, dan masyarakat untuk saling berbagi pengalaman.'),
    coverUrl: config?.hero?.coverUrl || community?.coverUrl || (isKoperasi ? 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80' : 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80'),
    didirikan: config?.hero?.didirikan || (community?.createdAt ? new Date(community.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : (isKoperasi ? '12 Mei 2020' : '25 Juli 2026')),
    ketua: config?.hero?.ketua || community?.ketua?.name || 'Pengurus',
    lokasi: config?.hero?.lokasi || community?.domisili || (isKoperasi ? 'Sleman, DIY' : 'Kota Yogyakarta, DIY'),
    anggotaCount: config?.hero?.anggotaCount || `${realStats?.activeMembersCount || 1} Anggota`,
    quoteText: config?.hero?.quoteText || (isKoperasi ? 'Kolaborasi hari ini, kesempatan lebih besar untuk masa depan.' : 'Sinergi lokal, tumbuh bersama demi kemakmuran bersama.'),
    quoteAuthor: config?.hero?.quoteAuthor || community?.name || (isKoperasi ? 'Kopjaswara' : 'Perahu Kita')
  }

  const vision = config?.vision || community?.description || defaults.vision
  const missions = config?.missions?.length === 3 ? config.missions : defaults.missions
  const benefits = config?.benefits?.length === 5 ? config.benefits : defaults.benefits
  
  const stats = config?.stats?.length === 4 ? config.stats : [
    { value: `${realStats?.activeMembersCount || 1}+`, label: 'Anggota Aktif', desc: 'Bergabung bersama kami', icon: 'Users' },
    { value: `${realStats?.activeMerchantsCount || 0}+`, label: 'UMKM Bergabung', desc: 'Bersama tumbuh dan berdaya', icon: 'Building2' },
    { value: isKoperasi ? `Rp ${(realStats?.totalSavingsCollected || 0).toLocaleString('id-ID')}` : '24+', label: isKoperasi ? 'Simpanan Koperasi' : 'Event Bulanan', desc: isKoperasi ? 'Total tabungan terhimpun' : 'Bazar dan pelatihan langsung', icon: isKoperasi ? 'Coins' : 'Calendar' },
    { value: isKoperasi ? `Rp ${(realStats?.shuCurrentYearProfit || 0).toLocaleString('id-ID')}` : '87+', label: isKoperasi ? 'Laba SHU Koperasi' : 'Galeri Kegiatan', desc: isKoperasi ? 'SHU tahun buku berjalan' : 'Dokumentasi sinergi anggota', icon: isKoperasi ? 'Coins' : 'Building2' }
  ]

  const activities = config?.activities?.length === 3 ? config.activities : defaults.activities
  
  const ctaBanner = {
    text: config?.ctaBanner?.text || (isKoperasi 
      ? `Bergabung sekarang dengan Koperasi ${community?.name || ''} dan jadilah bagian dari ekosistem bisnis yang saling mendukung.`
      : `Sinergikan bisnismu sekarang dan tumbuh bersama ratusan UMKM berprestasi di ${community?.name || ''}!`),
    buttonText: config?.ctaBanner?.buttonText || (isKoperasi ? 'Menjadi Anggota Sekarang' : 'Gabung Komunitas Sekarang')
  }

  const renderIcon = (name: string, className = "w-6 h-6") => {
    const Component = IconMap[name] || HelpCircle
    return <Component className={className} />
  }

  return (
    <div className="bg-gradient-to-tr from-emerald-50/10 via-[#FAFBF9] to-emerald-50/20 text-[#1F2937] font-sans antialiased min-h-screen relative overflow-hidden">
      {/* Grid Pattern Overlay for Tech-Modern Premium Feel */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

      {/* 1. Hero Section */}
      <section className="py-16 md:py-24 px-4 md:px-8 max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left column info */}
        <div className="space-y-6">
          <span className="inline-block px-3 py-1 bg-emerald-100/80 text-emerald-800 font-extrabold text-[10px] uppercase tracking-wider rounded-lg border border-emerald-200/50 shadow-2xs font-sora">
            {hero.badge || (isKoperasi ? 'KOPERASI PRO' : 'KOMUNITAS UMKM')}
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black font-sora tracking-tight text-slate-900 leading-tight">
            {hero.title || community?.name}
          </h1>
          <h3 className="text-lg md:text-xl font-bold text-emerald-850 leading-relaxed font-sora bg-gradient-to-r from-emerald-800 to-teal-850 bg-clip-text text-transparent">
            {hero.subtitle || community?.slogan || 'Sinergi Bersama untuk Kesejahteraan'}
          </h3>
          <p className="text-sm md:text-base text-gray-655 max-w-xl leading-relaxed">
            {hero.description || community?.description || 'Wadah kolaborasi pelaku usaha untuk tumbuh dan berkembang bersama.'}
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            {isMember ? (
              <button 
                className="px-6 py-4 bg-emerald-100 text-emerald-800 border border-emerald-200 font-extrabold text-sm rounded-2xl shadow-none flex items-center gap-2 cursor-default font-sora pointer-events-none"
              >
                <Users className="w-5 h-5" /> Sudah Menjadi Anggota
              </button>
            ) : (
              <button 
                onClick={onJoin}
                className="px-6 py-4 bg-emerald-700 hover:bg-emerald-800 hover:shadow-emerald-700/20 hover:scale-[1.02] text-white font-extrabold text-sm rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer font-sora duration-300"
              >
                <Users className="w-5 h-5" /> {isKoperasi ? 'Ayo Gabung Menjadi Anggota' : 'Ayo Gabung Komunitas'}
              </button>
            )}
            <button 
              onClick={onViewDashboard}
              className="px-6 py-4 bg-white border border-gray-250 hover:border-emerald-600 hover:text-emerald-700 hover:scale-[1.02] text-gray-700 font-extrabold text-sm rounded-2xl shadow-xs transition-all flex items-center gap-2 cursor-pointer font-sora duration-300"
            >
              <Play className="w-4 h-4 text-emerald-600 fill-emerald-600" /> Lihat Dashboard
            </button>
            {isCanManage && (
              <button 
                onClick={onEdit}
                className="px-6 py-4 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-sm rounded-2xl shadow-lg hover:shadow-amber-500/20 hover:scale-[1.02] transition-all flex items-center gap-2 cursor-pointer font-sora duration-300"
              >
                <Sliders className="w-4 h-4" /> Edit Tampilan
              </button>
            )}
          </div>

          {/* Metadata bar */}
          <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-gray-250/60">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider block">Didirikan</span>
                <span className="text-xs font-bold text-gray-800 block">{hero.didirikan}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider block">Ketua</span>
                <span className="text-xs font-bold text-gray-800 block line-clamp-1">{hero.ketua}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider block">Lokasi</span>
                <span className="text-xs font-bold text-gray-800 block line-clamp-1">{hero.lokasi}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider block">Anggota</span>
                <span className="text-xs font-bold text-gray-800 block">{hero.anggotaCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column layout with quote */}
        <div className="relative justify-self-center lg:justify-self-end w-full max-w-[500px]">
          <div className="relative aspect-[4/3] w-full rounded-[32px] overflow-hidden shadow-2xl border border-gray-250/20 bg-white group">
            <Image
              src={hero.coverUrl}
              alt="Community Banner"
              fill
              sizes="(max-width: 1024px) 100vw, 500px"
              priority
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
            {/* Soft gradient bottom layer */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          </div>

          {/* Overlapping Quote Box (Frosted Glassmorphism) */}
          <div className="absolute -bottom-8 -left-4 md:-left-8 max-w-[320px] p-6 backdrop-blur-md bg-white/80 border border-white/50 rounded-3xl shadow-xl space-y-2 hover:scale-[1.03] transition-all duration-300">
            <span className="text-emerald-750 text-4xl font-serif leading-none block h-4">“</span>
            <p className="text-xs font-extrabold text-slate-800 leading-relaxed font-sora">
              {hero.quoteText}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <div className="w-4 h-0.5 bg-emerald-500" />
              <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                {hero.quoteAuthor}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Advantages Section ("Keuntungan Menjadi Anggota") */}
      <section className="py-20 md:py-24 bg-white border-y border-gray-100 relative z-10">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8 space-y-16">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <span className="text-[9px] bg-emerald-50 text-emerald-800 font-black px-3 py-1 rounded-full uppercase tracking-wider font-sora">
              Benefit Utama
            </span>
            <h2 className="text-3xl md:text-4xl font-black font-sora text-slate-900 tracking-tight">
              Keuntungan Anggota
            </h2>
            <p className="text-xs md:text-sm text-gray-500 font-semibold uppercase tracking-wider">
              Mari berkolaborasi dan nikmati akses fasilitas terbaik bersama kami
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {benefits.map((b: any, idx: number) => (
              <div key={idx} className="p-6 bg-slate-50/60 border border-gray-150 rounded-3xl text-center space-y-4 hover:border-emerald-600 hover:bg-white hover:scale-[1.03] hover:shadow-lg transition-all duration-300 flex flex-col justify-between items-center group">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-700 group-hover:text-white transition-all shadow-3xs">
                  {renderIcon(b.icon || 'Users', 'w-5 h-5')}
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

      {/* 3. Visi & Misi Section (Brand New Premium Conversion Hook) */}
      <section className="py-20 md:py-24 bg-gradient-to-b from-[#F3F6F2] to-[#FAFBF9] border-b border-gray-100 relative z-10">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider font-sora">
              Arah & Tujuan Kami
            </span>
            <h2 className="text-3xl md:text-4xl font-black font-sora text-slate-900 tracking-tight">
              Visi & Misi {isKoperasi ? 'Koperasi' : 'Perkumpulan'}
            </h2>
            <p className="text-xs md:text-sm text-gray-500 font-medium">
              Komitmen nyata kami untuk tumbuh bersama, berjejaring, dan memberdayakan seluruh pelaku UMKM.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* Visi Card */}
            <div className="p-8 md:p-10 bg-gradient-to-br from-emerald-800 to-emerald-950 rounded-[32px] text-white flex flex-col justify-between shadow-xl relative overflow-hidden group hover:scale-[1.01] hover:shadow-2xl transition-all duration-500">
              {/* Decorative light circle overlay */}
              <div className="absolute -right-20 -top-20 w-60 h-60 rounded-full bg-emerald-600/20 blur-3xl group-hover:scale-120 transition-transform duration-700" />
              
              <div className="space-y-6 relative z-10">
                <span className="text-5xl font-serif text-emerald-400 block h-6 leading-none">“</span>
                <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400 font-sora">
                  Visi Utama
                </h3>
                <p className="text-lg md:text-xl lg:text-2xl font-extrabold leading-relaxed font-sora">
                  {vision}
                </p>
              </div>

              <div className="pt-8 border-t border-emerald-700/50 flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center font-bold text-white shadow-md font-sora">
                  {hero.title?.charAt(0) || 'S'}
                </div>
                <div>
                  <span className="text-xs font-black block tracking-tight font-sora">{hero.title}</span>
                  <span className="text-[9px] text-emerald-300 font-bold block uppercase tracking-wider">Bersama Tumbuh & Berdaya</span>
                </div>
              </div>
            </div>

            {/* Misi Cards */}
            <div className="space-y-4 flex flex-col justify-between">
              {missions.map((m: string, idx: number) => (
                <div key={idx} className="p-6 bg-white border border-gray-100 hover:border-emerald-600/35 hover:shadow-lg transition-all duration-300 rounded-[24px] flex gap-5 group hover:-translate-y-0.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-lg font-sora shrink-0 group-hover:bg-emerald-700 group-hover:text-white transition-all shadow-3xs">
                    0{idx + 1}
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="font-extrabold text-[9px] text-emerald-800 uppercase tracking-wider font-sora">Misi {idx + 1}</h4>
                    <p className="text-xs md:text-sm text-slate-800 font-medium leading-relaxed">
                      {m}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Statistics row */}
      <section className="py-12 px-4 md:px-8 max-w-[1280px] mx-auto relative z-10">
        <div className="p-8 bg-white border border-gray-150 rounded-[32px] grid grid-cols-2 lg:grid-cols-4 gap-6 items-center shadow-md">
          {stats.map((s: any, idx: number) => (
            <div key={idx} className="flex items-center gap-4 p-2 hover:scale-[1.03] transition-transform duration-300">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-750 flex items-center justify-center shrink-0 shadow-3xs">
                {renderIcon(s.icon || 'Users', 'w-5 h-5')}
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
      <section className="py-20 md:py-24 bg-[#F9FAF8] border-t border-gray-100 relative z-10">
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
              className="text-xs font-extrabold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer font-sora font-semibold"
            >
              Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {activities.map((act: any, idx: number) => (
              <div key={idx} className="bg-white border border-gray-150 rounded-[32px] overflow-hidden shadow-xs hover:border-emerald-500/30 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
                <div>
                  <div className="h-52 overflow-hidden bg-gray-100 relative">
                    <Image
                      src={act.imageUrl}
                      alt={act.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-3 left-3 px-2 py-0.5 bg-emerald-700 text-white font-extrabold text-[9px] rounded-md uppercase tracking-wider shadow-sm font-sora">
                      {act.category}
                    </span>
                  </div>
                  <div className="p-6 space-y-2">
                    <h4 className="text-sm font-extrabold text-gray-900 line-clamp-2 leading-relaxed font-sora group-hover:text-emerald-800 transition-colors">
                      {act.title}
                    </h4>
                  </div>
                </div>
                <div className="p-6 pt-0 text-[10px] text-gray-400 font-bold border-t border-gray-50 flex items-center gap-1.5 shrink-0">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  <span>{act.dateLocation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5.5. Produk Showcase Section (Bisa Komunitas atau Anggota sesuai Pengaturan Landing) */}
      {isProductShowcaseEnabled && (
        <section className="py-20 md:py-24 bg-white border-t border-gray-100 relative z-10">
          <div className="max-w-[1280px] mx-auto px-4 md:px-8 space-y-12">
            <div className="flex justify-between items-end flex-wrap gap-4">
              <div className="space-y-1">
                <span className="text-[9px] bg-emerald-50 text-emerald-800 font-black px-3 py-1 rounded-full uppercase tracking-wider font-sora">
                  {isMemberSource ? 'Galeri Usaha Anggota' : 'Katalog Resmi Komunitas'}
                </span>
                <h2 className="text-2xl md:text-3xl font-black font-sora text-slate-900 tracking-tight mt-2">
                  {config?.productShowcase?.title || (isMemberSource ? `Produk Unggulan Anggota ${community?.name || ''}` : `Produk Resmi ${community?.name || 'Komunitas'}`)}
                </h2>
                <p className="text-xs text-gray-500 font-medium max-w-2xl">
                  {config?.productShowcase?.subtitle || (isMemberSource ? 'Karya terbaik dan produk berkualitas dari para pelaku UMKM anggota kami' : 'Koleksi produk resmi, merchandise, seragam, bahan baku, dan paket usaha terpercaya yang dikelola komunitas')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {isCanManage && (
                  <button 
                    onClick={() => onAddProduct ? onAddProduct(productSourceType) : onViewDashboard()}
                    className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 hover:scale-[1.02] text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer font-sora transition-all duration-200"
                  >
                    <Plus className="w-3.5 h-3.5" /> {isMemberSource ? 'Tambah Produk Anggota' : 'Tambah Produk Komunitas'}
                  </button>
                )}
                <button 
                  onClick={() => onNavigateToProducts ? onNavigateToProducts(productSourceType) : onViewDashboard()}
                  className="text-xs font-extrabold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer font-sora font-semibold"
                >
                  {isMemberSource ? 'Buka Marketplace Anggota' : 'Buka Katalog Komunitas'} <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {targetProducts.slice(0, 4).map((p: any, idx: number) => (
                <div key={p.id || idx} className="p-4 bg-slate-50/60 border border-gray-150 rounded-3xl hover:border-emerald-500/30 hover:bg-white hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
                  <div className="space-y-3">
                    <div className="relative rounded-2xl overflow-hidden h-44 bg-gray-100">
                      <Image
                        src={p.imageUrl || p.img || (isMemberSource ? 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400' : 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=80')}
                        alt={p.name || p.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-3 left-3 px-2 py-0.5 bg-emerald-700 text-white font-extrabold text-[9px] rounded-md uppercase tracking-wider shadow-sm font-sora">
                        {p.category || (isMemberSource ? 'ANGGOTA' : 'OFFICIAL')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-emerald-700 font-bold uppercase tracking-wider block">
                        {isMemberSource ? (p.merchantName || 'UMKM Anggota') : `Resmi ${community?.name || 'Komunitas'}`}
                      </span>
                      <h4 className="text-xs font-extrabold text-gray-900 group-hover:text-emerald-800 transition-colors line-clamp-2 leading-relaxed mt-0.5">
                        {p.name || p.title}
                      </h4>
                      <p className="text-[10px] text-gray-500 font-medium line-clamp-2 mt-1 leading-relaxed">
                        {p.description || (isMemberSource ? 'Produk berkualitas dari anggota terdaftar.' : 'Produk resmi pilihan dari pengurus komunitas.')}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-3 mt-3 border-t border-gray-150/60">
                    <span className="text-sm font-black text-emerald-850">
                      Rp {Number(p.price || 0).toLocaleString('id-ID')}
                    </span>
                    <button 
                      onClick={() => onNavigateToProducts ? onNavigateToProducts(productSourceType) : onViewDashboard()}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 hover:scale-[1.03] text-white font-extrabold text-[10px] rounded-xl shadow-xs transition-all cursor-pointer font-sora duration-200"
                    >
                      Detail Produk
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. Bottom Banner CTA */}
      <section className="py-12 px-4 md:px-8 max-w-[1280px] mx-auto relative z-10">
        <div className="p-8 md:p-14 bg-gradient-to-br from-emerald-850 to-emerald-950 text-white rounded-[32px] flex flex-col lg:flex-row items-center justify-between gap-8 shadow-xl relative overflow-hidden group">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-emerald-700/20 blur-3xl pointer-events-none" />
          <div className="space-y-3 text-center lg:text-left max-w-xl relative z-10">
            <h3 className="text-xl md:text-3xl font-black font-sora leading-snug font-semibold">
              {ctaBanner.text}
            </h3>
          </div>
          {isMember ? (
            <button 
              className="px-8 py-4.5 bg-emerald-800/80 text-emerald-250 border border-emerald-700/40 font-extrabold text-sm rounded-2xl shadow-none shrink-0 cursor-default font-sora flex items-center gap-1.5 relative z-10 pointer-events-none"
            >
              Sudah Menjadi Anggota
            </button>
          ) : (
            <button 
              onClick={onJoin}
              className="px-8 py-4.5 bg-white hover:bg-emerald-50 hover:scale-[1.04] text-emerald-800 font-extrabold text-sm rounded-2xl shadow-lg transition-all shrink-0 cursor-pointer font-sora flex items-center gap-1.5 relative z-10 duration-300"
            >
              {isKoperasi ? 'Ayo Gabung Menjadi Anggota' : 'Ayo Gabung Komunitas'} <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
