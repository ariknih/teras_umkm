'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ShieldCheck,
  Tag,
  Lock,
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
    const newOrderId = `SB-${Date.now().toString().slice(-8)}`
    
    setTimeout(() => {
      setIsProcessing(false)
      setIsOrderComplete(true)
      setCompletedOrderId(newOrderId)
      if (onSuccessOrder) onSuccessOrder(newOrderId)
      clearCart()
    }, 1200)
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-4 sticky top-24 shadow-2xs">
        {/* Header */}
        <div>
          <h3 className="font-bold text-sm text-slate-900 leading-tight">
            Metode Pembayaran
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Satu transaksi terpadu ke rekening resmi Saloka
          </p>
        </div>

        {/* Payment Methods Radio List */}
        <div className="space-y-2">
          {mockPaymentMethods.map(pm => {
            const isSelected = selectedPayment.id === pm.id
            return (
              <button
                key={pm.id}
                type="button"
                onClick={() => setSelectedPayment(pm)}
                className={`w-full p-2.5 rounded-lg border transition-all flex items-center justify-between text-left cursor-pointer ${
                  isSelected
                    ? 'bg-[#E8F5E9]/80 border-[#006E24] shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] ${
                    isSelected ? 'bg-[#006E24] text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {pm.category === 'QRIS' ? (
                      <QrCode className="w-3.5 h-3.5" />
                    ) : pm.category === 'SALOKAPAY' ? (
                      <Wallet className="w-3.5 h-3.5" />
                    ) : (
                      <Building className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">{pm.name}</span>
                    <span className="text-[10px] text-slate-400 font-medium">Otomatis Terverifikasi</span>
                  </div>
                </div>

                <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                  isSelected ? 'border-[#006E24] bg-[#006E24]' : 'border-slate-300 bg-white'
                }`}>
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </button>
            )
          })}
        </div>

        {/* Promo Code */}
        <div className="pt-2 border-t border-slate-100">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
            <Tag className="w-3.5 h-3.5 text-[#006E24]" />
            <span>Punya Kode Voucher?</span>
          </label>
          <form onSubmit={handleApplyPromo} className="flex gap-1.5">
            <input
              type="text"
              value={promoInput}
              onChange={e => setPromoInput(e.target.value)}
              placeholder="Cth: SALOKASNACK"
              className="flex-1 px-3 py-1.5 bg-[#F5F7FA] border border-slate-200 rounded-lg text-xs font-semibold uppercase text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#006E24] transition-all"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shrink-0 cursor-pointer"
            >
              Pakai
            </button>
          </form>

          {promoFeedback.message && (
            <p className={`text-[11px] mt-1 font-medium ${promoFeedback.success ? 'text-[#006E24]' : 'text-rose-600'}`}>
              {promoFeedback.message}
            </p>
          )}
        </div>

        {/* Invoice Summary */}
        <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1">
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
            <span>Biaya Layanan Platform:</span>
            <span className="font-bold text-slate-900">
              Rp {summary.serviceFee.toLocaleString('id-ID')}
            </span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-[#006E24] font-bold">
              <span>Diskon Promo:</span>
              <span>- Rp {discountAmount.toLocaleString('id-ID')}</span>
            </div>
          )}

          {/* Grand Total */}
          <div className="pt-2 border-t border-slate-200 flex items-baseline justify-between text-slate-900">
            <div>
              <span className="text-[11px] font-bold text-slate-500 block">Total Tagihan:</span>
              <span className="text-lg font-black text-slate-950">
                Rp {summary.totalBill.toLocaleString('id-ID')}
              </span>
            </div>
            <span className="text-[10px] font-bold text-[#006E24] bg-[#E8F5E9] px-2 py-0.5 rounded border border-[#C8E6C9]">
              {cart.boxType === 'reguler' ? 'Box Reguler' : 'Box Borongan'}
            </span>
          </div>
        </div>

        {/* Security Trust badge */}
        <div className="p-2.5 bg-[#E8F5E9]/60 border border-[#C8E6C9] rounded-lg flex items-start gap-2 text-[11px] text-[#006E24] leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-[#006E24] shrink-0 mt-0.5" />
          <span>
            <strong>Jaminan Transaksi Saloka:</strong> Pembayaran aman, kue dijamin higienis dan tiba sebelum waktu acara.
          </span>
        </div>

        {/* Pay Button */}
        <button
          type="button"
          onClick={handlePayNow}
          disabled={isProcessing || summary.totalItemsPerBox === 0}
          className="w-full py-3 px-4 rounded-lg bg-[#006E24] hover:bg-[#005a1d] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
        >
          {isProcessing ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Memproses Transaksi...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5" />
              <span>Bayar Sekarang (Rp {summary.totalBill.toLocaleString('id-ID')})</span>
            </div>
          )}
        </button>
      </div>

      {/* Order Success Modal */}
      {isOrderComplete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 text-center shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-[#E8F5E9] text-[#006E24] flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>

            <div>
              <span className="text-[10px] font-extrabold text-[#006E24] uppercase tracking-wider">
                Pembayaran Sukses
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                Pesanan Snackbox Terkonfirmasi!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                ID Pesanan: <strong className="text-slate-800">{completedOrderId}</strong>
              </p>
            </div>

            <div className="p-3 bg-[#F5F7FA] rounded-xl text-left text-xs space-y-1.5 border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-500">Metode:</span>
                <span className="font-bold text-slate-800">{selectedPayment.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total:</span>
                <span className="font-extrabold text-[#006E24]">
                  Rp {summary.totalBill.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jumlah:</span>
                <span className="font-bold text-slate-800">{cart.boxCount} Box ({cart.boxType === 'reguler' ? 'Reguler' : 'Borongan'})</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => router.push('/orders')}
                className="w-full py-2.5 rounded-lg bg-[#006E24] hover:bg-[#005a1d] text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Lihat Status Pesanan
              </button>
              <button
                type="button"
                onClick={() => router.push('/snackbox')}
                className="w-full py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Kembali ke Snackbox
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
