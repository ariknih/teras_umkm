import LegalPage from '@/components/LegalPage'

export const metadata = {
  title: 'Kebijakan Privasi - Saloka.id',
  description: 'Kebijakan privasi Saloka.id menjelaskan bagaimana kami mengumpulkan, melindungi, dan menggunakan informasi pribadi Anda pada platform kami.',
}

// Content is managed in /cms_admin/org-privacy, so never bake it in at build time.
export const dynamic = 'force-dynamic'

export default function PrivacyPage() {
  return (
    <LegalPage
      slug="privacy"
      title={
        <>
          Kebijakan <span className="text-primary">Privasi.</span>
        </>
      }
    />
  )
}
