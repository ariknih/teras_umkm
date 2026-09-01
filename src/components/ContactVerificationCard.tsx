'use client'

import React, { useState } from 'react'
import { CheckCircle2, MessageCircle, Mail } from 'lucide-react'
import {
  sendPhoneVerificationOtp,
  verifyPhoneOtp,
  sendEmailVerificationOtp,
  verifyEmailOtp
} from '@/app/actions/auth'
import { goeyToast } from 'goey-toast'

interface ContactVerificationCardProps {
  email: string
  phone: string | null
  phoneVerified: boolean
  emailVerified: boolean
  onVerified: (type: 'phone' | 'email') => void
}

function VerifyRow({
  icon,
  label,
  value,
  verified,
  onSendOtp,
  onVerifyOtp,
  needsPhoneInput
}: {
  icon: React.ReactNode
  label: string
  value: string
  verified: boolean
  onSendOtp: (phone?: string) => Promise<{ success?: boolean; error?: string }>
  onVerifyOtp: (otp: string, phone?: string) => Promise<{ success?: boolean; error?: string }>
  needsPhoneInput?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [phoneInput, setPhoneInput] = useState(value || '')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSend = async () => {
    setError(null)
    if (needsPhoneInput && !phoneInput) {
      setError('Nomor WhatsApp wajib diisi.')
      return
    }
    setLoading(true)
    const res = await onSendOtp(phoneInput)
    setLoading(false)
    if (res.error) {
      setError(res.error)
      return
    }
    setOtpSent(true)
    goeyToast.success('Kode OTP terkirim.')
  }

  const handleVerify = async () => {
    setError(null)
    if (otp.length !== 6) {
      setError('Masukkan kode OTP 6 digit.')
      return
    }
    setLoading(true)
    const res = await onVerifyOtp(otp, phoneInput)
    setLoading(false)
    if (res.error) {
      setError(res.error)
      return
    }
    goeyToast.success(`${label} berhasil diverifikasi!`)
    setExpanded(false)
    setOtpSent(false)
    setOtp('')
  }

  return (
    <div className="p-4 border border-border-subtle rounded-[var(--radius-brand)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${verified ? 'bg-green-500/15 text-green-600' : 'bg-surface-container text-text-secondary'}`}>
            {icon}
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{label}</p>
            <p className="text-xs text-foreground/60">{value || 'Belum diisi'}</p>
          </div>
        </div>
        {verified ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-500/15 text-green-600 text-[10px] font-black uppercase tracking-wider rounded">
            <CheckCircle2 size={12} /> Terverifikasi
          </span>
        ) : (
          <button
            onClick={() => setExpanded(!expanded)}
            className="px-3 py-1.5 bg-primary text-white rounded-lg text-[10px] font-bold cursor-pointer hover:bg-primary/90 transition-colors"
          >
            Verifikasi
          </button>
        )}
      </div>

      {expanded && !verified && (
        <div className="mt-4 pt-4 border-t border-border-subtle space-y-3">
          {error && <p className="text-[11px] text-red-500 font-medium">{error}</p>}

          {needsPhoneInput && (
            <input
              type="tel"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="081234567890"
              disabled={otpSent}
              className="w-full max-w-xs h-10 px-3 bg-surface-container border border-border-subtle rounded-lg text-xs disabled:opacity-60"
            />
          )}

          {!otpSent ? (
            <button
              onClick={handleSend}
              disabled={loading}
              className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Mengirim...' : 'Kirim Kode OTP'}
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder="123456"
                className="w-32 h-10 px-3 bg-surface-container border border-border-subtle rounded-lg text-xs text-center tracking-widest"
              />
              <button
                onClick={handleVerify}
                disabled={loading}
                className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Memproses...' : 'Konfirmasi'}
              </button>
              <button
                onClick={handleSend}
                disabled={loading}
                className="text-[10px] text-primary font-bold hover:underline bg-transparent border-none cursor-pointer"
              >
                Kirim ulang
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ContactVerificationCard({ email, phone, phoneVerified, emailVerified, onVerified }: ContactVerificationCardProps) {
  return (
    <div className="p-5 border border-border-subtle rounded-[var(--radius-brand)]">
      <h3 className="text-sm font-bold text-foreground mb-1">Verifikasi Kontak</h3>
      <p className="text-xs text-foreground/60 mb-4">
        Verifikasi nomor WhatsApp dan/atau email untuk keamanan akun. Anda bisa memverifikasi salah satu atau keduanya.
      </p>
      <div className="space-y-3">
        <VerifyRow
          icon={<MessageCircle size={16} />}
          label="Nomor WhatsApp"
          value={phone || ''}
          verified={phoneVerified}
          needsPhoneInput
          onSendOtp={(p) => sendPhoneVerificationOtp(p || '')}
          onVerifyOtp={async (otp, p) => {
            const res = await verifyPhoneOtp(p || '', otp)
            if (res.success) onVerified('phone')
            return res
          }}
        />
        <VerifyRow
          icon={<Mail size={16} />}
          label="Email"
          value={email}
          verified={emailVerified}
          onSendOtp={() => sendEmailVerificationOtp()}
          onVerifyOtp={async (otp) => {
            const res = await verifyEmailOtp(otp)
            if (res.success) onVerified('email')
            return res
          }}
        />
      </div>
    </div>
  )
}
