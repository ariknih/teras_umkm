import crypto from 'crypto';

const DOKU_CLIENT_ID = process.env.DOKU_CLIENT_ID || '';
const DOKU_SECRET_KEY = process.env.DOKU_SECRET_KEY || '';
const IS_PRODUCTION = process.env.DOKU_IS_PRODUCTION === 'true';

const API_BASE_URL = IS_PRODUCTION ? 'https://api.doku.com' : 'https://api-sandbox.doku.com';

function generateDigest(body: string): string {
  return crypto.createHash('sha256').update(body, 'utf-8').digest('base64');
}

// DOKU signature scheme: HMAC-SHA256 over newline-joined "Key:Value" lines
// (no trailing newline), using the Secret Key from DOKU Back Office.
// Digest line is omitted entirely for requests with no body (GET).
function generateSignature(params: {
  requestId: string;
  timestamp: string;
  requestTarget: string;
  digest?: string;
}): string {
  const lines = [
    `Client-Id:${DOKU_CLIENT_ID}`,
    `Request-Id:${params.requestId}`,
    `Request-Timestamp:${params.timestamp}`,
    `Request-Target:${params.requestTarget}`,
  ];
  if (params.digest) lines.push(`Digest:${params.digest}`);

  const hmac = crypto.createHmac('sha256', DOKU_SECRET_KEY).update(lines.join('\n'), 'utf-8').digest('base64');
  return `HMACSHA256=${hmac}`;
}

function isoTimestamp(): string {
  return new Date().toISOString().replace(/\.\d+Z$/, 'Z');
}

export interface LineItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export async function createCheckoutTransaction(params: {
  invoiceNumber: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  lineItems?: LineItem[];
  callbackUrl: string;
}) {
  const requestTarget = '/checkout/v1/payment';
  const body = JSON.stringify({
    order: {
      amount: params.amount,
      invoice_number: params.invoiceNumber,
      currency: 'IDR',
      callback_url: params.callbackUrl,
      callback_url_cancel: params.callbackUrl,
      callback_url_result: params.callbackUrl,
      line_items: params.lineItems,
    },
    payment: {
      payment_due_date: 60,
    },
    customer: {
      name: params.customerName,
      email: params.customerEmail,
    },
  });

  const requestId = crypto.randomUUID();
  const timestamp = isoTimestamp();
  const digest = generateDigest(body);
  const signature = generateSignature({ requestId, timestamp, requestTarget, digest });

  const response = await fetch(`${API_BASE_URL}${requestTarget}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Client-Id': DOKU_CLIENT_ID,
      'Request-Id': requestId,
      'Request-Timestamp': timestamp,
      'Signature': signature,
    },
    body,
  });

  const data = await response.json();
  if (!response.ok) {
    console.error('DOKU Checkout error response:', data);
    throw new Error(`DOKU API responded with status ${response.status}: ${data.error_messages?.join(', ') || JSON.stringify(data)}`);
  }

  return {
    redirectUrl: data.response.payment.url as string,
    tokenId: data.response.payment.token_id as string,
  };
}

// Source-of-truth status check — never trust the amount/status a client
// or redirect callback reports, always re-query DOKU directly (same
// pattern as getTransactionStatus in lib/midtrans.ts).
export async function getTransactionStatus(invoiceNumber: string) {
  const requestTarget = `/orders/v1/status/${invoiceNumber}`;
  const requestId = crypto.randomUUID();
  const timestamp = isoTimestamp();
  const signature = generateSignature({ requestId, timestamp, requestTarget });

  const response = await fetch(`${API_BASE_URL}${requestTarget}`, {
    method: 'GET',
    headers: {
      'Client-Id': DOKU_CLIENT_ID,
      'Request-Id': requestId,
      'Request-Timestamp': timestamp,
      'Signature': signature,
    },
    cache: 'no-store',
  });

  const data = await response.json();
  if (!response.ok) {
    console.error(`DOKU Status error response for ${invoiceNumber}:`, data);
    throw new Error(`DOKU Status API responded with status ${response.status}: ${data.error_messages?.join(', ') || JSON.stringify(data)}`);
  }

  const transaction = data.transaction || {};
  return {
    transactionStatus: transaction.status as string, // 'SUCCESS' | 'FAILED' | 'PENDING'
    grossAmount: parseFloat(data.order?.amount ?? '0'),
    invoiceNumber: data.order?.invoice_number as string,
  };
}

/**
 * Same 32-hex-char-UUID <-> hyphenated-UUID trick as lib/midtrans.ts,
 * duplicated here (it's 8 lines) rather than importing across providers.
 */
export function encodeUserIdForDoku(userId: string): string {
  if (userId.length === 36 && userId.includes('-')) {
    return userId.replace(/-/g, '');
  }
  return userId;
}

export function decodeUserIdFromDoku(encodedId: string): string {
  if (encodedId.length === 32 && /^[0-9a-fA-F]{32}$/.test(encodedId)) {
    return [
      encodedId.slice(0, 8),
      encodedId.slice(8, 12),
      encodedId.slice(12, 16),
      encodedId.slice(16, 20),
      encodedId.slice(20),
    ].join('-');
  }
  return encodedId;
}
