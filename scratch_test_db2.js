const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:umkm123@localhost:5432/teras_umkm?schema=public";
console.log("Connecting to:", connectionString);

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Checking DB connection with adapter...");
  try {
    const res = await prisma.$queryRaw`SELECT 1`;
    console.log("Success! DB is connected:", res);
    const usersCount = await prisma.user.count();
    console.log("Total users in Prisma DB:", usersCount);
    const allUsers = await prisma.user.findMany();
    console.log("All users in DB:", allUsers.map(u => ({ id: u.id, email: u.email, name: u.name, role: u.role })));
  } catch (e) {
    console.error("Prisma connection error:", e.message);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
