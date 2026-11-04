'use client'

import React, { useState } from 'react'
import {
  Monitor,
  Tablet,
  Smartphone,
  CheckCircle2,
  ExternalLink,
  Edit2,
  Send,
  X,
  Store,
  ShieldCheck,
  Check,
  Sparkles,
  ArrowRight
} from 'lucide-react'

interface LandingPageReviewModalProps {
  pageName: string
  pageSlug: string
  merchantSubdomain: string
  merchantName: string
  components: any[]
  canvasBg: string
  renderComp: (comp: any) => React.ReactNode
  onEdit: () => void
  onPublish: () => Promise<boolean>
  onClose: () => void
}

export default function LandingPageReviewModal({
  pageName,
  pageSlug,
  merchantSubdomain,
  merchantName,
  components,
  canvasBg,
  renderComp,
  onEdit,
  onPublish,
  onClose
}: LandingPageReviewModalProps) {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [isPublishing, setIsPublishing] = useState(false)
  const [isPublishedSuccess, setIsPublishedSuccess] = useState(false)

  // Checklist states
  const [agreedTitle, setAgreedTitle] = useState(true)
  const [agreedContact, setAgreedContact] = useState(true)
  const [agreedTerms, setAgreedTerms] = useState(true)

  const isChecklistComplete = agreedTitle && agreedContact && agreedTerms

  const publicUrl = `https://ustore.saloka.id/merchant/${merchantSubdomain || 'toko'}/${pageSlug || 'halaman'}`

  const handleConfirmPublish = async () => {
    if (!isChecklistComplete) return
    setIsPublishing(true)
    try {
      const ok = await onPublish()
      if (ok) {
        setIsPublishedSuccess(true)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 select-none font-sans overflow-hidden">
      <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl flex flex-col h-[94vh] max-h-[920px] overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* ── TOP HEADER ───────────────────────────────────────────────────── */}
        <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E8F8EE] text-[#2DB24A] flex items-center justify-center font-bold">
              <Store size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-[#2DB24A]">
                  Review & Konfirmasi
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500 font-medium">{merchantName || 'Toko Saya'}</span>
              </div>
              <h2 className="text-base font-bold text-slate-900">{pageName || 'Landing Page Toko'}</h2>
            </div>
          </div>

          {/* Device viewport switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setDevice('desktop')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                device === 'desktop' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Monitor size={14} /> Desktop
            </button>
            <button
              onClick={() => setDevice('tablet')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                device === 'tablet' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Tablet size={14} /> Tablet
            </button>
            <button
              onClick={() => setDevice('mobile')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                device === 'mobile' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Smartphone size={14} /> Mobile
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── MAIN REVIEW AREA ─────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-slate-100/70">
          
          {/* Canvas Live Preview Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex items-start justify-center">
            <div
              className={`transition-all duration-300 bg-white border border-slate-200 shadow-lg rounded-2xl overflow-x-hidden ${
                device === 'mobile'
                  ? 'w-[375px] my-2 min-h-[600px] border-4 border-slate-800 rounded-[32px] p-2 relative'
                  : device === 'tablet'
                  ? 'w-[768px] min-h-[600px] rounded-xl'
                  : 'w-full max-w-[840px] min-h-[600px] rounded-xl'
              }`}
              style={{ backgroundColor: canvasBg || '#FFFFFF' }}
            >
              {/* Mobile Notch Simulation */}
              {device === 'mobile' && (
                <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-2" />
              )}

              {/* Real components rendering */}
              <div className="space-y-0">
                {components.map((comp) => (
                  <div key={comp.id} className="relative">
                    {renderComp(comp)}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar: Confirmation Checklist */}
          <div className="w-full lg:w-96 bg-white border-l border-slate-200 p-6 flex flex-col justify-between shrink-0 overflow-y-auto">
            
            {!isPublishedSuccess ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-sora">Pemeriksaan Sebelum Publikasi</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Pastikan informasi usaha Anda sudah akurat sebelum halaman ditayangkan secara online.
                  </p>
                </div>

                {/* Target Public URL preview */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Alamat URL Halaman:
                  </span>
                  <div className="text-xs font-mono font-bold text-[#0F5132] break-all bg-white p-2 rounded-lg border border-slate-200/80">
                    {publicUrl}
                  </div>
                </div>

                {/* Verification Checklists */}
                <div className="space-y-3 pt-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Checklist Persetujuan Merchant:
                  </span>

                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={agreedTitle}
                      onChange={(e) => setAgreedTitle(e.target.checked)}
                      className="mt-0.5 rounded text-[#2DB24A] focus:ring-[#2DB24A]"
                    />
                    <span>Judul, foto, dan deskripsi produk sudah diperiksa dan sesuai.</span>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={agreedContact}
                      onChange={(e) => setAgreedContact(e.target.checked)}
                      className="mt-0.5 rounded text-[#2DB24A] focus:ring-[#2DB24A]"
                    />
                    <span>Nomor WhatsApp dan kontak pemesanan sudah benar dan aktif.</span>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={agreedTerms}
                      onChange={(e) => setAgreedTerms(e.target.checked)}
                      className="mt-0.5 rounded text-[#2DB24A] focus:ring-[#2DB24A]"
                    />
                    <span>Saya menyetujui untuk menerbitkan halaman ini ke publik.</span>
                  </label>
                </div>
              </div>
            ) : (
              /* Success State */
              <div className="space-y-6 text-center my-auto py-8 animate-in fade-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-3xl bg-[#E8F8EE] text-[#2DB24A] border-2 border-[#2DB24A]/30 flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 size={36} />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-black text-slate-900 font-sora">Halaman Berhasil Diterbitkan!</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Landing page toko Anda sekarang sudah online dan siap menerima kunjungan serta pesanan pembeli.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Link Toko Anda:</p>
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-[#2DB24A] hover:underline break-all inline-flex items-center gap-1 justify-center"
                  >
                    {publicUrl} <ExternalLink size={12} />
                  </a>
                </div>

                <button
                  onClick={onClose}
                  className="w-full py-3 bg-[#2DB24A] hover:bg-[#2DB24A]/90 text-white font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Selesai & Kelola Halaman
                </button>
              </div>
            )}

            {/* Bottom Actions */}
            {!isPublishedSuccess && (
              <div className="pt-6 border-t border-slate-100 flex flex-col gap-2.5">
                <button
                  onClick={handleConfirmPublish}
                  disabled={!isChecklistComplete || isPublishing}
                  className="w-full py-3 bg-[#2DB24A] hover:bg-[#2DB24A]/90 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isPublishing ? (
                    'Menerbitkan...'
                  ) : (
                    <>
                      <Send size={15} /> Publikasikan Sekarang
                    </>
                  )}
                </button>

                <button
                  onClick={onEdit}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Edit2 size={14} /> Kembali Edit Halaman
                </button>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  )
}

