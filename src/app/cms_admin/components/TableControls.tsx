'use client'

import { useState, type ReactNode } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { getPageList } from '@/lib/utils'

/**
 * Table chrome shared by every CMS list table (born in AuditLogTab): card
 * header, Filter popover (edit a draft, then Terapkan) and a paginated footer.
 *
 * Client-side only — it pages over rows the page already got from
 * getCmsAdminData, so DataStore getters (also used by the public site) stay
 * untouched. ponytail: every row still ships to the browser; move to
 * server-side take/skip in DataStore once a list outgrows a few thousand rows.
 */

export type FilterField = {
  key: string
  label: string
  /** Label of the empty "no filter" option. */
  allLabel: string
  options: { value: string; label: string }[]
}

/** Field key → selected value; '' or missing means unfiltered. */
export type FilterValues = Record<string, string>

const CONTROL =
  'border border-neutral-shade-50 rounded-[var(--radius-brand)] text-xs text-neutral-shade-700 bg-white focus:outline-none focus:ring-1 focus:ring-market-green-500'

const PAGE_SIZE_OPTIONS = [10, 50, 100] as const

export function TableCard({
  title,
  description,
  actions,
  children
}: {
  title: string
  description?: ReactNode
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="bg-white border border-neutral-shade-50 p-6 rounded-[var(--radius-brand)] shadow-sm space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-neutral-shade-50 pb-4">
        <div>
          <h3 className="font-sora text-sm font-bold text-market-green-600 uppercase tracking-wider">{title}</h3>
          {description && <p className="text-xs text-neutral-shade-500 mt-1">{description}</p>}
        </div>
        {actions && <div className="flex flex-col sm:flex-row sm:items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  )
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input
      type="search"
      aria-label={placeholder}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${CONTROL} w-full sm:w-64 px-3 py-2 placeholder:text-neutral-shade-300`}
    />
  )
}

export function FilterPopover({
  fields,
  value,
  onApply
}: {
  fields: FilterField[]
  value: FilterValues
  onApply: (next: FilterValues) => void
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<FilterValues>(value)

  const active = fields.some((f) => value[f.key])
  const draftFilled = fields.some((f) => draft[f.key])
  // Enabled on any change (clearing included) so an applied filter can be removed.
  const draftChanged = fields.some((f) => (draft[f.key] || '') !== (value[f.key] || ''))

  function toggle() {
    if (!open) setDraft(value)
    setOpen(!open)
  }

  return (
    <div className="relative" onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`flex items-center gap-2 px-4 py-2 rounded-[var(--radius-brand)] text-xs font-bold border transition-colors ${
          active
            ? 'border-market-green-500 text-market-green-600 bg-market-green-50'
            : 'border-neutral-shade-50 text-neutral-shade-700 bg-white hover:bg-neutral-shade-25'
        }`}
      >
        <SlidersHorizontal size={14} />
        Filter
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Filter tabel"
          className="absolute right-0 top-full mt-2 z-20 w-[400px] max-w-[calc(100vw-3rem)] border border-neutral-shade-50 rounded-[var(--radius-brand)] p-5 space-y-5 bg-white shadow-lg"
        >
          {fields.map((f) => (
            <label key={f.key} className="block space-y-1.5">
              <span className="block text-xs font-bold text-neutral-shade-800">{f.label}</span>
              <select
                value={draft[f.key] || ''}
                onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                className={`${CONTROL} w-full px-3 py-2`}
              >
                <option value="">{f.allLabel}</option>
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
          ))}

          <div className="flex justify-between items-center pt-3 border-t border-neutral-shade-50">
            <button
              type="button"
              onClick={() => setDraft({})}
              disabled={!draftFilled}
              className="text-xs font-bold text-neutral-shade-600 hover:text-neutral-shade-800 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-neutral-shade-600"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => {
                onApply(draft)
                setOpen(false)
              }}
              disabled={!draftChanged}
              className="px-4 py-2 rounded-[var(--radius-brand)] text-xs font-bold bg-market-green-600 text-white hover:bg-market-green-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-market-green-600"
            >
              Terapkan
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

type PaginationFooter = {
  page: number
  totalPages: number
  total: number
  pageSize: number
  onPage: (page: number) => void
  onPageSize: (size: number) => void
}

/** Slices `items` into the current page. Call `resetPage` whenever search/filters change. */
export function usePagination<T>(items: T[]) {
  const [pageSize, setPageSize] = useState<number>(10)
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  // Clamped so deleting the last row of the last page never shows an empty page.
  const current = Math.min(page, totalPages)

  const footer: PaginationFooter = {
    page: current,
    totalPages,
    total: items.length,
    pageSize,
    onPage: setPage,
    onPageSize: (size) => {
      setPageSize(size)
      setPage(1)
    }
  }

  return { paged: items.slice((current - 1) * pageSize, current * pageSize), resetPage: () => setPage(1), footer }
}

export function TablePagination({ page, totalPages, total, pageSize, onPage, onPageSize }: PaginationFooter) {
  const navBtn =
    'px-2.5 py-1 rounded border border-neutral-shade-50 text-neutral-shade-600 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-shade-25'

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-neutral-shade-50 text-xs">
      <label className="flex items-center gap-2 text-neutral-shade-500">
        Tampilkan
        <select value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))} className={`${CONTROL} px-2 py-1 font-semibold`}>
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        entri
      </label>

      <div className="flex flex-wrap justify-center items-center gap-3">
        <span className="text-neutral-shade-500">
          Halaman {page} dari {totalPages} ({total} entri)
        </span>
        <nav aria-label="Paginasi" className="flex gap-1">
          <button type="button" aria-label="Halaman sebelumnya" onClick={() => onPage(page - 1)} disabled={page <= 1} className={navBtn}>
            ‹
          </button>
          {getPageList(page, totalPages).map((p, i) =>
            p === '...' ? (
              <span key={`ellipsis-${i}`} className="px-2 py-1 text-neutral-shade-300">…</span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPage(p)}
                aria-current={p === page ? 'page' : undefined}
                className={`px-2.5 py-1 rounded border font-bold ${
                  p === page
                    ? 'bg-market-green-600 text-white border-market-green-600'
                    : 'border-neutral-shade-50 text-neutral-shade-600 hover:bg-neutral-shade-25'
                }`}
              >
                {p}
              </button>
            )
          )}
          <button type="button" aria-label="Halaman berikutnya" onClick={() => onPage(page + 1)} disabled={page >= totalPages} className={navBtn}>
            ›
          </button>
        </nav>
      </div>
    </div>
  )
}
