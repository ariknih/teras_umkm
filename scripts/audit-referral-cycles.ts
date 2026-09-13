// One-off audit: find any CommunityMembership chain that loops back to its
// own origin (a referral cycle), which the new validateReferrerId guard in
// referral-payout.ts prevents going forward but can't retroactively fix.
// Loads each community's membership graph into memory and traces every
// node once, so this never re-queries per user (no N+1) even on a large
// community. Read-only - reports cycles, changes nothing.
// Run with:  npx tsx scripts/audit-referral-cycles.ts
import 'dotenv/config'
import { db } from '../src/lib/db'

async function detectCycles() {
  console.log('Fetching community memberships...')
  const memberships = await db.communityMembership.findMany({
    where: { referrerId: { not: null } },
    select: { userId: true, referrerId: true, communityId: true }
  })

  // Group by community for isolated graph traversal - a chain never crosses
  // communities, so cycles can only form within one.
  const byCommunity = new Map<string, Map<string, string>>()
  for (const m of memberships) {
    if (!byCommunity.has(m.communityId)) byCommunity.set(m.communityId, new Map())
    byCommunity.get(m.communityId)!.set(m.userId, m.referrerId!)
  }

  const foundCycles = new Set<string>()

  for (const [communityId, graph] of byCommunity.entries()) {
    for (const startNode of graph.keys()) {
      let current: string | null = startNode
      const visited = new Set<string>()
      const path: string[] = []

      while (current) {
        if (visited.has(current)) {
          if (current === startNode) {
            // Sort to dedupe the same cycle found from different starting
            // points (A->B->C->A and B->C->A->B are the same loop).
            const cycleId = [...path].sort().join(',')
            if (!foundCycles.has(cycleId)) {
              console.log(`Cycle detected in community ${communityId}:`)
              console.log(`  ${path.join(' -> ')} -> ${current}`)
              foundCycles.add(cycleId)
            }
          }
          break
        }
        visited.add(current)
        path.push(current)
        current = graph.get(current) || null
      }
    }
  }

  console.log(`\nScan complete. Found ${foundCycles.size} distinct cyclic loop(s).`)
  if (foundCycles.size > 0) {
    console.log('To fix: open the DB, pick one user in each reported loop, and set their referrerId to NULL. Breaking one link fixes the whole loop.')
  }
}

detectCycles()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
