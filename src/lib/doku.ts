import crypto from 'crypto';

/**
 * DOKU Checkout / Jokul Payment Gateway Integration
 * Docs: https://jokul.doku.com/docs
 */

const DOKU_IS_PRODUCTION = process.env.DOKU_IS_PRODUCTION === 'true';
const DOKU_CLIENT_ID = process.env.DOKU_CLIENT_ID || '';
const DOKU_SECRET_KEY = process.env.DOKU_SECRET_KEY || '';
const DOKU_API_KEY = process.env.DOKU_API_KEY || ''; // doku_key_... from dashboard API Keys
const DOKU_PUBLIC_KEY = (process.env.DOKU_PUBLIC_KEY || '').replace(/\\n/g, '\n') || `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzjWn0sAG4rqk9PuTk9RN6vyDJpj3mAOsl+t1k/WAj30ZqPGAjrXrH60brPrkWNCCM4lVWqP28CYYE79G6YdeZLiobhyTeYQPcakduhmIfpjAqTiGZgB/C2Z9ylUcg1FAwzc7ovgOfkwKTAZtF1obOcuoWCYfbuPNONiQEBmqGGErswVbLarKz8j6qNqmX3s9I0wvsQ6Ue6GGTvxc+Pv15tHI8sDjycdP1kDx4taLvR4DjNpg5gVDu3RgArxdPBOgEf+yCL0ZUgPTLrkRVGj2mBXfUqAfCm4M8wpsQnu9ZCSjU96JqLVT8nROgD5/5/ryfjoMvIGqwDIA+diX7Xw2iwIDAQAB
-----END PUBLIC KEY-----`;

const DOKU_BASE_URL = DOKU_IS_PRODUCTION
  ? 'https://api.doku.com'
  : 'https://api-sandbox.doku.com';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DokuLineItem {
  name: string;
  price: number;
  quantity: number;
}

export interface DokuCustomer {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface CreateDokuCheckoutParams {
  invoiceNumber: string;
  amount: number;
  customer: DokuCustomer;
  lineItems: DokuLineItem[];
  callbackUrl?: string;
  callbackUrlCancel?: string;
  paymentDueDateMinutes?: number;
}

export interface DokuCheckoutResponse {
  success: boolean;
  invoiceNumber: string;
  paymentUrl: string;
  token?: string;
  raw?: any;
}

// ─── Signature Helpers ────────────────────────────────────────────────────────

/**
 * Generate DOKU Jokul SHA-256 Digest of the request body
 * In DOKU Jokul API, the Digest is the base64-encoded SHA-256 hash of the request body (without "SHA-256=" prefix).
 */
export function generateDokuDigest(bodyString: string): string {
  return crypto.createHash('sha256').update(bodyString, 'utf8').digest('base64');
}

/**
 * Generate DOKU Jokul HMAC-SHA256 Signature for API requests
 */
export function generateDokuSignature(
  clientId: string,
  requestId: string,
  timestamp: string,
  targetPath: string,
  digest: string,
  secretKey: string
): string {
  const component = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${timestamp}\nRequest-Target:${targetPath}\nDigest:${digest}`;
  const hmac = crypto.createHmac('sha256', secretKey).update(component).digest('base64');
  return `HMACSHA256=${hmac}`;
}

// ─── Create Checkout Payment ──────────────────────────────────────────────────

/**
 * Initialize DOKU Hosted Checkout session (/checkout/v1/payment)
 * Returns the hosted payment page URL for QRIS, VA, E-Wallet, Card, etc.
 */
export async function createDokuCheckoutPayment(
  params: CreateDokuCheckoutParams
): Promise<DokuCheckoutResponse> {
  const {
    invoiceNumber,
    amount,
    customer,
    lineItems,
    callbackUrl,
    callbackUrlCancel,
    paymentDueDateMinutes = 60,
  } = params;

  // Fallback simulator if no credentials configured
  if (!DOKU_CLIENT_ID || !DOKU_SECRET_KEY) {
    console.warn('[DOKU] Kredensial belum diisi di .env. Menggunakan mode simulasi internal.');
    return {
      success: true,
      invoiceNumber,
      paymentUrl: `/orders/${invoiceNumber}/invoice?doku_simulated=true`,
      raw: { simulated: true },
    };
  }

  const targetPath = '/checkout/v1/payment';
  const requestId = `REQ-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  const timestamp = new Date().toISOString().slice(0, 19) + 'Z'; // e.g. 2026-09-12T00:45:00Z

  const payload = {
    order: {
      invoice_number: invoiceNumber,
      amount: Math.round(amount),
      callback_url: callbackUrl || `https://saloka.id/orders/${invoiceNumber}`,
      callback_url_cancel: callbackUrlCancel || `https://saloka.id/cart`,
      auto_redirect: true,
      line_items: lineItems.map((it) => ({
        name: it.name.slice(0, 50),
        price: Math.round(it.price),
        quantity: it.quantity,
      })),
    },
    payment: {
      payment_due_date: paymentDueDateMinutes,
    },
    customer: {
      id: customer.id || 'CUST-' + invoiceNumber,
      name: customer.name || 'Pelanggan Saloka',
      email: customer.email || 'customer@saloka.id',
      phone: customer.phone || '081234567890',
      address: customer.address || 'Indonesia',
    },
  };

  const bodyString = JSON.stringify(payload);
  const digest = generateDokuDigest(bodyString);
  const signature = generateDokuSignature(
    DOKU_CLIENT_ID,
    requestId,
    timestamp,
    targetPath,
    digest,
    DOKU_SECRET_KEY
  );

  try {
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Client-Id': DOKU_CLIENT_ID,
      'Request-Id': requestId,
      'Request-Timestamp': timestamp,
      'Signature': signature,
      'Digest': digest,
    };

    const resp = await fetch(`${DOKU_BASE_URL}${targetPath}`, {
      method: 'POST',
      headers: requestHeaders,
      body: bodyString,
    });

    const respText = await resp.text();
    let data: any = {};
    try {
      data = JSON.parse(respText);
    } catch {
      throw new Error(`DOKU Invalid JSON Response (${resp.status}): ${respText}`);
    }

    if (!resp.ok) {
      console.error('[DOKU] Checkout error response:', resp.status, data);
      throw new Error(
        data?.error?.message ||
          data?.message ||
          `DOKU API Error (HTTP ${resp.status}): ${JSON.stringify(data)}`
      );
    }

    // Extract payment URL from DOKU response
    const paymentUrl =
      data?.response?.payment?.url ||
      data?.payment?.url ||
      data?.response?.payment_url ||
      data?.payment_url ||
      data?.url;

    if (!paymentUrl) {
      throw new Error('DOKU API tidak mengembalikan payment.url yang valid.');
    }

    return {
      success: true,
      invoiceNumber,
      paymentUrl,
      raw: data,
    };
  } catch (err: any) {
    console.error('[DOKU] createDokuCheckoutPayment failed:', err);
    throw err;
  }
}

