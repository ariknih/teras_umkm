'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ShieldCheck,
  CreditCard,
  Tag,
  CheckCircle2,
  Lock,
  Sparkles,
  ArrowRight,
  QrCode,
  Wallet,
  Building,
  Check
} from 'lucide-react'
import { useSnackbox } from '@/context/SnackboxContext'
import { mockPaymentMethods } from '@/lib/mock-snackbox'
import { PaymentMethodOption } from '@/types/snackbox'

interface CheckoutSummaryPanelProps {
  onSuccessOrder?: (orderId: string) => void
}

export default function CheckoutSummaryPanel({ onSuccessOrder }: CheckoutSummaryPanelProps) {
  const router = useRouter()
  const {
    cart,
    summary,
    promoCode,
    setPromoCode,
    discountAmount,
    applyPromo,
    isInsuranceSelected,
    clearCart
  } = useSnackbox()

  const [selectedPayment, setSelectedPayment] = useState<PaymentMethodOption>(mockPaymentMethods[0])
  const [promoInput, setPromoInput] = useState(promoCode)
  const [promoFeedback, setPromoFeedback] = useState<{ success?: boolean; message?: string }>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [isOrderComplete, setIsOrderComplete] = useState(false)
  const [completedOrderId, setCompletedOrderId] = useState('')

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault()
    if (!promoInput.trim()) return
    const res = applyPromo(promoInput)
    setPromoFeedback(res)
    setPromoCode(promoInput)
  }

  const handlePayNow = () => {
    if (summary.totalItemsPerBox === 0) return

    setIsProcessing(true)
    const newOrderId = `SB-${Date.now()}`
    
    setTimeout(() => {
      setIsProcessing(false)
      setIsOrderComplete(true)
      setCompletedOrderId(newOrderId)
      if (onSuccessOrder) onSuccessOrder(newOrderId)
      clearCart()
    }, 1500)
  }

  return (
    <>
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-6 sticky top-24">
        {/* Header */}
        <div>
          <h3 className="font-extrabold text-base text-slate-900 leading-tight">
            Metode Pembayaran
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Satu transaksi terpadu ke rekening resmi Saloka
          </p>
        </div>

        {/* Payment Methods Radio List */}
        <div className="space-y-2.5">
          {mockPaymentMethods.map(pm => {
            const isSelected = selectedPayment.id === pm.id
            return (
              <button
                key={pm.id}
                type="button"
                onClick={() => setSelectedPayment(pm)}
                className={`w-full p-3 rounded-2xl border transition-all flex items-center justify-between text-left cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-50/70 border-[#2DB24A] shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-[10px] ${
                    isSelected ? 'bg-[#2DB24A] text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {pm.category === 'QRIS' ? (
                      <QrCode className="w-4 h-4" />
                    ) : pm.category === 'SALOKAPAY' ? (
                      <Wallet className="w-4 h-4" />
                    ) : (
                      <Building className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">{pm.name}</span>
                    <span className="text-[10px] text-slate-400 font-medium">Verifikasi Otomatis Instan</span>
                  </div>
                </div>

                <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                  isSelected ? 'border-[#2DB24A] bg-[#2DB24A]' : 'border-slate-300 bg-white'
                }`}>
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </button>
            )
          })}
        </div>

        {/* Promo Code Input */}
        <div className="pt-2 border-t border-slate-100">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
            <Tag className="w-3.5 h-3.5 text-[#2DB24A]" />
            <span>Punya Kode Promo / Voucher?</span>
          </label>
          <form onSubmit={handleApplyPromo} className="flex gap-2">
            <input
              type="text"
              value={promoInput}
              onChange={e => setPromoInput(e.target.value)}
              placeholder="Cth: SALOKASNACK"
              className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold uppercase text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#2DB24A] focus:bg-white transition-all"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shrink-0"
            >
              Gunakan
            </button>
          </form>

          {promoFeedback.message && (
            <p className={`text-[11px] mt-1.5 font-medium ${promoFeedback.success ? 'text-emerald-700' : 'text-rose-600'}`}>
              {promoFeedback.message}
            </p>
          )}
        </div>

        {/* Invoice Summary */}
        <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs text-slate-600">
          <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider mb-2">
            Ringkasan Pembayaran
          </h4>

          <div className="flex justify-between">
            <span>Subtotal Snackbox ({summary.totalItemsPerBox} kue × {cart.boxCount} box):</span>
            <span className="font-bold text-slate-900">
              Rp {summary.subtotalGross.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="flex justify-between">
            <span>Ongkos Kirim Khusus Snackbox:</span>
            <span className="font-bold text-slate-900">
              Rp {summary.deliveryFee.toLocaleString('id-ID')}
            </span>
          </div>

          {isInsuranceSelected && (
            <div className="flex justify-between">
              <span>Paket Asuransi Pengiriman:</span>
              <span className="font-bold text-slate-900">
                Rp {summary.insuranceFee.toLocaleString('id-ID')}
              </span>
            </div>
          )}

          <div className="flex justify-between">
            <span>Biaya Layanan Platform Saloka:</span>
            <span className="font-bold text-slate-900">
              Rp {summary.serviceFee.toLocaleString('id-ID')}
            </span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-emerald-700 font-bold">
              <span>Diskon Voucher Promo:</span>
              <span>- Rp {discountAmount.toLocaleString('id-ID')}</span>
            </div>
          )}

          {/* Grand Total */}
          <div className="pt-3 border-t border-slate-200 flex items-baseline justify-between text-slate-900">
            <div>
              <span className="text-xs font-bold text-slate-500 block">Total Tagihan:</span>
              <span className="text-xl font-extrabold text-slate-950">
                Rp {summary.totalBill.toLocaleString('id-ID')}
              </span>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
              {cart.boxType === 'reguler' ? 'Box Reguler' : 'Box Borongan'}
            </span>
          </div>
        </div>

        {/* Middleman Trust Seal */}
        <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl flex items-start gap-2.5 text-[11px] text-emerald-900 leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-[#2DB24A] shrink-0 mt-0.5" />
          <span>
            <strong>Jaminan Transaksi Saloka:</strong> Pembayaran Anda ditampung secara aman di sistem Saloka hingga pesanan snackbox tiba di lokasi acara dalam kondisi sempurna.
          </span>
        </div>

        {/* Pay Button */}
        <button
          type="button"
          onClick={handlePayNow}
          disabled={isProcessing || summary.totalItemsPerBox === 0}
          className="w-full py-4 px-6 rounded-2xl bg-[#2DB24A] hover:bg-[#24943E] disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-emerald-600/30 active:scale-95 cursor-pointer"
        >
          {isProcessing ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Memproses Pembayaran...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span>Bayar Sekarang (Rp {summary.totalBill.toLocaleString('id-ID')})</span>
            </div>
          )}
        </button>
      </div>

      {/* Order Success Modal */}
      {isOrderComplete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 text-center shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#2DB24A] flex items-center justify-center mx-auto shadow-sm">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div>
              <span className="text-[11px] font-extrabold text-[#2DB24A] uppercase tracking-wider">
                Transaksi Berhasil
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                Pesanan Snackbox Terkonfirmasi!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                ID Pesanan: <strong className="text-slate-800">{completedOrderId}</strong>
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl text-left text-xs space-y-2 border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-500">Metode Pembayaran:</span>
                <span className="font-bold text-slate-800">{selectedPayment.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Pembayaran:</span>
                <span className="font-extrabold text-emerald-800">
                  Rp {summary.totalBill.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jumlah Box:</span>
                <span className="font-bold text-slate-800">{cart.boxCount} Box ({cart.boxType === 'reguler' ? 'Reguler' : 'Borongan'})</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Dapur mitra Saloka di kelurahanmu sedang menyiapkan kue segar. Kurir kami akan mengantar tepat sebelum acara dimulai.
            </p>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => router.push('/orders')}
                className="w-full py-3.5 rounded-2xl bg-[#2DB24A] hover:bg-[#24943E] text-white font-bold text-xs transition-colors shadow-md"
              >
                Lihat Status Pesanan & Pelacakan
              </button>
              <button
                type="button"
                onClick={() => router.push('/snackbox')}
                className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                Kembali ke Katalog Snackbox
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
