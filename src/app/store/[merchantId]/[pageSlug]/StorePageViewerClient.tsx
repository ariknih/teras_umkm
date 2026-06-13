'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
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

export interface BuilderComponent {
  id: string
  type: string
  content: Record<string, any>
  style: Record<string, any>
  advance: Record<string, any>
}

// ─── Component Catalog Icons ──────────────────────────────────────────────────
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

// ─── Public Component Renderer ───────────────────────────────────────────────
function PublicRenderComp({ comp }: { comp: BuilderComponent }) {
  const c = comp.content
  const s = comp.style
  
  // Accordion and Tab states scoped internally per component ID
  const [faqOpenIdx, setFaqOpenIdx] = useState<number | null>(0)
  const [activeTabIdx, setActiveTabIdx] = useState<number>(0)
  const [timerValues, setTimerValues] = useState({ days: '00', hours: '00', minutes: '00', seconds: '00' })
  const [popupVisible, setPopupVisible] = useState(false)
  const [formSubmitted, setFormSubmitted] = useState(false)
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

  // Popup logic
  useEffect(() => {
    if (comp.type === 'popup') {
      const delay = (c.delay || 3) * 1000
      const timer = setTimeout(() => {
        setPopupVisible(true)
      }, delay)
      return () => clearTimeout(timer)
    }
  }, [comp.type, c.delay])

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

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormSubmitted(true)
    if (c.redirectUrl) {
      setTimeout(() => {
        window.location.href = c.redirectUrl
      }, 1500)
    }
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
        <a 
          href={c.url || '#'} 
          target={c.target || '_self'} 
          rel={c.target === '_blank' ? 'noopener noreferrer' : undefined}
          style={{ background: s.bgColor || '#2DB24A', color: s.color || '#fff', padding: '12px 32px', borderRadius: 9999, fontWeight: 600, fontSize: 15, textDecoration: 'none', display: 'inline-block', transition: 'transform 0.15s ease' }}
          className="hover:scale-105"
        >
          {c.label || 'Klik Di Sini'}
        </a>
      </div>
    )
    case 'whatsapp_button': return (
      <div style={p}>
        <a 
          href={`https://wa.me/${c.phone || ''}?text=${encodeURIComponent(c.message || '')}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ background: '#25D366', color: '#fff', padding: '12px 28px', borderRadius: 9999, fontWeight: 600, fontSize: 15, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'transform 0.15s ease' }}
          className="hover:scale-105"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/></svg>
          {c.label || 'Hubungi via WhatsApp'}
        </a>
      </div>
    )
    case 'image': return (
      <div style={p}>
        {c.src ? <img src={c.src} alt={c.alt||''} style={{ width: c.width||'100%', borderRadius: s.borderRadius ? s.borderRadius+'px' : 8, display: 'block', margin: s.textAlign==='center'?'0 auto':undefined }} /> : (
          <div style={{ width: '100%', aspectRatio: '16/9', background: '#F3F4F6', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed #D1D5DB' }}>
            <span style={{ color: '#9CA3AF', fontSize: 12 }}>Gambar belum diunggah</span>
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
                    className={`w-2 h-2 rounded-full transition-all ${i === slideIdx ? 'bg-white scale-110' : 'bg-white/40 hover:bg-white/60'}`}
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
            <span style={{ color: '#ffffff50', fontSize: 12 }}>Video belum tersedia</span>
          </div>
        )}
      </div>
    )
    case 'product_showcase': {
      const items: any[] = c._resolvedProducts || []
      return (
        <div style={p}>
          {c.title && <h3 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 700, color: s.color || '#111111' }}>{c.title}</h3>}
          {items.length === 0 ? (
            <div style={{ border: '2px dashed #E5E7EB', borderRadius: 12, padding: 32, textAlign: 'center', color: '#9CA3AF' }}>
              <p style={{ fontSize: 13 }}>Tidak ada produk yang ditampilkan.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${c.columns || 2}, 1fr)`, gap: 16 }}>
              {items.map((prod: any) => (
                <a
                  key={prod.id}
                  href={`/market/product/${prod.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                  className="group"
                >
                  <div className="h-full border border-neutral-200/80 rounded-2xl overflow-hidden bg-white hover:border-[#2DB24A]/40 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between">
                    <div style={{ aspectRatio: '1/1', background: '#F3F4F6', overflow: 'hidden', position: 'relative' }}>
                      {prod.imageUrl ? (
                        <img src={prod.imageUrl} alt={prod.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>📦</div>
                      )}
                    </div>
                    <div style={{ padding: '14px 16px' }} className="flex-grow flex flex-col justify-between">
                      <div>
                        <span className="text-[8px] font-bold text-[#2DB24A] uppercase tracking-wider bg-[#2DB24A]/10 px-2 py-0.5 rounded-full">{prod.category || 'Toko'}</span>
                        <p className="margin: 4px 0 0 font-bold text-sm text-[#111111] line-clamp-2 mt-1">{prod.title}</p>
                      </div>
                      <div className="mt-4">
                        {c.showPrice && <p style={{ margin: '4px 0 0', fontWeight: 700, fontSize: 16, color: '#2DB24A' }}>Rp {prod.price?.toLocaleString('id-ID')}</p>}
                        {c.showStock && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9CA3AF' }}>Stok: {prod.stock}</p>}
                        {c.showBuyBtn && (
                          <button style={{ marginTop: 12, width: '100%', padding: '10px', background: '#2DB24A', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'background-color 0.2s' }} className="hover:bg-[#259b3f]">
                            {c.buyBtnLabel || 'Beli Sekarang'}
                          </button>
                        )}
                      </div>
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
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {(c.items || []).map((item: any, i: number) => (
            <div key={i} className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-sm">
              <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                {[1,2,3,4,5].map(n => <Star key={n} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
              </div>
              <p style={{ fontSize: 15, color: '#374151', fontStyle: 'italic', lineHeight: 1.7, margin: '0 0 16px' }}>"{item.text}"</p>
              <div className="flex items-center gap-3">
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#2DB24A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 15 }}>{item.name?.[0] || 'A'}</div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#111111' }}>{item.name}</p>
                  {item.role && <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF' }}>{item.role}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
    case 'rating': return (
      <div style={{ ...p, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 44, fontWeight: 800, color: '#111111' }}>{c.score || '4.8'}</div>
        <div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[1,2,3,4,5].map(n => <Star key={n} className={`w-5 h-5 ${n <= Math.round(c.score || 5) ? 'fill-amber-400 text-amber-400' : 'fill-neutral-200 text-neutral-200'}`} />)}
          </div>
          <span style={{ color: '#6B7280', fontSize: 13, marginTop: 4, display: 'block' }}>{c.label || 'Rating'} • {c.total || 128} ulasan terverifikasi</span>
        </div>
      </div>
    )
    case 'banner_announcement': return (
      <div style={{ background: c.bgColor || '#2DB24A', color: c.textColor || '#fff', padding: '14px 20px', textAlign: 'center', fontSize: 14, fontWeight: 600 }} className="shadow-sm">
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
      <div style={{ ...p, display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
        {(c.plans || []).map((plan: any, i: number) => (
          <div key={i} style={{ flex: '1 1 240px', maxWidth: '360px', border: `2px solid ${plan.highlighted ? '#2DB24A' : '#E5E7EB'}`, borderRadius: 20, padding: 24, background: plan.highlighted ? '#F0FFF4' : '#fff' }} className="shadow-sm relative overflow-hidden">
            {plan.highlighted && (
              <span className="absolute top-3 right-3 bg-[#2DB24A] text-white px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">Terpopuler</span>
            )}
            <p style={{ fontWeight: 800, fontSize: 18, margin: '0 0 8px', color: '#111111' }}>{plan.name}</p>
            <p style={{ margin: '0 0 20px' }}><span style={{ fontSize: 32, fontWeight: 800, color: '#2DB24A' }}>Rp {plan.price}</span><span style={{ color: '#9CA3AF', fontSize: 14 }}>{plan.period}</span></p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px' }} className="space-y-3">
              {(plan.features || []).map((f: string, j: number) => (
                <li key={j} style={{ fontSize: 13, color: '#374151', padding: '3px 0', display: 'flex', gap: 8 }}>
                  <span style={{ color: '#2DB24A', fontWeight: 'bold' }}>✓</span>{f}
                </li>
              ))}
            </ul>
            <button style={{ width: '100%', padding: '12px', background: plan.highlighted ? '#2DB24A' : '#F3F4F6', color: plan.highlighted ? '#fff' : '#374151', borderRadius: 12, fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', transition: 'opacity 0.2s' }} className="hover:opacity-90">{plan.cta || 'Pilih Paket'}</button>
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
      <div style={{ ...p, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: s.bgColor || '#fff', borderBottom: '1px solid #E5E7EB' }} className="shadow-sm">
        <span style={{ fontWeight: 800, fontSize: 20, color: '#2DB24A', fontFamily: 'Poppins, sans-serif' }} className="tracking-tight">{c.logoText || 'Brand'}</span>
        <div style={{ display: 'flex', gap: 20 }}>
          {(c.links || []).map((l: any, i: number) => (
            <a key={i} href={l.url || '#'} className="hover:text-[#2DB24A] transition-colors" style={{ color: s.color || '#374151', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
              {l.label}
            </a>
          ))}
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
      <div style={p} className="bg-white rounded-2xl border border-neutral-100 p-6 max-w-lg mx-auto shadow-sm">
        {formSubmitted ? (
          <div className="text-center py-8 space-y-3">
            <span className="w-12 h-12 rounded-full bg-green-100 text-green-500 flex items-center justify-center mx-auto text-xl">✓</span>
            <h3 className="font-bold text-lg text-gray-800">Formulir Terkirim!</h3>
            <p className="text-sm text-gray-500">Terima kasih, data Anda telah kami terima dengan aman.</p>
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
            {(c.fields || []).map((f: any, i: number) => (
              <div key={i}>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">{f.label}{f.required && <span className="text-red-500"> *</span>}</label>
                <input 
                  type={f.type === 'email' ? 'email' : f.type === 'tel' ? 'tel' : 'text'}
                  required={f.required}
                  placeholder={f.placeholder} 
                  className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-[14px] bg-neutral-50 focus:outline-none focus:border-[#2DB24A] focus:ring-1 focus:ring-[#2DB24A]/20 transition-all" 
                />
              </div>
            ))}
            <button type="submit" className="w-full py-3 bg-[#2DB24A] hover:bg-[#259b3f] text-white rounded-xl font-bold text-base transition-colors mt-2">{c.submitLabel || 'Kirim Sekarang'}</button>
          </form>
        )}
      </div>
    )
    case 'html': return (
      <div style={p}>
        <SafeIframe html={c.code || ''} />
      </div>
    )
    case 'floating_whatsapp': return (
      <div className="fixed bottom-6 right-6 z-50 animate-bounce">
        <a 
          href={`https://wa.me/${c.phone || ''}?text=${encodeURIComponent(c.message || '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 bg-[#25D366] text-white rounded-full px-5 py-3.5 shadow-2xl hover:scale-105 transition-transform"
          style={{ textDecoration: 'none' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
          <span className="font-bold text-sm">Hubungi Kami</span>
        </a>
      </div>
    )
    case 'popup': return (
      popupVisible ? (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-6">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl p-6 relative text-center space-y-4">
            <button 
              onClick={() => setPopupVisible(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 font-bold text-lg"
            >×</button>
            <div className="text-4xl">🎁</div>
            <h3 className="font-extrabold text-lg text-gray-800">{c.title || 'Penawaran Spesial!'}</h3>
            <p className="text-sm text-gray-600">{c.content}</p>
            <button 
              onClick={() => setPopupVisible(false)}
              className="px-6 py-2.5 bg-[#2DB24A] hover:bg-[#259b3f] text-white font-bold rounded-xl text-sm"
            >
              {c.buttonLabel || 'Ambil Sekarang'}
            </button>
          </div>
        </div>
      ) : null
    )
    default: return (
      <div style={p} className="bg-neutral-50 rounded-xl p-4 border border-dashed border-neutral-200">
        <span className="text-sm text-neutral-500 capitalize">{comp.type.replace(/_/g, ' ')}</span>
      </div>
    )
  }
}

function SafeIframe({ html, pointerEventsNone = false }: { html: string; pointerEventsNone?: boolean }) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState('100px')

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc) return

    // Convert vh units to fixed px based on parent viewport height to prevent loop feedback
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800
    const sanitizedHtml = html.replace(/(\d+)vh/g, (match, p1) => {
      const val = parseInt(p1)
      return `${(val / 100) * screenHeight}px`
    })

    doc.open()
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              overflow: hidden !important;
              height: auto !important;
              min-height: auto !important;
            }
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            }
          </style>
        </head>
        <body>
          <div id="iframe-content-root">${sanitizedHtml}</div>
          <script>
            function sendHeight() {
              const el = document.getElementById("iframe-content-root");
              if (el) {
                const height = el.offsetHeight;
                window.parent.postMessage({ 
                  type: 'IFRAME_HEIGHT', 
                  iframeId: '${html.substring(0, 10).replace(/[^a-zA-Z0-9]/g, '')}', 
                  height: height 
                }, '*');
              }
            }
            window.addEventListener('load', sendHeight);
            window.addEventListener('resize', sendHeight);
            setTimeout(sendHeight, 100);
            setTimeout(sendHeight, 500);
            
            if (window.ResizeObserver) {
              const resizeObserver = new ResizeObserver(sendHeight);
              resizeObserver.observe(document.body);
            }
          </script>
        </body>
      </html>
    `)
    doc.close()
  }, [html])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const matchId = html.substring(0, 10).replace(/[^a-zA-Z0-9]/g, '')
      if (event.data && event.data.type === 'IFRAME_HEIGHT' && event.data.iframeId === matchId) {
        setHeight(event.data.height + 'px')
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [html])

  return (
    <iframe
      ref={iframeRef}
      style={{
        width: '100%',
        height: height,
        border: 'none',
        overflow: 'hidden',
        pointerEvents: pointerEventsNone ? 'none' : 'auto',
      }}
      title="Custom HTML Sandbox"
    />
  )
}

// ─── Main Store Page Viewer Client Component ──────────────────────────────────
export default function StorePageViewerClient({ pageName, components, user }: {
  pageName: string
  components: BuilderComponent[]
  user: {
    id: string
    name: string
    role: string
  }
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-gray-800 flex flex-col font-sans select-text">
      {/* Dynamic Navigation Top Header */}
      <header className="sticky top-0 bg-white/90 backdrop-blur border-b border-slate-100 px-6 py-3.5 z-40 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <Link 
            href={`/profile/${user.id}`}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors flex items-center justify-center text-gray-500 hover:text-gray-800"
            title="Kembali ke Toko Utama"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-poppins font-black text-sm text-gray-800 uppercase tracking-wide leading-none">{user.name}</h1>
            <span className="text-[10px] text-gray-400 font-bold tracking-wider uppercase mt-1 inline-block">{pageName}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link 
            href={`/profile/${user.id}`}
            className="px-4 py-2 border border-slate-200 text-xs font-bold text-gray-600 rounded-xl hover:bg-slate-50 transition-colors uppercase tracking-wider"
          >
            Lihat Profil Utama
          </Link>
        </div>
      </header>

      {/* Main content body containing visual builder components */}
      <main className="flex-1 max-w-4xl mx-auto w-full bg-white shadow-sm border border-slate-100 min-h-[600px] my-6 rounded-2xl overflow-hidden">
        {components.length === 0 ? (
          <div className="min-h-[500px] flex flex-col items-center justify-center text-center p-8 space-y-4">
            <AlertCircle className="w-12 h-12 text-gray-300" />
            <h3 className="font-bold text-gray-700">Halaman Kosong</h3>
            <p className="text-sm text-gray-500 max-w-sm">Merchant belum mengunggah komponen visual untuk halaman ini.</p>
          </div>
        ) : (
          <div className="w-full flex flex-col">
            {components.map((comp) => (
              <div key={comp.id} className="w-full">
                <PublicRenderComp comp={comp} />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 bg-slate-50 border-t border-slate-200/50 text-center text-xs text-gray-400">
        <p>© 2026 {user.name} • Halaman Dibuat Menggunakan Saloka.id Builder</p>
      </footer>
    </div>
  )
}
