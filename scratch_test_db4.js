const { PrismaClient } = require('@prisma/client');

async function main() {
  console.log("Testing Prisma 7 Client instantiation...");
  try {
    // Try passing datasourceUrl
    const prisma = new PrismaClient({
      datasourceUrl: "file:./dev.db"
    });
    const count = await prisma.user.count();
    console.log("Success! Users count:", count);
    await prisma.$disconnect();
  } catch (err) {
    console.error("Failed with datasourceUrl:", err);
  }
}

main();
