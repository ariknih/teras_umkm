import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/auth';
import { createCheckoutTransaction, encodeUserIdForDoku } from '@/lib/doku';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Anda harus masuk terlebih dahulu.' }, { status: 401 });
    }

    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const host = req.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    const body = await req.json();
    const { type, amount } = body;

    if (type !== 'deposit') {
      return NextResponse.json({ error: 'Tipe transaksi tidak didukung.' }, { status: 400 });
    }

    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      return NextResponse.json({ error: 'Jumlah pengisian tidak valid.' }, { status: 400 });
    }

    // userId is recovered from the orderId itself on verify (same trick as
    // the Midtrans deposit flow) — no separate pending-checkout record needed.
    const orderId = `ddep-${encodeUserIdForDoku(user.id)}-${Date.now().toString(36)}`;

    const { redirectUrl } = await createCheckoutTransaction({
      invoiceNumber: orderId,
      amount: depositAmount,
      customerName: user.name,
      customerEmail: user.email,
      lineItems: [{ id: 'deposit-wallet', name: 'Top Up Saldo Dompet Saloka.id', quantity: 1, price: depositAmount }],
      callbackUrl: `${baseUrl}/wallet?doku_order=${orderId}`,
    });

    return NextResponse.json({ success: true, orderId, redirectUrl });
  } catch (error: any) {
    console.error('Error in /api/doku/checkout:', error);
    return NextResponse.json({ error: error.message || 'Gagal memproses pembayaran DOKU.' }, { status: 500 });
  }
}
