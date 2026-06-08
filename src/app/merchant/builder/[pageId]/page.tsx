'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getCurrentUserProfile, updateUserLandingPage } from '@/app/actions/auth'
import { getProducts } from '@/app/actions/products'
import { 
  ArrowLeft,
  ChevronDown,
  Phone,
  Check,
  Star,
  Users,
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
export interface BuilderComponent {
  id: string
  type: string
  content: Record<string, any>
  style: Record<string, any>
  advance: Record<string, any>
}

// ─── Component Catalog ────────────────────────────────────────────────────────
const CATALOG = [
  {
    category: 'CONTENT',
    items: [
      { type: 'headline',            label: 'Headline' },
      { type: 'subheadline',         label: 'Subheadline' },
      { type: 'content',             label: 'Paragraf' },
      { type: 'button',              label: 'Button' },
      { type: 'whatsapp_button',     label: 'WhatsApp Button' },
      { type: 'feature_list',        label: 'Feature List' },
      { type: 'banner_announcement', label: 'Banner' },
      { type: 'countdown_timer',     label: 'Countdown Timer' },
      { type: 'pricing',             label: 'Pricing Table' },
    ],
  },
  {
    category: 'MEDIA',
    items: [
      { type: 'image',       label: 'Image' },
      { type: 'image_slide', label: 'Image Slide' },
      { type: 'video',       label: 'Video' },
    ],
  },
  {
    category: 'SOCIAL PROOF',
    items: [
      { type: 'testimonials',      label: 'Testimonials' },
      { type: 'rating',            label: 'Rating' },
      { type: 'visitor_counter',   label: 'Visitor Counter' },
      { type: 'sold_counter',      label: 'Sold Counter' },
      { type: 'sales_notification',label: 'Sales Notification' },
    ],
  },
  {
    category: 'FORM & FAQ',
    items: [
      { type: 'faq',      label: 'FAQ' },
      { type: 'formulir', label: 'Formulir' },
    ],
  },
  {
    category: 'LAYOUT',
    items: [
      { type: 'line',       label: 'Divider' },
      { type: 'space',      label: 'Spacer' },
      { type: 'navigation', label: 'Navigation Bar' },
      { type: 'tabs',       label: 'Tabs' },
    ],
  },
  {
    category: 'LAINNYA',
    items: [
      { type: 'html',             label: 'Custom HTML' },
      { type: 'floating_whatsapp',label: 'Floating WhatsApp' },
      { type: 'popup',            label: 'Popup' },
    ],
  },
  {
    category: 'PRODUK MARKETPLACE',
    items: [
      { type: 'product_showcase', label: 'Showcase Produk' },
    ],
  },
]

// ─── Icons ────────────────────────────────────────────────────────────────────
const ICONS: Record<string, React.ReactNode> = {
  product_showcase: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><rect x="1" y="5" width="8" height="10" rx="1"/><rect x="11" y="5" width="8" height="10" rx="1"/><path strokeLinecap="round" d="M4 8h2M4 10h2M13 8h2M13 10h2"/></svg>,
  headline:            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M2 5a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zm0 5a1 1 0 011-1h10a1 1 0 110 2H3a1 1 0 01-1-1zm0 5a1 1 0 011-1h6a1 1 0 110 2H3a1 1 0 01-1-1z" clipRule="evenodd"/></svg>,
  subheadline:         <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M2 5a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zm0 5a1 1 0 011-1h8a1 1 0 110 2H3a1 1 0 01-1-1z" clipRule="evenodd"/></svg>,
  content:             <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h8a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/></svg>,
  button:              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><rect x="3" y="7" width="14" height="6" rx="3"/></svg>,
  whatsapp_button:     <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a9.87 9.87 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/></svg>,
  image:               <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><rect x="2" y="4" width="16" height="12" rx="2"/><path strokeLinecap="round" strokeLinejoin="round" d="M2 13l4-4 3 3 3-3 6 4"/><circle cx="7" cy="8" r="1"/></svg>,
  image_slide:         <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><rect x="2" y="5" width="16" height="10" rx="1"/><path strokeLinecap="round" d="M7 15v1M13 15v1M5 10h10"/></svg>,
  video:               <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><rect x="2" y="5" width="11" height="10" rx="1"/><path strokeLinecap="round" strokeLinejoin="round" d="M13 8l5-3v10l-5-3V8z"/></svg>,
  line:                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" d="M3 10h14"/></svg>,
  space:               <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" d="M10 4v12M5 4h10M5 16h10"/></svg>,
  faq:                 <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><circle cx="10" cy="10" r="8"/><path strokeLinecap="round" d="M8 8a2 2 0 114 0c0 2-2 2-2 3M10 15h.01"/></svg>,
  testimonials:        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>,
  feature_list:        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" d="M4 6h12M4 10h12M4 14h6"/><circle cx="2" cy="6" r="0.5" fill="currentColor"/><circle cx="2" cy="10" r="0.5" fill="currentColor"/></svg>,
  banner_announcement: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><rect x="2" y="7" width="16" height="6" rx="1"/><path strokeLinecap="round" d="M8 7V5M12 7V5"/></svg>,
  countdown_timer:     <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><circle cx="10" cy="11" r="7"/><path strokeLinecap="round" strokeLinejoin="round" d="M10 7v4l3 2M8 3h4"/></svg>,
  pricing:             <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" d="M10 2v16M6 6h8M6 14h8M4 10h12"/></svg>,
  rating:              <svg viewBox="0 0 20 20" fill="#FBBF24" className="w-4 h-4"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>,
  visitor_counter:     <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" d="M9 11a3 3 0 100-6 3 3 0 000 6zM17 18a6 6 0 10-12 0"/></svg>,
  sold_counter:        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>,
  sales_notification:  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17H5a2 2 0 01-2-2V9a7 7 0 1114 0v6a2 2 0 01-2 2zm-5 0v2"/></svg>,
  formulir:            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><rect x="3" y="3" width="14" height="14" rx="2"/><path strokeLinecap="round" d="M7 7h6M7 10h6M7 13h3"/></svg>,
  navigation:          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" d="M2 5h16M6 10h8M4 15h12"/></svg>,
  tabs:                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" d="M3 7h5v8H3zM8 7h5v8H8z"/><path strokeLinecap="round" d="M3 4h5v3H3zM8 4h5v3H8z"/></svg>,
  html:                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 8l-4 4 4 4M14 8l4 4-4 4M11 6l-2 8"/></svg>,
  popup:               <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><rect x="4" y="4" width="12" height="12" rx="2"/><path strokeLinecap="round" d="M8 8h4M8 11h3"/></svg>,
  floating_whatsapp:   <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-green-400"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
}
const getIcon = (type: string) => ICONS[type] ?? <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><rect x="3" y="3" width="14" height="14" rx="2"/></svg>

// ─── Defaults ─────────────────────────────────────────────────────────────────
function defaultContent(type: string): Record<string, any> {
  const m: Record<string, Record<string, any>> = {
    headline:            { text: 'Judul Utama Anda', tag: 'h1' },
    subheadline:         { text: 'Sub Judul Halaman Anda', tag: 'h2' },
    content:             { text: 'Tulis deskripsi produk atau layanan Anda di sini. Anda bisa menjelaskan keunggulan, manfaat, dan detail produk.' },
    button:              { label: 'Klik Di Sini', url: '#', target: '_self' },
    whatsapp_button:     { label: 'Hubungi via WhatsApp', phone: '6281234567890', message: 'Halo, saya ingin bertanya.' },
    image:               { src: '', alt: 'Gambar', caption: '', width: '100%' },
    image_slide:         { images: [{ src: '', alt: 'Slide 1' }, { src: '', alt: 'Slide 2' }] },
    video:               { src: '', isLocal: false, title: 'Video Produk Kami' },
    product_showcase:    { productIds: [], layout: 'grid', columns: 2, title: 'Produk Kami', showPrice: true, showStock: true, showBuyBtn: true, buyBtnLabel: 'Beli Sekarang' },
    line:                { thickness: 1, color: '#E5E7EB' },
    space:               { height: 32 },
    feature_list:        { items: ['Kualitas terjamin & bergaransi', 'Pengiriman cepat ke seluruh Indonesia', 'Layanan pelanggan 24 jam'], icon: 'check' },
    faq:                 { items: [{ question: 'Berapa lama pengiriman?', answer: 'Pengiriman memakan waktu 2-3 hari kerja.' }, { question: 'Apakah ada garansi?', answer: 'Ya, kami memberikan garansi 30 hari.' }] },
    testimonials:        { items: [{ name: 'Budi Santoso', role: 'Pelanggan Setia', text: 'Produk sangat berkualitas, sangat puas dengan pelayanannya!' }, { name: 'Sari Dewi', role: 'Customer', text: 'Pengiriman cepat dan produk sesuai deskripsi.' }] },
    rating:              { score: 4.8, total: 128, label: 'Rating Produk' },
    banner_announcement: { text: '🔥 Promo Hari Ini! Gratis Ongkir untuk pembelian di atas Rp 100rb', bgColor: '#2DB24A', textColor: '#FFFFFF', link: '' },
    countdown_timer:     { targetDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(), label: 'Penawaran berakhir dalam:' },
    pricing:             { plans: [{ name: 'Starter', price: '99.000', period: '/bulan', features: ['Fitur A', 'Fitur B', 'Fitur C'], cta: 'Mulai Sekarang', highlighted: false }, { name: 'Pro', price: '199.000', period: '/bulan', features: ['Semua Starter', 'Fitur D', 'Prioritas Support'], cta: 'Pilih Pro', highlighted: true }] },
    visitor_counter:     { count: 1247, label: 'orang telah melihat halaman ini' },
    sales_notification:  { buyerName: 'Andi dari Jakarta', product: 'produk ini', timeAgo: '2 menit lalu' },
    sold_counter:        { count: 342, label: 'terjual hari ini' },
    navigation:          { links: [{ label: 'Beranda', url: '#' }, { label: 'Produk', url: '#produk' }, { label: 'Kontak', url: '#kontak' }], logoText: 'Brand' },
    tabs:                { tabs: [{ label: 'Deskripsi', content: 'Deskripsi produk Anda di sini.' }, { label: 'Spesifikasi', content: 'Spesifikasi teknis produk.' }, { label: 'Ulasan', content: 'Ulasan dari pelanggan.' }] },
    html:                { code: '<p style="text-align:center">Kode HTML kustom Anda di sini</p>' },
    formulir:            { fields: [{ type: 'text', label: 'Nama Lengkap', placeholder: 'Masukkan nama lengkap', required: true }, { type: 'tel', label: 'Nomor WhatsApp', placeholder: '08xx-xxxx-xxxx', required: true }, { type: 'email', label: 'Email', placeholder: 'email@example.com', required: false }], submitLabel: 'Kirim Sekarang', redirectUrl: '' },
    floating_whatsapp:   { phone: '6281234567890', message: 'Halo saya ingin bertanya.' },
    popup:               { title: 'Penawaran Spesial!', content: 'Dapatkan diskon 20% untuk pembelian pertama Anda.', buttonLabel: 'Ambil Diskon', delay: 3 },
  }
  return m[type] ?? {}
}
function defaultStyle(): Record<string, any> {
  return { textAlign: 'left', fontSize: 'default', fontWeight: 'default', color: '', bgColor: '', paddingTop: 16, paddingBottom: 16, paddingLeft: 16, paddingRight: 16, opacity: 100, textDecoration: 'none', textTransform: 'none', borderRadius: 0 }
}
function defaultAdvance(): Record<string, any> {
  return { marginTop: 0, marginBottom: 0, animation: 'none', showDesktop: true, showTablet: true, showMobile: true, customClass: '', customId: '' }
}

// ─── Canvas renderer ──────────────────────────────────────────────────────────
function RenderComp({ comp }: { comp: BuilderComponent }) {
  const c = comp.content
  const s = comp.style

  // Accordion and Tab states scoped internally per component ID
  const [faqOpenIdx, setFaqOpenIdx] = useState<number | null>(0)
  const [activeTabIdx, setActiveTabIdx] = useState<number>(0)
  const [timerValues, setTimerValues] = useState({ days: '00', hours: '00', minutes: '00', seconds: '00' })
  const [slideIdx, setSlideIdx] = useState(0)

  // Countdown timer logic
  useEffect(() => {
    if (comp.type === 'countdown_timer' && c.targetDate) {
      const interval = setInterval(() => {
        const target = new Date(c.targetDate).getTime()
        const now = new Date().getTime()
        const diff = target - now

        if (diff <= 0) {
          clearInterval(interval)
          setTimerValues({ days: '00', hours: '00', minutes: '00', seconds: '00' })
        } else {
          const d = Math.floor(diff / (1000 * 60 * 60 * 24))
          const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
          const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
          const sec = Math.floor((diff % (1000 * 60)) / 1000)

          setTimerValues({
            days: d.toString().padStart(2, '0'),
            hours: h.toString().padStart(2, '0'),
            minutes: m.toString().padStart(2, '0'),
            seconds: sec.toString().padStart(2, '0')
          })
        }
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [comp.type, c.targetDate])

  // Slide rotation logic
  useEffect(() => {
    if (comp.type === 'image_slide' && c.images?.length > 1) {
      const interval = setInterval(() => {
        setSlideIdx(prev => (prev + 1) % c.images.length)
      }, 3500)
      return () => clearInterval(interval)
    }
  }, [comp.type, c.images])

  const p: React.CSSProperties = {
    textAlign: (s.textAlign as any) || 'left',
    color: s.color || undefined,
    backgroundColor: s.bgColor || undefined,
    opacity: s.opacity != null ? s.opacity / 100 : 1,
    paddingTop: s.paddingTop ?? 16,
    paddingBottom: s.paddingBottom ?? 16,
    paddingLeft: s.paddingLeft ?? 16,
    paddingRight: s.paddingRight ?? 16,
    borderRadius: s.borderRadius ? s.borderRadius + 'px' : undefined,
    textDecoration: s.textDecoration !== 'none' ? s.textDecoration : undefined,
    textTransform: (s.textTransform as any) !== 'none' ? (s.textTransform as any) : undefined,
  }
  switch (comp.type) {
    case 'headline': return (
      <div style={p}>
        <h1 style={{ margin: 0, fontSize: s.fontSize === 'sm' ? '1.5rem' : s.fontSize === 'lg' ? '3rem' : '2.25rem', fontWeight: s.fontWeight === 'normal' ? 400 : 700, color: s.color || '#111111', lineHeight: 1.2 }}>
          {c.text || 'Judul Utama'}
        </h1>
      </div>
    )
    case 'subheadline': return (
      <div style={p}>
        <h2 style={{ margin: 0, fontSize: s.fontSize === 'sm' ? '1rem' : s.fontSize === 'lg' ? '2rem' : '1.5rem', fontWeight: s.fontWeight === 'normal' ? 400 : 600, color: s.color || '#2DB24A', lineHeight: 1.3 }}>
          {c.text || 'Sub Judul'}
        </h2>
      </div>
    )
    case 'content': return (
      <div style={{ ...p, fontSize: 15, lineHeight: 1.75, color: s.color || '#4B5563', whiteSpace: 'pre-wrap' }}>
        {c.text || 'Teks konten Anda di sini.'}
      </div>
    )
    case 'button': return (
      <div style={p}>
        <button style={{ background: s.bgColor || '#2DB24A', color: s.color || '#fff', padding: '12px 32px', borderRadius: 9999, fontWeight: 600, fontSize: 15, border: 'none', cursor: 'pointer', display: 'inline-block' }}>
          {c.label || 'Klik Di Sini'}
        </button>
      </div>
    )
    case 'whatsapp_button': return (
      <div style={p}>
        <button style={{ background: '#25D366', color: '#fff', padding: '12px 28px', borderRadius: 9999, fontWeight: 600, fontSize: 15, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/></svg>
          {c.label || 'Hubungi via WhatsApp'}
        </button>
      </div>
    )
    case 'image': return (
      <div style={p}>
        {c.src ? <img src={c.src} alt={c.alt||''} style={{ width: c.width||'100%', borderRadius: s.borderRadius ? s.borderRadius+'px' : 8, display: 'block', margin: s.textAlign==='center'?'0 auto':undefined }} /> : (
          <div style={{ width: '100%', aspectRatio: '16/9', background: '#F3F4F6', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed #D1D5DB' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 13l4-4 4 4 4-4 3 3"/><circle cx="8.5" cy="8.5" r="1.5"/></svg>
            <span style={{ color: '#9CA3AF', fontSize: 12, marginTop: 8 }}>Gambar belum diunggah</span>
          </div>
        )}
        {c.caption && <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 12, marginTop: 6 }}>{c.caption}</p>}
      </div>
    )
    case 'image_slide': return (
      <div style={p}>
        {c.images && c.images.length > 0 ? (
          <div className="relative rounded-xl overflow-hidden shadow aspect-[16/9] bg-neutral-100">
            {c.images.map((img: any, i: number) => (
              <img
                key={i}
                src={img.src || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&fit=crop&q=80'}
                alt={img.alt || ''}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === slideIdx ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
              />
            ))}
            {c.images.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                {c.images.map((_: any, i: number) => (
                  <button 
                    key={i} 
                    onClick={() => setSlideIdx(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${i === slideIdx ? 'bg-white scale-110' : 'bg-white/40 hover:bg-white/60'}`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ width: '100%', aspectRatio: '16/9', background: '#F3F4F6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #D1D5DB' }}>
            <span style={{ color: '#9CA3AF', fontSize: 12 }}>Slide gambar belum diunggah</span>
          </div>
        )}
      </div>
    )
    case 'video': return (
      <div style={p}>
        {c.src ? (
          (c.isLocal || (c.src.startsWith('/') || !c.src.includes('youtube.com') && !c.src.includes('youtu.be') && !c.src.includes('vimeo.com'))) ? (
            <video
              src={c.src}
              controls
              style={{ width: '100%', borderRadius: s.borderRadius ? s.borderRadius+'px' : 8, display: 'block', maxHeight: 420 }}
            />
          ) : (
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: s.borderRadius ? s.borderRadius+'px' : 8 }}>
              <iframe src={c.src} style={{ position:'absolute',top:0,left:0,width:'100%',height:'100%',border:'none' }} allowFullScreen />
            </div>
          )
        ) : (
          <div style={{ width: '100%', aspectRatio: '16/9', background: '#111827', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="#ffffff50"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            <span style={{ color: '#ffffff50', fontSize: 12 }}>Video belum diunggah</span>
          </div>
        )}
      </div>
    )
    case 'product_showcase': {
      const items: any[] = c._resolvedProducts || []
      return (
        <div style={p}>
          {c.title && <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: s.color || '#111111' }}>{c.title}</h3>}
          {items.length === 0 ? (
            <div style={{ border: '2px dashed #E5E7EB', borderRadius: 12, padding: 32, textAlign: 'center', color: '#9CA3AF' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🛍️</div>
              <p style={{ fontSize: 13 }}>Pilih produk dari katalog Anda di panel kanan</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${c.columns || 2}, 1fr)`, gap: 12 }}>
              {items.map((prod: any) => (
                <a
                  key={prod.id}
                  href={`/market/product/${prod.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div style={{ border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden', background: '#fff', cursor: 'pointer', transition: 'box-shadow 0.2s' }}>
                    <div style={{ aspectRatio: '1/1', background: '#F3F4F6', overflow: 'hidden', position: 'relative' }}>
                      {prod.imageUrl ? (
                        <img src={prod.imageUrl} alt={prod.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>📦</div>
                      )}
                    </div>
                    <div style={{ padding: '10px 12px' }}>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: '#111111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prod.title}</p>
                      {c.showPrice && <p style={{ margin: '4px 0 0', fontWeight: 700, fontSize: 14, color: '#2DB24A' }}>Rp {prod.price?.toLocaleString('id-ID')}</p>}
                      {c.showStock && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9CA3AF' }}>Stok: {prod.stock}</p>}
                      {c.showBuyBtn && (
                        <button style={{ marginTop: 8, width: '100%', padding: '8px', background: '#2DB24A', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                          {c.buyBtnLabel || 'Beli Sekarang'}
                        </button>
                      )}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )
    }
    case 'line': return (
      <div style={{ paddingTop: s.paddingTop ?? 16, paddingBottom: s.paddingBottom ?? 16, paddingLeft: s.paddingLeft ?? 16, paddingRight: s.paddingRight ?? 16 }}>
        <hr style={{ border: 'none', borderTop: `${c.thickness || 1}px solid ${c.color || '#E5E7EB'}` }} />
      </div>
    )
    case 'space': return <div style={{ height: c.height || 32 }} />
    case 'feature_list': return (
      <div style={p}>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(c.items || []).map((item: string, i: number) => (
            <li key={i} className="flex gap-3 text-base" style={{ color: s.color || '#374151', alignItems: 'flex-start' }}>
              <span className="w-5 h-5 rounded-full bg-[#2DB24A]/10 text-[#2DB24A] flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    )
    case 'faq': return (
      <div style={p}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(c.items || []).map((item: any, i: number) => {
            const isOpen = faqOpenIdx === i
            return (
              <div key={i} className="border border-neutral-200/80 rounded-xl bg-white overflow-hidden transition-all duration-200">
                <button 
                  onClick={() => setFaqOpenIdx(isOpen ? null : i)}
                  className="w-full px-5 py-4 text-left font-bold text-[14px] text-gray-800 flex justify-between items-center hover:bg-neutral-50 transition-colors"
                >
                  <span>{item.question}</span>
                  <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <div className={`transition-all duration-300 ${isOpen ? 'max-h-[300px] border-t border-neutral-100' : 'max-h-0 pointer-events-none'}`}>
                  <p className="p-5 text-sm text-gray-600 leading-relaxed bg-[#FAFAFA]">{item.answer}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
    case 'testimonials': return (
      <div style={p}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {(c.items || []).map((item: any, i: number) => (
            <div key={i} style={{ background: '#F9FAFB', borderRadius: 14, padding: 18, border: '1px solid #E5E7EB' }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                {[1,2,3,4,5].map(n => <svg key={n} width="14" height="14" viewBox="0 0 24 24" fill="#FFC107"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>)}
              </div>
              <p style={{ fontSize: 14, color: '#374151', fontStyle: 'italic', lineHeight: 1.7, margin: '0 0 14px' }}>"{item.text}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#2DB24A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14 }}>{item.name?.[0] || 'A'}</div>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: '#111111' }}>{item.name}</p>
                  {item.role && <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF' }}>{item.role}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
    case 'rating': return (
      <div style={{ ...p, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ fontSize: 36, fontWeight: 700, color: '#111111' }}>{c.score || '4.8'}</div>
        <div>
          <div style={{ display: 'flex', gap: 3 }}>
            {[1,2,3,4,5].map(n => <svg key={n} width="18" height="18" viewBox="0 0 24 24" fill={n <= Math.round(c.score || 5) ? '#FFC107' : '#E5E7EB'}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>)}
          </div>
          <span style={{ color: '#9CA3AF', fontSize: 13 }}>{c.label || 'Rating'} • {c.total || 128} ulasan</span>
        </div>
      </div>
    )
    case 'banner_announcement': return (
      <div style={{ background: c.bgColor || '#2DB24A', color: c.textColor || '#fff', padding: '12px 20px', textAlign: 'center', fontSize: 14, fontWeight: 500 }}>
        {c.text || '🔥 Promo Spesial Hari Ini!'}
      </div>
    )
    case 'countdown_timer': return (
      <div style={{ ...p, textAlign: 'center' }} className="bg-neutral-50/50 rounded-2xl border border-neutral-100 py-6">
        <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 14, fontWeight: 500 }}>{c.label || 'Penawaran berakhir:'}</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
          {[
            { v: timerValues.days, l: 'HARI' },
            { v: timerValues.hours, l: 'JAM' },
            { v: timerValues.minutes, l: 'MENIT' },
            { v: timerValues.seconds, l: 'DETIK' }
          ].map((item, i) => (
            <div key={i} className="text-center">
              <div className="bg-[#111111] text-[#2DB24A] rounded-xl px-4 py-3 text-2xl font-black min-w-[56px] shadow">{item.v}</div>
              <div className="text-[10px] text-neutral-400 font-bold mt-2 letter-spacing-wide">{item.l}</div>
            </div>
          ))}
        </div>
      </div>
    )
    case 'pricing': return (
      <div style={{ ...p, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {(c.plans || []).map((plan: any, i: number) => (
          <div key={i} style={{ flex: '1 1 180px', border: `2px solid ${plan.highlighted ? '#2DB24A' : '#E5E7EB'}`, borderRadius: 14, padding: 20, background: plan.highlighted ? '#F0FFF4' : '#fff' }}>
            <p style={{ fontWeight: 700, fontSize: 16, margin: '0 0 4px', color: '#111111' }}>{plan.name}</p>
            <p style={{ margin: '0 0 16px' }}><span style={{ fontSize: 26, fontWeight: 700, color: '#2DB24A' }}>Rp {plan.price}</span><span style={{ color: '#9CA3AF', fontSize: 13 }}>{plan.period}</span></p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px' }}>
              {(plan.features || []).map((f: string, j: number) => <li key={j} style={{ fontSize: 13, color: '#374151', padding: '3px 0', display: 'flex', gap: 6 }}><span style={{ color: '#2DB24A' }}>✓</span>{f}</li>)}
            </ul>
            <button style={{ width: '100%', padding: '10px', background: plan.highlighted ? '#2DB24A' : '#F3F4F6', color: plan.highlighted ? '#fff' : '#374151', borderRadius: 9, fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer' }}>{plan.cta || 'Pilih Paket'}</button>
          </div>
        ))}
      </div>
    )
    case 'visitor_counter': return (
      <div style={{ ...p, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#374151', fontSize: 14 }}>
        <Users className="w-5 h-5 text-[#2DB24A]" />
        <span className="text-gray-600">Ada <strong className="text-[#2DB24A] font-extrabold">{c.count || 1247}</strong> {c.label || 'orang telah melihat halaman ini'}</span>
      </div>
    )
    case 'sold_counter': return (
      <div style={{ ...p, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#374151', fontSize: 14 }}>
        <span className="text-lg">🛒</span>
        <span className="text-gray-600">Sudah <strong className="text-[#2DB24A] font-extrabold">{c.count || 342}</strong> {c.label || 'terjual hari ini'}</span>
      </div>
    )
    case 'sales_notification': return (
      <div style={{ ...p, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', maxWidth: 320 }} className="mx-auto my-2 animate-pulse">
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🛍️</div>
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111111' }}>{c.buyerName || 'Andi'} baru saja membeli</p>
          <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF' }}>{c.product || 'produk ini'} · {c.timeAgo || '2 menit lalu'}</p>
        </div>
      </div>
    )
    case 'navigation': return (
      <div style={{ ...p, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: s.bgColor || '#fff', borderBottom: '1px solid #E5E7EB' }}>
        <span style={{ fontWeight: 700, fontSize: 18, color: '#2DB24A' }}>{c.logoText || 'Brand'}</span>
        <div style={{ display: 'flex', gap: 24 }}>
          {(c.links || []).map((l: any, i: number) => <a key={i} href="#" style={{ color: s.color || '#374151', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>{l.label}</a>)}
        </div>
      </div>
    )
    case 'tabs': return (
      <div style={p} className="bg-white rounded-2xl border border-neutral-100 p-6">
        <div style={{ display: 'flex', borderBottom: '2px solid #E5E7EB', marginBottom: 16 }} className="gap-2">
          {(c.tabs || []).map((tab: any, i: number) => {
            const isTabActive = activeTabIdx === i
            return (
              <button 
                key={i} 
                onClick={() => setActiveTabIdx(i)}
                style={{ padding: '10px 20px', fontSize: 14, fontWeight: 700, color: isTabActive ? '#2DB24A' : '#9CA3AF', borderBottom: isTabActive ? '3px solid #2DB24A' : '3px solid transparent', marginBottom: -2, background: 'none', border: 'none', cursor: 'pointer' }}
                className="transition-colors hover:text-gray-800"
              >
                {tab.label}
              </button>
            )
          })}
        </div>
        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{c.tabs?.[activeTabIdx]?.content}</p>
      </div>
    )
    case 'formulir': return (
      <div style={p}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {(c.fields || []).map((f: any, i: number) => (
            <div key={i}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{f.label}{f.required && <span style={{ color: '#EF4444' }}> *</span>}</label>
              <input disabled placeholder={f.placeholder} style={{ width: '100%', padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', background: '#F9FAFB' }} />
            </div>
          ))}
          <button style={{ padding: '14px', background: '#2DB24A', color: '#fff', borderRadius: 9999, fontWeight: 600, fontSize: 15, border: 'none', cursor: 'pointer', marginTop: 4 }}>{c.submitLabel || 'Kirim Sekarang'}</button>
        </div>
      </div>
    )
    case 'html': return (
      <div style={{ ...p, background: '#F9FAFB', borderRadius: 8, border: '1px solid #E5E7EB' }}>
        <code style={{ fontSize: 12, color: '#374151', fontFamily: 'monospace', whiteSpace: 'pre-wrap', display: 'block' }}>{c.code || '<!-- HTML -->'}</code>
      </div>
    )
    case 'floating_whatsapp': return (
      <div style={p}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#25D366', color: '#fff', borderRadius: 9999, padding: '10px 20px', fontSize: 13, fontWeight: 600 }}>
          {getIcon('floating_whatsapp')} Chat WhatsApp ({c.phone || '...'})
        </div>
      </div>
    )
    case 'popup': return (
      <div style={{ ...p, border: '2px dashed #E5E7EB', borderRadius: 12, textAlign: 'center' }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>🎁</div>
        <h3 style={{ margin: '0 0 8px', fontWeight: 700, color: '#111111' }}>{c.title}</h3>
        <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 12px' }}>{c.content}</p>
        <button style={{ background: '#2DB24A', color: '#fff', border: 'none', borderRadius: 9999, padding: '10px 24px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>{c.buttonLabel}</button>
        <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8 }}>Muncul setelah {c.delay || 3} detik</p>
      </div>
    )
    default: return (
      <div style={{ ...p, background: '#F9FAFB', borderRadius: 8, padding: '14px 16px', border: '1px dashed #D1D5DB', display: 'flex', alignItems: 'center', gap: 10 }}>
        {getIcon(comp.type)}
        <span style={{ fontSize: 13, color: '#6B7280', textTransform: 'capitalize' }}>{comp.type.replace(/_/g, ' ')}</span>
      </div>
    )
  }
}

// ─── Upload helper ────────────────────────────────────────────────────────────
async function uploadFile(file: File): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch('/api/upload', { method: 'POST', body: fd })
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data.url
}

// ─── Upload Zone ──────────────────────────────────────────────────────────────
function UploadZone({
  accept, onUploaded, preview, onClear, label, hint
}: {
  accept: string
  onUploaded: (url: string) => void
  preview?: string
  onClear?: () => void
  label?: string
  hint?: string
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setError('')
    setUploading(true)
    try {
      const url = await uploadFile(file)
      onUploaded(url)
    } catch (e: any) {
      setError(e.message || 'Gagal upload')
    } finally {
      setUploading(false)
    }
  }

  const isVideo = accept.includes('video')

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
      />
      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-[#e4e6ea] group">
          {isVideo ? (
            <video src={preview} controls className="w-full rounded-xl" style={{ maxHeight: 120 }} />
          ) : (
            <img src={preview} alt="preview" className="w-full object-cover rounded-xl" style={{ maxHeight: 100 }} />
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-2.5 py-1.5 bg-white text-[11px] font-bold text-gray-800 rounded-lg hover:bg-gray-100"
            >Ganti</button>
            {onClear && <button
              type="button"
              onClick={onClear}
              className="px-2.5 py-1.5 bg-red-500 text-[11px] font-bold text-white rounded-lg hover:bg-red-600"
            >Hapus</button>}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full border-2 border-dashed border-[#2DB24A]/30 hover:border-[#2DB24A]/60 hover:bg-[#2DB24A]/5 rounded-xl py-5 flex flex-col items-center gap-2 transition-all disabled:opacity-50"
        >
          {uploading ? (
            <>
              <svg className="animate-spin w-5 h-5 text-[#2DB24A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12a8 8 0 018-8"/></svg>
              <span className="text-[11px] text-[#2DB24A] font-semibold">Mengupload...</span>
            </>
          ) : (
            <>
              {isVideo ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2DB24A" strokeWidth="1.5"><rect x="2" y="5" width="11" height="10" rx="1"/><path strokeLinecap="round" strokeLinejoin="round" d="M13 8l5-3v10l-5-3V8z"/></svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2DB24A" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 13l4-4 4 4 4-4 3 3"/><circle cx="8.5" cy="8.5" r="1.5"/></svg>
              )}
              <span className="text-[12px] font-semibold text-gray-600">{label || (isVideo ? 'Upload Video' : 'Upload Gambar')}</span>
              <span className="text-[10px] text-gray-400">{hint || (isVideo ? 'MP4, WebM (maks. 50MB)' : 'JPG, PNG, WebP (maks. 5MB)')}</span>
            </>
          )}
        </button>
      )}
      {error && <p className="text-[11px] text-red-500 mt-1.5">{error}</p>}
    </div>
  )
}

// ─── Settings Panel (Right Sidebar) ──────────────────────────────────────────
function SettingsPanel({ comp, onChange, onDelete, onDuplicate, merchantProducts }: {
  comp: BuilderComponent
  onChange: (c: BuilderComponent) => void
  onDelete: () => void
  onDuplicate: () => void
  merchantProducts: any[]
}) {
  const [tab, setTab] = useState<'content' | 'style' | 'advance'>('content')

  useEffect(() => { setTab('content') }, [comp.id])

  const upC = (k: string, v: any) => onChange({ ...comp, content: { ...comp.content, [k]: v } })
  const upS = (k: string, v: any) => onChange({ ...comp, style: { ...comp.style, [k]: v } })
  const upA = (k: string, v: any) => onChange({ ...comp, advance: { ...comp.advance, [k]: v } })

  const inp = 'w-full border border-[#e4e6ea] rounded-lg px-3 py-2 text-[13px] bg-white focus:outline-none focus:border-[#2DB24A] focus:ring-1 focus:ring-[#2DB24A]/20 text-gray-800 transition-colors'
  const lbl = 'block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5'
  const section = 'space-y-4'

  const renderContent = () => {
    const c = comp.content
    switch (comp.type) {
      case 'headline':
      case 'subheadline':
        return (
          <div className={section}>
            <div>
              <label className={lbl}>Teks</label>
              <textarea className={inp} rows={4} value={c.text||''} onChange={e=>upC('text',e.target.value)}/>
            </div>
          </div>
        )
      case 'content':
        return (
          <div className={section}>
            <div>
              <label className={lbl}>Isi Konten</label>
              <textarea className={inp} rows={8} value={c.text||''} onChange={e=>upC('text',e.target.value)} placeholder="Ketik konten di sini..."/>
            </div>
          </div>
        )
      case 'button':
        return (
          <div className={section}>
            <div><label className={lbl}>Label Tombol</label><input type="text" className={inp} value={c.label||''} onChange={e=>upC('label',e.target.value)}/></div>
            <div><label className={lbl}>URL Tujuan</label><input type="text" className={inp} value={c.url||'#'} onChange={e=>upC('url',e.target.value)} placeholder="https://..."/></div>
            <div>
              <label className={lbl}>Buka Di</label>
              <select className={inp} value={c.target||'_self'} onChange={e=>upC('target',e.target.value)}>
                <option value="_self">Tab yang sama</option>
                <option value="_blank">Tab baru</option>
              </select>
            </div>
            <div><label className={lbl}>Warna Background</label>
              <div className="flex gap-2"><input type="color" className="h-9 w-10 rounded-lg border border-[#e4e6ea] cursor-pointer flex-shrink-0" value={comp.style.bgColor||'#2DB24A'} onChange={e=>upS('bgColor',e.target.value)}/><input type="text" className={inp} value={comp.style.bgColor||''} onChange={e=>upS('bgColor',e.target.value)} placeholder="#2DB24A"/></div>
            </div>
            <div><label className={lbl}>Warna Teks</label>
              <div className="flex gap-2"><input type="color" className="h-9 w-10 rounded-lg border border-[#e4e6ea] cursor-pointer flex-shrink-0" value={comp.style.color||'#ffffff'} onChange={e=>upS('color',e.target.value)}/><input type="text" className={inp} value={comp.style.color||''} onChange={e=>upS('color',e.target.value)} placeholder="#ffffff"/></div>
            </div>
          </div>
        )
      case 'whatsapp_button':
        return (
          <div className={section}>
            <div><label className={lbl}>Label Tombol</label><input type="text" className={inp} value={c.label||''} onChange={e=>upC('label',e.target.value)}/></div>
            <div><label className={lbl}>Nomor WhatsApp (62...)</label><input type="text" className={inp} value={c.phone||''} onChange={e=>upC('phone',e.target.value)} placeholder="6281234567890"/></div>
            <div><label className={lbl}>Pesan Otomatis</label><textarea className={inp} rows={3} value={c.message||''} onChange={e=>upC('message',e.target.value)}/></div>
          </div>
        )
      case 'image':
        return (
          <div className={section}>
            <div>
              <label className={lbl}>Upload Gambar</label>
              <UploadZone
                accept="image/jpeg,image/jpg,image/png,image/webp"
                preview={c.src}
                onUploaded={url => { upC('src', url) }}
                onClear={() => upC('src', '')}
              />
            </div>
            <div><label className={lbl}>Alt Text</label><input type="text" className={inp} value={c.alt||''} onChange={e=>upC('alt',e.target.value)}/></div>
            <div><label className={lbl}>Keterangan (Caption)</label><input type="text" className={inp} value={c.caption||''} onChange={e=>upC('caption',e.target.value)}/></div>
            <div><label className={lbl}>Lebar Gambar</label>
              <select className={inp} value={c.width||'100%'} onChange={e=>upC('width',e.target.value)}>
                <option value="100%">100% (Full)</option>
                <option value="75%">75%</option>
                <option value="50%">50%</option>
                <option value="25%">25%</option>
              </select>
            </div>
          </div>
        )
      case 'image_slide':
        return (
          <div className={section}>
            <label className={lbl}>Slide Gambar</label>
            {(c.images||[]).map((img: any, i: number) => (
              <div key={i} className="p-3 bg-gray-50 rounded-xl space-y-2 border border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-gray-500">Slide {i+1}</span>
                  <button onClick={()=>upC('images',(c.images||[]).filter((_:any,j:number)=>j!==i))} className="text-xs text-red-400 hover:text-red-500">Hapus</button>
                </div>
                <UploadZone
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  preview={img.src}
                  onUploaded={url => { const a=[...(c.images||[])]; a[i]={...a[i],src:url}; upC('images',a) }}
                  onClear={() => { const a=[...(c.images||[])]; a[i]={...a[i],src:''}; upC('images',a) }}
                  label={`Upload Gambar Slide ${i+1}`}
                />
                <input type="text" className={inp} value={img.alt||''} placeholder="Alt text..." onChange={e=>{const a=[...(c.images||[])];a[i]={...a[i],alt:e.target.value};upC('images',a)}}/>
              </div>
            ))}
            <button onClick={()=>upC('images',[...(c.images||[]),{src:'',alt:'Slide baru'}])} className="w-full py-2 border border-dashed border-[#2DB24A]/40 text-[#2DB24A] text-[13px] rounded-lg hover:bg-[#2DB24A]/5 transition-colors">+ Tambah Slide</button>
          </div>
        )
      case 'video':
        return (
          <div className={section}>
            <div>
              <label className={lbl}>Upload Video dari File</label>
              <UploadZone
                accept="video/mp4,video/webm,video/ogg,video/mov,video/quicktime"
                preview={c.src}
                onUploaded={url => { onChange({ ...comp, content: { ...comp.content, src: url, isLocal: true } }) }}
                onClear={() => onChange({ ...comp, content: { ...comp.content, src: '', isLocal: false } })}
              />
              <p className="text-[11px] text-gray-400 mt-2 font-medium bg-gray-50 border border-gray-100 rounded-lg p-2.5">
                💡 Format video yang didukung: MP4, WebM, OGG, MOV (Maks. 50MB)
              </p>
            </div>
          </div>
        )
      case 'line':
        return (
          <div className={section}>
            <div><label className={lbl}>Ketebalan (px)</label><input type="number" className={inp} value={c.thickness||1} min={1} max={20} onChange={e=>upC('thickness',+e.target.value)}/></div>
            <div><label className={lbl}>Warna</label><div className="flex gap-2"><input type="color" className="h-9 w-10 rounded-lg border border-[#e4e6ea] cursor-pointer" value={c.color||'#E5E7EB'} onChange={e=>upC('color',e.target.value)}/><input type="text" className={inp} value={c.color||''} onChange={e=>upC('color',e.target.value)}/></div></div>
          </div>
        )
      case 'space':
        return (
          <div className={section}>
            <div><label className={lbl}>Tinggi (px)</label><input type="range" min={4} max={300} value={c.height||32} onChange={e=>upC('height',+e.target.value)} className="w-full accent-[#2DB24A]"/><p className="text-[12px] text-gray-500 mt-1">{c.height||32}px</p></div>
          </div>
        )
      case 'banner_announcement':
        return (
          <div className={section}>
            <div><label className={lbl}>Teks Banner</label><textarea className={inp} rows={2} value={c.text||''} onChange={e=>upC('text',e.target.value)}/></div>
            <div><label className={lbl}>Link (opsional)</label><input type="text" className={inp} value={c.link||''} onChange={e=>upC('link',e.target.value)} placeholder="https://..."/></div>
            <div><label className={lbl}>Warna Background</label><div className="flex gap-2"><input type="color" className="h-9 w-10 rounded-lg border border-[#e4e6ea] cursor-pointer" value={c.bgColor||'#2DB24A'} onChange={e=>upC('bgColor',e.target.value)}/><input type="text" className={inp} value={c.bgColor||''} onChange={e=>upC('bgColor',e.target.value)}/></div></div>
            <div><label className={lbl}>Warna Teks</label><div className="flex gap-2"><input type="color" className="h-9 w-10 rounded-lg border border-[#e4e6ea] cursor-pointer" value={c.textColor||'#FFFFFF'} onChange={e=>upC('textColor',e.target.value)}/><input type="text" className={inp} value={c.textColor||''} onChange={e=>upC('textColor',e.target.value)}/></div></div>
          </div>
        )
      case 'feature_list':
        return (
          <div className={section}>
            <label className={lbl}>Item Fitur</label>
            {(c.items||[]).map((item: string, i: number) => (
              <div key={i} className="flex gap-2 items-center">
                <input type="text" className={inp} value={item} onChange={e=>{const a=[...(c.items||[])];a[i]=e.target.value;upC('items',a)}}/>
                <button onClick={()=>upC('items',(c.items||[]).filter((_:any,j:number)=>j!==i))} className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors text-lg">×</button>
              </div>
            ))}
            <button onClick={()=>upC('items',[...(c.items||[]),'Fitur baru'])} className="w-full py-2 border border-dashed border-[#2DB24A]/40 text-[#2DB24A] text-[13px] rounded-lg hover:bg-[#2DB24A]/5 transition-colors">+ Tambah Item</button>
          </div>
        )
      case 'faq':
        return (
          <div className={section}>
            <label className={lbl}>FAQ</label>
            {(c.items||[]).map((item: any, i: number) => (
              <div key={i} className="space-y-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center justify-between"><span className="text-[11px] font-semibold text-gray-500">FAQ {i+1}</span><button onClick={()=>upC('items',(c.items||[]).filter((_:any,j:number)=>j!==i))} className="text-xs text-red-400 hover:text-red-500">Hapus</button></div>
                <input type="text" className={inp} value={item.question} placeholder="Pertanyaan?" onChange={e=>{const a=[...(c.items||[])];a[i]={...a[i],question:e.target.value};upC('items',a)}}/>
                <textarea className={inp} rows={2} value={item.answer} placeholder="Jawaban..." onChange={e=>{const a=[...(c.items||[])];a[i]={...a[i],answer:e.target.value};upC('items',a)}}/>
              </div>
            ))}
            <button onClick={()=>upC('items',[...(c.items||[]),{question:'Pertanyaan baru?',answer:'Jawaban.'}])} className="w-full py-2 border border-dashed border-[#2DB24A]/40 text-[#2DB24A] text-[13px] rounded-lg hover:bg-[#2DB24A]/5 transition-colors">+ Tambah FAQ</button>
          </div>
        )
      case 'testimonials':
        return (
          <div className={section}>
            <label className={lbl}>Testimoni</label>
            {(c.items||[]).map((item: any, i: number) => (
              <div key={i} className="space-y-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center justify-between"><span className="text-[11px] font-semibold text-gray-500">Testimoni {i+1}</span><button onClick={()=>upC('items',(c.items||[]).filter((_:any,j:number)=>j!==i))} className="text-xs text-red-400 hover:text-red-500">Hapus</button></div>
                <input type="text" className={inp} value={item.name} placeholder="Nama" onChange={e=>{const a=[...(c.items||[])];a[i]={...a[i],name:e.target.value};upC('items',a)}}/>
                <input type="text" className={inp} value={item.role||''} placeholder="Jabatan / Peran" onChange={e=>{const a=[...(c.items||[])];a[i]={...a[i],role:e.target.value};upC('items',a)}}/>
                <textarea className={inp} rows={3} value={item.text} placeholder="Isi testimoni..." onChange={e=>{const a=[...(c.items||[])];a[i]={...a[i],text:e.target.value};upC('items',a)}}/>
              </div>
            ))}
            <button onClick={()=>upC('items',[...(c.items||[]),{name:'Nama Pelanggan',role:'',text:'Testimoni produk ini sangat bagus!'}])} className="w-full py-2 border border-dashed border-[#2DB24A]/40 text-[#2DB24A] text-[13px] rounded-lg hover:bg-[#2DB24A]/5 transition-colors">+ Tambah Testimoni</button>
          </div>
        )
      case 'rating':
        return (
          <div className={section}>
            <div><label className={lbl}>Skor (0–5)</label><input type="range" min={0} max={5} step={0.1} value={c.score||4.8} onChange={e=>upC('score',+e.target.value)} className="w-full accent-[#2DB24A]"/><p className="text-[12px] text-gray-500 mt-1">{c.score||4.8} bintang</p></div>
            <div><label className={lbl}>Total Ulasan</label><input type="number" className={inp} value={c.total||128} min={0} onChange={e=>upC('total',+e.target.value)}/></div>
            <div><label className={lbl}>Label</label><input type="text" className={inp} value={c.label||''} onChange={e=>upC('label',e.target.value)}/></div>
          </div>
        )
      case 'visitor_counter':
        return (
          <div className={section}>
            <div><label className={lbl}>Jumlah Visitor</label><input type="number" className={inp} value={c.count||1247} min={0} onChange={e=>upC('count',+e.target.value)}/></div>
            <div><label className={lbl}>Label Teks</label><input type="text" className={inp} value={c.label||''} onChange={e=>upC('label',e.target.value)}/></div>
          </div>
        )
      case 'sold_counter':
        return (
          <div className={section}>
            <div><label className={lbl}>Jumlah Terjual</label><input type="number" className={inp} value={c.count||342} min={0} onChange={e=>upC('count',+e.target.value)}/></div>
            <div><label className={lbl}>Label Teks</label><input type="text" className={inp} value={c.label||''} onChange={e=>upC('label',e.target.value)}/></div>
          </div>
        )
      case 'sales_notification':
        return (
          <div className={section}>
            <div><label className={lbl}>Nama Pembeli</label><input type="text" className={inp} value={c.buyerName||''} onChange={e=>upC('buyerName',e.target.value)}/></div>
            <div><label className={lbl}>Nama Produk</label><input type="text" className={inp} value={c.product||''} onChange={e=>upC('product',e.target.value)}/></div>
            <div><label className={lbl}>Waktu (e.g. "2 menit lalu")</label><input type="text" className={inp} value={c.timeAgo||''} onChange={e=>upC('timeAgo',e.target.value)}/></div>
          </div>
        )
      case 'countdown_timer':
        return (
          <div className={section}>
            <div><label className={lbl}>Label</label><input type="text" className={inp} value={c.label||''} onChange={e=>upC('label',e.target.value)}/></div>
            <div><label className={lbl}>Target Tanggal</label><input type="datetime-local" className={inp} value={c.targetDate?.slice(0,16)||''} onChange={e=>upC('targetDate',new Date(e.target.value).toISOString())}/></div>
          </div>
        )
      case 'pricing': {
        const plans = c.plans||[]
        return (
          <div className={section}>
            <label className={lbl}>Paket Harga</label>
            {plans.map((plan: any, i: number) => (
              <div key={i} className="p-3 bg-gray-50 rounded-xl space-y-2 border border-gray-100">
                <div className="flex items-center justify-between"><span className="text-[11px] font-semibold text-gray-500">Paket {i+1}</span><button onClick={()=>upC('plans',plans.filter((_:any,j:number)=>j!==i))} className="text-xs text-red-400">Hapus</button></div>
                <input type="text" className={inp} value={plan.name} placeholder="Nama Paket" onChange={e=>{const a=[...plans];a[i]={...a[i],name:e.target.value};upC('plans',a)}}/>
                <div className="flex gap-2"><input type="text" className={inp} value={plan.price} placeholder="99.000" onChange={e=>{const a=[...plans];a[i]={...a[i],price:e.target.value};upC('plans',a)}}/><input type="text" className={inp} value={plan.period||'/bulan'} placeholder="/bulan" onChange={e=>{const a=[...plans];a[i]={...a[i],period:e.target.value};upC('plans',a)}}/></div>
                <input type="text" className={inp} value={plan.cta} placeholder="Teks tombol" onChange={e=>{const a=[...plans];a[i]={...a[i],cta:e.target.value};upC('plans',a)}}/>
                <label className="flex items-center gap-2 text-[12px] text-gray-600 cursor-pointer"><input type="checkbox" checked={plan.highlighted||false} onChange={e=>{const a=[...plans];a[i]={...a[i],highlighted:e.target.checked};upC('plans',a)}} className="accent-[#2DB24A] rounded"/>Highlight (featured)</label>
              </div>
            ))}
            <button onClick={()=>upC('plans',[...plans,{name:'Paket Baru',price:'0',period:'/bulan',features:['Fitur A'],cta:'Pilih',highlighted:false}])} className="w-full py-2 border border-dashed border-[#2DB24A]/40 text-[#2DB24A] text-[13px] rounded-lg hover:bg-[#2DB24A]/5 transition-colors">+ Tambah Paket</button>
          </div>
        )
      }
      case 'navigation':
        return (
          <div className={section}>
            <div><label className={lbl}>Teks Logo/Brand</label><input type="text" className={inp} value={c.logoText||''} onChange={e=>upC('logoText',e.target.value)}/></div>
            <label className={lbl}>Menu Links</label>
            {(c.links||[]).map((l: any, i: number) => (
              <div key={i} className="flex gap-2">
                <input type="text" className={inp} value={l.label} placeholder="Label" onChange={e=>{const a=[...(c.links||[])];a[i]={...a[i],label:e.target.value};upC('links',a)}}/>
                <input type="text" className={inp} value={l.url} placeholder="#section" onChange={e=>{const a=[...(c.links||[])];a[i]={...a[i],url:e.target.value};upC('links',a)}}/>
                <button onClick={()=>upC('links',(c.links||[]).filter((_:any,j:number)=>j!==i))} className="flex-shrink-0 text-gray-300 hover:text-red-400 text-lg">×</button>
              </div>
            ))}
            <button onClick={()=>upC('links',[...(c.links||[]),{label:'Menu Baru',url:'#'}])} className="w-full py-2 border border-dashed border-[#2DB24A]/40 text-[#2DB24A] text-[13px] rounded-lg hover:bg-[#2DB24A]/5 transition-colors">+ Tambah Menu</button>
          </div>
        )
      case 'tabs': {
        const tabs = c.tabs||[]
        return (
          <div className={section}>
            <label className={lbl}>Tab</label>
            {tabs.map((t: any, i: number) => (
              <div key={i} className="p-3 bg-gray-50 rounded-xl space-y-2 border border-gray-100">
                <div className="flex items-center justify-between"><span className="text-[11px] font-semibold text-gray-500">Tab {i+1}</span><button onClick={()=>upC('tabs',tabs.filter((_:any,j:number)=>j!==i))} className="text-xs text-red-400">Hapus</button></div>
                <input type="text" className={inp} value={t.label} placeholder="Judul Tab" onChange={e=>{const a=[...tabs];a[i]={...a[i],label:e.target.value};upC('tabs',a)}}/>
                <textarea className={inp} rows={3} value={t.content} placeholder="Konten tab..." onChange={e=>{const a=[...tabs];a[i]={...a[i],content:e.target.value};upC('tabs',a)}}/>
              </div>
            ))}
            <button onClick={()=>upC('tabs',[...tabs,{label:'Tab Baru',content:'Konten tab baru.'}])} className="w-full py-2 border border-dashed border-[#2DB24A]/40 text-[#2DB24A] text-[13px] rounded-lg hover:bg-[#2DB24A]/5 transition-colors">+ Tambah Tab</button>
          </div>
        )
      }
      case 'formulir':
        return (
          <div className={section}>
            <label className={lbl}>Field Form</label>
            {(c.fields||[]).map((f: any, i: number) => (
              <div key={i} className="p-3 bg-gray-50 rounded-xl space-y-2 border border-gray-100">
                <div className="flex items-center justify-between"><span className="text-[11px] font-semibold text-gray-500">Field {i+1}</span><button onClick={()=>upC('fields',(c.fields||[]).filter((_:any,j:number)=>j!==i))} className="text-xs text-red-400">Hapus</button></div>
                <select className={inp} value={f.type||'text'} onChange={e=>{const a=[...(c.fields||[])];a[i]={...a[i],type:e.target.value};upC('fields',a)}}><option value="text">Teks</option><option value="email">Email</option><option value="tel">Telepon</option><option value="textarea">Textarea</option><option value="select">Dropdown</option></select>
                <input type="text" className={inp} value={f.label} placeholder="Label" onChange={e=>{const a=[...(c.fields||[])];a[i]={...a[i],label:e.target.value};upC('fields',a)}}/>
                <input type="text" className={inp} value={f.placeholder||''} placeholder="Placeholder..." onChange={e=>{const a=[...(c.fields||[])];a[i]={...a[i],placeholder:e.target.value};upC('fields',a)}}/>
                <label className="flex items-center gap-2 text-[12px] text-gray-600 cursor-pointer"><input type="checkbox" checked={f.required||false} onChange={e=>{const a=[...(c.fields||[])];a[i]={...a[i],required:e.target.checked};upC('fields',a)}} className="accent-[#2DB24A] rounded"/>Wajib diisi</label>
              </div>
            ))}
            <button onClick={()=>upC('fields',[...(c.fields||[]),{type:'text',label:'Field Baru',placeholder:'',required:false}])} className="w-full py-2 border border-dashed border-[#2DB24A]/40 text-[#2DB24A] text-[13px] rounded-lg hover:bg-[#2DB24A]/5 transition-colors">+ Tambah Field</button>
            <div><label className={lbl}>Teks Tombol Submit</label><input type="text" className={inp} value={c.submitLabel||''} onChange={e=>upC('submitLabel',e.target.value)}/></div>
            <div><label className={lbl}>Redirect URL setelah Submit</label><input type="text" className={inp} value={c.redirectUrl||''} onChange={e=>upC('redirectUrl',e.target.value)} placeholder="https://..."/></div>
          </div>
        )
      case 'html':
        return (
          <div className={section}>
            <div><label className={lbl}>Kode HTML</label><textarea className={`${inp} font-mono text-xs`} rows={12} value={c.code||''} onChange={e=>upC('code',e.target.value)}/></div>
          </div>
        )
      case 'floating_whatsapp':
        return (
          <div className={section}>
            <div><label className={lbl}>Nomor WhatsApp (62...)</label><input type="text" className={inp} value={c.phone||''} onChange={e=>upC('phone',e.target.value)} placeholder="6281234567890"/></div>
            <div><label className={lbl}>Pesan Otomatis</label><textarea className={inp} rows={3} value={c.message||''} onChange={e=>upC('message',e.target.value)}/></div>
          </div>
        )
      case 'popup':
        return (
          <div className={section}>
            <div><label className={lbl}>Judul Popup</label><input type="text" className={inp} value={c.title||''} onChange={e=>upC('title',e.target.value)}/></div>
            <div><label className={lbl}>Isi Konten</label><textarea className={inp} rows={3} value={c.content||''} onChange={e=>upC('content',e.target.value)}/></div>
            <div><label className={lbl}>Teks Tombol</label><input type="text" className={inp} value={c.buttonLabel||''} onChange={e=>upC('buttonLabel',e.target.value)}/></div>
            <div><label className={lbl}>Delay Muncul (detik)</label><input type="number" className={inp} value={c.delay||3} min={0} max={30} onChange={e=>upC('delay',+e.target.value)}/></div>
          </div>
        )
      case 'product_showcase': {
        const selected: string[] = c.productIds || []
        return (
          <div className={section}>
            <div><label className={lbl}>Judul Seksi</label><input type="text" className={inp} value={c.title||''} onChange={e=>upC('title',e.target.value)} placeholder="Produk Kami"/></div>
            <div>
              <label className={lbl}>Jumlah Kolom</label>
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                {[1,2,3].map(n => (
                  <button key={n} onClick={()=>upC('columns',n)} className={`flex-1 py-1.5 rounded-md text-[12px] font-bold transition-all ${(c.columns||2)===n?'bg-white text-[#2DB24A] shadow-sm':'text-gray-400'}`}>{n}</button>
                ))}
              </div>
            </div>
            <div>
              <label className={lbl}>Opsi Tampil</label>
              <div className="space-y-2 mt-1">
                {[['showPrice','Tampilkan Harga'],['showStock','Tampilkan Stok'],['showBuyBtn','Tombol Beli']].map(([k,l]) => (
                  <label key={k} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl cursor-pointer">
                    <span className="text-[13px] text-gray-600">{l}</span>
                    <input type="checkbox" checked={(c as any)[k] !== false} onChange={e=>upC(k,e.target.checked)} className="w-4 h-4 accent-[#2DB24A] rounded"/>
                  </label>
                ))}
              </div>
            </div>
            {c.showBuyBtn !== false && (
              <div><label className={lbl}>Label Tombol Beli</label><input type="text" className={inp} value={c.buyBtnLabel||'Beli Sekarang'} onChange={e=>upC('buyBtnLabel',e.target.value)}/></div>
            )}
            <div>
              <label className={lbl}>Pilih Produk dari Katalog ({selected.length} dipilih)</label>
              {merchantProducts.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-[12px] text-gray-400">Belum ada produk di katalog.</p>
                  <a href="/merchant/dashboard" target="_blank" className="text-[11px] text-[#2DB24A] underline mt-1 block">Tambah Produk →</a>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {merchantProducts.map((prod: any) => {
                    const isSelected = selected.includes(prod.id)
                    return (
                      <label key={prod.id} className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer border transition-all ${isSelected ? 'border-[#2DB24A]/40 bg-[#2DB24A]/5' : 'border-transparent bg-gray-50 hover:bg-gray-100'}`}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={e => {
                            const next = e.target.checked
                              ? [...selected, prod.id]
                              : selected.filter((id: string) => id !== prod.id)
                            upC('productIds', next)
                          }}
                          className="w-4 h-4 accent-[#2DB24A] rounded flex-shrink-0"
                        />
                        {prod.imageUrl ? (
                          <img src={prod.imageUrl} alt={prod.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-[#e4e6ea]"/>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0 text-lg">📦</div>
                        )}
                        <div className="min-w-0">
                          <p className="text-[12px] font-semibold text-gray-800 truncate">{prod.title}</p>
                          <p className="text-[11px] text-[#2DB24A] font-bold">Rp {prod.price?.toLocaleString('id-ID')}</p>
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )
      }
      default:
        return <div className="py-10 flex flex-col items-center gap-2 text-center"><div className="text-3xl">⚙️</div><p className="text-[13px] text-gray-400">Tidak ada pengaturan konten.</p></div>
    }
  }

  const renderStyle = () => {
    const s = comp.style
    return (
      <div className="space-y-5">
        <div>
          <label className={lbl}>Rata Teks</label>
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {[['left','Kiri'],['center','Tengah'],['right','Kanan']].map(([v,ico])=>(
              <button key={v} onClick={()=>upS('textAlign',v)} className={`flex-1 py-1.5 rounded-md text-[12px] font-semibold transition-all ${s.textAlign===v?'bg-white text-[#2DB24A] shadow-sm':'text-gray-400 hover:text-gray-600'}`}>{ico}</button>
            ))}
          </div>
        </div>
        <div>
          <label className={lbl}>Ukuran Font</label>
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {[['sm','S'],['default','M'],['lg','L']].map(([v,l])=>(
              <button key={v} onClick={()=>upS('fontSize',v)} className={`flex-1 py-1.5 rounded-md text-[12px] font-bold transition-all ${s.fontSize===v||(v==='default'&&!s.fontSize)?'bg-white text-[#2DB24A] shadow-sm':'text-gray-400 hover:text-gray-600'}`}>{l}</button>
            ))}
          </div>
        </div>
        <div>
          <label className={lbl}>Ketebalan Font</label>
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {[['normal','Normal'],['default','Medium'],['bold','Bold']].map(([v,l])=>(
              <button key={v} onClick={()=>upS('fontWeight',v)} className={`flex-1 py-1.5 rounded-md text-[12px] font-semibold transition-all ${s.fontWeight===v||(v==='default'&&!s.fontWeight)?'bg-white text-[#2DB24A] shadow-sm':'text-gray-400 hover:text-gray-600'}`}>{l}</button>
            ))}
          </div>
        </div>
        <div>
          <label className={lbl}>Warna Teks</label>
          <div className="flex gap-2">
            <input type="color" className="h-9 w-10 rounded-lg border border-[#e4e6ea] cursor-pointer flex-shrink-0" value={s.color||'#111111'} onChange={e=>upS('color',e.target.value)}/>
            <input type="text" className={inp} value={s.color||''} onChange={e=>upS('color',e.target.value)} placeholder="#111111"/>
          </div>
        </div>
        <div>
          <label className={lbl}>Warna Background</label>
          <div className="flex gap-2">
            <input type="color" className="h-9 w-10 rounded-lg border border-[#e4e6ea] cursor-pointer flex-shrink-0" value={s.bgColor||'#ffffff'} onChange={e=>upS('bgColor',e.target.value)}/>
            <input type="text" className={inp} value={s.bgColor||''} onChange={e=>upS('bgColor',e.target.value)} placeholder="transparent"/>
          </div>
        </div>
        <div>
          <label className={lbl}>Opacity: {s.opacity??100}%</label>
          <input type="range" min={0} max={100} value={s.opacity??100} onChange={e=>upS('opacity',+e.target.value)} className="w-full accent-[#2DB24A]"/>
        </div>
        <div>
          <label className={lbl}>Border Radius (px)</label>
          <input type="range" min={0} max={50} value={s.borderRadius??0} onChange={e=>upS('borderRadius',+e.target.value)} className="w-full accent-[#2DB24A]"/>
          <p className="text-[12px] text-gray-500 mt-1">{s.borderRadius??0}px</p>
        </div>
        <div>
          <label className={lbl}>Padding (px)</label>
          <div className="grid grid-cols-2 gap-2">
            {[['paddingTop','↑ Atas'],['paddingBottom','↓ Bawah'],['paddingLeft','← Kiri'],['paddingRight','→ Kanan']].map(([k,l])=>(
              <div key={k}><span className="text-[11px] text-gray-400 block mb-1">{l}</span><input type="number" className={inp} value={(s as any)[k]??16} min={0} onChange={e=>upS(k,+e.target.value)}/></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderAdvance = () => {
    const a = comp.advance
    return (
      <div className="space-y-5">
        <div>
          <label className={lbl}>Margin (px)</label>
          <div className="grid grid-cols-2 gap-2">
            {[['marginTop','↑ Atas'],['marginBottom','↓ Bawah']].map(([k,l])=>(
              <div key={k}><span className="text-[11px] text-gray-400 block mb-1">{l}</span><input type="number" className={inp} value={(a as any)[k]??0} onChange={e=>upA(k,+e.target.value)}/></div>
            ))}
          </div>
        </div>
        <div>
          <label className={lbl}>Tampilkan Di Perangkat</label>
          <div className="space-y-2 mt-1">
            {[['showDesktop','🖥  Desktop'],['showTablet','📟  Tablet'],['showMobile','📱  Mobile']].map(([k,l])=>(
              <label key={k} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl cursor-pointer">
                <span className="text-[13px] text-gray-600">{l}</span>
                <input type="checkbox" checked={(a as any)[k]!==false} onChange={e=>upA(k,e.target.checked)} className="w-4 h-4 accent-[#2DB24A] rounded"/>
              </label>
            ))}
          </div>
        </div>
        <div><label className={lbl}>Custom CSS Class</label><input type="text" className={inp} value={a.customClass||''} onChange={e=>upA('customClass',e.target.value)} placeholder="class-name"/></div>
        <div><label className={lbl}>ID Elemen</label><input type="text" className={inp} value={a.customId||''} onChange={e=>upA('customId',e.target.value)} placeholder="element-id"/></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Panel header */}
      <div className="px-4 py-3 border-b border-[#f0f0f0] flex-shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[#2DB24A] flex-shrink-0">{getIcon(comp.type)}</span>
          <span className="text-[13px] font-semibold text-gray-800 capitalize flex-1 truncate">{comp.type.replace(/_/g,' ')}</span>
          <button onClick={onDuplicate} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors" title="Duplikat">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path strokeLinecap="round" strokeLinejoin="round" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
          </button>
          <button onClick={onDelete} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Hapus">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18m-2 0l-1.5 14a2 2 0 01-2 2H8.5a2 2 0 01-2-2L5 6m4 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
          </button>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          {(['content','style','advance'] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} className={`flex-1 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wide transition-all ${tab===t?'bg-white text-[#2DB24A] shadow-sm':'text-gray-400 hover:text-gray-600'}`}>
              {t==='content'?'Konten':t==='style'?'Gaya':'Lanjutan'}
            </button>
          ))}
        </div>
      </div>
      {/* Panel body */}
      <div className="flex-1 overflow-y-auto p-4">
        {tab==='content'&&renderContent()}
        {tab==='style'&&renderStyle()}
        {tab==='advance'&&renderAdvance()}
      </div>
    </div>
  )
}

// ─── Main Builder ─────────────────────────────────────────────────────────────
// ─── Style Presets ────────────────────────────────────────────────────────────
const STYLE_PRESETS = {
  apple: {
    name: 'Apple Style',
    bgColor: '#F5F5F7',
    primaryColor: '#000000',
    textColor: '#1D1D1F',
    cardBg: '#FFFFFF',
    borderRadius: '12px',
  },
  retro: {
    name: 'Retro Classic',
    bgColor: '#FAF6EE',
    primaryColor: '#D97706',
    textColor: '#1E293B',
    cardBg: '#FEFDFB',
    borderRadius: '4px',
  },
  soft: {
    name: 'Soft Pastel',
    bgColor: '#F5F3FF',
    primaryColor: '#8B5CF6',
    textColor: '#4C1D95',
    cardBg: '#FFFFFF',
    borderRadius: '24px',
  },
  sporty: {
    name: 'Sporty Dark',
    bgColor: '#0F172A',
    primaryColor: '#38BDF8',
    textColor: '#F8FAFC',
    cardBg: '#1E293B',
    borderRadius: '8px',
  },
  cinematic: {
    name: 'Cinematic Noir',
    bgColor: '#121212',
    primaryColor: '#E50914',
    textColor: '#F5F5F1',
    cardBg: '#1F1F1F',
    borderRadius: '0px',
  },
  brutalist: {
    name: 'Neo-Brutalist',
    bgColor: '#FDE047',
    primaryColor: '#000000',
    textColor: '#000000',
    cardBg: '#FFFFFF',
    borderRadius: '0px',
  }
}

export default function BuilderPage() {
  const router = useRouter()
  const params = useParams()
  const pageId = params?.pageId as string

  const [comps, setComps] = useState<BuilderComponent[]>([])
  const [selId, setSelId] = useState<string | null>(null)
  const [device, setDevice] = useState<'desktop'|'tablet'|'mobile'>('desktop')
  const [canvasW, setCanvasW] = useState<'Slimmer'|'Normal'|'Full'>('Slimmer')
  const [showCanvasMenu, setShowCanvasMenu] = useState(false)
  const [query, setQuery] = useState('')
  const [hist, setHist] = useState<BuilderComponent[][]>([[]])
  const [histIdx, setHistIdx] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [pageName, setPageName] = useState('Halaman Saya')
  const [merchantProducts, setMerchantProducts] = useState<any[]>([])

  // Style & AI Theme States
  const [canvasBg, setCanvasBg] = useState('#FFFFFF')
  const [showStyleMenu, setShowStyleMenu] = useState(false)
  const [styleTab, setStyleTab] = useState<'guide' | 'custom'>('guide')
  const [aiPrompt, setAiPrompt] = useState('')
  const [generatingAiTheme, setGeneratingAiTheme] = useState(false)

  // DnD state
  const [dragOverIdx, setDragOverIdx] = useState<number|null>(null)
  const [dragFromIdx, setDragFromIdx] = useState<number|null>(null)
  const dragItem = useRef<number|null>(null)

  const selComp = comps.find(c=>c.id===selId)||null

  // Apply preset theme to background and components
  const applyPresetTheme = (preset: { bgColor: string, primaryColor: string, textColor: string, cardBg: string, borderRadius: string }) => {
    setCanvasBg(preset.bgColor)
    const nextComps = comps.map(comp => {
      const updatedStyle = { ...comp.style }
      
      if (['headline', 'subheadline', 'content', 'rating', 'visitor_counter', 'sold_counter', 'sales_notification'].includes(comp.type)) {
        updatedStyle.color = preset.textColor
      } else if (comp.type === 'button') {
        updatedStyle.bgColor = preset.primaryColor
        updatedStyle.color = '#FFFFFF'
        updatedStyle.borderRadius = parseInt(preset.borderRadius) || 0
      } else if (comp.type === 'whatsapp_button') {
        updatedStyle.borderRadius = parseInt(preset.borderRadius) || 0
      } else if (['pricing', 'faq', 'testimonials', 'formulir', 'banner_announcement', 'tabs'].includes(comp.type)) {
        updatedStyle.bgColor = preset.cardBg
        updatedStyle.color = preset.textColor
        updatedStyle.borderRadius = parseInt(preset.borderRadius) || 0
      } else if (comp.type === 'image' || comp.type === 'video') {
        updatedStyle.borderRadius = parseInt(preset.borderRadius) || 0
      }

      return { ...comp, style: updatedStyle }
    })
    setComps(nextComps)
    push(nextComps)
  }

  // Handle AI Theme generation
  const handleGenerateAiTheme = async () => {
    if (!aiPrompt.trim()) return
    setGeneratingAiTheme(true)
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'theme', context: { prompt: aiPrompt } })
      })
      const data = await res.json()
      if (data.text) {
        let cleanText = data.text.trim()
        if (cleanText.startsWith('```json')) {
          cleanText = cleanText.substring(7)
        } else if (cleanText.startsWith('```')) {
          cleanText = cleanText.substring(3)
        }
        if (cleanText.endsWith('```')) {
          cleanText = cleanText.substring(0, cleanText.length - 3)
        }
        cleanText = cleanText.trim()
        const parsed = JSON.parse(cleanText)
        applyPresetTheme({
          bgColor: parsed.canvasBg || '#FFFFFF',
          primaryColor: parsed.primaryColor || '#2DB24A',
          textColor: parsed.textColor || '#111111',
          cardBg: parsed.cardBg || '#FFFFFF',
          borderRadius: parsed.borderRadius != null ? String(parsed.borderRadius) : '8px'
        })
      }
    } catch (e) {
      console.error(e)
    } finally {
      setGeneratingAiTheme(false)
    }
  }

  // Load data
  useEffect(()=>{
    (async()=>{
      try {
        const p = await getCurrentUserProfile()
        setProfile(p)
        if(p?.landingPageConfig){
          const cfg=JSON.parse(p.landingPageConfig)
          const pg=(cfg.pages||[]).find((x:any)=>x.id===pageId)
          if(pg){
            setPageName(pg.name||'Halaman')
            if(pg.builderComponents?.length){
              setComps(pg.builderComponents)
              setHist([pg.builderComponents])
            }
            if(pg.canvasBg) {
              setCanvasBg(pg.canvasBg)
            }
          }
        }
        // Load merchant products
        const prods = await getProducts()
        if (p?.id) {
          setMerchantProducts(prods.filter((pr: any) => pr.merchantId === p.id))
        }
      }catch(e){console.error(e)}
    })()
  },[pageId])

  // Keyboard shortcuts
  useEffect(()=>{
    const h=(e:KeyboardEvent)=>{
      if((e.metaKey||e.ctrlKey)&&!e.shiftKey&&e.key==='z'){e.preventDefault();doUndo()}
      if((e.metaKey||e.ctrlKey)&&e.shiftKey&&e.key==='z'){e.preventDefault();doRedo()}
      if(e.key==='Escape'){setSelId(null)}
      if(e.key==='Delete'&&selId&&document.activeElement?.tagName!=='INPUT'&&document.activeElement?.tagName!=='TEXTAREA'){delComp(selId)}
    }
    window.addEventListener('keydown',h)
    return()=>window.removeEventListener('keydown',h)
  },[histIdx,hist,selId])

  const push=(c:BuilderComponent[])=>{
    const h=[...hist.slice(0,histIdx+1),c]
    setHist(h);setHistIdx(h.length-1)
  }
  const doUndo=()=>{if(histIdx>0){const i=histIdx-1;setHistIdx(i);setComps(hist[i])}}
  const doRedo=()=>{if(histIdx<hist.length-1){const i=histIdx+1;setHistIdx(i);setComps(hist[i])}}

  const addComp=(type:string)=>{
    const c:BuilderComponent={id:`c-${Date.now()}-${Math.random().toString(36).slice(2)}`,type,content:defaultContent(type),style:defaultStyle(),advance:defaultAdvance()}
    const next=[...comps,c];setComps(next);push(next);setSelId(c.id)
  }
  const updComp=(u:BuilderComponent)=>{const next=comps.map(c=>c.id===u.id?u:c);setComps(next);push(next)}
  const delComp=(id:string)=>{const next=comps.filter(c=>c.id!==id);setComps(next);push(next);setSelId(null)}
  const dupComp=(id:string)=>{
    const i=comps.findIndex(c=>c.id===id);if(i<0)return
    const d={...JSON.parse(JSON.stringify(comps[i])),id:`c-${Date.now()}`}
    const next=[...comps.slice(0,i+1),d,...comps.slice(i+1)];setComps(next);push(next);setSelId(d.id)
  }
  const moveUp=(id:string)=>{const i=comps.findIndex(c=>c.id===id);if(i<=0)return;const n=[...comps];[n[i-1],n[i]]=[n[i],n[i-1]];setComps(n);push(n)}
  const moveDown=(id:string)=>{const i=comps.findIndex(c=>c.id===id);if(i>=comps.length-1)return;const n=[...comps];[n[i],n[i+1]]=[n[i+1],n[i]];setComps(n);push(n)}

  const handleSave=async()=>{
    if(!profile)return;setSaving(true)
    try{
      const cfg=JSON.parse(profile.landingPageConfig||'{}')
      const pages=(cfg.pages&&Array.isArray(cfg.pages)?[...cfg.pages]:[{id:'page-main',name:'Main'}])
      const i=pages.findIndex((p:any)=>p.id===pageId)
      if(i!==-1)pages[i]={...pages[i],builderComponents:comps,canvasBg:canvasBg,lastModified:new Date().toISOString()}
      cfg.pages=pages
      const r=await updateUserLandingPage(profile.landingPageTemplate||'template1',JSON.stringify(cfg),profile.latitude||-6.2088,profile.longitude||106.8456)
      if(!r.error){setSaved(true);setTimeout(()=>setSaved(false),3000)}
    }catch(e){console.error(e)}finally{setSaving(false)}
  }

  const widthMap={Slimmer:'640px',Normal:'768px',Full:'100%'}
  const filtered=query.trim()
    ?[{category:'Hasil Pencarian',items:CATALOG.flatMap(c=>c.items).filter(i=>i.label.toLowerCase().includes(query.toLowerCase()))}]
    :CATALOG

  // Resolve product_showcase _resolvedProducts before rendering canvas
  const resolvedComps = comps.map(comp => {
    if (comp.type === 'product_showcase') {
      const ids: string[] = comp.content.productIds || []
      const resolved = merchantProducts.filter((p: any) => ids.includes(p.id))
      return { ...comp, content: { ...comp.content, _resolvedProducts: resolved } }
    }
    return comp
  })

  // DnD handlers
  const handleDragStart=(idx:number)=>{
    dragItem.current=idx
    setDragFromIdx(idx)
  }
  const handleDragOver=(e:React.DragEvent,idx:number)=>{
    e.preventDefault()
    e.dataTransfer.dropEffect='move'
    if(dragOverIdx!==idx)setDragOverIdx(idx)
  }
  const handleDrop=(e:React.DragEvent,toIdx:number)=>{
    e.preventDefault()
    const from=dragItem.current
    if(from===null||from===toIdx){setDragOverIdx(null);setDragFromIdx(null);return}
    const n=[...comps]
    const[moved]=n.splice(from,1)
    n.splice(toIdx,0,moved)
    setComps(n);push(n)
    dragItem.current=null;setDragOverIdx(null);setDragFromIdx(null)
  }
  const handleDragEnd=()=>{
    dragItem.current=null;setDragOverIdx(null);setDragFromIdx(null)
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden select-none" style={{fontFamily:'Inter,Poppins,sans-serif',background:'#f1f3f5'}}>
      <style>{`
        @keyframes builder-bounce{0%,100%{transform:translateY(-25%)}50%{transform:none}}
        .comp-wrap:hover .comp-actions{opacity:1}
        .comp-wrap.selected .comp-actions{opacity:1}
        .comp-wrap:hover .drag-handle{opacity:1}
        .comp-wrap.selected .drag-handle{opacity:1}
      `}</style>

      {/* ══ TOP BAR ════════════════════════════════════════════════════════════ */}
      <header className="h-[50px] bg-white border-b border-[#e4e6ea] flex items-center px-4 gap-3 flex-shrink-0 z-50" style={{boxShadow:'0 1px 0 rgba(0,0,0,0.04)'}}>
        {/* Left */}
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={()=>router.push('/merchant/dashboard')} className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500 hover:text-gray-900 border border-[#e4e6ea] rounded-lg px-3 h-8 transition-colors hover:bg-gray-50 flex-shrink-0">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
            Page List
          </button>
          <div className="relative flex-shrink-0">
            <button onClick={()=>setShowCanvasMenu(p=>!p)} className="flex items-center gap-1.5 text-[12px] font-medium text-gray-600 border border-[#e4e6ea] rounded-lg px-3 h-8 hover:bg-gray-50 transition-colors">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
              Canvas: {canvasW}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
            </button>
            {showCanvasMenu&&(
              <div className="absolute top-full left-0 mt-1 bg-white border border-[#e4e6ea] rounded-xl shadow-lg overflow-hidden z-50 min-w-[130px]">
                {(['Slimmer','Normal','Full'] as const).map(w=>(
                  <button key={w} onClick={()=>{setCanvasW(w);setShowCanvasMenu(false)}} className={`w-full text-left px-4 py-2.5 text-[13px] font-medium transition-colors hover:bg-gray-50 ${canvasW===w?'text-[#2DB24A]':'text-gray-700'}`}>{w}</button>
                ))}
              </div>
            )}
          </div>

          <div className="relative flex-shrink-0">
            <button
              onClick={() => setShowStyleMenu(p => !p)}
              className="flex items-center gap-1.5 text-[12px] font-medium text-gray-600 border border-[#e4e6ea] rounded-lg px-3 h-8 hover:bg-gray-50 transition-colors"
            >
              <Sparkles size={11} className="text-[#2DB24A]" />
              Style & AI
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showStyleMenu && (
              <div
                className="absolute top-full left-0 mt-1 bg-[#1a1f2e] border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 w-[300px] text-white p-4 space-y-4"
                onClick={e => e.stopPropagation()}
              >
                {/* Tabs */}
                <div className="flex bg-slate-800 rounded-lg p-0.5 text-xs font-semibold">
                  <button
                    onClick={() => setStyleTab('guide')}
                    className={`flex-1 py-1.5 rounded-md transition-all ${
                      styleTab === 'guide' ? 'bg-white text-gray-900 shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Style Guide
                  </button>
                  <button
                    onClick={() => setStyleTab('custom')}
                    className={`flex-1 py-1.5 rounded-md transition-all ${
                      styleTab === 'custom' ? 'bg-white text-gray-900 shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Custom
                  </button>
                </div>

                {styleTab === 'guide' && (
                  <div className="space-y-4">
                    {/* Preset Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(STYLE_PRESETS).map(([key, p]) => (
                        <button
                          key={key}
                          onClick={() => { applyPresetTheme(p); setShowStyleMenu(false); }}
                          className="flex flex-col items-start p-2 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-colors text-left group w-full"
                        >
                          <span className="text-[10px] font-bold mb-1.5 text-slate-300 group-hover:text-white transition-colors">
                            {p.name}
                          </span>
                          <div className="flex gap-1 w-full">
                            <span
                              className="w-4 h-4 rounded-full border border-slate-600"
                              style={{ backgroundColor: p.bgColor }}
                              title="Background"
                            />
                            <span
                              className="w-4 h-4 rounded-full border border-slate-600"
                              style={{ backgroundColor: p.primaryColor }}
                              title="Primary"
                            />
                            <span
                              className="w-4 h-4 rounded-full border border-slate-600"
                              style={{ backgroundColor: p.textColor }}
                              title="Text"
                            />
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Reset Button */}
                    <button
                      onClick={() => {
                        applyPresetTheme({
                          bgColor: '#FFFFFF',
                          primaryColor: '#2DB24A',
                          textColor: '#111111',
                          cardBg: '#FFFFFF',
                          borderRadius: '4px',
                        });
                        setShowStyleMenu(false);
                      }}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors text-slate-300"
                    >
                      Reset to default
                    </button>

                    {/* AI Generator section */}
                    <div className="border-t border-slate-700 pt-3 space-y-2">
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        Generate Theme with AI
                      </label>
                      <textarea
                        value={aiPrompt}
                        onChange={e => setAiPrompt(e.target.value)}
                        placeholder="Contoh: herbal alami dengan warna hijau putih bersih..."
                        className="w-full text-[11px] p-2 rounded-lg focus:outline-none bg-slate-800 border border-slate-700 text-white placeholder-slate-500 resize-none h-14"
                      />
                      <button
                        onClick={async () => { await handleGenerateAiTheme(); setShowStyleMenu(false); }}
                        disabled={generatingAiTheme}
                        className="w-full h-8 bg-[#2DB24A] hover:bg-[#2DB24A]/90 text-white font-geist font-bold text-[10px] uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {generatingAiTheme ? (
                          <>
                            <svg className="animate-spin" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M4 12a8 8 0 018-8" />
                            </svg>
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles size={10} />
                            Generate Style
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {styleTab === 'custom' && (
                  <div className="space-y-3">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Background Canvas
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={canvasBg}
                        onChange={e => setCanvasBg(e.target.value)}
                        className="w-10 h-10 border-0 bg-transparent rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={canvasBg}
                        onChange={e => setCanvasBg(e.target.value)}
                        className="flex-1 text-xs px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Center */}
        <div className="flex-1 flex items-center justify-center gap-2">
          <span className="text-[11px] text-gray-400 hidden sm:inline">Preview on</span>
          <div className="flex bg-[#f1f3f5] rounded-xl p-0.5">
            {([['desktop','Desktop'],['tablet','Tablet'],['mobile','Mobile']] as const).map(([d,lbl])=>(
              <button key={d} onClick={()=>setDevice(d)} className={`px-4 py-1.5 rounded-[10px] text-[11px] font-semibold transition-all ${device===d?'bg-white text-gray-900 shadow-sm':'text-gray-400 hover:text-gray-600'}`}>{lbl}</button>
            ))}
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={doUndo} disabled={histIdx<=0} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-all" title="Undo (Ctrl+Z)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 010 16H3"/><path strokeLinecap="round" strokeLinejoin="round" d="M3 10l4-4-4-4"/></svg>
          </button>
          <button onClick={doRedo} disabled={histIdx>=hist.length-1} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-all" title="Redo (Ctrl+Shift+Z)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a8 8 0 000 16h10"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 10l-4-4 4-4"/></svg>
          </button>
          <div className="w-px h-5 bg-[#e4e6ea] mx-1"/>
          <button onClick={handleSave} disabled={saving} className={`h-8 px-5 rounded-xl text-[12px] font-bold transition-all flex items-center gap-1.5 shadow-sm ${saved?'bg-emerald-500 text-white':'bg-[#2DB24A] hover:bg-[#0F5132] text-white'} disabled:opacity-70`}>
            {saving?<><svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 12a8 8 0 018-8"/></svg>Saving...</>:saved?<><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>Saved!</>:'Save'}
          </button>
        </div>
      </header>

      {/* ══ BODY ════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT SIDEBAR — Component Library ────────────────────────────── */}
        <aside className="w-[210px] flex-shrink-0 flex flex-col overflow-hidden border-r border-[rgba(255,255,255,0.06)]" style={{background:'#1a1f2e'}}>
          {/* Search */}
          <div className="px-3 pt-4 pb-3 flex-shrink-0" style={{borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-white text-[13px] font-semibold">Komponen</span>
              <span className="text-[10px] text-white/30 font-medium">{comps.length} aktif</span>
            </div>
            <div className="relative">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35"/></svg>
              <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cari komponen..." className="w-full text-[12px] pl-7 pr-3 py-2 rounded-lg focus:outline-none" style={{background:'rgba(255,255,255,0.07)',color:'rgba(255,255,255,0.8)',border:'1px solid rgba(255,255,255,0.08)'}}/>
            </div>
          </div>

          {/* Component list */}
          <div className="flex-1 overflow-y-auto py-2 scrollbar-none">
            {filtered.map(cat=>(
              <div key={cat.category} className="px-2 mb-2">
                <div className="px-2 pt-2 pb-1 text-[9px] font-bold uppercase tracking-[0.12em]" style={{color:'rgba(255,255,255,0.22)'}}>{cat.category}</div>
                {cat.items.map(item=>(
                  <button
                    key={item.type}
                    onClick={()=>addComp(item.type)}
                    draggable
                    onDragStart={e=>{e.dataTransfer.setData('component-type',item.type)}}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all text-left group cursor-pointer"
                    style={{color:'rgba(255,255,255,0.6)'}}
                    title={`Klik untuk tambah ${item.label}`}
                  >
                    <span className="flex-shrink-0 transition-colors group-hover:text-[#2DB24A]" style={{color:'rgba(255,255,255,0.3)'}}>{getIcon(item.type)}</span>
                    <span className="text-[12px] font-medium group-hover:text-white transition-colors flex-1">{item.label}</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-0 group-hover:opacity-100 text-[#2DB24A] flex-shrink-0 transition-opacity"><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14"/></svg>
                  </button>
                ))}
              </div>
            ))}
            <div className="h-4"/>
          </div>

          {/* Cancel */}
          <div className="p-3 flex-shrink-0" style={{borderTop:'1px solid rgba(255,255,255,0.07)'}}>
            <button onClick={()=>router.push('/merchant/dashboard')} className="w-full py-2 text-[12px] font-medium rounded-lg transition-colors" style={{color:'rgba(255,255,255,0.35)',border:'1px solid rgba(255,255,255,0.08)'}}>Kembali ke Dashboard</button>
          </div>
        </aside>

        {/* ── CANVAS ─────────────────────────────────────────────────────── */}
        <main
          className="flex-1 overflow-y-auto overflow-x-hidden"
          style={{background:'#e8eaed'}}
          onClick={()=>setSelId(null)}
          onDragOver={e=>{e.preventDefault()}}
          onDrop={e=>{
            const type=e.dataTransfer.getData('component-type')
            if(type){addComp(type)}
          }}
        >
          <div className="min-h-full flex flex-col items-center py-8 px-4">
            <div
              className="w-full shadow-xl transition-all duration-300"
              style={{
                maxWidth: device==='mobile'?'390px':device==='tablet'?'768px':widthMap[canvasW],
                minHeight: 600,
                borderRadius: 4,
                backgroundColor: canvasBg,
              }}
              onClick={e=>e.stopPropagation()}
            >
              {comps.length===0?(
                <div
                  className="min-h-[600px] flex flex-col items-center justify-center gap-4 cursor-default"
                  style={{border:'2px dashed #e4e6ea',borderRadius:4}}
                  onDragOver={e=>{e.preventDefault()}}
                  onDrop={e=>{
                    const type=e.dataTransfer.getData('component-type')
                    if(type){addComp(type)}
                  }}
                >
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{background:'linear-gradient(135deg,#e8f5e9,#c8e6c9)'}}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2DB24A" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14"/></svg>
                  </div>
                  <div className="text-center">
                    <p className="text-[15px] font-semibold text-gray-500">Klik komponen di sidebar atau</p>
                    <p className="text-[13px] text-gray-400 mt-1">drag komponen ke sini untuk mulai</p>
                  </div>
                </div>
              ):(
                <div
                  onDragOver={e=>{e.preventDefault()}}
                  onDrop={e=>{
                    const type=e.dataTransfer.getData('component-type')
                    if(type){addComp(type)}
                    else if(dragItem.current!==null){
                      const n=[...comps]
                      const[m]=n.splice(dragItem.current,1)
                      n.push(m)
                      setComps(n);push(n)
                      dragItem.current=null;setDragOverIdx(null)
                    }
                  }}
                >
                  {resolvedComps.map((comp, idx) => (
                    <div
                      key={comp.id}
                      className={`comp-wrap relative group ${comp.id===selId?'selected':''}`}
                      style={{
                        outline: comp.id===selId?'2px solid #2DB24A':undefined,
                        outlineOffset: comp.id===selId?-2:undefined,
                        borderTop: dragOverIdx===idx&&dragFromIdx!==idx?'2px solid #2DB24A':'2px solid transparent',
                        transition:'border-color 0.1s',
                        cursor:'default',
                      }}
                      draggable
                      onDragStart={()=>handleDragStart(idx)}
                      onDragOver={e=>handleDragOver(e,idx)}
                      onDrop={e=>handleDrop(e,idx)}
                      onDragEnd={handleDragEnd}
                      onClick={e=>{e.stopPropagation();setSelId(comp.id)}}
                    >
                      {/* Hover outline for non-selected */}
                      {comp.id!==selId&&(
                        <div className="absolute inset-0 pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity" style={{outline:'2px solid rgba(45,178,74,0.4)',outlineOffset:-2}}/>
                      )}

                      {/* Drag handle — always visible on hover/selected, on LEFT side */}
                      <div
                        className="drag-handle absolute left-0 top-0 bottom-0 w-6 flex items-center justify-center z-20 opacity-0 transition-opacity cursor-grab active:cursor-grabbing"
                        style={{background:'rgba(45,178,74,0.08)'}}
                        title="Drag untuk pindah"
                      >
                        <svg width="10" height="16" viewBox="0 0 10 16" fill="#2DB24A" opacity="0.7">
                          <circle cx="3" cy="2" r="1.5"/><circle cx="3" cy="8" r="1.5"/><circle cx="3" cy="14" r="1.5"/>
                          <circle cx="7" cy="2" r="1.5"/><circle cx="7" cy="8" r="1.5"/><circle cx="7" cy="14" r="1.5"/>
                        </svg>
                      </div>

                      {/* Action buttons — top right */}
                      <div className="comp-actions absolute top-0 right-0 z-20 opacity-0 transition-opacity flex items-center gap-px p-1 rounded-bl-lg" style={{background:'#2DB24A'}}>
                        <button onClick={e=>{e.stopPropagation();moveUp(comp.id)}} className="w-6 h-6 flex items-center justify-center rounded text-white hover:bg-white/20 transition-colors" title="Naik">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7"/></svg>
                        </button>
                        <button onClick={e=>{e.stopPropagation();moveDown(comp.id)}} className="w-6 h-6 flex items-center justify-center rounded text-white hover:bg-white/20 transition-colors" title="Turun">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                        </button>
                        <div className="w-px h-4 bg-white/30"/>
                        <button onClick={e=>{e.stopPropagation();dupComp(comp.id)}} className="w-6 h-6 flex items-center justify-center rounded text-white hover:bg-white/20 transition-colors" title="Duplikat">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path strokeLinecap="round" strokeLinejoin="round" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                        </button>
                        <button onClick={e=>{e.stopPropagation();delComp(comp.id)}} className="w-6 h-6 flex items-center justify-center rounded text-white hover:bg-red-400/70 transition-colors" title="Hapus">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18m-2 0l-1.5 14a2 2 0 01-2 2H8.5a2 2 0 01-2-2L5 6m4 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                        </button>
                      </div>

                      {/* Component content */}
                      <div className="pl-7">
                        <RenderComp comp={comp}/>
                      </div>
                    </div>
                  ))}

                  {/* Drop zone at bottom */}
                  <div
                    className={`py-6 flex items-center justify-center border-t border-dashed transition-all cursor-pointer ${dragOverIdx===comps.length?'border-[#2DB24A] bg-[#2DB24A]/5':'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'}`}
                    onDragOver={e=>{e.preventDefault();setDragOverIdx(comps.length)}}
                    onDrop={e=>{
                      e.preventDefault()
                      const type=e.dataTransfer.getData('component-type')
                      if(type){addComp(type)}
                      else handleDrop(e,comps.length)
                    }}
                    onClick={()=>{setSelId(null)}}
                  >
                    <div className="flex items-center gap-2" style={{color:'#9ca3af'}}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14"/></svg>
                      <span className="text-[12px]">Klik komponen di sidebar atau drag ke sini</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {comps.length>0&&(
              <p className="mt-4 text-[11px]" style={{color:'#9ca3af'}}>{comps.length} komponen • {pageName} • Tekan Delete untuk hapus komponen terpilih</p>
            )}
          </div>
        </main>

        {/* ── RIGHT SIDEBAR — Settings Panel ────────────────────────────── */}
        {selComp?(
          <aside className="w-[272px] flex-shrink-0 flex flex-col overflow-hidden border-l border-[#e4e6ea]">
            <SettingsPanel
              comp={selComp}
              onChange={updComp}
              onDelete={()=>delComp(selComp.id)}
              onDuplicate={()=>dupComp(selComp.id)}
              merchantProducts={merchantProducts}
            />
          </aside>
        ):(
          <aside className="w-[272px] flex-shrink-0 flex flex-col overflow-hidden border-l border-[#e4e6ea] bg-white">
            <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
              </div>
              <div>
                <p className="text-[13px] font-semibold text-gray-600 mb-1">Pilih Komponen</p>
                <p className="text-[12px] text-gray-400">Klik komponen di canvas untuk edit konten dan gaya</p>
              </div>
              <div className="mt-2 text-[11px] text-gray-300 space-y-1">
                <p>Ctrl+Z = Undo</p>
                <p>Ctrl+Shift+Z = Redo</p>
                <p>Delete = Hapus terpilih</p>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}
