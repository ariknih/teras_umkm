import { NextRequest, NextResponse } from 'next/server';
import { DataStore, PaymentRegistry } from '@/lib/data-store';
import { verifyDokuNotification } from '@/lib/doku';

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

    const isValid = verifyDokuNotification(headers, '/api/doku/notification', rawBody);
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

    // Check if already processed
    if (PaymentRegistry.isTransactionProcessed(invoiceNumber)) {
      return NextResponse.json({ message: 'Transaction already processed' }, { status: 200 });
    }

    if (transactionStatus === 'SUCCESS' || transactionStatus === 'SETTLEMENT') {
      PaymentRegistry.markTransactionProcessed(invoiceNumber);

      const pending = PaymentRegistry.getPendingCheckout(invoiceNumber);
      let targetUserId = pending?.userId || '';
      let targetCommunityId = '';
      let targetCoinAmount = 0;
      let targetAmount = payload?.order?.amount || pending?.shippingDetails?.shippingFee || 0;

      if (invoiceNumber.includes('_')) {
        const parts = invoiceNumber.split('_');
        if (invoiceNumber.startsWith('dep-doku_')) {
          targetUserId = parts[1] || targetUserId;
          targetAmount = parseFloat(parts[2]) || targetAmount;
        } else if (invoiceNumber.startsWith('join-doku_')) {
          targetCommunityId = parts[1] || '';
          targetUserId = parts[2] || targetUserId;
        } else if (invoiceNumber.startsWith('coin-doku_')) {
          targetCommunityId = parts[1] || '';
          targetUserId = parts[2] || targetUserId;
          targetCoinAmount = parseFloat(parts[3]) || 0;
        }
      }

      if (invoiceNumber.startsWith('dep-') && targetUserId) {
        await DataStore.depositFunds(targetUserId, targetAmount, 'DOKU Payment Gateway');
        await DataStore.addXp(targetUserId, 30);
      } else if (invoiceNumber.startsWith('join-') && targetUserId && targetCommunityId) {
        await DataStore.payCommunityJoinFee(targetUserId, targetCommunityId, 'DOKU');
        await DataStore.addXp(targetUserId, 50);
      } else if (invoiceNumber.startsWith('coin-') && targetUserId && targetCommunityId && targetCoinAmount > 0) {
        const totalBiaya = targetCoinAmount * 1500;
        await DataStore.topupCommunityCoin({
          communityId: targetCommunityId,
          ketuaId: targetUserId,
          jumlahCoin: targetCoinAmount,
          totalBiaya,
          description: `Top up ${targetCoinAmount} coin via DOKU Payment Gateway Webhook`,
        });
      } else if (invoiceNumber.startsWith('chk-') && pending) {
        const order = await DataStore.createOrder(
          pending.userId,
          pending.items,
          pending.affiliateId,
          'DOKU',
          pending.shippingDetails
        );
        await DataStore.addXp(pending.userId, 30);

        await DataStore.createNotification(
          pending.userId,
          'ORDER_CREATED',
          'Pesanan Berhasil Dibayar (DOKU)',
          `Pembayaran DOKU untuk pesanan #${order.id} telah terverifikasi.`,
          `/orders/${order.id}`
        );
      }
    }

    return NextResponse.json({ message: 'OK' }, { status: 200 });
  } catch (err: any) {
    console.error('[DOKU Webhook] Error processing notification:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
