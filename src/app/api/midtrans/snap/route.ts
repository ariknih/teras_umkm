import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/app/actions/auth';
import { DataStore, MidtransRegistry } from '@/lib/data-store';
import { createSnapTransaction } from '@/lib/midtrans';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Anda harus masuk terlebih dahulu.' }, { status: 401 });
    }

    const body = await req.json();
    const { type, amount, items, affiliateId, shippingDetails } = body;

    if (type === 'deposit') {
      const depositAmount = parseFloat(amount);
      if (isNaN(depositAmount) || depositAmount <= 0) {
        return NextResponse.json({ error: 'Jumlah pengisian tidak valid.' }, { status: 400 });
      }

      const orderId = `deposit-${user.id}-${Date.now()}`;
      
      const snapResult = await createSnapTransaction({
        orderId,
        grossAmount: depositAmount,
        customerDetails: {
          first_name: user.name,
          email: user.email,
        },
        itemDetails: [{
          id: 'deposit-wallet',
          price: depositAmount,
          quantity: 1,
          name: 'Top Up Saldo Dompet Teras UMKM',
        }],
      });

      return NextResponse.json({
        success: true,
        orderId,
        token: snapResult.token,
        redirectUrl: snapResult.redirectUrl,
      });
    } else if (type === 'checkout') {
      if (!items || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ error: 'Keranjang belanja kosong.' }, { status: 400 });
      }

      const getProductPriceWithWholesale = (basePrice: number, qty: number) => {
        if (qty >= 10) return basePrice * 0.80;
        if (qty >= 5) return basePrice * 0.90;
        if (qty >= 3) return basePrice * 0.95;
        return basePrice;
      };

      // Load products and calculate total amount
      let subtotal = 0;
      const itemDetailsList = [];

      for (const item of items) {
        const product = await DataStore.getProductById(item.productId);
        if (!product) {
          return NextResponse.json({ error: `Produk tidak ditemukan. Mungkin produk sudah dihapus atau tidak tersedia. Hapus produk dari keranjang dan coba lagi.` }, { status: 404 });
        }
        // Block purchasing own products
        if (product.merchantId === user.id) {
          return NextResponse.json({ error: `Anda tidak dapat membeli produk Anda sendiri ("${product.title}"). Hapus produk tersebut dari keranjang terlebih dahulu.` }, { status: 400 });
        }
        if (product.stock < item.quantity) {
          return NextResponse.json({ error: `Stok produk "${product.title}" tidak mencukupi.` }, { status: 400 });
        }
        
        const price = getProductPriceWithWholesale(product.price, item.quantity);
        const itemTotal = price * item.quantity;
        subtotal += itemTotal;
        
        itemDetailsList.push({
          id: product.id,
          price,
          quantity: item.quantity,
          name: product.title.substring(0, 50),
        });
      }

      const shippingFee = shippingDetails?.shippingFee || 0;
      if (shippingFee > 0) {
        itemDetailsList.push({
          id: 'shipping-fee',
          price: shippingFee,
          quantity: 1,
          name: `Ongkir (${shippingDetails?.courier || 'Ekspedisi'})`,
        });
      }

      let bumpSalesTotal = 0;
      if (shippingDetails?.bumpSales) {
        const activeBumps = shippingDetails.bumpSales.split(',');
        activeBumps.forEach((bump: string) => {
          if (bump === 'GARANSI_PREMIUM') {
            bumpSalesTotal += 25000;
            itemDetailsList.push({
              id: 'bump-garansi-premium',
              price: 25000,
              quantity: 1,
              name: 'Garansi Premium 1 Tahun',
            });
          }
          if (bump === 'BOX_KAYU') {
            bumpSalesTotal += 15000;
            itemDetailsList.push({
              id: 'bump-box-kayu',
              price: 15000,
              quantity: 1,
              name: 'Kemasan Box Kayu Premium',
            });
          }
          if (bump === 'KERTAS_KADO') {
            bumpSalesTotal += 5000;
            itemDetailsList.push({
              id: 'bump-kertas-kado',
              price: 5000,
              quantity: 1,
              name: 'Bungkus Kertas Kado',
            });
          }
        });
      }

      let computedDiscount = 0;
      if (shippingDetails?.couponCode) {
        const code = shippingDetails.couponCode.toUpperCase();
        if (code === 'DISKON10') {
          computedDiscount = subtotal * 0.1;
        } else if (code === 'TERASUMKM') {
          computedDiscount = Math.min(20000, subtotal);
        } else if (code === 'GRATISONGKIR') {
          computedDiscount = shippingFee;
        }
        if (computedDiscount > 0) {
          itemDetailsList.push({
            id: `coupon-${code}`,
            price: -computedDiscount,
            quantity: 1,
            name: `Kupon ${code}`,
          });
        }
      }

      const totalAmount = subtotal + shippingFee + bumpSalesTotal - computedDiscount;
      const orderId = `checkout-${user.id}-${Date.now()}`;

      // Save checkout details in registry so we can settle it when payment is verified
      MidtransRegistry.savePendingCheckout(orderId, {
        userId: user.id,
        items,
        affiliateId: affiliateId || undefined,
        shippingDetails: shippingDetails || undefined
      });

      const snapResult = await createSnapTransaction({
        orderId,
        grossAmount: totalAmount,
        customerDetails: {
          first_name: user.name,
          email: user.email,
        },
        itemDetails: itemDetailsList,
      });

      return NextResponse.json({
        success: true,
        orderId,
        token: snapResult.token,
        redirectUrl: snapResult.redirectUrl,
      });
    }

    return NextResponse.json({ error: 'Tipe transaksi tidak didukung.' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in /api/midtrans/snap:', error);
    return NextResponse.json({ error: error.message || 'Gagal memproses pembayaran.' }, { status: 500 });
  }
}
