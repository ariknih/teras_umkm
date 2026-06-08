import { redirect } from 'next/navigation'

// Setup-landing is deprecated. All merchant setup is now done via the builder.
export default function SetupLandingPage() {
  redirect('/merchant/dashboard')
}
