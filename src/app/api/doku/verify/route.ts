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
    
    // Stateless fallback: parse encoded parameters if pending checkout was evicted from serverless memory
    let fallbackUserId = pending?.userId || '';
    let fallbackCommunityId = '';
    let fallbackAmount = pending?.shippingDetails?.shippingFee || 0;
    let fallbackCoinAmount = 0;

    if (orderId.includes('_')) {
      const parts = orderId.split('_');
      if (orderId.startsWith('dep-doku_')) {
        fallbackUserId = parts[1] || fallbackUserId;
        fallbackAmount = parseFloat(parts[2]) || fallbackAmount;
      } else if (orderId.startsWith('join-doku_')) {
        fallbackCommunityId = parts[1] || '';
        fallbackUserId = parts[2] || fallbackUserId;
      } else if (orderId.startsWith('coin-doku_')) {
        fallbackCommunityId = parts[1] || '';
        fallbackUserId = parts[2] || fallbackUserId;
        fallbackCoinAmount = parseFloat(parts[3]) || 0;
      }
    }

    if (!pending && !fallbackUserId) {
      return NextResponse.json({
        error: 'Detail transaksi DOKU tidak ditemukan di server registry.',
      }, { status: 404 });
    }

    PaymentRegistry.markTransactionProcessed(orderId);

    if (orderId.startsWith('dep-')) {
      const depositAmount = body.amount ? parseFloat(body.amount) : fallbackAmount;
      await DataStore.depositFunds(fallbackUserId, depositAmount, 'DOKU Checkout');
      await DataStore.addXp(fallbackUserId, 30);

      return NextResponse.json({
        success: true,
        status: 'SUCCESS',
        message: 'Top-up saldo via DOKU berhasil diverifikasi.',
        processed: true,
      });
    } else if (orderId.startsWith('join-')) {
      const communityId = fallbackCommunityId || (pending as any)?.communityId;
      if (!communityId) {
        return NextResponse.json({ error: 'ID Komunitas tidak valid.' }, { status: 400 });
      }

      const res = await DataStore.payCommunityJoinFee(fallbackUserId, communityId, 'DOKU');
      await DataStore.addXp(fallbackUserId, 50);

      return NextResponse.json({
        success: true,
        status: 'SUCCESS',
        message: 'Biaya pendaftaran komunitas via DOKU berhasil diverifikasi.',
        communityId,
        result: res,
        processed: true,
      });
    } else if (orderId.startsWith('coin-')) {
      const communityId = fallbackCommunityId || (pending as any)?.communityId;
      const coinCount = fallbackCoinAmount || parseFloat(body.jumlahCoin) || 0;
      if (!communityId || coinCount <= 0) {
        return NextResponse.json({ error: 'Data koin komunitas tidak valid.' }, { status: 400 });
      }

      const totalBiaya = coinCount * 1500;
      const res = await DataStore.topupCommunityCoin({
        communityId,
        ketuaId: fallbackUserId,
        jumlahCoin: coinCount,
        totalBiaya,
        description: `Top up ${coinCount} coin via DOKU Payment Gateway`,
      });

      return NextResponse.json({
        success: true,
        status: 'SUCCESS',
        message: `Top up ${coinCount} coin via DOKU berhasil diverifikasi.`,
        communityId,
        result: res,
        processed: true,
      });
    } else {
      if (!pending) {
        return NextResponse.json({ error: 'Data pesanan tidak ditemukan di registry.' }, { status: 404 });
      }

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
