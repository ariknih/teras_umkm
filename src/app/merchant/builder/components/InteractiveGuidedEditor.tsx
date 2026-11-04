'use client'

import React, { useState } from 'react'
import {
  Sparkles,
  Type,
  Image as ImageIcon,
  FileText,
  ShoppingBag,
  Phone,
  Palette,
  Check,
  ChevronDown,
  ChevronUp,
  Layers,
  ArrowRight,
  ExternalLink,
  Smartphone,
  Tablet,
  Monitor
} from 'lucide-react'
import { generateLandingPageFromAnswers, extractAnswersFromComponents } from './generateLandingPageFromAnswers'
import { WizardAnswers, DEFAULT_WIZARD_ANSWERS } from './wizardTypes'

interface InteractiveGuidedEditorProps {
  components: any[]
  canvasBg: string
  merchantProducts: any[]
  merchantServices: any[]
  merchantProfileName?: string
  merchantProfilePhone?: string
  onUpdateComponents: (comps: any[], newBg?: string) => void
  onSwitchToManual: () => void
}

export default function InteractiveGuidedEditor({
  components,
  canvasBg,
  merchantProducts = [],
  merchantServices = [],
  merchantProfileName = '',
  merchantProfilePhone = '',
  onUpdateComponents,
  onSwitchToManual
}: InteractiveGuidedEditorProps) {
  // Extract initial answers from current components
  const [answers, setAnswers] = useState<WizardAnswers>(() => {
    // Ensure essential components exist. If missing, generate defaults using wizard logic.
    const hasHeadline = components.some((c) => c.type === 'headline');
    const hasSub = components.some((c) => c.type === 'subheadline');
    const hasImage = components.some((c) => c.type === 'image');
    const hasProduct = components.some((c) => c.type === 'product_showcase');
    const hasWhats = components.some((c) => c.type === 'whatsapp_button');
    if (!hasHeadline || !hasSub || !hasImage || !hasProduct || !hasWhats) {
      const gen = generateLandingPageFromAnswers({
        ...DEFAULT_WIZARD_ANSWERS,
        businessName: merchantProfileName || '',
        whatsappNumber: merchantProfilePhone || ''
      }, merchantProducts, merchantServices);
      onUpdateComponents(gen.builderComponents, gen.canvasBg);
    }
    return extractAnswersFromComponents(components, {
      ...DEFAULT_WIZARD_ANSWERS,
      businessName: merchantProfileName || '',
      whatsappNumber: merchantProfilePhone || ''
    });
  })
    return extractAnswersFromComponents(components, {
      ...DEFAULT_WIZARD_ANSWERS,
      businessName: merchantProfileName || '',
      whatsappNumber: merchantProfilePhone || ''
    })
  })

  // Open section index
  const [activeSection, setActiveSection] = useState<number>(0)
  const [devicePreview, setDevicePreview] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')

  // Helper to update specific component in the array without touching others
  const updateComponentContent = (type: string, updater: (content: any) => any) => {
    const updated = components.map((comp) => {
      if (comp.type === type) {
        return {
          ...comp,
          content: updater({ ...comp.content })
        }
      }
      return comp
    })
    onUpdateComponents(updated)
  }

  // Update Headline & Subheadline
  const handleHeadlineChange = (headline: string, subheadline: string) => {
    setAnswers((prev) => ({ ...prev, headline, subheadline }))
    const updated = components.map((comp) => {
      if (comp.type === 'headline') {
        return { ...comp, content: { ...comp.content, text: headline } }
      }
      if (comp.type === 'subheadline') {
        return { ...comp, content: { ...comp.content, text: subheadline } }
      }
      return comp
    })
    onUpdateComponents(updated)
  }

  // Update Description
  const handleDescriptionChange = (description: string) => {
    setAnswers((prev) => ({ ...prev, description }))
    const updated = components.map((comp) => {
      if (comp.type === 'content') {
        return { ...comp, content: { ...comp.content, text: description } }
      }
      return comp
    })
    onUpdateComponents(updated)
  }

  // Update Hero Image
  const handleHeroImageChange = (heroImage: string) => {
    setAnswers((prev) => ({ ...prev, heroImage }))
    const updated = components.map((comp) => {
      if (comp.type === 'image') {
        return { ...comp, content: { ...comp.content, src: heroImage } }
      }
      return comp
    })
    onUpdateComponents(updated)
  }

  // Update WhatsApp & Order Button
  const handleWhatsAppChange = (whatsappNumber: string, orderButtonText: string) => {
    setAnswers((prev) => ({ ...prev, whatsappNumber, orderButtonText }))
    const phoneClean = whatsappNumber.replace(/[^0-9]/g, '')
    const phoneFormatted = phoneClean.startsWith('0') ? '62' + phoneClean.slice(1) : phoneClean

    const updated = components.map((comp) => {
      if (comp.type === 'whatsapp_button') {
        return {
          ...comp,
          content: {
            ...comp.content,
            phone: phoneFormatted,
            label: orderButtonText
          }
        }
      }
      if (comp.type === 'floating_whatsapp') {
        return {
          ...comp,
          content: {
            ...comp.content,
            phone: phoneFormatted
          }
        }
      }
      return comp
    })
    onUpdateComponents(updated)
  }

  // Update Product selection
  const handleProductToggle = (productId: string) => {
    const currentSelected = answers.selectedProductIds || []
    const newSelected = currentSelected.includes(productId)
      ? currentSelected.filter((id) => id !== productId)
      : [...currentSelected, productId]

    setAnswers((prev) => ({ ...prev, selectedProductIds: newSelected }))

    const updated = components.map((comp) => {
      if (comp.type === 'product_showcase') {
        return {
          ...comp,
          content: {
            ...comp.content,
            productIds: newSelected
          }
        }
      }
      return comp
    })
    onUpdateComponents(updated)
  }

  // Regenerate with a new design style
  const handleApplyDesignStyle = (style: 'sederhana' | 'menarik' | 'profesional') => {
    const newAnswers = { ...answers, designStyle: style }
    setAnswers(newAnswers)
    const gen = generateLandingPageFromAnswers(newAnswers, merchantProducts, merchantServices)
    onUpdateComponents(gen.builderComponents, gen.canvasBg)
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-slate-100/70 select-none">
      
      {/* ── LEFT PANEL: PANDUAN PERTANYAAN SEDERHANA ──────────────────────── */}
      <div className="w-full md:w-[420px] bg-white border-r border-slate-200 flex flex-col h-full shrink-0 shadow-sm">
        
        {/* Header mode banner */}
        <div className="p-4 border-b border-slate-100 bg-[#E8F8EE]/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#2DB24A] text-white flex items-center justify-center font-bold">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 font-sora">Mode Panduan Sederhana</h3>
              <p className="text-[10px] text-slate-500">Edit bagian landing page melalui panduan mudah</p>
            </div>
          </div>

          <button
            onClick={onSwitchToManual}
            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
            title="Buka Kanvas Drag & Drop"
          >
            <Layers size={12} className="text-[#2DB24A]" /> Ke Editor Manual
          </button>
        </div>

        {/* Scrollable Accordion list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          
          {/* SECTION 1: JUDUL & SLOGAN */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
            <button
              onClick={() => setActiveSection(activeSection === 0 ? -1 : 0)}
              className="w-full px-4 py-3 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Type size={16} className="text-[#2DB24A]" />
                <span className="text-xs font-bold text-slate-900">1. Judul & Slogan Toko</span>
              </div>
              {activeSection === 0 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {activeSection === 0 && (
              <div className="p-4 border-t border-slate-100 space-y-3 bg-[#FAFCFA]">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Judul Utama:</label>
                  <input
                    type="text"
                    value={answers.headline}
                    onChange={(e) => handleHeadlineChange(e.target.value, answers.subheadline)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#2DB24A]"
                    placeholder="Contoh: Aneka Rendang Daging Asli"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Kalimat Pengantar (Sub-Judul):</label>
                  <textarea
                    rows={2}
                    value={answers.subheadline}
                    onChange={(e) => handleHeadlineChange(answers.headline, e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#2DB24A]"
                    placeholder="Contoh: Dibuat dari bumbu rempah pilihan tanpa pengawet..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: FOTO & BANNER */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
            <button
              onClick={() => setActiveSection(activeSection === 1 ? -1 : 1)}
              className="w-full px-4 py-3 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <ImageIcon size={16} className="text-[#2DB24A]" />
                <span className="text-xs font-bold text-slate-900">2. Foto Utama & Banner</span>
              </div>
              {activeSection === 1 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {activeSection === 1 && (
              <div className="p-4 border-t border-slate-100 space-y-3 bg-[#FAFCFA]">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Link URL Foto Toko:</label>
                  <input
                    type="url"
                    value={answers.heroImage}
                    onChange={(e) => handleHeroImageChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#2DB24A]"
                    placeholder="https://..."
                  />
                </div>
                {answers.heroImage && (
                  <div className="w-full h-28 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                    <img src={answers.heroImage} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECTION 3: DESKRIPSI USAHA */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
            <button
              onClick={() => setActiveSection(activeSection === 2 ? -1 : 2)}
              className="w-full px-4 py-3 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <FileText size={16} className="text-[#2DB24A]" />
                <span className="text-xs font-bold text-slate-900">3. Deskripsi Usaha</span>
              </div>
              {activeSection === 2 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {activeSection === 2 && (
              <div className="p-4 border-t border-slate-100 space-y-3 bg-[#FAFCFA]">
                <textarea
                  rows={3}
                  value={answers.description}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#2DB24A]"
                  placeholder="Ceritakan tentang usaha dan keistimewaan produk Anda..."
                />
              </div>
            )}
          </div>

          {/* SECTION 4: PRODUK DITAMPILKAN */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
            <button
              onClick={() => setActiveSection(activeSection === 3 ? -1 : 3)}
              className="w-full px-4 py-3 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag size={16} className="text-[#2DB24A]" />
                <span className="text-xs font-bold text-slate-900">4. Produk yang Ditampilkan</span>
              </div>
              {activeSection === 3 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {activeSection === 3 && (
              <div className="p-4 border-t border-slate-100 space-y-2 bg-[#FAFCFA]">
                <p className="text-[11px] text-slate-500 mb-2">
                  Centang produk yang ingin dimunculkan pada etalase halaman:
                </p>
                {merchantProducts.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Belum ada produk terdaftar di toko ini.</p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {merchantProducts.map((p) => {
                      const isChecked = (answers.selectedProductIds || []).includes(p.id)
                      return (
                        <div
                          key={p.id}
                          onClick={() => handleProductToggle(p.id)}
                          className={`p-2 rounded-xl border flex items-center justify-between gap-2 text-xs cursor-pointer transition-all ${
                            isChecked ? 'border-[#2DB24A] bg-[#E8F8EE]/60 font-bold' : 'border-slate-200 bg-white'
                          }`}
                        >
                          <span className="truncate">{p.title}</span>
                          <div
                            className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                              isChecked ? 'bg-[#2DB24A] border-[#2DB24A] text-white' : 'border-slate-300'
                            }`}
                          >
                            {isChecked && <Check size={12} />}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECTION 5: KONTAK & WHATSAPP */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
            <button
              onClick={() => setActiveSection(activeSection === 4 ? -1 : 4)}
              className="w-full px-4 py-3 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Phone size={16} className="text-[#2DB24A]" />
                <span className="text-xs font-bold text-slate-900">5. Kontak WhatsApp & Tombol Pesan</span>
              </div>
              {activeSection === 4 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {activeSection === 4 && (
              <div className="p-4 border-t border-slate-100 space-y-3 bg-[#FAFCFA]">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Nomor WhatsApp:</label>
                  <input
                    type="tel"
                    value={answers.whatsappNumber}
                    onChange={(e) => handleWhatsAppChange(e.target.value, answers.orderButtonText)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#2DB24A]"
                    placeholder="081234567890"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Tulisan Tombol:</label>
                  <input
                    type="text"
                    value={answers.orderButtonText}
                    onChange={(e) => handleWhatsAppChange(answers.whatsappNumber, e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#2DB24A]"
                    placeholder="Pesan Sekarang via WhatsApp"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 6: GAYA TAMPILAN */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
            <button
              onClick={() => setActiveSection(activeSection === 5 ? -1 : 5)}
              className="w-full px-4 py-3 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Palette size={16} className="text-[#2DB24A]" />
                <span className="text-xs font-bold text-slate-900">6. Ganti Gaya Desain</span>
              </div>
              {activeSection === 5 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {activeSection === 5 && (
              <div className="p-4 border-t border-slate-100 space-y-2 bg-[#FAFCFA]">
                {[
                  { id: 'sederhana', title: 'Sederhana (Clean & Minimal)' },
                  { id: 'menarik', title: 'Menarik (Vibrant & Promo)' },
                  { id: 'profesional', title: 'Profesional (Trust & Corporate)' }
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleApplyDesignStyle(s.id as any)}
                    className={`w-full p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer flex items-center justify-between ${
                      answers.designStyle === s.id
                        ? 'border-[#2DB24A] bg-[#E8F8EE] text-[#0F5132]'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>{s.title}</span>
                    {answers.designStyle === s.id && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  )
}

