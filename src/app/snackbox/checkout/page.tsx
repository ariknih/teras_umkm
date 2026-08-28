'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  MapPin,
  Package,
  Truck,
  ShieldCheck,
  ArrowLeft,
  ChevronRight,
  Sparkles,
  ShoppingBag,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { useSnackbox } from '@/context/SnackboxContext'
import { mockDeliveryOptions } from '@/lib/mock-snackbox'
import { DeliveryOption } from '@/types/snackbox'
import CheckoutSummaryPanel from '@/components/snackbox/CheckoutSummaryPanel'

export default function SnackboxCheckoutPage() {
  const router = useRouter()
  const {
    cart,
    kelurahan,
    totalPiecesCount,
    deliveryFee,
    setDeliveryFee,
    isInsuranceSelected,
    setIsInsuranceSelected,
    summary
  } = useSnackbox()

  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryOption>(mockDeliveryOptions[0])
  const [addressDetail, setAddressDetail] = useState(
    `Jl. Teuku Cik Ditiro No. 42, RT 02 / RW 05, Kelurahan ${kelurahan.name}, Kec. ${kelurahan.kecamatan}, ${kelurahan.kota}, ${kelurahan.postalCode}`
  )
  const [recipientName, setRecipientName] = useState('Budi Prasetyo (Kantor / Rumah)')
  const [recipientPhone, setRecipientPhone] = useState('0812-3456-7890')
  const [eventTimeNote, setEventTimeNote] = useState('Mohon tiba sebelum pukul 09.30 WIB (Acara Meeting Pagi)')
  const [isEditingAddress, setIsEditingAddress] = useState(false)

  const handleDeliveryChange = (opt: DeliveryOption) => {
    setSelectedDelivery(opt)
    setDeliveryFee(opt.price)
  }

  // If cart has no items selected, show empty cart view
  if (cart.items.length === 0 || summary.totalItemsPerBox === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-[#2DB24A] flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Belum Ada Item di Box Anda</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Silakan pilih kue dan snack terlebih dahulu di katalog Snackbox sebelum melanjutkan ke checkout.
          </p>
          <button
            onClick={() => router.push('/snackbox')}
            className="w-full py-3.5 rounded-2xl bg-[#2DB24A] hover:bg-[#24943E] text-white font-bold text-xs transition-colors shadow-sm"
          >
            Kembali ke Katalog Snackbox
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-6">
          <Link href="/snackbox" className="hover:text-[#2DB24A] flex items-center gap-1 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Snackbox</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-900 font-bold">Checkout Snackbox</span>
        </div>

        {/* Page Title */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#2DB24A]" />
            <span>Satu Transaksi Resmi ke Saloka</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Checkout Pesanan Snackbox
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pesanan dari berbagai mitra kue di <strong>Kelurahan {kelurahan.name}</strong> disatukan dalam 1 pengiriman resmi Saloka.
          </p>
        </div>

        {/* Main 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Delivery Address, Order Items, Delivery Options */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            
            {/* ── 1. SECTION: ALAMAT PENGIRIMAN ── */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-50 text-[#2DB24A]">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-base text-slate-900">Alamat Pengiriman Acara</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingAddress(!isEditingAddress)}
                  className="text-xs font-bold text-[#2DB24A] hover:underline"
                >
                  {isEditingAddress ? 'Simpan' : 'Ganti Alamat'}
                </button>
              </div>

              {isEditingAddress ? (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Nama Penerima / Lokasi:</label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={e => setRecipientName(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#2DB24A]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">No. WhatsApp / HP:</label>
                    <input
                      type="text"
                      value={recipientPhone}
                      onChange={e => setRecipientPhone(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#2DB24A]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Alamat Lengkap & Patokan:</label>
                    <textarea
                      rows={2}
                      value={addressDetail}
                      onChange={e => setAddressDetail(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#2DB24A]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Catatan Waktu Tiba Acara:</label>
                    <input
                      type="text"
                      value={eventTimeNote}
                      onChange={e => setEventTimeNote(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#2DB24A]"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs text-slate-700">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <span>{recipientName}</span>
                    <span className="text-slate-400">•</span>
                    <span>{recipientPhone}</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{addressDetail}</p>
                  {eventTimeNote && (
                    <div className="mt-2 pt-2 border-t border-slate-200/60 text-[11px] text-emerald-800 font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#2DB24A]" />
                      <span>{eventTimeNote}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── 2. SECTION: SNACKBOX SALOKA (DAFTAR ISI BOX) ── */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-50 text-[#2DB24A]">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">
                      Isi Paket Snackbox Saloka
                    </h3>
                    <span className="text-[11px] font-semibold text-slate-500">
                      Seller Resmi: <strong>Saloka.id (Middleman Terpadu)</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                    cart.boxType === 'reguler'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    {cart.boxType === 'reguler' ? 'Box Reguler' : 'Box Borongan'}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-slate-900 text-white">
                    {cart.boxCount} Box
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="divide-y divide-slate-100">
                {cart.items.filter(i => i.selected).map(item => {
                  const totalLine = item.product.price * item.quantity * cart.boxCount
                  return (
                    <div key={item.product.id} className="py-3 flex items-center gap-3">
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.title}
                        className="w-12 h-12 rounded-xl object-cover bg-slate-100 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                          {item.product.title}
                        </h4>
                        <span className="text-[10px] text-slate-500 font-medium">
                          Rp {item.product.price.toLocaleString('id-ID')} / pcs • Kategori: {item.product.category}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-slate-700 block">
                          {item.quantity * cart.boxCount} pcs total
                        </span>
                        <span className="text-xs font-extrabold text-slate-900">
                          Rp {totalLine.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-100 text-xs text-emerald-900 flex items-center justify-between">
                <span>Total Kue Terpilih: <strong>{totalPiecesCount} pcs per box</strong></span>
                <span className="font-extrabold text-sm text-emerald-950">
                  Subtotal: Rp {summary.subtotalGross.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* ── 3. SECTION: OPSI PENGIRIMAN ── */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-[#2DB24A]">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Opsi Kurir Pengiriman</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Armada kurir makanan berpendingin Saloka</p>
                </div>
              </div>

              {/* Delivery Options Radio */}
              <div className="space-y-2.5">
                {mockDeliveryOptions.map(opt => {
                  const isSelected = selectedDelivery.id === opt.id
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleDeliveryChange(opt)}
                      className={`w-full p-4 rounded-2xl border transition-all text-left flex items-start justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50/70 border-[#2DB24A] shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs sm:text-sm text-slate-900">{opt.name}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {opt.serviceType}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{opt.estimate}</p>
                        <p className="text-[11px] text-slate-400 font-medium">{opt.description}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-extrabold text-xs sm:text-sm text-slate-900 block">
                          Rp {opt.price.toLocaleString('id-ID')}
                        </span>
                        <div className={`w-4 h-4 rounded-full border mt-1.5 ml-auto flex items-center justify-center ${
                          isSelected ? 'border-[#2DB24A] bg-[#2DB24A]' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Asuransi Pengiriman Checkbox */}
              <div className="pt-3 border-t border-slate-100 flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <input
                  type="checkbox"
                  id="insurance-checkbox"
                  checked={isInsuranceSelected}
                  onChange={e => setIsInsuranceSelected(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-[#2DB24A] rounded border-slate-300 focus:ring-[#2DB24A] cursor-pointer"
                />
                <label htmlFor="insurance-checkbox" className="text-xs text-slate-700 cursor-pointer select-none">
                  <span className="font-bold text-slate-900 block">
                    Paket Asuransi Pengiriman Saloka (+Rp 2.000)
                  </span>
                  <span className="text-slate-500 text-[11px] leading-relaxed block mt-0.5">
                    Garansi ganti rugi 100% jika box rusak, penyok, atau basah akibat cuaca saat pengiriman.
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Checkout Summary & Sticky Payment Panel */}
          <div className="lg:col-span-5 xl:col-span-4">
            <CheckoutSummaryPanel />
          </div>
        </div>
      </div>
    </div>
  )
}
