'use client'

import React, { useState, useEffect, use, startTransition } from 'react'
import Link from 'next/link'
import { getOrderDetail } from '@/app/actions/orders'
import { createReview } from '@/app/actions/reviews'
import { CheckCircle2, Package, Truck, Home, Star, AlertCircle, ArrowLeft } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function OrderDetailPage({ params }: PageProps) {
  const { id } = use(params)
  
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Review form states
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewedProductIds, setReviewedProductIds] = useState<Set<string>>(new Set())

  const fetchOrderDetail = async () => {
    try {
      const data = await getOrderDetail(id)
      setOrder(data)
      
      // If db connected, check which products user has already reviewed
      if (data) {
        const reviewed = new Set<string>()
        // Fetch product reviews for each item to check if user has already reviewed
        for (const item of data.items || []) {
          try {
            const res = await fetch(`/api/products/${item.productId}/reviews-check`)
            if (res.ok) {
              const check = await res.json()
              if (check.alreadyReviewed) {
                reviewed.add(item.productId)
              }
            }
          } catch (e) {
            // Ignore
          }
        }
        setReviewedProductIds(reviewed)
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
        // Optimistically mark as reviewed
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

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-bg-dark">
        <span className="text-xs font-geist font-bold text-primary tracking-widest uppercase animate-pulse">
          Memuat Lacak Pesanan...
        </span>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-bg-dark p-6 text-center">
        <AlertCircle size={40} className="text-red-400 mb-4" />
        <h2 className="font-sora text-lg font-bold text-text-primary mb-2">Pesanan Tidak Ditemukan</h2>
        <p className="text-xs text-text-secondary max-w-xs mb-6">
          Maaf, data rincian pesanan dengan ID tersebut tidak ditemukan di sistem kami.
        </p>
        <Link href="/orders" className="btn-primary text-xs">
          Kembali ke Pesanan Saya
        </Link>
      </div>
    )
  }

  // Stepper state determination
  const trackingSteps = order.tracking || []
  const currentStatus = trackingSteps.length > 0 ? trackingSteps[trackingSteps.length - 1].status : 'CONFIRMED'

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
    <div className="relative min-h-screen bg-bg-dark pt-28 pb-24 px-6 md:px-10">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1400px] h-[350px] bg-[radial-gradient(circle_at_center,rgba(198,169,107,0.03)_0%,transparent_75%)] pointer-events-none z-0" />

      <div className="relative z-10 max-w-[800px] mx-auto">
        <Link href="/orders" className="inline-flex items-center gap-1.5 text-text-secondary hover:text-primary transition-colors text-xs font-bold uppercase tracking-wider mb-6">
          <ArrowLeft size={14} />
          Kembali
        </Link>

        <div className="mb-10 pb-6 border-b border-border-subtle flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="font-sora text-2xl font-bold text-text-primary mb-1">
              Detail Pelacakan Pesanan.
            </h1>
            <p className="text-xs text-text-secondary">
              ID Pesanan: <span className="text-primary font-bold">{order.id.replace('order-', '#')}</span>
            </p>
          </div>
          <span className={`px-2.5 py-1 rounded text-[9px] font-geist font-black uppercase tracking-widest border ${
            order.status === 'COMPLETED'
              ? 'bg-green-500/10 border-green-500/20 text-green-400'
              : order.status === 'CANCELLED'
              ? 'bg-red-500/10 border-red-500/20 text-red-400'
              : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400 animate-pulse'
          }`}>
            Status: {order.status === 'COMPLETED' ? 'Selesai' : order.status === 'CANCELLED' ? 'Batal' : 'Pending'}
          </span>
        </div>

        {/* TIMELINE STEPPER (Horizontal on desktop, vertical stack on mobile) */}
        <div className="border border-border-subtle bg-surface-dark/40 backdrop-blur-md p-6 rounded-xl shadow-md mb-8">
          <h3 className="font-sora text-xs font-bold text-text-primary mb-8 uppercase tracking-wider">Status Perjalanan Paket</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {statuses.map((step, idx) => {
              const StepIcon = step.icon
              const isPast = idx <= currentIdx
              const isCurrent = idx === currentIdx
              
              // Find matching date in tracking log
              const matchLog = trackingSteps.find((ts: any) => ts.status === step.key)
              const logDate = matchLog ? new Date(matchLog.createdAt).toLocaleDateString('id-ID', {
                hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short'
              }) : null

              return (
                <div key={step.key} className="flex md:flex-col items-start md:items-center text-left md:text-center relative gap-4 md:gap-2">
                  {/* Connect Line */}
                  {idx < statuses.length - 1 && (
                    <div className="hidden md:block absolute top-4 left-[calc(50%+20px)] w-[calc(100%-40px)] h-0.5 bg-border-subtle z-0">
                      <div className={`h-full bg-primary transition-all duration-500 ${idx < currentIdx ? 'w-full' : 'w-0'}`} />
                    </div>
                  )}
                  
                  {/* Circle Indicator */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center z-10 border transition-all duration-300 ${
                    isPast 
                      ? 'bg-primary/10 border-primary text-primary' 
                      : 'bg-surface-container border-border-subtle text-text-secondary'
                  } ${isCurrent ? 'ring-4 ring-primary/20 shadow-md scale-105' : ''}`}>
                    <StepIcon size={16} />
                  </div>

                  <div className="flex-grow">
                    <p className={`text-xs font-bold ${isPast ? 'text-text-primary' : 'text-text-secondary'}`}>
                      {step.label}
                    </p>
                    <p className="text-[9px] text-text-secondary mt-0.5 leading-tight">
                      {step.description}
                    </p>
                    {logDate && (
                      <p className="text-[8px] font-geist font-bold text-primary mt-1">
                        {logDate}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* LOG DETAIL (Tracking steps log) */}
        <div className="border border-border-subtle bg-surface-dark/40 backdrop-blur-md p-6 rounded-xl shadow-md mb-8">
          <h3 className="font-sora text-xs font-bold text-text-primary mb-6 uppercase tracking-wider">Riwayat Pengiriman</h3>
          {trackingSteps.length === 0 ? (
            <p className="text-xs text-text-secondary">Tidak ada log pelacakan yang tersedia.</p>
          ) : (
            <div className="space-y-6 relative border-l border-border-subtle pl-4 ml-2">
              {trackingSteps.slice().reverse().map((step: any, idx: number) => {
                const stepDate = new Date(step.createdAt).toLocaleString('id-ID', {
                  day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })
                return (
                  <div key={step.id || idx} className="relative">
                    {/* Circle Dot indicator */}
                    <div className="btn-primary absolute -left-[21px] top-1.5 w-2.5 border-2 border-surface-dark" />
                    
                    <div className="flex justify-between items-start gap-3 flex-wrap">
                      <span className="text-xs font-bold text-text-primary">{step.status}</span>
                      <span className="text-[8px] font-geist text-text-secondary">{stepDate}</span>
                    </div>
                    {step.note && (
                      <p className="text-xs text-text-secondary mt-1">{step.note}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* SHIPPING & DETAILS SUMMARY */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Shipping Info */}
          <div className="border border-border-subtle bg-surface-dark/40 backdrop-blur-md p-6 rounded-xl shadow-md">
            <h3 className="font-sora text-xs font-bold text-text-primary mb-4 uppercase tracking-wider">Rincian Pengiriman</h3>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-text-secondary block mb-1">Kurir</span>
                <span className="text-text-primary font-bold uppercase">{order.courier || 'Tidak Spesifik'}</span>
              </div>
              {order.shippingLabel && (
                <div>
                  <span className="text-text-secondary block mb-1">Resi Pengiriman</span>
                  <span className="inline-block bg-primary/10 border border-primary/20 text-primary font-bold uppercase px-3 py-1 rounded font-mono tracking-widest">{order.shippingLabel}</span>
                </div>
              )}
              <div>
                <span className="text-text-secondary block mb-1">Alamat Tujuan</span>
                <p className="text-text-primary font-medium leading-relaxed">{order.shippingAddress || 'Tidak Spesifik'}</p>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="border border-border-subtle bg-surface-dark/40 backdrop-blur-md p-6 rounded-xl shadow-md">
            <h3 className="font-sora text-xs font-bold text-text-primary mb-4 uppercase tracking-wider">Ringkasan Pembayaran</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-text-secondary">Subtotal Barang</span>
                <span className="text-text-primary font-semibold">Rp {(order.totalAmount - (order.shippingFee || 0) + (order.discountAmount || 0)).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Ongkos Kirim</span>
                <span className="text-text-primary font-semibold">Rp {(order.shippingFee || 0).toLocaleString('id-ID')}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-red-400">
                  <span>Diskon Kupon</span>
                  <span>-Rp {order.discountAmount.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border-subtle/50 pt-2.5 font-bold">
                <span className="text-text-primary">Total Bayar</span>
                <span className="text-primary font-black">Rp {order.totalAmount.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* PRODUCTS LIST & REVIEW FORM */}
        <div className="border border-border-subtle bg-surface-dark/40 backdrop-blur-md p-6 rounded-xl shadow-md">
          <h3 className="font-sora text-xs font-bold text-text-primary mb-6 uppercase tracking-wider">Produk Yang Dibeli</h3>
          
          <div className="space-y-6">
            {(order.items || []).map((item: any) => {
              const product = item.product || { title: item.productTitle || 'Produk Saloka', price: item.price }
              const alreadyReviewed = reviewedProductIds.has(item.productId)

              return (
                <div key={item.productId} className="border-b border-border-subtle/40 last:border-none pb-6 last:pb-0">
                  <div className="flex justify-between gap-4 items-start mb-4">
                    <div className="flex items-center gap-4">
                      {product.imageUrl && (
                        <div className="w-12 h-12 bg-surface-container rounded border border-border-subtle overflow-hidden shrink-0">
                          <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-sora text-xs font-bold text-text-primary line-clamp-1">{product.title}</h4>
                        <p className="text-[10px] text-text-secondary mt-0.5">x{item.quantity} • Rp {item.price.toLocaleString('id-ID')}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-primary font-geist">
                      Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                    </span>
                  </div>

                  {/* Inline Review Form (Only show if completed and not reviewed yet) */}
                  {order.status === 'COMPLETED' && !alreadyReviewed && (
                    <div className="bg-surface-container/30 border border-border-subtle/55 rounded-xl p-4 mt-4">
                      <h5 className="font-sora text-[10px] font-bold text-text-primary mb-3 uppercase tracking-wider">Berikan Ulasan Produk</h5>
                      
                      {reviewSuccess && (
                        <div className="p-3 mb-3 bg-green-500/10 border border-green-500/20 text-[10px] text-green-400 font-medium rounded-lg">
                          {reviewSuccess}
                        </div>
                      )}
                      {reviewError && (
                        <div className="p-3 mb-3 bg-red-500/10 border border-red-500/20 text-[10px] text-red-400 font-medium rounded-lg">
                          {reviewError}
                        </div>
                      )}

                      <form onSubmit={(e) => handleReviewSubmit(item.productId, e)} className="space-y-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-text-secondary mr-2">Bintang:</span>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              className="text-yellow-400 hover:scale-110 transition-transform cursor-pointer outline-none"
                            >
                              <Star size={16} fill={star <= rating ? 'currentColor' : 'none'} />
                            </button>
                          ))}
                        </div>

                        <textarea
                          placeholder="Tulis ulasan Anda mengenai produk ini (minimal 3 karakter)..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          required
                          rows={2}
                          className="w-full px-3 py-2 bg-surface-dark border border-border-subtle rounded-lg text-[10px] text-text-primary placeholder:text-text-secondary/70 focus:outline-none leading-relaxed resize-none"
                        />

                        <button
                          type="submit"
                          disabled={submittingReview}
                          className="btn-primary font-black text-[9px] shadow disabled:opacity-50 cursor-pointer"
                        >
                          {submittingReview ? 'Mengirim...' : 'Kirim Ulasan'}
                        </button>
                      </form>
                    </div>
                  )}

                  {alreadyReviewed && (
                    <div className="bg-green-500/5 border border-green-500/10 text-green-400 px-3.5 py-2.5 rounded-xl text-[9px] font-bold inline-flex items-center gap-1.5 mt-3">
                      <CheckCircle2 size={12} />
                      Ulasan telah diberikan
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
