import { NextRequest, NextResponse } from 'next/server'
import { DataStore } from '@/lib/data-store'
import crypto from 'crypto'

/**
 * Webhook handler untuk menerima hasil verifikasi KYC dari Didit.
 * Didit akan POST ke URL ini setelah user menyelesaikan (atau gagal) verifikasi.
 *
 * Payload dari Didit (format umum):
 * {
 *   session_id: string,
 *   status: 'approved' | 'declined' | 'review',
 *   vendor_data: string (userId yang kita set waktu create session),
 *   kyc: { document: {...}, liveness: {...} },
 *   ...
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()

    // Ambil signature dari header (bisa x-signature, x-signature-v2, dll.)
    const signature = req.headers.get('x-signature') || req.headers.get('X-Signature')
    const secret = process.env.DIDIT_WEBHOOK_SECRET

    if (secret) {
      if (!signature) {
        console.error('[Didit Webhook] Missing signature header')
        return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
      }

      // Verifikasi menggunakan hmac-sha256
      const hmac = crypto.createHmac('sha256', secret)
      hmac.update(rawBody)
      const expectedSignature = hmac.digest('hex')

      try {
        const isMatch = crypto.timingSafeEqual(
          Buffer.from(signature, 'hex'),
          Buffer.from(expectedSignature, 'hex')
        )
        if (!isMatch) {
          console.error('[Didit Webhook] Signature mismatch')
          return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
        }
      } catch (err) {
        console.error('[Didit Webhook] Signature comparison failed:', err)
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    } else {
      console.warn('[Didit Webhook] DIDIT_WEBHOOK_SECRET is not configured in .env. Skipping verification.')
    }

    const payload = JSON.parse(rawBody)
    console.log('[Didit Webhook] Received payload:', JSON.stringify(payload, null, 2))

    const { session_id, status, vendor_data } = payload
    const userId = vendor_data // kita simpan userId sebagai vendor_data

    if (!userId) {
      console.warn('[Didit Webhook] No vendor_data (userId) found in payload')
      return NextResponse.json({ received: true })
    }

    // Simpan status KYC ke database
    if (status === 'approved' || status === 'Approved') {
      await DataStore.updateKycStatus(userId, 'VERIFIED', session_id)
      console.log(`[Didit Webhook] User ${userId} KYC VERIFIED`)
    } else if (status === 'declined' || status === 'Declined' || status === 'rejected') {
      await DataStore.updateKycStatus(userId, 'REJECTED', session_id)
      console.log(`[Didit Webhook] User ${userId} KYC REJECTED`)
    } else {
      // 'review', 'pending', atau status lain
      await DataStore.updateKycStatus(userId, 'PENDING', session_id)
      console.log(`[Didit Webhook] User ${userId} KYC status: ${status}`)
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('[Didit Webhook] Error:', err)
    // Return 200 agar Didit tidak retry terus-menerus
    return NextResponse.json({ received: true, error: err.message })
  }
}
