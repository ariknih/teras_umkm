import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getCurrentUser } from '@/app/actions/auth'
import { DataStore } from '@/lib/data-store'
import { getPrimaryGateway } from '@/lib/payment-gateway'
import { PurposeKey, prefixForPurpose, resolveCheckoutAmount, savePendingContext } from '@/lib/payment-purposes'
import { readCommunityReferralCookie } from '@/lib/referral-payout'

const VALID_PURPOSES: PurposeKey[] = ['JOIN_FEE', 'SAVINGS', 'COIN_TOPUP']

/**
 * One checkout endpoint for every gateway-backed purpose (join fee, savings
 * deposit, coin top-up) — vendor-agnostic: it only talks to the active
 * gateway via lib/payment-gateway.ts, never to DOKU/Midtrans directly.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Anda harus masuk terlebih dahulu.' }, { status: 401 })
    }

    const protocol = req.headers.get('x-forwarded-proto') || 'http'
    const host = req.headers.get('host') || 'localhost:3000'
    const baseUrl = `${protocol}://${host}`

    const body = await req.json()
    const { purpose, communityId, savingsType, requestedAmount, jumlahCoin, returnPath } = body

    if (!VALID_PURPOSES.includes(purpose)) {
      return NextResponse.json({ error: 'Tipe pembayaran tidak didukung.' }, { status: 400 })
    }
    if (!communityId) {
      return NextResponse.json({ error: 'Komunitas wajib diisi.' }, { status: 400 })
    }

    // The paid-join path never routed through joinCommunity's KYC / recruitment
    // -lock / empty-kas gates (those only guarded the free-join path) — closing
    // that gap here, since this is the one place a paid join now originates from.
    if (purpose === 'JOIN_FEE') {
      const community = await DataStore.getCommunityByIdStrict(communityId)
      if (!community) return NextResponse.json({ error: 'Komunitas tidak ditemukan.' }, { status: 404 })
      if ((community as any).isKycRequired) {
        const isKycOk = (user as any).kycStatus === 'VERIFIED' || (user as any).kycStatus === 'APPROVED'
        if (!isKycOk) {
          return NextResponse.json({ error: 'Komunitas ini mewajibkan verifikasi KYC (KTP/Selfie) untuk bergabung.', needsKyc: true }, { status: 400 })
        }
      }
      if ((community as any).isRecruitmentLocked) {
        return NextResponse.json({ error: 'Rekrutmen komunitas dikunci. Hubungi ketua komunitas.' }, { status: 400 })
      }
      // Coin kas is a KOPERASI-only mechanic — Perkumpulan (FREE or PAID/Premium)
      // has no coin system, so it must never be gated on coinBalance.
      if ((community as any).category === 'KOPERASI' && (community as any).coinBalance <= 0) {
        return NextResponse.json({ error: 'Rekrutmen komunitas dikunci karena kas koin kosong. Hubungi ketua komunitas.' }, { status: 400 })
      }
      // The UI already hides the "pay to join" button once isMember is true,
      // but nothing server-side stopped a stale page or a direct call here
      // from opening (and paying for) a second checkout for a membership the
      // user already has — settlement is safely a no-op via the isPaid CAS,
      // but the user's money would already be gone with no refund path.
      if (await DataStore.isCommunityMember(user.id, communityId)) {
        return NextResponse.json({ error: 'Anda sudah menjadi anggota komunitas ini.' }, { status: 400 })
      }
    }

    // Coin top-up was ketua/admin-only in the original free-topup action —
    // that check was dropped when this moved into the shared checkout route.
    // Any logged-in user could otherwise pay to inflate a community's coin
    // balance (which gates loan eligibility and recruitment) on someone else's behalf.
    if (purpose === 'COIN_TOPUP') {
      const community = await DataStore.getCommunityByIdStrict(communityId)
      if (!community) return NextResponse.json({ error: 'Komunitas tidak ditemukan.' }, { status: 404 })
      if (community.ketuaId !== user.id && user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Hanya Ketua Komunitas yang bisa top up coin.' }, { status: 403 })
      }
    }

    const { amount, itemName } = await resolveCheckoutAmount(purpose, {
      communityId,
      jumlahCoin,
      requestedAmount
    })

    // Community-scoped referral (who this join was referred by), captured as
    // a first-touch cookie when the user opened /community/[id]?ref=... —
    // this is the only place a paid join actually creates its membership row.
    let referrerId: string | null = null
    if (purpose === 'JOIN_FEE') {
      const communityRefCookie = readCommunityReferralCookie(await cookies(), communityId, user.id)
      if (communityRefCookie) {
        const referrer = await DataStore.findUserByReferralCode(communityRefCookie)
        if (referrer) referrerId = referrer.id
      }
    }

    const gateway = getPrimaryGateway()
    const orderId = `${prefixForPurpose(purpose)}-${gateway.encodeUserId(user.id)}-${Date.now().toString(36)}`

    savePendingContext(orderId, {
      purpose,
      gatewayId: gateway.id,
      communityId,
      savingsType,
      jumlahCoin: jumlahCoin ? Math.floor(Number(jumlahCoin)) : undefined,
      referrerId
    })

    const path = typeof returnPath === 'string' && returnPath.startsWith(`/community/${communityId}`)
      ? returnPath
      : `/community/${communityId}`

    const { redirectUrl } = await gateway.createCheckout({
      orderId,
      amount,
      customerName: user.name,
      customerEmail: user.email,
      itemName,
      callbackUrl: `${baseUrl}${path}?payment_order=${orderId}`
    })

    return NextResponse.json({ success: true, orderId, redirectUrl, amount, gateway: gateway.id })
  } catch (error: any) {
    console.error('Error in /api/payment/checkout:', error)
    return NextResponse.json({ error: error.message || 'Gagal memproses pembayaran.' }, { status: 500 })
  }
}
