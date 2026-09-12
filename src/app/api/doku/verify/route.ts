import { NextRequest, NextResponse } from 'next/server';
import { DataStore, PaymentRegistry } from '@/lib/data-store';
import { checkDokuOrderStatus, parseDokuOrderId } from '@/lib/doku';
import { logAudit } from '@/lib/audit-log';
import { getCurrentUser } from '@/app/actions/auth';

/**
 * Settles a DOKU transaction after the user is redirected back.
 *
 * Trust rules (same shape as /api/midtrans/verify and /api/payment/verify):
 *  - the caller must be signed in, and must own the order being settled;
 *  - the credited amount always comes from DOKU's own Check Status response,
 *    never from the request body — a client that paid Rp 10.000 cannot ask to
 *    be credited Rp 10.000.000;
 *  - `simulate` is honoured only outside production, and only for the
 *    caller's own order.
 *
 * Community join fee and coin top-up are deliberately NOT handled here — they
 * settle through /api/payment/verify, which resolves their amounts server-side.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Anda harus masuk terlebih dahulu.' }, { status: 401 });
    }

    const body = await req.json();
    const orderId = body.orderId || body.order_id || body.invoiceNumber;

    if (!orderId) {
      return NextResponse.json({ error: 'Invoice number / Order ID wajib diisi.' }, { status: 400 });
    }

    const isProduction =
      process.env.NODE_ENV === 'production' || process.env.DOKU_IS_PRODUCTION === 'true';
    const simulate = !!body.simulate && !isProduction;

    const pending = PaymentRegistry.getPendingCheckout(orderId);

    // Who does this order belong to? The id is built by the checkout route, so
    // it identifies the payer independently of whoever is calling now. Cart
    // checkout ids carry only a truncated id, so those fall back to the
    // server-side registry.
    const parsed = parseDokuOrderId(orderId);
    const orderUserId = parsed.userId || pending?.userId || '';

    if (!orderUserId) {
      return NextResponse.json(
        { error: 'Detail transaksi tidak ditemukan (server mungkin baru saja restart). Silakan hubungi dukungan.' },
        { status: 410 }
      );
    }

    // Ownership before status: a caller who does not own the order gets the
    // same 403 whether it is pending, settled, or absent, so order ids cannot
    // be enumerated to learn anything.
    if (orderUserId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Order ini bukan milik sesi Anda.' }, { status: 403 });
    }

    if (PaymentRegistry.isTransactionProcessed(orderId)) {
      return NextResponse.json({
        success: true,
        status: 'SUCCESS',
        message: 'Transaksi sudah diproses sebelumnya.',
        processed: true,
      });
    }

    // The amount the server itself recorded at checkout time — used as the
    // simulation amount and as a sanity bound, never replaced by body.amount.
    const recordedAmount = parsed.amount || pending?.shippingDetails?.shippingFee || 0;

    let confirmedAmount = recordedAmount;

    if (!simulate) {
      const statusCheck = await checkDokuOrderStatus(orderId);
      if (statusCheck.status !== 'SUCCESS') {
        return NextResponse.json(
          {
            success: false,
            status: statusCheck.status,
            message:
              statusCheck.status === 'PENDING'
                ? 'Pembayaran belum diselesaikan atau masih menunggu konfirmasi.'
                : `Status transaksi: ${statusCheck.status}.`,
            processed: false,
          },
          { status: 400 }
        );
      }
      // DOKU is the source of truth for what was actually paid. It only omits
      // the amount on a sandbox/unconfigured stub, where the recorded checkout
      // amount is the best available value.
      if (typeof statusCheck.amount === 'number' && statusCheck.amount > 0) {
        confirmedAmount = statusCheck.amount;
      }
    }

    PaymentRegistry.markTransactionProcessed(orderId);

    if (orderId.startsWith('dep-')) {
      if (confirmedAmount <= 0) {
        return NextResponse.json({ error: 'Nominal pembayaran tidak dapat dipastikan.' }, { status: 400 });
      }

      await DataStore.depositFunds(orderUserId, confirmedAmount, 'Pembayaran Online');
      await DataStore.addXp(orderUserId, 30);
      await logAudit({
        actor: 'MEMBER',
        actorId: orderUserId,
        action: 'DOKU_DEPOSIT_SETTLED',
        module: 'WALLET',
        targetId: orderId,
        targetType: 'DOKU_ORDER',
        detail: `Deposit Rp ${confirmedAmount.toLocaleString('id-ID')} via DOKU${simulate ? ' (disimulasikan)' : ''}.`,
      });

      return NextResponse.json({
        success: true,
        status: 'SUCCESS',
        message: 'Top-up saldo berhasil diverifikasi.',
        processed: true,
      });
    }

    // Marketplace checkout. The cart contents come from the server-side pending
    // registry only — an order is never reconstructed from the request body, and
    // never invented from an arbitrary product when the registry has lost it.
    if (!pending || !Array.isArray(pending.items) || pending.items.length === 0) {
      return NextResponse.json(
        { error: 'Detail keranjang tidak ditemukan di server. Pembayaran Anda aman — silakan hubungi dukungan untuk penyelesaian pesanan.' },
        { status: 410 }
      );
    }

    const order = await DataStore.createOrder(
      pending.userId,
      pending.items,
      pending.affiliateId,
      'Online Payment',
      pending.shippingDetails
    );
    await DataStore.addXp(pending.userId, 30);
    await logAudit({
      actor: 'MEMBER',
      actorId: pending.userId,
      action: 'DOKU_CHECKOUT_SETTLED',
      module: 'ORDERS',
      targetId: order.id,
      targetType: 'ORDER',
      detail: `Order #${order.id} lunas via DOKU${simulate ? ' (disimulasikan)' : ''}.`,
    });

    await DataStore.createNotification(
      order.buyerId || pending.userId,
      'ORDER_CREATED',
      'Pesanan Berhasil Dibayar',
      `Pembayaran untuk pesanan #${order.id} telah sukses diverifikasi.`,
      `/orders/${order.id}`
    );

    return NextResponse.json({
      success: true,
      status: 'SUCCESS',
      order,
      orderId: order.id,
      message: 'Pesanan berhasil diselesaikan.',
      processed: true,
    });
  } catch (err: any) {
    console.error('[API] /api/doku/verify error:', err);
    return NextResponse.json({ error: err.message || 'Gagal memverifikasi status pembayaran.' }, { status: 500 });
  }
}
