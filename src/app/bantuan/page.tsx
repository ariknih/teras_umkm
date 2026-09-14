import Link from 'next/link'
import { DataStore } from '@/lib/data-store'
import SupportContact from '@/components/SupportContact'

export const metadata = {
  title: 'Pusat Bantuan - Saloka.id',
  description: 'Hubungi tim dukungan Saloka.id melalui email atau telepon.'
}

export const dynamic = 'force-dynamic'

// Public destination of the footer's "Pusat Bantuan" link (/cs is the staff desk).
export default async function BantuanPage() {
  const { contact } = await DataStore.getOrgPublic()
  const hasContact = !!(contact.email || contact.phone)

  return (
    <main className="relative min-h-screen bg-bg-dark pt-16 pb-24 px-6 md:px-10 text-text-primary" id="bantuan-page">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-sora text-3xl font-extrabold text-text-primary mb-3">
          Pusat <span className="text-primary">Bantuan.</span>
        </h1>
        <p className="text-sm text-text-secondary max-w-2xl">
          Punya pertanyaan tentang pesanan, akun, atau fitur Saloka.id? Tim dukungan kami siap membantu.
        </p>

        {hasContact ? (
          <SupportContact contact={contact} heading="Kontak Dukungan" />
        ) : (
          <p role="status" className="mt-8 border border-border-subtle bg-surface-dark/60 p-6 rounded-xl text-sm text-text-secondary">
            Kontak dukungan sedang diperbarui. Silakan coba lagi nanti.
          </p>
        )}

        <p className="mt-6 text-xs text-text-secondary">
          Lihat juga{' '}
          <Link href="/privacy" className="text-primary font-semibold hover:underline">
            Kebijakan Privasi
          </Link>{' '}
          dan{' '}
          <Link href="/terms" className="text-primary font-semibold hover:underline">
            Syarat & Ketentuan
          </Link>
          .
        </p>
      </div>
    </main>
  )
}
