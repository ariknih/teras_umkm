import * as doku from './doku'
import * as midtrans from './midtrans'

/**
 * Vendor-agnostic payment gateway contract. src/app/api/payment/checkout and
 * /verify only ever talk to this interface, never to lib/doku.ts or
 * lib/midtrans.ts directly — swapping the active gateway (once the DOKU
 * account is verified, or to a different vendor entirely) means adding one
 * adapter below and flipping PAYMENT_GATEWAY_PRIMARY, with zero changes to
 * routes, purpose logic, or UI.
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
  id: 'DOKU' | 'MIDTRANS'
  createCheckout(params: GatewayCheckoutParams): Promise<{ redirectUrl: string }>
  getStatus(orderId: string): Promise<{ status: GatewayStatus; amount: number }>
  encodeUserId(userId: string): string
  decodeUserId(encoded: string): string
}

const dokuGateway: PaymentGateway = {
  id: 'DOKU',
  async createCheckout(p) {
    const { redirectUrl } = await doku.createCheckoutTransaction({
      invoiceNumber: p.orderId,
      amount: p.amount,
      customerName: p.customerName,
      customerEmail: p.customerEmail,
      lineItems: [{ id: p.orderId, name: p.itemName, quantity: 1, price: p.amount }],
      callbackUrl: p.callbackUrl
    })
    return { redirectUrl }
  },
  async getStatus(orderId) {
    const s = await doku.getTransactionStatus(orderId)
    const status: GatewayStatus = s.transactionStatus === 'SUCCESS' ? 'SUCCESS' : s.transactionStatus === 'FAILED' ? 'FAILED' : 'PENDING'
    return { status, amount: s.grossAmount }
  },
  encodeUserId: doku.encodeUserIdForDoku,
  decodeUserId: doku.decodeUserIdFromDoku
}

const midtransGateway: PaymentGateway = {
  id: 'MIDTRANS',
  async createCheckout(p) {
    const { redirectUrl } = await midtrans.createSnapTransaction({
      orderId: p.orderId,
      grossAmount: p.amount,
      customerDetails: { first_name: p.customerName, email: p.customerEmail },
      itemDetails: [{ id: p.orderId, name: p.itemName, quantity: 1, price: p.amount }],
      callbacks: { finish: p.callbackUrl }
    })
    return { redirectUrl }
  },
  async getStatus(orderId) {
    const s = await midtrans.getTransactionStatus(orderId)
    const status: GatewayStatus =
      s.transactionStatus === 'settlement' || s.transactionStatus === 'capture' ? 'SUCCESS'
        : s.transactionStatus === 'pending' ? 'PENDING'
          : 'FAILED'
    return { status, amount: s.grossAmount }
  },
  encodeUserId: midtrans.encodeUserIdForMidtrans,
  decodeUserId: midtrans.decodeUserIdFromMidtrans
}

const GATEWAYS: Record<string, PaymentGateway> = { DOKU: dokuGateway, MIDTRANS: midtransGateway }

/**
 * The one line that needs to change to switch vendors. Defaults to Midtrans
 * (already-verified account) since DOKU's account isn't verified yet — flip
 * PAYMENT_GATEWAY_PRIMARY=DOKU once it is.
 */
export function getPrimaryGateway(): PaymentGateway {
  const configured = (process.env.PAYMENT_GATEWAY_PRIMARY || 'MIDTRANS').toUpperCase()
  return GATEWAYS[configured] || midtransGateway
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
  return doku.decodeUserIdFromDoku(orderId.split('-').slice(1, -1).join('-'))
}
