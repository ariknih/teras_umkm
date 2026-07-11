import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/app/actions/auth'

const DIDIT_API_KEY = process.env.DIDIT_API_KEY!
const DIDIT_BASE_URL = process.env.DIDIT_BASE_URL || 'https://verification.didit.me'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Per-session config — NOT a secret, NOT an env var (per Didit docs)
const WORKFLOW_ID = '96a29c62-e1d0-4328-8a78-e402dfa6aa58' // KYC + AML (Free)

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create a KYC session via Didit V3 API
    const response = await fetch(`${DIDIT_BASE_URL}/v3/session/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': DIDIT_API_KEY,
      },
      body: JSON.stringify({
        workflow_id: WORKFLOW_ID,
        vendor_data: user.id, // stable internal user id — used to identify user in webhook
        callback: `${APP_URL}/kyc/callback`, // where Didit redirects user after flow
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('[Didit KYC] Session creation failed:', response.status, errText)
      return NextResponse.json(
        { error: 'Gagal membuat sesi verifikasi KYC. Silakan coba lagi.' },
        { status: 500 }
      )
    }

    const data = await response.json()
    // Didit V3 returns: { session_id, session_token, url, status, workflow_id, vendor_data }
    return NextResponse.json({
      sessionId: data.session_id,
      url: data.url, // web: open this URL (SDK/iframe/redirect)
    })
  } catch (err: any) {
    console.error('[Didit KYC] Error:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
