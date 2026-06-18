const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || '';
const MIDTRANS_CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY || '';
const IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === 'true';

const SNAP_API_URL = IS_PRODUCTION
  ? 'https://app.midtrans.com/snap/v1/transactions'
  : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

const STATUS_API_URL = IS_PRODUCTION
  ? 'https://api.midtrans.com/v2'
  : 'https://api.sandbox.midtrans.com/v2';

const authHeader = 'Basic ' + Buffer.from(MIDTRANS_SERVER_KEY + ':').toString('base64');

export interface CustomerDetails {
  first_name: string;
  email: string;
}

export interface ItemDetails {
  id: string;
  price: number;
  quantity: number;
  name: string;
}

export async function createSnapTransaction(params: {
  orderId: string;
  grossAmount: number;
  customerDetails?: CustomerDetails;
  itemDetails?: ItemDetails[];
  callbacks?: {
    finish?: string;
    unfinish?: string;
    error?: string;
  };
}) {
  try {
    const payload = {
      transaction_details: {
        order_id: params.orderId,
        gross_amount: params.grossAmount,
      },
      customer_details: params.customerDetails,
      item_details: params.itemDetails,
      credit_card: {
        secure: true,
      },
      callbacks: params.callbacks,
    };

    const response = await fetch(SNAP_API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Midtrans Snap Error response:', errText);
      throw new Error(`Midtrans API responded with status ${response.status}: ${errText}`);
    }

    const data = await response.json();
    return {
      token: data.token as string,
      redirectUrl: data.redirect_url as string,
    };
  } catch (error: any) {
    console.error('Error creating Midtrans transaction:', error);
    throw error;
  }
}

export async function getTransactionStatus(orderId: string) {
  try {
    const response = await fetch(`${STATUS_API_URL}/${orderId}/status`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Midtrans Status Error response for order ${orderId}:`, errText);
      throw new Error(`Midtrans Status API responded with status ${response.status}: ${errText}`);
    }

    const data = await response.json();
    return {
      transactionStatus: data.transaction_status as string, // 'settlement', 'capture', 'pending', 'deny', 'expire', etc.
      paymentType: data.payment_type as string,
      grossAmount: parseFloat(data.gross_amount),
      orderId: data.order_id as string,
    };
  } catch (error: any) {
    console.error(`Error fetching Midtrans status for order ${orderId}:`, error);
    throw error;
  }
}

/**
 * Helper to encode user ID for Midtrans order ID to stay within 50 characters limit.
 * If user ID is a UUID (36 chars, with hyphens), we strip hyphens to get 32 chars.
 */
export function encodeUserIdForMidtrans(userId: string): string {
  if (userId.length === 36 && userId.includes('-')) {
    return userId.replace(/-/g, '');
  }
  return userId;
}

/**
 * Helper to decode user ID from Midtrans order ID back to its original form.
 * If the encoded string is 32 characters hex, it represents a stripped UUID, so we insert the hyphens.
 */
export function decodeUserIdFromMidtrans(encodedId: string): string {
  if (encodedId.length === 32 && /^[0-9a-fA-F]{32}$/.test(encodedId)) {
    return [
      encodedId.slice(0, 8),
      encodedId.slice(8, 12),
      encodedId.slice(12, 16),
      encodedId.slice(16, 20),
      encodedId.slice(20)
    ].join('-');
  }
  return encodedId;
}

