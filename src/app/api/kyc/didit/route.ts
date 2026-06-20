import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/app/actions/auth'

const DIDIT_API_KEY = process.env.DIDIT_API_KEY!
const DIDIT_WORKFLOW_ID = process.env.DIDIT_WORKFLOW_ID || 'Free KYC'
const DIDIT_BASE_URL = process.env.DIDIT_BASE_URL || 'https://verification.didit.me'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create a KYC session via Didit API
    const response = await fetch(`${DIDIT_BASE_URL}/v1/session/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': DIDIT_API_KEY,
      },
      body: JSON.stringify({
        workflow_id: DIDIT_WORKFLOW_ID,
        redirect_url: `${APP_URL}/kyc/callback`,
        callback: `${APP_URL}/api/didit/webhook`,
        vendor_data: user.id, // kita simpan userId untuk identifikasi di webhook
        // Prefill data jika ada
        prefill: {
          full_name: user.name,
          email: user.email,
        }
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

    // Didit returns: { session_id, url, status, ... }
    return NextResponse.json({
      sessionId: data.session_id || data.id,
      url: data.url || data.verification_url,
    })
  } catch (err: any) {
    console.error('[Didit KYC] Error:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
