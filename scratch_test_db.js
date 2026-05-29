const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Checking DB connection...");
  try {
    const res = await prisma.$queryRaw`SELECT 1`;
    console.log("Success! DB is connected:", res);
    const usersCount = await prisma.user.count();
    console.log("Total users in Prisma DB:", usersCount);
  } catch (e) {
    console.error("Prisma connection error:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
