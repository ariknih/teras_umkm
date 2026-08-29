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
  ShoppingBag,
  CheckCircle2
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

  if (cart.items.length === 0 || summary.totalItemsPerBox === 0) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-white rounded-xl p-6 text-center border border-slate-200 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#E8F5E9] text-[#006E24] flex items-center justify-center mx-auto">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Belum Ada Item di Box Anda</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Silakan pilih kue dan jajanan terlebih dahulu di katalog Snackbox.
          </p>
          <button
            onClick={() => router.push('/snackbox')}
            className="w-full py-2.5 rounded-lg bg-[#006E24] hover:bg-[#005a1d] text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
          >
            Kembali ke Katalog Snackbox
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-24 pt-5 font-inter">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-4">
          <Link href="/snackbox" className="hover:text-[#006E24] flex items-center gap-1 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Snackbox</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-900 font-bold">Checkout Snackbox</span>
        </div>

        {/* Page Title */}
        <div className="mb-5 pb-3 border-b border-slate-200/80">
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">
              Checkout Pesanan Snackbox
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#E8F5E9] text-[#006E24] border border-[#C8E6C9] flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              1 Transaksi Resmi ke Saloka
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Pesanan kue mitra di <strong>Kelurahan {kelurahan.name}</strong> disatukan dalam 1 pengiriman terpadu Saloka.
          </p>
        </div>

        {/* Main 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Delivery Address, Order Items, Delivery Options */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            
            {/* ── 1. SECTION: ALAMAT PENGIRIMAN ── */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#006E24]" />
                  <h3 className="font-bold text-sm text-slate-900">Alamat Pengiriman Acara</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingAddress(!isEditingAddress)}
                  className="text-xs font-bold text-[#006E24] hover:underline cursor-pointer"
                >
                  {isEditingAddress ? 'Simpan' : 'Ganti Alamat'}
                </button>
              </div>

              {isEditingAddress ? (
                <div className="space-y-2.5 pt-1">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Nama Penerima / Lokasi:</label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={e => setRecipientName(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#006E24]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">No. WhatsApp / HP:</label>
                    <input
                      type="text"
                      value={recipientPhone}
                      onChange={e => setRecipientPhone(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#006E24]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Alamat Lengkap & Patokan:</label>
                    <textarea
                      rows={2}
                      value={addressDetail}
                      onChange={e => setAddressDetail(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#006E24]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Catatan Waktu Tiba Acara:</label>
                    <input
                      type="text"
                      value={eventTimeNote}
                      onChange={e => setEventTimeNote(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#006E24]"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-[#F5F7FA] border border-slate-100 space-y-1 text-xs text-slate-700">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <span>{recipientName}</span>
                    <span className="text-slate-400">•</span>
                    <span>{recipientPhone}</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{addressDetail}</p>
                  {eventTimeNote && (
                    <div className="mt-1.5 pt-1.5 border-t border-slate-200/60 text-[11px] text-[#006E24] font-medium flex items-center gap-1">
                      <span>⏰ {eventTimeNote}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── 2. SECTION: SNACKBOX SALOKA (DAFTAR ISI BOX) ── */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-market-green-600" />
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      Snackbox Saloka
                    </h3>
                    <span className="text-[10px] text-slate-500">
                      Seller Resmi: <strong>Saloka.id</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-bold border bg-market-green-50 text-market-green-700 border-market-green-200">
                    {cart.boxType === 'reguler' ? 'Box Reguler' : 'Box Borongan'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-slate-900 text-white">
                    {cart.boxCount} Box
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="divide-y divide-slate-100">
                {cart.items.filter(i => i.selected).map(item => {
                  const totalLine = item.product.price * item.quantity * cart.boxCount
                  return (
                    <div key={item.product.id} className="py-2.5 flex items-center gap-3">
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.title}
                        className="w-11 h-11 rounded-lg object-cover bg-slate-100 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-xs text-slate-900 truncate">
                          {item.product.title}
                        </h4>
                        <span className="text-[10px] text-slate-500">
                          Rp {item.product.price.toLocaleString('id-ID')} / pcs • {item.product.category}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-medium text-slate-600 block">
                          {item.quantity * cart.boxCount} pcs total
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          Rp {totalLine.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="p-2.5 bg-[#E8F5E9]/60 rounded-lg border border-[#C8E6C9] text-xs text-[#006E24] flex items-center justify-between">
                <span>Total Kue Terpilih: <strong>{totalPiecesCount} pcs per box</strong></span>
                <span className="font-bold text-slate-900">
                  Subtotal: Rp {summary.subtotalGross.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* ── 3. SECTION: OPSI PENGIRIMAN ── */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#006E24]" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Opsi Pengiriman</h3>
                  <p className="text-[11px] text-slate-500">Armada pengantar makanan berpendingin Saloka</p>
                </div>
              </div>

              {/* Delivery Options Radio */}
              <div className="space-y-2">
                {mockDeliveryOptions.map(opt => {
                  const isSelected = selectedDelivery.id === opt.id
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleDeliveryChange(opt)}
                      className={`w-full p-3 rounded-lg border transition-all text-left flex items-start justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-[#E8F5E9]/80 border-[#006E24] shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{opt.name}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                            {opt.serviceType}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">{opt.estimate}</p>
                        <p className="text-[10px] text-slate-400 font-normal">{opt.description}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-bold text-xs text-slate-900 block">
                          Rp {opt.price.toLocaleString('id-ID')}
                        </span>
                        <div className={`w-3.5 h-3.5 rounded-full border mt-1.5 ml-auto flex items-center justify-center ${
                          isSelected ? 'border-[#006E24] bg-[#006E24]' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <div className="w-1 h-1 rounded-full bg-white" />}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Asuransi Pengiriman Checkbox */}
              <div className="pt-2 border-t border-slate-100 flex items-start gap-2.5 p-3 rounded-lg bg-[#F5F7FA] border border-slate-200/70">
                <input
                  type="checkbox"
                  id="insurance-checkbox"
                  checked={isInsuranceSelected}
                  onChange={e => setIsInsuranceSelected(e.target.checked)}
                  className="mt-0.5 w-3.5 h-3.5 text-[#006E24] rounded border-slate-300 focus:ring-[#006E24] cursor-pointer"
                />
                <label htmlFor="insurance-checkbox" className="text-xs text-slate-700 cursor-pointer select-none">
                  <span className="font-bold text-slate-900 block">
                    Paket Asuransi Pengiriman (+Rp 2.000)
                  </span>
                  <span className="text-slate-500 text-[11px] leading-relaxed block mt-0.5">
                    Garansi ganti rugi 100% jika kemasan box basah atau rusak di perjalanan.
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
