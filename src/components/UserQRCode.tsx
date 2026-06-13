'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Share2, QrCode, CheckCircle2, Copy } from 'lucide-react'

interface UserQRCodeProps {
  userId: string
  userName: string
  /** Color theme for the QR modal (matches the profile template accent color) */
  accentColor?: string
  /** Hex color for QR code dark modules */
  qrDarkColor?: string
  /** Hex color for QR code light modules */
  qrLightColor?: string
  /** Button appearance variant */
  variant?: 'icon-only' | 'full'
}

export default function UserQRCode({
  userId,
  userName,
  accentColor = '#c9a227',
  qrDarkColor = '#1a1a1a',
  qrLightColor = '#ffffff',
  variant = 'full',
}: UserQRCodeProps) {
  const [open, setOpen] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Make sure we're on the client before rendering portal
  useEffect(() => { setMounted(true) }, [])

  const profileUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/profile/${userId}`
      : `/profile/${userId}`

  const generateQR = useCallback(async () => {
    if (qrDataUrl) return
    try {
      const QRCode = (await import('qrcode')).default
      const url = typeof window !== 'undefined'
        ? `${window.location.origin}/profile/${userId}`
        : `/profile/${userId}`
      const dataUrl = await QRCode.toDataURL(url, {
        width: 320,
        margin: 2,
        color: {
          dark: qrDarkColor,
          light: qrLightColor,
        },
        errorCorrectionLevel: 'H',
      })
      setQrDataUrl(dataUrl)
    } catch (e) {
      setError('Gagal membuat QR code.')
    }
  }, [userId, qrDarkColor, qrLightColor, qrDataUrl])

  useEffect(() => {
    if (open) generateQR()
  }, [open, generateQR])

  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const handleDownload = () => {
    if (!qrDataUrl) return
    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = `qr-${userName.toLowerCase().replace(/\s+/g, '-')}.png`
    a.click()
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Profil ${userName} di Saloka.id`,
          text: `Kunjungi profil ${userName} di Saloka.id!`,
          url: profileUrl,
        })
      } catch {}
    } else {
      handleCopy()
    }
  }

  const modalContent = (
    <AnimatePresence>
      {open && (
        <motion.div
          key="qr-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          // Use fixed inset-0 at body level — not inside any transformed ancestor
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            backgroundColor: 'rgba(0,0,0,0.78)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <motion.div
            key="qr-card"
            initial={{ opacity: 0, scale: 0.9, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 24 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '380px',
              background: '#111113',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 32px 64px rgba(0,0,0,0.75)',
            }}
          >
            {/* Glow accent */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '260px',
                height: '130px',
                background: `radial-gradient(ellipse at center, ${accentColor}22 0%, transparent 70%)`,
                pointerEvents: 'none',
              }}
            />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
              <div>
                <p style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: accentColor, margin: 0 }}>
                  Saloka.id
                </p>
                <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', margin: '2px 0 0' }}>QR Code Profil</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              >
                <X size={16} />
              </button>
            </div>

            {/* QR Code area */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '24px' }}>
              <div
                style={{
                  position: 'relative',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  padding: '16px',
                  background: qrLightColor,
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.07)',
                }}
              >
                {/* Corner decorations */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: 24, height: 24, borderTop: `3px solid ${accentColor}`, borderLeft: `3px solid ${accentColor}`, borderRadius: '16px 0 0 0' }} />
                <div style={{ position: 'absolute', top: 0, right: 0, width: 24, height: 24, borderTop: `3px solid ${accentColor}`, borderRight: `3px solid ${accentColor}`, borderRadius: '0 16px 0 0' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: 24, height: 24, borderBottom: `3px solid ${accentColor}`, borderLeft: `3px solid ${accentColor}`, borderRadius: '0 0 0 16px' }} />
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderBottom: `3px solid ${accentColor}`, borderRight: `3px solid ${accentColor}`, borderRadius: '0 0 16px 0' }} />

                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR Code profil ${userName}`}
                    style={{ width: 224, height: 224, borderRadius: '10px', display: 'block', userSelect: 'none' }}
                    draggable={false}
                  />
                ) : error ? (
                  <div style={{ width: 224, height: 224, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#f87171' }}>
                    {error}
                  </div>
                ) : (
                  <div style={{ width: 224, height: 224, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.15)', borderTopColor: 'rgba(255,255,255,0.7)', animation: 'spin 0.8s linear infinite' }} />
                  </div>
                )}
              </div>

              {/* User info */}
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#fff', margin: 0 }}>{userName}</p>
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginTop: '4px', fontFamily: 'monospace' }}>
                  /profile/{userId.slice(0, 8)}…
                </p>
              </div>

              {/* URL copy bar */}
              <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '10px 12px' }}>
                <span style={{ flex: 1, fontSize: '10px', color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {profileUrl}
                </span>
                <button
                  onClick={handleCopy}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 700, color: copied ? '#4ade80' : accentColor, background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'color 0.2s' }}
                >
                  {copied ? (
                    <><CheckCircle2 size={14} />Disalin!</>
                  ) : (
                    <><Copy size={14} />Salin</>
                  )}
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '0 24px 24px' }}>
              <button
                onClick={handleDownload}
                disabled={!qrDataUrl}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', fontSize: '12px', fontWeight: 700, color: '#fff', cursor: qrDataUrl ? 'pointer' : 'not-allowed', opacity: qrDataUrl ? 1 : 0.4, transition: 'background 0.2s' }}
                onMouseEnter={e => { if (qrDataUrl) e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
              >
                <Download size={14} />
                Unduh PNG
              </button>
              <button
                onClick={handleShare}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '12px', border: 'none', background: `linear-gradient(135deg, ${accentColor}, ${accentColor}bb)`, fontSize: '12px', fontWeight: 700, color: '#000', cursor: 'pointer', boxShadow: `0 8px 20px ${accentColor}40`, transition: 'transform 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
              >
                <Share2 size={14} />
                Bagikan
              </button>
            </div>

            {/* Footer note */}
            <div style={{ padding: '0 24px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', margin: 0 }}>
                Scan QR ini untuk langsung mengunjungi halaman profil merchant
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <>
      {/* Trigger Button */}
      {variant === 'full' ? (
        <button
          id={`qr-btn-${userId}`}
          onClick={() => setOpen(true)}
          style={{ borderColor: `${accentColor}40`, color: accentColor }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border bg-white/[0.03] hover:bg-white/[0.07] transition-all text-xs font-bold backdrop-blur-sm"
          aria-label="Tampilkan QR Code profil"
        >
          <QrCode className="w-3.5 h-3.5" />
          QR Code
        </button>
      ) : (
        <button
          id={`qr-icon-btn-${userId}`}
          onClick={() => setOpen(true)}
          style={{ borderColor: `${accentColor}40`, color: accentColor }}
          className="w-9 h-9 rounded-xl border bg-white/[0.03] hover:bg-white/[0.07] transition-all flex items-center justify-center backdrop-blur-sm"
          aria-label="Tampilkan QR Code profil"
        >
          <QrCode className="w-4 h-4" />
        </button>
      )}

      {/* Portal: renders modal directly on <body>, escaping any transformed/filtered ancestor */}
      {mounted && createPortal(modalContent, document.body)}
    </>
  )
}
