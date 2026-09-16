import * as crypto from 'crypto';
import { readStoredDokuConfig } from './payment-config';

/**
 * DOKU Checkout / Jokul Payment Gateway Integration
 * Docs: https://jokul.doku.com/docs
 */

// Wallet deposit bounds — the wallet UI's own quick-nominal buttons top out at
// Rp 1.000.000 and its floor is Rp 10.000; these are the server-side backstop
// so a direct API call can't open a checkout for Rp 1 or Rp 999.999.999.
// ponytail: MAX_DEPOSIT_AMOUNT is a placeholder ceiling, not a compliance
// figure — replace with whatever AML/KYC transaction limit the business sets.
export const MIN_DEPOSIT_AMOUNT = 10_000;
export const MAX_DEPOSIT_AMOUNT = 50_000_000;

export function validateDepositAmount(amount: unknown): { amount: number } | { error: string } {
  const depositAmount = parseFloat(amount as any);
  if (!Number.isFinite(depositAmount) || depositAmount <= 0) {
    return { error: 'Jumlah pengisian tidak valid.' };
  }
  if (depositAmount < MIN_DEPOSIT_AMOUNT) {
    return { error: `Minimal pengisian saldo adalah Rp ${MIN_DEPOSIT_AMOUNT.toLocaleString('id-ID')}.` };
  }
  if (depositAmount > MAX_DEPOSIT_AMOUNT) {
    return { error: `Maksimal pengisian saldo adalah Rp ${MAX_DEPOSIT_AMOUNT.toLocaleString('id-ID')}.` };
  }
  return { amount: depositAmount };
}

function appOrigin(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}

export interface DokuResolvedConfig {
  isProduction: boolean;
  clientId: string;
  secretKey: string;
  publicKey: string;
  baseUrl: string;
  /** Where the credentials came from — surfaced in the CMS so the active source is never a guess. */
  source: 'database' | 'environment';
}

/**
 * Resolves the active DOKU credentials and the sandbox/live switch.
 *
 * The CMS-managed database row wins when present; environment variables are
 * the fallback, which is what local development and any deployment configured
 * the old way keep using. Precedence is deliberately all-or-nothing rather
 * than per-field: a half-database, half-environment credential set would pair
 * a live client id with a sandbox secret and fail in a way nobody could read
 * off the config screen.
 *
 * `isProduction` alone decides sandbox vs live — there is deliberately no
 * heuristic on the shape of the client id. An earlier version inferred "this
 * looks like a sandbox key" from a `BRN-0236-` prefix, which did not match the
 * credential actually in use, so the guard it was supposed to provide was
 * inert while looking like it worked.
 *
 * Going live with missing credentials throws rather than quietly falling back
 * to an empty client id, because every caller downstream reads empty
 * credentials as "unconfigured, simulate something" — exactly the behaviour
 * that must not survive into production.
 */
