const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:umkm123@localhost:5432/teras_umkm?schema=public";
console.log("Connecting to Database for Seeding:", connectionString);

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seed() {
  const mockDbPath = path.join(__dirname, '../.mock-db.json');
  if (!fs.existsSync(mockDbPath)) {
    console.log("No .mock-db.json found to seed.");
    process.exit(0);
  }

  const raw = fs.readFileSync(mockDbPath, 'utf-8');
  const data = JSON.parse(raw);

  console.log("Starting Seeding Process...");

  // 1. Seed Users
  if (data.users) {
    console.log(`Seeding ${data.users.length} Users...`);
    for (const u of data.users) {
      await prisma.user.upsert({
        where: { id: u.id },
        update: {},
        create: {
          id: u.id,
          email: u.email,
          name: u.name,
          passwordHash: u.passwordHash,
          role: u.role,
          latitude: u.latitude,
          longitude: u.longitude,
          level: u.level || 1,
          xp: u.xp || 0,
          points: u.points || 0,
          landingPageTemplate: u.landingPageTemplate,
          landingPageConfig: u.landingPageConfig,
          landingPageSetup: u.landingPageSetup || false,
          parentAffiliateId: u.parentAffiliateId,
          membershipLevel: u.membershipLevel || "Reseller",
          membershipAccess: u.membershipAccess || "Gold",
          createdAt: new Date(u.createdAt),
          updatedAt: new Date(u.updatedAt),
        }
      }).catch(err => console.error(`Error seeding user ${u.email}:`, err.message));
    }
  }

  // 2. Seed Wallets
  if (data.wallets) {
    console.log(`Seeding ${data.wallets.length} Wallets...`);
    for (const w of data.wallets) {
      await prisma.wallet.upsert({
        where: { id: w.id },
        update: {},
        create: {
          id: w.id,
          balance: w.balance || 0.0,
          userId: w.userId,
          createdAt: new Date(w.createdAt),
          updatedAt: new Date(w.updatedAt),
        }
      }).catch(err => console.error(`Error seeding wallet for user ${w.userId}:`, err.message));
    }
  }

  // 3. Seed Wallet Transactions
  if (data.walletTransactions) {
    console.log(`Seeding ${data.walletTransactions.length} Wallet Transactions...`);
    for (const tx of data.walletTransactions) {
      await prisma.walletTransaction.upsert({
        where: { id: tx.id },
        update: {},
        create: {
          id: tx.id,
          amount: tx.amount,
          type: tx.type,
          description: tx.description,
          walletId: tx.walletId,
          createdAt: new Date(tx.createdAt),
        }
      }).catch(err => console.error(`Error seeding tx ${tx.id}:`, err.message));
    }
  }

  // 4. Seed Products
  if (data.products) {
    console.log(`Seeding ${data.products.length} Products...`);
    for (const p of data.products) {
      await prisma.product.upsert({
        where: { id: p.id },
        update: {},
        create: {
          id: p.id,
          title: p.title,
          description: p.description,
          price: p.price,
          category: p.category,
          stock: p.stock || 0,
          imageUrl: p.imageUrl,
          latitude: p.latitude,
          longitude: p.longitude,
          jvPartnerId: p.jvPartnerId,
          jvSharePercent: p.jvSharePercent,
          merchantId: p.merchantId,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
        }
      }).catch(err => console.error(`Error seeding product ${p.title}:`, err.message));
    }
  }

  // 5. Seed Courses
  if (data.courses) {
    console.log(`Seeding ${data.courses.length} Courses...`);
    for (const c of data.courses) {
      await prisma.course.upsert({
        where: { id: c.id },
        update: {},
        create: {
          id: c.id,
          title: c.title,
          description: c.description,
          coverImage: c.coverImage,
          accessRequired: c.accessRequired || "Gold",
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
        }
      }).catch(err => console.error(`Error seeding course ${c.title}:`, err.message));
    }
  }

  // 6. Seed Lessons
  if (data.lessons) {
    console.log(`Seeding ${data.lessons.length} Lessons...`);
    for (const l of data.lessons) {
      await prisma.lesson.upsert({
        where: { id: l.id },
        update: {},
        create: {
          id: l.id,
          title: l.title,
          content: l.content,
          videoUrl: l.videoUrl,
          duration: l.duration || 0,
          orderIndex: l.orderIndex,
          courseId: l.courseId,
          createdAt: new Date(l.createdAt),
          updatedAt: new Date(l.updatedAt),
        }
      }).catch(err => console.error(`Error seeding lesson ${l.title}:`, err.message));
    }
  }

  // 7. Seed Community Groups
  if (data.groups) {
    console.log(`Seeding ${data.groups.length} Groups...`);
    for (const g of data.groups) {
      await prisma.communityGroup.upsert({
        where: { id: g.id },
        update: {},
        create: {
          id: g.id,
          name: g.name,
          description: g.description,
          coverUrl: g.coverUrl,
          avatarUrl: g.avatarUrl,
          isSuspended: g.isSuspended || false,
          adminId: g.adminId,
          createdAt: new Date(g.createdAt),
          updatedAt: new Date(g.updatedAt),
        }
      }).catch(err => console.error(`Error seeding group ${g.name}:`, err.message));
    }
  }

  // 8. Seed Group Members
  if (data.groupMembers) {
    console.log(`Seeding ${data.groupMembers.length} Group Members...`);
    for (const gm of data.groupMembers) {
      await prisma.groupMember.upsert({
        where: { id: gm.id },
        update: {},
        create: {
          id: gm.id,
          groupId: gm.groupId,
          userId: gm.userId,
          createdAt: new Date(gm.createdAt),
        }
      }).catch(err => console.error(`Error seeding group member ${gm.id}:`, err.message));
    }
  }

  // 9. Seed Posts
  if (data.posts) {
    console.log(`Seeding ${data.posts.length} Posts...`);
    for (const p of data.posts) {
      await prisma.post.upsert({
        where: { id: p.id },
        update: {},
        create: {
          id: p.id,
          title: p.title,
          content: p.content,
          imageUrl: p.imageUrl,
          videoUrl: p.videoUrl,
          category: p.category,
          authorId: p.authorId,
          groupId: p.groupId,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
        }
      }).catch(err => console.error(`Error seeding post ${p.title}:`, err.message));
    }
  }

  // 10. Seed Comments
  if (data.comments) {
    console.log(`Seeding ${data.comments.length} Comments...`);
    for (const c of data.comments) {
      await prisma.comment.upsert({
        where: { id: c.id },
        update: {},
        create: {
          id: c.id,
          content: c.content,
          postId: c.postId,
          authorId: c.authorId,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
        }
      }).catch(err => console.error(`Error seeding comment ${c.id}:`, err.message));
    }
  }

  // 11. Seed Chat Rooms
  if (data.chatRooms) {
    console.log(`Seeding ${data.chatRooms.length} Chat Rooms...`);
    for (const cr of data.chatRooms) {
      await prisma.chatRoom.upsert({
        where: { id: cr.id },
        update: {},
        create: {
          id: cr.id,
          buyerId: cr.buyerId,
          sellerId: cr.sellerId,
          productId: cr.productId,
          createdAt: new Date(cr.createdAt),
          updatedAt: new Date(cr.updatedAt),
        }
      }).catch(err => console.error(`Error seeding chatroom ${cr.id}:`, err.message));
    }
  }

  // 12. Seed Chat Messages
  if (data.chatMessages) {
    console.log(`Seeding ${data.chatMessages.length} Chat Messages...`);
    for (const cm of data.chatMessages) {
      await prisma.chatMessage.upsert({
        where: { id: cm.id },
        update: {},
        create: {
          id: cm.id,
          roomId: cm.roomId,
          senderId: cm.senderId,
          content: cm.content,
          imageUrl: cm.imageUrl,
          isRead: cm.isRead || false,
          createdAt: new Date(cm.createdAt),
        }
      }).catch(err => console.error(`Error seeding message ${cm.id}:`, err.message));
    }
  }

  console.log("Seeding Finished Successfully!");
  await prisma.$disconnect();
  await pool.end();
}

seed();
