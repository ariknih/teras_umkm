'use client'

import { useState, useTransition } from 'react'
import { ExternalLink } from 'lucide-react'
import { updateSocialsAction } from '@/app/actions/organization'
import { SOCIAL_PLATFORMS, URL_MAX, socialUrlError, withScheme, type SocialEntry, type Socials } from '@/lib/organization'
import { useToast, Toast } from './Toast'

type Props = { initial: { socials: Socials; version: string | null } }

const fieldLabel = 'block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5'
const fieldInput =
  'w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary aria-invalid:border-red-400'
const primaryButton =
  'py-2.5 px-5 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'

/**
 * Same interaction model as FeatureControlTab: the switch saves immediately,
 * the URL field saves with its own Simpan. updateSocialsAction re-validates
 * everything (https + platform host allowlist, no active platform without a
 * URL), writes conditionally on `version` and audits each change.
 */
export default function SocialsTab({ initial }: Props) {
  const [socials, setSocials] = useState(initial.socials)
  const [version, setVersion] = useState(initial.version)
  const [drafts, setDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(SOCIAL_PLATFORMS.map((p) => [p.key, initial.socials[p.key].url]))
  )
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [stale, setStale] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { toast, showToast } = useToast()

  function save(key: string, entry: SocialEntry, successText: string) {
    startTransition(async () => {
      const res = await updateSocialsAction({ ...socials, [key]: entry }, version).catch(() => ({
        ok: false as const,
        error: 'Koneksi gagal. Coba lagi.',
        stale: false
      }))
      if (!res.ok) {
        showToast(res.error, 'error')
        if (res.stale) setStale(true)
        return
      }
      setSocials(res.socials)
      setVersion(res.version)
      setDrafts((d) => ({ ...d, [key]: res.socials[key].url }))
      showToast(successText)
    })
  }

  return (
    <div className="space-y-6">
      <Toast toast={toast} />

      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Socials</h2>
        <p className="text-sm text-slate-500 mt-1 max-w-3xl">
          Tautan sosial media di footer, di bawah logo Saloka. Platform yang aktif tampil di footer; platform nonaktif
          disembunyikan dan URL-nya tetap tersimpan. Platform hanya bisa diaktifkan dengan URL https yang valid.
          Perubahan berlaku di footer dalam ±60 detik.
        </p>
      </div>

      {stale && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium"
        >
          Data telah diubah oleh admin lain. Muat ulang untuk melihat versi terbaru sebelum menyimpan lagi.
          <button type="button" onClick={() => window.location.reload()} className="font-bold underline cursor-pointer">
            Muat ulang
          </button>
        </div>
      )}

      <ul className="bg-white rounded-xl shadow-sm border border-slate-200 divide-y divide-slate-100">
        {SOCIAL_PLATFORMS.map((p) => {
          const saved = socials[p.key]
          const url = drafts[p.key].trim()
          const dirty = url !== saved.url
          const error = url
            ? socialUrlError(p, url)
            : saved.active
              ? 'Nonaktifkan dulu sebelum mengosongkan URL.'
              : null
          const showError = !!error && (!!touched[p.key] || !url)
          const canActivate = !!url && !error
          const needsUrl = !saved.active && !canActivate
          const hintId = `social-hint-${p.key}`
          const errorId = `social-error-${p.key}`

          return (
            <li key={p.key} className="p-4 sm:px-6 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p id={`social-${p.key}`} className="font-semibold text-sm text-slate-800">
                    {p.label}
                  </p>
                  <p className="text-xs text-slate-400 font-mono truncate">
                    {saved.active ? saved.url : 'Disembunyikan dari footer'}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs font-bold ${saved.active ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {saved.active ? 'Aktif' : 'Nonaktif'}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={saved.active}
                    aria-labelledby={`social-${p.key}`}
                    aria-describedby={needsUrl && !showError ? hintId : undefined}
                    disabled={isPending || needsUrl}
                    onClick={() =>
                      saved.active
                        ? save(p.key, { ...saved, active: false }, `${p.label} disembunyikan dari footer.`)
                        : save(p.key, { url, active: true }, `${p.label} ditampilkan di footer.`)
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                      saved.active ? 'bg-primary' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${saved.active ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </div>
              </div>

              <form
                noValidate
                onSubmit={(e) => {
                  e.preventDefault()
                  setTouched((t) => ({ ...t, [p.key]: true }))
                  if (dirty && !error) save(p.key, { url, active: saved.active }, `URL ${p.label} disimpan.`)
                }}
                className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start rounded-xl bg-slate-50 p-3"
              >
                <div>
                  <label htmlFor={`social-url-${p.key}`} className={fieldLabel}>
                    URL {p.label}
                  </label>
                  <div className="flex gap-2">
                    <input
                      id={`social-url-${p.key}`}
                      type="url"
                      inputMode="url"
                      autoComplete="off"
                      spellCheck={false}
                      maxLength={URL_MAX}
                      placeholder={p.fallback}
                      value={drafts[p.key]}
                      aria-invalid={showError}
                      aria-describedby={showError ? errorId : needsUrl ? hintId : undefined}
                      onChange={(e) => setDrafts({ ...drafts, [p.key]: e.target.value })}
                      onBlur={() => {
                        setDrafts((d) => ({ ...d, [p.key]: withScheme(d[p.key]) }))
                        setTouched((t) => ({ ...t, [p.key]: true }))
                      }}
                      className={fieldInput}
                    />
                    {canActivate && (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Buka ${p.label} di tab baru`}
                        className="shrink-0 inline-flex items-center justify-center w-11 rounded-xl border border-slate-300 bg-white text-slate-500 hover:text-primary transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                  {showError ? (
                    <p id={errorId} className="text-xs text-red-600 mt-1.5">
                      {error}
                    </p>
                  ) : (
                    needsUrl && (
                      <p id={hintId} className="text-xs text-slate-500 mt-1.5">
                        Isi URL yang valid untuk mengaktifkan.
                      </p>
                    )
                  )}
                </div>
                <button type="submit" disabled={!dirty || !!error || isPending} className={`${primaryButton} sm:mt-[21px]`}>
                  Simpan
                </button>
              </form>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
