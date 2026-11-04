import { WizardAnswers } from './wizardTypes'

export interface GeneratedLandingPageResult {
  builderComponents: any[]
  canvasBg: string
}

function makeId(prefix = 'c') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Maps the 4-step wizard answers into a full landing page component set.
 *
 * - designImpression controls visual style (colors, spacing, tone)
 * - preferredLayout  controls which sections appear and in what order
 * - businessCategory drives fallback hero images and copy
 */
export function generateLandingPageFromAnswers(
  answers: WizardAnswers,
  merchantProducts: any[] = [],
  merchantServices: any[] = []
): GeneratedLandingPageResult {
  const comps: any[] = []

  // ── Map impression → style tokens ───────────────────────────────────────────
  const impression = answers.designImpression || 'modern'

  const palette: Record<string, { headlineColor: string; subColor: string; accentBg: string; canvasBg: string; bannerBg: string; bannerText: string; btnBg: string }> = {
    modern:       { headlineColor: '#111827', subColor: '#64748B', accentBg: '#F0FDF4', canvasBg: '#FFFFFF', bannerBg: '#2DB24A', bannerText: '#FFFFFF', btnBg: '#2DB24A' },
    profesional:  { headlineColor: '#0F172A', subColor: '#475569', accentBg: '#F8FAFC', canvasBg: '#F8FAFC', bannerBg: '#0F172A', bannerText: '#FFFFFF', btnBg: '#1E293B' },
    ramah:        { headlineColor: '#1E3A1E', subColor: '#4B7C4B', accentBg: '#ECFDF5', canvasBg: '#FFFFFF', bannerBg: '#34D399', bannerText: '#064E3B', btnBg: '#10B981' },
    elegan:       { headlineColor: '#1C1917', subColor: '#78716C', accentBg: '#FAFAF9', canvasBg: '#FAFAF9', bannerBg: '#292524', bannerText: '#F5F5F4', btnBg: '#44403C' },
  }
  const p = palette[impression] || palette.modern

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const baseStyle = (overrides: Record<string, any> = {}) => ({
    textAlign: 'left', fontSize: 'default', fontWeight: 'default',
    color: '', bgColor: '', paddingTop: 16, paddingBottom: 16,
    paddingLeft: 16, paddingRight: 16, opacity: 100,
    textDecoration: 'none', textTransform: 'none', borderRadius: 0,
    ...overrides
  })

  const baseAdvance = (overrides: Record<string, any> = {}) => ({
    marginTop: 0, marginBottom: 0, animation: 'none',
    showDesktop: true, showTablet: true, showMobile: true,
    customClass: '', customId: '', ...overrides
  })

  const addComp = (type: string, content: Record<string, any>, customStyle = {}, customAdvance = {}) => {
    comps.push({ id: makeId(), type, content, style: baseStyle(customStyle), advance: baseAdvance(customAdvance) })
  }

  const canvasBg = p.canvasBg

  // ── Auto-generate copy based on category ────────────────────────────────────
  const bName = answers.businessName || 'Toko Kami'
  const cat = answers.businessCategory || 'lainnya'

  const headlineMap: Record<string, string> = {
    makanan:    `Nikmati Kelezatan Kuliner Spesial dari ${bName}`,
    fashion:    `Tampil Percaya Diri dengan Koleksi Fashion ${bName}`,
    kecantikan: `Tampil Cantik & Percaya Diri bersama ${bName}`,
    kerajinan:  `Kerajinan Unik & Berkualitas dari ${bName}`,
    jasa:       `Solusi Jasa & Layanan Terpercaya oleh ${bName}`,
    lainnya:    `Temukan Produk Berkualitas di ${bName}`,
  }
  const subheadlineMap: Record<string, string> = {
    makanan:    'Dibuat dari bahan segar pilihan, resep autentik, dan dijamin lezat.',
    fashion:    'Bahan berkualitas premium, nyaman dipakai, dan model selalu kekinian.',
    kecantikan: 'Produk perawatan terbaik untuk tampil sempurna setiap hari.',
    kerajinan:  'Dibuat dengan tangan terampil dan cinta, setiap produk punya cerita.',
    jasa:       'Dikerjakan oleh tenaga ahli berpengalaman dengan jaminan kepuasan.',
    lainnya:    'Kami menyediakan produk pilihan terbaik dengan pelayanan ramah dan cepat.',
  }
  const heroImageMap: Record<string, string> = {
    makanan:    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1000&auto=format&fit=crop&q=80',
    fashion:    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1000&auto=format&fit=crop&q=80',
    kecantikan: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1000&auto=format&fit=crop&q=80',
    kerajinan:  'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=1000&auto=format&fit=crop&q=80',
    jasa:       'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1000&auto=format&fit=crop&q=80',
    lainnya:    'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1000&auto=format&fit=crop&q=80',
  }

  const headlineText = headlineMap[cat] || headlineMap.lainnya
  const subheadlineText = subheadlineMap[cat] || subheadlineMap.lainnya
  const heroImage = heroImageMap[cat] || heroImageMap.lainnya

  const isJasa = cat === 'jasa'
  const layout = answers.preferredLayout || 'fokus_produk'

  // ── Collect merchant product / service IDs ──────────────────────────────────
  const productIds = merchantProducts.slice(0, 6).map((p: any) => p.id)
  const serviceIds = merchantServices.slice(0, 4).map((s: any) => s.id)

  // ══════════════════════════════════════════════════════════════════════════════
  // BUILD COMPONENTS based on preferredLayout
  // ══════════════════════════════════════════════════════════════════════════════

  // ── 1. NAVIGATION BAR (always) ──────────────────────────────────────────────
  const navLinks = [
    { label: 'Beranda', url: '#' },
    ...(productIds.length > 0 && !isJasa ? [{ label: 'Produk', url: '#produk' }] : []),
    ...(serviceIds.length > 0 || isJasa ? [{ label: 'Layanan', url: '#layanan' }] : []),
    { label: 'Tentang', url: '#tentang' },
    { label: 'Kontak', url: '#kontak' },
  ]
  addComp('navigation', { links: navLinks, logoText: bName }, {
    bgColor: '#FFFFFF', color: '#111827', paddingTop: 14, paddingBottom: 14
  })

  // ── 2. PROMO BANNER (fokus_promosi layout always, others skip) ──────────────
  if (layout === 'fokus_promosi') {
    addComp('banner_announcement', {
      text: '🔥 Promo Spesial! Dapatkan penawaran terbaik hari ini khusus pelanggan setia.',
      bgColor: p.bannerBg, textColor: p.bannerText, link: ''
    }, { paddingTop: 10, paddingBottom: 10, textAlign: 'center' })

    // Countdown timer for promo
    addComp('countdown_timer', {
      targetDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
      label: '⚡ Promo Berakhir Dalam:'
    }, { textAlign: 'center', paddingTop: 12, paddingBottom: 12 })
  }

  // ── 3. HERO SECTION (always) ────────────────────────────────────────────────
  addComp('headline', { text: headlineText, tag: 'h1' }, {
    textAlign: 'center', paddingTop: 32, paddingBottom: 8,
    color: p.headlineColor, fontWeight: 'bold'
  })
  addComp('subheadline', { text: subheadlineText, tag: 'h2' }, {
    textAlign: 'center', paddingTop: 4, paddingBottom: 20, color: p.subColor
  })
  addComp('image', { src: heroImage, alt: bName, caption: '', width: '100%' }, {
    borderRadius: impression === 'profesional' ? 12 : 20, paddingTop: 8, paddingBottom: 24
  })

  // ── 4. LAYOUT-SPECIFIC SECTIONS ─────────────────────────────────────────────

  if (layout === 'fokus_produk') {
    // Product showcase first, then services, then social proof
    if (!isJasa && productIds.length > 0) {
      addComp('product_showcase', {
        productIds, layout: 'grid', columns: 2,
        title: cat === 'makanan' ? 'Menu Pilihan Kami' : 'Koleksi Produk Pilihan',
        showPrice: true, showStock: true, showBuyBtn: true, buyBtnLabel: 'Pesan Sekarang'
      }, { paddingTop: 24, paddingBottom: 24 })
    }
    if (serviceIds.length > 0 || isJasa) {
      addComp('service_showcase', {
        serviceIds, layout: 'grid', columns: 2,
        title: 'Layanan Jasa & Keahlian',
        showPrice: true, showBookingBtn: true, bookingBtnLabel: 'Booking Jadwal'
      }, { paddingTop: 24, paddingBottom: 24 })
    }
    // Rating
    addComp('rating', { score: 4.9, total: 128, label: 'Tingkat Kepuasan Pelanggan' }, {
      textAlign: 'center', paddingTop: 12, paddingBottom: 12
    })

  } else if (layout === 'fokus_promosi') {
    // Social proof first, then products
    addComp('rating', { score: 4.9, total: 128, label: 'Tingkat Kepuasan Pelanggan' }, {
      textAlign: 'center', paddingTop: 12, paddingBottom: 12
    })
    addComp('visitor_counter', { count: 1450, label: 'calon pembeli telah mengunjungi toko ini' }, {
      textAlign: 'center', paddingTop: 8, paddingBottom: 16
    })
    addComp('sold_counter', { count: 342, label: 'terjual hari ini' }, {
      textAlign: 'center', paddingTop: 4, paddingBottom: 16
    })

    if (!isJasa && productIds.length > 0) {
      addComp('product_showcase', {
        productIds, layout: 'grid', columns: 2,
        title: cat === 'makanan' ? 'Menu Pilihan Kami' : 'Koleksi Produk Pilihan',
        showPrice: true, showStock: true, showBuyBtn: true, buyBtnLabel: 'Pesan Sekarang'
      }, { paddingTop: 24, paddingBottom: 24 })
    }
    if (serviceIds.length > 0 || isJasa) {
      addComp('service_showcase', {
        serviceIds, layout: 'grid', columns: 2,
        title: 'Layanan Jasa & Keahlian',
        showPrice: true, showBookingBtn: true, bookingBtnLabel: 'Booking Jadwal'
      }, { paddingTop: 24, paddingBottom: 24 })
    }

  } else if (layout === 'fokus_informasi') {
    // Feature list, FAQ, testimonials, then products
    addComp('feature_list', {
      items: [
        'Kualitas terjamin & bergaransi',
        'Pengiriman cepat ke seluruh Indonesia',
        'Layanan pelanggan responsif'
      ], icon: 'check'
    }, { paddingTop: 12, paddingBottom: 24, bgColor: p.accentBg, borderRadius: 16 })

    addComp('faq', {
      items: [
        { question: 'Berapa lama pengiriman?', answer: 'Pengiriman memakan waktu 2-3 hari kerja.' },
        { question: 'Apakah ada garansi?', answer: 'Ya, kami memberikan garansi 30 hari.' },
        { question: 'Bagaimana cara memesan?', answer: 'Klik tombol WhatsApp di bawah untuk langsung terhubung dengan kami.' }
      ]
    }, { paddingTop: 24, paddingBottom: 24 })

    addComp('testimonials', {
      items: [
        { name: 'Budi Santoso', role: 'Pelanggan Setia', text: 'Produk sangat berkualitas, sangat puas dengan pelayanannya!' },
        { name: 'Sari Dewi', role: 'Customer', text: 'Pengiriman cepat dan produk sesuai deskripsi.' }
      ]
    }, { paddingTop: 24, paddingBottom: 24, bgColor: p.accentBg, borderRadius: 20 })

    if (!isJasa && productIds.length > 0) {
      addComp('product_showcase', {
        productIds, layout: 'grid', columns: 2,
        title: cat === 'makanan' ? 'Menu Pilihan Kami' : 'Koleksi Produk Pilihan',
        showPrice: true, showStock: true, showBuyBtn: true, buyBtnLabel: 'Pesan Sekarang'
      }, { paddingTop: 24, paddingBottom: 24 })
    }
    if (serviceIds.length > 0 || isJasa) {
      addComp('service_showcase', {
        serviceIds, layout: 'grid', columns: 2,
        title: 'Layanan Jasa & Keahlian',
        showPrice: true, showBookingBtn: true, bookingBtnLabel: 'Booking Jadwal'
      }, { paddingTop: 24, paddingBottom: 24 })
    }
  }

  // ── 5. CTA WHATSAPP (always) ────────────────────────────────────────────────
  addComp('space', { height: 16 })
  addComp('whatsapp_button', {
    label: 'Pesan Sekarang via WhatsApp',
    phone: '6281234567890',
    message: `Halo ${bName}, saya tertarik untuk memesan produk/layanan Anda.`
  }, { textAlign: 'center', paddingTop: 16, paddingBottom: 24 })

  // Floating WA
  addComp('floating_whatsapp', {
    phone: '6281234567890',
    message: `Halo ${bName}, saya ingin bertanya.`
  })

  return { builderComponents: comps, canvasBg }
}

/**
 * Helper to inspect existing components and fill answers when editing a page
 */
export function extractAnswersFromComponents(comps: any[], fallbackAnswers: WizardAnswers): WizardAnswers {
  if (!comps || !Array.isArray(comps) || comps.length === 0) {
    return fallbackAnswers
  }
  const result = { ...fallbackAnswers }

  const navComp = comps.find((c) => c.type === 'navigation')
  if (navComp?.content?.logoText) {
    result.businessName = navComp.content.logoText
  }

  return result
}
