import LegalPage from '@/components/LegalPage'

export const metadata = {
  title: 'Syarat & Ketentuan Layanan - Saloka.id',
  description: 'Syarat dan ketentuan layanan Saloka.id yang mengatur hak, kewajiban, dan tanggung jawab pengguna, merchant, serta pembeli di platform kami.',
}

// Content is managed in /cms_admin/org-terms, so never bake it in at build time.
export const dynamic = 'force-dynamic'

export default function TermsPage() {
  return (
    <LegalPage
      slug="terms"
      title={
        <>
          Syarat & Ketentuan <span className="text-primary">Layanan.</span>
        </>
      }
    />
  )
}
