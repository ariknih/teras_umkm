'use client'

import { useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog'
import { updateFeatureControlAction } from '@/app/actions/admin'
import {
  FEATURES,
  CTA_MAX,
  MIN_ACTIVE_ERROR,
  activeFeatures,
  defaultEntryFor,
  dependentsOf,
  findFeature,
  type FeatureControl
} from '@/lib/features'
import { useToast, Toast } from './Toast'

type Props = { initial: { config: FeatureControl; version: string | null } }

const fieldLabel = 'block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5'
const fieldInput =
  'w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary'
const primaryButton =
  'py-2.5 px-5 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'

/**
 * Every state change goes through updateFeatureControlAction, which
 * re-validates the whole config, writes it conditionally on `version`
 * (optimistic concurrency) and logs one audit row per changed feature.
 */
export default function FeatureControlTab({ initial }: Props) {
  const [config, setConfig] = useState(initial.config)
  const [version, setVersion] = useState(initial.version)
  const [drafts, setDrafts] = useState(initial.config)
  const [pendingOff, setPendingOff] = useState<{ key: string; deps: string[] } | null>(null)
  const [reassignTo, setReassignTo] = useState('')
  const [stale, setStale] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { toast, showToast } = useToast()

  const isOn = (key: string) => !config[key]
  const label = (key: string) => findFeature(key)?.label ?? key
  const activeTargets = (exclude: string[]) => activeFeatures(config, exclude)
  const lastActiveKey = activeTargets([]).length === 1 ? activeTargets([])[0].key : null

  function save(next: FeatureControl, successText: string, onSuccess?: () => void) {
    startTransition(async () => {
      const res = await updateFeatureControlAction(next, version)
      if (!res.ok) {
        showToast(res.error, 'error')
        if (res.stale) setStale(true)
        return
      }
      setConfig(res.config)
      setDrafts(res.config)
      setVersion(res.version)
      onSuccess?.()
      showToast(successText)
    })
  }

  function toggle(key: string) {
    if (!isOn(key)) {
      const next = { ...config }
      delete next[key]
      return save(next, `${label(key)} diaktifkan kembali.`)
    }
    const entry = defaultEntryFor(config, key)
    if (!entry) return showToast(MIN_ACTIVE_ERROR, 'error')
    const deps = dependentsOf(config, key)
    if (deps.length) {
      setReassignTo('')
      return setPendingOff({ key, deps })
    }
    save({ ...config, [key]: entry }, `${label(key)} dinonaktifkan. Tombolnya mengarah ke ${label(entry.target)}.`)
  }

  function confirmBulkOff() {
    const entry = pendingOff && defaultEntryFor(config, pendingOff.key)
    if (!pendingOff || !reassignTo || !entry) return
    const next: FeatureControl = { ...config, [pendingOff.key]: entry }
    for (const dep of pendingOff.deps) next[dep] = { ...config[dep], target: reassignTo }
    save(
      next,
      `${label(pendingOff.key)} dinonaktifkan, ${pendingOff.deps.length} tombol dialihkan ke ${label(reassignTo)}.`,
      () => setPendingOff(null)
    )
  }

  return (
    <div className="space-y-6">
      <Toast toast={toast} />

      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Feature Control</h2>
        <p className="text-sm text-slate-500 mt-1 max-w-3xl">
          Nonaktifkan akses publik sebuah fitur. Halaman fitur dan semua sub-halamannya menampilkan placeholder
          (HTTP 503) dengan tombol pengalihan. CMS dan API tetap berjalan, dan admin yang login tetap melihat
          halaman asli. Perubahan berlaku dalam ±30 detik. Minimal satu fitur harus tetap aktif sebagai tujuan tombol
          pengalihan.
        </p>
      </div>

      {stale && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium"
        >
          Konfigurasi telah diubah oleh admin lain. Muat ulang untuk melihat versi terbaru sebelum menyimpan lagi.
          <button type="button" onClick={() => window.location.reload()} className="font-bold underline cursor-pointer">
            Muat ulang
          </button>
        </div>
      )}

      <ul className="bg-white rounded-xl shadow-sm border border-slate-200 divide-y divide-slate-100">
        {FEATURES.map((f) => {
          const on = isOn(f.key)
          const saved = config[f.key]
          const draft = drafts[f.key]
          const dirty = !!saved && !!draft && (draft.cta !== saved.cta || draft.target !== saved.target)
          const isLastActive = f.key === lastActiveKey

          return (
            <li key={f.key} className="p-4 sm:px-6 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p id={`feature-${f.key}`} className="font-semibold text-sm text-slate-800">
                    {f.label}
                  </p>
                  <p className="text-xs text-slate-400 font-mono truncate">
                    {f.prefixes.map((p) => (p === '/' ? '/ (halaman utama)' : `${p}/*`)).join(', ')}
                  </p>
                  {isLastActive && (
                    <p id={`last-active-${f.key}`} className="text-xs text-amber-700 mt-0.5">
                      Fitur aktif terakhir — aktifkan fitur lain sebelum menonaktifkan ini.
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs font-bold ${on ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {on ? 'Aktif' : 'Nonaktif'}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={on}
                    aria-labelledby={`feature-${f.key}`}
                    aria-describedby={isLastActive ? `last-active-${f.key}` : undefined}
                    disabled={isLastActive || isPending}
                    onClick={() => toggle(f.key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                      on ? 'bg-primary' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${on ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>
              </div>

              {!on && draft && (
                <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end rounded-xl bg-slate-50 p-3">
                  <div>
                    <label htmlFor={`cta-${f.key}`} className={fieldLabel}>
                      Teks tombol
                    </label>
                    <input
                      id={`cta-${f.key}`}
                      value={draft.cta}
                      maxLength={CTA_MAX}
                      onChange={(e) => setDrafts({ ...drafts, [f.key]: { ...draft, cta: e.target.value } })}
                      className={fieldInput}
                    />
                  </div>
                  <div>
                    <label htmlFor={`target-${f.key}`} className={fieldLabel}>
                      Tujuan tombol
                    </label>
                    <select
                      id={`target-${f.key}`}
                      value={draft.target}
                      onChange={(e) => setDrafts({ ...drafts, [f.key]: { ...draft, target: e.target.value } })}
                      className={fieldInput}
                    >
                      {activeTargets([f.key]).map((t) => (
                        <option key={t.key} value={t.key}>
                          {t.label} ({t.href})
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    disabled={!dirty || !draft.cta.trim() || isPending}
                    onClick={() => save({ ...config, [f.key]: draft }, `Tombol ${f.label} disimpan.`)}
                    className={primaryButton}
                  >
                    Simpan
                  </button>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {/* Blocking: Esc and outside clicks are swallowed; the only exits are
          Batal (feature stays ON) or completing the bulk reassignment. Radix
          provides the focus trap, aria-modal and focus return. */}
      <Dialog open={!!pendingOff} onOpenChange={(open) => !open && setPendingOff(null)}>
        <DialogContent
          className="bg-white border-slate-200 sm:max-w-md"
          onEscapeKeyDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          {pendingOff && (
            <>
              <DialogTitle className="text-slate-800">Nonaktifkan {label(pendingOff.key)}?</DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                Fitur nonaktif berikut masih mengarahkan tombolnya ke {label(pendingOff.key)}. Pilih tujuan baru untuk
                semuanya sebelum {label(pendingOff.key)} bisa dinonaktifkan.
              </DialogDescription>

              <ul className="space-y-1.5 text-sm">
                {pendingOff.deps.map((dep) => (
                  <li key={dep} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                    <span className="font-semibold text-slate-700">{label(dep)}</span>
                    <span className="text-slate-500 truncate">“{config[dep]?.cta}”</span>
                  </li>
                ))}
              </ul>

              <div>
                <label htmlFor="reassign-target" className={fieldLabel}>
                  Tujuan baru
                </label>
                <select
                  id="reassign-target"
                  required
                  value={reassignTo}
                  onChange={(e) => setReassignTo(e.target.value)}
                  className={fieldInput}
                >
                  <option value="" disabled>
                    Pilih fitur yang aktif…
                  </option>
                  {activeTargets([pendingOff.key, ...pendingOff.deps]).map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label} ({t.href})
                    </option>
                  ))}
                </select>
              </div>

              <DialogFooter>
                <button
                  type="button"
                  onClick={() => setPendingOff(null)}
                  className="py-2.5 px-5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button type="button" disabled={!reassignTo || isPending} onClick={confirmBulkOff} className={primaryButton}>
                  Perbarui & Nonaktifkan
                </button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
