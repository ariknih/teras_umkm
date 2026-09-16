import { createDokuCheckoutPayment, checkDokuOrderStatus } from './doku'

/**
 * A gateway orderId embeds the payer's user id, but only in a form that
 * survives the vendor's allowed character set — a hyphenated UUID does not, so
 * it travels as 32 hex characters and is rehydrated on the way back. This
 * codec used to live in lib/midtrans.ts; it moved here when Midtrans was
 * removed, because decodeOrderUserId below is what attributes a community
 * join-fee webhook to its payer.
 */
export function encodeUserId(userId: string): string {
  if (userId.length === 36 && userId.includes('-')) {
    return userId.replace(/-/g, '')
  }
  return userId
}

export function decodeUserId(encodedId: string): string {
  if (encodedId.length === 32 && /^[0-9a-fA-F]{32}$/.test(encodedId)) {
    return [
      encodedId.slice(0, 8),
      encodedId.slice(8, 12),
      encodedId.slice(12, 16),
      encodedId.slice(16, 20),
      encodedId.slice(20)
    ].join('-')
  }
  return encodedId
}

/**
 * Vendor-agnostic payment gateway contract. src/app/api/payment/checkout and
 * /verify only ever talk to this interface, never to lib/doku.ts directly —
 * moving to a different vendor means adding one adapter below and flipping
 * PAYMENT_GATEWAY_PRIMARY, with zero changes to routes, purpose logic, or UI.
 */
export interface GatewayCheckoutParams {
  orderId: string
  amount: number
  customerName: string
  customerEmail: string
  itemName: string
  callbackUrl: string
}

export type GatewayStatus = 'SUCCESS' | 'PENDING' | 'FAILED'

export interface PaymentGateway {
  id: 'DOKU'
  createCheckout(params: GatewayCheckoutParams): Promise<{ redirectUrl: string }>
  getStatus(orderId: string): Promise<{ status: GatewayStatus; amount: number }>
  encodeUserId(userId: string): string
  decodeUserId(encoded: string): string
}

const dokuGateway: PaymentGateway = {
  id: 'DOKU',
  async createCheckout(p) {
    const res = await createDokuCheckoutPayment({
      invoiceNumber: p.orderId,
      amount: p.amount,
      customer: { name: p.customerName, email: p.customerEmail },
      lineItems: [{ name: p.itemName, quantity: 1, price: p.amount }],
      callbackUrl: p.callbackUrl
    })
    if (!res.success || !res.paymentUrl) throw new Error('DOKU tidak mengembalikan URL pembayaran.')
    return { redirectUrl: res.paymentUrl }
  },
  async getStatus(orderId) {
    const s = await checkDokuOrderStatus(orderId)
    // EXPIRED/NOT_FOUND are terminal for our purposes — treat as FAILED so a
    // dead order never sits PENDING forever waiting on a settlement that
    // cannot arrive.
    const status: GatewayStatus =
      s.status === 'SUCCESS' ? 'SUCCESS'
        : s.status === 'PENDING' ? 'PENDING'
          : 'FAILED'
    return { status, amount: s.amount ?? 0 }
  },
  encodeUserId,
  decodeUserId
}

const GATEWAYS: Record<string, PaymentGateway> = { DOKU: dokuGateway }

/**
 * The one line that needs to change to switch vendors. DOKU is the only
 * gateway; an unrecognised PAYMENT_GATEWAY_PRIMARY falls back to it rather
 * than throwing, so a stale env value cannot take checkout down.
 */
export function getPrimaryGateway(): PaymentGateway {
  const configured = (process.env.PAYMENT_GATEWAY_PRIMARY || 'DOKU').toUpperCase()
  return GATEWAYS[configured] || dokuGateway
}

export function getGatewayById(id: string): PaymentGateway | null {
  return GATEWAYS[id.toUpperCase()] || null
}

/**
 * The orderId's embedded user-id segment decodes identically regardless of
 * which gateway created the order (both adapters do the same UUID-hex
 * strip/reinsert trick) — a standalone helper so callers that only have the
 * orderId (not yet its gateway) can safely check ownership before doing
 * anything else, without picking an arbitrary gateway to borrow the logic from.
 */
export function decodeOrderUserId(orderId: string): string {
  return decodeUserId(orderId.split('-').slice(1, -1).join('-'))
}
