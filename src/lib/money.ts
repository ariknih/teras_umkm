/**
 * Money is whole Rupiah everywhere: DOKU charges IDR without decimals
 * (doku.ts sends Math.round(amount)), and every money column is an Int.
 */

type DmmfField = { name: string; kind: string; type: string }
type DmmfModel = { name: string; fields: readonly DmmfField[] }

const roundDeep = (v: any): any => {
  if (typeof v === 'number') return Number.isFinite(v) ? Math.round(v) : v
  if (Array.isArray(v)) return v.map(roundDeep)
  if (v && typeof v === 'object' && !(v instanceof Date)) {
    const out: any = {}
    for (const k of Object.keys(v)) out[k] = roundDeep(v[k])
    return out
  }
  return v
}

/**
 * Rounds every number bound for an Int column (write data, increments, where
 * filters), following nested relation writes (e.g. Order.items.create) into
 * their own model. Prisma rejects a fractional value for an Int column with a
 * validation error, so this is the single guard that stops a computed amount
 * like `total * 0.05` from crashing a checkout.
 */
export function roundIntArgs(models: readonly DmmfModel[], modelName: string, args: any): any {
  const byName = new Map(models.map(m => [m.name, m]))
  const walk = (model: DmmfModel | undefined, v: any): any => {
    if (!model || v === null || typeof v !== 'object' || v instanceof Date) return v
    if (Array.isArray(v)) return v.map(x => walk(model, x))
    const out: any = {}
    for (const k of Object.keys(v)) {
      const f = model.fields.find(x => x.name === k)
      if (f?.kind === 'scalar' && f.type === 'Int') out[k] = roundDeep(v[k])
      else if (f?.kind === 'object') out[k] = walk(byName.get(f.type), v[k])
      else if (f) out[k] = v[k]
      else out[k] = walk(model, v[k]) // data / where / create / update / AND / OR ...
    }
    return out
  }
  return walk(byName.get(modelName), args)
}

/** Per-unit price after the quantity discount, in whole Rupiah. */
export function wholesaleUnitPrice(basePrice: number, qty: number) {
  if (qty >= 10) return Math.round(basePrice * 0.8)
  if (qty >= 5) return Math.round(basePrice * 0.9)
  if (qty >= 3) return Math.round(basePrice * 0.95)
  return basePrice
}

export type OrderLineItem = { name: string; price: number; quantity: number }

/**
 * The one order-total calculation shared by the DOKU checkout route (what DOKU
 * charges) and createOrder (what the order records), so the two can't drift.
 * `lines` carry the wholesale unit price already. The returned lineItems
 * always sum to `total`, which DOKU Checkout requires; a discount can't be a
 * negative line, so a discounted cart is sent as a single line.
 */
export function computeOrderTotal(params: {
  lines: OrderLineItem[]
  shippingFee?: number
  courier?: string
  bumpSales?: string
  couponCode?: string
  paymentMethod: string
}) {
  const subtotal = params.lines.reduce((s, l) => s + l.price * l.quantity, 0)
  const shippingFee = params.shippingFee || 0

  const BUMPS: Record<string, OrderLineItem> = {
    GARANSI_PREMIUM: { name: 'Garansi Premium 1 Thn', price: 25000, quantity: 1 },
    BOX_KAYU: { name: 'Packaging Box Kayu', price: 15000, quantity: 1 },
    KERTAS_KADO: { name: 'Bungkus Kado', price: 5000, quantity: 1 },
  }
  const bumpLines = (params.bumpSales || '').split(',').map(b => BUMPS[b]).filter(Boolean)
  const bumpSalesTotal = bumpLines.reduce((s, l) => s + l.price, 0)

  let discount = 0
  const code = params.couponCode?.toUpperCase()
  if (code === 'DISKON10') discount = Math.round(subtotal * 0.1)
  else if (code === 'Saloka.id') discount = Math.min(20000, subtotal) // never matches after toUpperCase — kept as-is
  else if (code === 'GRATISONGKIR') discount = shippingFee

  const serviceFee = subtotal > 0 ? 1000 : 0 // Biaya Layanan Aplikasi
  const paymentFee = params.paymentMethod === 'WALLET' ? 0 : (subtotal > 0 ? 1000 : 0) // Biaya Jasa Pembayaran
  const total = Math.max(0, subtotal + shippingFee + bumpSalesTotal + serviceFee + paymentFee - discount)

  const lineItems: OrderLineItem[] = discount > 0
    ? [{ name: 'Pesanan Saloka', price: total, quantity: 1 }]
    : [
        ...params.lines,
        ...(shippingFee > 0 ? [{ name: `Ongkir (${(params.courier || 'Kurir').slice(0, 25)})`, price: shippingFee, quantity: 1 }] : []),
        ...bumpLines,
        ...(serviceFee > 0 ? [{ name: 'Biaya Layanan Aplikasi', price: serviceFee, quantity: 1 }] : []),
        ...(paymentFee > 0 ? [{ name: 'Biaya Jasa Pembayaran', price: paymentFee, quantity: 1 }] : []),
      ]

  return { subtotal, bumpSalesTotal, discount, serviceFee, paymentFee, total, lineItems }
}

/**
 * 60 / 10 / 10 / 20 affiliate commission split in whole Rupiah. The admin share
 * takes the rounding remainder so the four parts always sum to the total.
 */
export function splitAffiliateCommission(total: number) {
  const t = Math.round(total)
  const promoter = Math.round(t * 0.6)
  const community = Math.round(t * 0.1)
  const parent = Math.round(t * 0.1)
  return { total: t, promoter, community, parent, admin: t - promoter - community - parent }
}

/**
 * A Koperasi member's savings balance per type from their savings ledger rows
 * (SETOR adds, TARIK subtracts). POKOK and WAJIB are their own buckets;
 * every other type (SUKARELA, UMROH, QURBAN, custom products) counts as
 * SUKARELA — same bucketing as getCommunitySavingsSummaryAction.
 */
export function summarizeMemberSavings(rows: Array<{ type?: string | null; transactionType?: string | null; amount: number }>) {
  const out = { pokok: 0, wajib: 0, sukarela: 0, total: 0 }
  for (const r of rows) {
    const val = (r.transactionType === 'TARIK' ? -1 : 1) * Math.round(Number(r.amount) || 0)
    if (r.type === 'POKOK') out.pokok += val
    else if (r.type === 'WAJIB') out.wajib += val
    else out.sukarela += val
    out.total += val
  }
  return out
}
