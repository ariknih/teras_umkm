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
      const isSetupPage = pathname === '/setup-landing'
      const isApi = pathname.startsWith('/api')

      if (!isAuthPage && !isSetupPage && !isApi) {
        router.push('/setup-landing')
      }
    }
  }, [isLoggedIn, userSetupCompleted, pathname, router])

  return null
}
