import { NextRequest, NextResponse } from 'next/server';
import { DataStore, MidtransRegistry } from '@/lib/data-store';
import { getTransactionStatus, decodeUserIdFromMidtrans } from '@/lib/midtrans';
import { logAudit } from '@/lib/audit-log';
import { getCurrentUser } from '@/app/actions/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const orderId = body.orderId || body.order_id;
    const simulate = body.simulate;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID wajib diisi.' }, { status: 400 });
    }

    // Check if already processed
    if (MidtransRegistry.isTransactionProcessed(orderId)) {
      return NextResponse.json({
        success: true,
        status: 'settlement',
        message: 'Transaksi sudah diproses sebelumnya.',
        processed: true,
      });
    }

    let status = 'pending';
    let grossAmount = 0;
    let simulatingUser: { id: string } | null = null;

    const isProduction = process.env.NODE_ENV === 'production' || process.env.MIDTRANS_IS_PRODUCTION === 'true';

    if (simulate && !isProduction) {
      // Defense in depth: the NODE_ENV gate alone is a config-away accident.
      // Simulated settlement must also belong to the caller's own session.
      simulatingUser = await getCurrentUser();
      if (!simulatingUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Simulate success for local testing
      status = 'settlement';
      
      // Attempt to get amount from registry or orderId
      if (orderId.startsWith('deposit-') || orderId.startsWith('dep-')) {
        const parts = orderId.split('-');
        // Format: deposit-[userId]-[timestamp] or dep-[userId]-[timestamp]
        // Let's check if the amount was passed, otherwise default to 50000 for simulation
        grossAmount = body.amount ? parseFloat(body.amount) : 50000;
      }
    } else {
      // Query Midtrans API
      try {
        const midtransStatus = await getTransactionStatus(orderId);
        status = midtransStatus.transactionStatus;
        grossAmount = midtransStatus.grossAmount;
      } catch (err: any) {
        console.error('Failed to query Midtrans status, falling back to simulated status if requested.', err);
        return NextResponse.json({ error: `Gagal memeriksa status Midtrans: ${err.message}` }, { status: 500 });
      }
    }

    // Check if status is settled
    if (status === 'settlement' || status === 'capture') {
      MidtransRegistry.markTransactionProcessed(orderId);

      const parts = orderId.split('-');
      // Reconstruct userId from deposit-[userId]-[timestamp] or checkout-[userId]-[timestamp]
      const rawUserId = parts.slice(1, parts.length - 1).join('-');
      const userId = decodeUserIdFromMidtrans(rawUserId);

      if (simulatingUser && simulatingUser.id !== userId) {
        return NextResponse.json({ error: 'Unauthorized: order tidak dimiliki sesi ini.' }, { status: 403 });
      }

      if (orderId.startsWith('deposit-') || orderId.startsWith('dep-')) {
        // Process deposit
        await DataStore.depositFunds(userId, grossAmount, 'Midtrans Sandbox');
        await DataStore.addXp(userId, 30); // Reward 30 XP for deposit
        await logAudit({
          actor: 'MEMBER',
          actorId: userId,
          action: 'MIDTRANS_DEPOSIT_SETTLED',
          module: 'WALLET',
          targetId: orderId,
          targetType: 'MIDTRANS_ORDER',
          detail: `Deposit Rp ${grossAmount.toLocaleString('id-ID')} via Midtrans settlement.`
        });

        return NextResponse.json({
          success: true,
          status,
          message: 'Top-up berhasil diselesaikan dan saldo ditambahkan.',
          processed: true,
        });
      } else if (orderId.startsWith('checkout-') || orderId.startsWith('chk-')) {
        // Process checkout
        const pending = MidtransRegistry.getPendingCheckout(orderId);
        if (!pending) {
          return NextResponse.json({
            error: 'Detail keranjang checkout tidak ditemukan di server registry.',
          }, { status: 400 });
        }

        // Complete the order
        const order = await DataStore.createOrder(
          pending.userId, 
          pending.items, 
          pending.affiliateId, 
          'MIDTRANS', 
          pending.shippingDetails
        );
        await DataStore.addXp(pending.userId, 30); // Reward 30 XP for purchase
        await logAudit({
          actor: 'MEMBER',
          actorId: pending.userId,
          action: 'MIDTRANS_CHECKOUT_SETTLED',
          module: 'ORDERS',
          targetId: order.id,
          targetType: 'ORDER',
          detail: `Order #${order.id} sebesar Rp ${order.totalAmount.toLocaleString('id-ID')} lunas via Midtrans.`
        });

        // Create ORDER_CREATED and PAYMENT_SUCCESS database notifications for Midtrans
        await DataStore.createNotification(
          pending.userId,
          'ORDER_CREATED',
          'Pesanan Baru Dibuat',
          `Pesanan #${order.id} berhasil dibuat via Midtrans.`,
          `/orders/${order.id}`
        );
        await DataStore.createNotification(
          pending.userId,
          'PAYMENT_SUCCESS',
          'Pembayaran Berhasil',
          `Pembayaran pesanan #${order.id} via Midtrans berhasil terverifikasi.`,
          `/orders/${order.id}`
        );

        return NextResponse.json({
          success: true,
          status,
          message: 'Checkout berhasil diselesaikan, produk dibeli, dan ledger diperbarui.',
          processed: true,
          order,
        });
      }
    }

    return NextResponse.json({
      success: true,
      status,
      message: 'Transaksi belum diselesaikan (menunggu pembayaran).',
      processed: false,
    });
  } catch (error: any) {
    console.error('Error in /api/midtrans/verify:', error);
    return NextResponse.json({ error: error.message || 'Gagal memverifikasi transaksi.' }, { status: 500 });
  }
}
