import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/auth';
import { DataStore, PaymentRegistry } from '@/lib/data-store';
import {
  createDokuDirectQris,
  createDokuDirectVa,
  getBankPaymentInstructions,
  DokuVaBank,
  getDokuConfig,
} from '@/lib/doku';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Anda harus masuk terlebih dahulu.' }, { status: 401 });
    }

    const body = await req.json();
    const {
      type,
      paymentChannel = 'QRIS',
      amount,
      items,
      affiliateId,
      shippingDetails,
      communityId,
      jumlahCoin,
    } = body;

    let orderId = '';
    let totalAmount = 0;
    let customerName = user.name || 'Pelanggan Saloka';
    let customerEmail = user.email || 'customer@saloka.id';

    // 1. Calculate & register based on type
    if (type === 'deposit') {
      totalAmount = parseFloat(amount);
      if (isNaN(totalAmount) || totalAmount <= 0) {
        return NextResponse.json({ error: 'Jumlah pengisian tidak valid.' }, { status: 400 });
      }

      orderId = `dep-doku_${user.id}_${Math.round(totalAmount)}_${Date.now().toString(36)}`;
      PaymentRegistry.savePendingCheckout(orderId, {
        userId: user.id,
        items: [],
        shippingDetails: {
          shippingFee: totalAmount,
          courier: 'DOKU_WALLET_DEPOSIT',
        },
      });
    } else if (type === 'community_join') {
      totalAmount = parseFloat(amount);
      if (!communityId) {
        return NextResponse.json({ error: 'ID Komunitas wajib diisi.' }, { status: 400 });
      }
      if (isNaN(totalAmount) || totalAmount <= 0) {
        return NextResponse.json({ error: 'Nominal pendaftaran tidak valid.' }, { status: 400 });
      }

      const community = await DataStore.getCommunityById(communityId);
      if (!community) {
        return NextResponse.json({ error: 'Komunitas tidak ditemukan.' }, { status: 404 });
      }

      orderId = `join-doku_${communityId}_${user.id}_${Date.now().toString(36)}`;
      PaymentRegistry.savePendingCheckout(orderId, {
        userId: user.id,
        items: [],
        shippingDetails: {
          shippingFee: totalAmount,
          courier: `JOIN_${community.type || 'COMMUNITY'}`,
        },
      });
    } else if (type === 'community_coin') {
      const coinCount = parseFloat(jumlahCoin);
      totalAmount = parseFloat(amount) || coinCount * 1500;

      if (!communityId || isNaN(coinCount) || coinCount <= 0 || isNaN(totalAmount) || totalAmount <= 0) {
        return NextResponse.json({ error: 'Jumlah coin atau biaya top up tidak valid.' }, { status: 400 });
      }

      const community = await DataStore.getCommunityById(communityId);
      if (!community) {
        return NextResponse.json({ error: 'Komunitas tidak ditemukan.' }, { status: 404 });
      }

      orderId = `coin-doku_${communityId}_${user.id}_${Math.round(coinCount)}_${Date.now().toString(36)}`;
      PaymentRegistry.savePendingCheckout(orderId, {
        userId: user.id,
        items: [],
        shippingDetails: {
          shippingFee: totalAmount,
          courier: `COIN_${coinCount}`,
        },
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
      }

      const shippingFee = shippingDetails?.shippingFee || 0;
      let bumpSalesTotal = 0;
      if (shippingDetails?.bumpSales) {
        const activeBumps = shippingDetails.bumpSales.split(',');
        activeBumps.forEach((bump: string) => {
          if (bump === 'GARANSI_PREMIUM') bumpSalesTotal += 25000;
          else if (bump === 'BOX_KAYU') bumpSalesTotal += 15000;
          else if (bump === 'KERTAS_KADO') bumpSalesTotal += 5000;
        });
      }

      let computedDiscount = 0;
      if (shippingDetails?.couponCode) {
        const code = shippingDetails.couponCode.toUpperCase();
        if (code === 'DISKON10') computedDiscount = subtotal * 0.1;
        else if (code === 'Saloka.id') computedDiscount = Math.min(20000, subtotal);
        else if (code === 'GRATISONGKIR') computedDiscount = shippingFee;
      }

      totalAmount = Math.max(1000, subtotal + shippingFee + bumpSalesTotal - computedDiscount);
      orderId = `chk-doku-${user.id.slice(0, 8)}-${Date.now().toString(36)}`;

      PaymentRegistry.savePendingCheckout(orderId, {
        userId: user.id,
        items,
        affiliateId: affiliateId || undefined,
        shippingDetails: shippingDetails || undefined,
      });
    } else {
      return NextResponse.json({ error: 'Tipe transaksi tidak didukung.' }, { status: 400 });
    }

    const { isProduction } = getDokuConfig();

    // 2. Direct payment generation
    if (paymentChannel === 'QRIS') {
      const qrisData = await createDokuDirectQris({
        invoiceNumber: orderId,
        amount: totalAmount,
        customer: { id: user.id, name: customerName, email: customerEmail },
        expiryMinutes: 15,
      });

      return NextResponse.json({
        success: true,
        orderId,
        paymentChannel: 'QRIS',
        amount: totalAmount,
        qrString: qrisData.qrString,
        expiredAt: qrisData.expiredDate,
        isProduction,
      });
    } else if (paymentChannel.startsWith('VA_')) {
      const bankRaw = paymentChannel.replace('VA_', '') as DokuVaBank;
      const validBank: DokuVaBank = [
        'BRI',
        'BNI',
        'PERMATA',
        'CIMB',
        'DANAMON',
        'BCA',
        'MANDIRI',
        'DOKU',
      ].includes(bankRaw)
        ? bankRaw
        : 'DOKU';

      const vaData = await createDokuDirectVa({
        invoiceNumber: orderId,
        amount: totalAmount,
        bank: validBank,
        customer: { id: user.id, name: customerName, email: customerEmail },
        expiryMinutes: 1440,
      });

      const instructions = getBankPaymentInstructions(
        validBank,
        vaData.virtualAccountNumber,
        totalAmount
      );

      return NextResponse.json({
        success: true,
        orderId,
        paymentChannel,
        bank: vaData.bank,
        bankName: vaData.bankName,
        vaNumber: vaData.virtualAccountNumber,
        amount: totalAmount,
        expiredAt: vaData.expiredDate,
        howToPayUrl: vaData.howToPayUrl,
        instructions,
        isProduction,
      });
    }

    return NextResponse.json({ error: 'Channel pembayaran tidak didukung.' }, { status: 400 });
  } catch (err: any) {
    console.error('[API] /api/doku/direct error:', err);
    return NextResponse.json(
      { error: err.message || 'Gagal memproses pembayaran langsung.' },
      { status: 500 }
    );
  }
}
