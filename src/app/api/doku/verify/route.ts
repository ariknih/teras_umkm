import { NextRequest, NextResponse } from 'next/server';
import { DataStore, PaymentRegistry } from '@/lib/data-store';

/**
 * Endpoint to verify or auto-settle DOKU transactions when redirected back to platform
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const orderId = body.orderId || body.order_id || body.invoiceNumber;
    const simulate = !!body.simulate;

    if (!orderId) {
      return NextResponse.json({ error: 'Invoice number / Order ID wajib diisi.' }, { status: 400 });
    }

    if (PaymentRegistry.isTransactionProcessed(orderId)) {
      return NextResponse.json({
        success: true,
        status: 'SUCCESS',
        message: 'Transaksi sudah diproses sebelumnya.',
        processed: true,
      });
    }

    const pending = PaymentRegistry.getPendingCheckout(orderId);
    if (!pending) {
      return NextResponse.json({
        error: 'Detail transaksi DOKU tidak ditemukan di server registry.',
      }, { status: 404 });
    }

    PaymentRegistry.markTransactionProcessed(orderId);

    if (orderId.startsWith('dep-')) {
      const depositAmount = body.amount ? parseFloat(body.amount) : (pending.shippingDetails?.shippingFee || 50000);
      await DataStore.depositFunds(pending.userId, depositAmount, 'DOKU Checkout');
      await DataStore.addXp(pending.userId, 30);

      return NextResponse.json({
        success: true,
        status: 'SUCCESS',
        message: 'Top-up saldo via DOKU berhasil diverifikasi.',
        processed: true,
      });
    } else {
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
        `Pembayaran DOKU untuk pesanan #${order.id} telah sukses diverifikasi.`,
        `/orders/${order.id}`
      );

      return NextResponse.json({
        success: true,
        status: 'SUCCESS',
        order,
        orderId: order.id,
        message: 'Pesanan berhasil diselesaikan via DOKU.',
        processed: true,
      });
    }
  } catch (err: any) {
    console.error('[API] /api/doku/verify error:', err);
    return NextResponse.json({ error: err.message || 'Gagal memverifikasi DOKU.' }, { status: 500 });
  }
}
