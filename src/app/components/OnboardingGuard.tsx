'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface OnboardingGuardProps {
  userSetupCompleted: boolean
  isLoggedIn: boolean
}

export default function OnboardingGuard({ userSetupCompleted, isLoggedIn }: OnboardingGuardProps) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isLoggedIn && !userSetupCompleted) {
      const isAuthPage = pathname === '/auth'
      const isOnboardingPage = pathname === '/onboarding'
      const isApi = pathname.startsWith('/api')

      if (!isAuthPage && !isOnboardingPage && !isApi) {
        router.push('/onboarding')
      }
    }
  }, [isLoggedIn, userSetupCompleted, pathname, router])

  return null
}
