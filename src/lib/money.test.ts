/**
 * Self-check for whole-Rupiah money handling.
 * Run with:  npx tsx src/lib/money.test.ts
 */
import assert from 'node:assert/strict'
import { roundIntArgs, splitAffiliateCommission, computeOrderTotal, wholesaleUnitPrice, summarizeMemberSavings } from './money'

const models = [
  { name: 'Order', fields: [
    { name: 'totalAmount', kind: 'scalar', type: 'Int' },
    { name: 'couponCode', kind: 'scalar', type: 'String' },
    { name: 'items', kind: 'object', type: 'OrderItem' },
  ] },
  { name: 'OrderItem', fields: [
    { name: 'price', kind: 'scalar', type: 'Int' },
    { name: 'snackboxRevenueSharePercent', kind: 'scalar', type: 'Float' },
  ] },
  { name: 'User', fields: [
    { name: 'points', kind: 'scalar', type: 'Float' },
  ] },
]

// Nested create: Int fields rounded in both models, Float and strings untouched
assert.deepEqual(
  roundIntArgs(models, 'Order', { data: { totalAmount: 15199.5, couponCode: 'DISKON10', items: { create: [{ price: 617.25, snackboxRevenueSharePercent: 15.5 }] } } }),
  { data: { totalAmount: 15200, couponCode: 'DISKON10', items: { create: [{ price: 617, snackboxRevenueSharePercent: 15.5 }] } } }
)
// Atomic increments and where filters are rounded too
assert.deepEqual(
  roundIntArgs(models, 'Order', { where: { totalAmount: { gte: 99.6 } }, data: { totalAmount: { increment: 0.4 } } }),
  { where: { totalAmount: { gte: 100 } }, data: { totalAmount: { increment: 0 } } }
)
// A Float column (non-money, e.g. loyalty points) is left as-is
assert.deepEqual(roundIntArgs(models, 'User', { data: { points: { increment: 1.25 } } }), { data: { points: { increment: 1.25 } } })
// Dates survive
const d = new Date()
assert.equal(roundIntArgs(models, 'Order', { where: { createdAt: { gte: d } } }).where.createdAt.gte, d)

// Commission split always conserves the total
for (const total of [0, 1, 3, 7, 999, 12345, 15199.05]) {
  const s = splitAffiliateCommission(total)
  assert.equal(s.promoter + s.community + s.parent + s.admin, s.total, `split of ${total} must sum to total`)
  assert.ok(s.admin >= 0)
}
assert.deepEqual(splitAffiliateCommission(10000), { total: 10000, promoter: 6000, community: 1000, parent: 1000, admin: 2000 })

// Wholesale unit prices are whole Rupiah
assert.equal(wholesaleUnitPrice(15999, 3), 15199)
assert.equal(wholesaleUnitPrice(15999, 5), 14399)
assert.equal(wholesaleUnitPrice(15999, 10), 12799)
assert.equal(wholesaleUnitPrice(15999, 2), 15999)

// DOKU line items always sum to the charged total, for every cart shape
const sumLines = (ls: { price: number; quantity: number }[]) => ls.reduce((s, l) => s + l.price * l.quantity, 0)
for (const qty of [1, 3, 5, 10]) {
  for (const couponCode of [undefined, 'DISKON10', 'GRATISONGKIR', 'Saloka.id']) {
    for (const bumpSales of [undefined, 'GARANSI_PREMIUM,KERTAS_KADO', 'COD']) {
      for (const paymentMethod of ['Online Payment', 'WALLET']) {
        const lines = [{ name: 'Kopi', price: wholesaleUnitPrice(15999, qty), quantity: qty }, { name: 'Roti', price: 7500, quantity: 2 }]
        const r = computeOrderTotal({ lines, shippingFee: 12000, courier: 'jne', bumpSales, couponCode, paymentMethod })
        assert.equal(sumLines(r.lineItems), r.total, `line items must sum to total (${qty}, ${couponCode}, ${bumpSales}, ${paymentMethod})`)
        assert.ok(r.lineItems.every(l => Number.isInteger(l.price) && l.price >= 0), 'DOKU line prices are non-negative integers')
        // Matches the formula createOrder used before the extraction
        const subtotal = sumLines(lines)
        const bumps = bumpSales === 'GARANSI_PREMIUM,KERTAS_KADO' ? 30000 : 0
        const disc = couponCode === 'DISKON10' ? Math.round(subtotal * 0.1) : couponCode === 'GRATISONGKIR' ? 12000 : 0
        const fees = 1000 + (paymentMethod === 'WALLET' ? 0 : 1000)
        assert.equal(r.total, Math.max(0, subtotal + 12000 + bumps + fees - disc))
      }
    }
  }
}

console.log('money.test.ts: all assertions passed')

// ── summarizeMemberSavings (Koperasi exit refund / Pokok-lunas check) ──────
{
  const s = summarizeMemberSavings([
    { type: 'POKOK', transactionType: 'SETOR', amount: 100000 },
    { type: 'WAJIB', transactionType: 'SETOR', amount: 25000 },
    { type: 'WAJIB', transactionType: 'SETOR', amount: 25000 },
    { type: 'SUKARELA', transactionType: 'SETOR', amount: 40000 },
    { type: 'SUKARELA', transactionType: 'TARIK', amount: 15000 },
    { type: 'QURBAN', transactionType: 'SETOR', amount: 5000 }
  ])
  assert.deepEqual(s, { pokok: 100000, wajib: 50000, sukarela: 30000, total: 180000 }, 'SETOR/TARIK mix; unknown types count as sukarela')
  assert.deepEqual(summarizeMemberSavings([]), { pokok: 0, wajib: 0, sukarela: 0, total: 0 }, 'no rows = zero balance')
  assert.equal(summarizeMemberSavings([{ type: 'POKOK', transactionType: 'SETOR', amount: 100000 }, { type: 'POKOK', transactionType: 'TARIK', amount: 100000 }]).total, 0, 'refunded member nets to zero')
  console.log('money.test.ts: summarizeMemberSavings assertions passed')
}
