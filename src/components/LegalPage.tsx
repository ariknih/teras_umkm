import { Fragment, type ReactNode } from 'react'
import Link from 'next/link'
import { DataStore } from '@/lib/data-store'
import { LEGACY_LEGAL, LEGACY_UPDATED } from '@/lib/legal-legacy'
import { formatLegalTimestamp, type DocNode, type LegalSlug } from '@/lib/organization'
import SupportContact from './SupportContact'

// The ids the pages had before the CMS took over their content.
const PAGE_IDS: Record<LegalSlug, string> = { privacy: 'privacy-policy-page', terms: 'terms-of-service-page' }

// Editor H1–H3 render one level down, so the page title stays the only <h1>.
const HEADINGS = {
  1: ['h2', 'font-sora text-base font-bold text-text-primary pt-4 first:pt-0'],
  2: ['h3', 'font-sora text-sm font-bold text-text-primary pt-3 first:pt-0'],
  3: ['h4', 'font-sora text-sm font-semibold text-text-primary pt-2 first:pt-0']
} as const

function renderText(node: DocNode): ReactNode {
  return (node.marks ?? []).reduce<ReactNode>((child, mark) => {
    if (mark.type === 'bold') return <strong className="font-bold text-text-primary">{child}</strong>
    if (mark.type === 'italic') return <em>{child}</em>
    const newTab = /^https?:/i.test(mark.attrs.href)
    return (
      <a
        href={mark.attrs.href}
        className="text-primary underline underline-offset-2"
        {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {child}
      </a>
    )
  }, node.text)
}

/**
 * Plain React elements only: React escapes all text and there is no
 * dangerouslySetInnerHTML, so stored content can't inject markup. The doc was
 * already allowlisted by validateLegalDoc on save and again on read.
 */
function renderNode(node: DocNode, key: number): ReactNode {
  const children = node.content?.map(renderNode)
  switch (node.type) {
    case 'text':
      return <Fragment key={key}>{renderText(node)}</Fragment>
    case 'hardBreak':
      return <br key={key} />
    case 'paragraph':
      return <p key={key}>{children}</p>
    case 'heading': {
      const [Tag, className] = HEADINGS[(node.attrs?.level ?? 1) as 1 | 2 | 3]
      return (
        <Tag key={key} className={className}>
          {children}
        </Tag>
      )
    }
    case 'bulletList':
      return (
        <ul key={key} className="list-disc pl-5 space-y-1.5">
          {children}
        </ul>
      )
    case 'orderedList':
      return (
        <ol key={key} start={node.attrs?.start} className="list-decimal pl-5 space-y-1.5">
          {children}
        </ol>
      )
    case 'listItem':
      return (
        <li key={key} className="space-y-1.5">
          {children}
        </li>
      )
    default:
      return null
  }
}

/** Shared shell for /privacy and /terms: the published document from the CMS, or the pre-CMS copy until the first publish. */
export default async function LegalPage({ slug, title }: { slug: LegalSlug; title: ReactNode }) {
  const [{ doc, publishedAt }, { contact }] = await Promise.all([
    DataStore.getPublishedLegal(slug),
    DataStore.getOrgPublic()
  ])
  const body = doc ?? LEGACY_LEGAL[slug]
  const updated = doc
    ? publishedAt && <time dateTime={publishedAt}>{formatLegalTimestamp(publishedAt)}</time>
    : LEGACY_UPDATED

  return (
    <main className="relative min-h-screen bg-bg-dark pt-16 pb-24 px-6 md:px-10 text-text-primary" id={PAGE_IDS[slug]}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1400px] h-[400px] bg-[radial-gradient(circle_at_center,rgba(198,169,107,0.04)_0%,transparent_70%)] pointer-events-none z-0" />
      <div className="relative z-10 max-w-4xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-geist font-bold text-text-secondary hover:text-primary tracking-wider uppercase mb-8 transition-colors"
          id="back-to-home-link"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Kembali ke Beranda
        </Link>

        <h1 className="font-sora text-3xl font-extrabold text-text-primary mb-6">{title}</h1>
        {updated && <p className="text-xs text-text-secondary mb-10">Terakhir Diperbarui: {updated}</p>}

        <div className="space-y-3 text-sm text-text-secondary leading-relaxed border border-border-subtle bg-surface-dark/60 p-6 md:p-10 rounded-xl backdrop-blur-md">
          {body.content?.map(renderNode)}
        </div>

        <SupportContact contact={contact} />
      </div>
    </main>
  )
}
