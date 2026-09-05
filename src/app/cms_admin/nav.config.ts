import {
  LayoutDashboard,
  Users,
  Store,
  ShieldCheck,
  Package,
  Wrench,
  Cookie,
  Truck,
  MapPin,
  Wallet,
  ArrowLeftRight,
  Banknote,
  Coins,
  CreditCard,
  Building2,
  Share2,
  GraduationCap,
  Megaphone,
  LifeBuoy,
  ScrollText,
  type LucideIcon
} from 'lucide-react'

/**
 * Single source of truth for the admin CMS navigation.
 *
 * Everything derives from MENUS: the sidebar, the page title, the RBAC
 * permission checklist, route validation and the CSV exporter. Previously
 * these were four separate hardcoded lists that had drifted apart.
 *
 * URL contract is exactly two segments: /cms_admin/{menu}/{tab}
 * Menus that belong to the same category use flat keys (e.g. `snackbox-order`)
 * so the contract holds; the category header does the visual grouping.
 */

export type Tab = {
  key: string
  label: string
}

export type Menu = {
  /** URL segment + RBAC permission key. Unique. */
  key: string
  /** Sidebar label. */
  label: string
  /** Page header title. */
  title: string
  /** Sentence describing the menu, shown in the RBAC permission picker. */
  desc: string
  icon: LucideIcon
  /** Sidebar category header, or null for ungrouped items pinned to the top. */
  category: string | null
  tabs?: Tab[]
  /** Marks menus still backed by mock/client-only data, badged in the UI. */
  mock?: boolean
  /** Skips the shell's content padding/tab bar so the menu's own UI fills the area edge-to-edge. */
  fullBleed?: boolean
}

export const CATEGORIES = [
  'PENGGUNA & MERCHANT',
  'KATALOG',
  'SNACKBOX',
  'KEUANGAN',
  'KOMUNITAS',
  'KONTEN & EDUKASI',
  'SISTEM'
] as const

