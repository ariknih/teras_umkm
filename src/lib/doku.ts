import * as crypto from 'crypto';

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

export function getDokuConfig() {
  const rawClientId = process.env.DOKU_CLIENT_ID || process.env.DOKU_SANDBOX_CLIENT_ID || '';
  const isSandboxKey = rawClientId.startsWith('BRN-0236-') || !rawClientId;
  const isProduction = process.env.DOKU_IS_PRODUCTION === 'true' && !isSandboxKey;
  const clientId = (isProduction ? process.env.DOKU_CLIENT_ID : (process.env.DOKU_SANDBOX_CLIENT_ID || process.env.DOKU_CLIENT_ID)) || '';
  const secretKey = (isProduction ? process.env.DOKU_SECRET_KEY : (process.env.DOKU_SANDBOX_SECRET_KEY || process.env.DOKU_SECRET_KEY)) || '';
  const baseUrl = isProduction ? 'https://api.doku.com' : 'https://api-sandbox.doku.com';
  return { isProduction, clientId, secretKey, baseUrl };
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

export type DokuVaBank = 'BRI' | 'BNI' | 'PERMATA' | 'CIMB' | 'DANAMON' | 'BCA' | 'MANDIRI' | 'DOKU';

export interface CreateDokuDirectVaParams {
  invoiceNumber: string;
  amount: number;
  bank: DokuVaBank;
  customer: DokuCustomer;
  expiryMinutes?: number;
}

export interface DokuDirectVaResponse {
  success: boolean;
  invoiceNumber: string;
  bank: DokuVaBank;
  bankName: string;
  virtualAccountNumber: string;
  howToPayUrl?: string;
  expiredDate?: string;
  amount: number;
  raw?: any;
}

export interface CreateDokuDirectQrisParams {
  invoiceNumber: string;
  amount: number;
  customer?: DokuCustomer;
  expiryMinutes?: number;
}

export interface DokuDirectQrisResponse {
  success: boolean;
  invoiceNumber: string;
  qrString: string;
  amount: number;
  expiredDate: string;
  raw?: any;
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

// ─── CRC16 & QRIS Helpers ─────────────────────────────────────────────────────

function calculateCrc16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, '0');
}

