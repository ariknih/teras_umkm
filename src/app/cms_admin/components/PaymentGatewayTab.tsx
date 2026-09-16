'use client'

import { useState, useTransition } from 'react'
import { AlertTriangle, CheckCircle2, Loader2, RotateCcw, ShieldCheck } from 'lucide-react'
import {
  updateDokuConfigAction,
  resetDokuConfigAction,
  testDokuConnectionAction,
  type DokuConfigView
} from '@/app/actions/payment-config'
import { useToast, Toast } from './Toast'

type Props = { initial: DokuConfigView }

const fieldLabel = 'block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5'
const fieldInput =
  'w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary'
const primaryButton =
  'py-2.5 px-5 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
const ghostButton =
  'py-2.5 px-4 border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer inline-flex items-center gap-2'

/**
 * Credentials are write-only from here: the secret and public keys are never
 * sent to the browser, and leaving a field blank keeps whatever is stored. That
 * makes the common operation — flipping Sandbox↔Live — possible without the
 * page ever holding a secret.
 */
export default function PaymentGatewayTab({ initial }: Props) {
  const [view, setView] = useState(initial)
  const [clientId, setClientId] = useState(initial.clientId)
  const [secretKey, setSecretKey] = useState('')
  const [publicKey, setPublicKey] = useState('')
  const [isProduction, setIsProduction] = useState(initial.isProduction)
  const [confirmingLive, setConfirmingLive] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const { toast, showToast } = useToast()

  const goingLive = isProduction && !view.isProduction

  function persist() {
    startTransition(async () => {
      const res = await updateDokuConfigAction({ clientId, secretKey, publicKey, isProduction }).catch(() => ({
        ok: false as const,
        error: 'Koneksi gagal. Coba lagi.'
      }))
      if (!res.ok) {
        showToast(res.error, 'error')
        return
      }
      setView(res.view)
      setClientId(res.view.clientId)
      setSecretKey('')
      setPublicKey('')
      setConfirmingLive(false)
      setTestResult(null)
      showToast(res.view.isProduction ? 'Tersimpan. Gateway sekarang LIVE.' : 'Tersimpan. Gateway dalam mode Sandbox.')
    })
  }

  function save() {
    // Switching to live starts charging real cards; make it a two-step action.
    if (goingLive && !confirmingLive) {
      setConfirmingLive(true)
      return
    }
    persist()
  }

  function testConnection() {
    startTransition(async () => {
      setTestResult(null)
      const res = await testDokuConnectionAction().catch(() => ({
        ok: false as const,
        error: 'Koneksi gagal. Coba lagi.'
      }))
      if (!res.ok) {
        showToast(res.error, 'error')
        setTestResult(`❌ ${res.error}`)
        return
      }
      setTestResult(`✅ ${res.mode} — ${res.baseUrl}\n${res.detail}`)
      showToast('DOKU merespons.')
    })
  }

  function resetToEnv() {
    startTransition(async () => {
      const res = await resetDokuConfigAction().catch(() => ({
        ok: false as const,
        error: 'Koneksi gagal. Coba lagi.'
      }))
      if (!res.ok) {
        showToast(res.error, 'error')
        return
      }
      showToast('Konfigurasi database dihapus. Memuat ulang…')
      setTimeout(() => window.location.reload(), 800)
    })
  }

  return (
    <div className="space-y-6">
      <Toast toast={toast} />

      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Payment Gateway (DOKU)</h2>
        <p className="text-sm text-slate-500 mt-1 max-w-3xl">
          Kredensial DOKU dan sakelar Sandbox/Live. Perubahan berlaku seketika tanpa deploy ulang. Secret Key dan Public
          Key disimpan terenkripsi dan tidak pernah ditampilkan kembali — kosongkan untuk mempertahankan nilai yang
          tersimpan.
        </p>
      </div>

      {/* Current state */}
      <div
        className={`p-4 rounded-xl border flex flex-wrap items-center gap-3 ${
          view.isProduction ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <span
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
            view.isProduction ? 'bg-emerald-600 text-white' : 'bg-slate-500 text-white'
          }`}
        >
          {view.isProduction ? 'LIVE' : 'SANDBOX'}
        </span>
        <span className="text-xs text-slate-600">
          Endpoint: <span className="font-mono">{view.isProduction ? 'api.doku.com' : 'api-sandbox.doku.com'}</span>
        </span>
        <span className="text-xs text-slate-600">
          Sumber:{' '}
          <span className="font-semibold">
            {view.source === 'database' ? 'Database (CMS)' : 'Environment variable'}
          </span>
        </span>
        <span className="text-xs text-slate-600">
          Secret Key: <span className="font-mono">{view.hasSecretKey ? view.secretKeyMasked : '— belum diisi'}</span>
        </span>
        <span className="text-xs text-slate-600">
          Public Key: {view.hasPublicKey ? 'tersimpan' : '— belum diisi'}
        </span>
      </div>

      {view.source === 'environment' && (
        <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-900">
          Saat ini gateway masih membaca environment variable. Menyimpan di halaman ini akan memindahkan konfigurasi ke
          database, dan environment variable tidak lagi dipakai.
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 max-w-2xl">
        <div>
          <label className={fieldLabel} htmlFor="doku-client-id">
            Client ID
          </label>
          <input
            id="doku-client-id"
            className={fieldInput}
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="BRN-XXXX-XXXXXXXXXXXXX"
            autoComplete="off"
          />
        </div>

        <div>
          <label className={fieldLabel} htmlFor="doku-secret-key">
            Secret Key {view.hasSecretKey && <span className="normal-case font-normal">(kosongkan untuk tidak mengubah)</span>}
          </label>
          <input
            id="doku-secret-key"
            className={fieldInput}
            type="password"
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            placeholder={view.hasSecretKey ? view.secretKeyMasked : 'SK-XXXXXXXXXXXXXXXX'}
            autoComplete="new-password"
          />
        </div>

        <div>
          <label className={fieldLabel} htmlFor="doku-public-key">
            Public Key (PEM) {view.hasPublicKey && <span className="normal-case font-normal">(kosongkan untuk tidak mengubah)</span>}
          </label>
          <textarea
            id="doku-public-key"
            className={`${fieldInput} font-mono text-xs`}
            rows={4}
            value={publicKey}
            onChange={(e) => setPublicKey(e.target.value)}
            placeholder={'-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----'}
            autoComplete="off"
          />
          <p className="text-[11px] text-slate-500 mt-1.5">
            Dipakai untuk memverifikasi tanda tangan webhook DOKU. Nilai sandbox dan live berbeda.
          </p>
        </div>

        <div className="pt-1">
          <span className={fieldLabel}>Mode</span>
          <div className="flex gap-2">
            {[
              { live: false, label: 'Sandbox' },
              { live: true, label: 'Live' }
            ].map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => {
                  setIsProduction(opt.live)
                  setConfirmingLive(false)
                }}
                className={`px-4 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                  isProduction === opt.live
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {goingLive && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-snug">
              <p className="font-bold">Mode Live memproses uang sungguhan.</p>
              <p className="mt-1">
                Pastikan Client ID dan Secret Key adalah kredensial produksi DOKU, dan URL webhook
                <span className="font-mono"> /api/doku/notification </span>
                sudah didaftarkan di DOKU Back Office.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button type="button" onClick={save} disabled={isPending} className={primaryButton}>
            {isPending ? 'Menyimpan…' : confirmingLive ? 'Ya, aktifkan LIVE' : 'Simpan'}
          </button>
          {confirmingLive && (
            <button
              type="button"
              onClick={() => {
                setConfirmingLive(false)
                setIsProduction(view.isProduction)
              }}
              className={ghostButton}
            >
              Batal
            </button>
          )}
          <button type="button" onClick={testConnection} disabled={isPending} className={ghostButton}>
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            Tes koneksi
          </button>
        </div>

        {testResult && (
          <pre className="text-[11px] whitespace-pre-wrap bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700">
            {testResult}
          </pre>
        )}
      </div>

      {view.source === 'database' && (
        <div className="max-w-2xl p-4 rounded-xl border border-slate-200 bg-slate-50/60">
          <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" /> Kembali ke environment variable
          </p>
          <p className="text-[11px] text-slate-500 mt-1 leading-snug">
            Menghapus konfigurasi yang tersimpan di database. Gateway akan kembali membaca environment variable — pakai
            ini jika konfigurasi di atas salah dan pembayaran harus dikembalikan ke keadaan semula.
          </p>
          <button type="button" onClick={resetToEnv} disabled={isPending} className={`${ghostButton} mt-3`}>
            Hapus konfigurasi database
          </button>
        </div>
      )}

      <div className="max-w-2xl flex gap-2.5 text-[11px] text-slate-500 leading-snug">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
        <p>
          Kredensial dienkripsi (AES-256-GCM) memakai kunci turunan dari JWT_SECRET, sehingga salinan database saja
          tidak cukup untuk membacanya. Setiap perubahan dicatat di Audit Log.
        </p>
      </div>
    </div>
  )
}
