'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import CommunityPickerModal, { UserCommunitySummary } from './CommunityPickerModal'

export default function CommunityNavLink({
  communities,
  className,
  onNavigate,
  children
}: {
  communities: UserCommunitySummary[]
  className?: string
  onNavigate?: () => void
  children: React.ReactNode
}) {
  const router = useRouter()
  const [pickerOpen, setPickerOpen] = useState(false)

  const href = communities.length === 1 ? `/community/${communities[0].communityId}` : '/community'

  function handleClick(e: React.MouseEvent) {
    if (communities.length > 1) {
      e.preventDefault()
      setPickerOpen(true)
      return
    }
    onNavigate?.()
  }

  function handleSelect(communityId: string) {
    setPickerOpen(false)
    onNavigate?.()
    router.push(`/community/${communityId}`)
  }

  return (
    <>
      <Link href={href} prefetch={true} onClick={handleClick} className={className}>
        {children}
      </Link>
      {pickerOpen && (
        <CommunityPickerModal
          communities={communities}
          onSelect={handleSelect}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </>
  )
}
