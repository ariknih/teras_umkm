const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/teras_umkm?schema=public";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    console.log("Querying the 10 most recently registered users...");
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        parentAffiliateId: true,
        indukCommunityId: true,
        createdAt: true
      }
    });
    
    console.log(JSON.stringify(users, null, 2));
  } catch (e) {
    console.error("Database Diagnostic Error:", e);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
