import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/app/actions/auth'
import { DataStore } from '@/lib/data-store'

const DIDIT_API_KEY = process.env.DIDIT_API_KEY!
const DIDIT_BASE_URL = process.env.DIDIT_BASE_URL || 'https://verification.didit.me'

// Per-session config — NOT a secret, NOT an env var (per Didit docs)
const WORKFLOW_ID = process.env.DIDIT_WORKFLOW_ID || 'e697a038-ffc1-466f-a86a-39c483eb33d7'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Dynamically detect origin to handle localhost, tunnels, or production redirects correctly
    const requestUrl = new URL(req.url)
    const origin = requestUrl.origin
    const callbackUrl = `${origin}/kyc/callback`

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
        callback: callbackUrl, // where Didit redirects user after flow
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('[Didit KYC] Session creation failed:', response.status, errText)
      
      let errorMsg = 'Gagal membuat sesi verifikasi KYC. Silakan coba lagi.'
      try {
        const errObj = JSON.parse(errText)
        if (errObj.detail && (errObj.detail.includes('credits') || errObj.detail.includes('credit'))) {
          errorMsg = 'Sesi verifikasi gagal karena kuota API Didit habis. Silakan gunakan fitur "Simulasi KYC Lulus (Bypass)" di halaman Pengaturan.'
        }
      } catch (_) {}

      return NextResponse.json(
        { error: errorMsg },
        { status: response.status }
      )
    }

    const data = await response.json()
    // Didit V3 returns: { session_id, session_token, url, status, workflow_id, vendor_data }
    
    // Save session ID and set status to PENDING immediately in the database
    await DataStore.updateKycStatus(user.id, 'PENDING', data.session_id)

    return NextResponse.json({
      sessionId: data.session_id,
      url: data.url, // web: open this URL (SDK/iframe/redirect)
    })
  } catch (err: any) {
    console.error('[Didit KYC] Error:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
