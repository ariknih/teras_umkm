'use client'

import { useMemo, useState, useTransition } from 'react'
import { updateProductSnackboxAction } from '@/app/actions/admin'
import { formatCategoryName } from '@/lib/utils'
import { useToast, Toast } from './Toast'
import { FilterPopover, SearchInput, TableCard, TablePagination, usePagination, type FilterField, type FilterValues } from './TableControls'

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
  const [filters, setFilters] = useState<FilterValues>({})
  const [isPending, startTransition] = useTransition()
  const { toast, showToast } = useToast()

  const categoryOptions = useMemo(
    () => [...new Set(products.map((p) => p.category).filter(Boolean))].sort().map((c) => ({ value: c, label: formatCategoryName(c) })),
    [products]
  )
  const fields: FilterField[] = [
    { key: 'category', label: 'Kategori', allLabel: 'Semua kategori', options: categoryOptions },
    // The Snackbox tab is already narrowed to eligible items, so this filter would be a no-op there.
    ...(snackboxOnly
      ? []
      : [
          {
            key: 'snackbox',
            label: 'Masuk Snackbox',
            allLabel: 'Semua',
            options: [
              { value: 'ya', label: 'Ya (Snackbox)' },
              { value: 'tidak', label: 'Tidak' }
            ]
          }
        ])
  ]

  const q = search.toLowerCase()
  const filtered = products.filter((p) => {
    const eligible = isSnackEligible(p)
    if (snackboxOnly && !eligible) return false
    if (q && ![p.title, p.id, p.kelurahanName || 'Menteng'].some((v) => (v || '').toLowerCase().includes(q))) return false
    if (filters.category && p.category !== filters.category) return false
    if (filters.snackbox && eligible !== (filters.snackbox === 'ya')) return false
    return true
  })
  const { paged, resetPage, footer } = usePagination(filtered)

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

      <TableCard
        title={snackboxOnly ? 'Produk Snackbox' : 'Katalog Produk'}
        description={
          snackboxOnly
            ? 'Produk kue & kudapan yang lolos kurasi masuk Snackbox.'
            : 'Moderasi produk fisik dan digital di katalog UMKM, lintas-merchant.'
        }
        actions={
          <>
            <SearchInput
              placeholder="Cari nama, ID, atau kelurahan..."
              value={search}
              onChange={(v) => {
                setSearch(v)
                resetPage()
              }}
            />
            <FilterPopover
              fields={fields}
              value={filters}
              onApply={(next) => {
                setFilters(next)
                resetPage()
              }}
            />
          </>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left whitespace-nowrap">
            <thead>
              <tr className="bg-neutral-shade-25 border-b border-neutral-shade-50 text-neutral-shade-500 uppercase tracking-wider text-[10px] font-bold">
                <th className="px-4 py-3">ID & Gambar</th>
                <th className="px-4 py-3">Nama Produk</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3 text-center">Masuk Snackbox</th>
                <th className="px-4 py-3">Kelurahan Toko</th>
                <th className="px-4 py-3 text-right">Harga Satuan</th>
                <th className="px-4 py-3 text-center">Stok</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-shade-50">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-neutral-shade-300 italic">
                    Tidak ada produk yang cocok dengan filter yang dipilih.
                  </td>
                </tr>
              ) : (
                paged.map((p) => {
                  const eligible = isSnackEligible(p)
                  const kelurahan = (p as any).kelurahanName || 'Menteng'
                  return (
                    <tr key={p.id} className="hover:bg-neutral-shade-25 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-neutral-shade-25 overflow-hidden border border-neutral-shade-50 shrink-0">
                            {p.image ? (
                              <img src={p.image} alt={p.title} className="object-cover w-full h-full" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-neutral-shade-300 font-bold">UMKM</div>
                            )}
                          </div>
                          <span className="font-mono text-[10px] text-neutral-shade-500">{p.id}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-neutral-shade-800">{p.title}</p>
                        <p className="text-[10px] text-neutral-shade-500 font-mono">Merchant: {p.merchantId || 'Mitra Saloka'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${
                            p.category === 'JASA' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {formatCategoryName(p.category)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
                              eligible ? 'bg-primary-container text-on-primary-container border-on-primary-container/30' : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                          >
                            {eligible ? '✓ Ya (Snackbox)' : 'Tidak'}
                          </span>
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => toggleSnackbox(p)}
                            className="text-[9px] font-bold text-on-primary-container hover:underline cursor-pointer bg-transparent border-none p-0 disabled:opacity-50"
                          >
                            {eligible ? 'Nonaktifkan' : 'Aktifkan Masuk Box'}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-medium text-neutral-shade-700">📍 Kel. {kelurahan}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-neutral-shade-800">Rp {p.price.toLocaleString('id-ID')}</td>
                      <td className="px-4 py-3 text-center text-neutral-shade-500 font-bold">{p.stock} pcs</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <TablePagination {...footer} />
      </TableCard>
    </div>
  )
}
