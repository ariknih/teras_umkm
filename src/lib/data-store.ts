
import { db } from './db'
import crypto from 'crypto'
import { ProductCategory } from '@prisma/client'
import fs from 'fs'
import path from 'path'

// Fallback Mock Data Store (In-Memory Sandbox)
const mockUsers = [
  {
    id: 'user-admin-1',
    email: 'admin@saloka.com',
    name: 'Super Admin Saloka',
    passwordHash: crypto.createHash('sha256').update('admin2026').digest('hex'),
    role: 'ADMIN' as const,
    isSuperAdmin: true,
    latitude: -6.2088, longitude: 106.8456,
    level: 99, xp: 99999,
    landingPageTemplate: null, landingPageConfig: null, landingPageSetup: true,
    parentAffiliateId: null,
    membershipLevel: 'Super Admin', membershipAccess: 'Diamond',
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'user-admin-2',
    email: 'staff@saloka.com',
    name: 'Staff Admin Saloka',
    passwordHash: crypto.createHash('sha256').update('staff2026').digest('hex'),
    role: 'ADMIN' as const,
    isSuperAdmin: false,
    latitude: -6.2088, longitude: 106.8456,
    level: 50, xp: 5000,
    landingPageTemplate: null, landingPageConfig: null, landingPageSetup: true,
    parentAffiliateId: null,
    membershipLevel: 'Admin Staff', membershipAccess: 'Platinum',
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'user-merchant-1',
    email: 'merchant@saloka.com',
    name: 'Kala Sourdough Studio',
    passwordHash: crypto.createHash('sha256').update('password123').digest('hex'),
    role: 'MERCHANT' as const,
    latitude: -6.2088,
    longitude: 106.8456,
    level: 5,
    xp: 450,
    landingPageTemplate: 'modern-gold',
    landingPageConfig: '{"title":"Kala Sourdough Studio","bio":"Studio Sourdough Premium Terbaik di Jakarta","phone":"08123456789","instagram":"@kalasourdough","sections":["hero","profile","products","map"]}',
    landingPageSetup: true,
    parentAffiliateId: null,
    membershipLevel: 'Distributor',
    membershipAccess: 'Diamond',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'user-affiliate-1',
    email: 'affiliate@saloka.com',
    name: 'Budi Affiliate Marketer',
    passwordHash: crypto.createHash('sha256').update('password123').digest('hex'),
    role: 'AFFILIATE' as const,
    latitude: -6.2200,
    longitude: 106.8500,
    level: 3,
    xp: 250,
    landingPageTemplate: null,
    landingPageConfig: null,
    landingPageSetup: false,
    parentAffiliateId: null,
    membershipLevel: 'Agen',
    membershipAccess: 'Platinum',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'user-customer-1',
    email: 'customer@saloka.com',
    name: 'Andi Pembeli',
    passwordHash: crypto.createHash('sha256').update('password123').digest('hex'),
    role: 'CUSTOMER' as const,
    latitude: -6.2000,
    longitude: 106.8300,
    level: 1,
    xp: 20,
    landingPageTemplate: null,
    landingPageConfig: null,
    landingPageSetup: false,
    parentAffiliateId: 'user-affiliate-1',
    membershipLevel: 'Reseller',
    membershipAccess: 'Gold',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'user-cs-1',
    email: 'cs@saloka.com',
    name: 'Budi Customer Service',
    passwordHash: crypto.createHash('sha256').update('password123').digest('hex'),
    role: 'CUSTOMER_SERVICE' as const,
    latitude: -6.2000,
    longitude: 106.8300,
    level: 1,
    xp: 0,
    landingPageTemplate: null,
    landingPageConfig: null,
    landingPageSetup: false,
    parentAffiliateId: null,
    membershipLevel: 'Staff',
    membershipAccess: 'Gold',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // ─── Additional Mock Merchants ───────────────────────────────────────────────
  {
    id: 'user-merchant-2',
    email: 'nusantara.fashion@saloka.com',
    name: 'Nusantara Fashion House',
    passwordHash: crypto.createHash('sha256').update('password123').digest('hex'),
    role: 'MERCHANT' as const,
    latitude: -7.7972,
    longitude: 110.3688,
    level: 4,
    xp: 380,
    landingPageTemplate: 'neo-brutalism',
    landingPageConfig: '{"title":"Nusantara Fashion House","bio":"Batik & fashion lokal premium dari Jogja","phone":"08567890123","instagram":"@nusantarafashion"}',
    landingPageSetup: true,
    parentAffiliateId: null,
    membershipLevel: 'Agen',
    membershipAccess: 'Diamond',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'user-merchant-3',
    email: 'techgeek.id@saloka.com',
    name: 'TechGeek Indonesia',
    passwordHash: crypto.createHash('sha256').update('password123').digest('hex'),
    role: 'MERCHANT' as const,
    latitude: -6.1751,
    longitude: 106.8650,
    level: 6,
    xp: 600,
    landingPageTemplate: 'glassmorphism',
    landingPageConfig: '{"title":"TechGeek Indonesia","bio":"Gadget & aksesoris teknologi terpercaya","phone":"08789012345","instagram":"@techgeek.id"}',
    landingPageSetup: true,
    parentAffiliateId: null,
    membershipLevel: 'Distributor',
    membershipAccess: 'Diamond',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'user-merchant-4',
    email: 'dapur.kreatif@saloka.com',
    name: 'Dapur Kreatif Nusantara',
    passwordHash: crypto.createHash('sha256').update('password123').digest('hex'),
    role: 'MERCHANT' as const,
    latitude: -7.2504,
    longitude: 112.7688,
    level: 3,
    xp: 290,
    landingPageTemplate: 'modern-gold',
    landingPageConfig: '{"title":"Dapur Kreatif Nusantara","bio":"Makanan & minuman artisan pilihan dari Surabaya","phone":"08234567890","instagram":"@dapurkreatif"}',
    landingPageSetup: true,
    parentAffiliateId: null,
    membershipLevel: 'Reseller',
    membershipAccess: 'Platinum',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'user-merchant-5',
    email: 'kreasi.digital@saloka.com',
    name: 'Kreasi Digital Studio',
    passwordHash: crypto.createHash('sha256').update('password123').digest('hex'),
    role: 'MERCHANT' as const,
    latitude: -8.4095,
    longitude: 115.1889,
    level: 7,
    xp: 720,
    landingPageTemplate: 'glassmorphism',
    landingPageConfig: '{"title":"Kreasi Digital Studio","bio":"Jasa desain, foto, video & IT profesional dari Bali","phone":"08345678901","instagram":"@kreasidigital"}',
    landingPageSetup: true,
    parentAffiliateId: null,
    membershipLevel: 'Distributor',
    membershipAccess: 'Diamond',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // ─── 10 New Business Users ────────────────────────────────────────────────────
  {
    id: 'user-merchant-6',
    email: 'herbal.nusantara@saloka.com',
    name: 'Herbal Nusantara Apotik',
    passwordHash: crypto.createHash('sha256').update('password123').digest('hex'),
    role: 'MERCHANT' as const,
    latitude: -6.9147, longitude: 107.6098,
    level: 4, xp: 360,
    landingPageTemplate: 'modern-gold',
    landingPageConfig: '{"title":"Herbal Nusantara","bio":"Produk herbal dan kesehatan alami pilihan dari Bandung","phone":"08111222333","instagram":"@herbalnusantara"}',
    landingPageSetup: true, parentAffiliateId: null,
    membershipLevel: 'Agen', membershipAccess: 'Platinum',
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'user-merchant-7',
    email: 'furni.jepara@saloka.com',
    name: 'Furnicraft Jepara',
    passwordHash: crypto.createHash('sha256').update('password123').digest('hex'),
    role: 'MERCHANT' as const,
    latitude: -6.5896, longitude: 110.6688,
    level: 5, xp: 480,
    landingPageTemplate: 'neo-brutalism',
    landingPageConfig: '{"title":"Furnicraft Jepara","bio":"Furniture kayu jati ukir premium langsung dari pengrajin Jepara","phone":"08222333444","instagram":"@furnicraftjepara"}',
    landingPageSetup: true, parentAffiliateId: null,
    membershipLevel: 'Distributor', membershipAccess: 'Diamond',
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'user-merchant-8',
    email: 'agro.segar@saloka.com',
    name: 'AgroSegar Farm Bogor',
    passwordHash: crypto.createHash('sha256').update('password123').digest('hex'),
    role: 'MERCHANT' as const,
    latitude: -6.5971, longitude: 106.8060,
    level: 3, xp: 210,
    landingPageTemplate: 'modern-gold',
    landingPageConfig: '{"title":"AgroSegar Farm","bio":"Sayur & buah organik segar dari kebun sendiri di Bogor","phone":"08333444555","instagram":"@agrosegar"}',
    landingPageSetup: true, parentAffiliateId: null,
    membershipLevel: 'Reseller', membershipAccess: 'Gold',
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'user-merchant-9',
    email: 'aksesoris.silver@saloka.com',
    name: 'Silver Artisan Celuk',
    passwordHash: crypto.createHash('sha256').update('password123').digest('hex'),
    role: 'MERCHANT' as const,
    latitude: -8.5833, longitude: 115.2667,
    level: 6, xp: 550,
    landingPageTemplate: 'glassmorphism',
    landingPageConfig: '{"title":"Silver Artisan Celuk","bio":"Perhiasan perak handmade asli pengrajin Celuk Bali","phone":"08444555666","instagram":"@silverceluk"}',
    landingPageSetup: true, parentAffiliateId: null,
    membershipLevel: 'Agen', membershipAccess: 'Diamond',
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'user-merchant-10',
    email: 'konveksi.solo@saloka.com',
    name: 'Konveksi Solo Premium',
    passwordHash: crypto.createHash('sha256').update('password123').digest('hex'),
    role: 'MERCHANT' as const,
    latitude: -7.5755, longitude: 110.8243,
    level: 4, xp: 420,
    landingPageTemplate: 'modern-gold',
    landingPageConfig: '{"title":"Konveksi Solo Premium","bio":"Produksi seragam, kaos, dan jaket sablon berkualitas dari Solo","phone":"08555666777","instagram":"@konveksisolo"}',
    landingPageSetup: true, parentAffiliateId: null,
    membershipLevel: 'Agen', membershipAccess: 'Platinum',
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'user-merchant-11',
    email: 'edu.kids@saloka.com',
    name: 'EduKids Toy Studio',
    passwordHash: crypto.createHash('sha256').update('password123').digest('hex'),
    role: 'MERCHANT' as const,
    latitude: -7.2575, longitude: 112.7521,
    level: 3, xp: 280,
    landingPageTemplate: 'neo-brutalism',
    landingPageConfig: '{"title":"EduKids Toy Studio","bio":"Mainan edukasi anak ramah lingkungan buatan lokal Surabaya","phone":"08666777888","instagram":"@edukidstoy"}',
    landingPageSetup: true, parentAffiliateId: null,
    membershipLevel: 'Reseller', membershipAccess: 'Gold',
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'user-merchant-12',
    email: 'skincare.lokal@saloka.com',
    name: 'Glow Local Skincare',
    passwordHash: crypto.createHash('sha256').update('password123').digest('hex'),
    role: 'MERCHANT' as const,
    latitude: -6.2146, longitude: 106.8451,
    level: 5, xp: 510,
    landingPageTemplate: 'glassmorphism',
    landingPageConfig: '{"title":"Glow Local Skincare","bio":"Skincare natural berbahan baku lokal Indonesia, BPOM terdaftar","phone":"08777888999","instagram":"@glowlocal"}',
    landingPageSetup: true, parentAffiliateId: null,
    membershipLevel: 'Distributor', membershipAccess: 'Diamond',
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'user-merchant-13',
    email: 'pet.care.id@saloka.com',
    name: 'PetCare Indonesia',
    passwordHash: crypto.createHash('sha256').update('password123').digest('hex'),
    role: 'MERCHANT' as const,
    latitude: -6.1944, longitude: 106.8229,
    level: 3, xp: 230,
    landingPageTemplate: 'modern-gold',
    landingPageConfig: '{"title":"PetCare Indonesia","bio":"Produk & layanan perawatan hewan peliharaan terpercaya Jakarta","phone":"08888999000","instagram":"@petcareid"}',
    landingPageSetup: true, parentAffiliateId: null,
    membershipLevel: 'Reseller', membershipAccess: 'Platinum',
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'user-merchant-14',
    email: 'properti.kost@saloka.com',
    name: 'Kost Premium Menteng',
    passwordHash: crypto.createHash('sha256').update('password123').digest('hex'),
    role: 'MERCHANT' as const,
    latitude: -6.1862, longitude: 106.8355,
    level: 4, xp: 350,
    landingPageTemplate: 'modern-gold',
    landingPageConfig: '{"title":"Kost Premium Menteng","bio":"Kost eksklusif dan jasa properti di kawasan Menteng Jakarta","phone":"08999000111","instagram":"@kostmenteng"}',
    landingPageSetup: true, parentAffiliateId: null,
    membershipLevel: 'Agen', membershipAccess: 'Diamond',
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'user-merchant-15',
    email: 'otomotif.bengkel@saloka.com',
    name: 'Bengkel Pro Autocare',
    passwordHash: crypto.createHash('sha256').update('password123').digest('hex'),
    role: 'MERCHANT' as const,
    latitude: -7.2830, longitude: 112.7372,
    level: 5, xp: 470,
    landingPageTemplate: 'neo-brutalism',
    landingPageConfig: '{"title":"Bengkel Pro Autocare","bio":"Servis dan aksesoris kendaraan roda dua & empat Surabaya","phone":"08000111222","instagram":"@bengkelproauto"}',
    landingPageSetup: true, parentAffiliateId: null,
    membershipLevel: 'Distributor', membershipAccess: 'Diamond',
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'user-affiliate-2',
    email: 'affiliate2@saloka.com',
    name: 'Siti Affiliate Marketer',
    passwordHash: crypto.createHash('sha256').update('password123').digest('hex'),
    role: 'AFFILIATE' as const,
    latitude: -6.2300, longitude: 106.8600,
    level: 2, xp: 150,
    landingPageTemplate: null, landingPageConfig: null, landingPageSetup: false,
    parentAffiliateId: 'user-affiliate-1',
    membershipLevel: 'Reseller', membershipAccess: 'Platinum',
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'user-affiliate-3',
    email: 'affiliate3@saloka.com',
    name: 'Bambang Sub-Affiliate',
    passwordHash: crypto.createHash('sha256').update('password123').digest('hex'),
    role: 'AFFILIATE' as const,
    latitude: -6.2400, longitude: 106.8700,
    level: 1, xp: 50,
    landingPageTemplate: null, landingPageConfig: null, landingPageSetup: false,
    parentAffiliateId: 'user-affiliate-2',
    membershipLevel: 'Agen', membershipAccess: 'Gold',
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'user-customer-2',
    email: 'customer2@saloka.com',
    name: 'Joko Pembeli',
    passwordHash: crypto.createHash('sha256').update('password123').digest('hex'),
    role: 'CUSTOMER' as const,
    latitude: -6.2500, longitude: 106.8800,
    level: 1, xp: 10,
    landingPageTemplate: null, landingPageConfig: null, landingPageSetup: false,
    parentAffiliateId: 'user-affiliate-2',
    membershipLevel: 'Reseller', membershipAccess: 'Gold',
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'user-customer-3',
    email: 'customer3@saloka.com',
    name: 'Dewi Pembeli',
    passwordHash: crypto.createHash('sha256').update('password123').digest('hex'),
    role: 'CUSTOMER' as const,
    latitude: -6.2600, longitude: 106.8900,
    level: 1, xp: 5,
    landingPageTemplate: null, landingPageConfig: null, landingPageSetup: false,
    parentAffiliateId: 'user-affiliate-3',
    membershipLevel: 'Reseller', membershipAccess: 'Gold',
    createdAt: new Date(), updatedAt: new Date(),
  },
]

const mockProducts = [
  // ─── TOKO & RITEL ────────────────────────────────────────────────────────────
  {
    id: 'prod-gayo-coffee',
    title: 'Kopi Gayo Organik Premium',
    description: 'Kopi gayo organik dengan proses honey, menghadirkan rasa fruity yang segar dengan body tebal yang lembut.',
    price: 150000,
    category: 'TOKO' as const,
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&q=80',
    merchantId: 'user-merchant-1',
    latitude: -6.2088, longitude: 106.8456,
    isAffiliateEnabled: true,
    affiliateCommissionType: 'PERCENT',
    affiliateCommissionValue: 5.0,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'prod-batik-lurik',
    title: 'Batik Lurik Premium Jogja',
    description: 'Kain batik lurik tenun tangan asli Jogjakarta, motif klasik dengan warna natural yang elegan.',
    price: 285000,
    category: 'PAKAIAN_PRIA' as const,
    stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=400&q=80',
    merchantId: 'user-merchant-1',
    latitude: -7.7972, longitude: 110.3688,
    createdAt: new Date(), updatedAt: new Date(),
  },
  // ─── KAFE & KULINER ──────────────────────────────────────────────────────────
  {
    id: 'prod-sourdough',
    title: 'Artisan Country Sourdough',
    description: 'Roti sourdough klasik berpori besar dengan kulit renyah (crust) dan rasa asam khas ragi alami.',
    price: 65000,
    category: 'KAFE' as const,
    stock: 20,
    imageUrl: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc7b?w=400&q=80',
    merchantId: 'user-merchant-1',
    latitude: -6.2088, longitude: 106.8456,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'prod-cold-brew',
    title: 'Cold Brew Coffee Botolan 500ml',
    description: 'Cold brew 18 jam dengan single origin Ethiopia Yirgacheffe. Cocok untuk coffee shop dan reseller.',
    price: 45000,
    category: 'MAKANAN_MINUMAN' as const,
    stock: 100,
    imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80',
    merchantId: 'user-merchant-1',
    latitude: -6.2145, longitude: 106.8272,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'prod-sambal-artisan',
    title: 'Sambal Bajak Artisan Medan',
    description: 'Sambal bajak dengan cabe rawit lokal pilihan, dimasak tradisional tanpa MSG, tahan 2 bulan.',
    price: 38000,
    category: 'MAKANAN_MINUMAN' as const,
    stock: 75,
    imageUrl: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&q=80',
    merchantId: 'user-merchant-1',
    latitude: 3.5952, longitude: 98.6722,
    createdAt: new Date(), updatedAt: new Date(),
  },
  // ─── ELEKTRONIK ──────────────────────────────────────────────────────────────
  {
    id: 'prod-earphone-tws',
    title: 'TWS Earbuds Wireless ANC Pro',
    description: 'True wireless earbuds dengan Active Noise Cancellation, Bluetooth 5.3, baterai 30 jam, IPX5 waterproof.',
    price: 299000,
    category: 'ELEKTRONIK' as const,
    stock: 45,
    imageUrl: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=400&q=80',
    merchantId: 'user-merchant-1',
    latitude: -6.1751, longitude: 106.8650,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'prod-powerbank-65w',
    title: 'Powerbank 20.000mAh 65W GaN',
    description: 'Powerbank GaN 65W dengan 3 port (USB-C PD + 2 USB-A), support fast charging laptop dan ponsel.',
    price: 449000,
    category: 'ELEKTRONIK' as const,
    stock: 28,
    imageUrl: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&q=80',
    merchantId: 'user-merchant-1',
    latitude: -6.2349, longitude: 106.9896,
    createdAt: new Date(), updatedAt: new Date(),
  },
  // ─── HANDPHONE & AKSESORIS ───────────────────────────────────────────────────
  {
    id: 'prod-case-magsafe',
    title: 'Case iPhone MagSafe Premium Leather',
    description: 'Casing iPhone full leather Italy dengan slot kartu dan ring holder, compatible MagSafe semua seri.',
    price: 189000,
    category: 'HANDPHONE_AKSESORIS' as const,
    stock: 60,
    imageUrl: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&q=80',
    merchantId: 'user-merchant-1',
    latitude: -6.1944, longitude: 106.8229,
    createdAt: new Date(), updatedAt: new Date(),
  },
  // ─── KOMPUTER & AKSESORIS ────────────────────────────────────────────────────
  {
    id: 'prod-mouse-ergonomic',
    title: 'Mouse Ergonomik Wireless 4K DPI',
    description: 'Mouse vertikal ergonomik wireless 2.4G + Bluetooth dual mode, DPI 400-4000, baterai 90 hari.',
    price: 235000,
    category: 'KOMPUTER_AKSESORIS' as const,
    stock: 35,
    imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&q=80',
    merchantId: 'user-merchant-1',
    latitude: -6.2480, longitude: 106.7850,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'prod-keyboard-mechanical',
    title: 'Keyboard Mekanikal 75% RGB Hotswap',
    description: 'Keyboard 75% layout, hot-swappable switch, backlight RGB per-key, gasket mount anti-bounce.',
    price: 850000,
    category: 'KOMPUTER_AKSESORIS' as const,
    stock: 15,
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&q=80',
    merchantId: 'user-merchant-1',
    latitude: -6.2088, longitude: 106.8456,
    createdAt: new Date(), updatedAt: new Date(),
  },
  // ─── PERAWATAN & KECANTIKAN ──────────────────────────────────────────────────
  {
    id: 'prod-serum-vitamin-c',
    title: 'Serum Vitamin C 20% Brightening',
    description: 'Serum wajah Vitamin C 20% + Niacinamide 5%, mencerahkan flek hitam, dermatologically tested.',
    price: 175000,
    category: 'PERAWATAN_KECANTIKAN' as const,
    stock: 80,
    imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80',
    merchantId: 'user-merchant-1',
    latitude: -6.1951, longitude: 106.8309,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'prod-masker-matcha',
    title: 'Clay Mask Matcha & Charcoal',
    description: 'Masker tanah liat dengan matcha Jepang dan charcoal aktif, membersihkan pori dan mengontrol minyak.',
    price: 89000,
    category: 'PERAWATAN_KECANTIKAN' as const,
    stock: 55,
    imageUrl: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400&q=80',
    merchantId: 'user-merchant-1',
    latitude: -6.2088, longitude: 106.8456,
    createdAt: new Date(), updatedAt: new Date(),
  },
  // ─── PERLENGKAPAN RUMAH ──────────────────────────────────────────────────────
  {
    id: 'prod-lilin-aromaterapi',
    title: 'Lilin Aromaterapi Soy Wax Vanilla',
    description: 'Lilin kedelai (soy wax) aromaterapi vanilla & sandalwood, burn time 55 jam, handcrafted Bali.',
    price: 125000,
    category: 'PERLENGKAPAN_RUMAH' as const,
    stock: 40,
    imageUrl: 'https://images.unsplash.com/photo-1602028915047-37269d1a73f7?w=400&q=80',
    merchantId: 'user-merchant-1',
    latitude: -8.4095, longitude: 115.1889,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'prod-organizer-anyaman',
    title: 'Keranjang Organizer Anyaman Rotan',
    description: 'Keranjang serbaguna dari rotan alam pilihan, bisa digunakan untuk pakaian, mainan, atau dekorasi.',
    price: 145000,
    category: 'PERLENGKAPAN_RUMAH' as const,
    stock: 25,
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
    merchantId: 'user-merchant-1',
    latitude: -7.2504, longitude: 112.7688,
    createdAt: new Date(), updatedAt: new Date(),
  },
  // ─── PAKAIAN WANITA ──────────────────────────────────────────────────────────
  {
    id: 'prod-dress-linen',
    title: 'Dress Linen Premium Midi Cut',
    description: 'Dress linen natural breathable midi cut, cocok untuk casual dan formal, tersedia 8 pilihan warna.',
    price: 325000,
    category: 'PAKAIAN_WANITA' as const,
    stock: 35,
    imageUrl: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=400&q=80',
    merchantId: 'user-merchant-1',
    latitude: -6.2318, longitude: 106.8243,
    createdAt: new Date(), updatedAt: new Date(),
  },
  // ─── FASHION MUSLIM ──────────────────────────────────────────────────────────
  {
    id: 'prod-gamis-syari',
    title: 'Gamis Syari Premium Wolfis',
    description: 'Gamis wolly crepe syari modern, jahitan rapi, tersedia ukuran S-3XL dan 10+ pilihan warna muda.',
    price: 285000,
    category: 'FASHION_MUSLIM' as const,
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4b984d?w=400&q=80',
    merchantId: 'user-merchant-1',
    latitude: -7.2504, longitude: 112.7688,
    createdAt: new Date(), updatedAt: new Date(),
  },
  // ─── SEPATU PRIA ─────────────────────────────────────────────────────────────
  {
    id: 'prod-sneaker-lokal',
    title: 'Sneaker Casual Kulit Lokal Bandung',
    description: 'Sepatu kulit sapi asli Bandung, sole rubber anti-slip, tersedia ukuran 38-44, handmade artisan.',
    price: 465000,
    category: 'SEPATU_PRIA' as const,
    stock: 20,
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
    merchantId: 'user-merchant-1',
    latitude: -6.9175, longitude: 107.6191,
    createdAt: new Date(), updatedAt: new Date(),
  },
  // ─── SEPATU WANITA ────────────────────────────────────────────────────────────
  {
    id: 'prod-flat-shoes',
    title: 'Flat Shoes Kulit Ular Python Motif',
    description: 'Sepatu flat wanita dengan bahan PU kulit motif python, ringan dan elegan untuk segala outfit.',
    price: 195000,
    category: 'SEPATU_WANITA' as const,
    stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&q=80',
    merchantId: 'user-merchant-1',
    latitude: -6.2318, longitude: 106.8243,
    createdAt: new Date(), updatedAt: new Date(),
  },
  // ─── KESEHATAN ───────────────────────────────────────────────────────────────
  {
    id: 'prod-madu-hutan',
    title: 'Madu Hutan Kalimantan Pure Raw',
    description: 'Madu hutan liar murni tanpa campuran dari lebah Apis dorsata Kalimantan, kaya enzim dan antioksidan.',
    price: 195000,
    category: 'KESEHATAN' as const,
    stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&q=80',
    merchantId: 'user-merchant-1',
    latitude: 0.5388, longitude: 116.4194,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'prod-suplemen-herbal',
    title: 'Kapsul Temulawak + Jahe Merah Organik',
    description: 'Suplemen herbal temulawak dan jahe merah organik, 60 kapsul, meningkatkan imunitas dan stamina.',
    price: 85000,
    category: 'KESEHATAN' as const,
    stock: 90,
    imageUrl: 'https://images.unsplash.com/photo-1612197527762-8cfb4b634b73?w=400&q=80',
    merchantId: 'user-merchant-1',
    latitude: -7.7972, longitude: 110.3688,
    createdAt: new Date(), updatedAt: new Date(),
  },
  // ─── HOBI & KOLEKSI ──────────────────────────────────────────────────────────
  {
    id: 'prod-miniatur-gundam',
    title: 'Gundam HG 1/144 Barbatos Lupus',
    description: 'Model kit Gundam HG 1:144 Iron Blooded Orphans series, lengkap dengan runner dan stiker detail.',
    price: 350000,
    category: 'HOBI_KOLEKSI' as const,
    stock: 15,
    imageUrl: 'https://images.unsplash.com/photo-1608306448197-e83633f1261c?w=400&q=80',
    merchantId: 'user-merchant-1',
    latitude: -6.2088, longitude: 106.8456,
    createdAt: new Date(), updatedAt: new Date(),
  },
  // ─── OLAHRAGA & OUTDOOR ──────────────────────────────────────────────────────
  {
    id: 'prod-carabiner-set',
    title: 'Carabiner Set Climbing CE Certified',
    description: 'Set carabiner aluminum alloy CE certified, kapasitas 22kN, untuk panjat tebing dan outdoor adventure.',
    price: 185000,
    category: 'OLAHRAGA_OUTDOOR' as const,
    stock: 40,
    imageUrl: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=400&q=80',
    merchantId: 'user-merchant-1',
    latitude: -6.9175, longitude: 107.6191,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'prod-yoga-mat',
    title: 'Yoga Mat NBR 10mm Anti-Slip Premium',
    description: 'Matras yoga NBR foam tebal 10mm, panjang 183cm, dengan tali pengait dan tas jinjing gratis.',
    price: 145000,
    category: 'OLAHRAGA_OUTDOOR' as const,
    stock: 55,
    imageUrl: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400&q=80',
    merchantId: 'user-merchant-1',
    latitude: -6.2088, longitude: 106.8456,
    createdAt: new Date(), updatedAt: new Date(),
  },
  // ─── OTOMOTIF ─────────────────────────────────────────────────────────────────
  {
    id: 'prod-wax-carnauba',
    title: 'Carnauba Wax Premium Detailing',
    description: 'Carnauba wax murni konsentrasi tinggi untuk detailing mobil, memberikan kilap deep gloss tahan 6 bulan.',
    price: 285000,
    category: 'OTOMOTIF' as const,
    stock: 25,
    imageUrl: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&q=80',
    merchantId: 'user-merchant-1',
    latitude: -6.2088, longitude: 106.8456,
    createdAt: new Date(), updatedAt: new Date(),
  },
  // ─── BUKU & ALAT TULIS ───────────────────────────────────────────────────────
  {
    id: 'prod-jurnal-kulit',
    title: 'Jurnal Kulit Asli A5 Handmade Bali',
    description: 'Buku jurnal kulit sapi asli A5 handmade Bali, 200 halaman dotted, tersedia dalam 6 warna pilihan.',
    price: 225000,
    category: 'BUKU_ALAT_TULIS' as const,
    stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80',
    merchantId: 'user-merchant-1',
    latitude: -8.4095, longitude: 115.1889,
    createdAt: new Date(), updatedAt: new Date(),
  },
  // ─── TAS WANITA ──────────────────────────────────────────────────────────────
  {
    id: 'prod-tote-canvas',
    title: 'Tote Bag Canvas Premium Motif Wayang',
    description: 'Totebag kanvas tebal 16oz dengan motif wayang batik eksklusif, ukuran jumbo A4, inner pocket.',
    price: 155000,
    category: 'TAS_WANITA' as const,
    stock: 45,
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80',
    merchantId: 'user-merchant-1',
    latitude: -7.7972, longitude: 110.3688,
    createdAt: new Date(), updatedAt: new Date(),
  },
  // ─── FOTOGRAFI ───────────────────────────────────────────────────────────────
  {
    id: 'prod-filter-nd',
    title: 'Filter ND Variable 67mm ND2-ND400',
    description: 'Filter ND variabel 67mm, optical glass multi-coated, cocok untuk video cinematic dan landscape.',
    price: 245000,
    category: 'FOTOGRAFI' as const,
    stock: 20,
    imageUrl: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&q=80',
    merchantId: 'user-merchant-1',
    latitude: -6.2088, longitude: 106.8456,
    createdAt: new Date(), updatedAt: new Date(),
  },
  // ─── VOUCHER ─────────────────────────────────────────────────────────────────
  {
    id: 'prod-voucher-kopi',
    title: 'Voucher Minuman Kopi 10x Prepaid',
    description: 'Voucher minum kopi 10x di jaringan Saloka Coffee, berlaku 90 hari, bisa digunakan untuk semua varian.',
    price: 120000,
    category: 'VOUCHER' as const,
    stock: 100,
    imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80',
    merchantId: 'user-merchant-1',
    latitude: -6.2088, longitude: 106.8456,
    createdAt: new Date(), updatedAt: new Date(),
  },
  // ─── DEALS SEKITAR ───────────────────────────────────────────────────────────
  {
    id: 'prod-deal-bakso',
    title: 'Promo Bakso Premium Pak Slamet 2 Porsi',
    description: 'Dapatkan 2 porsi bakso premium urat + sumsum Pak Slamet dengan harga spesial, hanya di Saloka.id.',
    price: 32000,
    category: 'DEALS_SEKITAR' as const,
    stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=400&q=80',
    merchantId: 'user-merchant-1',
    latitude: -6.9175, longitude: 107.6191,
    createdAt: new Date(), updatedAt: new Date(),
  },
  // ─── JASA & LAYANAN ──────────────────────────────────────────────────────────
  {
    id: 'prod-branding-service',
    title: 'Jasa Desain Branding UMKM Full Package',
    description: 'Paket desain identitas visual lengkap: logo, brosur, kemasan, dan media sosial template.',
    price: 1500000,
    category: 'JASA' as const,
    stock: 5,
    imageUrl: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&q=80',
    merchantId: 'user-merchant-1',
    latitude: -6.2200, longitude: 106.8500,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'prod-jasa-foto-produk',
    title: 'Jasa Fotografi Produk 20 Foto Studio',
    description: 'Sesi pemotretan produk di studio profesional, 20 foto editing clean background, ready social media.',
    price: 350000,
    category: 'JASA' as const,
    stock: 10,
    imageUrl: 'https://images.unsplash.com/photo-1452421822248-d4c2b47f0c81?w=400&q=80',
    merchantId: 'user-merchant-1',
    latitude: -6.2088, longitude: 106.8456,
    createdAt: new Date(), updatedAt: new Date(),
  },
  // ─── LOWONGAN KERJA ──────────────────────────────────────────────────────────
  {
    id: 'prod-loker-admin',
    title: '[LOKER] Admin Marketplace Freelance WFH',
    description: 'Dibutuhkan admin toko online freelance WFH, pengalaman Tokopedia/Shopee diutamakan, fee per project.',
    price: 0,
    category: 'KERJAAN' as const,
    stock: 3,
    imageUrl: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&q=80',
    merchantId: 'user-merchant-1',
    latitude: -6.2088, longitude: 106.8456,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'prod-loker-kurir',
    title: '[LOKER] Driver Kurir Motor Harian Bandung',
    description: 'Butuh driver kurir motor area Bandung kota, jam kerja fleksibel, gaji harian + bonus pengiriman.',
    price: 0,
    category: 'KERJAAN' as const,
    stock: 5,
    imageUrl: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&q=80',
    merchantId: 'user-merchant-1',
    latitude: -6.9175, longitude: 107.6191,
    createdAt: new Date(), updatedAt: new Date(),
  },

  // ─── PRODUK DARI MERCHANT-2 (Nusantara Fashion House) ────────────────────────
  {
    id: 'prod-batik-tulis-premium',
    title: 'Batik Tulis Sutra Premium Jogja',
    description: 'Batik tulis tangan asli Jogjakarta menggunakan bahan sutra murni. Motif parang rusak, semen, atau sesuai pesanan. Proses 3-4 minggu.',
    price: 1850000,
    category: 'PAKAIAN_PRIA' as const,
    stock: 8,
    imageUrl: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=400&q=80',
    merchantId: 'user-merchant-2',
    latitude: -7.7972, longitude: 110.3688,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'prod-kebaya-modern',
    title: 'Kebaya Modern Brokat Premium Set',
    description: 'Kebaya modern bahan brokat Prancis dengan rok satin. Tersedia warna pastel dan bold, ukuran XS-3XL, bisa custom.',
    price: 750000,
    category: 'PAKAIAN_WANITA' as const,
    stock: 20,
    imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4b984d?w=400&q=80',
    merchantId: 'user-merchant-2',
    latitude: -7.7972, longitude: 110.3688,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'prod-tenun-ntt',
    title: 'Kain Tenun Ikat NTT Asli Motif Sumba',
    description: 'Kain tenun ikat tangan asli dari Sumba Barat, motif kuda dan mamuli tradisional. 1 lembar kain ukuran 200x70cm.',
    price: 650000,
    category: 'TOKO' as const,
    stock: 15,
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
    merchantId: 'user-merchant-2',
    latitude: -7.7972, longitude: 110.3688,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'prod-tas-anyam-rotan',
    title: 'Tas Anyam Rotan Handmade Premium',
    description: 'Tas wanita anyaman rotan alam pilihan, finishing natural oil, ukuran medium 30x25cm, dengan tali kulit.',
    price: 385000,
    category: 'TAS_WANITA' as const,
    stock: 25,
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&q=80',
    merchantId: 'user-merchant-2',
    latitude: -7.7972, longitude: 110.3688,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'prod-jasa-jahit-custom',
    title: 'Jasa Jahit Baju Custom & Alterasi',
    description: 'Jasa jahit pakaian custom dari kain Anda sendiri atau bahan kami. Termasuk kemeja, gaun, jas, dan seragam. Pengerjaan 7-14 hari.',
    price: 350000,
    category: 'JASA' as const,
    stock: 10,
    imageUrl: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&q=80',
    merchantId: 'user-merchant-2',
    latitude: -7.7972, longitude: 110.3688,
    createdAt: new Date(), updatedAt: new Date(),
  },

  // ─── PRODUK DARI MERCHANT-3 (TechGeek Indonesia) ─────────────────────────────
  {
    id: 'prod-smartwatch-garmin',
    title: 'Smartwatch GPS Running Premium',
    description: 'Smartwatch GPS dengan sensor HR 24/7, SpO2, stress tracking, baterai 14 hari, waterproof 5ATM. Cocok untuk pelari dan atlet.',
    price: 2950000,
    category: 'ELEKTRONIK' as const,
    stock: 12,
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80',
    merchantId: 'user-merchant-3',
    latitude: -6.1751, longitude: 106.8650,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'prod-laptop-stand',
    title: 'Laptop Stand Aluminium Adjustable Pro',
    description: 'Stand laptop aluminium dengan 6 tingkat ketinggian, foldable ultra-tipis, kompatibel 11-17 inch, anti-slip silicone pad.',
    price: 185000,
    category: 'KOMPUTER_AKSESORIS' as const,
    stock: 55,
    imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&q=80',
    merchantId: 'user-merchant-3',
    latitude: -6.1751, longitude: 106.8650,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'prod-webcam-4k',
    title: 'Webcam 4K UHD Auto-Focus Ring Light Built-in',
    description: 'Webcam 4K 60fps dengan auto-focus AI, ring light built-in 3 mode warna, microphone noise-cancelling. Plug & play USB-C.',
    price: 785000,
    category: 'KOMPUTER_AKSESORIS' as const,
    stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=400&q=80',
    merchantId: 'user-merchant-3',
    latitude: -6.1751, longitude: 106.8650,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'prod-jasa-servis-hp',
    title: 'Jasa Servis HP & Tablet All Brand',
    description: 'Servis HP dan tablet semua merek: ganti LCD, baterai, IC, board rusak. Bergaransi 30 hari. Antar jemput area Jakarta.',
    price: 125000,
    category: 'JASA' as const,
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1601972599720-36938d4ecd31?w=400&q=80',
    merchantId: 'user-merchant-3',
    latitude: -6.1751, longitude: 106.8650,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'prod-jasa-it-support',
    title: 'Jasa IT Support & Maintenance Bisnis',
    description: 'Layanan IT support bulanan untuk bisnis: setup jaringan, install software, backup data, troubleshoot. Remote & on-site Jakarta-Depok.',
    price: 750000,
    category: 'JASA' as const,
    stock: 20,
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&q=80',
    merchantId: 'user-merchant-3',
    latitude: -6.1751, longitude: 106.8650,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'prod-jasa-setup-toko-online',
    title: 'Jasa Setup Toko Online Tokopedia/Shopee',
    description: 'Setup toko online lengkap: buat akun, optimasi profil, upload 20 produk dengan foto & deskripsi SEO, setting pengiriman & pembayaran.',
    price: 450000,
    category: 'JASA' as const,
    stock: 15,
    imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80',
    merchantId: 'user-merchant-3',
    latitude: -6.1751, longitude: 106.8650,
    createdAt: new Date(), updatedAt: new Date(),
  },

  // ─── PRODUK DARI MERCHANT-4 (Dapur Kreatif Nusantara) ────────────────────────
  {
    id: 'prod-rendang-premium',
    title: 'Rendang Daging Sapi Premium Padang 500g',
    description: 'Rendang daging sapi murni khas Padang, dimasak 8 jam dengan rempah pilihan, tahan 1 bulan tanpa kulkas. Halal MUI.',
    price: 125000,
    category: 'MAKANAN_MINUMAN' as const,
    stock: 60,
    imageUrl: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&q=80',
    merchantId: 'user-merchant-4',
    latitude: -7.2504, longitude: 112.7688,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'prod-keripik-tempe',
    title: 'Keripik Tempe Malang Renyah 250g',
    description: 'Keripik tempe khas Malang, dibuat dari tempe murni pilihan, 4 varian rasa: original, BBQ, balado, keju. Tanpa pengawet.',
    price: 28000,
    category: 'MAKANAN_MINUMAN' as const,
    stock: 120,
    imageUrl: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&q=80',
    merchantId: 'user-merchant-4',
    latitude: -7.2504, longitude: 112.7688,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'prod-kopi-toraja',
    title: 'Kopi Arabika Toraja Sapan 200g Whole Bean',
    description: 'Kopi Arabika Toraja Sapan single origin, proses natural, dipetik tangan. Profil rasa: dark chocolate, caramel, fruity finish.',
    price: 98000,
    category: 'MAKANAN_MINUMAN' as const,
    stock: 45,
    imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&q=80',
    merchantId: 'user-merchant-4',
    latitude: -7.2504, longitude: 112.7688,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'prod-jasa-catering',
    title: 'Jasa Catering Prasmanan 50-200 Pax',
    description: 'Paket catering prasmanan untuk acara kantor, pernikahan, dan ulang tahun. Menu masakan Jawa, Sunda, dan Padang. Include peralatan makan.',
    price: 85000,
    category: 'JASA' as const,
    stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=400&q=80',
    merchantId: 'user-merchant-4',
    latitude: -7.2504, longitude: 112.7688,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'prod-jasa-kue-custom',
    title: 'Jasa Kue Custom & Wedding Cake',
    description: 'Custom cake untuk ulang tahun, wedding, baby shower. Bahan premium, fondant atau buttercream. Konsultasi desain gratis. Min order 5 hari sebelum acara.',
    price: 450000,
    category: 'JASA' as const,
    stock: 15,
    imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80',
    merchantId: 'user-merchant-4',
    latitude: -7.2504, longitude: 112.7688,
    createdAt: new Date(), updatedAt: new Date(),
  },

  // ─── PRODUK DARI MERCHANT-5 (Kreasi Digital Studio) ─────────────────────────
  {
    id: 'prod-jasa-desain-logo',
    title: 'Jasa Desain Logo Profesional + Guideline',
    description: 'Desain logo profesional dengan 3 konsep awal, revisi unlimited, file AI/EPS/PNG/PDF, plus brand guideline warna & tipografi. Pengerjaan 5-7 hari.',
    price: 850000,
    category: 'JASA' as const,
    stock: 20,
    imageUrl: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&q=80',
    merchantId: 'user-merchant-5',
    latitude: -8.4095, longitude: 115.1889,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'prod-jasa-foto-produk-bali',
    title: 'Jasa Foto Produk Profesional Studio Bali',
    description: 'Sesi foto produk di studio profesional Bali: 30 foto editan clean background atau lifestyle. Termasuk video pendek 15 detik untuk Reels/TikTok.',
    price: 750000,
    category: 'JASA' as const,
    stock: 10,
    imageUrl: 'https://images.unsplash.com/photo-1452421822248-d4c2b47f0c81?w=400&q=80',
    merchantId: 'user-merchant-5',
    latitude: -8.4095, longitude: 115.1889,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'prod-jasa-kelola-sosmed',
    title: 'Jasa Kelola Media Sosial UMKM (1 Bulan)',
    description: 'Paket kelola Instagram + TikTok 1 bulan: 20 konten/bulan, copywriting, edit foto/video, schedule posting, reply komentar & DM.',
    price: 1500000,
    category: 'JASA' as const,
    stock: 8,
    imageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&q=80',
    merchantId: 'user-merchant-5',
    latitude: -8.4095, longitude: 115.1889,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'prod-jasa-video-iklan',
    title: 'Jasa Produksi Video Iklan 60 Detik',
    description: 'Video iklan profesional 60 detik: script, shooting, editing, motion graphic, colour grading. Cocok untuk FB Ads, IG Ads, dan TikTok Ads.',
    price: 2500000,
    category: 'JASA' as const,
    stock: 5,
    imageUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&q=80',
    merchantId: 'user-merchant-5',
    latitude: -8.4095, longitude: 115.1889,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'prod-jasa-website-umkm',
    title: 'Jasa Buat Website Toko Online UMKM',
    description: 'Website toko online profesional: domain + hosting 1 tahun, desain premium, katalog produk, form order WhatsApp, SEO dasar. Selesai 14 hari.',
    price: 3500000,
    category: 'JASA' as const,
    stock: 6,
    imageUrl: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=400&q=80',
    merchantId: 'user-merchant-5',
    latitude: -8.4095, longitude: 115.1889,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'prod-jasa-ads-management',
    title: 'Jasa Kelola Meta Ads & Google Ads (1 Bulan)',
    description: 'Kelola iklan Facebook, Instagram, dan Google Ads: riset audience, buat campaign, A/B testing kreatif, optimasi harian, laporan mingguan.',
    price: 2000000,
    category: 'JASA' as const,
    stock: 10,
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80',
    merchantId: 'user-merchant-5',
    latitude: -8.4095, longitude: 115.1889,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'prod-preset-lightroom',
    title: 'Preset Lightroom Premium Pack 50 Filter',
    description: 'Bundle 50 preset Lightroom professional: moody, bright airy, vintage, dark, dan food photography. Cocok untuk HP dan desktop.',
    price: 75000,
    category: 'FOTOGRAFI' as const,
    stock: 999,
    imageUrl: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&q=80',
    merchantId: 'user-merchant-5',
    latitude: -8.4095, longitude: 115.1889,
    createdAt: new Date(), updatedAt: new Date(),
  },

  // ─── PRODUK & JASA merchant-6 (Herbal Nusantara) ────────────────────────────
  {
    id: 'prod-madu-hitam',
    title: 'Madu Hitam Pahit Kalimantan 250ml',
    description: 'Madu hitam pahit asli Kalimantan, kaya antioksidan, proses cold extraction tanpa pemanas. Berkhasiat untuk imunitas dan stamina. Sertifikat uji lab tersedia.',
    price: 185000, category: 'KESEHATAN' as const, stock: 40,
    imageUrl: 'https://images.unsplash.com/photo-1587049352851-8d4e89133924?w=400&q=80',
    merchantId: 'user-merchant-6', latitude: -6.9147, longitude: 107.6098,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'prod-teh-herbal',
    title: 'Teh Herbal Racikan Jamu Premium 30 Sachet',
    description: 'Racikan teh herbal dari 12 tanaman rempah pilihan: jahe merah, kayu manis, cengkeh, dll. Untuk kesehatan pencernaan dan daya tahan tubuh.',
    price: 75000, category: 'KESEHATAN' as const, stock: 80,
    imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80',
    merchantId: 'user-merchant-6', latitude: -6.9147, longitude: 107.6098,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'prod-jasa-konsultasi-herbal',
    title: 'Jasa Konsultasi Herbal & Ramuan Tradisional Online',
    description: 'Konsultasi kesehatan dengan herbalis berpengalaman via WhatsApp/Zoom, termasuk rekomendasi tanaman herbal dan cara pemakaian yang tepat. Durasi 45 menit.',
    price: 150000, category: 'JASA' as const, stock: 25,
    imageUrl: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400&q=80',
    merchantId: 'user-merchant-6', latitude: -6.9147, longitude: 107.6098,
    createdAt: new Date(), updatedAt: new Date(),
  },

  // ─── PRODUK & JASA merchant-7 (Furnicraft Jepara) ───────────────────────────
  {
    id: 'prod-kursi-ukir-jepara',
    title: 'Kursi Tamu Ukir Jepara Set 3+1+1',
    description: 'Set kursi tamu kayu jati ukir Jepara, motif bunga klasik, finishing melamine glossy. Set terdiri dari: sofa 3 dudukan + 2 sofa 1 dudukan. Custom warna & motif.',
    price: 8500000, category: 'PERLENGKAPAN_RUMAH' as const, stock: 5,
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80',
    merchantId: 'user-merchant-7', latitude: -6.5896, longitude: 110.6688,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'prod-meja-makan-jati',
    title: 'Meja Makan Minimalis Kayu Jati 6 Kursi',
    description: 'Meja makan kayu jati solid minimalis modern, ukuran 180x90cm, finishing natural oil. Include 6 kursi makan. Pengiriman dalam Pulau Jawa gratis.',
    price: 6200000, category: 'PERLENGKAPAN_RUMAH' as const, stock: 8,
    imageUrl: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=400&q=80',
    merchantId: 'user-merchant-7', latitude: -6.5896, longitude: 110.6688,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'prod-jasa-custom-furniture',
    title: 'Jasa Custom Furniture Kayu Jati (by Order)',
    description: 'Pembuatan furniture kayu jati custom sesuai desain dan ukuran Anda: lemari, bufet, meja, rak, dll. Konsultasi desain gratis, estimasi harga dalam 24 jam.',
    price: 2500000, category: 'JASA' as const, stock: 10,
    imageUrl: 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=400&q=80',
    merchantId: 'user-merchant-7', latitude: -6.5896, longitude: 110.6688,
    createdAt: new Date(), updatedAt: new Date(),
  },

  // ─── PRODUK & JASA merchant-8 (AgroSegar Farm) ──────────────────────────────
  {
    id: 'prod-sayur-organik-box',
    title: 'Box Sayur Organik Mingguan 5kg',
    description: 'Paket sayur organik segar langsung dari kebun: bayam, kangkung, wortel, brokoli, tomat cherry, dll. Panen hari H, antar ke rumah Jabodetabek. Subscribe mingguan diskon 15%.',
    price: 95000, category: 'MAKANAN_MINUMAN' as const, stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80',
    merchantId: 'user-merchant-8', latitude: -6.5971, longitude: 106.8060,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'prod-bibit-sayur',
    title: 'Paket Bibit Sayur Organik 10 Jenis',
    description: 'Paket bibit sayur organik non-GMO: selada, kangkung, bayam merah, pakcoy, kale, tomat, cabai, terong, timun, labu. Cocok untuk urban farming dan hidroponik.',
    price: 65000, category: 'MAKANAN_MINUMAN' as const, stock: 100,
    imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80',
    merchantId: 'user-merchant-8', latitude: -6.5971, longitude: 106.8060,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'prod-jasa-urban-farming',
    title: 'Jasa Setup Urban Farming & Hidroponik Rumah',
    description: 'Setup sistem hidroponik di rumah atau kantor: NFT, DFT, atau wick system. Include instalasi, media tanam, nutrisi awal, dan pelatihan perawatan. Bergaransi 1 bulan.',
    price: 1800000, category: 'JASA' as const, stock: 15,
    imageUrl: 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=400&q=80',
    merchantId: 'user-merchant-8', latitude: -6.5971, longitude: 106.8060,
    createdAt: new Date(), updatedAt: new Date(),
  },

  // ─── PRODUK & JASA merchant-9 (Silver Artisan Celuk) ───────────────────────
  {
    id: 'prod-gelang-perak-bali',
    title: 'Gelang Perak Bali Motif Ukir 925 Sterling',
    description: 'Gelang perak murni 925 sterling silver handmade pengrajin Celuk Bali. Motif ukir bunga & daun tradisional. Tersedia ukuran 16-20cm, dengan box packaging premium.',
    price: 385000, category: 'AKSESORIS_FASHION' as const, stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1573408301185-9519f94816f0?w=400&q=80',
    merchantId: 'user-merchant-9', latitude: -8.5833, longitude: 115.2667,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'prod-kalung-perak-natural',
    title: 'Kalung Perak Natural Stone Moonstone',
    description: 'Kalung perak 925 dengan liontin batu moonstone asli, handmade artisan Bali. Panjang rantai 45cm adjustable. Tersedia dalam box kayu berukir.',
    price: 550000, category: 'AKSESORIS_FASHION' as const, stock: 20,
    imageUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&q=80',
    merchantId: 'user-merchant-9', latitude: -8.5833, longitude: 115.2667,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'prod-jasa-custom-perhiasan',
    title: 'Jasa Custom Perhiasan Perak (Wedding & Special)',
    description: 'Custom cincin tunangan, cincin nikah, atau perhiasan spesial lainnya dari perak 925. Desain sesuai keinginan, proses 7-14 hari. Sertifikat keaslian tersedia.',
    price: 850000, category: 'JASA' as const, stock: 10,
    imageUrl: 'https://images.unsplash.com/photo-1635767798638-3e25273a8236?w=400&q=80',
    merchantId: 'user-merchant-9', latitude: -8.5833, longitude: 115.2667,
    createdAt: new Date(), updatedAt: new Date(),
  },

  // ─── PRODUK & JASA merchant-10 (Konveksi Solo) ──────────────────────────────
  {
    id: 'prod-kaos-polo-sablon',
    title: 'Kaos Polo Custom Sablon DTF Min 12pcs',
    description: 'Kaos polo cotton combed 30s, sablon DTF full color tahan lama. Min order 12pcs, bisa beda ukuran dalam 1 order. Pengerjaan 5-7 hari kerja.',
    price: 85000, category: 'PAKAIAN_PRIA' as const, stock: 200,
    imageUrl: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&q=80',
    merchantId: 'user-merchant-10', latitude: -7.5755, longitude: 110.8243,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'prod-jaket-hoodie-custom',
    title: 'Jaket Hoodie Fleece Custom Logo Min 6pcs',
    description: 'Hoodie fleece premium 280gsm, bordir atau sablon logo sesuai permintaan. Tersedia warna hitam, navy, abu-abu. Min 6pcs, beda ukuran S-3XL OK.',
    price: 165000, category: 'PAKAIAN_PRIA' as const, stock: 150,
    imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=400&q=80',
    merchantId: 'user-merchant-10', latitude: -7.5755, longitude: 110.8243,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'prod-jasa-seragam-perusahaan',
    title: 'Jasa Produksi Seragam Perusahaan & Instansi',
    description: 'Produksi seragam kantor, sekolah, dan instansi pemerintah: kemeja, kaos, jaket, rompi. Bisa bordir logo, cetak nama, dan nomor punggung. Min 20pcs. Konsultasi gratis.',
    price: 95000, category: 'JASA' as const, stock: 100,
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    merchantId: 'user-merchant-10', latitude: -7.5755, longitude: 110.8243,
    createdAt: new Date(), updatedAt: new Date(),
  },

  // ─── PRODUK & JASA merchant-11 (EduKids Toy Studio) ────────────────────────
  {
    id: 'prod-puzzle-kayu-edukasi',
    title: 'Puzzle Kayu Edukasi Peta Indonesia',
    description: 'Puzzle kayu premium berbentuk peta Indonesia, 34 provinsi warna-warni, cat food-grade non-toxic, aman untuk anak 3+. Include buku panduan dan flashcard provinsi.',
    price: 145000, category: 'HOBI_KOLEKSI' as const, stock: 60,
    imageUrl: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400&q=80',
    merchantId: 'user-merchant-11', latitude: -7.2575, longitude: 112.7521,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'prod-balok-bangunan-kayu',
    title: 'Set Balok Bangunan Kayu 100 Pcs STEM',
    description: 'Set 100 balok bangunan kayu natural dari kayu mahoni, aneka bentuk geometri. Mendukung perkembangan motorik dan kreativitas anak. Ramah lingkungan, tanpa cat.',
    price: 195000, category: 'HOBI_KOLEKSI' as const, stock: 45,
    imageUrl: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&q=80',
    merchantId: 'user-merchant-11', latitude: -7.2575, longitude: 112.7521,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'prod-jasa-workshop-edukids',
    title: 'Jasa Workshop Craft & Edukasi Anak (Offline/Online)',
    description: 'Workshop seru untuk anak usia 4-12 tahun: membuat puzzle, melukis, origami, atau science experiment. Bisa offline di lokasi atau online via Zoom. Min 10 anak.',
    price: 75000, category: 'JASA' as const, stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&q=80',
    merchantId: 'user-merchant-11', latitude: -7.2575, longitude: 112.7521,
    createdAt: new Date(), updatedAt: new Date(),
  },

  // ─── PRODUK & JASA merchant-12 (Glow Local Skincare) ───────────────────────
  {
    id: 'prod-serum-vit-c-lokal',
    title: 'Serum Vitamin C 20% Brightening Local',
    description: 'Serum Vitamin C murni 20% stabilized L-ascorbic acid, diperkaya niacinamide dan hyaluronic acid. BPOM terdaftar, cocok semua jenis kulit. 30ml dengan dropper.',
    price: 125000, category: 'PERAWATAN_KECANTIKAN' as const, stock: 80,
    imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80',
    merchantId: 'user-merchant-12', latitude: -6.2146, longitude: 106.8451,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'prod-masker-kunyit',
    title: 'Masker Wajah Kunyit & Temulawak Clay Mask',
    description: 'Masker wajah clay berbahan kunyit dan temulawak pilihan, efektif mengecilkan pori dan mencerahkan. Formula 100% natural, tanpa paraben. 60ml jar.',
    price: 65000, category: 'PERAWATAN_KECANTIKAN' as const, stock: 120,
    imageUrl: 'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?w=400&q=80',
    merchantId: 'user-merchant-12', latitude: -6.2146, longitude: 106.8451,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'prod-jasa-konsultasi-skincare',
    title: 'Konsultasi Skincare Personal Online 1-on-1',
    description: 'Sesi konsultasi 60 menit dengan skincare specialist berpengalaman: analisis jenis kulit, rekomendasi routine, dan solusi masalah kulit spesifik. Via Zoom/WhatsApp.',
    price: 200000, category: 'JASA' as const, stock: 20,
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80',
    merchantId: 'user-merchant-12', latitude: -6.2146, longitude: 106.8451,
    createdAt: new Date(), updatedAt: new Date(),
  },

  // ─── PRODUK & JASA merchant-13 (PetCare Indonesia) ──────────────────────────
  {
    id: 'prod-makanan-kucing-premium',
    title: 'Makanan Kucing Grain-Free Premium 1kg',
    description: 'Cat food grain-free dengan protein ayam dan ikan 80%, tanpa jagung/kedelai/gandum. Formula untuk bulu sehat dan pencernaan optimal. Tersedia rasa tuna, salmon, ayam.',
    price: 95000, category: 'TOKO' as const, stock: 100,
    imageUrl: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=400&q=80',
    merchantId: 'user-merchant-13', latitude: -6.1944, longitude: 106.8229,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'prod-vitamin-anjing',
    title: 'Vitamin & Suplemen Anjing All-in-One 60 Tablet',
    description: 'Suplemen lengkap untuk anjing: multivitamin, omega 3&6, glucosamine, dan probiotik dalam 1 tablet. Untuk sendi, bulu, imunitas, dan pencernaan. Cocok semua ras.',
    price: 125000, category: 'KESEHATAN' as const, stock: 60,
    imageUrl: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80',
    merchantId: 'user-merchant-13', latitude: -6.1944, longitude: 106.8229,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'prod-jasa-grooming-pet',
    title: 'Jasa Pet Grooming Home Visit Jakarta',
    description: 'Grooming anjing & kucing ke rumah Anda: mandi, cukur, gunting kuku, bersihkan telinga. Area Jakarta Pusat, Selatan, Timur. Booking min H-1.',
    price: 150000, category: 'JASA' as const, stock: 20,
    imageUrl: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400&q=80',
    merchantId: 'user-merchant-13', latitude: -6.1944, longitude: 106.8229,
    createdAt: new Date(), updatedAt: new Date(),
  },

  // ─── PRODUK & JASA merchant-14 (Kost Premium Menteng) ──────────────────────
  {
    id: 'prod-kost-eksklusif',
    title: 'Sewa Kamar Kost AC WiFi Premium Menteng',
    description: 'Kamar kost mewah di Menteng Jakarta Pusat: AC, WiFi 100Mbps, kamar mandi dalam, dapur bersama, area parkir. Cocok mahasiswa & karyawan. Harga per bulan.',
    price: 3500000, category: 'TOKO' as const, stock: 3,
    imageUrl: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&q=80',
    merchantId: 'user-merchant-14', latitude: -6.1862, longitude: 106.8355,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'prod-jasa-cari-kost',
    title: 'Jasa Cari & Survey Kost/Kontrakan Sesuai Budget',
    description: 'Tim kami bantu cari dan survey kost/kontrakan sesuai lokasi, budget, dan kebutuhan Anda. Area Jabodetabek. Gratis jika tidak cocok. Fee sukses Rp 150rb.',
    price: 150000, category: 'JASA' as const, stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&q=80',
    merchantId: 'user-merchant-14', latitude: -6.1862, longitude: 106.8355,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'prod-jasa-interior-kamar',
    title: 'Jasa Dekorasi & Interior Kamar Kost/Apartemen',
    description: 'Transformasi kamar kost atau apartemen Anda menjadi nyaman dan instagramable. Konsultasi desain, pemilihan furnitur, dekorasi, instalasi. Area Jabodetabek.',
    price: 1200000, category: 'JASA' as const, stock: 15,
    imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80',
    merchantId: 'user-merchant-14', latitude: -6.1862, longitude: 106.8355,
    createdAt: new Date(), updatedAt: new Date(),
  },

  // ─── PRODUK & JASA merchant-15 (Bengkel Pro Autocare) ──────────────────────
  {
    id: 'prod-aksesoris-motor',
    title: 'Paket Aksesoris Motor LED Premium Set',
    description: 'Paket aksesoris motor premium: lampu LED DRL, knalpot racing, handle bar custom, spion oval, footstep racing. Kompatibel Honda, Yamaha, Suzuki. Gratis pasang di bengkel.',
    price: 850000, category: 'OTOMOTIF' as const, stock: 25,
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
    merchantId: 'user-merchant-15', latitude: -7.2830, longitude: 112.7372,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'prod-oli-mesin-premium',
    title: 'Oli Mesin Full Synthetic 10W-40 1 Liter',
    description: 'Oli mesin full synthetic kualitas premium, SAE 10W-40, untuk motor 4-tak segala merek. Tahan suhu ekstrem, mengurangi gesekan mesin, umur pakai lebih lama.',
    price: 75000, category: 'OTOMOTIF' as const, stock: 200,
    imageUrl: 'https://images.unsplash.com/photo-1635273051427-81d26c65eb97?w=400&q=80',
    merchantId: 'user-merchant-15', latitude: -7.2830, longitude: 112.7372,
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'prod-jasa-servis-motor',
    title: 'Jasa Servis Motor Tune-Up Lengkap + Ganti Oli',
    description: 'Tune-up lengkap motor: bersih karburator/injeksi, stel klep, ganti busi, ganti filter udara, ganti oli mesin + filter. Garansi servis 1 bulan. Antar jemput area Surabaya.',
    price: 185000, category: 'JASA' as const, stock: 40,
    imageUrl: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&q=80',
    merchantId: 'user-merchant-15', latitude: -7.2830, longitude: 112.7372,
    createdAt: new Date(), updatedAt: new Date(),
  },
]

const mockCourses = [
  {
    id: 'course-brand-1',
    title: 'Mastering Digital Branding & Packaging',
    description: 'Panduan lengkap membuat visual identity kelas atas dan kemasan premium yang memikat pelanggan high-end. Dari logo, tipografi, hingga strategi storytelling brand.',
    coverImage: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80',
    accessRequired: 'Diamond',
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'course-sourdough-1',
    title: 'Artisan Baking & Fermentation Science',
    description: 'Sains di balik ragi alami, teknik folding, pembentukan gluten, dan cara memanggang roti berkualitas gourmet dari dapur skala UMKM.',
    coverImage: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc7b?w=800&q=80',
    accessRequired: 'Platinum',
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'course-digital-marketing',
    title: 'Digital Marketing & Social Media Mastery',
    description: 'Strategi pemasaran digital untuk UMKM: Reels, TikTok, Meta Ads, Google SEO, dan copywriting persuasif yang mengkonversi follower menjadi pembeli setia.',
    coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
    accessRequired: 'Gold',
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'course-kopi-bisnis',
    title: 'Bisnis Kopi: Dari Biji ke Cangkir Profit',
    description: 'Kursus lengkap bisnis kopi UMKM: memilih biji green bean, memahami roasting profile, membuka warung kopi/kedai, dan scaling ke franchise.',
    coverImage: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&q=80',
    accessRequired: 'Gold',
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'course-ecommerce-pro',
    title: 'E-Commerce Pro: Jualan Online Tanpa Modal Besar',
    description: 'Panduan berjualan di marketplace (Tokopedia, Shopee, TikTok Shop) dan membangun toko online sendiri. Termasuk strategi foto produk, pengelolaan stok, dan auto-respond.',
    coverImage: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
    accessRequired: 'Gold',
    createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'course-keuangan-umkm',
    title: 'Keuangan UMKM: Laporan & Cash Flow',
    description: 'Cara mudah mengelola keuangan usaha kecil: membuat laporan laba-rugi sederhana, memahami arus kas, menetapkan harga jual yang benar, dan mengajukan pinjaman UMKM.',
    coverImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80',
    accessRequired: 'Gold',
    createdAt: new Date(), updatedAt: new Date(),
  },
]

const mockLessons = [
  // course-brand-1
  { id: 'lesson-brand-1', courseId: 'course-brand-1', title: '1. Memahami Audiens Premium & Technical Luxury', content: 'Bagaimana memposisikan brand UMKM Anda agar memiliki daya tarik luxury yang kuat di kalangan menengah ke atas.', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: 360, orderIndex: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: 'lesson-brand-2', courseId: 'course-brand-1', title: '2. Memilih Palette Warna & Tipografi Sora/Inter', content: 'Mengimplementasikan kombinasi warna gelap/gold dan layout minimalis bergaya Linear pada aset produk digital.', videoUrl: 'https://www.w3schools.com/html/movie.mp4', duration: 480, orderIndex: 2, createdAt: new Date(), updatedAt: new Date() },
  { id: 'lesson-brand-3', courseId: 'course-brand-1', title: '3. Desain Logo di Canva & Figma untuk UMKM', content: 'Langkah-langkah membuat logo sederhana namun berdampak tinggi menggunakan Canva Pro atau Figma gratis.', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: 540, orderIndex: 3, createdAt: new Date(), updatedAt: new Date() },
  { id: 'lesson-brand-4', courseId: 'course-brand-1', title: '4. Desain Kemasan Produk Print-Ready', content: 'Membuat template kemasan produk (label, box, sticker) yang siap cetak dengan dimensi dan bleed yang benar.', videoUrl: 'https://www.w3schools.com/html/movie.mp4', duration: 420, orderIndex: 4, createdAt: new Date(), updatedAt: new Date() },
  // course-sourdough-1
  { id: 'lesson-sourdough-1', courseId: 'course-sourdough-1', title: '1. Membuat Starter Ragi Alami (Lievito Madre)', content: 'Panduan hari demi hari memberi makan tepung dan air untuk menangkap ragi liar yang sehat.', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: 600, orderIndex: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: 'lesson-sourdough-2', courseId: 'course-sourdough-1', title: '2. Teknik Autolyse, Bulk Fermentation & Folding', content: 'Memahami hidrasi adonan, teknik stretch & fold, dan cold retarding agar roti memiliki tekstur pori yang sempurna.', videoUrl: 'https://www.w3schools.com/html/movie.mp4', duration: 720, orderIndex: 2, createdAt: new Date(), updatedAt: new Date() },
  { id: 'lesson-sourdough-3', courseId: 'course-sourdough-1', title: '3. Shaping & Scoring Teknik Artisan', content: 'Cara membentuk boule dan batard yang tegang (tight crumb) serta teknik skoring (goresan pisau) yang artistik.', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: 480, orderIndex: 3, createdAt: new Date(), updatedAt: new Date() },
  // course-digital-marketing
  { id: 'lesson-dm-1', courseId: 'course-digital-marketing', title: '1. Algoritma Instagram & TikTok untuk UMKM', content: 'Memahami cara kerja algoritma dan taktik organik untuk menjangkau ribuan potensi pembeli tanpa biaya ads.', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: 450, orderIndex: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: 'lesson-dm-2', courseId: 'course-digital-marketing', title: '2. Membuat Konten Reels Viral dengan HP', content: 'Formula konten viral: hook 3 detik, transisi, B-Roll, dan call-to-action yang mendorong share dan purchase.', videoUrl: 'https://www.w3schools.com/html/movie.mp4', duration: 390, orderIndex: 2, createdAt: new Date(), updatedAt: new Date() },
  { id: 'lesson-dm-3', courseId: 'course-digital-marketing', title: '3. Meta Ads Tingkat Pemula hingga Lanjutan', content: 'Panduan lengkap Meta Business Suite: targeting audience, budgeting harian, A/B testing creative, dan mengukur ROAS.', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: 660, orderIndex: 3, createdAt: new Date(), updatedAt: new Date() },
  // course-kopi-bisnis
  { id: 'lesson-kopi-1', courseId: 'course-kopi-bisnis', title: '1. Mengenal Varietas Biji Kopi Nusantara', content: 'Perbedaan antara Arabika, Robusta, dan Liberika dari berbagai daerah: Gayo, Toraja, Flores, Kintamani, Wamena.', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: 420, orderIndex: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: 'lesson-kopi-2', courseId: 'course-kopi-bisnis', title: '2. Roasting: Light, Medium, Dark & Specialty', content: 'Prinsip dasar roasting, membaca first crack dan second crack, dan cara menentukan profil roast yang sesuai target pasar.', videoUrl: 'https://www.w3schools.com/html/movie.mp4', duration: 540, orderIndex: 2, createdAt: new Date(), updatedAt: new Date() },
  { id: 'lesson-kopi-3', courseId: 'course-kopi-bisnis', title: '3. Membuka Kedai Kopi Modal Kecil', content: 'Menghitung modal awal, memilih lokasi strategis, SOP pelayanan, dan strategi retensi pelanggan tetap.', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: 600, orderIndex: 3, createdAt: new Date(), updatedAt: new Date() },
  // course-ecommerce-pro
  { id: 'lesson-ec-1', courseId: 'course-ecommerce-pro', title: '1. Optimasi Listing Produk Tokopedia & Shopee', content: 'Cara menulis judul produk dengan keyword yang dicari, memilih kategori, dan mengatur harga bersaing secara strategis.', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: 480, orderIndex: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: 'lesson-ec-2', courseId: 'course-ecommerce-pro', title: '2. Fotografi Produk Profesional dengan HP', content: 'Setup studio mini di rumah dengan budget minim, teknik lighting natural, dan editing foto agar terlihat premium.', videoUrl: 'https://www.w3schools.com/html/movie.mp4', duration: 360, orderIndex: 2, createdAt: new Date(), updatedAt: new Date() },
  // course-keuangan-umkm
  { id: 'lesson-keu-1', courseId: 'course-keuangan-umkm', title: '1. Memisahkan Keuangan Usaha dan Pribadi', content: 'Mengapa rekening terpisah penting, cara membuka rekening bisnis, dan menetapkan gaji untuk diri sendiri sebagai pemilik.', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: 300, orderIndex: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: 'lesson-keu-2', courseId: 'course-keuangan-umkm', title: '2. Membuat Laporan Laba-Rugi Sederhana', content: 'Template Google Sheets gratis untuk mencatat pemasukan, pengeluaran, HPP, dan laba bersih mingguan/bulanan.', videoUrl: 'https://www.w3schools.com/html/movie.mp4', duration: 420, orderIndex: 2, createdAt: new Date(), updatedAt: new Date() },
  { id: 'lesson-keu-3', courseId: 'course-keuangan-umkm', title: '3. Cara Menghitung Harga Jual yang Tepat', content: 'Formula HPP + biaya overhead + profit margin yang sehat. Bagaimana menyesuaikan harga tanpa takut kehilangan pelanggan.', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: 360, orderIndex: 3, createdAt: new Date(), updatedAt: new Date() },
]

const mockProgress: Array<{ userId: string; lessonId: string; completed: boolean }> = [
  { userId: 'user-customer-1', lessonId: 'lesson-brand-1', completed: true },
  { userId: 'user-customer-1', lessonId: 'lesson-dm-1', completed: true },
  { userId: 'user-customer-1', lessonId: 'lesson-dm-2', completed: true },
  { userId: 'user-merchant-1', lessonId: 'lesson-sourdough-1', completed: true },
  { userId: 'user-merchant-1', lessonId: 'lesson-sourdough-2', completed: true },
  { userId: 'user-merchant-1', lessonId: 'lesson-kopi-1', completed: true },
  { userId: 'user-merchant-1', lessonId: 'lesson-kopi-2', completed: true },
]
const mockGroups = [
  {
    id: 'group-umum',
    name: 'Forum Umum Saloka.id',
    description: 'Grup diskusi utama pelaku usaha Saloka.id. Bagikan pengalaman, tips bisnis, tanya jawab seputar perpajakan, hukum, logistik, dan pengembangan startup Anda.',
    coverUrl: null,
    avatarUrl: null,
    isSuspended: false,
    adminId: 'user-admin-1', // Super Admin
    createdAt: new Date(Date.now() - 3600000 * 240),
    updatedAt: new Date(Date.now() - 3600000 * 240),
  },
  {
    id: 'group-kopi',
    name: 'Pedagang Kopi & Roastery Indonesia',
    description: 'Tempat bertemunya petani kopi, pemilik warung kopi, roastery artisan, dan pecinta kopi se-Indonesia. Diskusikan harga biji kopi, teknik roasting, dan review alat kopi.',
    coverUrl: null,
    avatarUrl: null,
    isSuspended: false,
    adminId: 'user-merchant-1', // Kala Sourdough
    createdAt: new Date(Date.now() - 3600000 * 120),
    updatedAt: new Date(Date.now() - 3600000 * 120),
  },
  {
    id: 'group-fashion',
    name: 'Komunitas Industri Fashion & Tekstil',
    description: 'Diskusikan supplier kain murah Bandung, pola jahitan premium, trend warna, konveksi seragam, sablon digital, dan ekspor produk garment lokal.',
    coverUrl: null,
    avatarUrl: null,
    isSuspended: false,
    adminId: 'user-merchant-2', // Nusantara Fashion
    createdAt: new Date(Date.now() - 3600000 * 80),
    updatedAt: new Date(Date.now() - 3600000 * 80),
  }
]

const mockGroupMembers = [
  // Seed all mock users to group-umum
  ...mockUsers.map((u, i) => ({
    id: `gm-seed-${i}`,
    groupId: 'group-umum',
    userId: u.id,
    createdAt: new Date()
  })),
  // Seed some users to group-kopi
  { id: 'gm-k1', groupId: 'group-kopi', userId: 'user-merchant-1', createdAt: new Date() },
  { id: 'gm-k2', groupId: 'group-kopi', userId: 'user-customer-1', createdAt: new Date() },
  { id: 'gm-k3', groupId: 'group-kopi', userId: 'user-merchant-3', createdAt: new Date() },
  // Seed some to group-fashion
  { id: 'gm-f1', groupId: 'group-fashion', userId: 'user-merchant-2', createdAt: new Date() },
  { id: 'gm-f2', groupId: 'group-fashion', userId: 'user-customer-1', createdAt: new Date() },
]

const mockPosts = [
  {
    id: 'post-komunitas-tukang-1',
    title: '[Komunitas Tukang] Tips negosiasi harga material bangunan 2026',
    content: 'Halo teman-teman tukang dan kontraktor! Saya mau berbagi tips: coba bandingkan harga di 3 toko bangunan sebelum beli. Biasanya ada selisih 15-20% untuk pasir, batu, dan besi. Siapa punya pengalaman beli grosir langsung ke pabrik?',
    authorId: 'user-merchant-1',
    createdAt: new Date(Date.now() - 3600000 * 1),
    updatedAt: new Date(Date.now() - 3600000 * 1),
  },
  {
    id: 'post-komunitas-kopi-1',
    title: '[Komunitas Pedagang Kopi] Roaster lokal vs import — mana lebih untung?',
    content: 'Setelah 2 tahun jualan kopi, saya akhirnya memilih roaster lokal Gayo. Margin lebih besar, pengiriman lebih cepat, dan bisa custom roast level sesuai pesanan. Teman-teman yang jual kopi, gimana pengalaman kalian?',
    authorId: 'user-affiliate-1',
    createdAt: new Date(Date.now() - 3600000 * 3),
    updatedAt: new Date(Date.now() - 3600000 * 3),
  },
  {
    id: 'post-komunitas-kuliner-1',
    title: '[Komunitas Kuliner] Cara dapetin sertifikat PIRT untuk produk rumahan',
    content: 'Proses sertifikasi PIRT (Pangan Industri Rumah Tangga) di dinas setempat ternyata tidak sesulit yang dibayangkan. Butuh sekitar 2 minggu dan biaya sekitar Rp 300rb. Saya bagikan langkah-langkah detailnya di sini.',
    authorId: 'user-customer-1',
    createdAt: new Date(Date.now() - 3600000 * 6),
    updatedAt: new Date(Date.now() - 3600000 * 6),
  },
  {
    id: 'post-komunitas-fashion-1',
    title: '[Komunitas Fashion Lokal] Supplier bahan kain murah berkualitas Bandung',
    content: 'Mau share info supplier kain katun premium di Pasar Baru Bandung. Minimum order 5 meter, harga mulai Rp 18.000/meter untuk katun TC 133x72. Cocok banget untuk yang baru mulai usaha baju. DM kalau butuh kontaknya!',
    authorId: 'user-merchant-1',
    createdAt: new Date(Date.now() - 3600000 * 10),
    updatedAt: new Date(Date.now() - 3600000 * 10),
  },
  {
    id: 'post-1',
    title: 'Bagaimana cara menaikkan harga produk UMKM tanpa kehilangan pelanggan?',
    content: 'Saya memiliki usaha bakery skala rumahan, ingin mengubah kemasan menjadi premium/luxury dan menaikkan harga jual 50%. Ada saran untuk brandingnya? Sudah coba beberapa kali tapi selalu ada pelanggan yang komplain harga naik.',
    authorId: 'user-customer-1',
    createdAt: new Date(Date.now() - 3600000 * 2),
    updatedAt: new Date(Date.now() - 3600000 * 2),
  },
  {
    id: 'post-2',
    title: 'Panduan lengkap mendaftarkan sertifikasi Halal dan BPOM 2026',
    content: 'Halo kawan-kawan, berikut adalah langkah demi langkah gratis bagi pelaku UMKM di Saloka untuk mendaftarkan merek produk makanan di sistem dinas. Proses online bisa melalui website BPOM dan Halal.go.id. Anggaran siapkan sekitar Rp 500rb-2jt tergantung jenis produk.',
    authorId: 'user-merchant-1',
    createdAt: new Date(Date.now() - 3600000 * 12),
    updatedAt: new Date(Date.now() - 3600000 * 12),
  },
  {
    id: 'post-komunitas-tukang-2',
    title: '[Komunitas Tukang] Harga borongan cat rumah per meter persegi 2026',
    content: 'Update harga borongan cat per Juni 2026: cat dinding dalam Rp 35-45rb/m², luar Rp 50-65rb/m² sudah termasuk cat 2 lapis. Cat kayu Rp 40-55rb/m². Harga sudah naik ~10% dari tahun lalu karena biaya tukang naik.',
    authorId: 'user-affiliate-1',
    createdAt: new Date(Date.now() - 3600000 * 20),
    updatedAt: new Date(Date.now() - 3600000 * 20),
  },
  {
    id: 'post-komunitas-digital-1',
    title: '[Komunitas Digital] Tips jualan di TikTok Shop tanpa stok barang (dropship)',
    content: 'Sudah 3 bulan jualan di TikTok Shop dengan sistem dropship dari supplier Cina dan lokal. Omzet bulan ini Rp 8 juta, profit bersih sekitar 25%. Kuncinya: pilih produk trending, buat konten review jujur, dan respon komentar cepat.',
    authorId: 'user-customer-1',
    createdAt: new Date(Date.now() - 3600000 * 28),
    updatedAt: new Date(Date.now() - 3600000 * 28),
  },
  // ─── Posts dari 10 merchant baru ────────────────────────────────────────────
  {
    id: 'post-herbal-tips',
    title: '🌿 Herbal Nusantara: 5 Tanaman Obat yang Wajib Ada di Rumah UMKM Kuliner',
    content: 'Sebagai pengusaha herbal dari Bandung, saya mau share 5 tanaman obat yang selalu saya rekomendasikan: 1) Jahe merah — anti-inflamasi dan imunitas, 2) Temulawak — kesehatan hati, 3) Kunyit — antioksidan alami, 4) Sambiloto — diabetes dan kolesterol, 5) Kayu manis — gula darah stabil. Semua bisa jadi produk UMKM yang laku! Siapa yang sudah coba produksi sendiri?',
    authorId: 'user-merchant-6',
    createdAt: new Date(Date.now() - 3600000 * 5),
    updatedAt: new Date(Date.now() - 3600000 * 5),
  },
  {
    id: 'post-furni-branding',
    title: '🪑 Furnicraft Jepara: Cara kami jual kursi Rp 8 juta dan tetap laris di marketplace',
    content: 'Banyak yang tanya, gimana bisa jual produk mahal di marketplace yang penuh perang harga? Jawaban kami: storytelling + foto profesional + video proses pembuatan. Kami rekam pengrajin ukir kami yang sudah 30 tahun berkarya, lalu upload ke TikTok dan Instagram. Hasilnya? Inquiry dari Singapura dan Malaysia juga masuk! Kunci: jual keunikan dan proses, bukan hanya produk.',
    authorId: 'user-merchant-7',
    createdAt: new Date(Date.now() - 3600000 * 8),
    updatedAt: new Date(Date.now() - 3600000 * 8),
  },
  {
    id: 'post-agro-urban',
    title: '🥦 AgroSegar: Urban farming bisa dimulai dengan lahan 2x2 meter!',
    content: 'Banyak yang mikir urban farming butuh lahan luas. Padahal dengan sistem vertikal di balkon atau rooftop 2x2 meter, bisa panen 5-8 kg sayur per minggu! Saya mulai dari pot bekas dan paralon PVC, sekarang sudah supply 20+ keluarga langganan di Bogor. Yang mau belajar, saya buka workshop online setiap Sabtu. Gratis untuk member Saloka.id!',
    authorId: 'user-merchant-8',
    createdAt: new Date(Date.now() - 3600000 * 14),
    updatedAt: new Date(Date.now() - 3600000 * 14),
  },
  {
    id: 'post-silver-ekspor',
    title: '💍 Silver Artisan Celuk: Pengalaman ekspor perhiasan perak ke Eropa pertama kali',
    content: 'Tahun lalu kami berhasil ekspor pertama ke buyer dari Belanda — 200 pcs cincin dan gelang perak. Prosesnya tidak mudah: perlu sertifikat uji kandungan logam, phytosanitary, dan invoice khusus. Tapi hasilnya worth it! Margin ekspor 3x lipat dari penjualan lokal. Siapa yang tertarik diskusi soal proses ekspor kerajinan? Saya siap share pengalaman!',
    authorId: 'user-merchant-9',
    createdAt: new Date(Date.now() - 3600000 * 22),
    updatedAt: new Date(Date.now() - 3600000 * 22),
  },
  {
    id: 'post-konveksi-tips',
    title: '👕 Konveksi Solo: Cara hitung harga jual konveksi agar tidak rugi',
    content: 'Banyak pemula konveksi yang rugi karena salah hitung HPP. Formula sederhana: HPP = (Biaya Bahan + Upah Jahit + Overhead + Sablon/Bordir) ÷ Jumlah Pcs. Jangan lupa tambah margin 30-40% untuk profit. Contoh: kaos polos bahan Rp 15rb, jahit Rp 8rb, overhead Rp 3rb, sablon Rp 12rb = HPP Rp 38rb. Jual minimal Rp 55rb untuk margin sehat. Semoga membantu!',
    authorId: 'user-merchant-10',
    createdAt: new Date(Date.now() - 3600000 * 30),
    updatedAt: new Date(Date.now() - 3600000 * 30),
  },
  {
    id: 'post-edukids-bisnis',
    title: '🧩 EduKids: Bisnis mainan edukasi — pasar yang masih sangat terbuka lebar!',
    content: 'Riset kami menunjukkan pasar mainan edukasi anak Indonesia tumbuh 18% per tahun. Sayangnya 80% masih diisi produk impor. Ini peluang besar untuk UMKM lokal! Kunci sukses kami: 1) Bahan ramah lingkungan (kayu mahoni lokal), 2) Desain bermuatan budaya Indonesia, 3) Kemasan premium dengan panduan bermain. Produk pertama kami puzzle peta Indonesia langsung sold out di minggu pertama!',
    authorId: 'user-merchant-11',
    createdAt: new Date(Date.now() - 3600000 * 36),
    updatedAt: new Date(Date.now() - 3600000 * 36),
  },
  {
    id: 'post-skincare-bpom',
    title: '✨ Glow Local: Cara daftar BPOM produk skincare UMKM — panduan lengkap 2026',
    content: 'Setelah 8 bulan perjuangan, serum vitamin C kami akhirnya dapat nomor BPOM! Ini yang perlu disiapkan: 1) Sertifikat CPKB (Cara Produksi Kosmetik yang Baik), 2) Uji stabilitas produk di lab terakreditasi (±Rp 3-5 juta), 3) Uji keamanan (patch test), 4) Notifikasi online di e-bpom.pom.go.id (Rp 100rb/produk). Total biaya sekitar Rp 8-15 juta tapi SANGAT worth it untuk kepercayaan konsumen!',
    authorId: 'user-merchant-12',
    createdAt: new Date(Date.now() - 3600000 * 48),
    updatedAt: new Date(Date.now() - 3600000 * 48),
  },
  {
    id: 'post-petcare-tips',
    title: '🐾 PetCare: 5 tanda kucing/anjing Anda butuh grooming segera',
    content: 'Sebagai pet groomer profesional, ini tanda hewan peliharaan Anda butuh grooming: 1) Bulu kusut dan berbau, 2) Kuku panjang sampai melengkung, 3) Telinga berbau atau kotor, 4) Kulit gatal-gatal dan berketombe, 5) Mata berair terus-menerus. Grooming rutin bukan cuma soal penampilan, tapi kesehatan! Anjing idealnya grooming setiap 4-6 minggu, kucing setiap 6-8 minggu.',
    authorId: 'user-merchant-13',
    createdAt: new Date(Date.now() - 3600000 * 55),
    updatedAt: new Date(Date.now() - 3600000 * 55),
  },
  {
    id: 'post-properti-kost',
    title: '🏠 Tips investasi kost-kostan untuk pemula UMKM properti',
    content: 'Kost-kostan adalah passive income terbaik untuk UMKM properti. Tips dari pengalaman 5 tahun: 1) Pilih lokasi dekat kampus/perkantoran, 2) Minimal 10 kamar untuk break-even yang baik, 3) Fasilitaskan AC + WiFi = bisa pasang harga premium, 4) Manajemen via aplikasi (ada banyak yang gratis), 5) ROI rata-rata 8-12% per tahun. Siapa yang tertarik mulai bisnis properti skala kecil?',
    authorId: 'user-merchant-14',
    createdAt: new Date(Date.now() - 3600000 * 62),
    updatedAt: new Date(Date.now() - 3600000 * 62),
  },
  {
    id: 'post-bengkel-otomotif',
    title: '🔧 Bengkel Pro: Tips rawat motor agar awet 10 tahun+ — dari mekanik berpengalaman',
    content: 'Sebagai bengkel dengan 15 tahun pengalaman, ini rahasia motor awet: 1) Ganti oli setiap 2.000km atau 2 bulan (jangan nunggu hitam!), 2) Cek tekanan ban setiap 2 minggu, 3) Servis rutin setiap 6.000km, 4) Jangan abaikan bunyi aneh — lebih murah servis awal daripada rusak parah, 5) Pakai spare part ori/KW1, jangan KW3. Motor dengan perawatan baik bisa bertahan 15-20 tahun!',
    authorId: 'user-merchant-15',
    createdAt: new Date(Date.now() - 3600000 * 70),
    updatedAt: new Date(Date.now() - 3600000 * 70),
  },
]

const mockComments = [
  {
    id: 'comment-1',
    postId: 'post-1',
    content: 'Coba gunakan box tebal berserat hitam matte, lalu gunakan tinta foil emas (gold hotprint) untuk logo. Sentuhan visual ini instan membuat produk terasa 5x lebih berharga.',
    authorId: 'user-merchant-1',
    createdAt: new Date(Date.now() - 3600000),
    updatedAt: new Date(Date.now() - 3600000),
  },
  {
    id: 'comment-2',
    postId: 'post-1',
    content: 'Tambahkan cerita (storytelling) di label kemasan: asal bahan baku, tanggal produksi, dan dedikasi tangan-tangan artisan. Pelanggan premium membeli VALUE, bukan sekadar produk.',
    authorId: 'user-affiliate-1',
    createdAt: new Date(Date.now() - 3600000 * 0.5),
    updatedAt: new Date(Date.now() - 3600000 * 0.5),
  },
  {
    id: 'comment-3',
    postId: 'post-komunitas-tukang-1',
    content: 'Saya biasanya langsung ke distributor di kawasan industri. Hemat 20-30% dibanding toko bangunan eceran. Butuh mobil pick-up tapi worth it kalau pesan banyak.',
    authorId: 'user-customer-1',
    createdAt: new Date(Date.now() - 3600000 * 0.75),
    updatedAt: new Date(Date.now() - 3600000 * 0.75),
  },
  {
    id: 'comment-4',
    postId: 'post-komunitas-kopi-1',
    content: 'Setuju banget! Roaster lokal juga lebih mudah dikomunikasikan soal SCA score dan flavor notes. Saya pakai roaster dari Toraja, bisa order mulai 2kg. Quality control jauh lebih ketat dari import.',
    authorId: 'user-customer-1',
    createdAt: new Date(Date.now() - 3600000 * 2.5),
    updatedAt: new Date(Date.now() - 3600000 * 2.5),
  },
  {
    id: 'comment-5',
    postId: 'post-2',
    content: 'Saya sudah coba daftar PIRT bulan lalu. Prosesnya ada pelatihan keamanan pangan dulu (1 hari), lalu inspeksi dapur, baru sertifikat keluar sekitar 10 hari kerja. Gratis atau biaya sangat murah di beberapa daerah!',
    authorId: 'user-affiliate-1',
    createdAt: new Date(Date.now() - 3600000 * 11),
    updatedAt: new Date(Date.now() - 3600000 * 11),
  },
  {
    id: 'comment-6',
    postId: 'post-herbal-tips',
    content: 'Wah, saya ada tanaman jahe merah di belakang rumah dan belum dimanfaatkan optimal. Bisa bantu info cara bikin produk jahe merah siap jual yang awet tanpa pengawet kimia?',
    authorId: 'user-merchant-8',
    createdAt: new Date(Date.now() - 3600000 * 4),
    updatedAt: new Date(Date.now() - 3600000 * 4),
  },
  {
    id: 'comment-7',
    postId: 'post-herbal-tips',
    content: 'Kunyit juga bisa dijadikan sabun dan masker loh! Margin produk turunan herbal jauh lebih tinggi dari jual bahan mentah. Saya jual masker kunyit dan hasilnya 5x lebih untung.',
    authorId: 'user-merchant-12',
    createdAt: new Date(Date.now() - 3600000 * 3),
    updatedAt: new Date(Date.now() - 3600000 * 3),
  },
  {
    id: 'comment-8',
    postId: 'post-furni-branding',
    content: 'Betul sekali! Kami jual kerajinan perak dan strategi yang sama kami terapkan. Video pengrajin tua kami yang sudah 40 tahun bikin perhiasan bisa jutaan views di Reels. Authentic content memang tak ternilai.',
    authorId: 'user-merchant-9',
    createdAt: new Date(Date.now() - 3600000 * 7),
    updatedAt: new Date(Date.now() - 3600000 * 7),
  },
  {
    id: 'comment-9',
    postId: 'post-agro-urban',
    content: 'Urban farming memang seru! Saya sudah 1 tahun tanam sayur di atap rumah kontrakan. Tips tambahan: pakai media sekam bakar + cocopeat untuk hasil maksimal dan drainase bagus.',
    authorId: 'user-customer-1',
    createdAt: new Date(Date.now() - 3600000 * 12),
    updatedAt: new Date(Date.now() - 3600000 * 12),
  },
  {
    id: 'comment-10',
    postId: 'post-skincare-bpom',
    content: 'Makasih infonya sangat detail! Satu pertanyaan: apakah produk yang sudah ada PIRT bisa langsung upgrade ke BPOM atau harus mulai dari nol? Produk saya lotion herbal.',
    authorId: 'user-merchant-6',
    createdAt: new Date(Date.now() - 3600000 * 45),
    updatedAt: new Date(Date.now() - 3600000 * 45),
  },
  {
    id: 'comment-11',
    postId: 'post-skincare-bpom',
    content: 'PIRT dan BPOM itu jalurnya berbeda. PIRT untuk makanan/minuman, BPOM Notifikasi untuk kosmetik. Jadi lotion herbal langsung ke BPOM Notifikasi, tidak perlu PIRT dulu. Semangat!',
    authorId: 'user-merchant-12',
    createdAt: new Date(Date.now() - 3600000 * 44),
    updatedAt: new Date(Date.now() - 3600000 * 44),
  },
  {
    id: 'comment-12',
    postId: 'post-konveksi-tips',
    content: 'Formula HPP-nya sangat membantu! Selama ini saya hitung kasar-kasaran saja dan sering merasa tidak untung padahal orderan banyak. Ternyata biaya overhead yang sering dilupakan.',
    authorId: 'user-merchant-10',
    createdAt: new Date(Date.now() - 3600000 * 28),
    updatedAt: new Date(Date.now() - 3600000 * 28),
  },
  {
    id: 'comment-13',
    postId: 'post-bengkel-otomotif',
    content: 'Setuju soal ganti oli rutin! Pelanggan saya yang rajin ganti oli setiap 2000km motornya masih prima di 150.000km. Yang jarang ganti, di 80.000km sudah butuh overhaul mesin.',
    authorId: 'user-merchant-15',
    createdAt: new Date(Date.now() - 3600000 * 68),
    updatedAt: new Date(Date.now() - 3600000 * 68),
  },
]

const mockWallets = [
  {
    id: 'wallet-merchant',
    userId: 'user-merchant-1',
    balance: 4850000,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'wallet-affiliate',
    userId: 'user-affiliate-1',
    balance: 850000,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'wallet-customer',
    userId: 'user-customer-1',
    balance: 200000,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  { id: 'wallet-m2', userId: 'user-merchant-2', balance: 2100000, createdAt: new Date(), updatedAt: new Date() },
  { id: 'wallet-m3', userId: 'user-merchant-3', balance: 3750000, createdAt: new Date(), updatedAt: new Date() },
  { id: 'wallet-m4', userId: 'user-merchant-4', balance: 1820000, createdAt: new Date(), updatedAt: new Date() },
  { id: 'wallet-m5', userId: 'user-merchant-5', balance: 5200000, createdAt: new Date(), updatedAt: new Date() },
  { id: 'wallet-m6', userId: 'user-merchant-6', balance: 980000, createdAt: new Date(), updatedAt: new Date() },
  { id: 'wallet-m7', userId: 'user-merchant-7', balance: 12500000, createdAt: new Date(), updatedAt: new Date() },
  { id: 'wallet-m8', userId: 'user-merchant-8', balance: 650000, createdAt: new Date(), updatedAt: new Date() },
  { id: 'wallet-m9', userId: 'user-merchant-9', balance: 4300000, createdAt: new Date(), updatedAt: new Date() },
  { id: 'wallet-m10', userId: 'user-merchant-10', balance: 2850000, createdAt: new Date(), updatedAt: new Date() },
  { id: 'wallet-m11', userId: 'user-merchant-11', balance: 740000, createdAt: new Date(), updatedAt: new Date() },
  { id: 'wallet-m12', userId: 'user-merchant-12', balance: 3100000, createdAt: new Date(), updatedAt: new Date() },
  { id: 'wallet-m13', userId: 'user-merchant-13', balance: 1250000, createdAt: new Date(), updatedAt: new Date() },
  { id: 'wallet-m14', userId: 'user-merchant-14', balance: 8900000, createdAt: new Date(), updatedAt: new Date() },
  { id: 'wallet-m15', userId: 'user-merchant-15', balance: 2200000, createdAt: new Date(), updatedAt: new Date() },
  { id: 'wallet-affiliate-2', userId: 'user-affiliate-2', balance: 350000, createdAt: new Date(), updatedAt: new Date() },
  { id: 'wallet-affiliate-3', userId: 'user-affiliate-3', balance: 150000, createdAt: new Date(), updatedAt: new Date() },
  { id: 'wallet-customer-2', userId: 'user-customer-2', balance: 50000, createdAt: new Date(), updatedAt: new Date() },
  { id: 'wallet-customer-3', userId: 'user-customer-3', balance: 25000, createdAt: new Date(), updatedAt: new Date() },
]

const mockWalletTransactions = [
  {
    id: 'tx-1',
    walletId: 'wallet-merchant',
    amount: 150000,
    type: 'SALE' as const,
    description: 'Penjualan Kopi Gayo Organik Premium',
    createdAt: new Date(Date.now() - 3600000 * 3),
  },
  {
    id: 'tx-2',
    walletId: 'wallet-affiliate',
    amount: 75000,
    type: 'COMMISSION' as const,
    description: 'Komisi Referal Penjualan Kopi Gayo',
    createdAt: new Date(Date.now() - 3600000 * 3),
  },
  {
    id: 'tx-3',
    walletId: 'wallet-affiliate',
    amount: 15000,
    type: 'COMMISSION' as const,
    description: 'Komisi Affiliate Tier 2 dari penjualan Jasa Konsultasi',
    createdAt: new Date(Date.now() - 3600000 * 2),
  },
  {
    id: 'tx-4',
    walletId: 'wallet-affiliate-2',
    amount: 50000,
    type: 'COMMISSION' as const,
    description: 'Komisi Affiliate Tier 1 dari penjualan Jasa Konsultasi',
    createdAt: new Date(Date.now() - 3600000 * 2),
  },
  {
    id: 'tx-5',
    walletId: 'wallet-affiliate-2',
    amount: 10000,
    type: 'COMMISSION' as const,
    description: 'Komisi Affiliate Tier 2 dari penjualan Kemeja Batik',
    createdAt: new Date(Date.now() - 3600000 * 1),
  },
  {
    id: 'tx-6',
    walletId: 'wallet-affiliate-3',
    amount: 35000,
    type: 'COMMISSION' as const,
    description: 'Komisi Affiliate Tier 1 dari penjualan Kemeja Batik',
    createdAt: new Date(Date.now() - 3600000 * 1),
  }
]

const mockReferrals = [
  {
    id: 'ref-1',
    affiliateId: 'user-affiliate-1',
    buyerId: 'user-customer-1',
    amount: 75000,
    status: 'PAID' as const,
    createdAt: new Date(Date.now() - 3600000 * 3),
    updatedAt: new Date(Date.now() - 3600000 * 3),
  },
  {
    id: 'ref-2',
    affiliateId: 'user-affiliate-2',
    buyerId: 'user-customer-2',
    amount: 50000,
    status: 'PAID' as const,
    createdAt: new Date(Date.now() - 3600000 * 2),
    updatedAt: new Date(Date.now() - 3600000 * 2),
  },
  {
    id: 'ref-3',
    affiliateId: 'user-affiliate-1',
    buyerId: 'user-customer-2',
    amount: 15000,
    status: 'PAID' as const,
    createdAt: new Date(Date.now() - 3600000 * 2),
    updatedAt: new Date(Date.now() - 3600000 * 2),
  },
  {
    id: 'ref-4',
    affiliateId: 'user-affiliate-3',
    buyerId: 'user-customer-3',
    amount: 35000,
    status: 'PAID' as const,
    createdAt: new Date(Date.now() - 3600000 * 1),
    updatedAt: new Date(Date.now() - 3600000 * 1),
  },
  {
    id: 'ref-5',
    affiliateId: 'user-affiliate-2',
    buyerId: 'user-customer-3',
    amount: 10000,
    status: 'PAID' as const,
    createdAt: new Date(Date.now() - 3600000 * 1),
    updatedAt: new Date(Date.now() - 3600000 * 1),
  }
]

// ─── Filesystem Persistence for Mock DB (survives HMR / process restarts) ────
const MOCK_DB_FILE = path.join(process.cwd(), '.mock-db.json')

function loadMockDb(): { 
  products?: any[]; 
  users?: any[]; 
  wallets?: any[]; 
  walletTransactions?: any[]; 
  courses?: any[]; 
  lessons?: any[]; 
  orders?: any[]; 
  posts?: any[]; 
  comments?: any[]; 
  groups?: any[]; 
  groupMembers?: any[];
  chatRooms?: any[];
  chatMessages?: any[];
  supportTickets?: any[];
  supportMessages?: any[];
  reviews?: any[];
  notifications?: any[];
  orderTrackings?: any[];
  communities?: any[];
  communityMemberships?: any[];
  cooperativeLoans?: any[];
} {
  try {
    if (fs.existsSync(MOCK_DB_FILE)) {
      const raw = fs.readFileSync(MOCK_DB_FILE, 'utf-8')
      const parsed = JSON.parse(raw)
      // Re-hydrate Date fields
      if (parsed.products) {
        parsed.products = parsed.products.map((p: any) => ({ ...p, createdAt: new Date(p.createdAt), updatedAt: new Date(p.updatedAt) }))
      }
      if (parsed.users) {
        parsed.users = parsed.users.map((u: any) => ({ ...u, createdAt: new Date(u.createdAt), updatedAt: new Date(u.updatedAt) }))
      }
      if (parsed.wallets) {
        parsed.wallets = parsed.wallets.map((w: any) => ({ ...w, createdAt: new Date(w.createdAt), updatedAt: new Date(w.updatedAt) }))
      }
      if (parsed.walletTransactions) {
        parsed.walletTransactions = parsed.walletTransactions.map((tx: any) => ({ ...tx, createdAt: new Date(tx.createdAt) }))
      }
      if (parsed.courses) {
        parsed.courses = parsed.courses.map((c: any) => ({ ...c, createdAt: new Date(c.createdAt), updatedAt: new Date(c.updatedAt) }))
      }
      if (parsed.lessons) {
        parsed.lessons = parsed.lessons.map((l: any) => ({ ...l, createdAt: new Date(l.createdAt), updatedAt: new Date(l.updatedAt) }))
      }
      if (parsed.orders) {
        parsed.orders = parsed.orders.map((o: any) => ({ ...o, createdAt: new Date(o.createdAt), updatedAt: new Date(o.updatedAt) }))
      }
      if (parsed.posts) {
        parsed.posts = parsed.posts.map((p: any) => ({ ...p, createdAt: new Date(p.createdAt), updatedAt: new Date(p.updatedAt) }))
      }
      if (parsed.comments) {
        parsed.comments = parsed.comments.map((c: any) => ({ ...c, createdAt: new Date(c.createdAt), updatedAt: new Date(c.updatedAt) }))
      }
      if (parsed.groups) {
        parsed.groups = parsed.groups.map((g: any) => ({ ...g, createdAt: new Date(g.createdAt), updatedAt: new Date(g.updatedAt) }))
      }
      if (parsed.groupMembers) {
        parsed.groupMembers = parsed.groupMembers.map((gm: any) => ({ ...gm, createdAt: new Date(gm.createdAt) }))
      }
      if (parsed.chatRooms) {
        parsed.chatRooms = parsed.chatRooms.map((cr: any) => ({ ...cr, createdAt: new Date(cr.createdAt), updatedAt: new Date(cr.updatedAt) }))
      }
      if (parsed.chatMessages) {
        parsed.chatMessages = parsed.chatMessages.map((cm: any) => ({ ...cm, createdAt: new Date(cm.createdAt) }))
      }
      if (parsed.supportTickets) {
        parsed.supportTickets = parsed.supportTickets.map((st: any) => ({ ...st, createdAt: new Date(st.createdAt), updatedAt: new Date(st.updatedAt) }))
      }
      if (parsed.supportMessages) {
        parsed.supportMessages = parsed.supportMessages.map((sm: any) => ({ ...sm, createdAt: new Date(sm.createdAt) }))
      }
      if (parsed.communities) {
        parsed.communities = parsed.communities.map((c: any) => ({ ...c, createdAt: new Date(c.createdAt), updatedAt: new Date(c.updatedAt) }))
      }
      if (parsed.communityMemberships) {
        parsed.communityMemberships = parsed.communityMemberships.map((cm: any) => ({ ...cm, joinedAt: new Date(cm.joinedAt) }))
      }
      if (parsed.cooperativeLoans) {
        parsed.cooperativeLoans = parsed.cooperativeLoans.map((l: any) => ({ ...l, createdAt: new Date(l.createdAt), updatedAt: new Date(l.updatedAt) }))
      }
      return parsed
    }
  } catch (e) {
    // ignore read errors
  }
  return {}
}

function mergeMockData(defaultData: any[], persistedData: any[] = []) {
  const merged = [...defaultData]
  persistedData.forEach(item => {
    const idx = merged.findIndex(i => i.id === item.id)
    if (idx !== -1) {
      merged[idx] = { ...merged[idx], ...item }
    } else {
      merged.push(item)
    }
  })
  return merged
}

let lastMockDbMtime = 0

function saveMockDb() {
  try {
    const data = {
      products: globalMockProducts,
      users: globalMockUsers,
      wallets: globalMockWallets,
      walletTransactions: globalMockWalletTransactions,
      courses: globalMockCourses,
      lessons: globalMockLessons,
      posts: globalMockPosts,
      comments: globalMockComments,
      groups: globalMockGroups,
      groupMembers: globalMockGroupMembers,
      chatRooms: globalMockChatRooms,
      chatMessages: globalMockChatMessages,
      supportTickets: globalMockSupportTickets,
      supportMessages: globalMockSupportMessages,
      orders: globalMockOrders,
      reviews: globalMockReviews,
      notifications: globalMockNotifications,
      orderTrackings: globalMockOrderTrackings,
      communities: (globalThis as any).__mockCommunities,
      communityMemberships: (globalThis as any).__mockCommunityMemberships,
      cooperativeLoans: (globalThis as any).__mockCooperativeLoans
    }
    fs.writeFileSync(MOCK_DB_FILE, JSON.stringify(data, null, 2), 'utf-8')
    if (fs.existsSync(MOCK_DB_FILE)) {
      const stat = fs.statSync(MOCK_DB_FILE)
      lastMockDbMtime = stat.mtimeMs
    }
  } catch (e) {
    // ignore write errors (e.g. read-only environments)
  }
}

function syncMockDb() {
  try {
    if (fs.existsSync(MOCK_DB_FILE)) {
      const stat = fs.statSync(MOCK_DB_FILE)
      const mtime = stat.mtimeMs
      if (mtime === lastMockDbMtime) {
        return // no change on disk, skip loading!
      }
      lastMockDbMtime = mtime
      
      const raw = fs.readFileSync(MOCK_DB_FILE, 'utf-8')
      const parsed = JSON.parse(raw)
      
      if (parsed.products) {
        globalMockProducts = mergeMockData(mockProducts, parsed.products.map((p: any) => ({
          ...p,
          isAffiliateEnabled: p.isAffiliateEnabled !== undefined ? p.isAffiliateEnabled : false,
          affiliateCommissionType: p.affiliateCommissionType || 'PERCENT',
          affiliateCommissionValue: p.affiliateCommissionValue !== undefined ? p.affiliateCommissionValue : 0.0,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt)
        })))
      }
      if (parsed.users) {
        globalMockUsers = mergeMockData(mockUsers, parsed.users.map((u: any) => ({ ...u, createdAt: new Date(u.createdAt), updatedAt: new Date(u.updatedAt) })))
      }
      if (parsed.wallets) {
        globalMockWallets = mergeMockData(mockWallets, parsed.wallets.map((w: any) => ({ ...w, createdAt: new Date(w.createdAt), updatedAt: new Date(w.updatedAt) })))
      }
      if (parsed.walletTransactions) {
        globalMockWalletTransactions = mergeMockData(mockWalletTransactions, parsed.walletTransactions.map((tx: any) => ({ ...tx, createdAt: new Date(tx.createdAt) })))
      }
      if (parsed.courses) {
        globalMockCourses = mergeMockData(mockCourses, parsed.courses.map((c: any) => ({ ...c, createdAt: new Date(c.createdAt), updatedAt: new Date(c.updatedAt) })))
      }
      if (parsed.lessons) {
        globalMockLessons = mergeMockData(mockLessons, parsed.lessons.map((l: any) => ({ ...l, createdAt: new Date(l.createdAt), updatedAt: new Date(l.updatedAt) })))
      }
      if (parsed.orders) {
        globalMockOrders = parsed.orders.map((o: any) => ({ ...o, createdAt: new Date(o.createdAt), updatedAt: new Date(o.updatedAt) }))
      }
      if (parsed.posts) {
        globalMockPosts = mergeMockData(mockPosts, parsed.posts.map((p: any) => ({ ...p, createdAt: new Date(p.createdAt), updatedAt: new Date(p.updatedAt) })))
      }
      if (parsed.comments) {
        globalMockComments = mergeMockData(mockComments, parsed.comments.map((c: any) => ({ ...c, createdAt: new Date(c.createdAt), updatedAt: new Date(c.updatedAt) })))
      }
      if (parsed.groups) {
        globalMockGroups = mergeMockData(mockGroups, parsed.groups.map((g: any) => ({ ...g, createdAt: new Date(g.createdAt), updatedAt: new Date(g.updatedAt) })))
      }
      if (parsed.groupMembers) {
        globalMockGroupMembers = mergeMockData(mockGroupMembers, parsed.groupMembers.map((gm: any) => ({ ...gm, createdAt: new Date(gm.createdAt), updatedAt: new Date(gm.updatedAt) })))
      }
      if (parsed.chatRooms) {
        globalMockChatRooms = parsed.chatRooms.map((cr: any) => ({ ...cr, createdAt: new Date(cr.createdAt), updatedAt: new Date(cr.updatedAt) }))
      }
      if (parsed.chatMessages) {
        globalMockChatMessages = parsed.chatMessages.map((cm: any) => ({ ...cm, createdAt: new Date(cm.createdAt) }))
      }
      if (parsed.supportTickets) {
        globalMockSupportTickets = parsed.supportTickets.map((st: any) => ({ ...st, createdAt: new Date(st.createdAt), updatedAt: new Date(st.updatedAt) }))
      }
      if (parsed.supportMessages) {
        globalMockSupportMessages = parsed.supportMessages.map((sm: any) => ({ ...sm, createdAt: new Date(sm.createdAt) }))
      }
      if (parsed.reviews) {
        globalMockReviews = parsed.reviews.map((r: any) => ({ ...r, createdAt: new Date(r.createdAt) }))
      }
      if (parsed.notifications) {
        globalMockNotifications = parsed.notifications.map((n: any) => ({ ...n, createdAt: new Date(n.createdAt) }))
      }
      if (parsed.orderTrackings) {
        globalMockOrderTrackings = parsed.orderTrackings.map((ot: any) => ({ ...ot, createdAt: new Date(ot.createdAt) }))
      }
      if (parsed.communities) {
        (globalThis as any).__mockCommunities = parsed.communities.map((c: any) => ({
          ...c,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt)
        }))
      }
      if (parsed.communityMemberships) {
        (globalThis as any).__mockCommunityMemberships = parsed.communityMemberships.map((cm: any) => ({
          ...cm,
          joinedAt: new Date(cm.joinedAt)
        }))
      }
      if (parsed.cooperativeLoans) {
        (globalThis as any).__mockCooperativeLoans = parsed.cooperativeLoans.map((l: any) => ({
          ...l,
          createdAt: new Date(l.createdAt),
          updatedAt: new Date(l.updatedAt)
        }))
      }
    }
  } catch (e) {
    // ignore
  }
}

// Load persisted data and merge with defaults
const _persistedDb = loadMockDb()

// Initialize globalThis mock communities from persisted database
;(globalThis as any).__mockCommunities = _persistedDb.communities || []
;(globalThis as any).__mockCommunityMemberships = _persistedDb.communityMemberships || []
;(globalThis as any).__mockCooperativeLoans = _persistedDb.cooperativeLoans || []

// Global state in-memory database helpers for local updates in sandbox mode
let globalMockProducts: any[] = mergeMockData(mockProducts, _persistedDb.products).map((p: any) => ({
  ...p,
  isAffiliateEnabled: p.isAffiliateEnabled !== undefined ? p.isAffiliateEnabled : false,
  affiliateCommissionType: p.affiliateCommissionType || 'PERCENT',
  affiliateCommissionValue: p.affiliateCommissionValue !== undefined ? p.affiliateCommissionValue : 0.0
}))
let globalMockUsers: any[] = mergeMockData(mockUsers, _persistedDb.users)
let globalMockProgress = [...mockProgress]
let globalMockGroups: any[] = mergeMockData(mockGroups, _persistedDb.groups)
let globalMockChatRooms: any[] = _persistedDb.chatRooms || []
let globalMockChatMessages: any[] = _persistedDb.chatMessages || []
let globalMockSupportTickets: any[] = _persistedDb.supportTickets || []
let globalMockSupportMessages: any[] = _persistedDb.supportMessages || []
let globalMockGroupMembers: any[] = mergeMockData(mockGroupMembers, _persistedDb.groupMembers)
let globalMockPosts = mergeMockData(mockPosts, _persistedDb.posts)
let globalMockComments = mergeMockData(mockComments, _persistedDb.comments)
let globalMockWallets: any[] = mergeMockData(mockWallets, _persistedDb.wallets)
let globalMockWalletTransactions: any[] = mergeMockData(mockWalletTransactions, _persistedDb.walletTransactions)
let globalMockReferrals = [...mockReferrals]
let globalMockCourses: any[] = mergeMockData(mockCourses, _persistedDb.courses)
let globalMockLessons: any[] = mergeMockData(mockLessons, _persistedDb.lessons)
let globalMockOrders: any[] = _persistedDb.orders && _persistedDb.orders.length > 0 ? _persistedDb.orders : [
  {
    id: 'order-1779515200000',
    buyerId: 'user-customer-1',
    totalAmount: 185000,
    status: 'COMPLETED' as const,
    createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
    updatedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
    items: [
      { productId: 'prod-brand-1', quantity: 1, price: 150000, productTitle: 'Premium Box Packaging Template' },
      { productId: 'prod-sourdough-1', quantity: 1, price: 35000, productTitle: 'Artisan Sourdough Starter Kit' }
    ]
  },
  {
    id: 'order-1779517100000',
    buyerId: 'user-merchant-4',
    totalAmount: 2500000,
    status: 'COMPLETED' as const,
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
    items: [
      { productId: 'jasa-brand-1', quantity: 1, price: 2500000, productTitle: 'Luxury Brand Identity & Logo Design' }
    ]
  },
  {
    id: 'order-1779518400000',
    buyerId: 'user-customer-1',
    totalAmount: 95000,
    status: 'COMPLETED' as const,
    createdAt: new Date(Date.now() - 12 * 3600 * 1000),
    updatedAt: new Date(Date.now() - 12 * 3600 * 1000),
    items: [
      { productId: 'prod-brand-2', quantity: 1, price: 95000, productTitle: 'Premium Typography Guidelines Booklet' }
    ]
  }
]
let globalMockCustomLinks: any[] = []
let globalMockClickLogs: any[] = []
let globalMockWaLogs: any[] = []
let globalMockReviews: any[] = _persistedDb.reviews || []
let globalMockNotifications: any[] = _persistedDb.notifications || []
let globalMockOrderTrackings: any[] = _persistedDb.orderTrackings || []

// Database Access Verification Utility with cache and timeout race
let lastDbCheckTime = 0;
let cachedDbConnected = false;

export async function isDbConnected(): Promise<boolean> {
  const now = Date.now();
  if (now - lastDbCheckTime < 10000) {
    return cachedDbConnected;
  }
  lastDbCheckTime = now;
  try {
    const connectionPromise = db.$queryRaw`SELECT 1`.then(() => true);
    const timeoutPromise = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 5000));
    cachedDbConnected = await Promise.race([connectionPromise, timeoutPromise]);
    return cachedDbConnected;
  } catch (e) {
    cachedDbConnected = false;
    return false;
  }
}

