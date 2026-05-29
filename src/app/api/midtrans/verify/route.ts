import { NextRequest, NextResponse } from 'next/server';
import { DataStore, MidtransRegistry } from '@/lib/data-store';
import { getTransactionStatus } from '@/lib/midtrans';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, simulate } = body;

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

    if (simulate) {
      // Simulate success for local testing
      status = 'settlement';
      
      // Attempt to get amount from registry or orderId
      if (orderId.startsWith('deposit-')) {
        const parts = orderId.split('-');
        // Format: deposit-[userId]-[timestamp]
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
      const userId = parts.slice(1, parts.length - 1).join('-');

      if (orderId.startsWith('deposit-')) {
        // Process deposit
        await DataStore.depositFunds(userId, grossAmount, 'Midtrans Sandbox');
        await DataStore.addXp(userId, 30); // Reward 30 XP for deposit

        return NextResponse.json({
          success: true,
          status,
          message: 'Top-up berhasil diselesaikan dan saldo ditambahkan.',
          processed: true,
        });
      } else if (orderId.startsWith('checkout-')) {
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
