'use client'

import { useState } from 'react'
import { Check, Copy, Mail, MessageCircle } from 'lucide-react'
import { toWhatsAppHref, type Contact } from '@/lib/organization'

/**
 * Saloka's support channels from /cms_admin/org-contact. Renders nothing when neither is set.
 * The email is copyable text rather than a mailto: link, which does nothing on
 * devices without a configured mail app.
 */
export default function SupportContact({ contact, heading = 'Butuh bantuan?' }: { contact: Contact; heading?: string }) {
  const [copy, setCopy] = useState<'idle' | 'copied' | 'failed'>('idle')
  if (!contact.email && !contact.phone) return null

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(contact.email)
      setCopy('copied')
    } catch {
      // Clipboard API is unavailable on insecure origins or when permission is denied.
      setCopy('failed')
    }
    setTimeout(() => setCopy('idle'), 2500)
  }

  return (
    <section
      aria-labelledby="support-contact-heading"
      className="mt-8 border border-border-subtle bg-surface-dark/60 p-6 md:p-8 rounded-xl"
    >
      <h2 id="support-contact-heading" className="font-sora text-base font-bold text-text-primary">
        {heading}
      </h2>
      <p className="text-sm text-text-secondary mt-1">Hubungi tim dukungan Saloka.id:</p>
      <ul className="mt-4 flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-8 text-sm">
        {contact.email && (
          <li className="flex flex-wrap items-center gap-2">
            <Mail className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
            {/* select-all overrides the body's select-none so manual copying still works. */}
            <span className="font-semibold text-text-primary select-all break-all">{contact.email}</span>
            <button
              type="button"
              onClick={copyEmail}
              aria-label={`Salin email ${contact.email}`}
              className="inline-flex items-center gap-1 rounded-lg border border-border-subtle px-2 py-1 text-xs font-semibold text-text-secondary hover:text-primary hover:border-primary transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {copy === 'copied' ? (
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              {copy === 'copied' ? 'Tersalin' : 'Salin'}
            </button>
            <span aria-live="polite" className="text-xs text-text-secondary">
              {copy === 'failed' ? 'Gagal menyalin, silakan salin manual.' : copy === 'copied' ? <span className="sr-only">Email disalin</span> : null}
            </span>
          </li>
        )}
        {contact.phone && (
          <li>
            <a
              href={toWhatsAppHref(contact.phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-semibold text-primary hover:underline underline-offset-2"
            >
              <MessageCircle className="w-4 h-4" aria-hidden="true" />
              WhatsApp {contact.phone}
            </a>
          </li>
        )}
      </ul>
    </section>
  )
}
