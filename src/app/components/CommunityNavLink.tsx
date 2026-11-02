'use client'

import Link from 'next/link'
import type { UserCommunitySummary } from './CommunityPickerModal'

export default function CommunityNavLink({
  className,
  onNavigate,
  children
}: {
  communities?: UserCommunitySummary[]
  className?: string
  onNavigate?: () => void
  children: React.ReactNode
}) {
  return (
    <Link
      href="/community"
      prefetch={true}
      onClick={() => onNavigate?.()}
      className={className}
    >
      {children}
    </Link>
  )
}

