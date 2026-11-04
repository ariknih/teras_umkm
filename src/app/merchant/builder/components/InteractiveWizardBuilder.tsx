'use client'

import React, { useState } from 'react'
import { WizardAnswers, BusinessCategory, DesignImpression, PreferredLayout, DEFAULT_WIZARD_ANSWERS } from './wizardTypes'
import { Check, X, ArrowRight } from 'lucide-react'

interface InteractiveWizardBuilderProps {
  initialAnswers?: Partial<WizardAnswers>
  merchantProducts: any[]
  merchantServices: any[]
  merchantProfileName?: string
  merchantProfilePhone?: string
  onComplete: (answers: WizardAnswers) => void
  onCancel: () => void
}

export default function InteractiveWizardBuilder({
  initialAnswers,
  merchantProducts = [],
  merchantServices = [],
  merchantProfileName = '',
  merchantProfilePhone = '',
  onComplete,
  onCancel,
}: InteractiveWizardBuilderProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 4

  const [answers, setAnswers] = useState<WizardAnswers>(() => ({
    ...DEFAULT_WIZARD_ANSWERS,
    businessName: initialAnswers?.businessName || merchantProfileName || '',
    businessCategory: initialAnswers?.businessCategory || 'makanan',
    designImpression: initialAnswers?.designImpression || 'modern',
    preferredLayout: initialAnswers?.preferredLayout || 'fokus_produk',
  }))

  const CATEGORIES: { id: BusinessCategory; label: string }[] = [
    { id: 'makanan', label: 'Makanan & Minuman' },
    { id: 'fashion', label: 'Fashion & Pakaian' },
    { id: 'kecantikan', label: 'Produk Kecantikan' },
    { id: 'kerajinan', label: 'Kerajinan & Produk Lokal' },
    { id: 'jasa', label: 'Jasa & Layanan' },
    { id: 'lainnya', label: 'Lainnya' },
  ]

  const IMPRESSIONS: { id: DesignImpression; label: string }[] = [
    { id: 'modern', label: 'Modern' },
    { id: 'profesional', label: 'Profesional' },
    { id: 'ramah', label: 'Ramah' },
    { id: 'elegan', label: 'Elegan' },
  ]

  const LAYOUTS: { id: PreferredLayout; label: string; thumb: string }[] = [
    { id: 'fokus_produk', label: 'Fokus Produk', thumb: '/assets/layouts/fokus_produk.png' },
    { id: 'fokus_promosi', label: 'Fokus Promosi', thumb: '/assets/layouts/fokus_promosi.png' },
    { id: 'fokus_informasi', label: 'Fokus Informasi', thumb: '/assets/layouts/fokus_informasi.png' },
  ]

  const handleNext = () => {
    if (currentStep === 1 && !answers.businessName.trim()) {
      alert('Mohon masukkan nama usaha atau toko Anda.')
      return
    }
    if (currentStep === 2 && !answers.businessCategory) {
      alert('Pilih kategori usaha.')
      return
    }
    if (currentStep === 3 && !answers.designImpression) {
      alert('Pilih kesan landing page.')
      return
    }
    if (currentStep < totalSteps) {
      setCurrentStep((s) => s + 1)
    } else {
      onComplete(answers)
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1)
  }

  const progressPercent = Math.round((currentStep / totalSteps) * 100)

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 select-none font-sans overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-100 my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 sm:px-8 pt-6 pb-4 flex items-center justify-between bg-white shrink-0">
          <span className="text-xl font-bold text-slate-900 tracking-tight font-sora">Saloka</span>
          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1 bg-[#E8F8EE] text-[#00883E] font-bold text-xs rounded-full">Buat Halaman Usaha</span>
            <button onClick={onCancel} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer" title="Tutup">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="w-full border-t border-slate-100" />

        {/* Progress */}
        <div className="px-6 sm:px-8 pt-5 pb-1">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-extrabold uppercase tracking-wider text-slate-700 text-[11px]">LANGKAH {currentStep} DARI {totalSteps}</span>
            <span className="font-extrabold text-[#00883E] text-[11px]">{progressPercent}% selesai</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-[#00883E] h-full rounded-full transition-all duration-300 ease-out" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8 min-h-[380px] flex flex-col justify-between">
          {/* STEP 1: Informasi Usaha */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Apa nama usaha Anda?</h2>
              <p className="text-sm text-slate-500 mt-1">Masukkan nama toko atau usaha yang ingin ditampilkan.</p>
              <input
                type="text"
                value={answers.businessName}
                onChange={(e) => setAnswers((prev) => ({ ...prev, businessName: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#2DB24A]"
                placeholder="Contoh: Aneka Rendang Daging Asli"
              />
            </div>
          )}

          {/* STEP 2: Bidang Usaha */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Usaha Anda bergerak di bidang apa?</h2>
              <p className="text-sm text-slate-500 mt-1">Pilih kategori yang paling tepat.</p>
              <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setAnswers((prev) => ({ ...prev, businessCategory: cat.id }))}
                    className={`p-2 rounded-xl border text-sm font-medium ${answers.businessCategory === cat.id ? 'border-[#2DB24A] bg-[#E8F8EE]' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Kesan Landing Page */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Kesan seperti apa yang ingin ditampilkan?</h2>
              <p className="text-sm text-slate-500 mt-1">Pilih satu dari pilihan berikut.</p>
              <div className="grid grid-cols-2 gap-3">
                {IMPRESSIONS.map((imp) => (
                  <button
                    key={imp.id}
                    type="button"
                    onClick={() => setAnswers((prev) => ({ ...prev, designImpression: imp.id }))}
                    className={`p-2 rounded-xl border text-sm font-medium ${answers.designImpression === imp.id ? 'border-[#2DB24A] bg-[#E8F8EE]' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                  >
                    {imp.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Preferensi Layout */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Layout seperti apa yang Anda sukai?</h2>
              <p className="text-sm text-slate-500 mt-1">Pilih satu dan lihat preview.</p>
              <div className="grid grid-cols-1 gap-4">
                {LAYOUTS.map((lay) => (
                  <button
                    key={lay.id}
                    type="button"
                    onClick={() => setAnswers((prev) => ({ ...prev, preferredLayout: lay.id }))}
                    className={`flex items-center gap-4 p-2 rounded-xl border ${answers.preferredLayout === lay.id ? 'border-[#2DB24A] bg-[#E8F8EE]' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                  >
                    <img src={lay.thumb} alt={lay.label} className="w-20 h-12 object-cover rounded" />
                    <span className="font-medium">{lay.label}</span>
                    {answers.preferredLayout === lay.id && <Check size={16} className="text-[#2DB24A]" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 sm:px-8 py-4 flex justify-between border-t border-slate-100 bg-white">
          <button
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Kembali
          </button>
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-4 py-2 bg-[#2DB24A] text-white rounded"
          >
            {currentStep < totalSteps ? (
              <>
                Selanjutnya <ArrowRight size={14} />
              </>
            ) : (
              <>
                Selesai <Check size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
