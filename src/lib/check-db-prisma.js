const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/teras_umkm?schema=public";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

console.log("Connecting to:", connectionString);

prisma.$connect()
  .then(() => {
    console.log("Prisma connected successfully!");
    return prisma.product.count();
  })
  .then(count => {
    console.log("Product count in database:", count);
    return prisma.product.findMany({ take: 10 });
  })
  .then(products => {
    console.log("Sample products categories:");
    products.forEach(p => console.log(`- ${p.title} (ID: ${p.id}) Category: [${p.category}]`));
    process.exit(0);
  })
  .catch(err => {
    console.error("Prisma connection error:", err);
    process.exit(1);
  });
