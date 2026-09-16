import { PrismaClient, Prisma } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { roundIntArgs } from './money'

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/teras_umkm?schema=public"

// Per serverless instance, against the Supabase pooler: a small cap keeps many
// concurrent instances under the pooler's client limit, and the timeout makes a
// saturated pool fail fast instead of hanging until the function timeout.
const createClient = () => {
  const pool = new Pool({ connectionString, max: 5, connectionTimeoutMillis: 10_000 })
  const adapter = new PrismaPg(pool)
  // Money columns are whole-Rupiah Int: round any computed amount on its way in
  // instead of letting Prisma reject it mid-checkout (see money.ts).
  return new PrismaClient({ adapter }).$extends({
    query: {
      $allModels: {
        $allOperations({ model, args, query }) {
          return query(roundIntArgs(Prisma.dmmf.datamodel.models, model, args))
        }
      }
    }
  })
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createClient> | undefined
}

export const db = globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
