'use client'

import React, { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { getOrderDetail, updateOrderTracking } from '@/app/actions/orders'
import { createReview } from '@/app/actions/reviews'
import { getActivePaymentMethods } from '@/app/actions/wallet-affiliate'
import {
  CheckCircle2,
  Package,
  Truck,
  Home,
  Star,
  ArrowLeft,
  Copy,
  FileText,
  MessageCircle,
  ExternalLink
} from 'lucide-react'
import { goeyToast } from 'goey-toast'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function OrderDetailPage({ params }: PageProps) {
  const { id } = use(params)
  
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dynamicPayments, setDynamicPayments] = useState<any[]>([])
  
  // Review form states
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewedProductIds, setReviewedProductIds] = useState<Set<string>>(new Set())
  const [completing, setCompleting] = useState(false)
  const [copiedResi, setCopiedResi] = useState(false)

  const handleCompleteOrder = async () => {
    if (!confirm('Apakah Anda yakin pesanan sudah diterima dengan baik?')) return
    setCompleting(true)
    try {
      const res = await updateOrderTracking(id, 'DELIVERED', 'Pesanan telah diterima oleh pembeli.')
      if (res.error) {
        goeyToast.error(res.error)
      } else {
        goeyToast.success('Pesanan berhasil diselesaikan!')
        await fetchOrderDetail()
      }
    } catch (err: any) {
      goeyToast.error(err.message || 'Gagal menyelesaikan pesanan.')
    } finally {
      setCompleting(false)
    }
  }

  const fetchOrderDetail = async () => {
    try {
      const res = await getOrderDetail(id)
      if (res.order) {
        setOrder(res.order)
        const prods = new Set<string>()
        res.order.items.forEach((it: any) => {
          if (it.reviewed) prods.add(it.productId)
        })
        setReviewedProductIds(prods)
        
        if (res.order.status !== 'COMPLETED' && res.order.status !== 'CANCELLED' && res.order.bumpSales?.startsWith('MANUAL_')) {
          try {
            const payments = await getActivePaymentMethods()
            setDynamicPayments(payments)
          } catch (e) {}
        }
      } else if (res) {
        setOrder(res)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrderDetail()
  }, [id])

  const handleReviewSubmit = async (productId: string, e: React.FormEvent) => {
    e.preventDefault()
    setReviewSuccess(null)
    setReviewError(null)
    setSubmittingReview(true)

    try {
      const res = await createReview(productId, rating, comment, id)
      if (res.error) {
        setReviewError(res.error)
      } else {
        setReviewSuccess('Terima kasih! Ulasan Anda berhasil dikirim.')
        setComment('')
        setReviewedProductIds(prev => {
          const next = new Set(prev)
          next.add(productId)
          return next
        })
      }
    } catch (err: any) {
      setReviewError(err.message || 'Gagal mengirim ulasan.')
    } finally {
      setSubmittingReview(false)
    }
  }

  const copyTrackingResi = (resi: string) => {
    navigator.clipboard.writeText(resi)
    setCopiedResi(true)
    goeyToast.success('Nomor resi berhasil disalin!')
    setTimeout(() => setCopiedResi(false), 3000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center pt-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-slate-200 border-t-[#006E24] rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-700">Memuat rincian pesanan...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6 pt-24 text-center">
        <div className="bg-white border border-slate-200 p-8 rounded-3xl max-w-md shadow-xs space-y-4">
          <div className="w-14 h-14 rounded-full bg-red-50 text-rose-600 flex items-center justify-center mx-auto text-2xl font-bold">
            !
          </div>
          <h2 className="font-extrabold text-base text-slate-900">Pesanan Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500">ID Pesanan #{id} tidak terdaftar di sistem atau telah dihapus.</p>
          <Link href="/orders" className="px-6 py-2.5 bg-[#006E24] text-white text-xs font-bold rounded-xl inline-block">
            Kembali ke Daftar Pesanan
          </Link>
        </div>
      </div>
    )
  }

  // Stepper state determination
  const trackingSteps = order.tracking || []
  let currentStatus = trackingSteps.length > 0 ? trackingSteps[trackingSteps.length - 1].status : 'CONFIRMED'
  if (order.status === 'COMPLETED') {
    currentStatus = 'DELIVERED'
  }

  const statuses = [
    { key: 'CONFIRMED', label: 'Dikonfirmasi', icon: CheckCircle2, description: 'Pembayaran terverifikasi' },
    { key: 'PROCESSING', label: 'Diproses', icon: Package, description: 'Disiapkan oleh merchant' },
    { key: 'SHIPPED', label: 'Dikirim', icon: Truck, description: 'Dalam perjalanan kurir' },
    { key: 'DELIVERED', label: 'Selesai', icon: Home, description: 'Pesanan telah diterima' }
  ]

  const getStatusIndex = (statusKey: string) => {
    return statuses.findIndex(s => s.key === statusKey)
  }

  const currentIdx = getStatusIndex(currentStatus)

  return (
    <div className="min-h-screen bg-[#F8F9FA] pt-24 pb-24 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-[840px] mx-auto space-y-5">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-[#006E24] transition-colors text-xs font-bold"
          >
            <ArrowLeft size={15} />
            <span>Kembali ke Daftar Pesanan</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href={`/orders/${id}/invoice`}
              target="_blank"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-2xs"
            >
              <FileText size={13} className="text-[#006E24]" />
              <span>Lihat Invoice</span>
            </Link>
          </div>
        </div>

        {/* Order Header Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2">
              <span className="text-xs font-extrabold text-slate-900 font-mono">
                Order #{order.id.replace('order-', '')}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase border ${
                order.status === 'COMPLETED'
                  ? 'bg-[#E8F5E9] border-[#C8E6C9] text-[#006E24]'
                  : order.status === 'CANCELLED'
                  ? 'bg-rose-50 border-rose-200 text-rose-600'
                  : 'bg-amber-50 border-amber-200 text-amber-700'
              }`}>
                {order.status === 'COMPLETED' ? 'Selesai' : order.status === 'CANCELLED' ? 'Dibatalkan' : 'Diproses'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Waktu Transaksi: {new Date(order.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>

          {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
            <button
              type="button"
              onClick={handleCompleteOrder}
              disabled={completing}
              className="px-5 py-2.5 bg-[#006E24] hover:bg-[#084e1b] text-white text-xs font-extrabold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <CheckCircle2 size={14} strokeWidth={2.5} />
              <span>{completing ? 'Memproses...' : 'Konfirmasi Pesanan Diterima'}</span>
            </button>
          )}
        </div>

        {/* ── INTERACTIVE TIMELINE STEPPER ── */}
        <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Status Perjalanan Paket
            </h3>
            {order.shippingLabel && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">No. Resi:</span>
                <button
                  onClick={() => copyTrackingResi(order.shippingLabel)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  title="Salin Resi"
                >
                  <span>{order.shippingLabel}</span>
                  <Copy size={11} className={copiedResi ? 'text-[#006E24]' : 'text-slate-400'} />
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {statuses.map((step, idx) => {
              const StepIcon = step.icon
              const isPast = idx <= currentIdx
              const isCurrent = idx === currentIdx
              
              const matchLog = trackingSteps.find((ts: any) => ts.status === step.key)
              const logDate = matchLog ? new Date(matchLog.createdAt).toLocaleDateString('id-ID', {
                hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short'
              }) : null

              return (
                <div key={step.key} className="flex md:flex-col items-start md:items-center text-left md:text-center relative gap-3.5 md:gap-2">
                  {/* Connect Line (Desktop) */}
                  {idx < statuses.length - 1 && (
                    <div className="hidden md:block absolute top-4 left-[calc(50%+20px)] w-[calc(100%-40px)] h-0.5 bg-slate-200 z-0">
                      <div className={`h-full bg-[#006E24] transition-all duration-500 ${idx < currentIdx ? 'w-full' : 'w-0'}`} />
                    </div>
                  )}
                  
                  {/* Circle Indicator */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center z-10 border-2 transition-all duration-300 ${
                    isPast 
                      ? 'bg-[#E8F5E9] border-[#006E24] text-[#006E24] font-bold' 
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  } ${isCurrent ? 'ring-4 ring-[#006E24]/20 scale-105 shadow-xs' : ''}`}>
                    <StepIcon size={16} strokeWidth={isPast ? 2.5 : 2} />
                  </div>

                  <div className="flex-grow">
                    <p className={`text-xs font-extrabold ${isPast ? 'text-slate-900' : 'text-slate-400'}`}>
                      {step.label}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                      {step.description}
                    </p>
                    {logDate && (
                      <p className="text-[10px] font-bold text-[#006E24] mt-1 font-mono">
                        {logDate}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── SHIPPING & PAYMENT SUMMARY ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {/* Shipping Info */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Rincian Pengiriman
            </h4>
            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-slate-400 text-[11px] block">Kurir Pengiriman</span>
                <span className="text-slate-900 font-bold uppercase">{order.courier || 'Reguler Kurir UMKM'}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Alamat Tujuan</span>
                <p className="text-slate-800 font-medium leading-relaxed">{order.shippingAddress || 'Alamat Customer Terdaftar'}</p>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Rincian Pembayaran
            </h4>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal Barang</span>
                <span className="font-semibold text-slate-800">
                  Rp {(order.totalAmount - (order.shippingFee || 0) + (order.discountAmount || 0)).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Biaya Pengiriman</span>
                <span className="font-semibold text-[#006E24]">
                  {order.shippingFee ? `Rp ${order.shippingFee.toLocaleString('id-ID')}` : 'Gratis'}
                </span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-[#006E24] font-bold">
                  <span>Diskon Kupon</span>
                  <span>-Rp {order.discountAmount.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-100 pt-2.5 text-slate-900 font-extrabold text-sm">
                <span>Total Bayar</span>
                <span className="text-[#006E24] font-mono">Rp {order.totalAmount.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── PRODUCTS PURCHASED & REVIEW FORM ── */}
        <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
            Daftar Produk yang Dibeli
          </h3>

          <div className="space-y-4 divide-y divide-slate-100">
            {(order.items || []).map((item: any) => {
              const product = item.product || { title: item.productTitle || 'Produk Saloka', price: item.price }
              const alreadyReviewed = reviewedProductIds.has(item.productId)

              return (
                <div key={item.productId} className="pt-4 first:pt-0 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 h-14 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shrink-0">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">Saloka</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{product.title}</h4>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {item.quantity} x Rp {item.price.toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-mono font-extrabold text-slate-900 shrink-0">
                      Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                    </span>
                  </div>

                  {/* Review form if completed */}
                  {order.status === 'COMPLETED' && !alreadyReviewed && (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                      <h5 className="text-xs font-bold text-slate-800">Beri Ulasan untuk Produk Ini:</h5>
                      {reviewSuccess && <p className="text-xs text-[#006E24] font-bold">✔ {reviewSuccess}</p>}
                      {reviewError && <p className="text-xs text-rose-600 font-bold">⚠️ {reviewError}</p>}
                      
                      <form onSubmit={(e) => handleReviewSubmit(item.productId, e)} className="space-y-3">
                        <div className="flex items-center gap-1.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              className="text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                            >
                              <Star size={18} fill={star <= rating ? 'currentColor' : 'none'} />
                            </button>
                          ))}
                        </div>
                        <textarea
                          placeholder="Ceritakan kepuasan Anda mengenai produk ini..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          rows={2}
                          required
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#006E24]"
                        />
                        <button
                          type="submit"
                          disabled={submittingReview}
                          className="px-4 py-2 bg-[#006E24] hover:bg-[#084e1b] text-white text-xs font-extrabold rounded-xl transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                        >
                          {submittingReview ? 'Mengirim...' : 'Kirim Ulasan'}
                        </button>
                      </form>
                    </div>
                  )}

                  {alreadyReviewed && (
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-[#006E24] text-[11px] font-bold rounded-lg border border-emerald-200">
                      <CheckCircle2 size={13} />
                      <span>Ulasan telah dikirim</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
