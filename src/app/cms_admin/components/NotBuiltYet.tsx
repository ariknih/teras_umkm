import Link from 'next/link'

/**
 * Honest placeholder for menus that exist in the information architecture but
 * have no admin UI yet. Better than silently falling back to another menu's
 * content, which is what an unmapped key used to do.
 */
export default function NotBuiltYet({
  title,
  detail,
  href
}: {
  title: string
  detail: string
  href?: { label: string; url: string }
}) {
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-[var(--radius-brand)] shadow-sm p-10 text-center">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-xl">
        🚧
      </div>
      <h3 className="font-sora text-sm font-bold text-slate-800 uppercase tracking-wider">{title}</h3>
      <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">{detail}</p>
      {href && (
        <Link
          href={href.url}
          className="inline-block mt-5 px-4 py-2 bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#006E24] text-xs font-bold rounded-lg border border-[#C8E6C9] transition-colors"
        >
          {href.label}
        </Link>
      )}
    </div>
  )
}
