import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/teras_umkm?schema=public"

// Per serverless instance, against the Supabase pooler: a small cap keeps many
// concurrent instances under the pooler's client limit, and the timeout makes a
// saturated pool fail fast instead of hanging until the function timeout.
const pool = new Pool({ connectionString, max: 5, connectionTimeoutMillis: 10_000 })
const adapter = new PrismaPg(pool)

export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

