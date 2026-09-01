'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { requestPasswordReset, resetPasswordWithOtp } from '@/app/actions/auth'
import { PasswordInput } from '@/components/ui/password-input'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!phone.trim()) {
      setError('Nomor WhatsApp wajib diisi.')
      return
    }
    startTransition(async () => {
      const res = await requestPasswordReset(phone)
      if (res.error) {
        setError(res.error)
        return
      }
      setStep(2)
    })
  }

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (otp.length !== 6) {
      setError('Masukkan kode OTP 6 digit.')
      return
    }
    if (newPassword.length < 6) {
      setError('Password baru minimal 6 karakter.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.')
      return
    }
    startTransition(async () => {
      const res = await resetPasswordWithOtp(phone, otp, newPassword)
      if (res.error) {
        setError(res.error)
        return
      }
      setSuccess('Password berhasil diubah. Silakan masuk dengan password baru.')
      setStep(3)
    })
  }

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center py-16 px-4 md:px-10 overflow-hidden bg-bg-dark">
      <div className="w-full max-w-[420px] z-10 flex flex-col items-center mx-auto bg-surface border border-outline-variant rounded-xl p-6 sm:p-8 auth-card-shadow animate-in fade-in zoom-in-95 duration-300">
        <div className="text-center mt-2 mb-6">
          <h2 className="text-xl font-extrabold tracking-tight text-on-surface font-sora">
            Lupa Kata Sandi
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            {step === 1 && 'Masukkan nomor WhatsApp terdaftar untuk menerima kode OTP.'}
            {step === 2 && 'Masukkan kode OTP yang dikirim ke WhatsApp Anda dan buat password baru.'}
            {step === 3 && 'Password berhasil diperbarui.'}
          </p>
        </div>

        {error && (
          <div className="w-full p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded text-[11px] text-red-400 font-medium animate-in fade-in duration-300">
            {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="w-full space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fp-phone" className="text-xs font-semibold text-text-secondary">Nomor WhatsApp</Label>
              <Input
                id="fp-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08xxxxxxxxxx"
                className="pl-4 py-3"
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 mt-2 bg-primary hover:bg-primary/95 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors shadow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isPending ? 'Mengirim...' : 'Kirim Kode OTP'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleResetPassword} className="w-full space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fp-otp" className="text-xs font-semibold text-text-secondary">Kode OTP</Label>
              <Input
                id="fp-otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder="123456"
                className="pl-4 py-3 tracking-widest text-center"
              />
            </div>
            <PasswordInput
              id="fp-new-password"
              value={newPassword}
              onChange={setNewPassword}
              label="Password Baru"
              showStrength
              required
            />
            <PasswordInput
              id="fp-confirm-password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              label="Konfirmasi Password Baru"
              required
            />
            <button
              type="button"
              onClick={() => { setStep(1); setError(null) }}
              className="text-[10px] text-primary hover:underline font-semibold"
            >
              Kirim ulang kode OTP
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-3 mt-2 bg-primary hover:bg-primary/95 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors shadow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isPending ? 'Memproses...' : 'Ubah Password'}
            </button>
          </form>
        )}

        {step === 3 && (
          <div className="w-full space-y-4">
            {success && (
              <div className="w-full p-3 bg-green-500/10 border border-green-500/20 rounded text-[11px] text-green-500 font-medium">
                {success}
              </div>
            )}
            <button
              type="button"
              onClick={() => router.push('/auth?tab=login')}
              className="w-full py-3 bg-primary hover:bg-primary/95 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors shadow cursor-pointer"
            >
              Kembali ke Halaman Masuk
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
