const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/teras_umkm?schema=public";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

console.log("Connecting to:", connectionString);

prisma.$connect()
  .then(async () => {
    console.log("Prisma connected successfully!");
    
    const configs = await prisma.shuConfig.findMany();
    console.log("\n=== SHU CONFIGS IN DATABASE ===");
    console.log(configs);
    
    const dists = await prisma.shuMemberDistribution.findMany();
    console.log("\n=== SHU MEMBER DISTRIBUTIONS IN DATABASE ===");
    console.log(dists.map(d => ({
      id: d.id,
      shuConfigId: d.shuConfigId,
      userId: d.userId,
      shuJasaModalAmount: d.shuJasaModalAmount,
      shuJasaUsahaAmount: d.shuJasaUsahaAmount,
      totalShuAmount: d.totalShuAmount
    })));
    
    process.exit(0);
  })
  .catch(err => {
    console.error("Prisma connection error:", err);
    process.exit(1);
  });
