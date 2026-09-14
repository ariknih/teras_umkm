'use client'

import { useState, useTransition, type FormEvent } from 'react'
import { Mail, MessageCircle } from 'lucide-react'
import { updateContactAction } from '@/app/actions/organization'
import { cleanPhone, emailError, phoneError, toWhatsAppHref, type Contact } from '@/lib/organization'
import { useToast, Toast } from './Toast'

type Props = { initial: { contact: Contact; version: string | null } }

const fieldLabel = 'block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5'
const fieldInput =
  'w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary aria-invalid:border-red-400'
const primaryButton =
  'py-2.5 px-5 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'

/** Validation mirrors validateContact, which updateContactAction re-runs as the real guard. */
export default function ContactSupportTab({ initial }: Props) {
  const [saved, setSaved] = useState(initial.contact)
  const [version, setVersion] = useState(initial.version)
  const [email, setEmail] = useState(initial.contact.email)
  const [phone, setPhone] = useState(initial.contact.phone)
  const [touched, setTouched] = useState({ email: false, phone: false })
  const [stale, setStale] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { toast, showToast } = useToast()

  const cleanEmail = email.trim().toLowerCase()
  const cleanedPhone = cleanPhone(phone)
  const errors = { email: emailError(cleanEmail), phone: phoneError(cleanedPhone) }
  const dirty = cleanEmail !== saved.email || cleanedPhone !== saved.phone
  const valid = !errors.email && !errors.phone

  function submit(e: FormEvent) {
    e.preventDefault()
    setTouched({ email: true, phone: true })
    if (!dirty || !valid) return
    startTransition(async () => {
      const res = await updateContactAction({ email, phone }, version).catch(() => ({
        ok: false as const,
        error: 'Koneksi gagal. Coba lagi.',
        stale: false
      }))
      if (!res.ok) {
        showToast(res.error, 'error')
        if (res.stale) setStale(true)
        return
      }
      setSaved(res.contact)
      setVersion(res.version)
      setEmail(res.contact.email)
      setPhone(res.contact.phone)
      showToast('Kontak dukungan disimpan.')
    })
  }

  const field = (
    key: 'email' | 'phone',
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement>,
    hint: string
  ) => {
    const showError = touched[key] && !!errors[key]
    return (
      <div>
        <label htmlFor={`contact-${key}`} className={fieldLabel}>
          {label}
        </label>
        <input
          id={`contact-${key}`}
          {...props}
          aria-invalid={showError}
          aria-describedby={`contact-${key}-help`}
          onBlur={() => setTouched((t) => ({ ...t, [key]: true }))}
          className={fieldInput}
        />
        <p id={`contact-${key}-help`} className={`text-xs mt-1.5 ${showError ? 'text-red-600' : 'text-slate-500'}`}>
          {showError ? errors[key] : hint}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Toast toast={toast} />

      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Contact Support</h2>
        <p className="text-sm text-slate-500 mt-1 max-w-3xl">
          Email dan nomor WhatsApp utama dukungan pelanggan Saloka. Nomor ditautkan ke chat WhatsApp. Tampil di:
          Kebijakan Privasi · Syarat & Ketentuan · Pusat Bantuan. Perubahan berlaku dalam ±60 detik.
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

      <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <form noValidate onSubmit={submit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6 space-y-4">
          {field(
            'email',
            'Email dukungan',
            { type: 'email', autoComplete: 'email', spellCheck: false, maxLength: 254, value: email, onChange: (e) => setEmail(e.target.value) },
            'Contoh: support@saloka.id'
          )}
          {field(
            'phone',
            'Nomor WhatsApp dukungan',
            { type: 'tel', inputMode: 'tel', autoComplete: 'tel', maxLength: 24, value: phone, onChange: (e) => setPhone(e.target.value) },
            'Nomor seluler yang aktif di WhatsApp. Format: 08xx atau +628xx (kode negara lain juga bisa).'
          )}
          <div className="flex justify-end">
            <button type="submit" disabled={!dirty || !valid || isPending} className={primaryButton}>
              Simpan
            </button>
          </div>
        </form>

        <section aria-labelledby="contact-preview" className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-6">
          <h3 id="contact-preview" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Pratinjau
          </h3>
          <ul className="mt-3 space-y-2.5 text-sm">
            <li className="flex items-center gap-2 min-w-0">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
              {errors.email ? (
                <span className="text-slate-400">Email belum valid</span>
              ) : (
                <span className="font-semibold text-slate-800 truncate">{cleanEmail}</span>
              )}
            </li>
            <li className="flex items-center gap-2 min-w-0">
              <MessageCircle className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
              {errors.phone ? (
                <span className="text-slate-400">Nomor belum valid</span>
              ) : (
                <a
                  href={toWhatsAppHref(cleanedPhone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-primary hover:underline truncate"
                >
                  {cleanedPhone}
                </a>
              )}
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}
