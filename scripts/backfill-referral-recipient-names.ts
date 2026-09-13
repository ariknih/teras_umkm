// One-time backfill: freezes `recipientName` on every CommunityReferralLog
// row written before that column existed (recipientType === 'REFERRER' and
// recipientName still null). Once every row has it, the read path in
// data-store.ts no longer needs to batch-resolve names live from the User
// table on every view of the ledger. Safe to re-run — it only ever touches
// rows still missing recipientName, so it's a no-op after the first pass.
// Run with:  npx tsx scripts/backfill-referral-recipient-names.ts
import 'dotenv/config'
import { db } from '../src/lib/db'

async function main() {
  const rows = await db.communityReferralLog.findMany({
    where: { recipientType: 'REFERRER', recipientName: null, referrerId: { not: null } },
    select: { id: true, referrerId: true }
  })

  console.log(`Found ${rows.length} legacy referral log row(s) missing recipientName.`)
  if (rows.length === 0) return

  const referrerIds = Array.from(new Set(rows.map((r) => r.referrerId as string)))
  const users = await db.user.findMany({ where: { id: { in: referrerIds } }, select: { id: true, name: true } })
  const nameById = new Map(users.map((u) => [u.id, u.name]))

  let updated = 0
  let skippedDeletedAccount = 0
  for (const row of rows) {
    const name = nameById.get(row.referrerId as string)
    if (!name) {
      // Referrer account was since deleted — nothing to backfill; the read
      // path's generic recipientType label covers this row going forward.
      skippedDeletedAccount++
      continue
    }
    await db.communityReferralLog.update({ where: { id: row.id }, data: { recipientName: name } })
    updated++
  }

  console.log(`Backfilled ${updated} row(s). Skipped ${skippedDeletedAccount} row(s) whose referrer account no longer exists.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
