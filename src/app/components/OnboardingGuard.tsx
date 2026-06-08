'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface OnboardingGuardProps {
  userSetupCompleted: boolean
  isLoggedIn: boolean
  userId: string
}

export default function OnboardingGuard({ userSetupCompleted, isLoggedIn, userId }: OnboardingGuardProps) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    let localCompleted = false
    if (typeof window !== 'undefined' && userId) {
      localCompleted = localStorage.getItem(`onboarding_completed_${userId}`) === 'true'
    }

    if (isLoggedIn && !userSetupCompleted && !localCompleted) {
      const isAuthPage = pathname === '/auth'
      const isOnboardingPage = pathname === '/onboarding'
      const isApi = pathname.startsWith('/api')

      if (!isAuthPage && !isOnboardingPage && !isApi) {
        router.push('/onboarding')
      }
    }
  }, [isLoggedIn, userSetupCompleted, pathname, router, userId])

  return null
}