export async function getDokuConfig(): Promise<DokuResolvedConfig> {
  const stored = await readStoredDokuConfig();

  const resolved = stored
    ? {
        isProduction: stored.isProduction,
        clientId: stored.clientId,
        secretKey: stored.secretKey,
        publicKey: stored.publicKey,
        source: 'database' as const
      }
    : {
        isProduction: process.env.DOKU_IS_PRODUCTION === 'true',
        clientId: process.env.DOKU_CLIENT_ID || '',
        secretKey: process.env.DOKU_SECRET_KEY || '',
        publicKey: (process.env.DOKU_PUBLIC_KEY || '').replace(/\\n/g, '\n'),
        source: 'environment' as const
      };

  if (resolved.isProduction && (!resolved.clientId || !resolved.secretKey)) {
    throw new Error(
      `DOKU is set to production (source: ${resolved.source}) but the Client ID / Secret Key are missing. Refusing to start a live payment with incomplete credentials.`
    );
  }

  return {
    ...resolved,
    baseUrl: resolved.isProduction ? 'https://api.doku.com' : 'https://api-sandbox.doku.com'
  };
}

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
  const config = await getDokuConfig();

  // Dev convenience only. getDokuConfig() already throws when production is on
  // with credentials missing, so reaching this branch means we are in sandbox
  // with nothing configured — return a local stand-in rather than a network
  // error, so the rest of the flow stays walkable offline.
  if (!config.clientId || !config.secretKey) {
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
  const timestamp = new Date().toISOString().slice(0, 19) + 'Z';

  const payload = {
    order: {
      invoice_number: invoiceNumber,
      amount: Math.round(amount),
      // Fall back to this deployment's own origin, never a hardcoded
      // saloka.id — a preview deploy must not bounce its payer to production.
      callback_url: callbackUrl || `${appOrigin()}/orders/${invoiceNumber}`,
      callback_url_cancel: callbackUrlCancel || `${appOrigin()}/cart`,
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
    config.clientId,
    requestId,
    timestamp,
    targetPath,
    digest,
    config.secretKey
  );

  try {
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Client-Id': config.clientId,
      'Request-Id': requestId,
      'Request-Timestamp': timestamp,
      'Signature': signature,
      'Digest': digest,
    };

    const resp = await fetch(`${config.baseUrl}${targetPath}`, {
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

// ─── Check Order / Payment Status ─────────────────────────────────────────────

export interface DokuOrderStatusResponse {
  success: boolean;
  status: 'SUCCESS' | 'PENDING' | 'FAILED' | 'EXPIRED' | 'NOT_FOUND';
  orderId: string;
  amount?: number;
  raw?: any;
}

/**
 * Check payment status directly with DOKU Jokul API: GET /orders/v1/status/{invoiceNumber}
 */
export async function checkDokuOrderStatus(
  invoiceNumber: string
): Promise<DokuOrderStatusResponse> {
  const config = await getDokuConfig();
  // Same as createDokuCheckoutPayment: unreachable in production because
  // getDokuConfig() throws first. PENDING is the safe sandbox answer — it never
  // credits anyone.
  if (!config.clientId || !config.secretKey) {
    return {
      success: false,
      status: 'PENDING',
      orderId: invoiceNumber,
      raw: { simulated: true },
    };
  }

  const targetPath = `/orders/v1/status/${invoiceNumber}`;
  const requestId = `REQ-STAT-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  const timestamp = new Date().toISOString().slice(0, 19) + 'Z';

  // For GET requests in DOKU Jokul, signature does not contain Digest
  const component = `Client-Id:${config.clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${timestamp}\nRequest-Target:${targetPath}`;
  const hmac = crypto.createHmac('sha256', config.secretKey).update(component).digest('base64');
  const signature = `HMACSHA256=${hmac}`;

  try {
    const resp = await fetch(`${config.baseUrl}${targetPath}`, {
      method: 'GET',
      headers: {
        'Client-Id': config.clientId,
        'Request-Id': requestId,
        'Request-Timestamp': timestamp,
        'Signature': signature,
      },
      cache: 'no-store',
    });

    if (resp.status === 404) {
      return { success: false, status: 'NOT_FOUND', orderId: invoiceNumber };
    }

    const data = await resp.json();
    const trxStatus = (data?.transaction?.status || data?.order?.status || '').toUpperCase();

    if (trxStatus === 'SUCCESS') {
      return {
        success: true,
        status: 'SUCCESS',
        orderId: invoiceNumber,
        amount: data?.order?.amount || data?.transaction?.amount,
        raw: data,
      };
    }

    return {
      success: false,
      status: trxStatus === 'FAILED' ? 'FAILED' : trxStatus === 'EXPIRED' ? 'EXPIRED' : 'PENDING',
      orderId: invoiceNumber,
      raw: data,
    };
  } catch (err: any) {
    console.error('[DOKU] checkDokuOrderStatus failed:', err);
    return {
      success: false,
      status: 'PENDING',
      orderId: invoiceNumber,
      raw: { error: err.message },
    };
  }
}

// ─── Webhook Signature Verification ───────────────────────────────────────────

/**
 * Verify incoming DOKU notification signature to prevent spoofing
 */
export async function verifyDokuNotification(
  headers: {
    clientId?: string | null;
    requestId?: string | null;
    timestamp?: string | null;
    signature?: string | null;
  },
  targetPath: string,
  rawBody: string
): Promise<boolean> {
  // Verify against whichever credentials are actually live — the CMS-managed
  // row if one exists, environment variables otherwise. Reading the same
  // resolved config the outbound calls use means a gateway switch can never
  // leave the webhook verifying against the previous account's keys.
  const { secretKey, publicKey } = await getDokuConfig();

  // No keys means no way to tell a real DOKU callback from a forged one. This
  // used to return true "for dev convenience", which made the endpoint that
  // credits wallets and activates memberships open to anyone who could POST to
  // it the moment the keys went missing.
  if (!secretKey && !publicKey) {
    console.error('[DOKU] Webhook rejected: no DOKU secret key or public key is configured.');
    return false;
  }

  const { clientId, requestId, timestamp, signature } = headers;
  if (!clientId || !requestId || !timestamp || !signature) {
    return false;
  }

  try {
    const digest = generateDokuDigest(rawBody);
    const component = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${timestamp}\nRequest-Target:${targetPath}\nDigest:${digest}`;

    // 1. RSA-SHA256 Verification using DOKU Public Key (Standard for DOKU Notifications)
    if (publicKey) {
      try {
        const cleanPublicKey = publicKey.includes('\\n')
          ? publicKey.replace(/\\n/g, '\n')
          : publicKey;
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

    // 2. Fallback to HMAC-SHA256 Verification with the secret key
    if (secretKey) {
      const expectedSig = generateDokuSignature(
        clientId,
        requestId,
        timestamp,
        targetPath,
        digest,
        secretKey
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

/**
 * Parses the identity and amount a DOKU order id carries. The checkout routes
 * build these ids server-side, so a deposit id names the user it was opened
 * for — which is what lets /api/doku/verify reject a caller settling somebody
 * else's order.
 *
 * Cart checkout ids only carry a truncated user id, so they intentionally
 * return no userId: those must be settled from the server-side pending
 * registry instead. Anything unrecognised returns no userId too, so a caller
 * cannot get credited by inventing an order id.
 */
export function parseDokuOrderId(orderId: string): {
  kind: 'deposit' | 'checkout' | 'unknown';
  userId: string;
  amount: number;
} {
  if (typeof orderId !== 'string') return { kind: 'unknown', userId: '', amount: 0 };

  if (orderId.startsWith('dep-doku_')) {
    const parts = orderId.split('_');
    const amount = Number(parts[2]);
    return {
      kind: 'deposit',
      userId: parts[1] || '',
      amount: Number.isFinite(amount) && amount > 0 ? amount : 0,
    };
  }

  if (orderId.startsWith('chk-doku-')) {
    return { kind: 'checkout', userId: '', amount: 0 };
  }

  return { kind: 'unknown', userId: '', amount: 0 };
}