export const MENUS: Menu[] = [
  {
    key: 'overview',
    label: 'Dashboard Overview',
    title: 'Dashboard Overview',
    desc: 'Ringkasan performa dan grafik bisnis platform',
    icon: LayoutDashboard,
    category: null
  },

  // ─── PENGGUNA & MERCHANT ──────────────────────────────────────────────
  {
    key: 'users',
    label: 'Kelola User',
    title: 'User Management',
    desc: 'Lihat daftar user, edit data, alamat IP, telepon',
    icon: Users,
    category: 'PENGGUNA & MERCHANT',
    // Role filtering stays in the existing dropdown (it covers all five roles);
    // these tabs switch between two genuinely different views.
    tabs: [
      { key: 'daftar', label: 'Daftar User' },
      { key: 'sertifikasi', label: 'Sertifikasi' }
    ]
  },
  {
    key: 'merchants',
    label: 'Merchant',
    title: 'Merchant Approval',
    desc: 'Verifikasi merchant baru dan persetujuan kenaikan level usaha',
    icon: Store,
    category: 'PENGGUNA & MERCHANT',
    tabs: [
      { key: 'verifikasi', label: 'Verifikasi Baru' },
      { key: 'level', label: 'Kenaikan Level' }
    ]
  },
  {
    key: 'admins',
    label: 'Admin & Hak Akses',
    title: 'Admin Management & RBAC',
    desc: 'Kelola staf admin dan konfigurasi hak akses modul',
    icon: ShieldCheck,
    category: 'PENGGUNA & MERCHANT'
    // No tabs: RBAC is edited in the per-admin modal, not a separate view.
  },

  // ─── KATALOG ──────────────────────────────────────────────────────────
  {
    key: 'products',
    label: 'Katalog Produk',
    title: 'Product Catalog',
    desc: 'Moderasi produk fisik dan digital di katalog UMKM',
    icon: Package,
    category: 'KATALOG'
    // No tabs: the underlying Product model only distinguishes PRODUCT vs JASA,
    // and JASA now has its own menu. A Fisik/Digital split would be fictional.
  },
  {
    key: 'services',
    label: 'Jasa & Layanan',
    title: 'Jasa & Layanan',
    desc: 'Katalog jasa, booking pelanggan, dan jadwal ketersediaan',
    icon: Wrench,
    category: 'KATALOG',
    tabs: [
      { key: 'katalog', label: 'Katalog Jasa' },
      { key: 'booking', label: 'Booking' },
      { key: 'jadwal', label: 'Jadwal' }
    ]
  },

  // ─── SNACKBOX ─────────────────────────────────────────────────────────
  {
    key: 'snackbox-kurasi',
    label: 'Mitra & Produk',
    title: 'Mitra & Produk Snackbox',
    desc: 'Validasi kelayakan merchant dan produk kue masuk Snackbox',
    icon: Cookie,
    category: 'SNACKBOX',
    tabs: [
      { key: 'merchant', label: 'Mitra Snackbox' },
      { key: 'katalog', label: 'Produk Snackbox' }
    ]
  },
  {
    key: 'snackbox-order',
    label: 'Order History',
    title: 'Order History Snackbox',
    desc: 'Relay pesanan Snackbox ke mitra kue lokal dan status pengiriman',
    icon: Truck,
    category: 'SNACKBOX',
    mock: true,
    tabs: [
      { key: 'pending', label: 'Pending' },
      { key: 'dihubungi', label: 'Dihubungi' },
      { key: 'konfirmasi', label: 'Konfirmasi' },
      { key: 'ditolak', label: 'Ditolak' }
    ]
  },
  {
    key: 'snackbox-coverage',
    label: 'Coverage Kelurahan',
    title: 'Coverage Kelurahan Snackbox',
    desc: 'Wilayah operasional dan jangkauan pengiriman Snackbox per kelurahan',
    icon: MapPin,
    category: 'SNACKBOX',
    mock: true
  },
  {
    key: 'snackbox-payout',
    label: 'Payout Mitra',
    title: 'Payout Mitra Snackbox',
    desc: 'Pencairan dana Snackbox terjadwal ke mitra',
    icon: Wallet,
    category: 'SNACKBOX',
    mock: true
  },

  // ─── KEUANGAN ─────────────────────────────────────────────────────────
  {
    key: 'transactions',
    label: 'Transaksi',
    title: 'Transaction Tracking',
    desc: 'Lacak riwayat transaksi marketplace dan jasa',
    icon: ArrowLeftRight,
    category: 'KEUANGAN'
  },
  {
    key: 'withdrawals',
    label: 'Withdrawal',
    title: 'Financials & Withdrawals',
    desc: 'Proses penarikan saldo wallet merchant dan affiliate',
    icon: Banknote,
    category: 'KEUANGAN'
  },
  {
    key: 'coins',
    label: 'Koin & Voucher',
    title: 'Kelola Koin & Voucher',
    desc: 'Kelola supply coin, distribusi koin, dan voucher',
    icon: Coins,
    category: 'KEUANGAN',
    tabs: [
      { key: 'supply', label: 'Supply & Distribusi' },
      { key: 'holders', label: 'Pemegang Koin' },
      { key: 'voucher', label: 'Voucher' },
      { key: 'ledger', label: 'Ledger' }
    ]
  },
  {
    key: 'payment-methods',
    label: 'Metode Pembayaran',
    title: 'Kelola Metode Pembayaran',
    desc: 'Atur opsi rekening bank manual dan QRIS untuk checkout',
    icon: CreditCard,
    category: 'KEUANGAN'
  },

  // ─── KOMUNITAS ────────────────────────────────────────────────────────
  {
    key: 'communities',
    label: 'Komunitas Induk',
    title: 'Community & Members',
    desc: 'Kelola komunitas induk, anggota koperasi, dan moderasi forum',
    icon: Building2,
    category: 'KOMUNITAS',
    tabs: [
      { key: 'daftar', label: 'Daftar' },
      { key: 'invoice', label: 'Invoice Keanggotaan' },
      { key: 'forum', label: 'Moderasi Forum' },
      { key: 'laporan', label: 'Laporan' },
      { key: 'kyc', label: 'Pengaturan KYC' }
    ]
  },
  {
    key: 'affiliates',
    label: 'Monitor Affiliate',
    title: 'Affiliate Monitoring',
    desc: 'Pantau jaringan afiliasi dan komisi multi-tier',
    icon: Share2,
    category: 'KOMUNITAS'
  },

  // ─── KONTEN & EDUKASI ─────────────────────────────────────────────────
  {
    key: 'academy',
    label: 'LMS / Akademi',
    title: 'LMS Management',
    desc: 'Kelola materi kursus dan edukasi UMKM',
    icon: GraduationCap,
    category: 'KONTEN & EDUKASI'
  },
  {
    key: 'content',
    label: 'Konten & Promosi',
    title: 'Konten & Promosi',
    desc: 'Banner carousel landing page dan pengumuman platform',
    icon: Megaphone,
    category: 'KONTEN & EDUKASI',
    tabs: [
      { key: 'banner', label: 'Banner Landing' },
      { key: 'pengumuman', label: 'Pengumuman' }
    ]
  },

  // ─── SISTEM ───────────────────────────────────────────────────────────
  {
    key: 'support',
    label: 'Tiket CS',
    title: 'Customer Support',
    desc: 'Antrian tiket support, penugasan agen, dan eskalasi',
    icon: LifeBuoy,
    category: 'SISTEM',
    // Embeds the existing CS Support Desk (its own dark theme, own queue
    // filters) full-bleed instead of duplicating a tab bar on top of it.
    fullBleed: true
  },
  {
    key: 'audit',
    label: 'Audit Log',
    title: 'Audit Log System',
    desc: 'Rekaman aktivitas admin dan member',
    icon: ScrollText,
    category: 'SISTEM',
    tabs: [
      { key: 'semua', label: 'Semua' },
      { key: 'member', label: 'Member' },
      { key: 'admin', label: 'Admin' }
    ]
  }
]

export const menuByKey: Record<string, Menu> = Object.fromEntries(
  MENUS.map((m) => [m.key, m])
)

/** Default landing menu when none is specified. */
export const DEFAULT_MENU = 'overview'

/** Resolve the active tab for a menu, falling back to its first tab. */
export function resolveTab(menu: Menu, tab?: string): string | undefined {
  if (!menu.tabs?.length) return undefined
  if (tab && menu.tabs.some((t) => t.key === tab)) return tab
  return menu.tabs[0].key
}

export function menuHref(menuKey: string, tabKey?: string): string {
  return tabKey ? `/cms_admin/${menuKey}/${tabKey}` : `/cms_admin/${menuKey}`
}