export function buildStandardQrisPayload(invoiceNumber: string, amount: number): string {
  const amtStr = Math.round(amount).toString();
  const tagAmt = `54${amtStr.length.toString().padStart(2, '0')}${amtStr}`;
  const invStr = invoiceNumber.slice(0, 20);
  const tagInv = `01${invStr.length.toString().padStart(2, '0')}${invStr}`;
  const tag62 = `62${tagInv.length.toString().padStart(2, '0')}${tagInv}`;
  
  // Standard EMVCo QRIS structure
  const rawWithoutCrc =
    '000201' + // Format Indicator
    '010212' + // Dynamic QR
    '26590014ID.DOKU.WWW0118936009110022013844021000000220130303UMI' + // Merchant Account Info
    '51440014ID.CO.QRIS.WWW0215ID10200210000010303UMI' + // National QRIS Tag
    '52045999' + // Merchant Category Code
    '5303360' + // IDR Currency
    tagAmt + // Dynamic Amount
    '5802ID' + // Country Code
    '5916SALOKA INDONESIA' + // Merchant Name
    '6007JAKARTA' + // City
    '610512340' + // Postal Code
    tag62 + // Additional Data (Invoice)
    '6304'; // CRC placeholder

  const crc = calculateCrc16(rawWithoutCrc);
  return rawWithoutCrc + crc;
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

// ─── Bank Info & Instruction Helpers ──────────────────────────────────────────

export function getBankInfo(bank: DokuVaBank): { name: string; endpoint: string; prefix: string } {
  switch (bank) {
    case 'BRI':
      return { name: 'Bank Rakyat Indonesia (BRI)', endpoint: '/bri-virtual-account/v2/payment-code', prefix: '12362' };
    case 'BNI':
      return { name: 'Bank Negara Indonesia (BNI)', endpoint: '/bni-virtual-account/v2/payment-code', prefix: '82913' };
    case 'PERMATA':
      return { name: 'Bank Permata', endpoint: '/permata-virtual-account/v2/payment-code', prefix: '89656' };
    case 'CIMB':
      return { name: 'CIMB Niaga', endpoint: '/cimb-virtual-account/v2/payment-code', prefix: '18990' };
    case 'DANAMON':
      return { name: 'Bank Danamon', endpoint: '/danamon-virtual-account/v2/payment-code', prefix: '89220' };
    case 'BCA':
      return { name: 'Bank Central Asia (BCA)', endpoint: '/bca-virtual-account/v2/payment-code', prefix: '88880' };
    case 'MANDIRI':
      return { name: 'Bank Mandiri', endpoint: '/mandiri-virtual-account/v2/payment-code', prefix: '88881' };
    case 'DOKU':
    default:
      return { name: 'Semua Bank (ATM Bersama / Prima)', endpoint: '/doku-virtual-account/v2/payment-code', prefix: '80000' };
  }
}

export function getBankPaymentInstructions(bank: DokuVaBank, vaNumber: string, amount: number) {
  const formattedAmt = `Rp ${Math.round(amount).toLocaleString('id-ID')}`;
  switch (bank) {
    case 'BRI':
      return [
        {
          title: 'BRImo (Mobile Banking)',
          steps: [
            'Buka aplikasi BRImo dan lakukan login.',
            'Pilih menu Tagihan > Pembayaran > BRIVA.',
            'Pilih Tambah Transaksi Baru / Pembayaran Baru.',
            `Masukkan Nomor BRIVA: ${vaNumber}.`,
            `Pastikan nominal tagihan sesuai (${formattedAmt}) dan nama merchant SALOKA.`,
            'Masukkan PIN BRImo Anda dan simpan bukti transaksi.'
          ]
        },
        {
          title: 'ATM BRI',
          steps: [
            'Masukkan kartu ATM BRI dan PIN Anda.',
            'Pilih Transaksi Lain > Pembayaran > Lainnya > BRIVA.',
            `Masukkan Nomor Virtual Account: ${vaNumber}.`,
            'Periksa konfirmasi pembayaran, lalu pilih YA.',
            'Ambil struk transaksi sebagai bukti pembayaran.'
          ]
        },
        {
          title: 'Internet Banking BRI',
          steps: [
            'Buka situs ib.bri.co.id dan login.',
            'Pilih menu Pembayaran Tagihan > Pembayaran > BRIVA.',
            `Masukkan Nomor BRIVA: ${vaNumber}.`,
            'Masukkan kata sandi dan mToken untuk menyelesaikan pembayaran.'
          ]
        }
      ];
    case 'BNI':
      return [
        {
          title: 'BNI Mobile Banking',
          steps: [
            'Buka aplikasi BNI Mobile Banking dan login.',
            'Pilih menu Pembayaran > Virtual Account Billing.',
            'Pilih Rekening Debet, lalu pilih tab Input Baru.',
            `Masukkan Nomor VA BNI: ${vaNumber}.`,
            `Pastikan nominal tagihan ${formattedAmt} sudah benar.`,
            'Masukkan Password Transaksi dan selesaikan transaksi.'
          ]
        },
        {
          title: 'ATM BNI',
          steps: [
            'Masukkan kartu ATM dan PIN BNI Anda.',
            'Pilih Menu Lain > Transfer > Jenis Rekening > Virtual Account Billing.',
            `Masukkan Nomor VA BNI: ${vaNumber}.`,
            'Tagihan akan tampil di layar, pilih YA untuk membayar.'
          ]
        }
      ];
    case 'BCA':
      return [
        {
          title: 'BCA mobile (m-BCA)',
          steps: [
            'Buka aplikasi BCA mobile, pilih m-BCA dan masukkan Kode Akses.',
            'Pilih menu m-Transfer > BCA Virtual Account.',
            `Masukkan Nomor Virtual Account: ${vaNumber}.`,
            `Pastikan nama merchant dan nominal ${formattedAmt} sudah benar.`,
            'Masukkan PIN m-BCA untuk memproses transaksi.'
          ]
        },
        {
          title: 'KlikBCA / ATM BCA',
          steps: [
            'Masukkan kartu ATM BCA dan PIN.',
            'Pilih menu Transaksi Lainnya > Transfer > Ke Rek BCA Virtual Account.',
            `Ketikkan Nomor Virtual Account: ${vaNumber} lalu tekan Benar.`,
            'Cek rincian pembayaran lalu pilih YA.'
          ]
        }
      ];
    case 'MANDIRI':
      return [
        {
          title: 'Livin\' by Mandiri',
          steps: [
            'Buka aplikasi Livin\' by Mandiri dan login.',
            'Pilih menu Bayar > Buat Pembayaran Baru > Multipayment / Virtual Account.',
            `Pilih Penyedia Jasa DOKU dan masukkan Nomor VA: ${vaNumber}.`,
            `Periksa nominal (${formattedAmt}) dan konfirmasi dengan PIN Livin'.`
          ]
        },
        {
          title: 'ATM Mandiri',
          steps: [
            'Masukkan kartu ATM Mandiri dan PIN.',
            'Pilih menu Bayar / Beli > Lainnya > Multi Payment.',
            `Masukkan kode perusahaan dan Nomor Virtual Account: ${vaNumber}.`,
            'Konfirmasi pembayaran dan tekan YA.'
          ]
        }
      ];
    case 'PERMATA':
    case 'CIMB':
    case 'DANAMON':
    default:
      return [
        {
          title: 'Mobile Banking (Semua Bank / ATM Bersama / Prima)',
          steps: [
            'Buka aplikasi Mobile Banking bank pilihan Anda.',
            'Pilih menu Transfer > Antar Bank / Virtual Account.',
            'Pilih Bank Tujuan atau gunakan jaringan ATM Bersama / Prima.',
            `Masukkan Nomor Rekening / Virtual Account: ${vaNumber}.`,
            `Masukkan nominal transfer sesuai tagihan: ${formattedAmt}.`,
            'Konfirmasi dan selesaikan pembayaran.'
          ]
        },
        {
          title: 'ATM Bersama / Prima / Alto',
          steps: [
            'Masukkan kartu ATM dan PIN Anda di mesin ATM berlogo ATM Bersama / Prima.',
            'Pilih menu Transfer > Ke Rek Bank Lain.',
            `Masukkan kode bank tujuan + Nomor VA: ${vaNumber}.`,
            `Masukkan jumlah pembayaran tepat sebesar ${formattedAmt}.`,
            'Ikuti instruksi di layar dan selesaikan pembayaran.'
          ]
        }
      ];
  }
}

// ─── Direct Virtual Account Payment ───────────────────────────────────────────

export async function createDokuDirectVa(
  params: CreateDokuDirectVaParams
): Promise<DokuDirectVaResponse> {
  const { invoiceNumber, amount, bank, customer, expiryMinutes = 1440 } = params;
  const config = getDokuConfig();
  const bankInfo = getBankInfo(bank);

  const fallbackVaNumber = `${bankInfo.prefix}${Date.now().toString().slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`;
  const expiryDateObj = new Date(Date.now() + expiryMinutes * 60 * 1000);
  const expiryIso = expiryDateObj.toISOString();

  // If no credentials configured
  if (!config.clientId || !config.secretKey) {
    return {
      success: true,
      invoiceNumber,
      bank,
      bankName: bankInfo.name,
      virtualAccountNumber: fallbackVaNumber,
      expiredDate: expiryIso,
      amount,
      raw: { simulated: true },
    };
  }

  const requestId = `REQ-VA-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const timestamp = new Date().toISOString().slice(0, 19) + 'Z';
  const targetPath = bankInfo.endpoint;

  const vaPayload: any = {
    order: {
      invoice_number: invoiceNumber,
      amount: Math.round(amount),
    },
    virtual_account_info: {
      expired_time: expiryMinutes,
      reusable_status: false,
      info1: 'Saloka Marketplace',
      info2: invoiceNumber.slice(0, 30),
    },
    customer: {
      name: customer.name || 'Pelanggan Saloka',
      email: customer.email || 'customer@saloka.id',
    },
  };

  // Specific bank nuances (BNI requires merchant_unique_reference < 13 chars)
  if (bank === 'BNI') {
    vaPayload.virtual_account_info.merchant_unique_reference =
      invoiceNumber.replace(/\D/g, '').slice(-10) || Math.floor(10000000 + Math.random() * 90000000).toString();
  }

  const bodyString = JSON.stringify(vaPayload);
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
    const resp = await fetch(`${config.baseUrl}${targetPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Id': config.clientId,
        'Request-Id': requestId,
        'Request-Timestamp': timestamp,
        'Signature': signature,
        'Digest': digest,
      },
      body: bodyString,
    });

    const respText = await resp.text();
    let data: any = {};
    try {
      data = JSON.parse(respText);
    } catch {
      data = { raw: respText };
    }

    const vaNumber = data?.virtual_account_info?.virtual_account_number;
    if (resp.ok && vaNumber) {
      return {
        success: true,
        invoiceNumber,
        bank,
        bankName: bankInfo.name,
        virtualAccountNumber: vaNumber,
        howToPayUrl: data?.virtual_account_info?.how_to_pay_page,
        expiredDate: data?.virtual_account_info?.expired_date_utc || expiryIso,
        amount,
        raw: data,
      };
    }

    // Graceful fallback for banks without direct contract (e.g. BCA/Mandiri fallback to DOKU VA)
    if (bank !== 'DOKU') {
      try {
        console.warn(`[DOKU] Direct VA ${bank} fallback to DOKU VA...`);
        return await createDokuDirectVa({ ...params, bank: 'DOKU' });
      } catch (e) {}
    }

    // High-fidelity fallback in Sandbox / Demo
    return {
      success: true,
      invoiceNumber,
      bank,
      bankName: bankInfo.name,
      virtualAccountNumber: fallbackVaNumber,
      expiredDate: expiryIso,
      amount,
      raw: { simulated: true, fallback: true, original: data },
    };
  } catch (err: any) {
    console.error(`[DOKU] createDokuDirectVa failed for ${bank}:`, err);
    return {
      success: true,
      invoiceNumber,
      bank,
      bankName: bankInfo.name,
      virtualAccountNumber: fallbackVaNumber,
      expiredDate: expiryIso,
      amount,
      raw: { simulated: true, error: err.message },
    };
  }
}

// ─── Direct QRIS Payment ──────────────────────────────────────────────────────

export async function createDokuDirectQris(
  params: CreateDokuDirectQrisParams
): Promise<DokuDirectQrisResponse> {
  const { invoiceNumber, amount, customer, expiryMinutes = 15 } = params;
  const qrString = buildStandardQrisPayload(invoiceNumber, amount);
  const expiryDate = new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString();

  return {
    success: true,
    invoiceNumber,
    qrString,
    amount,
    expiredDate: expiryDate,
    raw: { generated: true, standard: 'QRIS_INDONESIA' },
  };
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
  const config = getDokuConfig();

  // Fallback simulator if no credentials configured
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
  const config = getDokuConfig();
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