// Unified Store functions with fallback logic
export const DataStore = {
  // USER OPERATIONS
  async findUserByEmail(email: string) {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        const u = await db.user.findUnique({ where: { email } })
        if (u) return u
      } catch (_) {}
    }
    return globalMockUsers.find(u => u.email === email) || null
  },

  async findUserById(id: string) {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        const u = await db.user.findUnique({ where: { id } })
        if (u) return u
      } catch (_) {}
    }
    return globalMockUsers.find(u => u.id === id) || null
  },

  async findUserByWhatsApp(whatsappNum: string) {
    syncMockDb()
    const cleanNum = whatsappNum.replace(/[^0-9]/g, '')
    if (!cleanNum) return null

    if (await isDbConnected()) {
      try {
        const users = await db.user.findMany({
          where: {
            landingPageSetup: true,
            landingPageConfig: {
              not: null
            }
          }
        })
        
        for (const user of users) {
          if (user.landingPageConfig) {
            try {
              const config = JSON.parse(user.landingPageConfig)
              if (config && config.whatsapp) {
                const configWa = config.whatsapp.replace(/[^0-9]/g, '')
                if (configWa === cleanNum) {
                  return user
                }
              }
            } catch (_) {}
          }
        }
      } catch (_) {}
    }
    
    // Fallback to mock users
    for (const user of globalMockUsers) {
      if (user.landingPageConfig) {
        try {
          const config = JSON.parse(user.landingPageConfig)
          if (config && config.whatsapp) {
            const configWa = config.whatsapp.replace(/[^0-9]/g, '')
            if (configWa === cleanNum) {
              return user
            }
          }
        } catch (_) {}
      }
    }
    return null
  },

  async findUserBySubdomain(subdomain: string) {
    syncMockDb()
    const cleanSub = subdomain.toLowerCase().trim()
    if (!cleanSub) return null

    if (await isDbConnected()) {
      try {
        const users = await db.user.findMany({
          where: {
            landingPageSetup: true,
            landingPageConfig: {
              not: null
            }
          }
        })
        
        for (const user of users) {
          if (user.landingPageConfig) {
            try {
              const config = JSON.parse(user.landingPageConfig)
              if (config && config.subdomain && config.subdomain.toLowerCase().trim() === cleanSub) {
                return user
              }
            } catch (_) {}
          }
        }
      } catch (_) {}
    }
    
    // Fallback to mock users
    for (const user of globalMockUsers) {
      if (user.landingPageConfig) {
        try {
          const config = JSON.parse(user.landingPageConfig)
          if (config && config.subdomain && config.subdomain.toLowerCase().trim() === cleanSub) {
            return user
          }
        } catch (_) {}
      }
    }
    return null
  },

  async createUser(data: { email: string; name: string; passwordHash: string; role: string; latitude?: number; longitude?: number; parentAffiliateId?: string; username?: string }) {
    const defaultTemplate = 'modern-gold'
    const defaultStyle = { textAlign: 'center', fontSize: 'default', fontWeight: 'default', color: '', bgColor: '', paddingTop: 16, paddingBottom: 16, paddingLeft: 16, paddingRight: 16, opacity: 100, textDecoration: 'none', textTransform: 'none', borderRadius: 0 }
    const defaultAdvance = { marginTop: 0, marginBottom: 0, animation: 'none', showDesktop: true, showTablet: true, showMobile: true, customClass: '', customId: '' }
    const makeComp = (type: string, content: any, style = {}, advance = {}) => ({
      id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      type,
      content,
      style: { ...defaultStyle, ...style },
      advance: { ...defaultAdvance, ...advance }
    })
    const defaultPages = [
      {
        id: "page-main",
        name: "Main Storefront",
        slug: "",
        template: "template1",
        status: "PUBLISHED",
        customDomain: "",
        headDesktop: "",
        headMobile: "",
        footerAny: "",
        footerDesktop: "",
        footerMobile: "",
        allowSearch: "Yes",
        followLinks: "Yes",
        lastModified: new Date().toISOString(),
        builderComponents: [
          makeComp('headline', { text: `Selamat Datang di ${data.name}`, tag: 'h1' }, { textAlign: 'center', paddingTop: 32, paddingBottom: 8 }),
          makeComp('subheadline', { text: 'Kami menyediakan produk dan layanan berkualitas tinggi untuk Anda.', tag: 'h2' }, { textAlign: 'center', paddingTop: 8, paddingBottom: 24, color: '#6B7280' }),
          makeComp('product_showcase', { productIds: [], layout: 'grid', columns: 2, title: 'Produk Pilihan Kami', showPrice: true, showStock: true, showBuyBtn: true, buyBtnLabel: 'Beli Sekarang' }),
          makeComp('whatsapp_button', { label: 'Hubungi Kami', phone: '', message: 'Halo, saya tertarik dengan produk Anda.' }, { textAlign: 'center' })
        ]
      }
    ]
    const defaultConfig = JSON.stringify({
      title: data.name,
      bio: `Selamat datang di profil resmi kami. Kami adalah pelaku usaha terdaftar di ekosistem premium Saloka.id. Silakan jelajahi katalog produk, jasa, dan lokasi kami.`,
      phone: "",
      instagram: `@${data.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      sections: ["hero", "profile", "products", "map"],
      pages: defaultPages
    })

    if (await isDbConnected()) {
      try {
        return await db.$transaction(async (tx) => {
          const user = await tx.user.create({
            data: {
              ...data,
              username: data.username || null,
              role: data.role as any,
              level: 1,
              xp: 0,
              coinBalance: 0.0,
              landingPageTemplate: defaultTemplate,
              landingPageConfig: defaultConfig,
              landingPageSetup: false,
              membershipLevel: 'Reseller',
              membershipAccess: 'Gold',
              parentAffiliateId: data.parentAffiliateId || null
            } as any
          })
          await tx.wallet.create({ data: { userId: user.id, balance: 0.0 } })
          return user
        })
      } catch (_) {}
    }
    const newUser = {
      id: `user-${Date.now()}`,
      email: data.email,
      name: data.name,
      username: data.username || null,
      passwordHash: data.passwordHash,
      role: data.role,
      latitude: data.latitude || -6.2088,
      longitude: data.longitude || 106.8456,
      level: 1,
      xp: 0,
      coinBalance: 0.0,
      landingPageTemplate: defaultTemplate,
      landingPageConfig: defaultConfig,
      landingPageSetup: false,
      parentAffiliateId: data.parentAffiliateId || null,
      membershipLevel: 'Reseller',
      membershipAccess: 'Gold',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    globalMockUsers.push(newUser)
    globalMockWallets.push({
      id: `wallet-${newUser.id}`,
      userId: newUser.id,
      balance: 0.0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    saveMockDb()
    return newUser
  },

  // ADMIN OPERATIONS
  async getAllUsers() {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        return await db.user.findMany({ orderBy: { createdAt: 'desc' } })
      } catch (_) {}
    }
    return [...globalMockUsers]
  },

  async getAllOrders() {
    if (await isDbConnected()) {
      try {
        return await db.order.findMany({
          include: { buyer: true, items: true },
          orderBy: { createdAt: 'desc' }
        })
      } catch (_) {}
    }
    return [...globalMockOrders]
  },

  async findOrderById(id: string) {
    if (await isDbConnected()) {
      try {
        return await db.order.findUnique({
          where: { id },
          include: { buyer: true, items: { include: { product: true } } }
        })
      } catch (_) {}
    }
    return globalMockOrders.find(o => o.id === id) || null
  },

  // Course Management
  async addCourse(title: string, description: string, coverImage: string, accessRequired: string) {
    const newCourse = {
      id: `course-${Date.now()}`,
      title,
      description,
      coverImage,
      accessRequired,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    if (await isDbConnected()) {
      try {
        await db.course.create({
          data: {
            id: newCourse.id,
            title,
            description,
            coverImage,
            accessRequired
          }
        })
      } catch (_) {}
    }
    globalMockCourses.push(newCourse)
    saveMockDb()
    return newCourse
  },

  async updateCourse(id: string, title: string, description: string, coverImage: string, accessRequired: string) {
    if (await isDbConnected()) {
      try {
        await db.course.update({
          where: { id },
          data: { title, description, coverImage, accessRequired }
        })
      } catch (_) {}
    }
    const idx = globalMockCourses.findIndex(c => c.id === id)
    if (idx !== -1) {
      globalMockCourses[idx] = {
        ...globalMockCourses[idx],
        title,
        description,
        coverImage,
        accessRequired,
        updatedAt: new Date()
      }
    }
    saveMockDb()
    return true
  },

  async deleteCourse(id: string) {
    if (await isDbConnected()) {
      try {
        await db.course.delete({ where: { id } })
      } catch (_) {}
    }
    globalMockCourses = globalMockCourses.filter(c => c.id !== id)
    globalMockLessons = globalMockLessons.filter(l => l.courseId !== id)
    saveMockDb()
    return true
  },

  // Lesson Management
  async addLesson(courseId: string, title: string, content: string, videoUrl: string, duration: number, orderIndex: number) {
    const newLesson = {
      id: `lesson-${Date.now()}`,
      courseId,
      title,
      content,
      videoUrl,
      duration,
      orderIndex,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    if (await isDbConnected()) {
      try {
        await db.lesson.create({
          data: {
            id: newLesson.id,
            courseId,
            title,
            content,
            videoUrl,
            duration,
            orderIndex
          }
        })
      } catch (_) {}
    }
    globalMockLessons.push(newLesson)
    saveMockDb()
    return newLesson
  },

  async updateLesson(id: string, title: string, content: string, videoUrl: string, duration: number, orderIndex: number) {
    if (await isDbConnected()) {
      try {
        await db.lesson.update({
          where: { id },
          data: { title, content, videoUrl, duration, orderIndex }
        })
      } catch (_) {}
    }
    const idx = globalMockLessons.findIndex(l => l.id === id)
    if (idx !== -1) {
      globalMockLessons[idx] = {
        ...globalMockLessons[idx],
        title,
        content,
        videoUrl,
        duration,
        orderIndex,
        updatedAt: new Date()
      }
    }
    saveMockDb()
    return true
  },

  async deleteLesson(id: string) {
    if (await isDbConnected()) {
      try {
        await db.lesson.delete({ where: { id } })
      } catch (_) {}
    }
    globalMockLessons = globalMockLessons.filter(l => l.id !== id)
    saveMockDb()
    return true
  },

  // User Management Override
  async updateUserRoleAndLevel(userId: string, role: string, level: number, xp: number, membershipLevel: string, membershipAccess: string, bootcampStatus?: string) {
    if (await isDbConnected()) {
      try {
        await db.user.update({
          where: { id: userId },
          data: {
            role: role as any,
            level,
            xp,
            membershipLevel,
            membershipAccess,
            bootcampStatus: bootcampStatus || undefined
          }
        })
      } catch (_) {}
    }
    const idx = globalMockUsers.findIndex(u => u.id === userId)
    if (idx !== -1) {
      globalMockUsers[idx] = {
        ...globalMockUsers[idx],
        role,
        level,
        xp,
        membershipLevel,
        membershipAccess,
        bootcampStatus: bootcampStatus || globalMockUsers[idx].bootcampStatus || 'NONE',
        updatedAt: new Date()
      }
    }
    saveMockDb()
    return true
  },

  async joinBootcamp(userId: string) {
    if (await isDbConnected()) {
      try {
        await db.user.update({
          where: { id: userId },
          data: { bootcampStatus: 'JOINED' }
        })
      } catch (_) {}
    }
    const idx = globalMockUsers.findIndex(u => u.id === userId)
    if (idx !== -1) {
      globalMockUsers[idx] = {
        ...globalMockUsers[idx],
        bootcampStatus: 'JOINED',
        updatedAt: new Date()
      }
    }
    saveMockDb()
    return true
  },

  async updateUserRole(userId: string, role: string) {
    if (await isDbConnected()) {
      try {
        return await db.user.update({
          where: { id: userId },
          data: { role: role as any }
        })
      } catch (_) {}
    }
    syncMockDb()
    const user = globalMockUsers.find(u => u.id === userId)
    if (user) {
      user.role = role as any
      user.updatedAt = new Date()
      saveMockDb()
      return user
    }
    return null
  },

  async isSubdomainTaken(subdomain: string, excludeUserId?: string): Promise<boolean> {
    const cleanSub = subdomain.toLowerCase().trim()
    if (['test', 'admin', 'saloka', 'buat', 'web', 'system', 'api', 'dev', 'portal'].includes(cleanSub)) {
      return true
    }

    if (await isDbConnected()) {
      try {
        const users = await db.user.findMany({
          where: {
            landingPageConfig: {
              contains: `"subdomain":"${cleanSub}"`
            },
            NOT: excludeUserId ? { id: excludeUserId } : undefined
          }
        })
        if (users.length > 0) return true
      } catch (_) {}
    }

    const matchedMock = globalMockUsers.find(u => {
      if (excludeUserId && u.id === excludeUserId) return false
      if (!u.landingPageConfig) return false
      try {
        const config = JSON.parse(u.landingPageConfig)
        return config.subdomain?.toLowerCase().trim() === cleanSub
      } catch (_) {
        return false
      }
    })

    return !!matchedMock
  },

  async recreateMissingUser(data: { id: string; email: string; name: string; role: string }) {
    if (await isDbConnected()) {
      try {
        const u = await db.user.create({
          data: {
            id: data.id,
            email: data.email,
            name: data.name,
            role: data.role as any,
            passwordHash: crypto.randomBytes(16).toString('hex'),
            level: 1,
            xp: 0,
            landingPageSetup: false,
            membershipLevel: 'Reseller',
            membershipAccess: 'Gold'
          }
        })
        await db.wallet.create({ data: { userId: u.id, balance: 0.0 } })
        return u
      } catch (_) {}
    }
    syncMockDb()
    let user = globalMockUsers.find(u => u.id === data.id || u.email === data.email)
    if (!user) {
      user = {
        id: data.id,
        email: data.email,
        name: data.name,
        passwordHash: crypto.randomBytes(16).toString('hex'),
        role: data.role as any,
        latitude: -6.2088,
        longitude: 106.8456,
        level: 1,
        xp: 0,
        landingPageTemplate: null,
        landingPageConfig: null,
        landingPageSetup: false,
        parentAffiliateId: null,
        membershipLevel: 'Reseller',
        membershipAccess: 'Gold',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      globalMockUsers.push(user)
      
      // Ensure wallet is created!
      if (!globalMockWallets.some(w => w.userId === user.id)) {
        globalMockWallets.push({
          id: `wallet-${user.id}`,
          userId: user.id,
          balance: 0.0,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }
      saveMockDb()
    }
    return user
  },

  // PRODUCT OPERATIONS
  async getProducts(category?: string) {
    if (await isDbConnected()) {
      try {
        if (category) {
          return await db.product.findMany({
            where: { category: category as ProductCategory },
            include: { merchant: true },
            orderBy: { createdAt: 'desc' }
          })
        }
        return await db.product.findMany({
          include: { merchant: true },
          orderBy: { createdAt: 'desc' }
        })
      } catch (_) {}
    }
    
    const list = category ? globalMockProducts.filter(p => p.category === category) : globalMockProducts
    return list.map(p => ({
      ...p,
      merchant: globalMockUsers.find(u => u.id === p.merchantId) || null
    })).sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime())
  },

  async getProductById(id: string) {
    if (await isDbConnected()) {
      try {
        return await db.product.findUnique({
          where: { id },
          include: { merchant: true }
        })
      } catch (_) {}
    }
    const p = globalMockProducts.find(prod => prod.id === id) || null
    if (!p) return null
    return {
      ...p,
      merchant: globalMockUsers.find(u => u.id === p.merchantId) || null
    }
  },

  async createProduct(data: { 
    title: string; 
    description: string; 
    price: number; 
    category: any; 
    stock: number; 
    imageUrl?: string; 
    merchantId: string; 
    latitude?: number; 
    longitude?: number;
    jvPartnerId?: string;
    jvSharePercent?: number;
    isAffiliateEnabled?: boolean;
    affiliateCommissionType?: string;
    affiliateCommissionValue?: number;
  }) {
    if (await isDbConnected()) {
      try {
        return await db.product.create({ data })
      } catch (_) {}
    }
    const newProd = {
      id: `prod-${Date.now()}`,
      title: data.title,
      description: data.description,
      price: data.price,
      category: data.category,
      stock: data.stock,
      imageUrl: data.imageUrl || null,
      merchantId: data.merchantId,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      jvPartnerId: data.jvPartnerId || null,
      jvSharePercent: data.jvSharePercent || null,
      isAffiliateEnabled: data.isAffiliateEnabled || false,
      affiliateCommissionType: data.affiliateCommissionType || 'PERCENT',
      affiliateCommissionValue: data.affiliateCommissionValue || 0.0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    globalMockProducts.push(newProd)
    saveMockDb()
    return newProd
  },

  async updateProduct(
    id: string, 
    merchantId: string, 
    data: Partial<{ 
      title: string; 
      description: string; 
      price: number; 
      category: any; 
      stock: number; 
      imageUrl: string; 
      latitude?: number; 
      longitude?: number;
      isAffiliateEnabled?: boolean;
      affiliateCommissionType?: string;
      affiliateCommissionValue?: number;
    }>
  ) {
    if (await isDbConnected()) {
      try {
        return await db.product.update({
          where: { id, merchantId },
          data
        })
      } catch (_) {}
    }
    const idx = globalMockProducts.findIndex(p => p.id === id && p.merchantId === merchantId)
    if (idx === -1) throw new Error('Product not found or unauthorized')
    const updated = {
      ...globalMockProducts[idx],
      ...data,
      updatedAt: new Date()
    }
    globalMockProducts[idx] = updated
    saveMockDb()
    return updated
  },

  async updateAllProductsAffiliateSettings(
    merchantId: string, 
    isAffiliateEnabled: boolean, 
    affiliateCommissionType: string, 
    affiliateCommissionValue: number
  ) {
    if (await isDbConnected()) {
      try {
        await db.product.updateMany({
          where: { merchantId },
          data: {
            isAffiliateEnabled,
            affiliateCommissionType,
            affiliateCommissionValue
          }
        })
        return true
      } catch (_) {}
    }
    
    // In-memory simulation
    globalMockProducts.forEach(p => {
      if (p.merchantId === merchantId) {
        p.isAffiliateEnabled = isAffiliateEnabled
        p.affiliateCommissionType = affiliateCommissionType
        p.affiliateCommissionValue = affiliateCommissionValue
        p.updatedAt = new Date()
      }
    })
    saveMockDb()
    return true
  },

  async deleteProduct(id: string, merchantId: string) {
    if (await isDbConnected()) {
      try {
        return await db.product.delete({
          where: { id, merchantId }
        })
      } catch (_) {}
    }
    const idx = globalMockProducts.findIndex(p => p.id === id && p.merchantId === merchantId)
    if (idx === -1) throw new Error('Product not found or unauthorized')
    globalMockProducts.splice(idx, 1)
    saveMockDb()
    return true
  },

  async getCourses() {
    if (await isDbConnected()) {
      try {
        return await db.course.findMany({
          include: { lessons: { orderBy: { orderIndex: 'asc' } } }
        })
      } catch (_) {}
    }
    return globalMockCourses.map(c => ({
      ...c,
      lessons: globalMockLessons.filter(l => l.courseId === c.id).sort((a,b) => a.orderIndex - b.orderIndex)
    }))
  },

  async getCourseById(id: string) {
    if (await isDbConnected()) {
      try {
        return await db.course.findUnique({
          where: { id },
          include: { lessons: { orderBy: { orderIndex: 'asc' } } }
        })
      } catch (_) {}
    }
    const course = globalMockCourses.find(c => c.id === id) || null
    if (!course) return null
    return {
      ...course,
      lessons: globalMockLessons.filter(l => l.courseId === course.id).sort((a,b) => a.orderIndex - b.orderIndex)
    }
  },

  async getUserProgress(userId: string) {
    if (await isDbConnected()) {
      try {
        return await db.progress.findMany({ where: { userId } })
      } catch (_) {}
    }
    return globalMockProgress.filter(p => p.userId === userId)
  },

  async toggleLessonProgress(userId: string, lessonId: string, completed: boolean) {
    if (await isDbConnected()) {
      try {
        return await db.progress.upsert({
          where: { userId_lessonId: { userId, lessonId } },
          create: { userId, lessonId, completed },
          update: { completed }
        })
      } catch (_) {}
    }
    const idx = globalMockProgress.findIndex(p => p.userId === userId && p.lessonId === lessonId)
    if (idx !== -1) {
      globalMockProgress[idx].completed = completed
      saveMockDb()
      return globalMockProgress[idx]
    } else {
      const newProgress = { userId, lessonId, completed }
      globalMockProgress.push(newProgress)
      saveMockDb()
      return newProgress
    }
  },

  // WALLET OPERATIONS
  async getWalletByUserId(userId: string) {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        const w = await db.wallet.findUnique({
          where: { userId },
          include: { transactions: { orderBy: { createdAt: 'desc' } } }
        })
        if (w) return w
      } catch (_) {}
    }
    let wallet = globalMockWallets.find(w => w.userId === userId) || null
    if (!wallet) {
      wallet = {
        id: `wallet-${userId}`,
        userId,
        balance: 0.0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      globalMockWallets.push(wallet)
      saveMockDb()
    }
    return {
      ...wallet,
      transactions: globalMockWalletTransactions.filter(t => t.walletId === wallet.id).sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime())
    }
  },

  async getAllWithdrawals() {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        const txs = await db.walletTransaction.findMany({
          where: { type: 'WITHDRAWAL', description: { startsWith: 'Tarik ke' } },
          include: { wallet: { include: { user: true } } },
          orderBy: { createdAt: 'desc' }
        })
        return txs.map(t => ({
          ...t,
          user: t.wallet?.user
        }))
      } catch (_) {}
    }
    
    // Mock DB logic
    const withdrawals = globalMockWalletTransactions
      .filter(t => t.type === 'WITHDRAWAL' && t.description.startsWith('Tarik ke'))
      .sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime())
    
    return withdrawals.map(w => {
      const wallet = globalMockWallets.find(wl => wl.id === w.walletId)
      const user = wallet ? globalMockUsers.find(u => u.id === wallet.userId) : null
      return { ...w, user }
    })
  },


  async withdrawFunds(userId: string, amount: number, description: string = 'Penarikan dana dompet digital') {
    if (await isDbConnected()) {
      try {
        return await db.$transaction(async (tx) => {
          const wallet = await tx.wallet.findUnique({ where: { userId } })
          if (!wallet || wallet.balance < amount) throw new Error('Saldo tidak mencukupi')
          const updatedWallet = await tx.wallet.update({
            where: { userId },
            data: { balance: { decrement: amount } }
          })
          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              amount,
              type: 'WITHDRAWAL',
              description
            }
          })
          return updatedWallet
        })
      } catch (_) {}
    }
    const wallet = globalMockWallets.find(w => w.userId === userId)
    if (!wallet || wallet.balance < amount) throw new Error('Saldo tidak mencukupi')
    wallet.balance -= amount
    globalMockWalletTransactions.push({
      id: `tx-${Date.now()}`,
      walletId: wallet.id,
      amount,
      type: 'WITHDRAWAL' as const,
      description,
      createdAt: new Date(),
    })
    saveMockDb()
    return wallet
  },

  async purchaseCourse(userId: string, courseId: string, amount: number, courseTitle: string) {
    const description = `Pembelian Kelas: ${courseTitle}`
    if (await isDbConnected()) {
      try {
        return await db.$transaction(async (tx) => {
          const wallet = await tx.wallet.findUnique({ where: { userId } })
          if (!wallet || wallet.balance < amount) throw new Error('Saldo tidak mencukupi')
          await tx.wallet.update({
            where: { userId },
            data: { balance: { decrement: amount } }
          })
          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              amount,
              type: 'WITHDRAWAL',
              description
            }
          })
          
          const user = await tx.user.findUnique({ where: { id: userId } })
          if (user) {
            let configObj: any = {}
            try {
              configObj = JSON.parse(user.landingPageConfig || '{}')
            } catch (_) {}
            const purchased = Array.isArray(configObj.purchasedCourseIds) ? configObj.purchasedCourseIds : []
            if (!purchased.includes(courseId)) {
              purchased.push(courseId)
            }
            configObj.purchasedCourseIds = purchased
            await tx.user.update({
              where: { id: userId },
              data: { landingPageConfig: JSON.stringify(configObj) }
            })
          }
          return true
        })
      } catch (e: any) {
        throw new Error(e.message || 'Gagal memproses transaksi database')
      }
    }

    const wallet = globalMockWallets.find(w => w.userId === userId)
    if (!wallet || wallet.balance < amount) throw new Error('Saldo tidak mencukupi')
    wallet.balance -= amount
    globalMockWalletTransactions.push({
      id: `tx-${Date.now()}`,
      walletId: wallet.id,
      amount,
      type: 'WITHDRAWAL' as const,
      description,
      createdAt: new Date(),
    })

    const user = globalMockUsers.find(u => u.id === userId)
    if (user) {
      let configObj: any = {}
      try {
        configObj = JSON.parse(user.landingPageConfig || '{}')
      } catch (_) {}
      const purchased = Array.isArray(configObj.purchasedCourseIds) ? configObj.purchasedCourseIds : []
      if (!purchased.includes(courseId)) {
        purchased.push(courseId)
      }
      configObj.purchasedCourseIds = purchased
      user.landingPageConfig = JSON.stringify(configObj)
    }
    saveMockDb()
    return true
  },

  async depositFunds(userId: string, amount: number, method: string = 'Payment Gateway') {
    if (await isDbConnected()) {
      try {
        return await db.$transaction(async (tx) => {
          const wallet = await tx.wallet.findUnique({ where: { userId } })
          if (!wallet) throw new Error('Wallet tidak ditemukan')
          const updatedWallet = await tx.wallet.update({
            where: { userId },
            data: { balance: { increment: amount } }
          })
          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              amount,
              type: 'DEPOSIT',
              description: `Isi saldo via ${method}`
            }
          })
          return updatedWallet
        })
      } catch (_) {}
    }
    const wallet = globalMockWallets.find(w => w.userId === userId)
    if (!wallet) throw new Error('Wallet tidak ditemukan')
    wallet.balance += amount
    globalMockWalletTransactions.push({
      id: `tx-${Date.now()}`,
      walletId: wallet.id,
      amount,
      type: 'DEPOSIT' as const,
      description: `Isi saldo via ${method}`,
      createdAt: new Date(),
    })
    saveMockDb()
    return wallet
  },

  async updateLandingPage(userId: string, template: string, config: string, latitude?: number, longitude?: number) {
    if (await isDbConnected()) {
      try {
        return await db.user.update({
          where: { id: userId },
          data: {
            landingPageTemplate: template,
            landingPageConfig: config,
            landingPageSetup: true,
            ...(latitude !== undefined ? { latitude } : {}),
            ...(longitude !== undefined ? { longitude } : {})
          }
        })
      } catch (_) {}
    }
    const user = globalMockUsers.find(u => u.id === userId)
    if (user) {
      user.landingPageTemplate = template
      user.landingPageConfig = config
      user.landingPageSetup = true
      if (latitude !== undefined) user.latitude = latitude
      if (longitude !== undefined) user.longitude = longitude
      user.updatedAt = new Date()
      saveMockDb()
      return user
    }
    return null
  },

  async addXp(userId: string, amount: number) {
    if (await isDbConnected()) {
      try {
        const user = await db.user.findUnique({ where: { id: userId } })
        if (user) {
          const newXp = user.xp + amount
          const newLevel = Math.floor(newXp / 100) + 1
          return await db.user.update({
            where: { id: userId },
            data: { xp: newXp, level: newLevel }
          })
        }
      } catch (_) {}
    }
    const user = globalMockUsers.find(u => u.id === userId)
    if (user) {
      user.xp = (user.xp || 0) + amount
      user.level = Math.floor(user.xp / 100) + 1
      user.updatedAt = new Date()
      saveMockDb()
      return user
    }
    return null
  },

  // ORDER / TRANSACTION OPERATIONS
  async createOrder(
    buyerId: string,
    items: Array<{ productId: string; quantity: number }>,
    affiliateId?: string,
    paymentMethod: 'MIDTRANS' | 'WALLET' = 'MIDTRANS',
    shippingDetails?: {
      shippingFee?: number
      courier?: string
      shippingAddress?: string
      couponCode?: string
      discountAmount?: number
      bumpSales?: string
    }
  ) {
    const getProductPriceWithWholesale = (basePrice: number, qty: number) => {
      if (qty >= 10) return basePrice * 0.80
      if (qty >= 5) return basePrice * 0.90
      if (qty >= 3) return basePrice * 0.95
      return basePrice
    }

    const pickWaKey = (merchantWaKeys: string | null | undefined): string => {
      if (!merchantWaKeys) return 'TERAS_DEFAULT_GATEWAY_KEY'
      const keys = merchantWaKeys.split(',').map(k => k.trim()).filter(Boolean)
      if (keys.length === 0) return 'TERAS_DEFAULT_GATEWAY_KEY'
      const randomIndex = Math.floor(Math.random() * keys.length)
      return keys[randomIndex]
    }

    const orderId = `order-${Date.now()}`

    if (await isDbConnected()) {
      try {
        return await db.$transaction(async (tx) => {
          let subtotal = 0
          const orderItemsData = []
          const productsWithQuantities = []

          for (const item of items) {
            const product = await tx.product.findUnique({ where: { id: item.productId } })
            if (!product || product.stock < item.quantity) throw new Error('Stok produk tidak mencukupi')

            // Decrement Stock
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } }
            })

            const finalPrice = getProductPriceWithWholesale(product.price, item.quantity)
            const itemPrice = finalPrice * item.quantity
            subtotal += itemPrice

            orderItemsData.push({
              productId: item.productId,
              quantity: item.quantity,
              price: finalPrice
            })

            productsWithQuantities.push({ product, quantity: item.quantity, itemPrice })
          }

          // Bump sales
          let bumpSalesTotal = 0
          if (shippingDetails?.bumpSales) {
            const activeBumps = shippingDetails.bumpSales.split(',')
            activeBumps.forEach(bump => {
              if (bump === 'GARANSI_PREMIUM') bumpSalesTotal += 25000
              if (bump === 'BOX_KAYU') bumpSalesTotal += 15000
              if (bump === 'KERTAS_KADO') bumpSalesTotal += 5000
            })
          }

          // Coupon discount
          let computedDiscount = 0
          if (shippingDetails?.couponCode) {
            const code = shippingDetails.couponCode.toUpperCase()
            if (code === 'DISKON10') {
              computedDiscount = subtotal * 0.1
            } else if (code === 'Saloka.id') {
              computedDiscount = Math.min(20000, subtotal)
            } else if (code === 'GRATISONGKIR') {
              computedDiscount = shippingDetails.shippingFee || 0
            }
          }

          const shippingFee = shippingDetails?.shippingFee || 0
          const finalTotal = subtotal + shippingFee + bumpSalesTotal - computedDiscount

          // Wallet payment deduction
          if (paymentMethod === 'WALLET') {
            const buyerWallet = await tx.wallet.findUnique({ where: { userId: buyerId } })
            if (!buyerWallet || buyerWallet.balance < finalTotal) {
              throw new Error('Saldo dompet tidak mencukupi')
            }
            await tx.wallet.update({
              where: { userId: buyerId },
              data: { balance: { decrement: finalTotal } }
            })
            await tx.walletTransaction.create({
              data: {
                walletId: buyerWallet.id,
                amount: finalTotal,
                type: 'WITHDRAWAL',
                description: `Pembayaran Order ${orderId}`
              }
            })
          }

          // Points and Cashback
          const pointsToAdd = finalTotal * 0.01
          const cashbackToAdd = finalTotal * 0.05

          // Update buyer points
          await tx.user.update({
            where: { id: buyerId },
            data: { points: { increment: pointsToAdd } }
          })

          // Update buyer wallet for cashback
          const buyerWallet = await tx.wallet.findUnique({ where: { userId: buyerId } })
          if (buyerWallet) {
            await tx.wallet.update({
              where: { userId: buyerId },
              data: { balance: { increment: cashbackToAdd } }
            })
            await tx.walletTransaction.create({
              data: {
                walletId: buyerWallet.id,
                amount: cashbackToAdd,
                type: 'DEPOSIT',
                description: `Cashback 5% Pembelian Order ${orderId}`
              }
            })
          }

          // Create order
          const order = await tx.order.create({
            data: {
              id: orderId,
              buyerId,
              totalAmount: finalTotal,
              status: 'COMPLETED',
              shippingFee,
              courier: shippingDetails?.courier || null,
              shippingAddress: shippingDetails?.shippingAddress || null,
              couponCode: shippingDetails?.couponCode || null,
              discountAmount: computedDiscount,
              bumpSales: shippingDetails?.bumpSales || null,
              items: {
                create: orderItemsData
              }
            }
          })

          // Process affiliate commissions and JV splits
          const buyerObj = await tx.user.findUnique({ where: { id: buyerId } })
          const activeAffiliateId = affiliateId || buyerObj?.parentAffiliateId || null

          for (const item of productsWithQuantities) {
            const { product, itemPrice } = item
            let merchantEarnings = itemPrice

            // Check product category for digital product auto-activation
            if (product.category === 'JASA' || product.category === 'KERJAAN') {
              const targetAccess = product.category === 'KERJAAN' ? 'Diamond' : 'Platinum';
              const targetLevel = product.category === 'KERJAAN' ? 'Distributor' : 'Agen';
              const levelsMap: Record<string, number> = { Gold: 1, Platinum: 2, Diamond: 3 };
              const currentRank = levelsMap[buyerObj?.membershipAccess || 'Gold'] || 1;
              const targetRank = levelsMap[targetAccess] || 1;
              if (currentRank < targetRank) {
                await tx.user.update({
                  where: { id: buyerId },
                  data: {
                    membershipAccess: targetAccess,
                    membershipLevel: targetLevel
                  }
                });
              }
            }

            // 1. Handle Affiliate Commission Splits (60/10/10/20 — Revisi Pert Keempat)
            // 60% affiliate, 10% komunitas induk merchant, 10% pengundang, 20% admin
            if (product.isAffiliateEnabled) {
              const hasPromoter = activeAffiliateId && activeAffiliateId !== product.merchantId;
              const hasParent = buyerObj?.parentAffiliateId && buyerObj?.parentAffiliateId !== product.merchantId;

              if (hasPromoter || hasParent) {
                let totalComm = 0
                if (product.affiliateCommissionType === 'PERCENT') {
                  totalComm = itemPrice * ((product.affiliateCommissionValue || 0) / 100)
                } else {
                  totalComm = (product.affiliateCommissionValue || 0) * item.quantity
                }

                if (totalComm > 0) {
                  merchantEarnings -= totalComm

                const promoterComm = totalComm * 0.60
                const communityComm = totalComm * 0.10  // Komunitas induk merchant
                const parentComm = totalComm * 0.10     // Pengundang
                let adminComm = totalComm * 0.20

                // Promoter (Tier 1) - 60%
                let promoterPaid = false
                if (activeAffiliateId && activeAffiliateId !== product.merchantId) {
                  const promoterWallet = await tx.wallet.findUnique({ where: { userId: activeAffiliateId } })
                  if (promoterWallet) {
                    await tx.wallet.update({
                      where: { userId: activeAffiliateId },
                      data: { balance: { increment: promoterComm } }
                    })
                    await tx.walletTransaction.create({
                      data: {
                        walletId: promoterWallet.id,
                        amount: promoterComm,
                        type: 'COMMISSION',
                        description: `Komisi Affiliate Tier 1 dari penjualan ${product.title}`
                      }
                    })
                    await tx.affiliateReferral.create({
                      data: {
                        affiliateId: activeAffiliateId,
                        buyerId,
                        amount: promoterComm,
                        status: 'PAID'
                      }
                    })
                    // Award XP (+30 XP)
                    const affUser = await tx.user.findUnique({ where: { id: activeAffiliateId } })
                    if (affUser) {
                      await tx.user.update({
                        where: { id: activeAffiliateId },
                        data: { xp: affUser.xp + 30, level: Math.floor((affUser.xp + 30) / 100) + 1 }
                      })
                    }
                    promoterPaid = true
                  }
                }
                if (!promoterPaid) adminComm += promoterComm

                // Komunitas Induk Merchant - 10%
                let communityPaid = false
                const merchantObj = await tx.user.findUnique({ where: { id: product.merchantId } })
                const indukCommunityId = (merchantObj as any)?.indukCommunityId
                if (indukCommunityId) {
                  // Find ketua komunitas to pay the community share
                  const community = await tx.community.findUnique({ where: { id: indukCommunityId } })
                  if (community) {
                    const ketuaWallet = await tx.wallet.findUnique({ where: { userId: community.ketuaId } })
                    if (ketuaWallet) {
                      await tx.wallet.update({
                        where: { userId: community.ketuaId },
                        data: { balance: { increment: communityComm } }
                      })
                      await tx.walletTransaction.create({
                        data: {
                          walletId: ketuaWallet.id,
                          amount: communityComm,
                          type: 'COMMISSION',
                          description: `Komisi Komunitas Induk (10%) dari penjualan ${product.title}`
                        }
                      })
                      communityPaid = true
                    }
                  }
                }
                if (!communityPaid) adminComm += communityComm

                // Pengundang / Parent - 10%
                let parentPaid = false
                const buyerParentId = buyerObj?.parentAffiliateId
                if (buyerParentId && buyerParentId !== product.merchantId) {
                  const parentWallet = await tx.wallet.findUnique({ where: { userId: buyerParentId } })
                  if (parentWallet) {
                    await tx.wallet.update({
                      where: { userId: buyerParentId },
                      data: { balance: { increment: parentComm } }
                    })
                    await tx.walletTransaction.create({
                      data: {
                        walletId: parentWallet.id,
                        amount: parentComm,
                        type: 'COMMISSION',
                        description: `Komisi Pengundang (10%) dari penjualan ${product.title}`
                      }
                    })
                    await tx.affiliateReferral.create({
                      data: {
                        affiliateId: buyerParentId,
                        buyerId,
                        amount: parentComm,
                        status: 'PAID'
                      }
                    })
                    // Award XP (+15 XP)
                    const parentUser = await tx.user.findUnique({ where: { id: buyerParentId } })
                    if (parentUser) {
                      await tx.user.update({
                        where: { id: buyerParentId },
                        data: { xp: parentUser.xp + 15, level: Math.floor((parentUser.xp + 15) / 100) + 1 }
                      })
                    }
                    parentPaid = true
                  }
                }
                if (!parentPaid) adminComm += parentComm

                // Admin/Perusahaan - 20% + Absorbed
                const adminWallet = await tx.wallet.findUnique({ where: { userId: 'user-admin-1' } })
                if (adminWallet) {
                  await tx.wallet.update({
                    where: { userId: 'user-admin-1' },
                    data: { balance: { increment: adminComm } }
                  })
                  await tx.walletTransaction.create({
                    data: {
                      walletId: adminWallet.id,
                      amount: adminComm,
                      type: 'COMMISSION',
                      description: `Komisi Admin (20%) dari penjualan ${product.title}`
                    }
                  })
                }
              }
              } else {
                // Orphan Sale: No affiliates. Just charge 1% admin tax instead.
                const adminTax = itemPrice * 0.01;
                merchantEarnings -= adminTax;
                const adminWallet = await tx.wallet.findUnique({ where: { userId: 'user-admin-1' } })
                if (adminWallet) {
                  await tx.wallet.update({
                    where: { userId: 'user-admin-1' },
                    data: { balance: { increment: adminTax } }
                  })
                  await tx.walletTransaction.create({
                    data: {
                      walletId: adminWallet.id,
                      amount: adminTax,
                      type: 'COMMISSION',
                      description: `Admin Tax 1% (Organik) dari penjualan ${product.title}`
                    }
                  })
                }
              }
            }

            // 2. Handle JV Partner splits
            if (product.jvPartnerId && product.jvSharePercent && product.jvSharePercent > 0) {
              const jvShare = itemPrice * (product.jvSharePercent / 100)
              merchantEarnings -= jvShare

              const jvWallet = await tx.wallet.findUnique({ where: { userId: product.jvPartnerId } })
              if (jvWallet) {
                await tx.wallet.update({
                  where: { userId: product.jvPartnerId },
                  data: { balance: { increment: jvShare } }
                })
                await tx.walletTransaction.create({
                  data: {
                    walletId: jvWallet.id,
                    amount: jvShare,
                    type: 'SALE',
                    description: `Bagi hasil JV Partner (${product.jvSharePercent}%) untuk produk ${product.title}`
                  }
                })
              }
            }

            // Update Merchant balance
            const merchantWallet = await tx.wallet.findUnique({ where: { userId: product.merchantId } })
            if (merchantWallet) {
              await tx.wallet.update({
                where: { userId: product.merchantId },
                data: { balance: { increment: merchantEarnings } }
              })
              await tx.walletTransaction.create({
                data: {
                  walletId: merchantWallet.id,
                  amount: merchantEarnings,
                  type: 'SALE',
                  description: `Penjualan produk: ${product.title} (x${item.quantity})`
                }
              })
              // Add XP to merchant (+100 XP)
              const merch = await tx.user.findUnique({ where: { id: product.merchantId } })
              if (merch) {
                await tx.user.update({
                  where: { id: product.merchantId },
                  data: { xp: merch.xp + 100, level: Math.floor((merch.xp + 100) / 100) + 1 }
                })
              }
            }

            // WhatsApp Notification simulation
            const merchantUser = await tx.user.findUnique({ where: { id: product.merchantId } })
            const waKey = pickWaKey(merchantUser?.waGatewayKeys || '')
            globalMockWaLogs.push({
              id: `wa-log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              timestamp: new Date(),
              merchantId: product.merchantId,
              merchantName: merchantUser?.name || 'Merchant',
              apiKeyUsed: waKey,
              recipient: buyerObj?.name || 'Pembeli',
              message: `[WA Gateway API Key: ${waKey}] Halo ${buyerObj?.name || 'Pelanggan'}, pesanan Anda dengan ID ${orderId} senilai Rp ${finalTotal.toLocaleString('id-ID')} telah berhasil diproses. Terima kasih!`,
              status: 'SUCCESS'
            })
          }

          // Create initial order tracking step
          await tx.orderTracking.create({
            data: {
              orderId: order.id,
              status: 'CONFIRMED',
              note: 'Pembayaran telah diterima dan pesanan sedang disiapkan.'
            }
          });

          // Send notification to buyer
          await tx.notification.create({
            data: {
              userId: buyerId,
              type: 'ORDER_PLACED',
              title: 'Pesanan Berhasil Dibayar',
              body: `Pesanan #${order.id} senilai Rp ${finalTotal.toLocaleString('id-ID')} sedang disiapkan oleh merchant.`,
              linkUrl: `/orders/${order.id}`
            }
          });

          // Send notification to merchant
          const notifiedMerchants = new Set<string>();
          for (const item of productsWithQuantities) {
            const { product } = item;
            if (!notifiedMerchants.has(product.merchantId)) {
              notifiedMerchants.add(product.merchantId);
              await tx.notification.create({
                data: {
                  userId: product.merchantId,
                  type: 'ORDER_PLACED',
                  title: 'Ada Pesanan Baru!',
                  body: `Pesanan #${order.id} dari ${buyerObj?.name || 'Customer'} baru saja diterima.`,
                  linkUrl: `/merchant/dashboard?tab=orders`
                }
              });
            }
          }

          return order
        })
      } catch (_) {}
    }

    // In-memory simulation
    let subtotal = 0
    const productsWithQuantities = []

    for (const item of items) {
      const product = globalMockProducts.find(p => p.id === item.productId)
      if (!product) throw new Error(`Produk tidak ditemukan. Hapus produk dari keranjang dan coba lagi.`)
      if (product.merchantId === buyerId && process.env.NODE_ENV === 'production') throw new Error(`Anda tidak dapat membeli produk Anda sendiri ("${product.title}"). Hapus produk tersebut dari keranjang.`)
      if (product.stock < item.quantity) throw new Error('Stok produk tidak mencukupi')
      product.stock -= item.quantity

      const finalPrice = getProductPriceWithWholesale(product.price, item.quantity)
      const itemPrice = finalPrice * item.quantity
      subtotal += itemPrice

      productsWithQuantities.push({ product, quantity: item.quantity, itemPrice })
    }

    // Bump sales
    let bumpSalesTotal = 0
    if (shippingDetails?.bumpSales) {
      const activeBumps = shippingDetails.bumpSales.split(',')
      activeBumps.forEach(bump => {
        if (bump === 'GARANSI_PREMIUM') bumpSalesTotal += 25000
        if (bump === 'BOX_KAYU') bumpSalesTotal += 15000
        if (bump === 'KERTAS_KADO') bumpSalesTotal += 5000
      })
    }

    // Coupon discount
    let computedDiscount = 0
    if (shippingDetails?.couponCode) {
      const code = shippingDetails.couponCode.toUpperCase()
      if (code === 'DISKON10') {
        computedDiscount = subtotal * 0.1
      } else if (code === 'Saloka.id') {
        computedDiscount = Math.min(20000, subtotal)
      } else if (code === 'GRATISONGKIR') {
        computedDiscount = shippingDetails.shippingFee || 0
      }
    }

    const shippingFee = shippingDetails?.shippingFee || 0
    const finalTotal = subtotal + shippingFee + bumpSalesTotal - computedDiscount

    // Wallet deduction
    if (paymentMethod === 'WALLET') {
      const buyerWallet = globalMockWallets.find(w => w.userId === buyerId)
      if (!buyerWallet || buyerWallet.balance < finalTotal) {
        throw new Error('Saldo dompet tidak mencukupi')
      }
      buyerWallet.balance -= finalTotal
      globalMockWalletTransactions.push({
        id: `tx-${Date.now()}-wallet-pay`,
        walletId: buyerWallet.id,
        amount: finalTotal,
        type: 'WITHDRAWAL' as const,
        description: `Pembayaran Order ${orderId}`,
        createdAt: new Date()
      })
    }

    // Points and cashback
    const pointsToAdd = finalTotal * 0.01
    const cashbackToAdd = finalTotal * 0.05

    const buyerUser = globalMockUsers.find(u => u.id === buyerId)
    if (buyerUser) {
      buyerUser.points = (buyerUser.points || 0) + pointsToAdd
      buyerUser.xp = (buyerUser.xp || 0) + 30
      buyerUser.level = Math.floor(buyerUser.xp / 100) + 1
    }

    const buyerWalletObj = globalMockWallets.find(w => w.userId === buyerId)
    if (buyerWalletObj) {
      buyerWalletObj.balance += cashbackToAdd
      globalMockWalletTransactions.push({
        id: `tx-${Date.now()}-cashback`,
        walletId: buyerWalletObj.id,
        amount: cashbackToAdd,
        type: 'DEPOSIT' as const,
        description: `Cashback 5% Pembelian Order ${orderId}`,
        createdAt: new Date()
      })
    }

    // Credit merchants and affiliates
    const activeAffiliateId = affiliateId || buyerUser?.parentAffiliateId || null

    for (const item of productsWithQuantities) {
      const { product, itemPrice } = item
      let merchantEarnings = itemPrice

      // Check product category for digital product auto-activation
      if (product.category === 'JASA' || product.category === 'KERJAAN') {
        const targetAccess = product.category === 'KERJAAN' ? 'Diamond' : 'Platinum';
        const targetLevel = product.category === 'KERJAAN' ? 'Distributor' : 'Agen';
        const levelsMap: Record<string, number> = { Gold: 1, Platinum: 2, Diamond: 3 };
        const currentRank = levelsMap[buyerUser?.membershipAccess || 'Gold'] || 1;
        const targetRank = levelsMap[targetAccess] || 1;
        if (currentRank < targetRank && buyerUser) {
          buyerUser.membershipAccess = targetAccess;
          buyerUser.membershipLevel = targetLevel;
        }
      }

      // 1. Handle Affiliate Commission Splits (60/10/10/20 — Revisi Pert Keempat)
      // 60% affiliate, 10% komunitas induk merchant, 10% pengundang, 20% admin
      if (product.isAffiliateEnabled) {
        const hasPromoter = activeAffiliateId && activeAffiliateId !== product.merchantId;
        const hasParent = buyerUser?.parentAffiliateId && buyerUser?.parentAffiliateId !== product.merchantId;

        if (hasPromoter || hasParent) {
          let totalComm = 0
          if (product.affiliateCommissionType === 'PERCENT') {
            totalComm = itemPrice * ((product.affiliateCommissionValue || 0) / 100)
          } else {
            totalComm = (product.affiliateCommissionValue || 0) * item.quantity
          }

          if (totalComm > 0) {
            merchantEarnings -= totalComm

          const promoterComm = totalComm * 0.60
          const communityComm = totalComm * 0.10  // Komunitas induk merchant
          const parentComm = totalComm * 0.10     // Pengundang
          let adminComm = totalComm * 0.20

          // Promoter (Tier 1) - 60%
          let promoterPaid = false
          if (activeAffiliateId && activeAffiliateId !== product.merchantId) {
            const promoterWallet = globalMockWallets.find(w => w.userId === activeAffiliateId)
            if (promoterWallet) {
              promoterWallet.balance += promoterComm
              globalMockWalletTransactions.push({
                id: `tx-${Date.now()}-aff-1`,
                walletId: promoterWallet.id,
                amount: promoterComm,
                type: 'COMMISSION' as const,
                description: `Komisi Affiliate Tier 1 dari penjualan ${product.title}`,
                createdAt: new Date()
              })
              globalMockReferrals.push({
                id: `ref-${Date.now()}-1`,
                affiliateId: activeAffiliateId,
                buyerId,
                amount: promoterComm,
                status: 'PAID' as const,
                createdAt: new Date(),
                updatedAt: new Date()
              })
              const affUser = globalMockUsers.find(u => u.id === activeAffiliateId)
              if (affUser) {
                affUser.xp = (affUser.xp || 0) + 30
                affUser.level = Math.floor(affUser.xp / 100) + 1
              }
              promoterPaid = true
            }
          }
          if (!promoterPaid) adminComm += promoterComm

          // Komunitas Induk Merchant - 10%
          let communityPaid = false
          const merchantUser2 = globalMockUsers.find(u => u.id === product.merchantId)
          const indukId = (merchantUser2 as any)?.indukCommunityId
          if (indukId) {
            const community = (globalThis as any).__mockCommunities?.find((c: any) => c.id === indukId)
            if (community) {
              const ketuaWallet = globalMockWallets.find(w => w.userId === community.ketuaId)
              if (ketuaWallet) {
                ketuaWallet.balance += communityComm
                globalMockWalletTransactions.push({
                  id: `tx-${Date.now()}-comm-induk`,
                  walletId: ketuaWallet.id,
                  amount: communityComm,
                  type: 'COMMISSION' as const,
                  description: `Komisi Komunitas Induk (10%) dari penjualan ${product.title}`,
                  createdAt: new Date()
                })
                communityPaid = true
              }
            }
          }
          if (!communityPaid) adminComm += communityComm

          // Pengundang / Parent - 10%
          let parentPaid = false
          const buyerParentId = buyerUser?.parentAffiliateId
          if (buyerParentId && buyerParentId !== product.merchantId) {
            const parentWallet = globalMockWallets.find(w => w.userId === buyerParentId)
            if (parentWallet) {
              parentWallet.balance += parentComm
              globalMockWalletTransactions.push({
                id: `tx-${Date.now()}-aff-2`,
                walletId: parentWallet.id,
                amount: parentComm,
                type: 'COMMISSION' as const,
                description: `Komisi Pengundang (10%) dari penjualan ${product.title}`,
                createdAt: new Date()
              })
              globalMockReferrals.push({
                id: `ref-${Date.now()}-2`,
                affiliateId: buyerParentId,
                buyerId,
                amount: parentComm,
                status: 'PAID' as const,
                createdAt: new Date(),
                updatedAt: new Date()
              })
              const parentUser = globalMockUsers.find(u => u.id === buyerParentId)
              if (parentUser) {
                parentUser.xp = (parentUser.xp || 0) + 15
                parentUser.level = Math.floor(parentUser.xp / 100) + 1
              }
              parentPaid = true
            }
          }
          if (!parentPaid) adminComm += parentComm

          // Admin/Perusahaan - 20%
          const adminWallet = globalMockWallets.find(w => w.userId === 'user-admin-1')
          if (adminWallet) {
            adminWallet.balance += adminComm
            globalMockWalletTransactions.push({
              id: `tx-${Date.now()}-aff-admin`,
              walletId: adminWallet.id,
              amount: adminComm,
              type: 'COMMISSION' as const,
              description: `Komisi Admin (20%) dari penjualan ${product.title}`,
              createdAt: new Date()
            })
          }
        }
        } else {
          // Orphan Sale: No affiliates. Just charge 1% admin tax.
          const adminTax = itemPrice * 0.01;
          merchantEarnings -= adminTax;
          const adminWallet = globalMockWallets.find(w => w.userId === 'user-admin-1')
          if (adminWallet) {
            adminWallet.balance += adminTax
            globalMockWalletTransactions.push({
              id: `tx-${Date.now()}-aff-admin-tax`,
              walletId: adminWallet.id,
              amount: adminTax,
              type: 'COMMISSION' as const,
              description: `Admin Tax 1% (Organik) dari penjualan ${product.title}`,
              createdAt: new Date()
            })
          }
        }
      }

      // JV split
      if (product.jvPartnerId && product.jvSharePercent && product.jvSharePercent > 0) {
        const jvShare = itemPrice * (product.jvSharePercent / 100)
        merchantEarnings -= jvShare

        const jvWallet = globalMockWallets.find(w => w.userId === product.jvPartnerId)
        if (jvWallet) {
          jvWallet.balance += jvShare
          globalMockWalletTransactions.push({
            id: `tx-${Date.now()}-jv`,
            walletId: jvWallet.id,
            amount: jvShare,
            type: 'SALE' as const,
            description: `Bagi hasil JV Partner (${product.jvSharePercent}%) untuk produk ${product.title}`,
            createdAt: new Date()
          })
        }
      }

      // Credit merchant
      const merchantWallet = globalMockWallets.find(w => w.userId === product.merchantId)
      if (merchantWallet) {
        merchantWallet.balance += merchantEarnings
        globalMockWalletTransactions.push({
          id: `tx-${Date.now()}-merch`,
          walletId: merchantWallet.id,
          amount: merchantEarnings,
          type: 'SALE' as const,
          description: `Penjualan produk: ${product.title} (x${item.quantity})`,
          createdAt: new Date()
        })
        const merch = globalMockUsers.find(u => u.id === product.merchantId)
        if (merch) {
          merch.xp = (merch.xp || 0) + 100
          merch.level = Math.floor(merch.xp / 100) + 1
        }
      }

      // WA Notification simulation
      const merchantUserObj = globalMockUsers.find(u => u.id === product.merchantId)
      const waKey = pickWaKey(merchantUserObj?.waGatewayKeys || '')
      globalMockWaLogs.push({
        id: `wa-log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        timestamp: new Date(),
        merchantId: product.merchantId,
        merchantName: merchantUserObj?.name || 'Merchant',
        apiKeyUsed: waKey,
        recipient: buyerUser?.name || 'Pembeli',
        message: `[WA Gateway API Key: ${waKey}] Halo ${buyerUser?.name || 'Pelanggan'}, pesanan Anda dengan ID ${orderId} senilai Rp ${finalTotal.toLocaleString('id-ID')} telah berhasil diproses. Terima kasih!`,
        status: 'SUCCESS'
      })
    }

    const orderObj = {
      id: orderId,
      buyerId,
      totalAmount: finalTotal,
      status: 'COMPLETED' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: productsWithQuantities.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
        productTitle: item.product.title
      }))
    }
    // Create initial order tracking step
    globalMockOrderTrackings.push({
      id: `ot-${Date.now()}`,
      orderId,
      status: 'CONFIRMED',
      note: 'Pembayaran telah diterima dan pesanan sedang disiapkan.',
      createdAt: new Date()
    });

    // Send notification to buyer
    globalMockNotifications.push({
      id: `notif-${Date.now()}-buyer`,
      userId: buyerId,
      type: 'ORDER_PLACED',
      title: 'Pesanan Berhasil Dibayar',
      body: `Pesanan #${orderId} senilai Rp ${finalTotal.toLocaleString('id-ID')} sedang disiapkan oleh merchant.`,
      isRead: false,
      linkUrl: `/orders/${orderId}`,
      createdAt: new Date()
    });

    // Send notification to merchants
    const notifiedMerchants = new Set<string>();
    for (const item of productsWithQuantities) {
      const { product } = item;
      if (!notifiedMerchants.has(product.merchantId)) {
        notifiedMerchants.add(product.merchantId);
        globalMockNotifications.push({
          id: `notif-${Date.now()}-merch-${product.merchantId}`,
          userId: product.merchantId,
          type: 'ORDER_PLACED',
          title: 'Ada Pesanan Baru!',
          body: `Pesanan #${orderId} dari ${buyerUser?.name || 'Customer'} baru saja diterima.`,
          isRead: false,
          linkUrl: `/merchant/dashboard?tab=orders`,
          createdAt: new Date()
        });
      }
    }

    globalMockOrders.push(orderObj)
    saveMockDb()

    return orderObj
  },

  // COMMUNITY / FORUM OPERATIONS
  async getPosts(groupId?: string) {
    if (await isDbConnected()) {
      try {
        const filter = groupId && groupId !== 'all' ? { groupId } : {}
        const list = await db.post.findMany({
          where: filter,
          include: {
            author: true,
            likes: true,
            _count: { select: { comments: true } }
          },
          orderBy: { createdAt: 'desc' }
        })
        return list.map(p => ({
          ...p,
          likes: p.likes.map(l => l.userId),
          _count: {
            comments: p._count.comments
          }
        }))
      } catch (_) {}
    }

    return globalMockPosts
      .filter(p => {
        if (groupId && groupId !== 'all') {
          // If mock post has an explicit groupId or we map it based on prefix/content
          const postGroupId = p.groupId || (
            p.id.includes('kopi') ? 'group-kopi' : 
            p.id.includes('fashion') ? 'group-fashion' : 
            'group-umum'
          )
          return postGroupId === groupId
        }
        return true
      })
      .map(p => {
        let imageUrl = p.imageUrl || null
        let videoUrl = p.videoUrl || null
        let category = p.category || 'Diskusi'
        
        // Inject media into default posts
        if (p.id === 'post-herbal-tips') {
          category = 'Tips Bisnis'
          imageUrl = 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&q=80'
        } else if (p.id === 'post-furni-branding') {
          category = 'Tips Bisnis'
          imageUrl = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80'
        } else if (p.id === 'post-agro-urban') {
          category = 'Tips Bisnis'
          imageUrl = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&q=80'
        } else if (p.id === 'post-silver-ekspor') {
          category = 'Diskusi'
          imageUrl = 'https://images.unsplash.com/photo-1573408301185-9519f94816f0?w=600&q=80'
        } else if (p.id === 'post-komunitas-kopi-1') {
          category = 'Diskusi'
          videoUrl = 'https://www.w3schools.com/html/mov_bbb.mp4'
        }
        
        return {
          ...p,
          category,
          imageUrl,
          videoUrl,
          likes: p.likes || [],
          author: globalMockUsers.find(u => u.id === p.authorId) || null,
          _count: {
            comments: globalMockComments.filter(c => c.postId === p.id).length
          }
        }
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  },

  async getPostById(id: string) {
    if (await isDbConnected()) {
      try {
        const postObj = await db.post.findUnique({
          where: { id },
          include: {
            author: true,
            likes: true,
            comments: {
              include: { author: true },
              orderBy: { createdAt: 'asc' }
            }
          }
        })
        if (!postObj) return null
        return {
          ...postObj,
          likes: postObj.likes.map(l => l.userId),
          comments: postObj.comments
        }
      } catch (_) {}
    }
    const p = globalMockPosts.find(post => post.id === id) || null
    if (!p) return null
    
    let imageUrl = p.imageUrl || null
    let videoUrl = p.videoUrl || null
    let category = p.category || 'Diskusi'
    
    // Inject media into default posts
    if (p.id === 'post-herbal-tips') {
      category = 'Tips Bisnis'
      imageUrl = 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&q=80'
    } else if (p.id === 'post-furni-branding') {
      category = 'Tips Bisnis'
      imageUrl = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80'
    } else if (p.id === 'post-agro-urban') {
      category = 'Tips Bisnis'
      imageUrl = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&q=80'
    } else if (p.id === 'post-silver-ekspor') {
      category = 'Diskusi'
      imageUrl = 'https://images.unsplash.com/photo-1573408301185-9519f94816f0?w=600&q=80'
    } else if (p.id === 'post-komunitas-kopi-1') {
      category = 'Diskusi'
      videoUrl = 'https://www.w3schools.com/html/mov_bbb.mp4'
    }
    
    return {
      ...p,
      category,
      imageUrl,
      videoUrl,
      likes: p.likes || [],
      author: globalMockUsers.find(u => u.id === p.authorId) || null,
      comments: globalMockComments.filter(c => c.postId === p.id).map(c => ({
        ...c,
        author: globalMockUsers.find(u => u.id === c.authorId) || null
      })).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    }
  },

  async createPost(userId: string, title: string, content: string, category?: string, imageUrl?: string, videoUrl?: string, groupId?: string) {
    if (await isDbConnected()) {
      try {
        return await db.post.create({
          data: {
            authorId: userId,
            title,
            content,
            category: category || 'Diskusi',
            imageUrl: imageUrl || null,
            videoUrl: videoUrl || null,
            groupId: groupId || null
          }
        })
      } catch (_) {}
    }
    const newPost = {
      id: `post-${Date.now()}`,
      title,
      content,
      category: category || 'Diskusi',
      imageUrl: imageUrl || null,
      videoUrl: videoUrl || null,
      groupId: groupId || null,
      likes: [],
      authorId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    globalMockPosts.push(newPost)
    saveMockDb()
    return newPost
  },

  async createComment(userId: string, postId: string, content: string) {
    if (await isDbConnected()) {
      try {
        return await db.comment.create({
          data: {
            authorId: userId,
            postId,
            content
          }
        })
      } catch (_) {}
    }
    const newComment = {
      id: `comment-${Date.now()}`,
      postId,
      content,
      authorId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    globalMockComments.push(newComment)
    saveMockDb()
    return newComment
  },

  async toggleLikePost(userId: string, postId: string) {
    if (await isDbConnected()) {
      try {
        const existing = await db.postLike.findUnique({
          where: {
            postId_userId: { postId, userId }
          }
        })
        if (existing) {
          await db.postLike.delete({
            where: {
              id: existing.id
            }
          })
          return { liked: false }
        } else {
          await db.postLike.create({
            data: {
              postId,
              userId
            }
          })
          return { liked: true }
        }
      } catch (_) {}
    }
    
    const post = globalMockPosts.find(p => p.id === postId)
    if (!post) throw new Error('Post not found')
    
    if (!post.likes) {
      post.likes = []
    }
    
    const idx = post.likes.indexOf(userId)
    let liked = false
    if (idx !== -1) {
      post.likes.splice(idx, 1)
      liked = false
    } else {
      post.likes.push(userId)
      liked = true
    }
    saveMockDb()
    return { liked }
  },

  async getCommunityMembers(groupId?: string) {
    if (await isDbConnected()) {
      try {
        if (groupId && groupId !== 'all') {
          const membersList = await db.groupMember.findMany({
            where: { groupId },
            include: { user: true },
            orderBy: { user: { level: 'desc' } }
          })
          return membersList.map(gm => gm.user)
        }
        return await db.user.findMany({
          select: {
            id: true,
            name: true,
            role: true,
            level: true,
            xp: true,
            membershipLevel: true,
            membershipAccess: true,
            createdAt: true
          },
          orderBy: { level: 'desc' }
        })
      } catch (_) {}
    }

    if (groupId && groupId !== 'all') {
      const activeMembers = globalMockGroupMembers
        .filter(gm => gm.groupId === groupId)
        .map(gm => globalMockUsers.find(u => u.id === gm.userId))
        .filter(Boolean)
      return activeMembers.sort((a, b) => b.level - a.level)
    }

    return globalMockUsers.map(u => ({
      id: u.id,
      name: u.name,
      role: u.role,
      level: u.level,
      xp: u.xp,
      membershipLevel: u.membershipLevel,
      membershipAccess: u.membershipAccess,
      createdAt: u.createdAt
    })).sort((a, b) => b.level - a.level)
  },

  // NEW COMMUNITY GROUP OPERATING FUNCTIONS
  async getGroups() {
    if (await isDbConnected()) {
      try {
        return await db.communityGroup.findMany({
          include: {
            admin: true,
            _count: {
              select: { members: true, posts: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        })
      } catch (_) {}
    }

    return globalMockGroups.map(g => {
      const adminUser = globalMockUsers.find(u => u.id === g.adminId) || null
      const membersCount = globalMockGroupMembers.filter(gm => gm.groupId === g.id).length
      const postsCount = globalMockPosts.filter(p => {
        const postGroupId = p.groupId || (p.id.includes('kopi') ? 'group-kopi' : p.id.includes('fashion') ? 'group-fashion' : 'group-umum')
        return postGroupId === g.id
      }).length

      return {
        ...g,
        admin: adminUser,
        _count: {
          members: membersCount,
          posts: postsCount
        }
      }
    })
  },

  async getGroupById(id: string) {
    if (await isDbConnected()) {
      try {
        return await db.communityGroup.findUnique({
          where: { id },
          include: {
            admin: true,
            _count: {
              select: { members: true, posts: true }
            }
          }
        })
      } catch (_) {}
    }

    const g = globalMockGroups.find(group => group.id === id) || null
    if (!g) return null

    const adminUser = globalMockUsers.find(u => u.id === g.adminId) || null
    const membersCount = globalMockGroupMembers.filter(gm => gm.groupId === g.id).length
    const postsCount = globalMockPosts.filter(p => {
      const postGroupId = p.groupId || (p.id.includes('kopi') ? 'group-kopi' : p.id.includes('fashion') ? 'group-fashion' : 'group-umum')
      return postGroupId === g.id
    }).length

    return {
      ...g,
      admin: adminUser,
      _count: {
        members: membersCount,
        posts: postsCount
      }
    }
  },

  async createGroup(adminId: string, name: string, description: string, avatarUrl?: string, coverUrl?: string) {
    if (await isDbConnected()) {
      try {
        const group = await db.communityGroup.create({
          data: {
            adminId,
            name,
            description,
            avatarUrl: avatarUrl || null,
            coverUrl: coverUrl || null
          }
        })
        // Auto-join the creator as a member
        await db.groupMember.create({
          data: {
            groupId: group.id,
            userId: adminId
          }
        })
        return group
      } catch (_) {}
    }

    const newGroup = {
      id: `group-${Date.now()}`,
      name,
      description,
      avatarUrl: avatarUrl || null,
      coverUrl: coverUrl || null,
      isSuspended: false,
      adminId,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    globalMockGroups.push(newGroup)
    
    // Auto-join membership in mock state
    globalMockGroupMembers.push({
      id: `gm-${Date.now()}`,
      groupId: newGroup.id,
      userId: adminId,
      createdAt: new Date()
    })
    
    saveMockDb()
    return newGroup
  },

  async toggleJoinGroup(userId: string, groupId: string) {
    if (await isDbConnected()) {
      try {
        const existing = await db.groupMember.findUnique({
          where: {
            groupId_userId: { groupId, userId }
          }
        })
        if (existing) {
          await db.groupMember.delete({
            where: {
              id: existing.id
            }
          })
          return { joined: false }
        } else {
          await db.groupMember.create({
            data: {
              groupId,
              userId
            }
          })
          return { joined: true }
        }
      } catch (_) {}
    }

    const existingIdx = globalMockGroupMembers.findIndex(gm => gm.groupId === groupId && gm.userId === userId)
    let joined = false
    if (existingIdx !== -1) {
      globalMockGroupMembers.splice(existingIdx, 1)
      joined = false
    } else {
      globalMockGroupMembers.push({
        id: `gm-${Date.now()}`,
        groupId,
        userId,
        createdAt: new Date()
      })
      joined = true
    }
    saveMockDb()
    return { joined }
  },

  async isGroupMember(userId: string, groupId: string) {
    if (await isDbConnected()) {
      try {
        const existing = await db.groupMember.findUnique({
          where: {
            groupId_userId: { groupId, userId }
          }
        })
        return !!existing
      } catch (_) {}
    }
    return globalMockGroupMembers.some(gm => gm.groupId === groupId && gm.userId === userId)
  },

  async toggleSuspendGroup(groupId: string) {
    if (await isDbConnected()) {
      try {
        const group = await db.communityGroup.findUnique({ where: { id: groupId } })
        if (!group) throw new Error('Group not found')
        const updated = await db.communityGroup.update({
          where: { id: groupId },
          data: { isSuspended: !group.isSuspended }
        })
        return updated
      } catch (_) {}
    }

    const group = globalMockGroups.find(g => g.id === groupId)
    if (!group) throw new Error('Group not found')
    group.isSuspended = !group.isSuspended
    saveMockDb()
    return group
  },

  async deletePost(postId: string) {
    if (await isDbConnected()) {
      try {
        await db.post.delete({ where: { id: postId } })
        return { success: true }
      } catch (_) {}
    }

    const postIdx = globalMockPosts.findIndex(p => p.id === postId)
    if (postIdx === -1) return { error: 'Post not found' }
    globalMockPosts.splice(postIdx, 1)
    
    // Cascading comments deletion
    globalMockComments = globalMockComments.filter(c => c.postId !== postId)
    saveMockDb()
    return { success: true }
  },

  async deleteComment(commentId: string) {
    if (await isDbConnected()) {
      try {
        await db.comment.delete({ where: { id: commentId } })
        return { success: true }
      } catch (_) {}
    }

    const commentIdx = globalMockComments.findIndex(c => c.id === commentId)
    if (commentIdx === -1) return { error: 'Comment not found' }
    globalMockComments.splice(commentIdx, 1)
    saveMockDb()
    return { success: true }
  },



  // AFFILIATE PORTAL DATA
  async getAffiliateStats(affiliateId: string) {
    syncMockDb()
    let referralsList: any[] = [];
    let walletTransactions: any[] = [];
    
    if (await isDbConnected()) {
      try {
        referralsList = await db.affiliateReferral.findMany({
          where: { affiliateId },
          include: { buyer: true },
          orderBy: { createdAt: 'desc' }
        });
        const wallet = await db.wallet.findUnique({
          where: { userId: affiliateId },
          include: { transactions: true }
        });
        walletTransactions = wallet?.transactions || [];
      } catch (_) {}
    } else {
      referralsList = globalMockReferrals.filter(r => r.affiliateId === affiliateId).map(r => ({
        ...r,
        buyer: globalMockUsers.find(u => u.id === r.buyerId) || null
      })).sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      const wallet = globalMockWallets.find(w => w.userId === affiliateId);
      if (wallet) {
        walletTransactions = globalMockWalletTransactions.filter(t => t.walletId === wallet.id);
      }
    }

    const totalEarnings = referralsList.reduce((sum, r) => sum + r.amount, 0);

    // Calculate commission breakdown by category (Revisi Pert Keempat: 60/10/10/20)
    let affiliateEarnings = 0;   // 60% - Komisi Affiliate
    let communityEarnings = 0;   // 10% - Komunitas Induk
    let inviterEarnings = 0;     // 10% - Pengundang

    walletTransactions.forEach(tx => {
      if (tx.type === 'COMMISSION') {
        const desc = tx.description.toLowerCase();
        if (desc.includes('tier 1') || desc.includes('affiliate') || desc.includes('promoter')) {
          affiliateEarnings += tx.amount;
        } else if (desc.includes('komunitas induk')) {
          communityEarnings += tx.amount;
        } else if (desc.includes('tier 2') || desc.includes('pengundang') || desc.includes('inviter')) {
          inviterEarnings += tx.amount;
        } else {
          // fallback
          affiliateEarnings += tx.amount;
        }
      }
    });

    // Custom links and click counts
    const userLinks = globalMockCustomLinks.filter(l => l.userId === affiliateId);
    const totalClicks = userLinks.reduce((sum, l) => sum + l.clicks, 0);

    // Traffic sources breakdown
    const sourceBreakdown: Record<string, number> = {};
    userLinks.forEach(link => {
      const logs = globalMockClickLogs.filter(log => log.linkId === link.id);
      logs.forEach(log => {
        const src = log.source || 'direct';
        sourceBreakdown[src] = (sourceBreakdown[src] || 0) + 1;
      });
    });

    return {
      referrals: referralsList,
      totalEarnings,
      commissionByTier: {
        affiliate: affiliateEarnings,
        komunitas: communityEarnings,
        pengundang: inviterEarnings
      },
      clicksCount: totalClicks,
      customLinks: userLinks,
      trafficSources: sourceBreakdown
    };
  },

  async createCustomAffiliateLink(userId: string, productId: string, customSlug: string, source: string) {
    syncMockDb()
    // Check if slug already exists
    const exists = globalMockCustomLinks.some(l => l.customSlug === customSlug);
    if (exists) throw new Error('Slug kustom sudah digunakan');

    const newLink = {
      id: `link-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      userId,
      productId,
      customSlug,
      source: source || 'direct',
      clicks: 0,
      createdAt: new Date()
    };
    globalMockCustomLinks.push(newLink);
    saveMockDb()
    return newLink;
  },

  async getCustomAffiliateLinks(userId: string) {
    syncMockDb()
    return globalMockCustomLinks.filter(l => l.userId === userId);
  },

  async trackAffiliateClick(slug: string, source: string = 'direct') {
    syncMockDb()
    const link = globalMockCustomLinks.find(l => l.customSlug === slug);
    if (link) {
      link.clicks = (link.clicks || 0) + 1;
      globalMockClickLogs.push({
        id: `click-${Date.now()}`,
        linkId: link.id,
        source: source || 'direct',
        createdAt: new Date()
      });
      saveMockDb()
      return link;
    }
    return null;
  },

  async upgradeMembershipAccess(userId: string, targetAccess: 'Platinum' | 'Diamond') {
    const priceMap = {
      Platinum: 250000,
      Diamond: 500000
    };
    const targetLevelMap = {
      Platinum: 'Agen',
      Diamond: 'Distributor'
    };
    
    const price = priceMap[targetAccess];
    const newLevel = targetLevelMap[targetAccess];

    if (await isDbConnected()) {
      try {
        await db.$transaction(async (tx) => {
          const wallet = await tx.wallet.findUnique({ where: { userId } });
          if (!wallet || wallet.balance < price) throw new Error('Saldo dompet tidak mencukupi untuk upgrade');

          await tx.wallet.update({
            where: { userId },
            data: { balance: { decrement: price } }
          });

          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              amount: price,
              type: 'WITHDRAWAL',
              description: `Upgrade Keanggotaan Akses ${targetAccess} & Level ${newLevel}`
            }
          });

          await tx.user.update({
            where: { id: userId },
            data: {
              membershipAccess: targetAccess,
              membershipLevel: newLevel,
              // Give bonus XP on upgrade
              xp: { increment: 100 }
            }
          });
        });

        // Re-fetch user
        return await db.user.findUnique({ where: { id: userId } });
      } catch (e: any) {
        throw new Error(e.message || 'Gagal upgrade database');
      }
    }

    // Mock upgrade
    const wallet = globalMockWallets.find(w => w.userId === userId);
    if (!wallet || wallet.balance < price) throw new Error('Saldo dompet tidak mencukupi untuk upgrade');

    wallet.balance -= price;
    globalMockWalletTransactions.push({
      id: `tx-${Date.now()}-upgrade`,
      walletId: wallet.id,
      amount: price,
      type: 'WITHDRAWAL' as const,
      description: `Upgrade Keanggotaan Akses ${targetAccess} & Level ${newLevel}`,
      createdAt: new Date()
    });

    const user = globalMockUsers.find(u => u.id === userId);
    if (user) {
      user.membershipAccess = targetAccess;
      user.membershipLevel = newLevel;
      user.xp = (user.xp || 0) + 100;
      user.level = Math.floor(user.xp / 100) + 1;
      user.updatedAt = new Date();
      return user;
    }
    throw new Error('User tidak ditemukan');
  },

  async getAffiliateLeaderboard() {
    const earningsMap: Record<string, number> = {};

    // Group referrals by affiliateId
    let referralsList: any[] = [];
    if (await isDbConnected()) {
      try {
        referralsList = await db.affiliateReferral.findMany();
      } catch (_) {}
    } else {
      referralsList = globalMockReferrals;
    }

    referralsList.forEach(r => {
      earningsMap[r.affiliateId] = (earningsMap[r.affiliateId] || 0) + r.amount;
    });

    // Populate all active users that have role AFFILIATE or have earnings
    let usersList: any[] = [];
    if (await isDbConnected()) {
      try {
        usersList = await db.user.findMany();
      } catch (_) {}
    } else {
      usersList = globalMockUsers;
    }

    const leaderboard = usersList
      .filter(u => u.role === 'AFFILIATE' || earningsMap[u.id] > 0)
      .map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        totalEarnings: earningsMap[u.id] || 0,
        membershipLevel: u.membershipLevel || 'Reseller',
        level: u.level || 1
      }))
      .sort((a, b) => b.totalEarnings - a.totalEarnings)
      .slice(0, 10);

    return leaderboard;
  },

  async getAffiliateDownline(userId: string) {
    const buildTree = async (id: string, depth: number): Promise<any[]> => {
      if (depth > 3) return [];
      let children: any[] = [];
      if (await isDbConnected()) {
        try {
          children = await db.user.findMany({ where: { parentAffiliateId: id } });
        } catch (_) {}
      } else {
        children = globalMockUsers.filter(u => u.parentAffiliateId === id);
      }
      
      const treeNodes = [];
      for (const child of children) {
        const subTree = await buildTree(child.id, depth + 1);
        treeNodes.push({
          id: child.id,
          name: child.name,
          email: child.email,
          role: child.role,
          membershipLevel: child.membershipLevel || 'Reseller',
          membershipAccess: child.membershipAccess || 'Gold',
          level: child.level || 1,
          children: subTree
        });
      }
      return treeNodes;
    };
    
    return await buildTree(userId, 1);
  },

  async generateDummyAffiliates(count: number = 10) {
    let parentId = 'user-affiliate-1'
    let dbConnected = false
    try {
      dbConnected = await isDbConnected()
    } catch (_) {}
    
    if (dbConnected) {
      const parent = await db.user.findFirst({ where: { role: 'AFFILIATE' } }) || await db.user.findFirst()
      if (parent) parentId = parent.id
      
      const newUsers = []
      const newOrders = []
      
      for (let i = 0; i < count; i++) {
        const id = `dummy-aff-${Date.now()}-${i}`
        const createdAt = new Date(Date.now() - Math.random() * 10000000000)
        newUsers.push({
          id,
          name: `Dummy User ${i + 1}`,
          email: `dummy${i + 1}@saloka.id`,
          passwordHash: 'hashedpassword',
          role: 'CUSTOMER' as any,
          level: 1,
          xp: 0,
          parentAffiliateId: parentId,
          createdAt
        })
      }
      
      try {
        await db.user.createMany({ data: newUsers, skipDuplicates: true })
        
        // Ensure wallet exists for parent if needed later
        let parentWallet = await db.wallet.findUnique({ where: { userId: parentId } })
        if (!parentWallet) {
          parentWallet = await db.wallet.create({ data: { userId: parentId, balance: 0 } })
        }
        
        for (const u of newUsers) {
          const orderId = `dummy-ord-${Date.now()}-${Math.random().toString(36).substring(7)}`
          
          // Get a random product to assign to order
          const product = await db.product.findFirst() || null
          
          await db.order.create({
            data: {
              id: orderId,
              buyerId: u.id,
              totalAmount: 150000,
              status: 'COMPLETED',
              createdAt: u.createdAt,
              updatedAt: u.createdAt,
              items: product ? {
                create: [
                  { productId: product.id, quantity: 1, price: 150000 }
                ]
              } : undefined
            }
          })
          
          // Use AffiliateReferral model to track commissions
          await db.affiliateReferral.create({
            data: {
              affiliateId: parentId,
              buyerId: u.id,
              amount: 15000,
              status: 'PAID',
              createdAt: u.createdAt,
              updatedAt: u.createdAt
            }
          })
          
          // Also add to wallet transaction
          await db.walletTransaction.create({
            data: {
              walletId: parentWallet.id,
              amount: 15000,
              type: 'COMMISSION',
              description: `Komisi Referral dari ${u.name}`,
              createdAt: u.createdAt
            }
          })
        }
      } catch (e) {
        console.error('Failed to seed dummy to DB', e)
      }
      
      return true
    }

    // Fallback to mock arrays
    const mainAffiliateId = 'user-affiliate-1'
    let parent = globalMockUsers.find(u => u.id === mainAffiliateId)
    if (!parent) parent = globalMockUsers.find(u => u.role === 'AFFILIATE') || globalMockUsers[0]
    
    for (let i = 0; i < count; i++) {
      const id = `dummy-aff-${Date.now()}-${i}`
      const user = {
        id,
        name: `Dummy User ${i + 1}`,
        email: `dummy${i + 1}@saloka.id`,
        role: 'CUSTOMER',
        level: 1,
        xp: 0,
        parentAffiliateId: parent.id,
        createdAt: new Date(Date.now() - Math.random() * 10000000000)
      }
      globalMockUsers.push(user as any)
      
      globalMockOrders.push({
        id: `dummy-ord-${Date.now()}-${i}`,
        buyerId: user.id,
        merchantId: 'user-merchant-1',
        totalAmount: 150000,
        status: 'COMPLETED',
        createdAt: user.createdAt,
        updatedAt: user.createdAt,
        items: [
          { productId: 'prod-gayo-coffee', quantity: 1, price: 150000 }
        ]
      } as any)
      
      globalMockReferrals.push({
        id: `dummy-ref-${Date.now()}-${i}`,
        affiliateId: parent.id,
        buyerId: user.id,
        commissionAmount: 150000 * 0.1, // 10%
        status: 'PAID',
        createdAt: user.createdAt
      } as any)
    }
    
    saveMockDb()
    return true
  },

  async getReminders(userId: string) {
    const reminders = [];
    
    // 1. LMS Incomplete Lessons Reminder
    let progressList: any[] = [];
    let coursesList: any[] = [];
    let userObj: any = null;

    if (await isDbConnected()) {
      try {
        userObj = await db.user.findUnique({ where: { id: userId } });
        progressList = await db.progress.findMany({ where: { userId } });
        coursesList = await db.course.findMany({
          include: { lessons: { orderBy: { orderIndex: 'asc' } } }
        });
      } catch (_) {}
    } else {
      userObj = globalMockUsers.find(u => u.id === userId);
      progressList = globalMockProgress.filter(p => p.userId === userId);
      coursesList = mockCourses.map(c => ({
        ...c,
        lessons: mockLessons.filter(l => l.courseId === c.id).sort((a,b) => a.orderIndex - b.orderIndex)
      }));
    }

    const completedLessonIds = new Set(progressList.filter(p => p.completed).map(p => p.lessonId));

    // Find any course that user has started but not completed, or recommend lesson 1
    let foundIncomplete = false;
    for (const course of coursesList) {
      // Check if user has access to this course
      const accessLevels = { Gold: 1, Platinum: 2, Diamond: 3 };
      const userRank = accessLevels[userObj?.membershipAccess as 'Gold' | 'Platinum' | 'Diamond' || 'Gold'] || 1;
      const courseRank = accessLevels[course.accessRequired as 'Gold' | 'Platinum' | 'Diamond' || 'Gold'] || 1;

      if (userRank >= courseRank) {
        const courseLessons = course.lessons || [];
        for (const lesson of courseLessons) {
          if (!completedLessonIds.has(lesson.id)) {
            reminders.push({
              id: `rem-lms-${lesson.id}`,
              type: 'LMS',
              title: 'Lanjutkan Belajar Akademi',
              description: `Selesaikan materi: "${lesson.title}" di kelas ${course.title}.`,
              actionUrl: `/academy/course/${course.id}`,
              createdAt: new Date()
            });
            foundIncomplete = true;
            break; // only remind one lesson at a time
          }
        }
      }
      if (foundIncomplete) break;
    }

    // 2. Membership upgrade suggestion
    if (userObj?.membershipAccess === 'Gold') {
      reminders.push({
        id: 'rem-upgrade-plat',
        type: 'MEMBERSHIP',
        title: 'Upgrade Keanggotaan Platinum',
        description: 'Tingkatkan akses Anda ke level Platinum untuk membuka kelas premium Artisan Baking!',
        actionUrl: '/affiliate?tab=membership',
        createdAt: new Date()
      });
    } else if (userObj?.membershipAccess === 'Platinum') {
      reminders.push({
        id: 'rem-upgrade-diam',
        type: 'MEMBERSHIP',
        title: 'Upgrade Keanggotaan Diamond',
        description: 'Buka materi Mastering Digital Branding & Packaging dengan upgrade ke Diamond!',
        actionUrl: '/affiliate?tab=membership',
        createdAt: new Date()
      });
    }

    // 3. Location-based product reminders (Distance < 10km)
    let productsList: any[] = [];
    if (await isDbConnected()) {
      try {
        productsList = await db.product.findMany({ include: { merchant: true } });
      } catch (_) {}
    } else {
      productsList = globalMockProducts.map(p => ({
        ...p,
        merchant: globalMockUsers.find(u => u.id === p.merchantId) || null
      }));
    }

    if (userObj?.latitude && userObj?.longitude) {
      const uLat = userObj.latitude;
      const uLng = userObj.longitude;

      // Distance calculation helper (Haversine formula)
      const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };

      for (const prod of productsList) {
        if (prod.latitude && prod.longitude && prod.merchantId !== userId) {
          const dist = getDistance(uLat, uLng, prod.latitude, prod.longitude);
          if (dist <= 10) {
            reminders.push({
              id: `rem-prod-${prod.id}`,
              type: 'PRODUCT',
              title: `Produk Terdekat (${dist.toFixed(1)} km)`,
              description: `Temukan "${prod.title}" di merchant terdekat ${prod.merchant?.name || 'Saloka.id'}.`,
              actionUrl: `/marketplace`,
              createdAt: new Date()
            });
            break; // limit to one nearby product reminder
          }
        }
      }
    }

    return reminders;
  },

  async updateUserSettings(userId: string, data: {
    name?: string;
    whatsapp?: string;
    bio?: string;
    waGatewayKeys?: string;
    fbPixelId?: string | null;
    tiktokPixelId?: string | null;
    zapierWebhookUrl?: string | null;
    googleSheetUrl?: string | null;
    zoomMeetingUrl?: string | null;
    image?: string | null;
  }) {
    if (await isDbConnected()) {
      try {
        return await db.user.update({
          where: { id: userId },
          data
        })
      } catch (_) {}
    }
    const user = globalMockUsers.find(u => u.id === userId)
    if (user) {
      if (data.name !== undefined) user.name = data.name
      if (data.whatsapp !== undefined) user.whatsapp = data.whatsapp
      if (data.bio !== undefined) user.bio = data.bio
      if (data.waGatewayKeys !== undefined) user.waGatewayKeys = data.waGatewayKeys
      if (data.fbPixelId !== undefined) user.fbPixelId = data.fbPixelId
      if (data.tiktokPixelId !== undefined) user.tiktokPixelId = data.tiktokPixelId
      if (data.zapierWebhookUrl !== undefined) user.zapierWebhookUrl = data.zapierWebhookUrl
      if (data.googleSheetUrl !== undefined) user.googleSheetUrl = data.googleSheetUrl
      if (data.zoomMeetingUrl !== undefined) user.zoomMeetingUrl = data.zoomMeetingUrl
      if (data.image !== undefined) user.image = data.image
      user.updatedAt = new Date()
      saveMockDb()
      return user
    }
    return null
  },

  async getWaLogs(merchantId: string) {
    return globalMockWaLogs.filter(log => log.merchantId === merchantId)
  },

  // CHAT & SUPPORT OPERATIONS
  async getOrCreateChatRoom(buyerId: string, sellerId: string, productId?: string) {
    if (await isDbConnected()) {
      try {
        let room = await db.chatRoom.findFirst({
          where: {
            OR: [
              { buyerId, sellerId },
              { buyerId: sellerId, sellerId: buyerId }
            ]
          },
          include: {
            buyer: true,
            seller: true,
            product: true
          }
        });
        if (!room) {
          room = await db.chatRoom.create({
            data: {
              buyerId,
              sellerId,
              productId: productId || null
            },
            include: {
              buyer: true,
              seller: true,
              product: true
            }
          });
        }
        return room;
      } catch (_) {}
    }
    let room = globalMockChatRooms.find(
      r => (r.buyerId === buyerId && r.sellerId === sellerId) || (r.buyerId === sellerId && r.sellerId === buyerId)
    );
    if (!room) {
      room = {
        id: `room-${Date.now()}`,
        buyerId,
        sellerId,
        productId: productId || null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      globalMockChatRooms.push(room);
      saveMockDb();
    }
    const buyer = globalMockUsers.find(u => u.id === room.buyerId) || null;
    const seller = globalMockUsers.find(u => u.id === room.sellerId) || null;
    const product = globalMockProducts.find(p => p.id === room.productId) || null;
    return { ...room, buyer, seller, product };
  },

  async sendChatMessage(roomId: string, senderId: string, content: string, imageUrl?: string) {
    if (await isDbConnected()) {
      try {
        const msg = await db.chatMessage.create({
          data: {
            roomId,
            senderId,
            content,
            imageUrl: imageUrl || null
          }
        });
        await db.chatRoom.update({
          where: { id: roomId },
          data: { updatedAt: new Date() }
        });
        return msg;
      } catch (_) {}
    }
    const msg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      roomId,
      senderId,
      content,
      imageUrl: imageUrl || null,
      isRead: false,
      createdAt: new Date()
    };
    globalMockChatMessages.push(msg);
    const roomIdx = globalMockChatRooms.findIndex(r => r.id === roomId);
    if (roomIdx !== -1) {
      globalMockChatRooms[roomIdx].updatedAt = new Date();
    }
    saveMockDb();
    return msg;
  },

  async getChatMessages(roomId: string) {
    if (await isDbConnected()) {
      try {
        return await db.chatMessage.findMany({
          where: { roomId },
          orderBy: { createdAt: 'asc' }
        });
      } catch (_) {}
    }
    return globalMockChatMessages
      .filter(m => m.roomId === roomId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  },

  async markMessagesAsRead(roomId: string, userId: string) {
    if (await isDbConnected()) {
      try {
        await db.chatMessage.updateMany({
          where: {
            roomId,
            senderId: { not: userId },
            isRead: false
          },
          data: { isRead: true }
        });
        return true;
      } catch (_) {}
    }
    globalMockChatMessages.forEach(m => {
      if (m.roomId === roomId && m.senderId !== userId) {
        m.isRead = true;
      }
    });
    saveMockDb();
    return true;
  },

  async getUserConversations(userId: string) {
    if (await isDbConnected()) {
      try {
        const rooms = await db.chatRoom.findMany({
          where: {
            OR: [
              { buyerId: userId },
              { sellerId: userId }
            ]
          },
          include: {
            buyer: true,
            seller: true,
            product: true,
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          },
          orderBy: { updatedAt: 'desc' }
        });
        
        const roomsWithUnread = await Promise.all(rooms.map(async (r) => {
          const unreadCount = await db.chatMessage.count({
            where: {
              roomId: r.id,
              senderId: { not: userId },
              isRead: false
            }
          });
          return {
            ...r,
            lastMessage: r.messages[0] || null,
            unreadCount
          };
        }));
        
        return roomsWithUnread;
      } catch (_) {}
    }
    return globalMockChatRooms
      .filter(r => r.buyerId === userId || r.sellerId === userId)
      .map(r => {
        const buyer = globalMockUsers.find(u => u.id === r.buyerId) || null;
        const seller = globalMockUsers.find(u => u.id === r.sellerId) || null;
        const product = globalMockProducts.find(p => p.id === r.productId) || null;
        const messages = globalMockChatMessages
          .filter(m => m.roomId === r.id)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        const lastMessage = messages[0] || null;
        const unreadCount = messages.filter(m => m.senderId !== userId && !m.isRead).length;
        return {
          ...r,
          buyer,
          seller,
          product,
          lastMessage,
          unreadCount
        };
      })
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  },

  async createSupportTicket(customerId: string, message: string) {
    const ticketNumber = `CS-${new Date().getFullYear()}${(new Date().getMonth()+1).toString().padStart(2,'0')}${new Date().getDate().toString().padStart(2,'0')}-${Math.floor(1000 + Math.random() * 9000)}`;
    if (await isDbConnected()) {
      try {
        return await db.$transaction(async (tx) => {
          const ticket = await tx.supportTicket.create({
            data: {
              ticketNumber,
              customerId,
              status: 'OPEN'
            },
            include: {
              customer: true,
              csAgent: true
            }
          });
          await tx.supportMessage.create({
            data: {
              ticketId: ticket.id,
              senderId: 'SYSTEM',
              content: 'Halo, selamat datang di layanan bantuan Saloka.id. Mohon tunggu sebentar, kami sedang menghubungkan Anda dengan petugas customer service kami.'
            }
          });
          if (message.trim()) {
            await tx.supportMessage.create({
              data: {
                ticketId: ticket.id,
                senderId: customerId,
                content: message
              }
            });
          }
          return ticket;
        });
      } catch (_) {}
    }
    const ticket = {
      id: `ticket-${Date.now()}`,
      ticketNumber,
      customerId,
      csAgentId: null,
      status: 'OPEN',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    globalMockSupportTickets.push(ticket);
    globalMockSupportMessages.push({
      id: `sm-${Date.now()}-sys`,
      ticketId: ticket.id,
      senderId: 'SYSTEM',
      content: 'Halo, selamat datang di layanan bantuan Saloka.id. Mohon tunggu sebentar, kami sedang menghubungkan Anda dengan petugas customer service kami.',
      isRead: false,
      isInternalNote: false,
      createdAt: new Date()
    });
    if (message.trim()) {
      globalMockSupportMessages.push({
        id: `sm-${Date.now()}-cust`,
        ticketId: ticket.id,
        senderId: customerId,
        content: message,
        isRead: false,
        isInternalNote: false,
        createdAt: new Date(Date.now() + 1000)
      });
    }
    saveMockDb();
    const customer = globalMockUsers.find(u => u.id === ticket.customerId) || null;
    return { ...ticket, customer, csAgent: null };
  },

  async getSupportTickets(statusFilter?: string, agentId?: string) {
    if (await isDbConnected()) {
      try {
        const whereClause: any = {};
        if (statusFilter) whereClause.status = statusFilter;
        if (agentId) whereClause.csAgentId = agentId;
        return await db.supportTicket.findMany({
          where: whereClause,
          include: {
            customer: true,
            csAgent: true,
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          },
          orderBy: { updatedAt: 'desc' }
        });
      } catch (_) {}
    }
    return globalMockSupportTickets
      .filter(t => {
        if (statusFilter && t.status !== statusFilter) return false;
        if (agentId && t.csAgentId !== agentId) return false;
        return true;
      })
      .map(t => {
        const customer = globalMockUsers.find(u => u.id === t.customerId) || null;
        const csAgent = globalMockUsers.find(u => u.id === t.csAgentId) || null;
        const messages = globalMockSupportMessages
          .filter(m => m.ticketId === t.id)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        const lastMessage = messages[0] || null;
        return {
          ...t,
          customer,
          csAgent,
          lastMessage
        };
      })
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  },

  async assignSupportTicket(ticketId: string, agentId: string) {
    if (await isDbConnected()) {
      try {
        const ticket = await db.supportTicket.update({
          where: { id: ticketId },
          data: {
            csAgentId: agentId,
            status: 'PENDING',
            updatedAt: new Date()
          },
          include: {
            customer: true,
            csAgent: true
          }
        });
        const agent = await db.user.findUnique({ where: { id: agentId } });
        await db.supportMessage.create({
          data: {
            ticketId,
            senderId: 'SYSTEM',
            content: `Petugas CS ${agent?.name || 'CS Agent'} telah bergabung dalam percakapan.`
          }
        });
        return ticket;
      } catch (_) {}
    }
    const idx = globalMockSupportTickets.findIndex(t => t.id === ticketId);
    if (idx !== -1) {
      globalMockSupportTickets[idx].csAgentId = agentId;
      globalMockSupportTickets[idx].status = 'PENDING';
      globalMockSupportTickets[idx].updatedAt = new Date();
      const agent = globalMockUsers.find(u => u.id === agentId);
      globalMockSupportMessages.push({
        id: `sm-${Date.now()}-join`,
        ticketId,
        senderId: 'SYSTEM',
        content: `Petugas CS ${agent?.name || 'CS Agent'} telah bergabung dalam percakapan.`,
        isRead: false,
        isInternalNote: false,
        createdAt: new Date()
      });
      saveMockDb();
      const customer = globalMockUsers.find(u => u.id === globalMockSupportTickets[idx].customerId) || null;
      return { ...globalMockSupportTickets[idx], customer, csAgent: agent || null };
    }
    return null;
  },

  async sendSupportMessage(ticketId: string, senderId: string, content: string, isInternalNote: boolean = false, imageUrl?: string) {
    if (await isDbConnected()) {
      try {
        const msg = await db.supportMessage.create({
          data: {
            ticketId,
            senderId,
            content,
            isInternalNote,
            imageUrl: imageUrl || null
          }
        });
        await db.supportTicket.update({
          where: { id: ticketId },
          data: { updatedAt: new Date() }
        });
        return msg;
      } catch (_) {}
    }
    const msg = {
      id: `sm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ticketId,
      senderId,
      content,
      isInternalNote,
      imageUrl: imageUrl || null,
      isRead: false,
      createdAt: new Date()
    };
    globalMockSupportMessages.push(msg);
    const idx = globalMockSupportTickets.findIndex(t => t.id === ticketId);
    if (idx !== -1) {
      globalMockSupportTickets[idx].updatedAt = new Date();
    }
    saveMockDb();
    return msg;
  },

  async getSupportMessages(ticketId: string) {
    if (await isDbConnected()) {
      try {
        return await db.supportMessage.findMany({
          where: { ticketId },
          orderBy: { createdAt: 'asc' }
        });
      } catch (_) {}
    }
    return globalMockSupportMessages
      .filter(m => m.ticketId === ticketId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  },

  async resolveSupportTicket(ticketId: string) {
    if (await isDbConnected()) {
      try {
        const ticket = await db.supportTicket.update({
          where: { id: ticketId },
          data: {
            status: 'RESOLVED',
            updatedAt: new Date()
          }
        });
        await db.supportMessage.create({
          data: {
            ticketId,
            senderId: 'SYSTEM',
            content: 'Sesi bantuan telah selesai dan tiket telah ditutup. Terima kasih telah menghubungi layanan Saloka.id!'
          }
        });
        return ticket;
      } catch (_) {}
    }
    const idx = globalMockSupportTickets.findIndex(t => t.id === ticketId);
    if (idx !== -1) {
      globalMockSupportTickets[idx].status = 'RESOLVED';
      globalMockSupportTickets[idx].updatedAt = new Date();
      globalMockSupportMessages.push({
        id: `sm-${Date.now()}-close`,
        ticketId,
        senderId: 'SYSTEM',
        content: 'Sesi bantuan telah selesai dan tiket telah ditutup. Terima kasih telah menghubungi layanan Saloka.id!',
        isRead: false,
        isInternalNote: false,
        createdAt: new Date()
      });
      saveMockDb();
      return globalMockSupportTickets[idx];
    }
    return null;
  },

  async escalateSupportTicket(ticketId: string) {
    if (await isDbConnected()) {
      try {
        const ticket = await db.supportTicket.update({
          where: { id: ticketId },
          data: {
            status: 'ESCALATED',
            updatedAt: new Date()
          }
        });
        await db.supportMessage.create({
          data: {
            ticketId,
            senderId: 'SYSTEM',
            content: 'Tiket bantuan Anda telah dieskalasi ke Super Admin untuk penanganan lebih lanjut.'
          }
        });
        return ticket;
      } catch (_) {}
    }
    const idx = globalMockSupportTickets.findIndex(t => t.id === ticketId);
    if (idx !== -1) {
      globalMockSupportTickets[idx].status = 'ESCALATED';
      globalMockSupportTickets[idx].updatedAt = new Date();
      globalMockSupportMessages.push({
        id: `sm-${Date.now()}-escalate`,
        ticketId,
        senderId: 'SYSTEM',
        content: 'Tiket bantuan Anda telah dieskalasi ke Super Admin untuk penanganan lebih lanjut.',
        isRead: false,
        isInternalNote: false,
        createdAt: new Date()
      });
      saveMockDb();
      return globalMockSupportTickets[idx];
    }
    return null;
  },

  // REVIEW OPERATIONS
  async createReview(productId: string, authorId: string, rating: number, comment: string, orderId?: string) {
    if (await isDbConnected()) {
      try {
        return await db.productReview.create({
          data: {
            productId,
            authorId,
            rating,
            comment,
            orderId
          },
          include: {
            author: true
          }
        });
      } catch (e: any) {
        throw new Error(e.message || 'Gagal membuat ulasan.');
      }
    }
    // Mock DB Fallback
    const existing = globalMockReviews.find(r => r.productId === productId && r.authorId === authorId);
    if (existing) throw new Error('Anda sudah memberikan ulasan untuk produk ini.');
    const review = {
      id: `rev-${Date.now()}`,
      productId,
      authorId,
      rating,
      comment,
      orderId: orderId || null,
      createdAt: new Date()
    };
    globalMockReviews.push(review);
    saveMockDb();
    const author = globalMockUsers.find(u => u.id === authorId) || null;
    return { ...review, author };
  },

  async getProductReviews(productId: string) {
    if (await isDbConnected()) {
      try {
        return await db.productReview.findMany({
          where: { productId },
          include: { author: true },
          orderBy: { createdAt: 'desc' }
        });
      } catch (_) {}
    }
    return globalMockReviews
      .filter(r => r.productId === productId)
      .map(r => ({
        ...r,
        author: globalMockUsers.find(u => u.id === r.authorId) || null
      }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  // NOTIFICATION OPERATIONS
  async createNotification(userId: string, type: string, title: string, body: string, linkUrl?: string) {
    if (await isDbConnected()) {
      try {
        return await db.notification.create({
          data: {
            userId,
            type,
            title,
            body,
            linkUrl
          }
        });
      } catch (_) {}
    }
    // Mock DB Fallback
    const notification = {
      id: `notif-${Date.now()}`,
      userId,
      type,
      title,
      body,
      isRead: false,
      linkUrl: linkUrl || null,
      createdAt: new Date()
    };
    globalMockNotifications.push(notification);
    saveMockDb();
    return notification;
  },

  async getUserNotifications(userId: string) {
    if (await isDbConnected()) {
      try {
        return await db.notification.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' }
        });
      } catch (_) {}
    }
    return globalMockNotifications
      .filter(n => n.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async markNotificationsAsRead(userId: string) {
    if (await isDbConnected()) {
      try {
        await db.notification.updateMany({
          where: { userId, isRead: false },
          data: { isRead: true }
        });
        return true;
      } catch (_) {}
    }
    globalMockNotifications.forEach(n => {
      if (n.userId === userId) {
        n.isRead = true;
      }
    });
    saveMockDb();
    return true;
  },

  // ORDER TRACKING OPERATIONS
  async updateOrderShippingLabel(orderId: string, shippingLabel: string) {
    if (await isDbConnected()) {
      try {
        await db.order.update({
          where: { id: orderId },
          data: { shippingLabel }
        });
        return true;
      } catch (e) {
        console.error(e);
      }
    }
    const idx = globalMockOrders.findIndex(o => o.id === orderId);
    if (idx !== -1) {
      globalMockOrders[idx].shippingLabel = shippingLabel;
      globalMockOrders[idx].updatedAt = new Date();
      saveMockDb();
    }
    return true;
  },

  async updateOrderTracking(orderId: string, status: string, note?: string) {
    if (await isDbConnected()) {
      try {
        let orderStatus: any = undefined;
        if (status === 'DELIVERED') orderStatus = 'COMPLETED';
        if (status === 'CANCELLED') orderStatus = 'CANCELLED';
        
        await db.$transaction(async (tx) => {
          await tx.orderTracking.create({
            data: {
              orderId,
              status,
              note
            }
          });
          if (orderStatus) {
            await tx.order.update({
              where: { id: orderId },
              data: { status: orderStatus }
            });
          }
        });
        
        return await db.order.findUnique({
          where: { id: orderId },
          include: { buyer: true, items: { include: { product: true } }, tracking: true }
        });
      } catch (e: any) {
        throw new Error(e.message || 'Gagal memperbarui status pelacakan.');
      }
    }
    // Mock DB Fallback
    const trackingStep = {
      id: `ot-${Date.now()}`,
      orderId,
      status,
      note: note || null,
      createdAt: new Date()
    };
    globalMockOrderTrackings.push(trackingStep);
    
    const idx = globalMockOrders.findIndex(o => o.id === orderId);
    if (idx !== -1) {
      if (status === 'DELIVERED') globalMockOrders[idx].status = 'COMPLETED';
      if (status === 'CANCELLED') globalMockOrders[idx].status = 'CANCELLED';
      globalMockOrders[idx].updatedAt = new Date();
    }
    saveMockDb();
    
    const order = globalMockOrders.find(o => o.id === orderId);
    const tracking = globalMockOrderTrackings.filter(ot => ot.orderId === orderId);
    return order ? { ...order, tracking } : null;
  },

  async getOrderTracking(orderId: string) {
    if (await isDbConnected()) {
      try {
        return await db.orderTracking.findMany({
          where: { orderId },
          orderBy: { createdAt: 'desc' }
        });
      } catch (_) {}
    }
    return globalMockOrderTrackings
      .filter(ot => ot.orderId === orderId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async addWaLog(merchantId: string, merchantName: string, apiKeyUsed: string, recipient: string, message: string, status: string = 'SUCCESS') {
    globalMockWaLogs.push({
      id: `wa-log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date(),
      merchantId,
      merchantName,
      apiKeyUsed,
      recipient,
      message,
      status
    });
    saveMockDb();
    return true;
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // COMMUNITY INDUK OPERATIONS (Revisi Pert Keempat)
  // ═══════════════════════════════════════════════════════════════════════════

  async getCommunities() {
    syncMockDb()

    const seedCommunities = [
      {
        id: 'comm-dummy-1',
        name: 'Asosiasi Kuliner Kreatif Jogja',
        type: 'PERKUMPULAN' as const,
        description: 'Wadah kolaborasi dan diskusi antar pemilik usaha kuliner kreatif di wilayah Yogyakarta. Kami fokus pada peningkatan mutu produk, sertifikasi halal, dan pemasaran digital bersama.',
        aktaNotaris: 'Akta Notaris No. 12 Tgl 10 April 2024',
        nomorAhu: 'AHU-0010243.AH.01.07',
        nomorNpwp: '12.345.678.9-012.000',
        domisili: 'Kota Yogyakarta, DIY',
        kontakPj: '081234567890',
        waGroupLink: 'https://chat.whatsapp.com/JdK8X4bY12eD5xG',
        avatarUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=150&h=150&fit=crop&q=80',
        coverUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=300&fit=crop&q=80',
        joinFee: 0,
        monthlyFee: 0,
        ketuaId: 'user-merchant-1',
        isSuspended: false,
        isVerified: true,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01')
      },
      {
        id: 'comm-dummy-2',
        name: 'Koperasi Produksi Maju Bersama',
        type: 'KOPERASI' as const,
        description: 'Koperasi produksi resmi pelaku usaha mikro kecil dan menengah untuk pengadaan bahan baku bersama, fasilitasi permodalan modal produksi, dan bagi hasil usaha (SHU) tahunan.',
        aktaNotaris: 'Akta Notaris Koperasi No. 98 Tgl 01 Februari 2025',
        nomorAhu: 'AHU-KOP-0029311.AH.01.11',
        nomorNpwp: '12.987.654.3-012.000',
        domisili: 'Sleman, DIY',
        kontakPj: '089876543210',
        waGroupLink: 'https://chat.whatsapp.com/LhB2P9qK10zF6sD',
        avatarUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=150&h=150&fit=crop&q=80',
        coverUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=300&fit=crop&q=80',
        joinFee: 150000,
        monthlyFee: 50000,
        ketuaId: 'user-admin-1',
        isSuspended: false,
        isVerified: true,
        createdAt: new Date('2026-02-15'),
        updatedAt: new Date('2026-02-15')
      }
    ];

    if (await isDbConnected()) {
      try {
        const count = await db.community.count();
        if (count === 0) {
          for (const seed of seedCommunities) {
            const ketuaExists = await db.user.findUnique({ where: { id: seed.ketuaId } });
            const finalKetuaId = ketuaExists ? seed.ketuaId : (await db.user.findFirst())?.id;
            if (finalKetuaId) {
              await db.community.create({
                data: {
                  id: seed.id,
                  name: seed.name,
                  type: seed.type,
                  description: seed.description,
                  aktaNotaris: seed.aktaNotaris,
                  nomorAhu: seed.nomorAhu,
                  nomorNpwp: seed.nomorNpwp,
                  domisili: seed.domisili,
                  kontakPj: seed.kontakPj,
                  waGroupLink: seed.waGroupLink,
                  avatarUrl: seed.avatarUrl,
                  coverUrl: seed.coverUrl,
                  joinFee: seed.joinFee,
                  monthlyFee: seed.monthlyFee,
                  ketuaId: finalKetuaId,
                  isVerified: seed.isVerified,
                  createdAt: seed.createdAt,
                  updatedAt: seed.updatedAt
                }
              });
              // Auto join ketua as member
              await db.communityMembership.create({
                data: {
                  communityId: seed.id,
                  userId: finalKetuaId,
                  isInduk: true,
                  isPaid: true
                }
              });
            }
          }
        }
        return await db.community.findMany({
          include: {
            ketua: { select: { id: true, name: true, role: true } },
            _count: { select: { members: true } }
          },
          orderBy: { createdAt: 'desc' }
        })
      } catch (err) {
        console.error("Error in getCommunities database query:", err);
      }
    }

    if (!(globalThis as any).__mockCommunities || (globalThis as any).__mockCommunities.length === 0) {
      (globalThis as any).__mockCommunities = [...seedCommunities];
      if (!(globalThis as any).__mockCommunityMemberships) (globalThis as any).__mockCommunityMemberships = [];
      for (const seed of seedCommunities) {
        const exists = (globalThis as any).__mockCommunityMemberships.some((m: any) => m.communityId === seed.id && m.userId === seed.ketuaId);
        if (!exists) {
          (globalThis as any).__mockCommunityMemberships.push({
            id: `cm-${seed.id}-${seed.ketuaId}`,
            communityId: seed.id,
            userId: seed.ketuaId,
            isInduk: true,
            isPaid: true,
            joinedAt: new Date()
          });
        }
      }
      saveMockDb();
    }

    const communities = (globalThis as any).__mockCommunities || []
    return communities.map((c: any) => {
      const ketua = globalMockUsers.find(u => u.id === c.ketuaId)
      const memberCount = ((globalThis as any).__mockCommunityMemberships || []).filter((m: any) => m.communityId === c.id).length
      return {
        ...c,
        ketua: ketua ? { id: ketua.id, name: ketua.name, role: ketua.role } : null,
        _count: { members: memberCount }
      }
    })
  },

  async getCommunityById(id: string) {
    syncMockDb()

    const seedCommunities = [
      {
        id: 'comm-dummy-1',
        name: 'Asosiasi Kuliner Kreatif Jogja',
        type: 'PERKUMPULAN' as const,
        description: 'Wadah kolaborasi dan diskusi antar pemilik usaha kuliner kreatif di wilayah Yogyakarta. Kami fokus pada peningkatan mutu produk, sertifikasi halal, dan pemasaran digital bersama.',
        aktaNotaris: 'Akta Notaris No. 12 Tgl 10 April 2024',
        nomorAhu: 'AHU-0010243.AH.01.07',
        nomorNpwp: '12.345.678.9-012.000',
        domisili: 'Kota Yogyakarta, DIY',
        kontakPj: '081234567890',
        waGroupLink: 'https://chat.whatsapp.com/JdK8X4bY12eD5xG',
        avatarUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=150&h=150&fit=crop&q=80',
        coverUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=300&fit=crop&q=80',
        joinFee: 0,
        monthlyFee: 0,
        ketuaId: 'user-merchant-1',
        isSuspended: false,
        isVerified: true,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01')
      },
      {
        id: 'comm-dummy-2',
        name: 'Koperasi Produksi Maju Bersama',
        type: 'KOPERASI' as const,
        description: 'Koperasi produksi resmi pelaku usaha mikro kecil dan menengah untuk pengadaan bahan baku bersama, fasilitasi permodalan modal produksi, dan bagi hasil usaha (SHU) tahunan.',
        aktaNotaris: 'Akta Notaris Koperasi No. 98 Tgl 01 Februari 2025',
        nomorAhu: 'AHU-KOP-0029311.AH.01.11',
        nomorNpwp: '12.987.654.3-012.000',
        domisili: 'Sleman, DIY',
        kontakPj: '089876543210',
        waGroupLink: 'https://chat.whatsapp.com/LhB2P9qK10zF6sD',
        avatarUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=150&h=150&fit=crop&q=80',
        coverUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=300&fit=crop&q=80',
        joinFee: 150000,
        monthlyFee: 50000,
        ketuaId: 'user-admin-1',
        isSuspended: false,
        isVerified: true,
        createdAt: new Date('2026-02-15'),
        updatedAt: new Date('2026-02-15')
      }
    ];

    if (await isDbConnected()) {
      try {
        const count = await db.community.count();
        if (count === 0) {
          for (const seed of seedCommunities) {
            const ketuaExists = await db.user.findUnique({ where: { id: seed.ketuaId } });
            const finalKetuaId = ketuaExists ? seed.ketuaId : (await db.user.findFirst())?.id;
            if (finalKetuaId) {
              await db.community.create({
                data: {
                  id: seed.id,
                  name: seed.name,
                  type: seed.type,
                  description: seed.description,
                  aktaNotaris: seed.aktaNotaris,
                  nomorAhu: seed.nomorAhu,
                  nomorNpwp: seed.nomorNpwp,
                  domisili: seed.domisili,
                  kontakPj: seed.kontakPj,
                  waGroupLink: seed.waGroupLink,
                  avatarUrl: seed.avatarUrl,
                  coverUrl: seed.coverUrl,
                  joinFee: seed.joinFee,
                  monthlyFee: seed.monthlyFee,
                  ketuaId: finalKetuaId,
                  isVerified: seed.isVerified,
                  createdAt: seed.createdAt,
                  updatedAt: seed.updatedAt
                }
              });
              // Auto join ketua as member
              await db.communityMembership.create({
                data: {
                  communityId: seed.id,
                  userId: finalKetuaId,
                  isInduk: true,
                  isPaid: true
                }
              });
            }
          }
        }

        let community = await db.community.findUnique({
          where: { id },
          include: {
            ketua: { select: { id: true, name: true, role: true, email: true } },
            members: {
              include: { user: { select: { id: true, name: true, role: true, email: true } } }
            },
            _count: { select: { members: true } }
          }
        });

        if (!community) {
          const seedMatch = seedCommunities.find(s => s.id === id) || (id.includes('dummy-1') ? seedCommunities[0] : seedCommunities[1]);
          const firstUser = (await db.user.findFirst())?.id || 'user-admin-1';
          try {
            await db.community.create({
              data: {
                id: id,
                name: seedMatch.name,
                type: seedMatch.type,
                description: seedMatch.description,
                aktaNotaris: seedMatch.aktaNotaris,
                nomorAhu: seedMatch.nomorAhu,
                nomorNpwp: seedMatch.nomorNpwp,
                domisili: seedMatch.domisili,
                kontakPj: seedMatch.kontakPj,
                waGroupLink: seedMatch.waGroupLink,
                avatarUrl: seedMatch.avatarUrl,
                coverUrl: seedMatch.coverUrl,
                joinFee: seedMatch.joinFee,
                monthlyFee: seedMatch.monthlyFee,
                ketuaId: firstUser,
                isVerified: seedMatch.isVerified
              }
            });
            community = await db.community.findUnique({
              where: { id },
              include: {
                ketua: { select: { id: true, name: true, role: true, email: true } },
                members: {
                  include: { user: { select: { id: true, name: true, role: true, email: true } } }
                },
                _count: { select: { members: true } }
              }
            });
          } catch (_) {}
        }

        if (community) {
          return community;
        }
      } catch (err) {
        console.error("Error in getCommunityById database query:", err);
      }
    }

    const communities = (globalThis as any).__mockCommunities || []
    let community = communities.find((c: any) => c.id === id)
    if (!community) {
      community = seedCommunities.find(s => s.id === id) || { ...seedCommunities[1], id }
    }
    const ketua = globalMockUsers.find(u => u.id === community.ketuaId) || { id: 'user-admin-1', name: 'Super Admin Teras', role: 'ADMIN', email: 'admin@saloka.com' }
    const memberships = ((globalThis as any).__mockCommunityMemberships || []).filter((m: any) => m.communityId === id)
    const members = memberships.map((m: any) => {
      const user = globalMockUsers.find(u => u.id === m.userId)
      return { ...m, user: user ? { id: user.id, name: user.name, role: user.role, email: user.email } : null }
    })
    return {
      ...community,
      ketua: { id: ketua.id, name: ketua.name, role: ketua.role, email: ketua.email },
      members,
      _count: { members: members.length || 3 }
    }
  },

  async createCommunity(data: {
    ketuaId: string
    name: string
    type: 'PERKUMPULAN' | 'KOPERASI'
    description?: string
    aktaNotaris?: string
    nomorAhu?: string
    nomorNpwp?: string
    domisili?: string
    kontakPj?: string
    avatarUrl?: string
    coverUrl?: string
    waGroupLink?: string
    joinFee?: number
    monthlyFee?: number
  }) {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        const community = await db.community.create({
          data: {
            name: data.name,
            type: data.type as any,
            description: data.description || '',
            aktaNotaris: data.aktaNotaris || null,
            nomorAhu: data.nomorAhu || null,
            nomorNpwp: data.nomorNpwp || null,
            domisili: data.domisili || null,
            kontakPj: data.kontakPj || null,
            avatarUrl: data.avatarUrl || null,
            coverUrl: data.coverUrl || null,
            waGroupLink: data.waGroupLink || null,
            joinFee: data.joinFee || 0,
            monthlyFee: data.monthlyFee || 0,
            ketuaId: data.ketuaId
          }
        })
        // Auto-join ketua as member with isInduk
        await db.communityMembership.create({
          data: {
            communityId: community.id,
            userId: data.ketuaId,
            isInduk: true,
            isPaid: true
          }
        })
        return community
      } catch (_) {}
    }

    // Mock DB
    if (!(globalThis as any).__mockCommunities) (globalThis as any).__mockCommunities = []
    if (!(globalThis as any).__mockCommunityMemberships) (globalThis as any).__mockCommunityMemberships = []
    
    const newCommunity = {
      id: `community-${Date.now()}`,
      name: data.name,
      type: data.type,
      description: data.description || '',
      aktaNotaris: data.aktaNotaris || null,
      nomorAhu: data.nomorAhu || null,
      nomorNpwp: data.nomorNpwp || null,
      domisili: data.domisili || null,
      kontakPj: data.kontakPj || null,
      avatarUrl: data.avatarUrl || null,
      coverUrl: data.coverUrl || null,
      waGroupLink: data.waGroupLink || null,
      landingPageConfig: null,
      joinFee: data.joinFee || 0,
      monthlyFee: data.monthlyFee || 0,
      isSuspended: false,
      isVerified: false,
      ketuaId: data.ketuaId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    (globalThis as any).__mockCommunities.push(newCommunity);
    
    // Auto-join ketua
    (globalThis as any).__mockCommunityMemberships.push({
      id: `cm-${Date.now()}`,
      communityId: newCommunity.id,
      userId: data.ketuaId,
      isInduk: true,
      isPaid: true,
      joinedAt: new Date()
    })
    
    saveMockDb()
    return newCommunity
  },

  async updateCommunity(id: string, data: {
    name: string
    description?: string
    aktaNotaris?: string
    nomorAhu?: string
    nomorNpwp?: string
    domisili?: string
    kontakPj?: string
    avatarUrl?: string
    coverUrl?: string
    waGroupLink?: string
    landingPageConfig?: string
    joinFee?: number
    monthlyFee?: number
  }) {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        const dbUpdated = await db.community.update({
          where: { id },
          data: {
            name: data.name,
            description: data.description,
            aktaNotaris: data.aktaNotaris || null,
            nomorAhu: data.nomorAhu || null,
            nomorNpwp: data.nomorNpwp || null,
            domisili: data.domisili || null,
            kontakPj: data.kontakPj || null,
            avatarUrl: data.avatarUrl || null,
            coverUrl: data.coverUrl || null,
            waGroupLink: data.waGroupLink || null,
            landingPageConfig: data.landingPageConfig || null,
            joinFee: data.joinFee || 0,
            monthlyFee: data.monthlyFee || 0,
          }
        })
        return dbUpdated
      } catch (_) {}
    }

    if (!(globalThis as any).__mockCommunities) (globalThis as any).__mockCommunities = []
    const idx = (globalThis as any).__mockCommunities.findIndex((c: any) => c.id === id)
    if (idx !== -1) {
      const existing = (globalThis as any).__mockCommunities[idx]
      const mockUpdated = {
        ...existing,
        name: data.name,
        description: data.description ?? existing.description,
        aktaNotaris: data.aktaNotaris ?? existing.aktaNotaris,
        nomorAhu: data.nomorAhu ?? existing.nomorAhu,
        nomorNpwp: data.nomorNpwp ?? existing.nomorNpwp,
        domisili: data.domisili ?? existing.domisili,
        kontakPj: data.kontakPj ?? existing.kontakPj,
        avatarUrl: data.avatarUrl ?? existing.avatarUrl,
        coverUrl: data.coverUrl ?? existing.coverUrl,
        waGroupLink: data.waGroupLink ?? existing.waGroupLink,
        landingPageConfig: data.landingPageConfig ?? existing.landingPageConfig,
        joinFee: data.joinFee ?? existing.joinFee,
        monthlyFee: data.monthlyFee ?? existing.monthlyFee,
        updatedAt: new Date()
      };
      (globalThis as any).__mockCommunities[idx] = mockUpdated
      saveMockDb()
      return mockUpdated
    }
    throw new Error('Community not found')
  },

  async joinCommunity(userId: string, communityId: string, asInduk: boolean = false) {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        const existing = await db.communityMembership.findUnique({
          where: { communityId_userId: { communityId, userId } }
        })
        if (existing) {
          if (existing.invoiceStatus === 'UNPAID') {
            await db.communityMembership.update({
              where: { id: existing.id },
              data: { invoiceStatus: 'PAID' }
            })
            return { joined: true, statusUpdated: true, invoiceStatus: 'PAID' }
          }
          return { joined: true, alreadyMember: true }
        }
        
        const community = await db.community.findUnique({ where: { id: communityId } })
        if (!community) return { error: 'Komunitas tidak ditemukan.' }
        
        // Auto-lock recruitment if coinBalance <= 0 (only for non-free communities) or isRecruitmentLocked
        const isFree = (community.joinFee || 0) === 0 || community.category === 'FREE';
        if (community.isRecruitmentLocked) {
          return { error: 'Rekrutmen komunitas dikunci. Hubungi ketua komunitas.' }
        }
        if (!isFree && community.coinBalance <= 0) {
          return { error: 'Rekrutmen komunitas dikunci karena kas koin kosong. Hubungi ketua komunitas.' }
        }

        const needsPayment = (community.type === 'KOPERASI' || community.category === 'PAID' || community.category === 'KOPERASI') && (community.joinFee || 0) > 0

        const membership = await db.communityMembership.create({
          data: {
            communityId,
            userId,
            isInduk: asInduk,
            isPaid: !needsPayment,
            invoiceStatus: needsPayment ? 'UNPAID' : 'VERIFIED'
          }
        })

        if (asInduk) {
          await db.user.update({
            where: { id: userId },
            data: { indukCommunityId: communityId }
          })
        }

        // If joined immediately (no payment needed) and it's a paid community/koperasi, trigger 3-coin referral
        if (!needsPayment && (community.type === 'KOPERASI' || community.category === 'PAID')) {
          const userObj = await db.user.findUnique({ where: { id: userId } })
          if (userObj && userObj.parentAffiliateId && community.coinBalance >= 3) {
            const referrerId = userObj.parentAffiliateId
            
            // Deduct from community
            await db.community.update({
              where: { id: communityId },
              data: { 
                coinBalance: { decrement: 3 },
                isRecruitmentLocked: community.coinBalance - 3 <= 0 ? true : community.isRecruitmentLocked
              }
            })
            
            // Add to referrer
            await db.user.update({
              where: { id: referrerId },
              data: { coinBalance: { increment: 3 } }
            })
            
            // Record logs
            await db.coinTransaction.create({
              data: {
                type: 'REFERRAL_COMMISSION',
                amount: 3,
                description: `Komisi referral cross-community dari pendaftaran ${userObj.name} ke ${community.name}`,
                userId: referrerId,
                relatedUserId: userId
              }
            })
            
            await db.coinTransaction.create({
              data: {
                type: 'REFERRAL_COMMISSION',
                amount: -3,
                description: `Biaya komisi referral untuk anggota baru ${userObj.name}`,
                userId: community.ketuaId,
                communityId: communityId,
                relatedUserId: userId
              }
            })
          }
        }

        return { joined: true, needsPayment, invoiceStatus: needsPayment ? 'UNPAID' : 'VERIFIED' }
      } catch (e: any) {
        return { error: e.message || 'Gagal bergabung ke komunitas.' }
      }
    }

    // Mock DB
    if (!(globalThis as any).__mockCommunityMemberships) (globalThis as any).__mockCommunityMemberships = []
    const memberships = (globalThis as any).__mockCommunityMemberships as any[]
    const existing = memberships.find(m => m.communityId === communityId && m.userId === userId)
    if (existing) {
      if (existing.invoiceStatus === 'UNPAID') {
        existing.invoiceStatus = 'PAID'
        saveMockDb()
        return { joined: true, statusUpdated: true, invoiceStatus: 'PAID' }
      }
      return { joined: true, alreadyMember: true }
    }

    const communities = (globalThis as any).__mockCommunities || []
    const community = communities.find((c: any) => c.id === communityId)
    if (!community) return { error: 'Komunitas tidak ditemukan.' }

    // Auto-lock check for mock
    const isFree = (community.joinFee || 0) === 0 || community.category === 'FREE';
    if (community.isRecruitmentLocked) {
      return { error: 'Rekrutmen komunitas dikunci. Hubungi ketua komunitas.' }
    }
    if (!isFree && (community.coinBalance || 0) <= 0) {
      return { error: 'Rekrutmen komunitas dikunci karena kas koin kosong. Hubungi ketua komunitas.' }
    }

    const needsPayment = (community.type === 'KOPERASI' || community.category === 'PAID') && (community.joinFee || 0) > 0

    const newMembership = {
      id: `cm-${Date.now()}`,
      communityId,
      userId,
      isInduk: asInduk,
      isPaid: !needsPayment,
      invoiceStatus: needsPayment ? 'UNPAID' : 'VERIFIED',
      joinedAt: new Date()
    }
    memberships.push(newMembership)

    if (asInduk) {
      const user = globalMockUsers.find(u => u.id === userId)
      if (user) (user as any).indukCommunityId = communityId
    }

    // Trigger mock referral commission if joined immediately
    if (!needsPayment && (community.type === 'KOPERASI' || community.category === 'PAID')) {
      const userObj = globalMockUsers.find(u => u.id === userId)
      if (userObj && userObj.parentAffiliateId && (community.coinBalance || 0) >= 3) {
        const referrerId = userObj.parentAffiliateId
        community.coinBalance = (community.coinBalance || 0) - 3
        if (community.coinBalance <= 0) community.isRecruitmentLocked = true
        
        const referrer = globalMockUsers.find(u => u.id === referrerId)
        if (referrer) {
          referrer.coinBalance = (referrer.coinBalance || 0) + 3
        }

        if (!(globalThis as any).__mockCoinTransactions) (globalThis as any).__mockCoinTransactions = []
        ;(globalThis as any).__mockCoinTransactions.push({
          id: `ctx-${Date.now()}-1`,
          type: 'REFERRAL_COMMISSION',
          amount: 3,
          description: `Komisi referral cross-community dari pendaftaran ${userObj.name} ke ${community.name}`,
          userId: referrerId,
          relatedUserId: userId,
          createdAt: new Date()
        }, {
          id: `ctx-${Date.now()}-2`,
          type: 'REFERRAL_COMMISSION',
          amount: -3,
          description: `Biaya komisi referral untuk anggota baru ${userObj.name}`,
          userId: community.ketuaId,
          communityId: communityId,
          relatedUserId: userId,
          createdAt: new Date()
        })
      }
    }

    saveMockDb()
    return { joined: true, needsPayment, invoiceStatus: needsPayment ? 'UNPAID' : 'VERIFIED' }
  },

  async getUserIndukCommunity(userId: string) {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        const u = await db.user.findUnique({ where: { id: userId } })
        const indukId = u?.indukCommunityId
        if (!indukId) return null
        
        return await db.community.findUnique({
          where: { id: indukId },
          include: { ketua: { select: { id: true, name: true } } }
        })
      } catch (_) {}
    }

    const user = globalMockUsers.find(u => u.id === userId)
    const indukId = (user as any)?.indukCommunityId
    if (!indukId) return null

    const communities = (globalThis as any).__mockCommunities || []
    return communities.find((c: any) => c.id === indukId) || null
  },

  async setIndukCommunity(userId: string, communityId: string | null) {
    syncMockDb()
    const targetCommunityId = communityId || null
    if (await isDbConnected()) {
      try {
        return await db.user.update({
          where: { id: userId },
          data: { indukCommunityId: targetCommunityId }
        })
      } catch (_) {}
    }
    const user = globalMockUsers.find(u => u.id === userId)
    if (user) {
      (user as any).indukCommunityId = targetCommunityId
      user.updatedAt = new Date()
      saveMockDb()
      return user
    }
    return null
  },

  async updateUserAdminPermissions(userId: string, permissions: string[], isSuperAdmin?: boolean) {
    syncMockDb()
    const permString = JSON.stringify(permissions)
    if (await isDbConnected()) {
      try {
        return await db.user.update({
          where: { id: userId },
          data: {
            adminPermissions: permString,
            ...(typeof isSuperAdmin === 'boolean' ? { isSuperAdmin } : {})
          }
        })
      } catch (_) {}
    }
    const user = globalMockUsers.find(u => u.id === userId)
    if (user) {
      (user as any).adminPermissions = permString
      if (typeof isSuperAdmin === 'boolean') {
        (user as any).isSuperAdmin = isSuperAdmin
      }
      user.updatedAt = new Date()
      saveMockDb()
      return user
    }
    return null
  },

  async createCommunityAdmin(data: any) {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        return await db.community.create({
          data: {
            name: data.name,
            type: data.type || 'PERKUMPULAN',
            category: data.category || 'FREE',
            ketuaId: data.ketuaId,
            aktaNotaris: data.aktaNotaris || null,
            nomorAhu: data.nomorAhu || null,
            nomorNpwp: data.nomorNpwp || null,
            domisili: data.domisili || null,
            kontakPj: data.kontakPj || null,
            description: data.description || null,
            joinFee: Number(data.joinFee || 0),
            monthlyFee: Number(data.monthlyFee || 0),
            simpananPokok: Number(data.simpananPokok || 100000),
            simpananWajib: Number(data.simpananWajib || 25000),
            minCoinForLoan: Number(data.minCoinForLoan || 1000),
            minCoinRequired: Number(data.minCoinRequired || 100),
            isVerified: Boolean(data.isVerified),
            isSuspended: Boolean(data.isSuspended)
          }
        })
      } catch (_) {}
    }

    const newComm = {
      id: `comm-${Date.now()}`,
      name: data.name,
      type: data.type || 'PERKUMPULAN',
      category: data.category || 'FREE',
      ketuaId: data.ketuaId,
      aktaNotaris: data.aktaNotaris || null,
      nomorAhu: data.nomorAhu || null,
      nomorNpwp: data.nomorNpwp || null,
      domisili: data.domisili || null,
      kontakPj: data.kontakPj || null,
      description: data.description || null,
      joinFee: Number(data.joinFee || 0),
      monthlyFee: Number(data.monthlyFee || 0),
      simpananPokok: Number(data.simpananPokok || 100000),
      simpananWajib: Number(data.simpananWajib || 25000),
      coinBalance: 0,
      minCoinForLoan: Number(data.minCoinForLoan || 1000),
      minCoinRequired: Number(data.minCoinRequired || 100),
      isVerified: Boolean(data.isVerified),
      isSuspended: Boolean(data.isSuspended),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    if (!(globalThis as any).__mockCommunities) {
      (globalThis as any).__mockCommunities = []
    }
    (globalThis as any).__mockCommunities.push(newComm)
    saveMockDb()
    return newComm
  },

  async updateCommunityAdmin(id: string, data: any) {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        return await db.community.update({
          where: { id },
          data: {
            name: data.name,
            type: data.type,
            category: data.category,
            ketuaId: data.ketuaId,
            aktaNotaris: data.aktaNotaris,
            nomorAhu: data.nomorAhu,
            nomorNpwp: data.nomorNpwp,
            domisili: data.domisili,
            kontakPj: data.kontakPj,
            description: data.description,
            joinFee: typeof data.joinFee === 'number' ? data.joinFee : undefined,
            monthlyFee: typeof data.monthlyFee === 'number' ? data.monthlyFee : undefined,
            simpananPokok: typeof data.simpananPokok === 'number' ? data.simpananPokok : undefined,
            simpananWajib: typeof data.simpananWajib === 'number' ? data.simpananWajib : undefined,
            minCoinForLoan: typeof data.minCoinForLoan === 'number' ? data.minCoinForLoan : undefined,
            minCoinRequired: typeof data.minCoinRequired === 'number' ? data.minCoinRequired : undefined,
            isVerified: typeof data.isVerified === 'boolean' ? data.isVerified : undefined,
            isSuspended: typeof data.isSuspended === 'boolean' ? data.isSuspended : undefined
          }
        })
      } catch (_) {}
    }

    const communities = (globalThis as any).__mockCommunities || []
    const comm = communities.find((c: any) => c.id === id)
    if (comm) {
      Object.assign(comm, data, { updatedAt: new Date() })
      saveMockDb()
      return comm
    }
    return null
  },

  async deleteCommunityAdmin(id: string) {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        await db.community.delete({ where: { id } })
        return { success: true }
      } catch (_) {}
    }
    if ((globalThis as any).__mockCommunities) {
      (globalThis as any).__mockCommunities = (globalThis as any).__mockCommunities.filter((c: any) => c.id !== id)
      saveMockDb()
    }
    return { success: true }
  },

  async getIndukCommunityMembers(communityId: string) {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        return await db.communityMembership.findMany({
          where: { communityId },
          include: { user: { select: { id: true, name: true, role: true, email: true, level: true, xp: true } } }
        })
      } catch (_) {}
    }
    const memberships = ((globalThis as any).__mockCommunityMemberships || []).filter((m: any) => m.communityId === communityId)
    return memberships.map((m: any) => {
      const user = globalMockUsers.find(u => u.id === m.userId)
      return {
        ...m,
        user: user ? { id: user.id, name: user.name, role: user.role, email: user.email, level: user.level, xp: user.xp } : null
      }
    })
  },

  async isCommunityMember(userId: string, communityId: string) {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        const m = await db.communityMembership.findUnique({
          where: { communityId_userId: { communityId, userId } }
        })
        return !!m
      } catch (_) {}
    }
    const memberships = (globalThis as any).__mockCommunityMemberships || []
    return memberships.some((m: any) => m.communityId === communityId && m.userId === userId)
  },

  async submitKyc(userId: string, ktpUrl: string, selfieUrl: string) {
    syncMockDb()
    const isFailed = ktpUrl.toLowerCase().includes('fail') || ktpUrl.toLowerCase().includes('tolak') || ktpUrl.toLowerCase().includes('invalid');
    const finalStatus = isFailed ? 'REJECTED' : 'APPROVED';

    if (await isDbConnected()) {
      try {
        return await db.user.update({
          where: { id: userId },
          data: {
            kycStatus: finalStatus,
            kycKtpUrl: ktpUrl,
            kycSelfieUrl: selfieUrl,
            kycSubmittedAt: new Date()
          }
        })
      } catch (_) {}
    }

    const user = globalMockUsers.find(u => u.id === userId)
    if (user) {
      (user as any).kycStatus = finalStatus;
      (user as any).kycKtpUrl = ktpUrl;
      (user as any).kycSelfieUrl = selfieUrl;
      (user as any).kycSubmittedAt = new Date();
      user.updatedAt = new Date();
      saveMockDb()
      return user
    }
    return null
  },

  async updateKycStatus(userId: string, status: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'VERIFIED', sessionId?: string) {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        return await db.user.update({
          where: { id: userId },
          data: {
            kycStatus: status as any,
            ...(sessionId ? { kycSessionId: sessionId } as any : {}),
            ...(status === 'VERIFIED' || status === 'APPROVED' ? { kycVerifiedAt: new Date() } as any : {}),
          }
        })
      } catch (_) {}
    }

    const user = globalMockUsers.find(u => u.id === userId)
    if (user) {
      (user as any).kycStatus = status
      if (sessionId) (user as any).kycSessionId = sessionId
      if (status === 'VERIFIED' || status === 'APPROVED') (user as any).kycVerifiedAt = new Date()
      user.updatedAt = new Date()
      saveMockDb()
      return user
    }
    return null
  },

  async getKycStatus(userId: string): Promise<{ status: string | null; sessionId: string | null; verifiedAt: Date | null }> {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        const u = await db.user.findUnique({ where: { id: userId } })
        if (u) {
          return {
            status: (u as any).kycStatus || null,
            sessionId: (u as any).kycSessionId || null,
            verifiedAt: (u as any).kycVerifiedAt || null,
          }
        }
      } catch (_) {}
    }
    const u = globalMockUsers.find(u => u.id === userId)
    return {
      status: (u as any)?.kycStatus || null,
      sessionId: (u as any)?.kycSessionId || null,
      verifiedAt: (u as any)?.kycVerifiedAt || null,
    }
  },

  async submitCooperativeLoan(data: { communityId: string, merchantId: string, amount: number, purpose: string }) {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        return await db.cooperativeLoan.create({
          data: {
            communityId: data.communityId,
            merchantId: data.merchantId,
            amount: data.amount,
            purpose: data.purpose,
            status: 'PENDING'
          }
        })
      } catch (_) {}
    }

    if (!(globalThis as any).__mockCooperativeLoans) {
      (globalThis as any).__mockCooperativeLoans = [];
    }
    const newLoan: { id: string; communityId: string; merchantId: string; amount: number; purpose: string; status: string; approvedByKetua: boolean; approvedByAdmin: boolean; createdAt: Date; updatedAt: Date } = {
      id: `loan-${Date.now()}`,
      communityId: data.communityId,
      merchantId: data.merchantId,
      amount: data.amount,
      purpose: data.purpose,
      status: 'PENDING',
      approvedByKetua: false,
      approvedByAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    (globalThis as any).__mockCooperativeLoans.push(newLoan);
    saveMockDb();
    return newLoan;

  },

  async getCooperativeLoans(communityId?: string, merchantId?: string) {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        const where: any = {}
        if (communityId) where.communityId = communityId
        if (merchantId) where.merchantId = merchantId
        return await db.cooperativeLoan.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          include: {
            community: { select: { id: true, name: true } }
          }
        })
      } catch (_) {}
    }

    let loans = (globalThis as any).__mockCooperativeLoans || []
    if (communityId) loans = loans.filter((l: any) => l.communityId === communityId)
    if (merchantId) loans = loans.filter((l: any) => l.merchantId === merchantId)
    const communities = (globalThis as any).__mockCommunities || []
    return loans.map((l: any) => ({
      ...l,
      community: communities.find((c: any) => c.id === l.communityId) || null
    })).sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime())
  },

  async getCooperativeLoanById(id: string) {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        return await db.cooperativeLoan.findUnique({
          where: { id },
          include: {
            community: true
          }
        })
      } catch (_) {}
    }
    const loans = (globalThis as any).__mockCooperativeLoans || []
    const loan = loans.find((l: any) => l.id === id)
    if (!loan) return null
    const communities = (globalThis as any).__mockCommunities || []
    return {
      ...loan,
      community: communities.find((c: any) => c.id === loan.communityId) || null
    }
  },

  async updateCooperativeLoanStatus(loanId: string, status: 'PENDING' | 'APPROVED_KETUA' | 'APPROVED_ADMIN' | 'DISBURSED' | 'REJECTED', approvedByKetua: boolean, approvedByAdmin: boolean) {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        return await db.cooperativeLoan.update({
          where: { id: loanId },
          data: {
            status: status as any,
            approvedByKetua,
            approvedByAdmin
          }
        })
      } catch (_) {}
    }

    const loans = (globalThis as any).__mockCooperativeLoans || []
    const loan = loans.find((l: any) => l.id === loanId)
    if (loan) {
      loan.status = status
      loan.approvedByKetua = approvedByKetua
      loan.approvedByAdmin = approvedByAdmin
      loan.updatedAt = new Date()
      saveMockDb()
      return loan
    }
    return null
  },


  // ═══════════════════════════════════════════════════════════════════════════
  // COIN SYSTEM (Revisi Pert Kelima)
  // ═══════════════════════════════════════════════════════════════════════════

  async getUserCoinBalance(userId: string): Promise<number> {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        const u = await db.user.findUnique({ where: { id: userId }, select: { coinBalance: true } as any })
        return (u as any)?.coinBalance || 0
      } catch (_) {}
    }
    const user = globalMockUsers.find(u => u.id === userId)
    return (user as any)?.coinBalance || 0
  },

  async getCommunityCoinBalance(communityId: string): Promise<{ coinBalance: number; minCoinForLoan: number } | null> {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        const c = await db.community.findUnique({
          where: { id: communityId },
          select: { coinBalance: true, minCoinForLoan: true } as any
        })
        if (!c) return null
        return { coinBalance: (c as any).coinBalance || 0, minCoinForLoan: (c as any).minCoinForLoan || 1000 }
      } catch (_) {}
    }
    const communities = (globalThis as any).__mockCommunities || []
    const c = communities.find((c: any) => c.id === communityId)
    if (!c) return null
    return { coinBalance: c.coinBalance || 0, minCoinForLoan: c.minCoinForLoan || 1000 }
  },

  async getCoinTransactions(userId: string): Promise<any[]> {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        return await (db as any).coinTransaction.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 50
        })
      } catch (_) {}
    }
    const txs = (globalThis as any).__mockCoinTransactions || []
    return txs.filter((t: any) => t.userId === userId).sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime())
  },

  async topupCommunityCoin(data: {
    communityId: string
    ketuaId: string
    jumlahCoin: number
    totalBiaya: number
    description: string
  }) {
    syncMockDb()

    if (await isDbConnected()) {
      try {
        await db.$transaction(async (tx: any) => {
          // Tambah coin ke komunitas
          await tx.community.update({
            where: { id: data.communityId },
            data: { coinBalance: { increment: data.jumlahCoin } }
          })
          // Catat transaksi coin
          await tx.coinTransaction.create({
            data: {
              type: 'TOPUP',
              amount: data.jumlahCoin,
              description: data.description,
              userId: data.ketuaId,
              communityId: data.communityId,
            }
          })
        })
        return { newCoinBalance: data.jumlahCoin }
      } catch (_) {}
    }

    // Mock DB
    if (!(globalThis as any).__mockCoinTransactions) (globalThis as any).__mockCoinTransactions = []
    const communities = (globalThis as any).__mockCommunities || []
    const community = communities.find((c: any) => c.id === data.communityId)
    if (community) {
      community.coinBalance = (community.coinBalance || 0) + data.jumlahCoin
      community.updatedAt = new Date()
    }
    const tx = {
      id: `coin-tx-${Date.now()}`,
      type: 'TOPUP',
      amount: data.jumlahCoin,
      description: data.description,
      userId: data.ketuaId,
      communityId: data.communityId,
      createdAt: new Date()
    }
    ;(globalThis as any).__mockCoinTransactions.push(tx)
    saveMockDb()
    return { newCoinBalance: community?.coinBalance || data.jumlahCoin, tx }
  },

  async rewardUserInviteCoin(data: {
    referrerId: string
    referredId: string
    coinAmount: number
  }) {
    syncMockDb()

    if (await isDbConnected()) {
      try {
        await db.$transaction(async (tx: any) => {
          // Cek duplikasi
          const existing = await tx.userReferral.findUnique({
            where: { referrerId_referredId: { referrerId: data.referrerId, referredId: data.referredId } }
          })
          if (existing) return existing

          // Tambah coin ke pengundang
          await tx.user.update({
            where: { id: data.referrerId },
            data: { coinBalance: { increment: data.coinAmount } }
          })
          // Catat referral
          const ref = await tx.userReferral.create({
            data: {
              referrerId: data.referrerId,
              referredId: data.referredId,
              coinAwarded: data.coinAmount,
              isRewarded: true
            }
          })
          // Catat transaksi coin
          await tx.coinTransaction.create({
            data: {
              type: 'REWARD_USER_INVITE',
              amount: data.coinAmount,
              description: `Reward mengundang user baru`,
              userId: data.referrerId,
              relatedUserId: data.referredId,
            }
          })
          return ref
        })
        return { rewarded: true, coinAmount: data.coinAmount }
      } catch (_) {}
    }

    // Mock DB
    if (!(globalThis as any).__mockCoinTransactions) (globalThis as any).__mockCoinTransactions = []
    if (!(globalThis as any).__mockUserReferrals) (globalThis as any).__mockUserReferrals = []

    const existingRef = ((globalThis as any).__mockUserReferrals || [])
      .find((r: any) => r.referrerId === data.referrerId && r.referredId === data.referredId)
    if (existingRef) return { rewarded: false, message: 'Sudah pernah diundang' }

    const referrer = globalMockUsers.find(u => u.id === data.referrerId)
    if (referrer) {
      (referrer as any).coinBalance = ((referrer as any).coinBalance || 0) + data.coinAmount
      referrer.updatedAt = new Date()
    }
    ;(globalThis as any).__mockUserReferrals.push({
      id: `ref-${Date.now()}`,
      referrerId: data.referrerId,
      referredId: data.referredId,
      coinAwarded: data.coinAmount,
      isRewarded: true,
      createdAt: new Date()
    })
    ;(globalThis as any).__mockCoinTransactions.push({
      id: `coin-tx-${Date.now()}`,
      type: 'REWARD_USER_INVITE',
      amount: data.coinAmount,
      description: `Reward mengundang user baru`,
      userId: data.referrerId,
      relatedUserId: data.referredId,
      createdAt: new Date()
    })
    saveMockDb()
    return { rewarded: true, coinAmount: data.coinAmount }
  },

  async rewardMerchantInvite(data: {
    inviterId: string
    inviteeId: string
    communityId: string
  }) {
    syncMockDb()

    const communities = (globalThis as any).__mockCommunities || []
    const community = communities.find((c: any) => c.id === data.communityId)
    const communityType = community?.type || 'PERKUMPULAN'
    const isKoperasi = communityType === 'KOPERASI'

    // Reward: COIN untuk PERKUMPULAN, SALDO untuk KOPERASI
    const rewardType = isKoperasi ? 'SALDO' : 'COIN'
    const rewardAmount = 5.0 // default 5 coin atau Rp 5.000 saldo

    if (await isDbConnected()) {
      try {
        await db.$transaction(async (tx: any) => {
          // Cek duplikasi
          const existing = await (tx as any).merchantInvite.findFirst({
            where: { inviterId: data.inviterId, inviteeId: data.inviteeId, communityId: data.communityId }
          })
          if (existing) return existing

          // Verifikasi invitee join komunitas yang sama
          const inviteeMembership = await tx.communityMembership.findUnique({
            where: { communityId_userId: { communityId: data.communityId, userId: data.inviteeId } }
          })
          if (!inviteeMembership) throw new Error('Merchant yang diundang belum bergabung ke komunitas ini.')

          if (isKoperasi) {
            // Reward saldo wallet dari kas koperasi
            const koperasi = await tx.community.findUnique({ where: { id: data.communityId } })
            const kasBalance = (koperasi as any)?.coinBalance || 0
            if (kasBalance < rewardAmount) throw new Error('Kas koperasi tidak mencukupi untuk reward.')

            // Tambah saldo wallet pengundang
            await tx.wallet.update({
              where: { userId: data.inviterId },
              data: { balance: { increment: rewardAmount * 1500 } } // convert ke rupiah
            })
            // Catat wallet transaction
            await tx.walletTransaction.create({
              data: {
                amount: rewardAmount * 1500,
                type: 'COMMISSION',
                description: `Reward mengundang merchant ke komunitas koperasi`,
                wallet: { connect: { userId: data.inviterId } }
              }
            })
          } else {
            // Reward coin untuk perkumpulan
            await tx.user.update({
              where: { id: data.inviterId },
              data: { coinBalance: { increment: rewardAmount } }
            })
            await (tx as any).coinTransaction.create({
              data: {
                type: 'REWARD_MERCHANT_INVITE',
                amount: rewardAmount,
                description: `Reward mengundang merchant ke komunitas`,
                userId: data.inviterId,
                communityId: data.communityId,
                relatedUserId: data.inviteeId,
              }
            })
          }

          // Catat merchant invite log
          await (tx as any).merchantInvite.create({
            data: {
              communityId: data.communityId,
              communityType,
              rewardType,
              rewardAmount,
              isRewarded: true,
              inviterId: data.inviterId,
              inviteeId: data.inviteeId,
            }
          })
        })
        return { rewarded: true, rewardType, rewardAmount }
      } catch (e: any) {
        return { error: e.message || 'Gagal memberikan reward.' }
      }
    }

    // Mock DB
    if (!(globalThis as any).__mockCoinTransactions) (globalThis as any).__mockCoinTransactions = []
    if (!(globalThis as any).__mockMerchantInvites) (globalThis as any).__mockMerchantInvites = []

    const existing = ((globalThis as any).__mockMerchantInvites || [])
      .find((m: any) => m.inviterId === data.inviterId && m.inviteeId === data.inviteeId && m.communityId === data.communityId)
    if (existing) return { rewarded: false, message: 'Sudah pernah mengundang merchant ini ke komunitas ini.' }

    const inviter = globalMockUsers.find(u => u.id === data.inviterId)

    if (isKoperasi) {
      // Tambah saldo wallet
      const inviterWallet = globalMockWallets.find(w => w.userId === data.inviterId)
      if (inviterWallet) inviterWallet.balance += rewardAmount * 1500
      globalMockWalletTransactions.push({
        id: `wt-${Date.now()}`,
        amount: rewardAmount * 1500,
        type: 'COMMISSION',
        description: `Reward mengundang merchant ke komunitas koperasi`,
        walletId: inviterWallet?.id || '',
        createdAt: new Date()
      })
    } else {
      // Tambah coin
      if (inviter) (inviter as any).coinBalance = ((inviter as any).coinBalance || 0) + rewardAmount
      ;(globalThis as any).__mockCoinTransactions.push({
        id: `coin-tx-${Date.now()}`,
        type: 'REWARD_MERCHANT_INVITE',
        amount: rewardAmount,
        description: `Reward mengundang merchant ke komunitas`,
        userId: data.inviterId,
        communityId: data.communityId,
        relatedUserId: data.inviteeId,
        createdAt: new Date()
      })
    }

    ;(globalThis as any).__mockMerchantInvites.push({
      id: `mi-${Date.now()}`,
      communityId: data.communityId,
      communityType,
      rewardType,
      rewardAmount,
      isRewarded: true,
      inviterId: data.inviterId,
      inviteeId: data.inviteeId,
      createdAt: new Date()
    })
    saveMockDb()
    return { rewarded: true, rewardType, rewardAmount }
  },

  // Voucher Methods
  async getAllCoinVouchers(): Promise<any[]> {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        return await (db as any).coinVoucher.findMany({
          orderBy: { createdAt: 'desc' }
        })
      } catch (_) {}
    }
    return (globalThis as any).__mockCoinVouchers || []
  },

  async getActiveCoinVouchers(): Promise<any[]> {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        return await (db as any).coinVoucher.findMany({
          where: { isActive: true },
          orderBy: { coinCost: 'asc' }
        })
      } catch (_) {}
    }
    return ((globalThis as any).__mockCoinVouchers || []).filter((v: any) => v.isActive)
  },

  async getCoinVoucherById(id: string): Promise<any | null> {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        return await (db as any).coinVoucher.findUnique({ where: { id } })
      } catch (_) {}
    }
    return ((globalThis as any).__mockCoinVouchers || []).find((v: any) => v.id === id) || null
  },

  async createCoinVoucher(data: {
    name: string
    description: string
    type: 'INTERNAL' | 'EXTERNAL'
    coinCost: number
    value: number
    code?: string
    maxRedemption: number
    validUntil?: Date
  }): Promise<any> {
    if (!(globalThis as any).__mockCoinVouchers) (globalThis as any).__mockCoinVouchers = []
    if (await isDbConnected()) {
      try {
        return await (db as any).coinVoucher.create({ data: { ...data, totalRedeemed: 0 } })
      } catch (_) {}
    }
    const voucher = {
      id: `voucher-${Date.now()}`,
      ...data,
      totalRedeemed: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    ;(globalThis as any).__mockCoinVouchers.push(voucher)
    return voucher
  },

  async toggleCoinVoucherActive(id: string) {
    if (await isDbConnected()) {
      try {
        const v = await (db as any).coinVoucher.findUnique({ where: { id } })
        return await (db as any).coinVoucher.update({ where: { id }, data: { isActive: !v.isActive } })
      } catch (_) {}
    }
    const vouchers = (globalThis as any).__mockCoinVouchers || []
    const v = vouchers.find((v: any) => v.id === id)
    if (v) { v.isActive = !v.isActive; v.updatedAt = new Date() }
    return { toggled: true, isActive: v?.isActive }
  },

  async redeemCoinVoucher(data: {
    userId: string
    voucherId: string
    coinSpent: number
    voucherType: string
    externalCode?: string
  }): Promise<any> {
    syncMockDb()
    // Generate klaim kode unik untuk INTERNAL
    const claimCode = data.voucherType === 'INTERNAL'
      ? `SALOKA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
      : data.externalCode

    if (await isDbConnected()) {
      try {
        return await db.$transaction(async (tx: any) => {
          await tx.user.update({
            where: { id: data.userId },
            data: { coinBalance: { decrement: data.coinSpent } }
          })
          await (tx as any).coinVoucher.update({
            where: { id: data.voucherId },
            data: { totalRedeemed: { increment: 1 } }
          })
          const redemption = await (tx as any).coinRedemption.create({
            data: {
              userId: data.userId,
              voucherId: data.voucherId,
              coinSpent: data.coinSpent,
              status: 'CLAIMED',
              claimCode,
              claimedAt: new Date(),
            }
          })
          await (tx as any).coinTransaction.create({
            data: {
              type: 'REDEEM_VOUCHER',
              amount: -data.coinSpent,
              description: `Tukar coin dengan voucher`,
              userId: data.userId,
              relatedVoucherId: data.voucherId,
            }
          })
          return { redemption, claimCode }
        })
      } catch (_) {}
    }

    // Mock DB
    if (!(globalThis as any).__mockCoinRedemptions) (globalThis as any).__mockCoinRedemptions = []
    if (!(globalThis as any).__mockCoinTransactions) (globalThis as any).__mockCoinTransactions = []

    const user = globalMockUsers.find(u => u.id === data.userId)
    if (user) (user as any).coinBalance = ((user as any).coinBalance || 0) - data.coinSpent

    const vouchers = (globalThis as any).__mockCoinVouchers || []
    const voucher = vouchers.find((v: any) => v.id === data.voucherId)
    if (voucher) voucher.totalRedeemed = (voucher.totalRedeemed || 0) + 1

    const redemption = {
      id: `redeem-${Date.now()}`,
      userId: data.userId,
      voucherId: data.voucherId,
      coinSpent: data.coinSpent,
      status: 'CLAIMED',
      claimCode,
      claimedAt: new Date(),
      createdAt: new Date()
    }
    ;(globalThis as any).__mockCoinRedemptions.push(redemption)
    ;(globalThis as any).__mockCoinTransactions.push({
      id: `coin-tx-${Date.now()}`,
      type: 'REDEEM_VOUCHER',
      amount: -data.coinSpent,
      description: `Tukar coin dengan voucher`,
      userId: data.userId,
      relatedVoucherId: data.voucherId,
      createdAt: new Date()
    })
    saveMockDb()
    return { redemption, claimCode }
  },

  async getUserCoinRedemptions(userId: string): Promise<any[]> {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        return await (db as any).coinRedemption.findMany({
          where: { userId },
          include: { voucher: true },
          orderBy: { createdAt: 'desc' }
        })
      } catch (_) {}
    }
    const redemptions = ((globalThis as any).__mockCoinRedemptions || []).filter((r: any) => r.userId === userId)
    const vouchers = (globalThis as any).__mockCoinVouchers || []
    return redemptions.map((r: any) => ({
      ...r,
      voucher: vouchers.find((v: any) => v.id === r.voucherId) || null
    })).sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime())
  },

  async getCoinAdminStats() {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        const [totalTx, totalRedemptions, recentTx] = await Promise.all([
          (db as any).coinTransaction.count(),
          (db as any).coinRedemption.count(),
          (db as any).coinTransaction.findMany({ orderBy: { createdAt: 'desc' }, take: 10 })
        ])
        return { totalTx, totalRedemptions, recentTx }
      } catch (_) {}
    }
    const txs = (globalThis as any).__mockCoinTransactions || []
    const redemptions = (globalThis as any).__mockCoinRedemptions || []
    return {
      totalTx: txs.length,
      totalRedemptions: redemptions.length,
      recentTx: txs.slice(-10).reverse()
    }
  },

  // Username methods
  async findUserByUsername(username: string): Promise<any | null> {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        return await db.user.findFirst({ where: { username: username.toLowerCase() } as any })
      } catch (_) {}
    }
    return globalMockUsers.find(u => (u as any).username?.toLowerCase() === username.toLowerCase()) || null
  },

  async isUsernameTaken(username: string, excludeUserId?: string): Promise<boolean> {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        const existing = await db.user.findFirst({
          where: { username: username.toLowerCase(), ...(excludeUserId ? { NOT: { id: excludeUserId } } : {}) } as any
        })
        return !!existing
      } catch (_) {}
    }
    return globalMockUsers.some(u =>
      (u as any).username?.toLowerCase() === username.toLowerCase() &&
      (!excludeUserId || u.id !== excludeUserId)
    )
  },

  async setUsername(userId: string, username: string): Promise<any> {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        return await db.user.update({ where: { id: userId }, data: { username: username.toLowerCase() } as any })
      } catch (_) {}
    }
    const user = globalMockUsers.find(u => u.id === userId)
    if (user) {
      (user as any).username = username.toLowerCase()
      user.updatedAt = new Date()
      saveMockDb()
      return user
    }
    return null
  },

  async getInvoiceMemberships(status?: string) {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        const where: any = {}
        if (status) where.invoiceStatus = status
        return await db.communityMembership.findMany({
          where,
          include: {
            community: { select: { id: true, name: true, type: true } },
            user: { select: { id: true, name: true, email: true, role: true } }
          },
          orderBy: { joinedAt: 'desc' }
        })
      } catch (_) {}
    }
    let memberships = (globalThis as any).__mockCommunityMemberships || []
    if (status) memberships = memberships.filter((m: any) => m.invoiceStatus === status)
    const communities = (globalThis as any).__mockCommunities || []
    return memberships.map((m: any) => {
      const user = globalMockUsers.find(u => u.id === m.userId)
      const community = communities.find((c: any) => c.id === m.communityId)
      return {
        ...m,
        user: user ? { id: user.id, name: user.name, email: user.email, role: user.role } : null,
        community: community ? { id: community.id, name: community.name, type: community.type } : null
      }
    }).sort((a: any, b: any) => b.joinedAt.getTime() - a.joinedAt.getTime())
  },

  async verifyInvoiceMembership(membershipId: string, adminId: string) {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        const membership = await db.communityMembership.update({
          where: { id: membershipId },
          data: {
            isPaid: true,
            invoiceStatus: 'VERIFIED',
            invoiceVerifiedAt: new Date(),
            invoiceVerifiedBy: adminId
          },
          include: {
            community: true,
            user: true
          }
        })

        // Trigger 3-coin referral commission
        if (membership.community.type === 'KOPERASI' || membership.community.category === 'PAID') {
          const userObj = membership.user
          const community = membership.community
          if (userObj.parentAffiliateId && community.coinBalance >= 3) {
            const referrerId = userObj.parentAffiliateId
            
            await db.community.update({
              where: { id: community.id },
              data: {
                coinBalance: { decrement: 3 },
                isRecruitmentLocked: community.coinBalance - 3 <= 0 ? true : community.isRecruitmentLocked
              }
            })

            await db.user.update({
              where: { id: referrerId },
              data: { coinBalance: { increment: 3 } }
            })

            await db.coinTransaction.create({
              data: {
                type: 'REFERRAL_COMMISSION',
                amount: 3,
                description: `Komisi referral cross-community dari pendaftaran ${userObj.name} ke ${community.name}`,
                userId: referrerId,
                relatedUserId: userObj.id
              }
            })

            await db.coinTransaction.create({
              data: {
                type: 'REFERRAL_COMMISSION',
                amount: -3,
                description: `Biaya komisi referral untuk anggota baru ${userObj.name}`,
                userId: community.ketuaId,
                communityId: community.id,
                relatedUserId: userObj.id
              }
            })
          }
        }
        return { success: true, membership }
      } catch (e: any) {
        throw new Error(e.message || 'Gagal memverifikasi keanggotaan.')
      }
    }

    // Mock DB
    const memberships = (globalThis as any).__mockCommunityMemberships || []
    const m = memberships.find((x: any) => x.id === membershipId)
    if (!m) throw new Error('Keanggotaan tidak ditemukan.')

    m.isPaid = true
    m.invoiceStatus = 'VERIFIED'
    m.invoiceVerifiedAt = new Date()
    m.invoiceVerifiedBy = adminId

    const communities = (globalThis as any).__mockCommunities || []
    const community = communities.find((c: any) => c.id === m.communityId)
    const userObj = globalMockUsers.find(u => u.id === m.userId)

    if (community && (community.type === 'KOPERASI' || community.category === 'PAID') && userObj && userObj.parentAffiliateId) {
      const referrerId = userObj.parentAffiliateId
      if ((community.coinBalance || 0) >= 3) {
        community.coinBalance = (community.coinBalance || 0) - 3
        if (community.coinBalance <= 0) community.isRecruitmentLocked = true
        
        const referrer = globalMockUsers.find(u => u.id === referrerId)
        if (referrer) {
          referrer.coinBalance = (referrer.coinBalance || 0) + 3
        }

        if (!(globalThis as any).__mockCoinTransactions) (globalThis as any).__mockCoinTransactions = []
        ;(globalThis as any).__mockCoinTransactions.push({
          id: `ctx-${Date.now()}-1`,
          type: 'REFERRAL_COMMISSION',
          amount: 3,
          description: `Komisi referral cross-community dari pendaftaran ${userObj.name} ke ${community.name}`,
          userId: referrerId,
          relatedUserId: userObj.id,
          createdAt: new Date()
         }, {
          id: `ctx-${Date.now()}-2`,
          type: 'REFERRAL_COMMISSION',
          amount: -3,
          description: `Biaya komisi referral untuk anggota baru ${userObj.name}`,
          userId: community.ketuaId,
          communityId: community.id,
          relatedUserId: userObj.id,
          createdAt: new Date()
        })
      }
    }

    saveMockDb()
    return { success: true, membership: m }
  },

  async getAllCoinHolders() {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        const [users, communities] = await Promise.all([
          db.user.findMany({
            where: { coinBalance: { gt: 0 } },
            select: { id: true, name: true, role: true, coinBalance: true }
          }),
          db.community.findMany({
            where: { coinBalance: { gt: 0 } },
            select: { id: true, name: true, type: true, coinBalance: true }
          })
        ])

        const holders: any[] = []
        users.forEach(u => {
          holders.push({
            id: u.id,
            name: u.name,
            type: `MERCHANT/USER (${u.role})`,
            coinBalance: u.coinBalance,
            status: 'ACTIVE'
          })
        })
        communities.forEach(c => {
          holders.push({
            id: c.id,
            name: c.name,
            type: `KOMUNITAS (${c.type})`,
            coinBalance: c.coinBalance,
            status: 'ACTIVE'
          })
        })
        return holders
      } catch (_) {}
    }
    
    // Mock DB
    const holders: any[] = []
    globalMockUsers.forEach(u => {
      if ((u.coinBalance || 0) > 0) {
        holders.push({
          id: u.id,
          name: u.name,
          type: `MERCHANT/USER (${u.role})`,
          coinBalance: u.coinBalance,
          status: 'ACTIVE'
        })
      }
    })
    const communities = (globalThis as any).__mockCommunities || []
    communities.forEach((c: any) => {
      if ((c.coinBalance || 0) > 0) {
        holders.push({
          id: c.id,
          name: c.name,
          type: `KOMUNITAS (${c.type})`,
          coinBalance: c.coinBalance,
          status: 'ACTIVE'
        })
      }
    })
    return holders
  },

  async injectCoin(targetId: string, targetType: 'USER' | 'COMMUNITY', amount: number, reason: string, adminId: string) {
    syncMockDb()
    const desc = `INJECT oleh Admin: ${reason}`
    if (await isDbConnected()) {
      try {
        if (targetType === 'USER') {
          const u = await db.user.update({
            where: { id: targetId },
            data: { coinBalance: { increment: amount } }
          })
          await db.coinTransaction.create({
            data: {
              type: 'INJECTION',
              amount,
              description: desc,
              userId: targetId
            }
          })
          return u
        } else {
          const c = await db.community.update({
            where: { id: targetId },
            data: { 
              coinBalance: { increment: amount },
              isRecruitmentLocked: false
            }
          })
          await db.coinTransaction.create({
            data: {
              type: 'INJECTION',
              amount,
              description: desc,
              userId: adminId,
              communityId: targetId
            }
          })
          return c
        }
      } catch (e: any) {
        throw new Error(e.message || 'Gagal melakukan inject koin.')
      }
    }

    // Mock DB
    if (targetType === 'USER') {
      const u = globalMockUsers.find(x => x.id === targetId)
      if (!u) throw new Error('User tidak ditemukan.')
      u.coinBalance = (u.coinBalance || 0) + amount
      
      if (!(globalThis as any).__mockCoinTransactions) (globalThis as any).__mockCoinTransactions = []
      ;(globalThis as any).__mockCoinTransactions.push({
        id: `ctx-${Date.now()}`,
        type: 'INJECTION',
        amount,
        description: desc,
        userId: targetId,
        createdAt: new Date()
      })
      saveMockDb()
      return u
    } else {
      const communities = (globalThis as any).__mockCommunities || []
      const c = communities.find((x: any) => x.id === targetId)
      if (!c) throw new Error('Komunitas tidak ditemukan.')
      c.coinBalance = (c.coinBalance || 0) + amount
      c.isRecruitmentLocked = false
      
      if (!(globalThis as any).__mockCoinTransactions) (globalThis as any).__mockCoinTransactions = []
      ;(globalThis as any).__mockCoinTransactions.push({
        id: `ctx-${Date.now()}`,
        type: 'INJECTION',
        amount,
        description: desc,
        userId: adminId,
        communityId: targetId,
        createdAt: new Date()
      })
      saveMockDb()
      return c
    }
  },

  async getAdmins() {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        return await db.user.findMany({
          where: { role: 'ADMIN' },
          select: { id: true, name: true, email: true, role: true, isSuperAdmin: true, createdAt: true }
        })
      } catch (_) {}
    }
    return globalMockUsers.filter(u => u.role === 'ADMIN').map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      isSuperAdmin: (u as any).isSuperAdmin || false,
      createdAt: u.createdAt
    }))
  },

  async createAdmin(data: { name: string, email: string, passwordHash: string, isSuperAdmin?: boolean }) {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        const u = await db.user.create({
          data: {
            name: data.name,
            email: data.email,
            passwordHash: data.passwordHash,
            role: 'ADMIN',
            isSuperAdmin: data.isSuperAdmin || false,
            membershipLevel: 'Staff',
            membershipAccess: 'Gold'
          }
        })
        await db.wallet.create({ data: { userId: u.id, balance: 0.0 } })
        return u
      } catch (e: any) {
        throw new Error(e.message || 'Gagal menambahkan admin.')
      }
    }
    
    // Mock DB
    const exists = globalMockUsers.some(u => u.email === data.email)
    if (exists) throw new Error('Email sudah terdaftar.')

    const newAdmin = {
      id: `admin-${Date.now()}`,
      email: data.email,
      name: data.name,
      passwordHash: data.passwordHash,
      role: 'ADMIN' as const,
      isSuperAdmin: data.isSuperAdmin || false,
      level: 1, xp: 0,
      landingPageTemplate: null, landingPageConfig: null, landingPageSetup: false,
      parentAffiliateId: null,
      membershipLevel: 'Staff',
      membershipAccess: 'Gold',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    globalMockUsers.push(newAdmin)
    saveMockDb()
    return newAdmin
  },

  async deleteAdmin(id: string) {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        return await db.user.delete({ where: { id } })
       } catch (e: any) {
        throw new Error(e.message || 'Gagal menghapus admin.')
      }
    }
    
    // Mock DB
    const index = globalMockUsers.findIndex(u => u.id === id)
    if (index === -1) throw new Error('Admin tidak ditemukan.')
    const deleted = globalMockUsers.splice(index, 1)[0]
    saveMockDb()
    return deleted
  },

  async createLevelRequest(data: { userId: string, targetLevel: number, radiusKm: number, omsetBulan: number, hasLegalitas: boolean, hasSertifikat: boolean, hasDesain: boolean, catatan?: string }) {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        return await db.merchantLevelRequest.create({
          data: {
            userId: data.userId,
            targetLevel: data.targetLevel,
            radiusKm: data.radiusKm,
            omsetBulan: data.omsetBulan,
            hasLegalitas: data.hasLegalitas,
            hasSertifikat: data.hasSertifikat,
            hasDesain: data.hasDesain,
            catatan: data.catatan || null
          }
        })
      } catch (e: any) {
        throw new Error(e.message || 'Gagal membuat pengajuan level.')
      }
    }
    
    // Mock DB
    if (!(globalThis as any).__mockLevelRequests) (globalThis as any).__mockLevelRequests = []
    const newRequest = {
      id: `req-${Date.now()}`,
      userId: data.userId,
      targetLevel: data.targetLevel,
      status: 'PENDING',
      radiusKm: data.radiusKm,
      omsetBulan: data.omsetBulan,
      hasLegalitas: data.hasLegalitas,
      hasSertifikat: data.hasSertifikat,
      hasDesain: data.hasDesain,
      catatan: data.catatan || null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    ;(globalThis as any).__mockLevelRequests.push(newRequest)
    saveMockDb()
    return newRequest
  },

  async getLevelRequests(status?: string) {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        const where: any = {}
        if (status) where.status = status
        return await db.merchantLevelRequest.findMany({
          where,
          include: { user: { select: { id: true, name: true, email: true, role: true, merchantLevel: true } } },
          orderBy: { createdAt: 'desc' }
        })
      } catch (_) {}
    }
    
    // Mock DB
    let reqs = (globalThis as any).__mockLevelRequests || []
    if (status) reqs = reqs.filter((r: any) => r.status === status)
    return reqs.map((r: any) => {
      const userObj = globalMockUsers.find(u => u.id === r.userId)
      return {
        ...r,
        user: userObj ? { id: userObj.id, name: userObj.name, email: userObj.email, role: userObj.role, merchantLevel: userObj.merchantLevel || 0 } : null
      }
    }).sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime())
  },

  async approveLevelRequest(requestId: string, adminId: string) {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        const req = await db.merchantLevelRequest.update({
          where: { id: requestId },
          data: {
            status: 'APPROVED',
            reviewedAt: new Date(),
            reviewedBy: adminId
          }
        })
        // Update user merchant level
        await db.user.update({
          where: { id: req.userId },
          data: { merchantLevel: req.targetLevel, levelApprovedAt: new Date(), levelApprovedBy: adminId }
        })
        return req
      } catch (e: any) {
        throw new Error(e.message || 'Gagal menyetujui pengajuan level.')
      }
    }
    
    // Mock DB
    const reqs = (globalThis as any).__mockLevelRequests || []
    const req = reqs.find((r: any) => r.id === requestId)
    if (!req) throw new Error('Pengajuan tidak ditemukan.')
    req.status = 'APPROVED'
    req.reviewedAt = new Date()
    req.reviewedBy = adminId
    
    const userObj = globalMockUsers.find(u => u.id === req.userId)
    if (userObj) {
      ;(userObj as any).merchantLevel = req.targetLevel
      ;(userObj as any).levelApprovedAt = new Date()
      ;(userObj as any).levelApprovedBy = adminId
    }
    saveMockDb()
    return req
  },

  async rejectLevelRequest(requestId: string, note: string, adminId: string) {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        return await db.merchantLevelRequest.update({
          where: { id: requestId },
          data: {
            status: 'REJECTED',
            reviewNote: note,
            reviewedAt: new Date(),
            reviewedBy: adminId
          }
        })
      } catch (e: any) {
        throw new Error(e.message || 'Gagal menolak pengajuan level.')
      }
    }
    
    // Mock DB
    const reqs = (globalThis as any).__mockLevelRequests || []
    const req = reqs.find((r: any) => r.id === requestId)
    if (!req) throw new Error('Pengajuan tidak ditemukan.')
    req.status = 'REJECTED'
    req.reviewNote = note
    req.reviewedAt = new Date()
    req.reviewedBy = adminId
    saveMockDb()
    return req
  },

  // ─── SHU KOPERASI RAT DATASTORE METHODS ────────────────────────────────────
  async upsertShuConfig(data: {
    communityId: string
    year: number
    totalNetProfit: number
    pctCadangan?: number
    pctJasaModal?: number
    pctJasaUsaha?: number
    pctPengurus?: number
    pctPengawas?: number
    pctKaryawan?: number
    pctPendidikan?: number
    pctSosial?: number
    pctPembangunanDaerah?: number
  }) {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        return await db.shuConfig.upsert({
          where: {
            communityId_year: {
              communityId: data.communityId,
              year: data.year
            }
          },
          create: {
            communityId: data.communityId,
            year: data.year,
            totalNetProfit: data.totalNetProfit,
            pctCadangan: data.pctCadangan ?? 25.0,
            pctJasaModal: data.pctJasaModal ?? 20.0,
            pctJasaUsaha: data.pctJasaUsaha ?? 30.0,
            pctPengurus: data.pctPengurus ?? 10.0,
            pctPengawas: data.pctPengawas ?? 5.0,
            pctKaryawan: data.pctKaryawan ?? 5.0,
            pctPendidikan: data.pctPendidikan ?? 2.5,
            pctSosial: data.pctSosial ?? 2.5,
            pctPembangunanDaerah: data.pctPembangunanDaerah ?? 0.0
          },
          update: {
            totalNetProfit: data.totalNetProfit,
            pctCadangan: data.pctCadangan ?? 25.0,
            pctJasaModal: data.pctJasaModal ?? 20.0,
            pctJasaUsaha: data.pctJasaUsaha ?? 30.0,
            pctPengurus: data.pctPengurus ?? 10.0,
            pctPengawas: data.pctPengawas ?? 5.0,
            pctKaryawan: data.pctKaryawan ?? 5.0,
            pctPendidikan: data.pctPendidikan ?? 2.5,
            pctSosial: data.pctSosial ?? 2.5,
            pctPembangunanDaerah: data.pctPembangunanDaerah ?? 0.0
          }
        })
      } catch (_) {}
    }

    const configs = (globalThis as any).__mockShuConfigs || []
    let config = configs.find((c: any) => c.communityId === data.communityId && c.year === data.year)
    if (config) {
      Object.assign(config, data, { updatedAt: new Date() })
    } else {
      config = {
        id: `shu-cfg-${Date.now()}`,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      configs.push(config)
      ;(globalThis as any).__mockShuConfigs = configs
    }
    saveMockDb()
    return config
  },

  async saveShuMemberDistributions(shuConfigId: string, distributions: Array<{
    communityId: string
    userId: string
    year: number
    simpananMember: number
    simpananTotalCommunity: number
    shuJasaModalAmount: number
    transaksiMember: number
    transaksiTotalCommunity: number
    shuJasaUsahaAmount: number
    totalShuAmount: number
  }>) {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        await db.shuMemberDistribution.deleteMany({
          where: { shuConfigId }
        })
        await db.shuMemberDistribution.createMany({
          data: distributions.map(d => ({
            shuConfigId,
            ...d
          }))
        })
        return { success: true }
      } catch (_) {}
    }

    const dists = (globalThis as any).__mockShuMemberDistributions || []
    const filtered = dists.filter((d: any) => d.shuConfigId !== shuConfigId)
    const newItems = distributions.map((d, idx) => ({
      id: `shu-dist-${Date.now()}-${idx}`,
      shuConfigId,
      ...d,
      createdAt: new Date()
    }))
    ;(globalThis as any).__mockShuMemberDistributions = [...filtered, ...newItems]
    saveMockDb()
    return { success: true }
  },

  async getShuConfigByCommunityAndYear(communityId: string, year: number) {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        return await db.shuConfig.findUnique({
          where: {
            communityId_year: { communityId, year }
          },
          include: {
            distributions: true
          }
        })
      } catch (_) {}
    }
    const configs = (globalThis as any).__mockShuConfigs || []
    const cfg = configs.find((c: any) => c.communityId === communityId && c.year === year)
    if (cfg) {
      const dists = ((globalThis as any).__mockShuMemberDistributions || []).filter((d: any) => d.shuConfigId === cfg.id)
      return { ...cfg, distributions: dists }
    }
    return null
  },

  async getMemberShuDistribution(userId: string, communityId: string, year?: number) {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        return await db.shuMemberDistribution.findMany({
          where: {
            userId,
            communityId,
            ...(year ? { year } : {})
          },
          include: {
            shuConfig: true
          },
          orderBy: { year: 'desc' }
        })
      } catch (_) {}
    }
    const dists = ((globalThis as any).__mockShuMemberDistributions || []).filter(
      (d: any) => d.userId === userId && d.communityId === communityId && (!year || d.year === year)
    )
    const configs = (globalThis as any).__mockShuConfigs || []
    return dists.map((d: any) => ({
      ...d,
      shuConfig: configs.find((c: any) => c.id === d.shuConfigId) || null
    }))
  },

  async getCommunityShuHistory(communityId: string) {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        return await db.shuConfig.findMany({
          where: { communityId },
          include: {
            distributions: true
          },
          orderBy: { year: 'desc' }
        })
      } catch (_) {}
    }
    const configs = ((globalThis as any).__mockShuConfigs || []).filter((c: any) => c.communityId === communityId)
    const dists = (globalThis as any).__mockShuMemberDistributions || []
    return configs.map((c: any) => ({
      ...c,
      distributions: dists.filter((d: any) => d.shuConfigId === c.id)
    }))
  },

  // ─── DYNAMIC COMMUNITY METRICS & CRUD FOR PRODUCTS & FUNDING ──────────────
  async getCommunityRealStats(communityId: string) {
    syncMockDb()
    let activeMembersCount = 0
    let activeMerchantsCount = 0
    let totalSavingsCollected = 0
    let shuCurrentYearProfit = 0

    const currentYear = new Date().getFullYear()

    if (await isDbConnected()) {
      try {
        const memberships = await db.communityMembership.findMany({
          where: { communityId },
          include: { user: { select: { id: true, role: true } } }
        })
        activeMembersCount = memberships.length
        activeMerchantsCount = memberships.filter(m => m.user?.role === 'MERCHANT').length

        const shuDist = await db.shuMemberDistribution.findMany({
          where: { communityId, year: currentYear }
        })
        totalSavingsCollected = shuDist.reduce((sum, d) => sum + (d.simpananMember || 0), 0)

        const shuCfg = await db.shuConfig.findUnique({
          where: { communityId_year: { communityId, year: currentYear } }
        })
        shuCurrentYearProfit = shuCfg?.totalNetProfit || 0
      } catch (_) {}
    } else {
      const memberships = ((globalThis as any).__mockCommunityMemberships || []).filter((m: any) => m.communityId === communityId)
      activeMembersCount = memberships.length
      
      const allUsers = (globalThis as any).__mockUsers || globalMockUsers || []
      const memberUserIds = memberships.map((m: any) => m.userId)
      activeMerchantsCount = allUsers.filter((u: any) => memberUserIds.includes(u.id) && u.role === 'MERCHANT').length

      const shuDists = ((globalThis as any).__mockShuMemberDistributions || []).filter((d: any) => d.communityId === communityId && d.year === currentYear)
      totalSavingsCollected = shuDists.reduce((sum: number, d: any) => sum + (d.simpananMember || 0), 0)

      const shuConfigs = (globalThis as any).__mockShuConfigs || []
      const shuCfg = shuConfigs.find((c: any) => c.communityId === communityId && c.year === currentYear)
      shuCurrentYearProfit = shuCfg?.totalNetProfit || 0
    }

    return {
      activeMembersCount,
      activeMerchantsCount,
      totalSavingsCollected,
      shuCurrentYearProfit
    }
  },

  // ─── COOPERATIVE PRODUCTS (SIMPANAN) CRUD ──────────────────────────────────
  async getCooperativeProducts(communityId: string) {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        return await db.cooperativeProduct.findMany({
          where: { communityId },
          orderBy: { createdAt: 'asc' }
        })
      } catch (_) {}
    }
    let products = (globalThis as any).__mockCooperativeProducts || []
    let commProducts = products.filter((p: any) => p.communityId === communityId)
    if (commProducts.length === 0) {
      commProducts = [
        {
          id: `coop-prod-pokok-${communityId}`,
          communityId,
          name: 'Simpanan Pokok',
          type: 'POKOK',
          amount: 150000,
          periodText: 'Sekali Bayar',
          isMandatory: true,
          isPremium: false,
          description: 'Simpanan pokok dibayarkan satu kali saat mendaftar keanggotaan koperasi.',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: `coop-prod-wajib-${communityId}`,
          communityId,
          name: 'Simpanan Wajib',
          type: 'WAJIB',
          amount: 50000,
          periodText: 'Iuran rutin setiap bulan',
          isMandatory: true,
          isPremium: false,
          description: 'Simpanan wajib dibayarkan rutin setiap bulan oleh seluruh anggota.',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: `coop-prod-sukarela-${communityId}`,
          communityId,
          name: 'Simpanan Sukarela',
          type: 'SUKARELA',
          amount: 10000,
          periodText: 'Setor kapan saja',
          isMandatory: false,
          isPremium: false,
          description: 'Simpanan bebas untuk investasi anggota dengan imbal hasil SHU Jasa Modal.',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: `coop-prod-umroh-${communityId}`,
          communityId,
          name: 'Simpanan Umroh',
          type: 'UMROH',
          amount: 50000,
          periodText: 'Tabungan khusus umroh',
          isMandatory: false,
          isPremium: true,
          description: 'Tabungan terencana khusus persiapan ibadah umroh anggota.',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: `coop-prod-qurban-${communityId}`,
          communityId,
          name: 'Simpanan Qurban',
          type: 'QURBAN',
          amount: 20000,
          periodText: 'Tabungan khusus qurban',
          isMandatory: false,
          isPremium: true,
          description: 'Tabungan terencana untuk pelaksanaan ibadah qurban tahunan.',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
      products = [...products, ...commProducts]
      ;(globalThis as any).__mockCooperativeProducts = products
      saveMockDb()
    }
    return commProducts
  },

  async createCooperativeProduct(data: {
    communityId: string
    name: string
    type: string
    amount: number
    periodText?: string
    isMandatory?: boolean
    isPremium?: boolean
    description?: string
  }) {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        return await db.cooperativeProduct.create({
          data: {
            communityId: data.communityId,
            name: data.name,
            type: data.type || 'POKOK',
            amount: Number(data.amount || 0),
            periodText: data.periodText || null,
            isMandatory: Boolean(data.isMandatory),
            isPremium: Boolean(data.isPremium),
            description: data.description || null
          }
        })
      } catch (_) {}
    }
    const products = (globalThis as any).__mockCooperativeProducts || []
    const newP = {
      id: `coop-prod-${Date.now()}`,
      ...data,
      amount: Number(data.amount || 0),
      isMandatory: Boolean(data.isMandatory),
      isPremium: Boolean(data.isPremium),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    products.push(newP)
    ;(globalThis as any).__mockCooperativeProducts = products
    saveMockDb()
    return newP
  },

  async updateCooperativeProduct(id: string, data: any) {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        return await db.cooperativeProduct.update({
          where: { id },
          data: {
            name: data.name,
            type: data.type,
            amount: typeof data.amount === 'number' ? data.amount : undefined,
            periodText: data.periodText,
            isMandatory: typeof data.isMandatory === 'boolean' ? data.isMandatory : undefined,
            isPremium: typeof data.isPremium === 'boolean' ? data.isPremium : undefined,
            description: data.description
          }
        })
      } catch (_) {}
    }
    const products = (globalThis as any).__mockCooperativeProducts || []
    const p = products.find((x: any) => x.id === id)
    if (p) {
      Object.assign(p, data, { updatedAt: new Date() })
      saveMockDb()
      return p
    }
    return null
  },

  async deleteCooperativeProduct(id: string) {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        await db.cooperativeProduct.delete({ where: { id } })
        return { success: true }
      } catch (_) {}
    }
    if ((globalThis as any).__mockCooperativeProducts) {
      ;(globalThis as any).__mockCooperativeProducts = (globalThis as any).__mockCooperativeProducts.filter((p: any) => p.id !== id)
      saveMockDb()
    }
    return { success: true }
  },

  // ─── MERCHANT FUNDING PROJECTS CRUD ────────────────────────────────────────
  async getMerchantFundingProjects(communityId: string) {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        return await db.merchantFundingProject.findMany({
          where: { communityId },
          orderBy: { createdAt: 'desc' }
        })
      } catch (_) {}
    }
    const projects = (globalThis as any).__mockMerchantFundingProjects || []
    return projects.filter((p: any) => p.communityId === communityId)
  },

  async createMerchantFundingProject(data: {
    communityId: string
    merchantId?: string
    title: string
    description?: string
    targetAmount: number
    minInvestment?: number
    estimatedReturn?: number
    durationMonths?: number
    imageUrl?: string
  }) {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        return await db.merchantFundingProject.create({
          data: {
            communityId: data.communityId,
            merchantId: data.merchantId || null,
            title: data.title,
            description: data.description || null,
            targetAmount: Number(data.targetAmount || 0),
            collectedAmount: 0,
            minInvestment: Number(data.minInvestment || 50000),
            estimatedReturn: Number(data.estimatedReturn || 12.0),
            durationMonths: Number(data.durationMonths || 6),
            status: 'OPEN',
            imageUrl: data.imageUrl || null
          }
        })
      } catch (_) {}
    }
    const projects = (globalThis as any).__mockMerchantFundingProjects || []
    const newProj = {
      id: `fund-proj-${Date.now()}`,
      ...data,
      collectedAmount: 0,
      status: 'OPEN',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    projects.push(newProj)
    ;(globalThis as any).__mockMerchantFundingProjects = projects
    saveMockDb()
    return newProj
  },

  async updateMerchantFundingProject(id: string, data: any) {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        return await db.merchantFundingProject.update({
          where: { id },
          data
        })
      } catch (_) {}
    }
    const projects = (globalThis as any).__mockMerchantFundingProjects || []
    const proj = projects.find((p: any) => p.id === id)
    if (proj) {
      Object.assign(proj, data, { updatedAt: new Date() })
      saveMockDb()
      return proj
    }
    return null
  },

  async deleteMerchantFundingProject(id: string) {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        await db.merchantFundingProject.delete({ where: { id } })
        return { success: true }
      } catch (_) {}
    }
    if ((globalThis as any).__mockMerchantFundingProjects) {
      ;(globalThis as any).__mockMerchantFundingProjects = (globalThis as any).__mockMerchantFundingProjects.filter((p: any) => p.id !== id)
      saveMockDb()
    }
    return { success: true }
  }
}


// Global Registry for Midtrans transactions to handle polling/webhooks on local server
const pendingCheckouts: Record<string, any> = (globalThis as any).pendingCheckouts || {};
if (process.env.NODE_ENV !== 'production') {
  (globalThis as any).pendingCheckouts = pendingCheckouts;
}

const processedTransactions: Record<string, boolean> = (globalThis as any).processedTransactions || {};
if (process.env.NODE_ENV !== 'production') {
  (globalThis as any).processedTransactions = processedTransactions;
}

export const MidtransRegistry = {
  savePendingCheckout(orderId: string, data: {
    userId: string,
    items: Array<{ productId: string, quantity: number }>,
    affiliateId?: string,
    shippingDetails?: {
      shippingFee?: number
      courier?: string
      shippingAddress?: string
      couponCode?: string
      discountAmount?: number
      bumpSales?: string
    }
  }) {
    pendingCheckouts[orderId] = data;
  },
  getPendingCheckout(orderId: string) {
    return pendingCheckouts[orderId] || null;
  },
  isTransactionProcessed(orderId: string) {
    return !!processedTransactions[orderId];
  },
  markTransactionProcessed(orderId: string) {
    processedTransactions[orderId] = true;
  }
};
