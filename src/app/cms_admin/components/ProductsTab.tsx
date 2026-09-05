'use client'

import { useState, useTransition } from 'react'
import { updateProductSnackboxAction } from '@/app/actions/admin'
import { formatCategoryName } from '@/lib/utils'
import { useToast, Toast } from './Toast'

const SNACK_KEYWORDS = ['snack', 'makanan', 'kue', 'kudapan', 'kuliner', 'cemilan', 'jajanan', 'roti', 'bolu', 'lemper', 'risoles', 'pastel', 'pie', 'lapis', 'tahu', 'bakwan']

function isSnackEligible(p: any) {
  if ((p as any).isSnackboxEligible !== undefined) return (p as any).isSnackboxEligible
  const titleLower = (p.title || '').toLowerCase()
  return p.category !== 'JASA' && SNACK_KEYWORDS.some((k) => titleLower.includes(k))
}

type Props = {
  initialProducts: any[]
  /** Narrows to Snackbox-eligible items only — used by the Kurasi & Eligibility
   * "Produk Snackbox" tab, which shares this exact table with the plain
   * Katalog Produk menu but scopes it to the curated Snackbox subset. */
  snackboxOnly?: boolean
}

export default function ProductsTab({ initialProducts, snackboxOnly = false }: Props) {
  const [products, setProducts] = useState(initialProducts)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('ALL')
  const [isPending, startTransition] = useTransition()
  const { toast, showToast } = useToast()

  const filtered = products.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase())
    const matchCat = catFilter === 'ALL' || p.category === catFilter
    const matchSnackbox = !snackboxOnly || isSnackEligible(p)
    return matchSearch && matchCat && matchSnackbox
  })

  const toggleSnackbox = (p: any) => {
    const nextState = !isSnackEligible(p)
    const kelurahan = (p as any).kelurahanName || 'Menteng'
    startTransition(async () => {
      const res = await updateProductSnackboxAction(p.id, nextState, kelurahan)
      if (res.success) {
        setProducts((prev) => prev.map((prod) => (prod.id === p.id ? { ...prod, isSnackboxEligible: nextState } : prod)))
        showToast(`Status Snackbox untuk "${p.title}" diubah menjadi ${nextState ? 'AKTIF' : 'NON-AKTIF'}.`)
      } else {
        showToast(res.error || 'Gagal mengubah status Snackbox.', 'error')
      }
    })
  }

  return (
    <div className="space-y-6">
      <Toast toast={toast} />

      {/* Product catalog filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-white border border-[#e2e8f0] p-4 rounded-[var(--radius-brand)] shadow-sm">
        <input
          type="text"
          placeholder="Cari produk berdasarkan nama, SKU, atau kelurahan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-grow bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-4 py-2.5 text-xs text-slate-800 placeholder-[#94a3b8] focus:outline-none focus:border-[#0F5132] focus:ring-1 focus:ring-[#0F5132]"
        />
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#0F5132]"
        >
          <option value="ALL">Semua Kategori</option>
          <option value="PRODUCT">PRODUCT (Fisik / Digital)</option>
          <option value="JASA">JASA (Jasa / Service)</option>
        </select>
      </div>

      {/* Products table */}
      <div className="bg-white border border-[#e2e8f0] rounded-[var(--radius-brand)] overflow-x-auto shadow-sm">
        <table className="w-full min-w-[950px] text-xs text-left">
          <thead className="bg-[#f8f9fa] border-b border-[#e2e8f0] text-[#64748b] uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-5 py-3.5">ID & Gambar</th>
              <th className="px-5 py-3.5">Nama Produk</th>
              <th className="px-5 py-3.5">Kategori</th>
              <th className="px-5 py-3.5 text-center">Masuk Snackbox</th>
              <th className="px-5 py-3.5">Kelurahan Toko</th>
              <th className="px-5 py-3.5 text-right">Harga Satuan</th>
              <th className="px-5 py-3.5 text-center">Stok</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-slate-400 italic">
                  Tidak ada produk yang cocok dengan filter yang dipilih.
                </td>
              </tr>
            ) : (
              filtered.map((p) => {
                const eligible = isSnackEligible(p)
                const kelurahan = (p as any).kelurahanName || 'Menteng'
                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-50 overflow-hidden border border-[#e2e8f0] flex-shrink-0">
                        {p.image ? (
                          <img src={p.image} alt={p.title} className="object-cover w-full h-full" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">UMKM</div>
                        )}
                      </div>
                      <span className="font-mono text-[10px] text-[#64748b]">{p.id}</span>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-bold text-slate-900">{p.title}</p>
                      <p className="text-[10px] text-slate-400 font-mono">Merchant: {p.merchantId || 'Mitra Saloka'}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${
                          p.category === 'JASA' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {formatCategoryName(p.category)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
                            eligible ? 'bg-emerald-50 text-[#006E24] border-[#006E24]/30' : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          {eligible ? '✓ Ya (Snackbox)' : 'Tidak'}
                        </span>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => toggleSnackbox(p)}
                          className="text-[9px] font-bold text-[#006E24] hover:underline cursor-pointer bg-transparent border-none p-0 disabled:opacity-50"
                        >
                          {eligible ? 'Nonaktifkan' : 'Aktifkan Masuk Box'}
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-[11px] font-medium text-slate-700 flex items-center gap-1">📍 Kel. {kelurahan}</span>
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-slate-900">Rp {p.price.toLocaleString('id-ID')}</td>
                    <td className="px-5 py-3 text-center text-[#64748b] font-bold">{p.stock} pcs</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
