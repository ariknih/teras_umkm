'use client'

import React, { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { getOrderInvoiceData } from '@/app/actions/orders'
import { ArrowLeft, Printer, ShieldCheck, AlertCircle } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function OrderInvoicePage({ params }: PageProps) {
  const { id } = use(params)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getOrderInvoiceData(id)
        setData(res)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id])

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-bg-dark">
        <span className="text-xs font-geist font-bold text-primary tracking-widest uppercase animate-pulse">
          Menyiapkan Invoice...
        </span>
      </div>
    )
  }

  if (!data || !data.order) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-bg-dark p-6 text-center">
        <AlertCircle size={40} className="text-red-400 mb-4" />
        <h2 className="font-sora text-lg font-bold text-text-primary mb-2">Invoice Tidak Ditemukan</h2>
        <p className="text-xs text-text-secondary max-w-xs mb-6">
          Maaf, data invoice untuk ID pesanan tersebut tidak tersedia.
        </p>
        <Link
          href="/orders"
          className="btn-primary text-xs"
        >
          Kembali ke Pesanan Saya
        </Link>
      </div>
    )
  }

  const { order, merchant } = data
  const dateStr = new Date(order.createdAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  const subtotal = (order.items || []).reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0)

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] pt-24 pb-24 px-4 sm:px-6 md:px-10 print:pt-4 print:pb-4 print:px-4 font-sans text-slate-900">
      <div className="max-w-[820px] mx-auto space-y-6">
        {/* Actions panel (hidden in print) */}
        <div className="flex justify-between items-center print:hidden">
          <Link
            href={`/orders/${order.id}`}
            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-primary transition-colors text-xs font-bold uppercase tracking-wider"
          >
            <ArrowLeft size={14} />
            Kembali ke Pesanan
          </Link>

          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-primary hover:bg-[#005a1d] text-white text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Printer size={14} />
            Cetak / Simpan PDF
          </button>
        </div>

        {/* Official Invoice Body Card (Clean White A4) */}
        <div className="bg-white border border-slate-200/90 p-6 sm:p-10 rounded-2xl shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-black text-sm">
                  S
                </div>
                <span className="text-lg font-extrabold text-slate-900 tracking-tight">
                  Saloka<span className="text-primary">.id</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Pusat Marketplace &amp; Pemberdayaan UMKM Indonesia
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="px-3 py-1 bg-[#E8F5E9] text-primary font-extrabold text-xs rounded-full border border-[#C8E6C9] inline-block mb-1">
                FAKTUR INVOICE RESMI
              </span>
              <p className="text-xs text-slate-500">
                No. Transaksi: <span className="font-bold text-slate-900">{order.id}</span>
              </p>
              <p className="text-[11px] text-slate-400">
                Waktu: {dateStr}
              </p>
            </div>
          </div>

          {/* Diterbitkan Oleh & Dikirim Kepada Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Diterbitkan Oleh (Penjual)
              </span>
              <p className="font-bold text-slate-900 text-sm">
                {merchant ? merchant.name : 'Mitra UMKM Saloka.id'}
              </p>
              <p className="text-slate-600">
                Email: {merchant?.email || 'merchant@saloka.id'}
              </p>
              <p className="text-[10px] text-primary font-bold">
                ✔ Terdaftar Resmi di Saloka UMKM Hub
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Dikirim Kepada (Pembeli)
              </span>
              <p className="font-bold text-slate-900 text-sm">
                {order.buyer?.name || 'Pelanggan Saloka.id'}
              </p>
              <p className="text-slate-600">
                Email: {order.buyer?.email || '-'}
              </p>
              <p className="text-slate-600 font-medium leading-relaxed">
                Alamat: {order.shippingAddress || 'Ambil di Toko / Alamat Terdaftar'}
              </p>
            </div>
          </div>

          {/* Rincian Produk Table */}
          <div className="space-y-3">
            <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block">
              Rincian Produk
            </span>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">
                    <th className="py-2.5 px-3 rounded-l-lg w-10">No</th>
                    <th className="py-2.5 px-3">Nama Barang</th>
                    <th className="py-2.5 px-3 text-right">Harga Satuan</th>
                    <th className="py-2.5 px-3 text-center w-16">Qty</th>
                    <th className="py-2.5 px-3 rounded-r-lg text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(order.items || []).map((item: any, idx: number) => {
                    const productTitle = item.productTitle || item.product?.title || 'Produk UMKM'
                    return (
                      <tr key={item.productId || idx} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 text-slate-500 font-semibold">{idx + 1}</td>
                        <td className="py-3 px-3">
                          <p className="font-semibold text-slate-900">{productTitle}</p>
                          {item.note && (
                            <p className="text-[10px] text-slate-500 italic mt-0.5">Catatan: &quot;{item.note}&quot;</p>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-700 font-semibold">
                          Rp {item.price.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-900">
                          {item.quantity}
                        </td>
                        <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                          Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Breakdown & Lunas Stamp Grid */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 text-xs">
            {/* Lunas Verified Seal */}
            <div className="flex items-center gap-3 p-3 bg-[#E8F5E9] rounded-xl border border-[#C8E6C9] max-w-sm">
              <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div className="space-y-0.5">
                <p className="font-extrabold text-primary text-xs uppercase tracking-wide">
                  LUNAS / TERVERIFIKASI
                </p>
                <p className="text-[10px] text-primary/80">
                  Pembayaran berhasil diverifikasi secara otomatis oleh sistem Saloka.id Gateway.
                </p>
              </div>
            </div>

            {/* Total Calculation Column */}
            <div className="w-full sm:w-72 space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Produk</span>
                <span className="font-bold text-slate-900">Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Ongkos Kirim ({order.courier || 'Kurir'})</span>
                <span className="font-bold text-slate-900">Rp {(order.shippingFee || 0).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Biaya Layanan Aplikasi</span>
                <span className="font-bold text-slate-900">Rp 1.000</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Biaya Penanganan Transaksi</span>
                <span className="font-bold text-slate-900">
                  {order.paymentMethod === 'WALLET' ? 'Rp 0' : 'Rp 1.000'}
                </span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-primary font-bold">
                  <span>Diskon Promo / Kupon</span>
                  <span>-Rp {order.discountAmount.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-extrabold">
                <span className="text-slate-900">Total Pembayaran</span>
                <span className="text-primary text-base">Rp {order.totalAmount.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400">
            Terima kasih telah mendukung produk UMKM lokal melalui Saloka.id. Dokumen ini adalah bukti transaksi digital resmi.
          </div>
        </div>
      </div>
    </div>
  )
}
