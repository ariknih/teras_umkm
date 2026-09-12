import { NextRequest, NextResponse } from 'next/server';
import { DataStore, MidtransRegistry } from '@/lib/data-store';
import { getTransactionStatus, decodeUserIdFromDoku } from '@/lib/doku';
import { logAudit } from '@/lib/audit-log';
import { getCurrentUser } from '@/app/actions/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const orderId = body.orderId;
    const simulate = body.simulate;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID wajib diisi.' }, { status: 400 });
    }

    if (MidtransRegistry.isTransactionProcessed(orderId)) {
      return NextResponse.json({
        success: true,
        status: 'SUCCESS',
        message: 'Transaksi sudah diproses sebelumnya.',
        processed: true,
      });
    }

    let status = 'PENDING';
    let grossAmount = 0;

    const isProduction = process.env.NODE_ENV === 'production' || process.env.DOKU_IS_PRODUCTION === 'true';

    if (simulate && !isProduction) {
      const simulatingUser = await getCurrentUser();
      if (!simulatingUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const rawUserId = orderId.split('-').slice(1, -1).join('-');
      const userId = decodeUserIdFromDoku(rawUserId);
      if (simulatingUser.id !== userId) {
        return NextResponse.json({ error: 'Unauthorized: order tidak dimiliki sesi ini.' }, { status: 403 });
      }
      status = 'SUCCESS';
      grossAmount = body.amount ? parseFloat(body.amount) : 50000;
    } else {
      try {
        const dokuStatus = await getTransactionStatus(orderId);
        status = dokuStatus.transactionStatus;
        grossAmount = dokuStatus.grossAmount;
      } catch (err: any) {
        console.error('Failed to query DOKU status.', err);
        return NextResponse.json({ error: `Gagal memeriksa status DOKU: ${err.message}` }, { status: 500 });
      }
    }

    if (status === 'SUCCESS') {
      MidtransRegistry.markTransactionProcessed(orderId);

      const rawUserId = orderId.split('-').slice(1, -1).join('-');
      const userId = decodeUserIdFromDoku(rawUserId);

      if (orderId.startsWith('ddep-')) {
        await DataStore.depositFunds(userId, grossAmount, 'DOKU Sandbox');
        await DataStore.addXp(userId, 30);
        await logAudit({
          actor: 'MEMBER',
          actorId: userId,
          action: 'DOKU_DEPOSIT_SETTLED',
          module: 'WALLET',
          targetId: orderId,
          targetType: 'DOKU_ORDER',
          detail: `Deposit Rp ${grossAmount.toLocaleString('id-ID')} via DOKU settlement.`,
        });

        return NextResponse.json({
          success: true,
          status,
          message: 'Top-up berhasil diselesaikan dan saldo ditambahkan.',
          processed: true,
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
    console.error('Error in /api/doku/verify:', error);
    return NextResponse.json({ error: error.message || 'Gagal memverifikasi transaksi.' }, { status: 500 });
  }
}