// ─── Webhook Signature Verification ───────────────────────────────────────────

/**
 * Verify incoming DOKU notification signature to prevent spoofing
 */
export function verifyDokuNotification(
  headers: {
    clientId?: string | null;
    requestId?: string | null;
    timestamp?: string | null;
    signature?: string | null;
  },
  targetPath: string,
  rawBody: string
): boolean {
  if (!DOKU_SECRET_KEY && !DOKU_PUBLIC_KEY) return true; // In dev/unconfigured environment

  const { clientId, requestId, timestamp, signature } = headers;
  if (!clientId || !requestId || !timestamp || !signature) {
    return false;
  }

  try {
    const digest = generateDokuDigest(rawBody);
    const component = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${timestamp}\nRequest-Target:${targetPath}\nDigest:${digest}`;

    // 1. RSA-SHA256 Verification using DOKU Public Key (Standard for DOKU Notifications)
    if (DOKU_PUBLIC_KEY) {
      try {
        const cleanPublicKey = DOKU_PUBLIC_KEY.includes('\\n')
          ? DOKU_PUBLIC_KEY.replace(/\\n/g, '\n')
          : DOKU_PUBLIC_KEY;
        const cleanSig = signature.replace(/^RSA=/i, '').replace(/^SHA256withRSA=/i, '').trim();
        const verifier = crypto.createVerify('RSA-SHA256');
        verifier.update(component);
        const isValidRsa = verifier.verify(cleanPublicKey, cleanSig, 'base64');
        if (isValidRsa) {
          return true;
        }
      } catch (rsaErr) {
        // Fallback to HMAC
      }
    }

    // 2. Fallback to HMAC-SHA256 Verification with DOKU_SECRET_KEY
    if (DOKU_SECRET_KEY) {
      const expectedSig = generateDokuSignature(
        clientId,
        requestId,
        timestamp,
        targetPath,
        digest,
        DOKU_SECRET_KEY
      );

      const cleanSig = signature.trim();
      const cleanExpected = expectedSig.trim();
      if (cleanSig === cleanExpected) return true;

      const rawReceivedHmac = cleanSig.replace(/^HMACSHA256=/i, '');
      const rawExpectedHmac = cleanExpected.replace(/^HMACSHA256=/i, '');
      if (rawReceivedHmac === rawExpectedHmac) return true;

      const sigA = Buffer.from(cleanSig);
      const sigB = Buffer.from(cleanExpected);
      if (sigA.length === sigB.length && crypto.timingSafeEqual(sigA, sigB)) {
        return true;
      }
    }

    return false;
  } catch (err) {
    console.error('[DOKU] Webhook verification error:', err);
    return false;
  }
}
