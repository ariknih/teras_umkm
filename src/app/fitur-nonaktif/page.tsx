import Link from 'next/link'
import type { Metadata } from 'next'
import { DataStore } from '@/lib/data-store'
import { defaultEntryFor, findFeature } from '@/lib/features'

// Rendered for src/proxy.ts, which re-serves this HTML with a 503 status for
// every route of a feature disabled in /cms_admin/features. No robots meta
// here: the served response is a 503 (content ignored by crawlers), and a
// noindex baked into this HTML must never ride along onto Beranda. Direct
// visits to /fitur-nonaktif get an x-robots-tag from the proxy instead.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Fitur Sedang Disempurnakan | Saloka.id'
}

export default async function FiturNonaktifPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const { f } = await searchParams
  const { config } = await DataStore.getFeatureControl()
  // parseFeatureControl guarantees at least one feature is ON, so the final
  // fallback (no `f`, or `f` is the only active feature) always resolves.
  const entry = (f && findFeature(f) && config[f]) || defaultEntryFor(config, f ?? '') || defaultEntryFor(config, '')!
  const href = findFeature(entry.target)!.href

  return (
    <main className="min-h-[70vh] flex flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <h1 className="max-w-md text-xl sm:text-2xl font-bold text-slate-800">
        Fitur ini sedang dalam tahap penyempurnaan untuk pengalaman yang lebih baik.
      </h1>
      <Link href={href} className="btn-primary">
        {entry.cta}
      </Link>
    </main>
  )
}
