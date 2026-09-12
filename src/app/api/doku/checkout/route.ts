import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/auth';
import { DataStore, PaymentRegistry } from '@/lib/data-store';
import { createDokuCheckoutPayment, validateDepositAmount } from '@/lib/doku';

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

      PaymentRegistry.savePendingCheckout(orderId, {
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

      const getProductPriceWithWholesale = (basePrice: number, qty: number) => {
        if (qty >= 10) return basePrice * 0.8;
        if (qty >= 5) return basePrice * 0.9;
        if (qty >= 3) return basePrice * 0.95;
        return basePrice;
      };

      let subtotal = 0;
      const lineItems = [];

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

        const price = getProductPriceWithWholesale(product.price, item.quantity);
        subtotal += price * item.quantity;

        lineItems.push({
          name: product.title.slice(0, 45),
          price,
          quantity: item.quantity,
        });
      }

      const shippingFee = shippingDetails?.shippingFee || 0;
      if (shippingFee > 0) {
        lineItems.push({
          name: `Ongkir (${(shippingDetails?.courier || 'Kurir').slice(0, 25)})`,
          price: shippingFee,
          quantity: 1,
        });
      }

      let bumpSalesTotal = 0;
      if (shippingDetails?.bumpSales) {
        const activeBumps = shippingDetails.bumpSales.split(',');
        activeBumps.forEach((bump: string) => {
          if (bump === 'GARANSI_PREMIUM') {
            bumpSalesTotal += 25000;
            lineItems.push({ name: 'Garansi Premium 1 Thn', price: 25000, quantity: 1 });
          } else if (bump === 'BOX_KAYU') {
            bumpSalesTotal += 15000;
            lineItems.push({ name: 'Packaging Box Kayu', price: 15000, quantity: 1 });
          } else if (bump === 'KERTAS_KADO') {
            bumpSalesTotal += 5000;
            lineItems.push({ name: 'Bungkus Kado', price: 5000, quantity: 1 });
          }
        });
      }

      let computedDiscount = 0;
      if (shippingDetails?.couponCode) {
        const code = shippingDetails.couponCode.toUpperCase();
        if (code === 'DISKON10') {
          computedDiscount = subtotal * 0.1;
        } else if (code === 'Saloka.id') {
          computedDiscount = Math.min(20000, subtotal);
        } else if (code === 'GRATISONGKIR') {
          computedDiscount = shippingFee;
        }
      }

      const totalAmount = Math.max(1000, subtotal + shippingFee + bumpSalesTotal - computedDiscount);
      const orderId = `chk-doku-${user.id.slice(0, 8)}-${Date.now().toString(36)}`;

      // Save to registry for settlement verification
      PaymentRegistry.savePendingCheckout(orderId, {
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
