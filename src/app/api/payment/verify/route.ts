import { NextRequest, NextResponse } from 'next/server'
import { getGatewayById, decodeOrderUserId } from '@/lib/payment-gateway'
import {
  getPendingContext,
  deletePendingContext,
  purposeFromOrderId,
  settlePurpose,
  claimTransaction,
  releaseTransaction,
  isTransactionClaimed
} from '@/lib/payment-purposes'
import { logAudit } from '@/lib/audit-log'
import { getCurrentUser } from '@/app/actions/auth'
import { revalidatePath } from 'next/cache'
import { deleteCache, invalidateCachePattern } from '@/lib/cache'

/**
 * One verify endpoint for every gateway-backed purpose. Never trusts a
 * client-reported status — always re-queries the gateway that created the
 * checkout (recorded in the pending context) directly, then settles through
 * the vendor-agnostic purpose registry.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Anda harus masuk terlebih dahulu.' }, { status: 401 })
    }

    const body = await req.json()
    const orderId = body.orderId
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID wajib diisi.' }, { status: 400 })
    }

    const purpose = purposeFromOrderId(orderId)
    if (!purpose) {
      return NextResponse.json({ error: 'Order ID tidak dikenali.' }, { status: 400 })
    }

    // Ownership check first, before anything else responds with the order's
    // status — a caller who isn't the order's owner (or an admin) gets a flat
    // 403 regardless of whether the order is pending or already settled, so
    // guessing/enumerating another user's orderId can't even confirm it succeeded.
    // orderId encodes who paid — this never settles into the caller's own
    // session id, always the id the checkout was actually opened for.
    const orderUserId = decodeOrderUserId(orderId)
    if (orderUserId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Order ini bukan milik sesi Anda.' }, { status: 403 })
    }

    const ctx = await getPendingContext(orderId)
    if (!ctx) {
      // Settlement deletes the context, so "no context" usually just means the
      // webhook got here first and the user is reloading the return page.
      if (await isTransactionClaimed(orderId)) {
        return NextResponse.json({
          success: true,
          status: 'SUCCESS',
          message: 'Transaksi sudah diproses sebelumnya.',
          processed: true
        })
      }
      return NextResponse.json(
        { error: 'Konteks transaksi tidak ditemukan (server mungkin baru saja restart). Silakan buat pembayaran baru.' },
        { status: 410 }
      )
    }

    const gateway = getGatewayById(ctx.gatewayId)
    if (!gateway) {
      return NextResponse.json({ error: 'Gateway pembayaran tidak dikenal.' }, { status: 500 })
    }

    let status: string
    let amount: number
    try {
      const s = await gateway.getStatus(orderId)
      status = s.status
      amount = s.amount
    } catch (err: any) {
      console.error(`Failed to query ${gateway.id} status.`, err)
      return NextResponse.json({ error: `Gagal memeriksa status pembayaran: ${err.message}` }, { status: 500 })
    }

    if (status !== 'SUCCESS') {
      return NextResponse.json({
        success: true,
        status,
        message: 'Transaksi belum diselesaikan (menunggu pembayaran).',
        processed: false
      })
    }

    // Claim before settling. The webhook may be settling this same order on
    // another instance right now; whoever loses the claim must not also credit.
    if (!(await claimTransaction(orderId))) {
      return NextResponse.json({
        success: true,
        status: 'SUCCESS',
        message: 'Transaksi sudah diproses sebelumnya.',
        processed: true
      })
    }

    try {
      // payCommunityJoinFee reports some failures (community/user not found) as
      // a returned { error } rather than a throw — treat it as one, so the
      // pending context isn't deleted for an order that never settled.
      const res: any = await settlePurpose(purpose, orderUserId, amount, orderId, ctx)
      if (res?.error) throw new Error(res.error)
    } catch (e: any) {
      // Unique orderId constraint violation (SAVINGS/COIN_TOPUP) means an
      // earlier call already settled this order — idempotent no-op, not an
      // error to surface to the user. The claim stays.
      if (e.code === 'P2002' || /sudah diproses sebelumnya/.test(e.message || '')) {
        await deletePendingContext(orderId)
        return NextResponse.json({
          success: true,
          status: 'SUCCESS',
          message: 'Transaksi sudah diproses sebelumnya.',
          processed: true
        })
      }
      // Genuine failure: give the claim back so the gateway's retry can settle
      // it. Holding the claim here would strand a paid order permanently.
      await releaseTransaction(orderId)
      throw e
    }

    await deletePendingContext(orderId)
    await logAudit({
      actor: 'MEMBER',
      actorId: orderUserId,
      action: 'PAYMENT_SETTLED',
      module: purpose === 'COIN_TOPUP' ? 'COINS' : 'COOPERATIVE',
      targetId: orderId,
      targetType: 'PAYMENT_ORDER',
      detail: `${purpose} settled via ${gateway.id}, Rp ${amount.toLocaleString('id-ID')}.`
    })

    if (purpose === 'JOIN_FEE') {
      deleteCache('community:induk:all')
      deleteCache(`community:members:${ctx.communityId}`)
      deleteCache(`community:stats:${ctx.communityId}`)
      invalidateCachePattern('community:induk:*')
      invalidateCachePattern('user:communities:roles:*')
      revalidatePath('/community')
      revalidatePath('/merchant/dashboard')
      revalidatePath('/cms_admin', 'layout')
    }
    revalidatePath(`/community/${ctx.communityId}`)
    if (purpose === 'COIN_TOPUP') revalidatePath('/cms_admin', 'layout')

    return NextResponse.json({
      success: true,
      status,
      message: 'Pembayaran berhasil diselesaikan.',
      processed: true
    })
  } catch (error: any) {
    console.error('Error in /api/payment/verify:', error)
    return NextResponse.json({ error: error.message || 'Gagal memverifikasi transaksi.' }, { status: 500 })
  }
}
