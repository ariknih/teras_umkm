import { NextRequest, NextResponse } from 'next/server';
import { DataStore } from '@/lib/data-store';
import { verifyDokuNotification, parseDokuOrderId } from '@/lib/doku';
import {
  purposeFromOrderId,
  getPendingContext,
  deletePendingContext,
  settlePurpose,
  claimTransaction,
  releaseTransaction,
  getPendingCheckout,
  deletePendingCheckout
} from '@/lib/payment-purposes';
import { decodeOrderUserId } from '@/lib/payment-gateway';
import { deleteCache } from '@/lib/cache';
import { revalidatePath } from 'next/cache';

/**
 * DOKU Jokul Webhook / Notification Handler
 * Target URL configured in DOKU Back Office: https://saloka.id/api/doku/notification
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const headers = {
      clientId: req.headers.get('Client-Id'),
      requestId: req.headers.get('Request-Id'),
      timestamp: req.headers.get('Request-Timestamp'),
      signature: req.headers.get('Signature'),
    };

    const isValid = await verifyDokuNotification(headers, '/api/doku/notification', rawBody);
    if (!isValid) {
      console.warn('[DOKU Webhook] Invalid signature rejected.');
      return NextResponse.json({ error: 'Signature invalid' }, { status: 401 });
    }

    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const invoiceNumber =
      payload?.order?.invoice_number ||
      payload?.invoice_number ||
      payload?.transaction?.invoice_number;

    const transactionStatus = (
      payload?.transaction?.status ||
      payload?.status ||
      ''
    ).toUpperCase();

    if (!invoiceNumber) {
      return NextResponse.json({ error: 'Invoice number missing' }, { status: 400 });
    }

    // Community join fee / savings / coin top-up: settle here too, not only in
    // /api/payment/verify — a QRIS or e-wallet payer on mobile often never
    // returns to the site, so verify never runs and the paid membership was
    // lost. Idempotent with verify through claimTransaction (a DB-backed
    // single-winner claim), backed by JOIN_FEE's isPaid CAS and the unique
    // orderId column on the others. A throw returns 500 so DOKU retries.
    const purpose = purposeFromOrderId(invoiceNumber);
    if (purpose) {
      if (transactionStatus === 'SUCCESS' || transactionStatus === 'SETTLEMENT') {
        const ctx = await getPendingContext(invoiceNumber);
        const amount = parseFloat(payload?.order?.amount) || 0;
        // No ctx: already settled by verify (context deleted) — nothing to do.
        // Losing the claim means /api/payment/verify is settling this right now
        // on another instance; acknowledge and let it finish.
        if (ctx && amount > 0 && (await claimTransaction(invoiceNumber))) {
          try {
            // A returned { error } (e.g. community/user not found) is a failure
            // too — keep the context and 500 so DOKU retries.
            const res: any = await settlePurpose(purpose, decodeOrderUserId(invoiceNumber), amount, invoiceNumber, ctx);
            if (res?.error) throw new Error(res.error);
          } catch (e: any) {
            if (!(e?.code === 'P2002' || /sudah diproses sebelumnya/.test(e?.message || ''))) {
              // Hand the claim back before the 500, or DOKU's retry would be
              // refused as a duplicate and the paid order would never settle.
              await releaseTransaction(invoiceNumber);
              throw e;
            }
          }
          await deletePendingContext(invoiceNumber);
          deleteCache('community:induk:all');
          deleteCache(`community:stats:${ctx.communityId}`);
          revalidatePath(`/community/${ctx.communityId}`);
          revalidatePath('/community');
        }
      }
      return NextResponse.json({ message: 'OK' }, { status: 200 });
    }

    if (transactionStatus === 'SUCCESS' || transactionStatus === 'SETTLEMENT') {
      // Losing the claim means /api/doku/verify already credited this (or is
      // mid-flight). Acknowledge so DOKU stops retrying.
      if (!(await claimTransaction(invoiceNumber))) {
        return NextResponse.json({ message: 'Transaction already processed' }, { status: 200 });
      }

      try {
        const pending = await getPendingCheckout(invoiceNumber);
        const parsed = parseDokuOrderId(invoiceNumber);
        const targetUserId = parsed.userId || pending?.userId || '';

        // This payload is signature-verified above, so DOKU's own reported amount
        // is the source of truth; the id-encoded amount is only a fallback for
        // payloads that omit it.
        const targetAmount =
          parseFloat(payload?.order?.amount) || parsed.amount || pending?.shippingDetails?.shippingFee || 0;

        // Community purposes (join fee, savings, coin top-up) returned above.
        if (invoiceNumber.startsWith('dep-') && targetUserId && targetAmount > 0) {
          await DataStore.depositFunds(targetUserId, targetAmount, 'Pembayaran Online');
          await DataStore.addXp(targetUserId, 30);
        } else if (pending && Array.isArray(pending.items) && pending.items.length > 0) {
          const order = await DataStore.createOrder(
            pending.userId,
            pending.items,
            pending.affiliateId,
            'Online Payment',
            pending.shippingDetails
          );
          await DataStore.addXp(pending.userId, 30);

          await DataStore.createNotification(
            pending.userId,
            'ORDER_CREATED',
            'Pesanan Berhasil Dibayar',
            `Pembayaran untuk pesanan #${order.id} telah sukses diverifikasi.`,
            `/orders/${order.id}`
          );
        } else {
          // Nothing to settle against: the pending checkout is missing or
          // expired. Release and 500 so DOKU retries — a paid order must not be
          // silently dropped just because we could not find what it bought.
          await releaseTransaction(invoiceNumber);
          return NextResponse.json({ error: 'Pending checkout not found' }, { status: 500 });
        }
        await deletePendingCheckout(invoiceNumber);
      } catch (e) {
        await releaseTransaction(invoiceNumber);
        throw e;
      }
    }

    return NextResponse.json({ message: 'OK' }, { status: 200 });
  } catch (err: any) {
    console.error('[DOKU Webhook] Error processing notification:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
