import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/auth';
import { DataStore } from '@/lib/data-store';
import { createDokuCheckoutPayment, validateDepositAmount } from '@/lib/doku';
import { savePendingCheckout } from '@/lib/payment-purposes';
import { computeOrderTotal, wholesaleUnitPrice, type OrderLineItem } from '@/lib/money';

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
    const { type, amount, items, affiliateId, shippingDetails } = body;

    if (type === 'deposit') {
      const check = validateDepositAmount(amount);
      if ('error' in check) {
        return NextResponse.json({ error: check.error }, { status: 400 });
      }
      const depositAmount = check.amount;

      const orderId = `dep-doku_${user.id}_${Math.round(depositAmount)}_${Date.now().toString(36)}`;

      await savePendingCheckout(orderId, {
        userId: user.id,
        items: [],
        shippingDetails: {
          shippingFee: depositAmount,
          courier: 'DOKU_WALLET_DEPOSIT',
        },
      });

      const dokuResult = await createDokuCheckoutPayment({
        invoiceNumber: orderId,
        amount: depositAmount,
        customer: {
          id: user.id,
          name: user.name || 'Pengguna Saloka',
          email: user.email || 'user@saloka.id',
          phone: (user as any).phone || '081234567890',
        },
        lineItems: [
          {
            name: 'Top Up Saldo Dompet Saloka',
            price: depositAmount,
            quantity: 1,
          },
        ],
        callbackUrl: `${baseUrl}/wallet?doku_verify=${orderId}`,
        callbackUrlCancel: `${baseUrl}/wallet`,
      });

      return NextResponse.json({
        success: true,
        orderId,
        paymentUrl: dokuResult.paymentUrl,
      });
    } else if (type === 'checkout') {
      if (!items || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ error: 'Keranjang belanja kosong.' }, { status: 400 });
      }

      const lines: OrderLineItem[] = [];

      for (const item of items) {
        const product = await DataStore.getProductById(item.productId);
        if (!product) {
          return NextResponse.json(
            { error: `Produk tidak ditemukan atau sudah tidak aktif.` },
            { status: 404 }
          );
        }
        if (product.stock < item.quantity) {
          return NextResponse.json(
            { error: `Stok produk "${product.title}" tidak mencukupi.` },
            { status: 400 }
          );
        }

        lines.push({
          name: product.title.slice(0, 45),
          price: wholesaleUnitPrice(product.price, item.quantity),
          quantity: item.quantity,
        });
      }

      // Same calculation createOrder records ('Online Payment' is the method the
      // DOKU settlement routes pass), so DOKU charges exactly Order.totalAmount.
      const { total: totalAmount, lineItems } = computeOrderTotal({
        lines,
        shippingFee: shippingDetails?.shippingFee,
        courier: shippingDetails?.courier,
        bumpSales: shippingDetails?.bumpSales,
        couponCode: shippingDetails?.couponCode,
        paymentMethod: 'Online Payment',
      });
      if (totalAmount < 1000) {
        return NextResponse.json({ error: 'Minimal pembayaran online adalah Rp 1.000.' }, { status: 400 });
      }
      const orderId = `chk-doku-${user.id.slice(0, 8)}-${Date.now().toString(36)}`;

      // Persist for settlement — this is the only record of what the buyer is
      // paying for until DOKU confirms, and the webhook that confirms it may
      // land on a different instance.
      await savePendingCheckout(orderId, {
        userId: user.id,
        items,
        affiliateId: affiliateId || undefined,
        shippingDetails: shippingDetails || undefined,
      });

      const dokuResult = await createDokuCheckoutPayment({
        invoiceNumber: orderId,
        amount: totalAmount,
        customer: {
          id: user.id,
          name: user.name || 'Pelanggan Saloka',
          email: user.email || 'customer@saloka.id',
          phone: (user as any).phone || '081234567890',
          address: shippingDetails?.shippingAddress || 'Indonesia',
        },
        lineItems,
        callbackUrl: `${baseUrl}/cart?doku_verify=${orderId}`,
        callbackUrlCancel: `${baseUrl}/cart?step=checkout`,
      });

      return NextResponse.json({
        success: true,
        orderId,
        paymentUrl: dokuResult.paymentUrl,
      });
    }

    return NextResponse.json({ error: 'Tipe transaksi tidak didukung.' }, { status: 400 });
  } catch (err: any) {
    console.error('[API] /api/doku/checkout error:', err);
    return NextResponse.json(
      { error: err.message || 'Gagal membuat sesi pembayaran DOKU.' },
      { status: 500 }
    );
  }
}
