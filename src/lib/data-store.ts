
import { calculateDistance } from './utils'
import { db } from './db'
import crypto from 'crypto'
import { ProductCategory } from '@prisma/client'
import fs from 'fs'
import path from 'path'

import {
  mockUsers,
  mockProducts,
  mockCourses,
  mockLessons,
  mockProgress,
  mockGroups,
  mockGroupMembers,
  mockPosts,
  mockComments,
  mockWallets,
  mockWalletTransactions,
  mockReferrals
} from './mock-seed'

// ─── Filesystem Persistence for Mock DB (survives HMR / process restarts) ────
const MOCK_DB_FILE = path.join(process.cwd(), '.mock-db.json')

function loadMockDb(): { 
  products?: any[]; 
  users?: any[]; 
  wallets?: any[]; 
  walletTransactions?: any[]; 
  courses?: any[]; 
  lessons?: any[]; 
  orders?: any[]; 
  posts?: any[]; 
  comments?: any[]; 
  groups?: any[]; 
  groupMembers?: any[];
  chatRooms?: any[];
  chatMessages?: any[];
  supportTickets?: any[];
  supportMessages?: any[];
  reviews?: any[];
  notifications?: any[];
  orderTrackings?: any[];
  communities?: any[];
  communityMemberships?: any[];
  cooperativeLoans?: any[];
  cooperativeSavingsTransactions?: any[];
  cooperativeProducts?: any[];
  shuConfigs?: any[];
  shuMemberDistributions?: any[];
  merchantFundingProjects?: any[];
  announcements?: any[];
  cooperativeReports?: any[];
  discussions?: any[];
  discussionReplies?: any[];
} {
  try {
    if (fs.existsSync(MOCK_DB_FILE)) {
      const raw = fs.readFileSync(MOCK_DB_FILE, 'utf-8')
      const parsed = JSON.parse(raw)
      // Re-hydrate Date fields
      if (parsed.products) {
        parsed.products = parsed.products.map((p: any) => ({ ...p, createdAt: new Date(p.createdAt), updatedAt: new Date(p.updatedAt) }))
      }
      if (parsed.users) {
        parsed.users = parsed.users.map((u: any) => ({ ...u, createdAt: new Date(u.createdAt), updatedAt: new Date(u.updatedAt) }))
      }
      if (parsed.wallets) {
        parsed.wallets = parsed.wallets.map((w: any) => ({ ...w, createdAt: new Date(w.createdAt), updatedAt: new Date(w.updatedAt) }))
      }
      if (parsed.walletTransactions) {
        parsed.walletTransactions = parsed.walletTransactions.map((tx: any) => ({ ...tx, createdAt: new Date(tx.createdAt) }))
      }
      if (parsed.courses) {
        parsed.courses = parsed.courses.map((c: any) => ({ ...c, createdAt: new Date(c.createdAt), updatedAt: new Date(c.updatedAt) }))
      }
      if (parsed.lessons) {
        parsed.lessons = parsed.lessons.map((l: any) => ({ ...l, createdAt: new Date(l.createdAt), updatedAt: new Date(l.updatedAt) }))
      }
      if (parsed.orders) {
        parsed.orders = parsed.orders.map((o: any) => ({ ...o, createdAt: new Date(o.createdAt), updatedAt: new Date(o.updatedAt) }))
      }
      if (parsed.posts) {
        parsed.posts = parsed.posts.map((p: any) => ({ ...p, createdAt: new Date(p.createdAt), updatedAt: new Date(p.updatedAt) }))
      }
      if (parsed.comments) {
        parsed.comments = parsed.comments.map((c: any) => ({ ...c, createdAt: new Date(c.createdAt), updatedAt: new Date(c.updatedAt) }))
      }
      if (parsed.groups) {
        parsed.groups = parsed.groups.map((g: any) => ({ ...g, createdAt: new Date(g.createdAt), updatedAt: new Date(g.updatedAt) }))
      }
      if (parsed.groupMembers) {
        parsed.groupMembers = parsed.groupMembers.map((gm: any) => ({ ...gm, createdAt: new Date(gm.createdAt) }))
      }
      if (parsed.chatRooms) {
        parsed.chatRooms = parsed.chatRooms.map((cr: any) => ({ ...cr, createdAt: new Date(cr.createdAt), updatedAt: new Date(cr.updatedAt) }))
      }
      if (parsed.chatMessages) {
        parsed.chatMessages = parsed.chatMessages.map((cm: any) => ({ ...cm, createdAt: new Date(cm.createdAt) }))
      }
      if (parsed.supportTickets) {
        parsed.supportTickets = parsed.supportTickets.map((st: any) => ({ ...st, createdAt: new Date(st.createdAt), updatedAt: new Date(st.updatedAt) }))
      }
      if (parsed.supportMessages) {
        parsed.supportMessages = parsed.supportMessages.map((sm: any) => ({ ...sm, createdAt: new Date(sm.createdAt) }))
      }
      if (parsed.communities) {
        parsed.communities = parsed.communities.map((c: any) => ({ ...c, createdAt: new Date(c.createdAt), updatedAt: new Date(c.updatedAt) }))
      }
      if (parsed.communityMemberships) {
        parsed.communityMemberships = parsed.communityMemberships.map((cm: any) => ({ ...cm, joinedAt: new Date(cm.joinedAt) }))
      }
      if (parsed.cooperativeLoans) {
        parsed.cooperativeLoans = parsed.cooperativeLoans.map((l: any) => ({ ...l, createdAt: new Date(l.createdAt), updatedAt: new Date(l.updatedAt) }))
      }
      if (parsed.cooperativeSavingsTransactions) {
        parsed.cooperativeSavingsTransactions = parsed.cooperativeSavingsTransactions.map((tx: any) => ({ ...tx, date: new Date(tx.date), createdAt: new Date(tx.createdAt), updatedAt: new Date(tx.updatedAt) }))
      }
      if (parsed.cooperativeProducts) {
        parsed.cooperativeProducts = parsed.cooperativeProducts.map((p: any) => ({ ...p, createdAt: new Date(p.createdAt), updatedAt: new Date(p.updatedAt) }))
      }
      if (parsed.shuConfigs) {
        parsed.shuConfigs = parsed.shuConfigs.map((c: any) => ({ ...c, createdAt: new Date(c.createdAt), updatedAt: new Date(c.updatedAt) }))
      }
      if (parsed.shuMemberDistributions) {
        parsed.shuMemberDistributions = parsed.shuMemberDistributions.map((d: any) => ({ ...d, createdAt: new Date(d.createdAt), updatedAt: new Date(d.updatedAt) }))
      }
      if (parsed.merchantFundingProjects) {
        parsed.merchantFundingProjects = parsed.merchantFundingProjects.map((p: any) => ({ ...p, createdAt: new Date(p.createdAt), updatedAt: new Date(p.updatedAt) }))
      }
      // Load global KYC setting at startup
      if (parsed.globalKycRequired !== undefined) {
        ;(globalThis as any).__isKycRequiredToCreateCommunity = Boolean(parsed.globalKycRequired)
      }
      return parsed
    }
  } catch (e) {
    // ignore read errors
  }
  return {}
}

function mergeMockData(defaultData: any[], persistedData: any[] = []) {
  const merged = [...defaultData]
  persistedData.forEach(item => {
    const idx = merged.findIndex(i => i.id === item.id)
    if (idx !== -1) {
      merged[idx] = { ...merged[idx], ...item }
    } else {
      merged.push(item)
    }
  })
  return merged
}

let lastMockDbMtime = 0

function saveMockDb() {
  try {
    const data = {
      products: globalMockProducts,
      users: globalMockUsers,
      wallets: globalMockWallets,
      walletTransactions: globalMockWalletTransactions,
      courses: globalMockCourses,
      lessons: globalMockLessons,
      posts: globalMockPosts,
      comments: globalMockComments,
      groups: globalMockGroups,
      groupMembers: globalMockGroupMembers,
      chatRooms: globalMockChatRooms,
      chatMessages: globalMockChatMessages,
      supportTickets: globalMockSupportTickets,
      supportMessages: globalMockSupportMessages,
      orders: globalMockOrders,
      reviews: globalMockReviews,
      notifications: globalMockNotifications,
      orderTrackings: globalMockOrderTrackings,
      communities: (globalThis as any).__mockCommunities,
      communityMemberships: (globalThis as any).__mockCommunityMemberships,
      cooperativeLoans: (globalThis as any).__mockCooperativeLoans,
      globalKycRequired: (globalThis as any).__isKycRequiredToCreateCommunity,
      cooperativeSavingsTransactions: (globalThis as any).__mockSavingsTransactions,
      cooperativeProducts: (globalThis as any).__mockCooperativeProducts,
      shuConfigs: (globalThis as any).__mockShuConfigs,
      shuMemberDistributions: (globalThis as any).__mockShuMemberDistributions,
      merchantFundingProjects: (globalThis as any).__mockFundingProjects,
      announcements: (globalThis as any).__mockAnnouncements,
      cooperativeReports: (globalThis as any).__mockCooperativeReports,
      discussions: (globalThis as any).__mockDiscussions,
      discussionReplies: (globalThis as any).__mockDiscussionReplies
    }
    fs.writeFileSync(MOCK_DB_FILE, JSON.stringify(data, null, 2), 'utf-8')
    if (fs.existsSync(MOCK_DB_FILE)) {
      const stat = fs.statSync(MOCK_DB_FILE)
      lastMockDbMtime = stat.mtimeMs
    }
  } catch (e) {
    // ignore write errors (e.g. read-only environments)
  }
}

function syncMockDb() {
  try {
    if (fs.existsSync(MOCK_DB_FILE)) {
      const stat = fs.statSync(MOCK_DB_FILE)
      const mtime = stat.mtimeMs
      if (mtime === lastMockDbMtime) {
        return // no change on disk, skip loading!
      }
      lastMockDbMtime = mtime
      
      const raw = fs.readFileSync(MOCK_DB_FILE, 'utf-8')
      const parsed = JSON.parse(raw)
      
      if (parsed.products) {
        globalMockProducts = mergeMockData(mockProducts, parsed.products.map((p: any) => ({
          ...p,
          isAffiliateEnabled: p.isAffiliateEnabled !== undefined ? p.isAffiliateEnabled : false,
          affiliateCommissionType: p.affiliateCommissionType || 'PERCENT',
          affiliateCommissionValue: p.affiliateCommissionValue !== undefined ? p.affiliateCommissionValue : 0.0,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt)
        })))
      }
      if (parsed.users) {
        globalMockUsers = mergeMockData(mockUsers, parsed.users.map((u: any) => ({ ...u, createdAt: new Date(u.createdAt), updatedAt: new Date(u.updatedAt) })))
      }
      if (parsed.wallets) {
        globalMockWallets = mergeMockData(mockWallets, parsed.wallets.map((w: any) => ({ ...w, createdAt: new Date(w.createdAt), updatedAt: new Date(w.updatedAt) })))
      }
      if (parsed.walletTransactions) {
        globalMockWalletTransactions = mergeMockData(mockWalletTransactions, parsed.walletTransactions.map((tx: any) => ({ ...tx, createdAt: new Date(tx.createdAt) })))
      }
      if (parsed.courses) {
        globalMockCourses = mergeMockData(mockCourses, parsed.courses.map((c: any) => ({ ...c, createdAt: new Date(c.createdAt), updatedAt: new Date(c.updatedAt) })))
      }
      if (parsed.lessons) {
        globalMockLessons = mergeMockData(mockLessons, parsed.lessons.map((l: any) => ({ ...l, createdAt: new Date(l.createdAt), updatedAt: new Date(l.updatedAt) })))
      }
      if (parsed.orders) {
        globalMockOrders = parsed.orders.map((o: any) => ({ ...o, createdAt: new Date(o.createdAt), updatedAt: new Date(o.updatedAt) }))
      }
      if (parsed.posts) {
        globalMockPosts = mergeMockData(mockPosts, parsed.posts.map((p: any) => ({ ...p, createdAt: new Date(p.createdAt), updatedAt: new Date(p.updatedAt) })))
      }
      if (parsed.comments) {
        globalMockComments = mergeMockData(mockComments, parsed.comments.map((c: any) => ({ ...c, createdAt: new Date(c.createdAt), updatedAt: new Date(c.updatedAt) })))
      }
      if (parsed.groups) {
        globalMockGroups = mergeMockData(mockGroups, parsed.groups.map((g: any) => ({ ...g, createdAt: new Date(g.createdAt), updatedAt: new Date(g.updatedAt) })))
      }
      if (parsed.groupMembers) {
        globalMockGroupMembers = mergeMockData(mockGroupMembers, parsed.groupMembers.map((gm: any) => ({ ...gm, createdAt: new Date(gm.createdAt), updatedAt: new Date(gm.updatedAt) })))
      }
      if (parsed.chatRooms) {
        globalMockChatRooms = parsed.chatRooms.map((cr: any) => ({ ...cr, createdAt: new Date(cr.createdAt), updatedAt: new Date(cr.updatedAt) }))
      }
      if (parsed.chatMessages) {
        globalMockChatMessages = parsed.chatMessages.map((cm: any) => ({ ...cm, createdAt: new Date(cm.createdAt) }))
      }
      if (parsed.supportTickets) {
        globalMockSupportTickets = parsed.supportTickets.map((st: any) => ({ ...st, createdAt: new Date(st.createdAt), updatedAt: new Date(st.updatedAt) }))
      }
      if (parsed.supportMessages) {
        globalMockSupportMessages = parsed.supportMessages.map((sm: any) => ({ ...sm, createdAt: new Date(sm.createdAt) }))
      }
      if (parsed.reviews) {
        globalMockReviews = parsed.reviews.map((r: any) => ({ ...r, createdAt: new Date(r.createdAt) }))
      }
      if (parsed.notifications) {
        globalMockNotifications = parsed.notifications.map((n: any) => ({ ...n, createdAt: new Date(n.createdAt) }))
      }
      if (parsed.orderTrackings) {
        globalMockOrderTrackings = parsed.orderTrackings.map((ot: any) => ({ ...ot, createdAt: new Date(ot.createdAt) }))
      }
      if (parsed.communities) {
        (globalThis as any).__mockCommunities = parsed.communities.map((c: any) => ({
          ...c,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt)
        }))
      }
      if (parsed.communityMemberships) {
        (globalThis as any).__mockCommunityMemberships = parsed.communityMemberships.map((cm: any) => ({
          ...cm,
          joinedAt: new Date(cm.joinedAt)
        }))
      }
      if (parsed.cooperativeLoans) {
        (globalThis as any).__mockCooperativeLoans = parsed.cooperativeLoans.map((l: any) => ({
          ...l,
          createdAt: new Date(l.createdAt),
          updatedAt: new Date(l.updatedAt)
        }))
      }
      if (parsed.cooperativeSavingsTransactions) {
        (globalThis as any).__mockSavingsTransactions = parsed.cooperativeSavingsTransactions.map((tx: any) => ({
          ...tx,
          date: new Date(tx.date),
          createdAt: new Date(tx.createdAt),
          updatedAt: new Date(tx.updatedAt)
        }))
      }
      if (parsed.cooperativeProducts) {
        (globalThis as any).__mockCooperativeProducts = parsed.cooperativeProducts.map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt)
        }))
      }
      if (parsed.shuConfigs) {
        (globalThis as any).__mockShuConfigs = parsed.shuConfigs.map((c: any) => ({
          ...c,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt)
        }))
      }
      if (parsed.shuMemberDistributions) {
        (globalThis as any).__mockShuMemberDistributions = parsed.shuMemberDistributions.map((d: any) => ({
          ...d,
          createdAt: new Date(d.createdAt),
          updatedAt: new Date(d.updatedAt)
        }))
      }
      if (parsed.merchantFundingProjects) {
        (globalThis as any).__mockFundingProjects = parsed.merchantFundingProjects.map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt)
        }))
      }
      if (parsed.announcements) {
        (globalThis as any).__mockAnnouncements = parsed.announcements.map((a: any) => ({
          ...a,
          publishedAt: new Date(a.publishedAt),
          createdAt: new Date(a.createdAt),
          updatedAt: new Date(a.updatedAt)
        }))
      }
      if (parsed.cooperativeReports) {
        (globalThis as any).__mockCooperativeReports = parsed.cooperativeReports.map((r: any) => ({
          ...r,
          publishedAt: new Date(r.publishedAt),
          createdAt: new Date(r.createdAt),
          updatedAt: new Date(r.updatedAt)
        }))
      }
      if (parsed.discussions) {
        (globalThis as any).__mockDiscussions = parsed.discussions.map((d: any) => ({
          ...d,
          createdAt: new Date(d.createdAt),
          updatedAt: new Date(d.updatedAt)
        }))
      }
      if (parsed.discussionReplies) {
        (globalThis as any).__mockDiscussionReplies = parsed.discussionReplies.map((r: any) => ({
          ...r,
          createdAt: new Date(r.createdAt),
          updatedAt: new Date(r.updatedAt)
        }))
      }
      if (parsed.globalKycRequired !== undefined) {
        (globalThis as any).__isKycRequiredToCreateCommunity = Boolean(parsed.globalKycRequired)
      }
    }
  } catch (e) {
    // ignore
  }
}

// Load persisted data and merge with defaults
const _persistedDb = loadMockDb()

// Initialize globalThis mock communities from persisted database
;(globalThis as any).__mockCommunities = _persistedDb.communities || []
;(globalThis as any).__mockCommunityMemberships = _persistedDb.communityMemberships || []
;(globalThis as any).__mockCooperativeLoans = _persistedDb.cooperativeLoans || []
;(globalThis as any).__mockSavingsTransactions = _persistedDb.cooperativeSavingsTransactions || []
;(globalThis as any).__mockCooperativeProducts = _persistedDb.cooperativeProducts || []
;(globalThis as any).__mockShuConfigs = _persistedDb.shuConfigs || []
;(globalThis as any).__mockShuMemberDistributions = _persistedDb.shuMemberDistributions || []
;(globalThis as any).__mockFundingProjects = _persistedDb.merchantFundingProjects || []
;(globalThis as any).__mockAnnouncements = _persistedDb.announcements || []
;(globalThis as any).__mockCooperativeReports = _persistedDb.cooperativeReports || []
;(globalThis as any).__mockDiscussions = _persistedDb.discussions || []
;(globalThis as any).__mockDiscussionReplies = _persistedDb.discussionReplies || []

// Global state in-memory database helpers for local updates in sandbox mode
let globalMockProducts: any[] = mergeMockData(mockProducts, _persistedDb.products).map((p: any) => ({
  ...p,
  isAffiliateEnabled: p.isAffiliateEnabled !== undefined ? p.isAffiliateEnabled : false,
  affiliateCommissionType: p.affiliateCommissionType || 'PERCENT',
  affiliateCommissionValue: p.affiliateCommissionValue !== undefined ? p.affiliateCommissionValue : 0.0
}))
let globalMockUsers: any[] = mergeMockData(mockUsers, _persistedDb.users)
let globalMockProgress = [...mockProgress]
let globalMockGroups: any[] = mergeMockData(mockGroups, _persistedDb.groups)
let globalMockChatRooms: any[] = _persistedDb.chatRooms || []
let globalMockChatMessages: any[] = _persistedDb.chatMessages || []
let globalMockSupportTickets: any[] = _persistedDb.supportTickets || []
let globalMockSupportMessages: any[] = _persistedDb.supportMessages || []
let globalMockGroupMembers: any[] = mergeMockData(mockGroupMembers, _persistedDb.groupMembers)
let globalMockPosts = mergeMockData(mockPosts, _persistedDb.posts)
let globalMockComments = mergeMockData(mockComments, _persistedDb.comments)
let globalMockWallets: any[] = mergeMockData(mockWallets, _persistedDb.wallets)
let globalMockWalletTransactions: any[] = mergeMockData(mockWalletTransactions, _persistedDb.walletTransactions)
let globalMockReferrals = [...mockReferrals]
let globalMockCourses: any[] = mergeMockData(mockCourses, _persistedDb.courses)
let globalMockLessons: any[] = mergeMockData(mockLessons, _persistedDb.lessons)
let globalMockOrders: any[] = _persistedDb.orders && _persistedDb.orders.length > 0 ? _persistedDb.orders : [
  {
    id: 'order-1779515200000',
    buyerId: 'user-customer-1',
    totalAmount: 185000,
    status: 'COMPLETED' as const,
    createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
    updatedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
    items: [
      { productId: 'prod-brand-1', quantity: 1, price: 150000, productTitle: 'Premium Box Packaging Template' },
      { productId: 'prod-sourdough-1', quantity: 1, price: 35000, productTitle: 'Artisan Sourdough Starter Kit' }
    ]
  },
  {
    id: 'order-1779517100000',
    buyerId: 'user-merchant-4',
    totalAmount: 2500000,
    status: 'COMPLETED' as const,
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
    items: [
      { productId: 'jasa-brand-1', quantity: 1, price: 2500000, productTitle: 'Luxury Brand Identity & Logo Design' }
    ]
  },
  {
    id: 'order-1779518400000',
    buyerId: 'user-customer-1',
    totalAmount: 95000,
    status: 'COMPLETED' as const,
    createdAt: new Date(Date.now() - 12 * 3600 * 1000),
    updatedAt: new Date(Date.now() - 12 * 3600 * 1000),
    items: [
      { productId: 'prod-brand-2', quantity: 1, price: 95000, productTitle: 'Premium Typography Guidelines Booklet' }
    ]
  }
]
let globalMockCustomLinks: any[] = []
let globalMockClickLogs: any[] = []
let globalMockWaLogs: any[] = []
let globalMockReviews: any[] = _persistedDb.reviews || []
let globalMockNotifications: any[] = _persistedDb.notifications || []
let globalMockOrderTrackings: any[] = _persistedDb.orderTrackings || []
let globalMockPaymentMethods: any[] = (_persistedDb as any).paymentMethods && (_persistedDb as any).paymentMethods.length > 0 ? (_persistedDb as any).paymentMethods : [
  {
    id: 'pm-1',
    type: 'BANK',
    providerName: 'Bank BCA',
    accountName: 'PT Saloka Indonesia',
    accountNumber: '8830123456',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'pm-2',
    type: 'BANK',
    providerName: 'Bank Mandiri',
    accountName: 'PT Saloka Indonesia',
    accountNumber: '1370001234567',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'pm-3',
    type: 'QRIS',
    providerName: 'QRIS Saloka UMKM',
    qrRawString: '00020101021126670016ID.CO.QRIS.WWW01189360050300000806460215ID10200388471130303UME5204581253033605802ID5913SALOKA UMKM6007JAKARTA61051211062070803M016304A1B2',
    isActive: true,
    createdAt: new Date().toISOString()
  }
]

// Database Access Verification Utility with cache and timeout race
let lastDbCheckTime = 0;
let cachedDbConnected = false;

export async function isDbConnected(): Promise<boolean> {
  const now = Date.now();
  if (now - lastDbCheckTime < 60000 && cachedDbConnected) {
    return cachedDbConnected;
  }
  lastDbCheckTime = now;
  try {
    const connectionPromise = db.$queryRaw`SELECT 1`.then(() => true);
    const timeoutPromise = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 10000));
    cachedDbConnected = await Promise.race([connectionPromise, timeoutPromise]);
    if (!cachedDbConnected) {
      try {
        fs.appendFileSync(
          path.join(process.cwd(), 'db_error_log.txt'),
          `[${new Date().toISOString()}] isDbConnected warning: database connection check timed out (>10s)\n\n`
        )
      } catch (logErr) {}
    }
    return cachedDbConnected;
  } catch (e: any) {
    try {
      fs.appendFileSync(
        path.join(process.cwd(), 'db_error_log.txt'),
        `[${new Date().toISOString()}] isDbConnected error: ${e.message}\n${e.stack}\n\n`
      )
    } catch (logErr) {}
    cachedDbConnected = false;
    return false;
  }
}

// Unified Store functions with fallback logic

/**
 * Generic query helper with Prisma DB execution and in-memory mock fallback.
 */
async function withFallback<T = any, M = any>(
  dbQuery: () => Promise<T> | any,
  mockFallback: () => M | Promise<M> | any
): Promise<any> {
  syncMockDb()
  if (await isDbConnected()) {
    try {
      const res = await dbQuery()
      if (res !== null && res !== undefined) {
        return res
      }
    } catch (_) {}
  }
  return await mockFallback()
}

/**
 * Generic mutation helper with Prisma DB execution and in-memory mock fallback + auto save.
 */
async function withMutationFallback<T = any, M = any>(
  dbMutation: () => Promise<T> | any,
  mockMutation: () => M | Promise<M> | any
): Promise<any> {
  syncMockDb()
  if (await isDbConnected()) {
    try {
      const res = await dbMutation()
      if (res !== null && res !== undefined) {
        return res
      }
    } catch (_) {}
  }
  const result = await mockMutation()
  saveMockDb()
  return result
}

// Unified Store functions with fallback logic
export const DataStore = {
  // USER OPERATIONS
  async findUserByEmail(email: string) {
    return withFallback(
      () => db.user.findUnique({ where: { email } }),
      () => globalMockUsers.find(u => u.email === email) || null
    )
  },

  async findUserById(id: string) {
    return withFallback(
      () => db.user.findUnique({ where: { id } }),
      () => globalMockUsers.find(u => u.id === id) || null
    )
  },

  async findUserByWhatsApp(whatsappNum: string) {
    const cleanNum = whatsappNum.replace(/[^0-9]/g, '')
        if (!cleanNum) return null
    return withFallback(
      async () => {
        const users = await db.user.findMany({
                  where: {
                    landingPageSetup: true,
                    landingPageConfig: {
                      not: null
                    }
                  }
                })
                
                for (const user of users) {
                  if (user.landingPageConfig) {
                    try {
                      const config = JSON.parse(user.landingPageConfig)
                      if (config && config.whatsapp) {
                        const configWa = config.whatsapp.replace(/[^0-9]/g, '')
                        if (configWa === cleanNum) {
                          return user
                        }
                      }
                    } catch (_) {}
                  }
                }
      },
      async () => {
        // Fallback to mock users
            for (const user of globalMockUsers) {
              if (user.landingPageConfig) {
                try {
                  const config = JSON.parse(user.landingPageConfig)
                  if (config && config.whatsapp) {
                    const configWa = config.whatsapp.replace(/[^0-9]/g, '')
                    if (configWa === cleanNum) {
                      return user
                    }
                  }
                } catch (_) {}
              }
            }
            return null
      }
    )
  },

  async findUserBySubdomain(subdomain: string) {
    const cleanSub = subdomain.toLowerCase().trim()
        if (!cleanSub) return null
    return withFallback(
      async () => {
        const users = await db.user.findMany({
                  where: {
                    landingPageSetup: true,
                    landingPageConfig: {
                      not: null
                    }
                  }
                })
                
                for (const user of users) {
                  if (user.landingPageConfig) {
                    try {
                      const config = JSON.parse(user.landingPageConfig)
                      if (config && config.subdomain && config.subdomain.toLowerCase().trim() === cleanSub) {
                        return user
                      }
                    } catch (_) {}
                  }
                }
      },
      async () => {
        // Fallback to mock users
            for (const user of globalMockUsers) {
              if (user.landingPageConfig) {
                try {
                  const config = JSON.parse(user.landingPageConfig)
                  if (config && config.subdomain && config.subdomain.toLowerCase().trim() === cleanSub) {
                    return user
                  }
                } catch (_) {}
              }
            }
            return null
      }
    )
  },

  async createUser(data: { email: string; name: string; passwordHash: string; role: string; latitude?: number; longitude?: number; parentAffiliateId?: string; username?: string }) {
    const defaultTemplate = 'modern-gold'
        const defaultStyle = { textAlign: 'center', fontSize: 'default', fontWeight: 'default', color: '', bgColor: '', paddingTop: 16, paddingBottom: 16, paddingLeft: 16, paddingRight: 16, opacity: 100, textDecoration: 'none', textTransform: 'none', borderRadius: 0 }
        const defaultAdvance = { marginTop: 0, marginBottom: 0, animation: 'none', showDesktop: true, showTablet: true, showMobile: true, customClass: '', customId: '' }
        const makeComp = (type: string, content: any, style = {}, advance = {}) => ({
          id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          type,
          content,
          style: { ...defaultStyle, ...style },
          advance: { ...defaultAdvance, ...advance }
        })
        const defaultPages = [
          {
            id: "page-main",
            name: "Main Storefront",
            slug: "",
            template: "template1",
            status: "PUBLISHED",
            customDomain: "",
            headDesktop: "",
            headMobile: "",
            footerAny: "",
            footerDesktop: "",
            footerMobile: "",
            allowSearch: "Yes",
            followLinks: "Yes",
            lastModified: new Date().toISOString(),
            builderComponents: [
              makeComp('headline', { text: `Selamat Datang di ${data.name}`, tag: 'h1' }, { textAlign: 'center', paddingTop: 32, paddingBottom: 8 }),
              makeComp('subheadline', { text: 'Kami menyediakan produk dan layanan berkualitas tinggi untuk Anda.', tag: 'h2' }, { textAlign: 'center', paddingTop: 8, paddingBottom: 24, color: '#6B7280' }),
              makeComp('product_showcase', { productIds: [], layout: 'grid', columns: 2, title: 'Produk Pilihan Kami', showPrice: true, showStock: true, showBuyBtn: true, buyBtnLabel: 'Beli Sekarang' }),
              makeComp('whatsapp_button', { label: 'Hubungi Kami', phone: '', message: 'Halo, saya tertarik dengan produk Anda.' }, { textAlign: 'center' })
            ]
          }
        ]
        const defaultConfig = JSON.stringify({
          title: data.name,
          bio: `Selamat datang di profil resmi kami. Kami adalah pelaku usaha terdaftar di ekosistem premium Saloka.id. Silakan jelajahi katalog produk, jasa, dan lokasi kami.`,
          phone: "",
          instagram: `@${data.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          sections: ["hero", "profile", "products", "map"],
          pages: defaultPages
        })
    return withMutationFallback(
      async () => {
        return await db.$transaction(async (tx) => {
                  const user = await tx.user.create({
                    data: {
                      ...data,
                      username: data.username || null,
                      role: data.role as any,
                      level: 1,
                      xp: 0,
                      coinBalance: 0.0,
                      landingPageTemplate: defaultTemplate,
                      landingPageConfig: defaultConfig,
                      landingPageSetup: false,
                      membershipLevel: 'Reseller',
                      membershipAccess: 'Gold',
                      parentAffiliateId: data.parentAffiliateId || null
                    } as any
                  })
                  await tx.wallet.create({ data: { userId: user.id, balance: 0.0 } })
                  return user
                })
      },
      async () => {
        const newUser = {
              id: `user-${Date.now()}`,
              email: data.email,
              name: data.name,
              username: data.username || null,
              passwordHash: data.passwordHash,
              role: data.role,
              latitude: data.latitude || -6.2088,
              longitude: data.longitude || 106.8456,
              level: 1,
              xp: 0,
              coinBalance: 0.0,
              landingPageTemplate: defaultTemplate,
              landingPageConfig: defaultConfig,
              landingPageSetup: false,
              parentAffiliateId: data.parentAffiliateId || null,
              membershipLevel: 'Reseller',
              membershipAccess: 'Gold',
              createdAt: new Date(),
              updatedAt: new Date(),
            }
            globalMockUsers.push(newUser)
            globalMockWallets.push({
              id: `wallet-${newUser.id}`,
              userId: newUser.id,
              balance: 0.0,
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            return newUser
      }
    )
  },

  // ADMIN OPERATIONS
  async getAllUsers() {
    return withFallback(
      () => db.user.findMany({ orderBy: { createdAt: 'desc' } }),
      () => [...globalMockUsers]
    )
  },

  async getAllOrders() {
    return withFallback(
      () => db.order.findMany({
          include: { buyer: true, items: true },
          orderBy: { createdAt: 'desc' }
        }),
      () => [...globalMockOrders]
    )
  },

  async findOrderById(id: string) {
    return withFallback(
      () => db.order.findUnique({
          where: { id },
          include: { buyer: true, items: { include: { product: true } } }
        }),
      () => globalMockOrders.find(o => o.id === id) || null
    )
  },

  // Course Management
  async addCourse(title: string, description: string, coverImage: string, accessRequired: string) {
    const newCourse = {
          id: `course-${Date.now()}`,
          title,
          description,
          coverImage,
          accessRequired,
          createdAt: new Date(),
          updatedAt: new Date()
        }
    return withMutationFallback(
      async () => {
        await db.course.create({
                  data: {
                    id: newCourse.id,
                    title,
                    description,
                    coverImage,
                    accessRequired
                  }
                })
      },
      async () => {
        globalMockCourses.push(newCourse)
            return newCourse
      }
    )
  },

  async updateCourse(id: string, title: string, description: string, coverImage: string, accessRequired: string) {
    return withMutationFallback(
      async () => {
        await db.course.update({
                  where: { id },
                  data: { title, description, coverImage, accessRequired }
                })
      },
      async () => {
        const idx = globalMockCourses.findIndex(c => c.id === id)
            if (idx !== -1) {
              globalMockCourses[idx] = {
                ...globalMockCourses[idx],
                title,
                description,
                coverImage,
                accessRequired,
                updatedAt: new Date()
              }
            }
            return true
      }
    )
  },

  async deleteCourse(id: string) {
    return withMutationFallback(
      async () => {
        await db.course.delete({ where: { id } })
      },
      async () => {
        globalMockCourses = globalMockCourses.filter(c => c.id !== id)
            globalMockLessons = globalMockLessons.filter(l => l.courseId !== id)
            return true
      }
    )
  },

  // Lesson Management
  async addLesson(courseId: string, title: string, content: string, videoUrl: string, duration: number, orderIndex: number) {
    const newLesson = {
          id: `lesson-${Date.now()}`,
          courseId,
          title,
          content,
          videoUrl,
          duration,
          orderIndex,
          createdAt: new Date(),
          updatedAt: new Date()
        }
    return withMutationFallback(
      async () => {
        await db.lesson.create({
                  data: {
                    id: newLesson.id,
                    courseId,
                    title,
                    content,
                    videoUrl,
                    duration,
                    orderIndex
                  }
                })
      },
      async () => {
        globalMockLessons.push(newLesson)
            return newLesson
      }
    )
  },

  async updateLesson(id: string, title: string, content: string, videoUrl: string, duration: number, orderIndex: number) {
    return withMutationFallback(
      async () => {
        await db.lesson.update({
                  where: { id },
                  data: { title, content, videoUrl, duration, orderIndex }
                })
      },
      async () => {
        const idx = globalMockLessons.findIndex(l => l.id === id)
            if (idx !== -1) {
              globalMockLessons[idx] = {
                ...globalMockLessons[idx],
                title,
                content,
                videoUrl,
                duration,
                orderIndex,
                updatedAt: new Date()
              }
            }
            return true
      }
    )
  },

  async deleteLesson(id: string) {
    return withMutationFallback(
      async () => {
        await db.lesson.delete({ where: { id } })
      },
      async () => {
        globalMockLessons = globalMockLessons.filter(l => l.id !== id)
            return true
      }
    )
  },

  // User Management Override
  async updateUserRoleAndLevel(userId: string, role: string, level: number, xp: number, membershipLevel: string, membershipAccess: string, bootcampStatus?: string) {
    return withMutationFallback(
      async () => {
        await db.user.update({
                  where: { id: userId },
                  data: {
                    role: role as any,
                    level,
                    xp,
                    membershipLevel,
                    membershipAccess,
                    bootcampStatus: bootcampStatus || undefined
                  }
                })
      },
      async () => {
        const idx = globalMockUsers.findIndex(u => u.id === userId)
            if (idx !== -1) {
              globalMockUsers[idx] = {
                ...globalMockUsers[idx],
                role,
                level,
                xp,
                membershipLevel,
                membershipAccess,
                bootcampStatus: bootcampStatus || globalMockUsers[idx].bootcampStatus || 'NONE',
                updatedAt: new Date()
              }
            }
            return true
      }
    )
  },

  async joinBootcamp(userId: string) {
    return withMutationFallback(
      async () => {
        await db.user.update({
                  where: { id: userId },
                  data: { bootcampStatus: 'JOINED' }
                })
      },
      async () => {
        const idx = globalMockUsers.findIndex(u => u.id === userId)
            if (idx !== -1) {
              globalMockUsers[idx] = {
                ...globalMockUsers[idx],
                bootcampStatus: 'JOINED',
                updatedAt: new Date()
              }
            }
            return true
      }
    )
  },

  async updateUserRole(userId: string, role: string) {
    return withMutationFallback(
      async () => {
        return await db.user.update({
                  where: { id: userId },
                  data: { role: role as any }
                })
      },
      async () => {
        syncMockDb()
            const user = globalMockUsers.find(u => u.id === userId)
            if (user) {
              user.role = role as any
              user.updatedAt = new Date()
              return user
            }
            return null
      }
    )
  },

  async isSubdomainTaken(subdomain: string, excludeUserId?: string): Promise<boolean> {
    const cleanSub = subdomain.toLowerCase().trim()
    if (['test', 'admin', 'saloka', 'buat', 'web', 'system', 'api', 'dev', 'portal'].includes(cleanSub)) {
      return true
    }

    if (await isDbConnected()) {
      try {
        const users = await db.user.findMany({
          where: {
            landingPageConfig: {
              contains: `"subdomain":"${cleanSub}"`
            },
            NOT: excludeUserId ? { id: excludeUserId } : undefined
          }
        })
        if (users.length > 0) return true
      } catch (_) {}
    }

    const matchedMock = globalMockUsers.find(u => {
      if (excludeUserId && u.id === excludeUserId) return false
      if (!u.landingPageConfig) return false
      try {
        const config = JSON.parse(u.landingPageConfig)
        return config.subdomain?.toLowerCase().trim() === cleanSub
      } catch (_) {
        return false
      }
    })

    return !!matchedMock
  },

  async recreateMissingUser(data: { id: string; email: string; name: string; role: string }) {
    return withMutationFallback(
      async () => {
        const u = await db.user.create({
                  data: {
                    id: data.id,
                    email: data.email,
                    name: data.name,
                    role: data.role as any,
                    passwordHash: crypto.randomBytes(16).toString('hex'),
                    level: 1,
                    xp: 0,
                    landingPageSetup: false,
                    membershipLevel: 'Reseller',
                    membershipAccess: 'Gold'
                  }
                })
                await db.wallet.create({ data: { userId: u.id, balance: 0.0 } })
                return u
      },
      async () => {
        syncMockDb()
            let user = globalMockUsers.find(u => u.id === data.id || u.email === data.email)
            if (!user) {
              user = {
                id: data.id,
                email: data.email,
                name: data.name,
                passwordHash: crypto.randomBytes(16).toString('hex'),
                role: data.role as any,
                latitude: -6.2088,
                longitude: 106.8456,
                level: 1,
                xp: 0,
                landingPageTemplate: null,
                landingPageConfig: null,
                landingPageSetup: false,
                parentAffiliateId: null,
                membershipLevel: 'Reseller',
                membershipAccess: 'Gold',
                createdAt: new Date(),
                updatedAt: new Date()
              }
              globalMockUsers.push(user)
              
              // Ensure wallet is created!
              if (!globalMockWallets.some(w => w.userId === user.id)) {
                globalMockWallets.push({
                  id: `wallet-${user.id}`,
                  userId: user.id,
                  balance: 0.0,
                  createdAt: new Date(),
                  updatedAt: new Date()
                })
              }
              }
            return user
      }
    )
  },

  // PRODUCT OPERATIONS
  async getProducts(category?: string) {
    return withFallback(
      async () => {
        if (category) {
                  return await db.product.findMany({
                    where: { category: category as ProductCategory },
                    include: { merchant: true },
                    orderBy: { createdAt: 'desc' }
                  })
                }
                return await db.product.findMany({
                  include: { merchant: true },
                  orderBy: { createdAt: 'desc' }
                })
      },
      async () => {
        const list = category ? globalMockProducts.filter(p => p.category === category) : globalMockProducts
        return list.map(p => ({
          ...p,
          merchant: globalMockUsers.find(u => u.id === p.merchantId) || null
        })).sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime())
      }
    )
  },

  async getProductsByMerchantIds(merchantIds: string[]) {
    if (!merchantIds || merchantIds.length === 0) return []
    return withFallback(
      async () => {
        return await db.product.findMany({
          where: { merchantId: { in: merchantIds } },
          include: { merchant: { select: { id: true, name: true, image: true, role: true } } },
          orderBy: { createdAt: 'desc' }
        })
      },
      async () => {
        const list = globalMockProducts.filter(p => merchantIds.includes(p.merchantId))
        return list.map(p => ({
          ...p,
          merchant: globalMockUsers.find(u => u.id === p.merchantId) || null
        })).sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime())
      }
    )
  },

  async getProductById(id: string) {
    return withFallback(
      async () => {
        return await db.product.findUnique({
          where: { id },
          include: { merchant: true }
        })
      },
      async () => {
        const p = globalMockProducts.find(prod => prod.id === id) || null
        if (!p) return null
        return {
          ...p,
          merchant: globalMockUsers.find(u => u.id === p.merchantId) || null
        }
      }
    )
  },

  async createProduct(data: { 
    title: string; 
    description: string; 
    price: number; 
    category: any; 
    stock: number; 
    imageUrl?: string; 
    merchantId: string; 
    latitude?: number; 
    longitude?: number;
    jvPartnerId?: string;
    jvSharePercent?: number;
    isAffiliateEnabled?: boolean;
    affiliateCommissionType?: string;
    affiliateCommissionValue?: number;
  }) {
    return withMutationFallback(
      async () => {
        return await db.product.create({ data })
      },
      async () => {
        const newProd = {
          id: `prod-${Date.now()}`,
          title: data.title,
          description: data.description,
              price: data.price,
              category: data.category,
              stock: data.stock,
              imageUrl: data.imageUrl || null,
              merchantId: data.merchantId,
              latitude: data.latitude || null,
              longitude: data.longitude || null,
              jvPartnerId: data.jvPartnerId || null,
              jvSharePercent: data.jvSharePercent || null,
              isAffiliateEnabled: data.isAffiliateEnabled || false,
              affiliateCommissionType: data.affiliateCommissionType || 'PERCENT',
              affiliateCommissionValue: data.affiliateCommissionValue || 0.0,
              createdAt: new Date(),
              updatedAt: new Date(),
            }
            globalMockProducts.push(newProd)
            return newProd
      }
    )
  },

  async updateProduct(
    id: string, 
    merchantId: string, 
    data: Partial<{ 
      title: string; 
      description: string; 
      price: number; 
      category: any; 
      stock: number; 
      imageUrl: string; 
      latitude?: number; 
      longitude?: number;
      isAffiliateEnabled?: boolean;
      affiliateCommissionType?: string;
      affiliateCommissionValue?: number;
    }>
  ) {
    return withMutationFallback(
      async () => {
        return await db.product.update({
                  where: { id, merchantId },
                  data
                })
      },
      async () => {
        const idx = globalMockProducts.findIndex(p => p.id === id && p.merchantId === merchantId)
            if (idx === -1) throw new Error('Product not found or unauthorized')
            const updated = {
              ...globalMockProducts[idx],
              ...data,
              updatedAt: new Date()
            }
            globalMockProducts[idx] = updated
            return updated
      }
    )
  },

  async updateAllProductsAffiliateSettings(
    merchantId: string, 
    isAffiliateEnabled: boolean, 
    affiliateCommissionType: string, 
    affiliateCommissionValue: number
  ) {
    return withMutationFallback(
      async () => {
        await db.product.updateMany({
                  where: { merchantId },
                  data: {
                    isAffiliateEnabled,
                    affiliateCommissionType,
                    affiliateCommissionValue
                  }
                })
                return true
      },
      async () => {
        // In-memory simulation
            globalMockProducts.forEach(p => {
              if (p.merchantId === merchantId) {
                p.isAffiliateEnabled = isAffiliateEnabled
                p.affiliateCommissionType = affiliateCommissionType
                p.affiliateCommissionValue = affiliateCommissionValue
                p.updatedAt = new Date()
              }
            })
            return true
      }
    )
  },

  async deleteProduct(id: string, merchantId: string) {
    return withMutationFallback(
      async () => {
        return await db.product.delete({
                  where: { id, merchantId }
                })
      },
      async () => {
        const idx = globalMockProducts.findIndex(p => p.id === id && p.merchantId === merchantId)
            if (idx === -1) throw new Error('Product not found or unauthorized')
            globalMockProducts.splice(idx, 1)
            return true
      }
    )
  },

  async getCourses() {
    return withFallback(
      () => db.course.findMany({
          include: { lessons: { orderBy: { orderIndex: 'asc' } } }
        }),
      () => globalMockCourses.map(c => ({
      ...c,
      lessons: globalMockLessons.filter(l => l.courseId === c.id).sort((a,b) => a.orderIndex - b.orderIndex)
    }))
    )
  },

  async getCourseById(id: string) {
    return withFallback(
      async () => {
        return await db.course.findUnique({
                  where: { id },
                  include: { lessons: { orderBy: { orderIndex: 'asc' } } }
                })
      },
      async () => {
        const course = globalMockCourses.find(c => c.id === id) || null
            if (!course) return null
            return {
              ...course,
              lessons: globalMockLessons.filter(l => l.courseId === course.id).sort((a,b) => a.orderIndex - b.orderIndex)
            }
      }
    )
  },

  async getUserProgress(userId: string) {
    return withFallback(
      () => db.progress.findMany({ where: { userId } }),
      () => globalMockProgress.filter(p => p.userId === userId)
    )
  },

  async toggleLessonProgress(userId: string, lessonId: string, completed: boolean) {
    return withMutationFallback(
      async () => {
        return await db.progress.upsert({
                  where: { userId_lessonId: { userId, lessonId } },
                  create: { userId, lessonId, completed },
                  update: { completed }
                })
      },
      async () => {
        const idx = globalMockProgress.findIndex(p => p.userId === userId && p.lessonId === lessonId)
            if (idx !== -1) {
              globalMockProgress[idx].completed = completed
              return globalMockProgress[idx]
            } else {
              const newProgress = { userId, lessonId, completed }
              globalMockProgress.push(newProgress)
              return newProgress
            }
      }
    )
  },

  // WALLET OPERATIONS
  async getWalletByUserId(userId: string) {
    return withMutationFallback(
      async () => {
        const w = await db.wallet.findUnique({
                  where: { userId },
                  include: { transactions: { orderBy: { createdAt: 'desc' } } }
                })
                if (w) return w
      },
      async () => {
        let wallet = globalMockWallets.find(w => w.userId === userId) || null
            if (!wallet) {
              wallet = {
                id: `wallet-${userId}`,
                userId,
                balance: 0.0,
                createdAt: new Date(),
                updatedAt: new Date()
              }
              globalMockWallets.push(wallet)
              }
            return {
              ...wallet,
              transactions: globalMockWalletTransactions.filter(t => t.walletId === wallet.id).sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime())
            }
      }
    )
  },

  async getAllWithdrawals() {
    return withFallback(
      async () => {
        const txs = await db.walletTransaction.findMany({
                  where: { type: 'WITHDRAWAL', description: { startsWith: 'Tarik ke' } },
                  include: { wallet: { include: { user: true } } },
                  orderBy: { createdAt: 'desc' }
                })
                return txs.map(t => ({
                  ...t,
                  user: t.wallet?.user
                }))
      },
      async () => {
        // Mock DB logic
            const withdrawals = globalMockWalletTransactions
              .filter(t => t.type === 'WITHDRAWAL' && t.description.startsWith('Tarik ke'))
              .sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime())
            
            return withdrawals.map(w => {
              const wallet = globalMockWallets.find(wl => wl.id === w.walletId)
              const user = wallet ? globalMockUsers.find(u => u.id === wallet.userId) : null
              return { ...w, user }
            })
      }
    )
  },


  async withdrawFunds(userId: string, amount: number, description: string = 'Penarikan dana dompet digital') {
    return withMutationFallback(
      async () => {
        return await db.$transaction(async (tx) => {
                  const wallet = await tx.wallet.findUnique({ where: { userId } })
                  if (!wallet || wallet.balance < amount) throw new Error('Saldo tidak mencukupi')
                  const updatedWallet = await tx.wallet.update({
                    where: { userId },
                    data: { balance: { decrement: amount } }
                  })
                  await tx.walletTransaction.create({
                    data: {
                      walletId: wallet.id,
                      amount,
                      type: 'WITHDRAWAL',
                      description
                    }
                  })
                  return updatedWallet
                })
      },
      async () => {
        const wallet = globalMockWallets.find(w => w.userId === userId)
            if (!wallet || wallet.balance < amount) throw new Error('Saldo tidak mencukupi')
            wallet.balance -= amount
            globalMockWalletTransactions.push({
              id: `tx-${Date.now()}`,
              walletId: wallet.id,
              amount,
              type: 'WITHDRAWAL' as const,
              description,
              createdAt: new Date(),
            })
            return wallet
      }
    )
  },

  async purchaseCourse(userId: string, courseId: string, amount: number, courseTitle: string) {
    const description = `Pembelian Kelas: ${courseTitle}`
    return withMutationFallback(
      async () => {
        return await db.$transaction(async (tx) => {
                  const wallet = await tx.wallet.findUnique({ where: { userId } })
                  if (!wallet || wallet.balance < amount) throw new Error('Saldo tidak mencukupi')
                  await tx.wallet.update({
                    where: { userId },
                    data: { balance: { decrement: amount } }
                  })
                  await tx.walletTransaction.create({
                    data: {
                      walletId: wallet.id,
                      amount,
                      type: 'WITHDRAWAL',
                      description
                    }
                  })
                  
                  const user = await tx.user.findUnique({ where: { id: userId } })
                  if (user) {
                    let configObj: any = {}
                    try {
                      configObj = JSON.parse(user.landingPageConfig || '{}')
                    } catch (_) {}
                    const purchased = Array.isArray(configObj.purchasedCourseIds) ? configObj.purchasedCourseIds : []
                    if (!purchased.includes(courseId)) {
                      purchased.push(courseId)
                    }
                    configObj.purchasedCourseIds = purchased
                    await tx.user.update({
                      where: { id: userId },
                      data: { landingPageConfig: JSON.stringify(configObj) }
                    })
                  }
                  return true
                })
      },
      async () => {
        const wallet = globalMockWallets.find(w => w.userId === userId)
            if (!wallet || wallet.balance < amount) throw new Error('Saldo tidak mencukupi')
            wallet.balance -= amount
            globalMockWalletTransactions.push({
              id: `tx-${Date.now()}`,
              walletId: wallet.id,
              amount,
              type: 'WITHDRAWAL' as const,
              description,
              createdAt: new Date(),
            })
        
            const user = globalMockUsers.find(u => u.id === userId)
            if (user) {
              let configObj: any = {}
              try {
                configObj = JSON.parse(user.landingPageConfig || '{}')
              } catch (_) {}
              const purchased = Array.isArray(configObj.purchasedCourseIds) ? configObj.purchasedCourseIds : []
              if (!purchased.includes(courseId)) {
                purchased.push(courseId)
              }
              configObj.purchasedCourseIds = purchased
              user.landingPageConfig = JSON.stringify(configObj)
            }
            return true
      }
    )
  },

  async depositFunds(userId: string, amount: number, method: string = 'Payment Gateway') {
    return withMutationFallback(
      async () => {
        return await db.$transaction(async (tx) => {
                  const wallet = await tx.wallet.findUnique({ where: { userId } })
                  if (!wallet) throw new Error('Wallet tidak ditemukan')
                  const updatedWallet = await tx.wallet.update({
                    where: { userId },
                    data: { balance: { increment: amount } }
                  })
                  await tx.walletTransaction.create({
                    data: {
                      walletId: wallet.id,
                      amount,
                      type: 'DEPOSIT',
                      description: `Isi saldo via ${method}`
                    }
                  })
                  return updatedWallet
                })
      },
      async () => {
        const wallet = globalMockWallets.find(w => w.userId === userId)
            if (!wallet) throw new Error('Wallet tidak ditemukan')
            wallet.balance += amount
            globalMockWalletTransactions.push({
              id: `tx-${Date.now()}`,
              walletId: wallet.id,
              amount,
              type: 'DEPOSIT' as const,
              description: `Isi saldo via ${method}`,
              createdAt: new Date(),
            })
            return wallet
      }
    )
  },

  async updateLandingPage(userId: string, template: string, config: string, latitude?: number, longitude?: number) {
    return withMutationFallback(
      async () => {
        return await db.user.update({
                  where: { id: userId },
                  data: {
                    landingPageTemplate: template,
                    landingPageConfig: config,
                    landingPageSetup: true,
                    ...(latitude !== undefined ? { latitude } : {}),
                    ...(longitude !== undefined ? { longitude } : {})
                  }
                })
      },
      async () => {
        const user = globalMockUsers.find(u => u.id === userId)
            if (user) {
              user.landingPageTemplate = template
              user.landingPageConfig = config
              user.landingPageSetup = true
              if (latitude !== undefined) user.latitude = latitude
              if (longitude !== undefined) user.longitude = longitude
              user.updatedAt = new Date()
              return user
            }
            return null
      }
    )
  },

  async addXp(userId: string, amount: number) {
    return withMutationFallback(
      async () => {
        const user = await db.user.findUnique({ where: { id: userId } })
                if (user) {
                  const newXp = user.xp + amount
                  const newLevel = Math.floor(newXp / 100) + 1
                  return await db.user.update({
                    where: { id: userId },
                    data: { xp: newXp, level: newLevel }
                  })
                }
      },
      async () => {
        const user = globalMockUsers.find(u => u.id === userId)
            if (user) {
              user.xp = (user.xp || 0) + amount
              user.level = Math.floor(user.xp / 100) + 1
              user.updatedAt = new Date()
              return user
            }
            return null
      }
    )
  },

  // ORDER / TRANSACTION OPERATIONS
  async createOrder(
    buyerId: string,
    items: Array<{ productId: string; quantity: number }>,
    affiliateId?: string,
    paymentMethod: string = 'MIDTRANS',
    shippingDetails?: {
      shippingFee?: number
      courier?: string
      shippingAddress?: string
      couponCode?: string
      discountAmount?: number
      bumpSales?: string
    }
  ) {
    const getProductPriceWithWholesale = (basePrice: number, qty: number) => {
          if (qty >= 10) return basePrice * 0.80
          if (qty >= 5) return basePrice * 0.90
          if (qty >= 3) return basePrice * 0.95
          return basePrice
        }
    
        const pickWaKey = (merchantWaKeys: string | null | undefined): string => {
          if (!merchantWaKeys) return 'TERAS_DEFAULT_GATEWAY_KEY'
          const keys = merchantWaKeys.split(',').map(k => k.trim()).filter(Boolean)
          if (keys.length === 0) return 'TERAS_DEFAULT_GATEWAY_KEY'
          const randomIndex = Math.floor(Math.random() * keys.length)
          return keys[randomIndex]
        }
    
        const orderId = `order-${Date.now()}`
    return withMutationFallback(
      async () => {
        return await db.$transaction(async (tx) => {
                  let subtotal = 0
                  const orderItemsData = []
                  const productsWithQuantities = []
        
                  for (const item of items) {
                    const product = await tx.product.findUnique({ where: { id: item.productId } })
                    if (!product || product.stock < item.quantity) throw new Error('Stok produk tidak mencukupi')
        
                    // Decrement Stock
                    await tx.product.update({
                      where: { id: item.productId },
                      data: { stock: { decrement: item.quantity } }
                    })
        
                    const finalPrice = getProductPriceWithWholesale(product.price, item.quantity)
                    const itemPrice = finalPrice * item.quantity
                    subtotal += itemPrice
        
                    orderItemsData.push({
                      productId: item.productId,
                      quantity: item.quantity,
                      price: finalPrice
                    })
        
                    productsWithQuantities.push({ product, quantity: item.quantity, itemPrice })
                  }
        
                  // Bump sales
                  let bumpSalesTotal = 0
                  if (shippingDetails?.bumpSales) {
                    const activeBumps = shippingDetails.bumpSales.split(',')
                    activeBumps.forEach(bump => {
                      if (bump === 'GARANSI_PREMIUM') bumpSalesTotal += 25000
                      if (bump === 'BOX_KAYU') bumpSalesTotal += 15000
                      if (bump === 'KERTAS_KADO') bumpSalesTotal += 5000
                    })
                  }
        
                  // Coupon discount
                  let computedDiscount = 0
                  if (shippingDetails?.couponCode) {
                    const code = shippingDetails.couponCode.toUpperCase()
                    if (code === 'DISKON10') {
                      computedDiscount = subtotal * 0.1
                    } else if (code === 'Saloka.id') {
                      computedDiscount = Math.min(20000, subtotal)
                    } else if (code === 'GRATISONGKIR') {
                      computedDiscount = shippingDetails.shippingFee || 0
                    }
                  }
        
                  const shippingFee = shippingDetails?.shippingFee || 0
                  const serviceFee = subtotal > 0 ? 1000 : 0 // Biaya Layanan Aplikasi
                  const paymentFee = paymentMethod === 'WALLET' ? 0 : (subtotal > 0 ? 1000 : 0) // Biaya Jasa Pembayaran
                  const adminFee = serviceFee + paymentFee
                  const finalTotal = Math.max(0, subtotal + shippingFee + bumpSalesTotal + adminFee - computedDiscount)
        
                  // Wallet payment deduction
                  if (paymentMethod === 'WALLET') {
                    const buyerWallet = await tx.wallet.findUnique({ where: { userId: buyerId } })
                    if (!buyerWallet || buyerWallet.balance < finalTotal) {
                      throw new Error('Saldo dompet tidak mencukupi')
                    }
                    await tx.wallet.update({
                      where: { userId: buyerId },
                      data: { balance: { decrement: finalTotal } }
                    })
                    await tx.walletTransaction.create({
                      data: {
                        walletId: buyerWallet.id,
                        amount: finalTotal,
                        type: 'WITHDRAWAL',
                        description: `Pembayaran Order ${orderId}`
                      }
                    })
                  }
        
                  // Points and Cashback
                  const pointsToAdd = finalTotal * 0.01
                  const cashbackToAdd = finalTotal * 0.05
        
                  // Update buyer points
                  await tx.user.update({
                    where: { id: buyerId },
                    data: { points: { increment: pointsToAdd } }
                  })
        
                  // Update buyer wallet for cashback
                  const buyerWallet = await tx.wallet.findUnique({ where: { userId: buyerId } })
                  if (buyerWallet) {
                    await tx.wallet.update({
                      where: { userId: buyerId },
                      data: { balance: { increment: cashbackToAdd } }
                    })
                    await tx.walletTransaction.create({
                      data: {
                        walletId: buyerWallet.id,
                        amount: cashbackToAdd,
                        type: 'DEPOSIT',
                        description: `Cashback 5% Pembelian Order ${orderId}`
                      }
                    })
                  }
        
                  // Create order
                  const order = await tx.order.create({
                    data: {
                      id: orderId,
                      buyerId,
                      totalAmount: finalTotal,
                      status: 'COMPLETED',
                      shippingFee,
                      courier: shippingDetails?.courier || null,
                      shippingAddress: shippingDetails?.shippingAddress || null,
                      couponCode: shippingDetails?.couponCode || null,
                      discountAmount: computedDiscount,
                      bumpSales: shippingDetails?.bumpSales || null,
                      adminFee: 2500,
                      items: {
                        create: orderItemsData
                      }
                    }
                  })
        
                  // Process affiliate commissions and JV splits
                  const buyerObj = await tx.user.findUnique({ where: { id: buyerId } })
                  const activeAffiliateId = affiliateId || buyerObj?.parentAffiliateId || null
        
                  for (const item of productsWithQuantities) {
                    const { product, itemPrice } = item
                    let merchantEarnings = itemPrice
        
                    // Check product category for digital product auto-activation
                    if (product.category === 'JASA' || product.category === 'KERJAAN') {
                      const targetAccess = product.category === 'KERJAAN' ? 'Diamond' : 'Platinum';
                      const targetLevel = product.category === 'KERJAAN' ? 'Distributor' : 'Agen';
                      const levelsMap: Record<string, number> = { Gold: 1, Platinum: 2, Diamond: 3 };
                      const currentRank = levelsMap[buyerObj?.membershipAccess || 'Gold'] || 1;
                      const targetRank = levelsMap[targetAccess] || 1;
                      if (currentRank < targetRank) {
                        await tx.user.update({
                          where: { id: buyerId },
                          data: {
                            membershipAccess: targetAccess,
                            membershipLevel: targetLevel
                          }
                        });
                      }
                    }
        
                    // 1. Handle Affiliate Commission Splits (60/10/10/20 — Revisi Pert Keempat)
                    // 60% affiliate, 10% komunitas induk merchant, 10% pengundang, 20% admin
                    if (product.isAffiliateEnabled) {
                      const hasPromoter = activeAffiliateId && activeAffiliateId !== product.merchantId;
                      const hasParent = buyerObj?.parentAffiliateId && buyerObj?.parentAffiliateId !== product.merchantId;
        
                      if (hasPromoter || hasParent) {
                        let totalComm = 0
                        if (product.affiliateCommissionType === 'PERCENT') {
                          totalComm = itemPrice * ((product.affiliateCommissionValue || 0) / 100)
                        } else {
                          totalComm = (product.affiliateCommissionValue || 0) * item.quantity
                        }
        
                        if (totalComm > 0) {
                          merchantEarnings -= totalComm
        
                        const promoterComm = totalComm * 0.60
                        const communityComm = totalComm * 0.10  // Komunitas induk merchant
                        const parentComm = totalComm * 0.10     // Pengundang
                        let adminComm = totalComm * 0.20
        
                        // Promoter (Tier 1) - 60%
                        let promoterPaid = false
                        if (activeAffiliateId && activeAffiliateId !== product.merchantId) {
                          const promoterWallet = await tx.wallet.findUnique({ where: { userId: activeAffiliateId } })
                          if (promoterWallet) {
                            await tx.wallet.update({
                              where: { userId: activeAffiliateId },
                              data: { balance: { increment: promoterComm } }
                            })
                            await tx.walletTransaction.create({
                              data: {
                                walletId: promoterWallet.id,
                                amount: promoterComm,
                                type: 'COMMISSION',
                                description: `Komisi Affiliate Tier 1 dari penjualan ${product.title}`
                              }
                            })
                            await tx.affiliateReferral.create({
                              data: {
                                affiliateId: activeAffiliateId,
                                buyerId,
                                amount: promoterComm,
                                status: 'PAID'
                              }
                            })
                            // Award XP (+30 XP)
                            const affUser = await tx.user.findUnique({ where: { id: activeAffiliateId } })
                            if (affUser) {
                              await tx.user.update({
                                where: { id: activeAffiliateId },
                                data: { xp: affUser.xp + 30, level: Math.floor((affUser.xp + 30) / 100) + 1 }
                              })
                            }
                            promoterPaid = true
                          }
                        }
                        if (!promoterPaid) adminComm += promoterComm
        
                        // Komunitas Induk Merchant - 10%
                        let communityPaid = false
                        const merchantObj = await tx.user.findUnique({ where: { id: product.merchantId } })
                        const indukCommunityId = (merchantObj as any)?.indukCommunityId
                        if (indukCommunityId) {
                          // Find ketua komunitas to pay the community share
                          const community = await tx.community.findUnique({ where: { id: indukCommunityId } })
                          if (community) {
                            const ketuaWallet = await tx.wallet.findUnique({ where: { userId: community.ketuaId } })
                            if (ketuaWallet) {
                              await tx.wallet.update({
                                where: { userId: community.ketuaId },
                                data: { balance: { increment: communityComm } }
                              })
                              await tx.walletTransaction.create({
                                data: {
                                  walletId: ketuaWallet.id,
                                  amount: communityComm,
                                  type: 'COMMISSION',
                                  description: `Komisi Komunitas Induk (10%) dari penjualan ${product.title}`
                                }
                              })
                              communityPaid = true
                            }
                          }
                        }
                        if (!communityPaid) adminComm += communityComm
        
                        // Pengundang / Parent - 10%
                        let parentPaid = false
                        const buyerParentId = buyerObj?.parentAffiliateId
                        if (buyerParentId && buyerParentId !== product.merchantId) {
                          const parentWallet = await tx.wallet.findUnique({ where: { userId: buyerParentId } })
                          if (parentWallet) {
                            await tx.wallet.update({
                              where: { userId: buyerParentId },
                              data: { balance: { increment: parentComm } }
                            })
                            await tx.walletTransaction.create({
                              data: {
                                walletId: parentWallet.id,
                                amount: parentComm,
                                type: 'COMMISSION',
                                description: `Komisi Pengundang (10%) dari penjualan ${product.title}`
                              }
                            })
                            await tx.affiliateReferral.create({
                              data: {
                                affiliateId: buyerParentId,
                                buyerId,
                                amount: parentComm,
                                status: 'PAID'
                              }
                            })
                            // Award XP (+15 XP)
                            const parentUser = await tx.user.findUnique({ where: { id: buyerParentId } })
                            if (parentUser) {
                              await tx.user.update({
                                where: { id: buyerParentId },
                                data: { xp: parentUser.xp + 15, level: Math.floor((parentUser.xp + 15) / 100) + 1 }
                              })
                            }
                            parentPaid = true
                          }
                        }
                        if (!parentPaid) adminComm += parentComm
        
                        // Admin/Perusahaan - 20% + Absorbed
                        const adminWallet = await tx.wallet.findUnique({ where: { userId: 'user-admin-1' } })
                        if (adminWallet) {
                          await tx.wallet.update({
                            where: { userId: 'user-admin-1' },
                            data: { balance: { increment: adminComm } }
                          })
                          await tx.walletTransaction.create({
                            data: {
                              walletId: adminWallet.id,
                              amount: adminComm,
                              type: 'COMMISSION',
                              description: `Komisi Admin (20%) dari penjualan ${product.title}`
                            }
                          })
                        }
                      }
                      } else {
                        // Orphan Sale: No affiliates. Just charge 1% admin tax instead.
                        const adminTax = itemPrice * 0.01;
                        merchantEarnings -= adminTax;
                        const adminWallet = await tx.wallet.findUnique({ where: { userId: 'user-admin-1' } })
                        if (adminWallet) {
                          await tx.wallet.update({
                            where: { userId: 'user-admin-1' },
                            data: { balance: { increment: adminTax } }
                          })
                          await tx.walletTransaction.create({
                            data: {
                              walletId: adminWallet.id,
                              amount: adminTax,
                              type: 'COMMISSION',
                              description: `Admin Tax 1% (Organik) dari penjualan ${product.title}`
                            }
                          })
                        }
                      }
                    }
        
                    // 2. Handle JV Partner splits
                    if (product.jvPartnerId && product.jvSharePercent && product.jvSharePercent > 0) {
                      const jvShare = itemPrice * (product.jvSharePercent / 100)
                      merchantEarnings -= jvShare
        
                      const jvWallet = await tx.wallet.findUnique({ where: { userId: product.jvPartnerId } })
                      if (jvWallet) {
                        await tx.wallet.update({
                          where: { userId: product.jvPartnerId },
                          data: { balance: { increment: jvShare } }
                        })
                        await tx.walletTransaction.create({
                          data: {
                            walletId: jvWallet.id,
                            amount: jvShare,
                            type: 'SALE',
                            description: `Bagi hasil JV Partner (${product.jvSharePercent}%) untuk produk ${product.title}`
                          }
                        })
                      }
                    }
        
                    // Update Merchant balance
                    const merchantWallet = await tx.wallet.findUnique({ where: { userId: product.merchantId } })
                    if (merchantWallet) {
                      await tx.wallet.update({
                        where: { userId: product.merchantId },
                        data: { balance: { increment: merchantEarnings } }
                      })
                      await tx.walletTransaction.create({
                        data: {
                          walletId: merchantWallet.id,
                          amount: merchantEarnings,
                          type: 'SALE',
                          description: `Penjualan produk: ${product.title} (x${item.quantity})`
                        }
                      })
                      // Add XP to merchant (+100 XP)
                      const merch = await tx.user.findUnique({ where: { id: product.merchantId } })
                      if (merch) {
                        await tx.user.update({
                          where: { id: product.merchantId },
                          data: { xp: merch.xp + 100, level: Math.floor((merch.xp + 100) / 100) + 1 }
                        })
                      }
                    }
        
                    // WhatsApp Notification simulation
                    const merchantUser = await tx.user.findUnique({ where: { id: product.merchantId } })
                    const waKey = pickWaKey(merchantUser?.waGatewayKeys || '')
                    globalMockWaLogs.push({
                      id: `wa-log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                      timestamp: new Date(),
                      merchantId: product.merchantId,
                      merchantName: merchantUser?.name || 'Merchant',
                      apiKeyUsed: waKey,
                      recipient: buyerObj?.name || 'Pembeli',
                      message: `[WA Gateway API Key: ${waKey}] Halo ${buyerObj?.name || 'Pelanggan'}, pesanan Anda dengan ID ${orderId} senilai Rp ${finalTotal.toLocaleString('id-ID')} telah berhasil diproses. Terima kasih!`,
                      status: 'SUCCESS'
                    })
                  }
        
                  // Create initial order tracking step
                  await tx.orderTracking.create({
                    data: {
                      orderId: order.id,
                      status: 'CONFIRMED',
                      note: 'Pembayaran telah diterima dan pesanan sedang disiapkan.'
                    }
                  });
        
                  // Send notification to buyer
                  await tx.notification.create({
                    data: {
                      userId: buyerId,
                      type: 'ORDER_PLACED',
                      title: 'Pesanan Berhasil Dibayar',
                      body: `Pesanan #${order.id} senilai Rp ${finalTotal.toLocaleString('id-ID')} sedang disiapkan oleh merchant.`,
                      linkUrl: `/orders/${order.id}`
                    }
                  });
        
                  // Send notification to merchant
                  const notifiedMerchants = new Set<string>();
                  for (const item of productsWithQuantities) {
                    const { product } = item;
                    if (!notifiedMerchants.has(product.merchantId)) {
                      notifiedMerchants.add(product.merchantId);
                      await tx.notification.create({
                        data: {
                          userId: product.merchantId,
                          type: 'ORDER_PLACED',
                          title: 'Ada Pesanan Baru!',
                          body: `Pesanan #${order.id} dari ${buyerObj?.name || 'Customer'} baru saja diterima.`,
                          linkUrl: `/merchant/dashboard?tab=orders`
                        }
                      });
                    }
                  }
        
                  return order
                })
      },
      async () => {
        // In-memory simulation
            let subtotal = 0
            const productsWithQuantities = []
        
            for (const item of items) {
              const product = globalMockProducts.find(p => p.id === item.productId)
              if (!product) throw new Error(`Produk tidak ditemukan. Hapus produk dari keranjang dan coba lagi.`)
              if (product.merchantId === buyerId && process.env.NODE_ENV === 'production') throw new Error(`Anda tidak dapat membeli produk Anda sendiri ("${product.title}"). Hapus produk tersebut dari keranjang.`)
              if (product.stock < item.quantity) throw new Error('Stok produk tidak mencukupi')
              product.stock -= item.quantity
        
              const finalPrice = getProductPriceWithWholesale(product.price, item.quantity)
              const itemPrice = finalPrice * item.quantity
              subtotal += itemPrice
        
              productsWithQuantities.push({ product, quantity: item.quantity, itemPrice })
            }
        
            // Bump sales
            let bumpSalesTotal = 0
            if (shippingDetails?.bumpSales) {
              const activeBumps = shippingDetails.bumpSales.split(',')
              activeBumps.forEach(bump => {
                if (bump === 'GARANSI_PREMIUM') bumpSalesTotal += 25000
                if (bump === 'BOX_KAYU') bumpSalesTotal += 15000
                if (bump === 'KERTAS_KADO') bumpSalesTotal += 5000
              })
            }
        
            // Coupon discount
            let computedDiscount = 0
            if (shippingDetails?.couponCode) {
              const code = shippingDetails.couponCode.toUpperCase()
              if (code === 'DISKON10') {
                computedDiscount = subtotal * 0.1
              } else if (code === 'Saloka.id') {
                computedDiscount = Math.min(20000, subtotal)
              } else if (code === 'GRATISONGKIR') {
                computedDiscount = shippingDetails.shippingFee || 0
              }
            }
        
            const shippingFee = shippingDetails?.shippingFee || 0
            const serviceFee = subtotal > 0 ? 1000 : 0 // Biaya Layanan Aplikasi
            const paymentFee = paymentMethod === 'WALLET' ? 0 : (subtotal > 0 ? 1000 : 0) // Biaya Jasa Pembayaran
            const adminFee = serviceFee + paymentFee
            const finalTotal = Math.max(0, subtotal + shippingFee + bumpSalesTotal + adminFee - computedDiscount)
        
            // Wallet deduction
            if (paymentMethod === 'WALLET') {
              const buyerWallet = globalMockWallets.find(w => w.userId === buyerId)
              if (!buyerWallet || buyerWallet.balance < finalTotal) {
                throw new Error('Saldo dompet tidak mencukupi')
              }
              buyerWallet.balance -= finalTotal
              globalMockWalletTransactions.push({
                id: `tx-${Date.now()}-wallet-pay`,
                walletId: buyerWallet.id,
                amount: finalTotal,
                type: 'WITHDRAWAL' as const,
                description: `Pembayaran Order ${orderId}`,
                createdAt: new Date()
              })
            }
        
            // Points and cashback
            const pointsToAdd = finalTotal * 0.01
            const cashbackToAdd = finalTotal * 0.05
        
            const buyerUser = globalMockUsers.find(u => u.id === buyerId)
            if (buyerUser) {
              buyerUser.points = (buyerUser.points || 0) + pointsToAdd
              buyerUser.xp = (buyerUser.xp || 0) + 30
              buyerUser.level = Math.floor(buyerUser.xp / 100) + 1
            }
        
            const buyerWalletObj = globalMockWallets.find(w => w.userId === buyerId)
            if (buyerWalletObj) {
              buyerWalletObj.balance += cashbackToAdd
              globalMockWalletTransactions.push({
                id: `tx-${Date.now()}-cashback`,
                walletId: buyerWalletObj.id,
                amount: cashbackToAdd,
                type: 'DEPOSIT' as const,
                description: `Cashback 5% Pembelian Order ${orderId}`,
                createdAt: new Date()
              })
            }
        
            // Credit merchants and affiliates
            const activeAffiliateId = affiliateId || buyerUser?.parentAffiliateId || null
        
            for (const item of productsWithQuantities) {
              const { product, itemPrice } = item
              let merchantEarnings = itemPrice
        
              // Check product category for digital product auto-activation
              if (product.category === 'JASA' || product.category === 'KERJAAN') {
                const targetAccess = product.category === 'KERJAAN' ? 'Diamond' : 'Platinum';
                const targetLevel = product.category === 'KERJAAN' ? 'Distributor' : 'Agen';
                const levelsMap: Record<string, number> = { Gold: 1, Platinum: 2, Diamond: 3 };
                const currentRank = levelsMap[buyerUser?.membershipAccess || 'Gold'] || 1;
                const targetRank = levelsMap[targetAccess] || 1;
                if (currentRank < targetRank && buyerUser) {
                  buyerUser.membershipAccess = targetAccess;
                  buyerUser.membershipLevel = targetLevel;
                }
              }
        
              // 1. Handle Affiliate Commission Splits (60/10/10/20 — Revisi Pert Keempat)
              // 60% affiliate, 10% komunitas induk merchant, 10% pengundang, 20% admin
              if (product.isAffiliateEnabled) {
                const hasPromoter = activeAffiliateId && activeAffiliateId !== product.merchantId;
                const hasParent = buyerUser?.parentAffiliateId && buyerUser?.parentAffiliateId !== product.merchantId;
        
                if (hasPromoter || hasParent) {
                  let totalComm = 0
                  if (product.affiliateCommissionType === 'PERCENT') {
                    totalComm = itemPrice * ((product.affiliateCommissionValue || 0) / 100)
                  } else {
                    totalComm = (product.affiliateCommissionValue || 0) * item.quantity
                  }
        
                  if (totalComm > 0) {
                    merchantEarnings -= totalComm
        
                  const promoterComm = totalComm * 0.60
                  const communityComm = totalComm * 0.10  // Komunitas induk merchant
                  const parentComm = totalComm * 0.10     // Pengundang
                  let adminComm = totalComm * 0.20
        
                  // Promoter (Tier 1) - 60%
                  let promoterPaid = false
                  if (activeAffiliateId && activeAffiliateId !== product.merchantId) {
                    const promoterWallet = globalMockWallets.find(w => w.userId === activeAffiliateId)
                    if (promoterWallet) {
                      promoterWallet.balance += promoterComm
                      globalMockWalletTransactions.push({
                        id: `tx-${Date.now()}-aff-1`,
                        walletId: promoterWallet.id,
                        amount: promoterComm,
                        type: 'COMMISSION' as const,
                        description: `Komisi Affiliate Tier 1 dari penjualan ${product.title}`,
                        createdAt: new Date()
                      })
                      globalMockReferrals.push({
                        id: `ref-${Date.now()}-1`,
                        affiliateId: activeAffiliateId,
                        buyerId,
                        amount: promoterComm,
                        status: 'PAID' as const,
                        createdAt: new Date(),
                        updatedAt: new Date()
                      })
                      const affUser = globalMockUsers.find(u => u.id === activeAffiliateId)
                      if (affUser) {
                        affUser.xp = (affUser.xp || 0) + 30
                        affUser.level = Math.floor(affUser.xp / 100) + 1
                      }
                      promoterPaid = true
                    }
                  }
                  if (!promoterPaid) adminComm += promoterComm
        
                  // Komunitas Induk Merchant - 10%
                  let communityPaid = false
                  const merchantUser2 = globalMockUsers.find(u => u.id === product.merchantId)
                  const indukId = (merchantUser2 as any)?.indukCommunityId
                  if (indukId) {
                    const community = (globalThis as any).__mockCommunities?.find((c: any) => c.id === indukId)
                    if (community) {
                      const ketuaWallet = globalMockWallets.find(w => w.userId === community.ketuaId)
                      if (ketuaWallet) {
                        ketuaWallet.balance += communityComm
                        globalMockWalletTransactions.push({
                          id: `tx-${Date.now()}-comm-induk`,
                          walletId: ketuaWallet.id,
                          amount: communityComm,
                          type: 'COMMISSION' as const,
                          description: `Komisi Komunitas Induk (10%) dari penjualan ${product.title}`,
                          createdAt: new Date()
                        })
                        communityPaid = true
                      }
                    }
                  }
                  if (!communityPaid) adminComm += communityComm
        
                  // Pengundang / Parent - 10%
                  let parentPaid = false
                  const buyerParentId = buyerUser?.parentAffiliateId
                  if (buyerParentId && buyerParentId !== product.merchantId) {
                    const parentWallet = globalMockWallets.find(w => w.userId === buyerParentId)
                    if (parentWallet) {
                      parentWallet.balance += parentComm
                      globalMockWalletTransactions.push({
                        id: `tx-${Date.now()}-aff-2`,
                        walletId: parentWallet.id,
                        amount: parentComm,
                        type: 'COMMISSION' as const,
                        description: `Komisi Pengundang (10%) dari penjualan ${product.title}`,
                        createdAt: new Date()
                      })
                      globalMockReferrals.push({
                        id: `ref-${Date.now()}-2`,
                        affiliateId: buyerParentId,
                        buyerId,
                        amount: parentComm,
                        status: 'PAID' as const,
                        createdAt: new Date(),
                        updatedAt: new Date()
                      })
                      const parentUser = globalMockUsers.find(u => u.id === buyerParentId)
                      if (parentUser) {
                        parentUser.xp = (parentUser.xp || 0) + 15
                        parentUser.level = Math.floor(parentUser.xp / 100) + 1
                      }
                      parentPaid = true
                    }
                  }
                  if (!parentPaid) adminComm += parentComm
        
                  // Admin/Perusahaan - 20%
                  const adminWallet = globalMockWallets.find(w => w.userId === 'user-admin-1')
                  if (adminWallet) {
                    adminWallet.balance += adminComm
                    globalMockWalletTransactions.push({
                      id: `tx-${Date.now()}-aff-admin`,
                      walletId: adminWallet.id,
                      amount: adminComm,
                      type: 'COMMISSION' as const,
                      description: `Komisi Admin (20%) dari penjualan ${product.title}`,
                      createdAt: new Date()
                    })
                  }
                }
                } else {
                  // Orphan Sale: No affiliates. Just charge 1% admin tax.
                  const adminTax = itemPrice * 0.01;
                  merchantEarnings -= adminTax;
                  const adminWallet = globalMockWallets.find(w => w.userId === 'user-admin-1')
                  if (adminWallet) {
                    adminWallet.balance += adminTax
                    globalMockWalletTransactions.push({
                      id: `tx-${Date.now()}-aff-admin-tax`,
                      walletId: adminWallet.id,
                      amount: adminTax,
                      type: 'COMMISSION' as const,
                      description: `Admin Tax 1% (Organik) dari penjualan ${product.title}`,
                      createdAt: new Date()
                    })
                  }
                }
              }
        
              // JV split
              if (product.jvPartnerId && product.jvSharePercent && product.jvSharePercent > 0) {
                const jvShare = itemPrice * (product.jvSharePercent / 100)
                merchantEarnings -= jvShare
        
                const jvWallet = globalMockWallets.find(w => w.userId === product.jvPartnerId)
                if (jvWallet) {
                  jvWallet.balance += jvShare
                  globalMockWalletTransactions.push({
                    id: `tx-${Date.now()}-jv`,
                    walletId: jvWallet.id,
                    amount: jvShare,
                    type: 'SALE' as const,
                    description: `Bagi hasil JV Partner (${product.jvSharePercent}%) untuk produk ${product.title}`,
                    createdAt: new Date()
                  })
                }
              }
        
              // Credit merchant
              const merchantWallet = globalMockWallets.find(w => w.userId === product.merchantId)
              if (merchantWallet) {
                merchantWallet.balance += merchantEarnings
                globalMockWalletTransactions.push({
                  id: `tx-${Date.now()}-merch`,
                  walletId: merchantWallet.id,
                  amount: merchantEarnings,
                  type: 'SALE' as const,
                  description: `Penjualan produk: ${product.title} (x${item.quantity})`,
                  createdAt: new Date()
                })
                const merch = globalMockUsers.find(u => u.id === product.merchantId)
                if (merch) {
                  merch.xp = (merch.xp || 0) + 100
                  merch.level = Math.floor(merch.xp / 100) + 1
                }
              }
        
              // WA Notification simulation
              const merchantUserObj = globalMockUsers.find(u => u.id === product.merchantId)
              const waKey = pickWaKey(merchantUserObj?.waGatewayKeys || '')
              globalMockWaLogs.push({
                id: `wa-log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                timestamp: new Date(),
                merchantId: product.merchantId,
                merchantName: merchantUserObj?.name || 'Merchant',
                apiKeyUsed: waKey,
                recipient: buyerUser?.name || 'Pembeli',
                message: `[WA Gateway API Key: ${waKey}] Halo ${buyerUser?.name || 'Pelanggan'}, pesanan Anda dengan ID ${orderId} senilai Rp ${finalTotal.toLocaleString('id-ID')} telah berhasil diproses. Terima kasih!`,
                status: 'SUCCESS'
              })
            }
        
            const orderObj = {
              id: orderId,
              buyerId,
              totalAmount: finalTotal,
              adminFee: 2500,
              status: 'COMPLETED' as const,
              createdAt: new Date(),
              updatedAt: new Date(),
              items: productsWithQuantities.map(item => ({
                productId: item.product.id,
                quantity: item.quantity,
                price: item.product.price,
                productTitle: item.product.title
              }))
            }
            // Create initial order tracking step
            globalMockOrderTrackings.push({
              id: `ot-${Date.now()}`,
              orderId,
              status: 'CONFIRMED',
              note: 'Pembayaran telah diterima dan pesanan sedang disiapkan.',
              createdAt: new Date()
            });
        
            // Send notification to buyer
            globalMockNotifications.push({
              id: `notif-${Date.now()}-buyer`,
              userId: buyerId,
              type: 'ORDER_PLACED',
              title: 'Pesanan Berhasil Dibayar',
              body: `Pesanan #${orderId} senilai Rp ${finalTotal.toLocaleString('id-ID')} sedang disiapkan oleh merchant.`,
              isRead: false,
              linkUrl: `/orders/${orderId}`,
              createdAt: new Date()
            });
        
            // Send notification to merchants
            const notifiedMerchants = new Set<string>();
            for (const item of productsWithQuantities) {
              const { product } = item;
              if (!notifiedMerchants.has(product.merchantId)) {
                notifiedMerchants.add(product.merchantId);
                globalMockNotifications.push({
                  id: `notif-${Date.now()}-merch-${product.merchantId}`,
                  userId: product.merchantId,
                  type: 'ORDER_PLACED',
                  title: 'Ada Pesanan Baru!',
                  body: `Pesanan #${orderId} dari ${buyerUser?.name || 'Customer'} baru saja diterima.`,
                  isRead: false,
                  linkUrl: `/merchant/dashboard?tab=orders`,
                  createdAt: new Date()
                });
              }
            }
        
            globalMockOrders.push(orderObj)
            return orderObj
      }
    )
  },

  // COMMUNITY / FORUM OPERATIONS
  async getPosts(groupId?: string) {
    return withFallback(
      async () => {
        const filter = groupId && groupId !== 'all' ? { groupId } : {}
                const list = await db.post.findMany({
                  where: filter,
                  include: {
                    author: true,
                    likes: true,
                    _count: { select: { comments: true } }
                  },
                  orderBy: { createdAt: 'desc' }
                })
                return list.map(p => ({
                  ...p,
                  likes: p.likes.map(l => l.userId),
                  _count: {
                    comments: p._count.comments
                  }
                }))
      },
      async () => {
        return globalMockPosts
              .filter(p => {
                if (groupId && groupId !== 'all') {
                  // If mock post has an explicit groupId or we map it based on prefix/content
                  const postGroupId = p.groupId || (
                    p.id.includes('kopi') ? 'group-kopi' : 
                    p.id.includes('fashion') ? 'group-fashion' : 
                    'group-umum'
                  )
                  return postGroupId === groupId
                }
                return true
              })
              .map(p => {
                let imageUrl = p.imageUrl || null
                let videoUrl = p.videoUrl || null
                let category = p.category || 'Diskusi'
                
                // Inject media into default posts
                if (p.id === 'post-herbal-tips') {
                  category = 'Tips Bisnis'
                  imageUrl = 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&q=80'
                } else if (p.id === 'post-furni-branding') {
                  category = 'Tips Bisnis'
                  imageUrl = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80'
                } else if (p.id === 'post-agro-urban') {
                  category = 'Tips Bisnis'
                  imageUrl = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&q=80'
                } else if (p.id === 'post-silver-ekspor') {
                  category = 'Diskusi'
                  imageUrl = 'https://images.unsplash.com/photo-1573408301185-9519f94816f0?w=600&q=80'
                } else if (p.id === 'post-komunitas-kopi-1') {
                  category = 'Diskusi'
                  videoUrl = 'https://www.w3schools.com/html/mov_bbb.mp4'
                }
                
                return {
                  ...p,
                  category,
                  imageUrl,
                  videoUrl,
                  likes: p.likes || [],
                  author: globalMockUsers.find(u => u.id === p.authorId) || null,
                  _count: {
                    comments: globalMockComments.filter(c => c.postId === p.id).length
                  }
                }
              })
              .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      }
    )
  },

  async getPostById(id: string) {
    return withFallback(
      async () => {
        const postObj = await db.post.findUnique({
                  where: { id },
                  include: {
                    author: true,
                    likes: true,
                    comments: {
                      include: { author: true },
                      orderBy: { createdAt: 'asc' }
                    }
                  }
                })
                if (!postObj) return null
                return {
                  ...postObj,
                  likes: postObj.likes.map(l => l.userId),
                  comments: postObj.comments
                }
      },
      async () => {
        const p = globalMockPosts.find(post => post.id === id) || null
            if (!p) return null
            
            let imageUrl = p.imageUrl || null
            let videoUrl = p.videoUrl || null
            let category = p.category || 'Diskusi'
            
            // Inject media into default posts
            if (p.id === 'post-herbal-tips') {
              category = 'Tips Bisnis'
              imageUrl = 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&q=80'
            } else if (p.id === 'post-furni-branding') {
              category = 'Tips Bisnis'
              imageUrl = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80'
            } else if (p.id === 'post-agro-urban') {
              category = 'Tips Bisnis'
              imageUrl = 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&q=80'
            } else if (p.id === 'post-silver-ekspor') {
              category = 'Diskusi'
              imageUrl = 'https://images.unsplash.com/photo-1573408301185-9519f94816f0?w=600&q=80'
            } else if (p.id === 'post-komunitas-kopi-1') {
              category = 'Diskusi'
              videoUrl = 'https://www.w3schools.com/html/mov_bbb.mp4'
            }
            
            return {
              ...p,
              category,
              imageUrl,
              videoUrl,
              likes: p.likes || [],
              author: globalMockUsers.find(u => u.id === p.authorId) || null,
              comments: globalMockComments.filter(c => c.postId === p.id).map(c => ({
                ...c,
                author: globalMockUsers.find(u => u.id === c.authorId) || null
              })).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
            }
      }
    )
  },

  async createPost(userId: string, title: string, content: string, category?: string, imageUrl?: string, videoUrl?: string, groupId?: string) {
    return withMutationFallback(
      async () => {
        return await db.post.create({
                  data: {
                    authorId: userId,
                    title,
                    content,
                    category: category || 'Diskusi',
                    imageUrl: imageUrl || null,
                    videoUrl: videoUrl || null,
                    groupId: groupId || null
                  }
                })
      },
      async () => {
        const newPost = {
              id: `post-${Date.now()}`,
              title,
              content,
              category: category || 'Diskusi',
              imageUrl: imageUrl || null,
              videoUrl: videoUrl || null,
              groupId: groupId || null,
              likes: [],
              authorId: userId,
              createdAt: new Date(),
              updatedAt: new Date(),
            }
            globalMockPosts.push(newPost)
            return newPost
      }
    )
  },

  async createComment(userId: string, postId: string, content: string) {
    return withMutationFallback(
      async () => {
        return await db.comment.create({
                  data: {
                    authorId: userId,
                    postId,
                    content
                  }
                })
      },
      async () => {
        const newComment = {
              id: `comment-${Date.now()}`,
              postId,
              content,
              authorId: userId,
              createdAt: new Date(),
              updatedAt: new Date(),
            }
            globalMockComments.push(newComment)
            return newComment
      }
    )
  },

  async toggleLikePost(userId: string, postId: string) {
    return withMutationFallback(
      async () => {
        const existing = await db.postLike.findUnique({
                  where: {
                    postId_userId: { postId, userId }
                  }
                })
                if (existing) {
                  await db.postLike.delete({
                    where: {
                      id: existing.id
                    }
                  })
                  return { liked: false }
                } else {
                  await db.postLike.create({
                    data: {
                      postId,
                      userId
                    }
                  })
                  return { liked: true }
                }
      },
      async () => {
        const post = globalMockPosts.find(p => p.id === postId)
            if (!post) throw new Error('Post not found')
            
            if (!post.likes) {
              post.likes = []
            }
            
            const idx = post.likes.indexOf(userId)
            let liked = false
            if (idx !== -1) {
              post.likes.splice(idx, 1)
              liked = false
            } else {
              post.likes.push(userId)
              liked = true
            }
            return { liked }
      }
    )
  },

  async getCommunityMembers(groupId?: string) {
    return withFallback(
      async () => {
        if (groupId && groupId !== 'all') {
                  const membersList = await db.groupMember.findMany({
                    where: { groupId },
                    include: { user: true },
                    orderBy: { user: { level: 'desc' } }
                  })
                  return membersList.map(gm => gm.user)
                }
                return await db.user.findMany({
                  select: {
                    id: true,
                    name: true,
                    role: true,
                    level: true,
                    xp: true,
                    membershipLevel: true,
                    membershipAccess: true,
                    createdAt: true
                  },
                  orderBy: { level: 'desc' }
                })
      },
      async () => {
        if (groupId && groupId !== 'all') {
              const activeMembers = globalMockGroupMembers
                .filter(gm => gm.groupId === groupId)
                .map(gm => globalMockUsers.find(u => u.id === gm.userId))
                .filter(Boolean)
              return activeMembers.sort((a, b) => b.level - a.level)
            }
        
            return globalMockUsers.map(u => ({
              id: u.id,
              name: u.name,
              role: u.role,
              level: u.level,
              xp: u.xp,
              membershipLevel: u.membershipLevel,
              membershipAccess: u.membershipAccess,
              createdAt: u.createdAt
            })).sort((a, b) => b.level - a.level)
      }
    )
  },

  // NEW COMMUNITY GROUP OPERATING FUNCTIONS
  async getGroups() {
    return withFallback(
      () => db.communityGroup.findMany({
          include: {
            admin: true,
            _count: {
              select: { members: true, posts: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),
      () => globalMockGroups.map(g => {
      const adminUser = globalMockUsers.find(u => u.id === g.adminId) || null
      const membersCount = globalMockGroupMembers.filter(gm => gm.groupId === g.id).length
      const postsCount = globalMockPosts.filter(p => {
        const postGroupId = p.groupId || (p.id.includes('kopi') ? 'group-kopi' : p.id.includes('fashion') ? 'group-fashion' : 'group-umum')
        return postGroupId === g.id
      }).length

      return {
        ...g,
        admin: adminUser,
        _count: {
          members: membersCount,
          posts: postsCount
        }
      }
    })
    )
  },

  async getGroupById(id: string) {
    return withFallback(
      async () => {
        return await db.communityGroup.findUnique({
                  where: { id },
                  include: {
                    admin: true,
                    _count: {
                      select: { members: true, posts: true }
                    }
                  }
                })
      },
      async () => {
        const g = globalMockGroups.find(group => group.id === id) || null
            if (!g) return null
        
            const adminUser = globalMockUsers.find(u => u.id === g.adminId) || null
            const membersCount = globalMockGroupMembers.filter(gm => gm.groupId === g.id).length
            const postsCount = globalMockPosts.filter(p => {
              const postGroupId = p.groupId || (p.id.includes('kopi') ? 'group-kopi' : p.id.includes('fashion') ? 'group-fashion' : 'group-umum')
              return postGroupId === g.id
            }).length
        
            return {
              ...g,
              admin: adminUser,
              _count: {
                members: membersCount,
                posts: postsCount
              }
            }
      }
    )
  },

  async createGroup(adminId: string, name: string, description: string, avatarUrl?: string, coverUrl?: string) {
    return withMutationFallback(
      async () => {
        const group = await db.communityGroup.create({
                  data: {
                    adminId,
                    name,
                    description,
                    avatarUrl: avatarUrl || null,
                    coverUrl: coverUrl || null
                  }
                })
                // Auto-join the creator as a member
                await db.groupMember.create({
                  data: {
                    groupId: group.id,
                    userId: adminId
                  }
                })
                return group
      },
      async () => {
        const newGroup = {
              id: `group-${Date.now()}`,
              name,
              description,
              avatarUrl: avatarUrl || null,
              coverUrl: coverUrl || null,
              isSuspended: false,
              adminId,
              createdAt: new Date(),
              updatedAt: new Date()
            }
            
            globalMockGroups.push(newGroup)
            
            // Auto-join membership in mock state
            globalMockGroupMembers.push({
              id: `gm-${Date.now()}`,
              groupId: newGroup.id,
              userId: adminId,
              createdAt: new Date()
            })
            
            return newGroup
      }
    )
  },

  async toggleJoinGroup(userId: string, groupId: string) {
    return withMutationFallback(
      async () => {
        const existing = await db.groupMember.findUnique({
                  where: {
                    groupId_userId: { groupId, userId }
                  }
                })
                if (existing) {
                  await db.groupMember.delete({
                    where: {
                      id: existing.id
                    }
                  })
                  return { joined: false }
                } else {
                  await db.groupMember.create({
                    data: {
                      groupId,
                      userId
                    }
                  })
                  return { joined: true }
                }
      },
      async () => {
        const existingIdx = globalMockGroupMembers.findIndex(gm => gm.groupId === groupId && gm.userId === userId)
            let joined = false
            if (existingIdx !== -1) {
              globalMockGroupMembers.splice(existingIdx, 1)
              joined = false
            } else {
              globalMockGroupMembers.push({
                id: `gm-${Date.now()}`,
                groupId,
                userId,
                createdAt: new Date()
              })
              joined = true
            }
            return { joined }
      }
    )
  },

  async isGroupMember(userId: string, groupId: string) {
    return withFallback(
      async () => {
        const existing = await db.groupMember.findUnique({
                  where: {
                    groupId_userId: { groupId, userId }
                  }
                })
                return !!existing
      },
      async () => {
        return globalMockGroupMembers.some(gm => gm.groupId === groupId && gm.userId === userId)
      }
    )
  },

  async toggleSuspendGroup(groupId: string) {
    return withMutationFallback(
      async () => {
        const group = await db.communityGroup.findUnique({ where: { id: groupId } })
                if (!group) throw new Error('Group not found')
                const updated = await db.communityGroup.update({
                  where: { id: groupId },
                  data: { isSuspended: !group.isSuspended }
                })
                return updated
      },
      async () => {
        const group = globalMockGroups.find(g => g.id === groupId)
            if (!group) throw new Error('Group not found')
            group.isSuspended = !group.isSuspended
            return group
      }
    )
  },

  async deletePost(postId: string) {
    return withMutationFallback(
      async () => {
        await db.post.delete({ where: { id: postId } })
                return { success: true }
      },
      async () => {
        const postIdx = globalMockPosts.findIndex(p => p.id === postId)
            if (postIdx === -1) return { error: 'Post not found' }
            globalMockPosts.splice(postIdx, 1)
            
            // Cascading comments deletion
            globalMockComments = globalMockComments.filter(c => c.postId !== postId)
            return { success: true }
      }
    )
  },

  async deleteComment(commentId: string) {
    return withMutationFallback(
      async () => {
        await db.comment.delete({ where: { id: commentId } })
                return { success: true }
      },
      async () => {
        const commentIdx = globalMockComments.findIndex(c => c.id === commentId)
            if (commentIdx === -1) return { error: 'Comment not found' }
            globalMockComments.splice(commentIdx, 1)
            return { success: true }
      }
    )
  },



  async getAffiliateCommission(affiliateId: string) {
    const stats = await this.getAffiliateStats(affiliateId)
    return stats ? stats.totalEarnings : 0
  },

  async getPaymentMethods(activeOnly: boolean = false) {
    syncMockDb()
    if (activeOnly) {
      return globalMockPaymentMethods.filter(p => p.isActive)
    }
    return globalMockPaymentMethods
  },

  async createPaymentMethod(data: {
    type: string
    providerName: string
    accountName?: string
    accountNumber?: string
    qrImageUrl?: string
    qrRawString?: string
    isActive?: boolean
  }) {
    syncMockDb()
    const newMethod = {
      id: `pm-${Date.now()}`,
      type: data.type,
      providerName: data.providerName,
      accountName: data.accountName || null,
      accountNumber: data.accountNumber || null,
      qrImageUrl: data.qrImageUrl || null,
      qrRawString: data.qrRawString || null,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: new Date().toISOString()
    }
    globalMockPaymentMethods.unshift(newMethod)
    saveMockDb()
    return newMethod
  },

  async updatePaymentMethod(id: string, data: Partial<{
    type: string
    providerName: string
    accountName: string
    accountNumber: string
    qrImageUrl: string
    qrRawString: string
    isActive: boolean
  }>) {
    syncMockDb()
    const idx = globalMockPaymentMethods.findIndex(p => p.id === id)
    if (idx !== -1) {
      globalMockPaymentMethods[idx] = { ...globalMockPaymentMethods[idx], ...data }
      saveMockDb()
      return globalMockPaymentMethods[idx]
    }
    return null
  },

  async deletePaymentMethod(id: string) {
    syncMockDb()
    const idx = globalMockPaymentMethods.findIndex(p => p.id === id)
    if (idx !== -1) {
      const deleted = globalMockPaymentMethods.splice(idx, 1)[0]
      saveMockDb()
      return deleted
    }
    return null
  },

  // AFFILIATE PORTAL DATA
  async getAffiliateStats(affiliateId: string) {
    syncMockDb()
    let referralsList: any[] = [];
    let walletTransactions: any[] = [];
    
    if (await isDbConnected()) {
      try {
        referralsList = await db.affiliateReferral.findMany({
          where: { affiliateId },
          include: { buyer: true },
          orderBy: { createdAt: 'desc' }
        });
        const wallet = await db.wallet.findUnique({
          where: { userId: affiliateId },
          include: { transactions: true }
        });
        walletTransactions = wallet?.transactions || [];
      } catch (_) {}
    } else {
      referralsList = globalMockReferrals.filter(r => r.affiliateId === affiliateId).map(r => ({
        ...r,
        buyer: globalMockUsers.find(u => u.id === r.buyerId) || null
      })).sort((a,b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      const wallet = globalMockWallets.find(w => w.userId === affiliateId);
      if (wallet) {
        walletTransactions = globalMockWalletTransactions.filter(t => t.walletId === wallet.id);
      }
    }

    const totalEarnings = referralsList.reduce((sum, r) => sum + r.amount, 0);

    // Calculate commission breakdown by category (Revisi Pert Keempat: 60/10/10/20)
    let affiliateEarnings = 0;   // 60% - Komisi Affiliate
    let communityEarnings = 0;   // 10% - Komunitas Induk
    let inviterEarnings = 0;     // 10% - Pengundang

    walletTransactions.forEach(tx => {
      if (tx.type === 'COMMISSION') {
        const desc = tx.description.toLowerCase();
        if (desc.includes('tier 1') || desc.includes('affiliate') || desc.includes('promoter')) {
          affiliateEarnings += tx.amount;
        } else if (desc.includes('komunitas induk')) {
          communityEarnings += tx.amount;
        } else if (desc.includes('tier 2') || desc.includes('pengundang') || desc.includes('inviter')) {
          inviterEarnings += tx.amount;
        } else {
          // fallback
          affiliateEarnings += tx.amount;
        }
      }
    });

    // Custom links and click counts
    const userLinks = globalMockCustomLinks.filter(l => l.userId === affiliateId);
    const totalClicks = userLinks.reduce((sum, l) => sum + l.clicks, 0);

    // Traffic sources breakdown
    const sourceBreakdown: Record<string, number> = {};
    userLinks.forEach(link => {
      const logs = globalMockClickLogs.filter(log => log.linkId === link.id);
      logs.forEach(log => {
        const src = log.source || 'direct';
        sourceBreakdown[src] = (sourceBreakdown[src] || 0) + 1;
      });
    });

    return {
      referrals: referralsList,
      totalEarnings,
      commissionByTier: {
        affiliate: affiliateEarnings,
        komunitas: communityEarnings,
        pengundang: inviterEarnings
      },
      clicksCount: totalClicks,
      customLinks: userLinks,
      trafficSources: sourceBreakdown
    };
  },

  async createCustomAffiliateLink(userId: string, productId: string, customSlug: string, source: string) {
    syncMockDb()
    // Check if slug already exists
    const exists = globalMockCustomLinks.some(l => l.customSlug === customSlug);
    if (exists) throw new Error('Slug kustom sudah digunakan');

    const newLink = {
      id: `link-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      userId,
      productId,
      customSlug,
      source: source || 'direct',
      clicks: 0,
      createdAt: new Date()
    };
    globalMockCustomLinks.push(newLink);
    saveMockDb()
    return newLink;
  },

  async getCustomAffiliateLinks(userId: string) {
    syncMockDb()
    return globalMockCustomLinks.filter(l => l.userId === userId);
  },

  async trackAffiliateClick(slug: string, source: string = 'direct') {
    syncMockDb()
    const link = globalMockCustomLinks.find(l => l.customSlug === slug);
    if (link) {
      link.clicks = (link.clicks || 0) + 1;
      globalMockClickLogs.push({
        id: `click-${Date.now()}`,
        linkId: link.id,
        source: source || 'direct',
        createdAt: new Date()
      });
      saveMockDb()
      return link;
    }
    return null;
  },

  async upgradeMembershipAccess(userId: string, targetAccess: 'Platinum' | 'Diamond') {
    const priceMap = {
          Platinum: 250000,
          Diamond: 500000
        };
        const targetLevelMap = {
          Platinum: 'Agen',
          Diamond: 'Distributor'
        };
        
        const price = priceMap[targetAccess];
        const newLevel = targetLevelMap[targetAccess];
    return withFallback(
      async () => {
        await db.$transaction(async (tx) => {
                  const wallet = await tx.wallet.findUnique({ where: { userId } });
                  if (!wallet || wallet.balance < price) throw new Error('Saldo dompet tidak mencukupi untuk upgrade');
        
                  await tx.wallet.update({
                    where: { userId },
                    data: { balance: { decrement: price } }
                  });
        
                  await tx.walletTransaction.create({
                    data: {
                      walletId: wallet.id,
                      amount: price,
                      type: 'WITHDRAWAL',
                      description: `Upgrade Keanggotaan Akses ${targetAccess} & Level ${newLevel}`
                    }
                  });
        
                  await tx.user.update({
                    where: { id: userId },
                    data: {
                      membershipAccess: targetAccess,
                      membershipLevel: newLevel,
                      // Give bonus XP on upgrade
                      xp: { increment: 100 }
                    }
                  });
                });
        
                // Re-fetch user
                return await db.user.findUnique({ where: { id: userId } });
      },
      async () => {
        // Mock upgrade
            const wallet = globalMockWallets.find(w => w.userId === userId);
            if (!wallet || wallet.balance < price) throw new Error('Saldo dompet tidak mencukupi untuk upgrade');
        
            wallet.balance -= price;
            globalMockWalletTransactions.push({
              id: `tx-${Date.now()}-upgrade`,
              walletId: wallet.id,
              amount: price,
              type: 'WITHDRAWAL' as const,
              description: `Upgrade Keanggotaan Akses ${targetAccess} & Level ${newLevel}`,
              createdAt: new Date()
            });
        
            const user = globalMockUsers.find(u => u.id === userId);
            if (user) {
              user.membershipAccess = targetAccess;
              user.membershipLevel = newLevel;
              user.xp = (user.xp || 0) + 100;
              user.level = Math.floor(user.xp / 100) + 1;
              user.updatedAt = new Date();
              return user;
            }
            throw new Error('User tidak ditemukan');
      }
    )
  },

  async getAffiliateLeaderboard() {
    const earningsMap: Record<string, number> = {};

    // Group referrals by affiliateId
    let referralsList: any[] = [];
    if (await isDbConnected()) {
      try {
        referralsList = await db.affiliateReferral.findMany();
      } catch (_) {}
    } else {
      referralsList = globalMockReferrals;
    }

    referralsList.forEach(r => {
      earningsMap[r.affiliateId] = (earningsMap[r.affiliateId] || 0) + r.amount;
    });

    // Populate all active users that have role AFFILIATE or have earnings
    let usersList: any[] = [];
    if (await isDbConnected()) {
      try {
        usersList = await db.user.findMany();
      } catch (_) {}
    } else {
      usersList = globalMockUsers;
    }

    const leaderboard = usersList
      .filter(u => u.role === 'AFFILIATE' || earningsMap[u.id] > 0)
      .map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        totalEarnings: earningsMap[u.id] || 0,
        membershipLevel: u.membershipLevel || 'Reseller',
        level: u.level || 1
      }))
      .sort((a, b) => b.totalEarnings - a.totalEarnings)
      .slice(0, 10);

    return leaderboard;
  },

  async getAffiliateDownline(userId: string) {
    const buildTree = async (id: string, depth: number): Promise<any[]> => {
      if (depth > 3) return [];
      let children: any[] = [];
      if (await isDbConnected()) {
        try {
          children = await db.user.findMany({ where: { parentAffiliateId: id } });
        } catch (_) {}
      } else {
        children = globalMockUsers.filter(u => u.parentAffiliateId === id);
      }
      
      const treeNodes = [];
      for (const child of children) {
        const subTree = await buildTree(child.id, depth + 1);
        treeNodes.push({
          id: child.id,
          name: child.name,
          email: child.email,
          role: child.role,
          membershipLevel: child.membershipLevel || 'Reseller',
          membershipAccess: child.membershipAccess || 'Gold',
          level: child.level || 1,
          children: subTree
        });
      }
      return treeNodes;
    };
    
    return await buildTree(userId, 1);
  },

  async generateDummyAffiliates(count: number = 10) {
    let parentId = 'user-affiliate-1'
    let dbConnected = false
    try {
      dbConnected = await isDbConnected()
    } catch (_) {}
    
    if (dbConnected) {
      const parent = await db.user.findFirst({ where: { role: 'AFFILIATE' } }) || await db.user.findFirst()
      if (parent) parentId = parent.id
      
      const newUsers = []
      const newOrders = []
      
      for (let i = 0; i < count; i++) {
        const id = `dummy-aff-${Date.now()}-${i}`
        const createdAt = new Date(Date.now() - Math.random() * 10000000000)
        newUsers.push({
          id,
          name: `Dummy User ${i + 1}`,
          email: `dummy${i + 1}@saloka.id`,
          passwordHash: 'hashedpassword',
          role: 'CUSTOMER' as any,
          level: 1,
          xp: 0,
          parentAffiliateId: parentId,
          createdAt
        })
      }
      
      try {
        await db.user.createMany({ data: newUsers, skipDuplicates: true })
        
        // Ensure wallet exists for parent if needed later
        let parentWallet = await db.wallet.findUnique({ where: { userId: parentId } })
        if (!parentWallet) {
          parentWallet = await db.wallet.create({ data: { userId: parentId, balance: 0 } })
        }
        
        for (const u of newUsers) {
          const orderId = `dummy-ord-${Date.now()}-${Math.random().toString(36).substring(7)}`
          
          // Get a random product to assign to order
          const product = await db.product.findFirst() || null
          
          await db.order.create({
            data: {
              id: orderId,
              buyerId: u.id,
              totalAmount: 150000,
              status: 'COMPLETED',
              createdAt: u.createdAt,
              updatedAt: u.createdAt,
              items: product ? {
                create: [
                  { productId: product.id, quantity: 1, price: 150000 }
                ]
              } : undefined
            }
          })
          
          // Use AffiliateReferral model to track commissions
          await db.affiliateReferral.create({
            data: {
              affiliateId: parentId,
              buyerId: u.id,
              amount: 15000,
              status: 'PAID',
              createdAt: u.createdAt,
              updatedAt: u.createdAt
            }
          })
          
          // Also add to wallet transaction
          await db.walletTransaction.create({
            data: {
              walletId: parentWallet.id,
              amount: 15000,
              type: 'COMMISSION',
              description: `Komisi Referral dari ${u.name}`,
              createdAt: u.createdAt
            }
          })
        }
      } catch (e) {
        console.error('Failed to seed dummy to DB', e)
      }
      
      return true
    }

    // Fallback to mock arrays
    const mainAffiliateId = 'user-affiliate-1'
    let parent = globalMockUsers.find(u => u.id === mainAffiliateId)
    if (!parent) parent = globalMockUsers.find(u => u.role === 'AFFILIATE') || globalMockUsers[0]
    
    for (let i = 0; i < count; i++) {
      const id = `dummy-aff-${Date.now()}-${i}`
      const user = {
        id,
        name: `Dummy User ${i + 1}`,
        email: `dummy${i + 1}@saloka.id`,
        role: 'CUSTOMER',
        level: 1,
        xp: 0,
        parentAffiliateId: parent.id,
        createdAt: new Date(Date.now() - Math.random() * 10000000000)
      }
      globalMockUsers.push(user as any)
      
      globalMockOrders.push({
        id: `dummy-ord-${Date.now()}-${i}`,
        buyerId: user.id,
        merchantId: 'user-merchant-1',
        totalAmount: 150000,
        status: 'COMPLETED',
        createdAt: user.createdAt,
        updatedAt: user.createdAt,
        items: [
          { productId: 'prod-gayo-coffee', quantity: 1, price: 150000 }
        ]
      } as any)
      
      globalMockReferrals.push({
        id: `dummy-ref-${Date.now()}-${i}`,
        affiliateId: parent.id,
        buyerId: user.id,
        commissionAmount: 150000 * 0.1, // 10%
        status: 'PAID',
        createdAt: user.createdAt
      } as any)
    }
    
    saveMockDb()
    return true
  },

  async getReminders(userId: string) {
    const reminders = [];
    
    // 1. LMS Incomplete Lessons Reminder
    let progressList: any[] = [];
    let coursesList: any[] = [];
    let userObj: any = null;

    if (await isDbConnected()) {
      try {
        userObj = await db.user.findUnique({ where: { id: userId } });
        progressList = await db.progress.findMany({ where: { userId } });
        coursesList = await db.course.findMany({
          include: { lessons: { orderBy: { orderIndex: 'asc' } } }
        });
      } catch (_) {}
    } else {
      userObj = globalMockUsers.find(u => u.id === userId);
      progressList = globalMockProgress.filter(p => p.userId === userId);
      coursesList = mockCourses.map(c => ({
        ...c,
        lessons: mockLessons.filter(l => l.courseId === c.id).sort((a,b) => a.orderIndex - b.orderIndex)
      }));
    }

    const completedLessonIds = new Set(progressList.filter(p => p.completed).map(p => p.lessonId));

    // Find any course that user has started but not completed, or recommend lesson 1
    let foundIncomplete = false;
    for (const course of coursesList) {
      // Check if user has access to this course
      const accessLevels = { Gold: 1, Platinum: 2, Diamond: 3 };
      const userRank = accessLevels[userObj?.membershipAccess as 'Gold' | 'Platinum' | 'Diamond' || 'Gold'] || 1;
      const courseRank = accessLevels[course.accessRequired as 'Gold' | 'Platinum' | 'Diamond' || 'Gold'] || 1;

      if (userRank >= courseRank) {
        const courseLessons = course.lessons || [];
        for (const lesson of courseLessons) {
          if (!completedLessonIds.has(lesson.id)) {
            reminders.push({
              id: `rem-lms-${lesson.id}`,
              type: 'LMS',
              title: 'Lanjutkan Belajar Akademi',
              description: `Selesaikan materi: "${lesson.title}" di kelas ${course.title}.`,
              actionUrl: `/academy/course/${course.id}`,
              createdAt: new Date()
            });
            foundIncomplete = true;
            break; // only remind one lesson at a time
          }
        }
      }
      if (foundIncomplete) break;
    }

    // 2. Membership upgrade suggestion
    if (userObj?.membershipAccess === 'Gold') {
      reminders.push({
        id: 'rem-upgrade-plat',
        type: 'MEMBERSHIP',
        title: 'Upgrade Keanggotaan Platinum',
        description: 'Tingkatkan akses Anda ke level Platinum untuk membuka kelas premium Artisan Baking!',
        actionUrl: '/affiliate?tab=membership',
        createdAt: new Date()
      });
    } else if (userObj?.membershipAccess === 'Platinum') {
      reminders.push({
        id: 'rem-upgrade-diam',
        type: 'MEMBERSHIP',
        title: 'Upgrade Keanggotaan Diamond',
        description: 'Buka materi Mastering Digital Branding & Packaging dengan upgrade ke Diamond!',
        actionUrl: '/affiliate?tab=membership',
        createdAt: new Date()
      });
    }

    // 3. Location-based product reminders (Distance < 10km)
    let productsList: any[] = [];
    if (await isDbConnected()) {
      try {
        productsList = await db.product.findMany({ include: { merchant: true } });
      } catch (_) {}
    } else {
      productsList = globalMockProducts.map(p => ({
        ...p,
        merchant: globalMockUsers.find(u => u.id === p.merchantId) || null
      }));
    }

    if (userObj?.latitude && userObj?.longitude) {
      const uLat = userObj.latitude;
      const uLng = userObj.longitude;

      for (const prod of productsList) {
        if (prod.latitude && prod.longitude && prod.merchantId !== userId) {
          const dist = calculateDistance(uLat, uLng, prod.latitude, prod.longitude);
          if (dist <= 10) {
            reminders.push({
              id: `rem-prod-${prod.id}`,
              type: 'PRODUCT',
              title: `Produk Terdekat (${dist.toFixed(1)} km)`,
              description: `Temukan "${prod.title}" di merchant terdekat ${prod.merchant?.name || 'Saloka.id'}.`,
              actionUrl: `/marketplace`,
              createdAt: new Date()
            });
            break; // limit to one nearby product reminder
          }
        }
      }
    }

    return reminders;
  },

  async updateUserSettings(userId: string, data: {
    name?: string;
    whatsapp?: string;
    bio?: string;
    waGatewayKeys?: string;
    fbPixelId?: string | null;
    tiktokPixelId?: string | null;
    zapierWebhookUrl?: string | null;
    googleSheetUrl?: string | null;
    zoomMeetingUrl?: string | null;
    image?: string | null;
  }) {
    return withMutationFallback(
      async () => {
        return await db.user.update({
                  where: { id: userId },
                  data
                })
      },
      async () => {
        const user = globalMockUsers.find(u => u.id === userId)
            if (user) {
              if (data.name !== undefined) user.name = data.name
              if (data.whatsapp !== undefined) user.whatsapp = data.whatsapp
              if (data.bio !== undefined) user.bio = data.bio
              if (data.waGatewayKeys !== undefined) user.waGatewayKeys = data.waGatewayKeys
              if (data.fbPixelId !== undefined) user.fbPixelId = data.fbPixelId
              if (data.tiktokPixelId !== undefined) user.tiktokPixelId = data.tiktokPixelId
              if (data.zapierWebhookUrl !== undefined) user.zapierWebhookUrl = data.zapierWebhookUrl
              if (data.googleSheetUrl !== undefined) user.googleSheetUrl = data.googleSheetUrl
              if (data.zoomMeetingUrl !== undefined) user.zoomMeetingUrl = data.zoomMeetingUrl
              if (data.image !== undefined) user.image = data.image
              user.updatedAt = new Date()
              return user
            }
            return null
      }
    )
  },

  async getWaLogs(merchantId: string) {
    return globalMockWaLogs.filter(log => log.merchantId === merchantId)
  },

  // CHAT & SUPPORT OPERATIONS
  async getOrCreateChatRoom(buyerId: string, sellerId: string, productId?: string) {
    return withMutationFallback(
      async () => {
        let room = await db.chatRoom.findFirst({
                  where: {
                    OR: [
                      { buyerId, sellerId },
                      { buyerId: sellerId, sellerId: buyerId }
                    ]
                  },
                  include: {
                    buyer: true,
                    seller: true,
                    product: true
                  }
                });
                if (!room) {
                  room = await db.chatRoom.create({
                    data: {
                      buyerId,
                      sellerId,
                      productId: productId || null
                    },
                    include: {
                      buyer: true,
                      seller: true,
                      product: true
                    }
                  });
                }
                return room;
      },
      async () => {
        let room = globalMockChatRooms.find(
              r => (r.buyerId === buyerId && r.sellerId === sellerId) || (r.buyerId === sellerId && r.sellerId === buyerId)
            );
            if (!room) {
              room = {
                id: `room-${Date.now()}`,
                buyerId,
                sellerId,
                productId: productId || null,
                createdAt: new Date(),
                updatedAt: new Date()
              };
              globalMockChatRooms.push(room);
              }
            const buyer = globalMockUsers.find(u => u.id === room.buyerId) || null;
            const seller = globalMockUsers.find(u => u.id === room.sellerId) || null;
            const product = globalMockProducts.find(p => p.id === room.productId) || null;
            return { ...room, buyer, seller, product };
      }
    )
  },

  async sendChatMessage(roomId: string, senderId: string, content: string, imageUrl?: string) {
    return withMutationFallback(
      async () => {
        const msg = await db.chatMessage.create({
                  data: {
                    roomId,
                    senderId,
                    content,
                    imageUrl: imageUrl || null
                  }
                });
                await db.chatRoom.update({
                  where: { id: roomId },
                  data: { updatedAt: new Date() }
                });
                return msg;
      },
      async () => {
        const msg = {
              id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              roomId,
              senderId,
              content,
              imageUrl: imageUrl || null,
              isRead: false,
              createdAt: new Date()
            };
            globalMockChatMessages.push(msg);
            const roomIdx = globalMockChatRooms.findIndex(r => r.id === roomId);
            if (roomIdx !== -1) {
              globalMockChatRooms[roomIdx].updatedAt = new Date();
            }
            return msg;
      }
    )
  },

  async getChatMessages(roomId: string) {
    return withFallback(
      () => db.chatMessage.findMany({
          where: { roomId },
          orderBy: { createdAt: 'asc' }
        }),
      () => globalMockChatMessages
      .filter(m => m.roomId === roomId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    )
  },

  async markMessagesAsRead(roomId: string, userId: string) {
    return withMutationFallback(
      async () => {
        await db.chatMessage.updateMany({
                  where: {
                    roomId,
                    senderId: { not: userId },
                    isRead: false
                  },
                  data: { isRead: true }
                });
                return true;
      },
      async () => {
        globalMockChatMessages.forEach(m => {
              if (m.roomId === roomId && m.senderId !== userId) {
                m.isRead = true;
              }
            });
            return true;
      }
    )
  },

  async getUserConversations(userId: string) {
    return withFallback(
      async () => {
        const rooms = await db.chatRoom.findMany({
                  where: {
                    OR: [
                      { buyerId: userId },
                      { sellerId: userId }
                    ]
                  },
                  include: {
                    buyer: true,
                    seller: true,
                    product: true,
                    messages: {
                      orderBy: { createdAt: 'desc' },
                      take: 1
                    }
                  },
                  orderBy: { updatedAt: 'desc' }
                });
                
                const roomsWithUnread = await Promise.all(rooms.map(async (r) => {
                  const unreadCount = await db.chatMessage.count({
                    where: {
                      roomId: r.id,
                      senderId: { not: userId },
                      isRead: false
                    }
                  });
                  return {
                    ...r,
                    lastMessage: r.messages[0] || null,
                    unreadCount
                  };
                }));
                
                return roomsWithUnread;
      },
      async () => {
        return globalMockChatRooms
              .filter(r => r.buyerId === userId || r.sellerId === userId)
              .map(r => {
                const buyer = globalMockUsers.find(u => u.id === r.buyerId) || null;
                const seller = globalMockUsers.find(u => u.id === r.sellerId) || null;
                const product = globalMockProducts.find(p => p.id === r.productId) || null;
                const messages = globalMockChatMessages
                  .filter(m => m.roomId === r.id)
                  .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
                const lastMessage = messages[0] || null;
                const unreadCount = messages.filter(m => m.senderId !== userId && !m.isRead).length;
                return {
                  ...r,
                  buyer,
                  seller,
                  product,
                  lastMessage,
                  unreadCount
                };
              })
              .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      }
    )
  },

  async createSupportTicket(customerId: string, message: string) {
    const ticketNumber = `CS-${new Date().getFullYear()}${(new Date().getMonth()+1).toString().padStart(2,'0')}${new Date().getDate().toString().padStart(2,'0')}-${Math.floor(1000 + Math.random() * 9000)}`;
    return withMutationFallback(
      async () => {
        return await db.$transaction(async (tx) => {
                  const ticket = await tx.supportTicket.create({
                    data: {
                      ticketNumber,
                      customerId,
                      status: 'OPEN'
                    },
                    include: {
                      customer: true,
                      csAgent: true
                    }
                  });
                  await tx.supportMessage.create({
                    data: {
                      ticketId: ticket.id,
                      senderId: 'SYSTEM',
                      content: 'Halo, selamat datang di layanan bantuan Saloka.id. Mohon tunggu sebentar, kami sedang menghubungkan Anda dengan petugas customer service kami.'
                    }
                  });
                  if (message.trim()) {
                    await tx.supportMessage.create({
                      data: {
                        ticketId: ticket.id,
                        senderId: customerId,
                        content: message
                      }
                    });
                  }
                  return ticket;
                });
      },
      async () => {
        const ticket = {
              id: `ticket-${Date.now()}`,
              ticketNumber,
              customerId,
              csAgentId: null,
              status: 'OPEN',
              createdAt: new Date(),
              updatedAt: new Date()
            };
            globalMockSupportTickets.push(ticket);
            globalMockSupportMessages.push({
              id: `sm-${Date.now()}-sys`,
              ticketId: ticket.id,
              senderId: 'SYSTEM',
              content: 'Halo, selamat datang di layanan bantuan Saloka.id. Mohon tunggu sebentar, kami sedang menghubungkan Anda dengan petugas customer service kami.',
              isRead: false,
              isInternalNote: false,
              createdAt: new Date()
            });
            if (message.trim()) {
              globalMockSupportMessages.push({
                id: `sm-${Date.now()}-cust`,
                ticketId: ticket.id,
                senderId: customerId,
                content: message,
                isRead: false,
                isInternalNote: false,
                createdAt: new Date(Date.now() + 1000)
              });
            }
            const customer = globalMockUsers.find(u => u.id === ticket.customerId) || null;
            return { ...ticket, customer, csAgent: null };
      }
    )
  },

  async getSupportTickets(statusFilter?: string, agentId?: string) {
    return withFallback(
      async () => {
        const whereClause: any = {};
                if (statusFilter) whereClause.status = statusFilter;
                if (agentId) whereClause.csAgentId = agentId;
                return await db.supportTicket.findMany({
                  where: whereClause,
                  include: {
                    customer: true,
                    csAgent: true,
                    messages: {
                      orderBy: { createdAt: 'desc' },
                      take: 1
                    }
                  },
                  orderBy: { updatedAt: 'desc' }
                });
      },
      async () => {
        return globalMockSupportTickets
              .filter(t => {
                if (statusFilter && t.status !== statusFilter) return false;
                if (agentId && t.csAgentId !== agentId) return false;
                return true;
              })
              .map(t => {
                const customer = globalMockUsers.find(u => u.id === t.customerId) || null;
                const csAgent = globalMockUsers.find(u => u.id === t.csAgentId) || null;
                const messages = globalMockSupportMessages
                  .filter(m => m.ticketId === t.id)
                  .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
                const lastMessage = messages[0] || null;
                return {
                  ...t,
                  customer,
                  csAgent,
                  lastMessage
                };
              })
              .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      }
    )
  },

  async assignSupportTicket(ticketId: string, agentId: string) {
    return withMutationFallback(
      async () => {
        const ticket = await db.supportTicket.update({
                  where: { id: ticketId },
                  data: {
                    csAgentId: agentId,
                    status: 'PENDING',
                    updatedAt: new Date()
                  },
                  include: {
                    customer: true,
                    csAgent: true
                  }
                });
                const agent = await db.user.findUnique({ where: { id: agentId } });
                await db.supportMessage.create({
                  data: {
                    ticketId,
                    senderId: 'SYSTEM',
                    content: `Petugas CS ${agent?.name || 'CS Agent'} telah bergabung dalam percakapan.`
                  }
                });
                return ticket;
      },
      async () => {
        const idx = globalMockSupportTickets.findIndex(t => t.id === ticketId);
            if (idx !== -1) {
              globalMockSupportTickets[idx].csAgentId = agentId;
              globalMockSupportTickets[idx].status = 'PENDING';
              globalMockSupportTickets[idx].updatedAt = new Date();
              const agent = globalMockUsers.find(u => u.id === agentId);
              globalMockSupportMessages.push({
                id: `sm-${Date.now()}-join`,
                ticketId,
                senderId: 'SYSTEM',
                content: `Petugas CS ${agent?.name || 'CS Agent'} telah bergabung dalam percakapan.`,
                isRead: false,
                isInternalNote: false,
                createdAt: new Date()
              });
              const customer = globalMockUsers.find(u => u.id === globalMockSupportTickets[idx].customerId) || null;
              return { ...globalMockSupportTickets[idx], customer, csAgent: agent || null };
            }
            return null;
      }
    )
  },

  async sendSupportMessage(ticketId: string, senderId: string, content: string, isInternalNote: boolean = false, imageUrl?: string) {
    return withMutationFallback(
      async () => {
        const msg = await db.supportMessage.create({
                  data: {
                    ticketId,
                    senderId,
                    content,
                    isInternalNote,
                    imageUrl: imageUrl || null
                  }
                });
                await db.supportTicket.update({
                  where: { id: ticketId },
                  data: { updatedAt: new Date() }
                });
                return msg;
      },
      async () => {
        const msg = {
              id: `sm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              ticketId,
              senderId,
              content,
              isInternalNote,
              imageUrl: imageUrl || null,
              isRead: false,
              createdAt: new Date()
            };
            globalMockSupportMessages.push(msg);
            const idx = globalMockSupportTickets.findIndex(t => t.id === ticketId);
            if (idx !== -1) {
              globalMockSupportTickets[idx].updatedAt = new Date();
            }
            return msg;
      }
    )
  },

  async getSupportMessages(ticketId: string) {
    return withFallback(
      () => db.supportMessage.findMany({
          where: { ticketId },
          orderBy: { createdAt: 'asc' }
        }),
      () => globalMockSupportMessages
      .filter(m => m.ticketId === ticketId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    )
  },

  async resolveSupportTicket(ticketId: string) {
    return withMutationFallback(
      async () => {
        const ticket = await db.supportTicket.update({
                  where: { id: ticketId },
                  data: {
                    status: 'RESOLVED',
                    updatedAt: new Date()
                  }
                });
                await db.supportMessage.create({
                  data: {
                    ticketId,
                    senderId: 'SYSTEM',
                    content: 'Sesi bantuan telah selesai dan tiket telah ditutup. Terima kasih telah menghubungi layanan Saloka.id!'
                  }
                });
                return ticket;
      },
      async () => {
        const idx = globalMockSupportTickets.findIndex(t => t.id === ticketId);
            if (idx !== -1) {
              globalMockSupportTickets[idx].status = 'RESOLVED';
              globalMockSupportTickets[idx].updatedAt = new Date();
              globalMockSupportMessages.push({
                id: `sm-${Date.now()}-close`,
                ticketId,
                senderId: 'SYSTEM',
                content: 'Sesi bantuan telah selesai dan tiket telah ditutup. Terima kasih telah menghubungi layanan Saloka.id!',
                isRead: false,
                isInternalNote: false,
                createdAt: new Date()
              });
              return globalMockSupportTickets[idx];
            }
            return null;
      }
    )
  },

  async escalateSupportTicket(ticketId: string) {
    return withMutationFallback(
      async () => {
        const ticket = await db.supportTicket.update({
                  where: { id: ticketId },
                  data: {
                    status: 'ESCALATED',
                    updatedAt: new Date()
                  }
                });
                await db.supportMessage.create({
                  data: {
                    ticketId,
                    senderId: 'SYSTEM',
                    content: 'Tiket bantuan Anda telah dieskalasi ke Super Admin untuk penanganan lebih lanjut.'
                  }
                });
                return ticket;
      },
      async () => {
        const idx = globalMockSupportTickets.findIndex(t => t.id === ticketId);
            if (idx !== -1) {
              globalMockSupportTickets[idx].status = 'ESCALATED';
              globalMockSupportTickets[idx].updatedAt = new Date();
              globalMockSupportMessages.push({
                id: `sm-${Date.now()}-escalate`,
                ticketId,
                senderId: 'SYSTEM',
                content: 'Tiket bantuan Anda telah dieskalasi ke Super Admin untuk penanganan lebih lanjut.',
                isRead: false,
                isInternalNote: false,
                createdAt: new Date()
              });
              return globalMockSupportTickets[idx];
            }
            return null;
      }
    )
  },

  // REVIEW OPERATIONS
  async createReview(productId: string, authorId: string, rating: number, comment: string, orderId?: string) {
    return withMutationFallback(
      async () => {
        return await db.productReview.create({
                  data: {
                    productId,
                    authorId,
                    rating,
                    comment,
                    orderId
                  },
                  include: {
                    author: true
                  }
                });
      },
      async () => {
        // Mock DB Fallback
            const existing = globalMockReviews.find(r => r.productId === productId && r.authorId === authorId);
            if (existing) throw new Error('Anda sudah memberikan ulasan untuk produk ini.');
            const review = {
              id: `rev-${Date.now()}`,
              productId,
              authorId,
              rating,
              comment,
              orderId: orderId || null,
              createdAt: new Date()
            };
            globalMockReviews.push(review);
            const author = globalMockUsers.find(u => u.id === authorId) || null;
            return { ...review, author };
      }
    )
  },

  async getProductReviews(productId: string) {
    return withFallback(
      () => db.productReview.findMany({
          where: { productId },
          include: { author: true },
          orderBy: { createdAt: 'desc' }
        }),
      () => globalMockReviews
      .filter(r => r.productId === productId)
      .map(r => ({
        ...r,
        author: globalMockUsers.find(u => u.id === r.authorId) || null
      }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    )
  },

  // NOTIFICATION OPERATIONS
  async createNotification(userId: string, type: string, title: string, body: string, linkUrl?: string) {
    return withMutationFallback(
      async () => {
        return await db.notification.create({
                  data: {
                    userId,
                    type,
                    title,
                    body,
                    linkUrl
                  }
                });
      },
      async () => {
        // Mock DB Fallback
            const notification = {
              id: `notif-${Date.now()}`,
              userId,
              type,
              title,
              body,
              isRead: false,
              linkUrl: linkUrl || null,
              createdAt: new Date()
            };
            globalMockNotifications.push(notification);
            return notification;
      }
    )
  },

  async getUserNotifications(userId: string) {
    return withFallback(
      () => db.notification.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' }
        }),
      () => globalMockNotifications
      .filter(n => n.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    )
  },

  async markNotificationsAsRead(userId: string) {
    return withMutationFallback(
      async () => {
        await db.notification.updateMany({
                  where: { userId, isRead: false },
                  data: { isRead: true }
                });
                return true;
      },
      async () => {
        globalMockNotifications.forEach(n => {
              if (n.userId === userId) {
                n.isRead = true;
              }
            });
            return true;
      }
    )
  },

  // ORDER TRACKING OPERATIONS
  async updateOrderShippingLabel(orderId: string, shippingLabel: string) {
    return withMutationFallback(
      async () => {
        await db.order.update({
                  where: { id: orderId },
                  data: { shippingLabel }
                });
                return true;
      },
      async () => {
        const idx = globalMockOrders.findIndex(o => o.id === orderId);
            if (idx !== -1) {
              globalMockOrders[idx].shippingLabel = shippingLabel;
              globalMockOrders[idx].updatedAt = new Date();
              }
            return true;
      }
    )
  },

  async updateOrderTracking(orderId: string, status: string, note?: string) {
    return withMutationFallback(
      async () => {
        let orderStatus: any = undefined;
                if (status === 'DELIVERED') orderStatus = 'COMPLETED';
                if (status === 'CANCELLED') orderStatus = 'CANCELLED';
                
                await db.$transaction(async (tx) => {
                  await tx.orderTracking.create({
                    data: {
                      orderId,
                      status,
                      note
                    }
                  });
                  if (orderStatus) {
                    await tx.order.update({
                      where: { id: orderId },
                      data: { status: orderStatus }
                    });
                  }
                });
                
                return await db.order.findUnique({
                  where: { id: orderId },
                  include: { buyer: true, items: { include: { product: true } }, tracking: true }
                });
      },
      async () => {
        // Mock DB Fallback
            const trackingStep = {
              id: `ot-${Date.now()}`,
              orderId,
              status,
              note: note || null,
              createdAt: new Date()
            };
            globalMockOrderTrackings.push(trackingStep);
            
            const idx = globalMockOrders.findIndex(o => o.id === orderId);
            if (idx !== -1) {
              if (status === 'DELIVERED') globalMockOrders[idx].status = 'COMPLETED';
              if (status === 'CANCELLED') globalMockOrders[idx].status = 'CANCELLED';
              globalMockOrders[idx].updatedAt = new Date();
            }
            const order = globalMockOrders.find(o => o.id === orderId);
            const tracking = globalMockOrderTrackings.filter(ot => ot.orderId === orderId);
            return order ? { ...order, tracking } : null;
      }
    )
  },

  async getOrderTracking(orderId: string) {
    return withFallback(
      () => db.orderTracking.findMany({
          where: { orderId },
          orderBy: { createdAt: 'desc' }
        }),
      () => globalMockOrderTrackings
      .filter(ot => ot.orderId === orderId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    )
  },

  async addWaLog(merchantId: string, merchantName: string, apiKeyUsed: string, recipient: string, message: string, status: string = 'SUCCESS') {
    globalMockWaLogs.push({
      id: `wa-log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date(),
      merchantId,
      merchantName,
      apiKeyUsed,
      recipient,
      message,
      status
    });
    saveMockDb();
    return true;
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // COMMUNITY INDUK OPERATIONS (Revisi Pert Keempat)
  // ═══════════════════════════════════════════════════════════════════════════

  async getCommunities() {
    const seedCommunities = [
          {
            id: 'comm-dummy-1',
            name: 'Perahu Kita',
            type: 'PERKUMPULAN' as const,
            description: 'Wadah bagi pelaku usaha, UMKM, dan masyarakat untuk saling berbagi pengalaman, memperluas relasi dan menciptakan peluang bersama.',
            aktaNotaris: 'Akta Notaris Perkumpulan No. 25 Tgl 25 Juli 2026',
            nomorAhu: 'AHU-00250726.AH.01.07',
            nomorNpwp: '98.765.432.1-012.000',
            domisili: 'Kota Yogyakarta, DIY',
            kontakPj: '081234567890',
            waGroupLink: 'https://chat.whatsapp.com/JdK8X4bY12eD5xG',
            avatarUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=150&h=150&fit=crop&q=80',
            coverUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&h=400&fit=crop&q=80',
            joinFee: 0,
            monthlyFee: 0,
            ketuaId: 'user-merchant-1',
            isSuspended: false,
            isVerified: true,
            createdAt: new Date('2026-01-01'),
            updatedAt: new Date('2026-01-01')
          },
          {
            id: 'comm-dummy-2',
            name: 'Koperasi Produksi Maju Bersama',
            type: 'KOPERASI' as const,
            description: 'Koperasi produksi resmi pelaku usaha mikro kecil dan menengah untuk pengadaan bahan baku bersama, fasilitasi permodalan modal produksi, dan bagi hasil usaha (SHU) tahunan.',
            aktaNotaris: 'Akta Notaris Koperasi No. 98 Tgl 01 Februari 2025',
            nomorAhu: 'AHU-KOP-0029311.AH.01.11',
            nomorNpwp: '12.987.654.3-012.000',
            domisili: 'Sleman, DIY',
            kontakPj: '089876543210',
            waGroupLink: 'https://chat.whatsapp.com/LhB2P9qK10zF6sD',
            avatarUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=150&h=150&fit=crop&q=80',
            coverUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=300&fit=crop&q=80',
            joinFee: 150000,
            monthlyFee: 50000,
            ketuaId: 'user-admin-1',
            isSuspended: false,
            isVerified: true,
            createdAt: new Date('2026-02-15'),
            updatedAt: new Date('2026-02-15')
          }
        ];
    return withMutationFallback(
      async () => {
        return await db.community.findMany({
          include: {
            ketua: { select: { id: true, name: true, role: true } },
            _count: { select: { members: true } }
          },
          orderBy: { createdAt: 'desc' }
        })
      },
      async () => {
        if (!(globalThis as any).__mockCommunities || (globalThis as any).__mockCommunities.length === 0) {
              (globalThis as any).__mockCommunities = [...seedCommunities];
              if (!(globalThis as any).__mockCommunityMemberships) (globalThis as any).__mockCommunityMemberships = [];
              for (const seed of seedCommunities) {
                const exists = (globalThis as any).__mockCommunityMemberships.some((m: any) => m.communityId === seed.id && m.userId === seed.ketuaId);
                if (!exists) {
                  (globalThis as any).__mockCommunityMemberships.push({
                    id: `cm-${seed.id}-${seed.ketuaId}`,
                    communityId: seed.id,
                    userId: seed.ketuaId,
                    isInduk: true,
                    isPaid: true,
                    joinedAt: new Date()
                  });
                }
              }
              }
        
            const communities = (globalThis as any).__mockCommunities || []
            return communities.map((c: any) => {
              const ketua = globalMockUsers.find(u => u.id === c.ketuaId)
              const memberCount = ((globalThis as any).__mockCommunityMemberships || []).filter((m: any) => m.communityId === c.id).length
              return {
                ...c,
                ketua: ketua ? { id: ketua.id, name: ketua.name, role: ketua.role } : null,
                _count: { members: memberCount }
              }
            })
      }
    )
  },

  async getUserCommunitiesWithRoles(userId: string) {
    syncMockDb()
    const result: Array<{
      communityId: string
      communityName: string
      communityType: string
      landingPageConfig?: string | null
      isVerified: boolean
      role: 'KETUA' | 'ANGGOTA' | 'PEMBUAT_PENDING'
      roleLabel: string
      statusLabel: string
    }> = []

    const allCommunities = await this.getCommunities()
    const ketuaCommunities = allCommunities.filter((c: any) => c.ketuaId === userId)

    for (const c of ketuaCommunities) {
      result.push({
        communityId: c.id,
        communityName: c.name,
        communityType: c.type,
        landingPageConfig: c.landingPageConfig,
        isVerified: Boolean(c.isVerified),
        role: c.isVerified ? 'KETUA' : 'PEMBUAT_PENDING',
        roleLabel: c.isVerified ? 'Ketua / Admin' : 'Calon Ketua (Pending Verifikasi)',
        statusLabel: c.isVerified ? 'Aktif' : 'Pending Verifikasi Super Admin'
      })
    }

    let memberships: any[] = []
    if (await isDbConnected()) {
      try {
        memberships = await db.communityMembership.findMany({
          where: { userId },
          include: { community: true }
        })
      } catch (_) {}
    } else {
      memberships = ((globalThis as any).__mockCommunityMemberships || []).filter((m: any) => m.userId === userId)
    }

    for (const m of memberships) {
      const commId = m.communityId || m.community?.id
      if (!commId) continue
      if (result.some(r => r.communityId === commId)) continue

      const comm = m.community || allCommunities.find((c: any) => c.id === commId)
      if (comm) {
        result.push({
          communityId: comm.id,
          communityName: comm.name,
          communityType: comm.type,
          landingPageConfig: comm.landingPageConfig,
          isVerified: Boolean(comm.isVerified),
          role: 'ANGGOTA',
          roleLabel: 'Anggota',
          statusLabel: m.isPaid || m.invoiceStatus === 'PAID' || m.invoiceStatus === 'VERIFIED' ? 'Aktif' : 'Unpaid'
        })
      }
    }

    return result
  },

  async getCommunityById(id: string) {
    const seedCommunities = [
          {
            id: 'comm-dummy-1',
            name: 'Perahu Kita',
            type: 'PERKUMPULAN' as const,
            description: 'Wadah bagi pelaku usaha, UMKM, dan masyarakat untuk saling berbagi pengalaman, memperluas relasi dan menciptakan peluang bersama.',
            aktaNotaris: 'Akta Notaris Perkumpulan No. 25 Tgl 25 Juli 2026',
            nomorAhu: 'AHU-00250726.AH.01.07',
            nomorNpwp: '98.765.432.1-012.000',
            domisili: 'Kota Yogyakarta, DIY',
            kontakPj: '081234567890',
            waGroupLink: 'https://chat.whatsapp.com/JdK8X4bY12eD5xG',
            avatarUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=150&h=150&fit=crop&q=80',
            coverUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&h=400&fit=crop&q=80',
            joinFee: 0,
            monthlyFee: 0,
            ketuaId: 'user-merchant-1',
            isSuspended: false,
            isVerified: true,
            createdAt: new Date('2026-01-01'),
            updatedAt: new Date('2026-01-01')
          },
          {
            id: 'comm-dummy-2',
            name: 'Koperasi Produksi Maju Bersama',
            type: 'KOPERASI' as const,
            description: 'Koperasi produksi resmi pelaku usaha mikro kecil dan menengah untuk pengadaan bahan baku bersama, fasilitasi permodalan modal produksi, dan bagi hasil usaha (SHU) tahunan.',
            aktaNotaris: 'Akta Notaris Koperasi No. 98 Tgl 01 Februari 2025',
            nomorAhu: 'AHU-KOP-0029311.AH.01.11',
            nomorNpwp: '12.987.654.3-012.000',
            domisili: 'Sleman, DIY',
            kontakPj: '089876543210',
            waGroupLink: 'https://chat.whatsapp.com/LhB2P9qK10zF6sD',
            avatarUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=150&h=150&fit=crop&q=80',
            coverUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=300&fit=crop&q=80',
            joinFee: 150000,
            monthlyFee: 50000,
            ketuaId: 'user-admin-1',
            isSuspended: false,
            isVerified: true,
            createdAt: new Date('2026-02-15'),
            updatedAt: new Date('2026-02-15')
          }
        ];
    return withFallback(
      async () => {
        let community = await db.community.findUnique({
          where: { id },
          include: {
            ketua: { select: { id: true, name: true, role: true, email: true } },
            members: {
              include: { user: { select: { id: true, name: true, role: true, email: true } } }
            },
            _count: { select: { members: true } }
          }
        });
        if (community) return community;
        
                if (!community) {
                  // Fallback lookup by prefix or name slug
                  const allComms = await db.community.findMany({
                    include: {
                      ketua: { select: { id: true, name: true, role: true, email: true } },
                      members: {
                        include: { user: { select: { id: true, name: true, role: true, email: true } } }
                      },
                      _count: { select: { members: true } }
                    }
                  });
                  const cleanId = id.toLowerCase().replace(/[^a-z0-9]/g, '');
                  community = allComms.find(c =>
                    c.id === id ||
                    c.id.startsWith(id) ||
                    (c.name && c.name.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanId)
                  ) || null;
                }
        
                if (!community) {
                  const seedMatch = seedCommunities.find(s => s.id === id) || (id.includes('dummy-1') ? seedCommunities[0] : seedCommunities[1]);
                  const firstUser = (await db.user.findFirst())?.id || 'user-admin-1';
                  try {
                    await db.community.create({
                      data: {
                        id: id,
                        name: seedMatch.name,
                        type: seedMatch.type,
                        description: seedMatch.description,
                        aktaNotaris: seedMatch.aktaNotaris,
                        nomorAhu: seedMatch.nomorAhu,
                        nomorNpwp: seedMatch.nomorNpwp,
                        domisili: seedMatch.domisili,
                        kontakPj: seedMatch.kontakPj,
                        waGroupLink: seedMatch.waGroupLink,
                        avatarUrl: seedMatch.avatarUrl,
                        coverUrl: seedMatch.coverUrl,
                        joinFee: seedMatch.joinFee,
                        monthlyFee: seedMatch.monthlyFee,
                        ketuaId: firstUser,
                        isVerified: seedMatch.isVerified
                      }
                    });
                    community = await db.community.findUnique({
                      where: { id },
                      include: {
                        ketua: { select: { id: true, name: true, role: true, email: true } },
                        members: {
                          include: { user: { select: { id: true, name: true, role: true, email: true } } }
                        },
                        _count: { select: { members: true } }
                      }
                    });
                  } catch (_) {}
                }
        
                if (community) {
                  return community;
                }
      },
      async () => {
        const communities = (globalThis as any).__mockCommunities || []
            const cleanId = id.toLowerCase().replace(/[^a-z0-9]/g, '')
            let community = communities.find((c: any) =>
              c.id === id ||
              c.id.startsWith(id) ||
              (c.name && c.name.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanId)
            )
            if (!community) {
              community = seedCommunities.find(s => s.id === id || s.id.startsWith(id)) || { ...seedCommunities[1], id }
            }
            const ketua = globalMockUsers.find(u => u.id === community.ketuaId) || { id: 'user-admin-1', name: 'Super Admin Saloka', role: 'ADMIN', email: 'admin@saloka.com' }
            const memberships = ((globalThis as any).__mockCommunityMemberships || []).filter((m: any) => m.communityId === id)
            const members = memberships.map((m: any) => {
              const user = globalMockUsers.find(u => u.id === m.userId)
              return { ...m, user: user ? { id: user.id, name: user.name, role: user.role, email: user.email } : null }
            })
            return {
              ...community,
              ketua: { id: ketua.id, name: ketua.name, role: ketua.role, email: ketua.email },
              members,
              _count: { members: members.length || 3 }
            }
      }
    )
  },

  // ─── GLOBAL KYC SETTINGS FOR COMMUNITY CREATION ────────────────────────────
  async getGlobalKycRequirementToCreateCommunity(): Promise<boolean> {
    if (await isDbConnected()) {
      try {
        const setting = await db.systemSetting.findUnique({
          where: { key: 'globalKycRequired' }
        })
        if (setting !== null) {
          return setting.value === 'true'
        }
        // Default: true (first time, never set)
        return true
      } catch (e) {
        // fallback to mock below
      }
    }
    syncMockDb()
    if ((globalThis as any).__isKycRequiredToCreateCommunity === undefined) {
      (globalThis as any).__isKycRequiredToCreateCommunity = true
    }
    return Boolean((globalThis as any).__isKycRequiredToCreateCommunity)
  },

  async setGlobalKycRequirementToCreateCommunity(required: boolean): Promise<boolean> {
    if (await isDbConnected()) {
      try {
        await db.systemSetting.upsert({
          where: { key: 'globalKycRequired' },
          update: { value: String(required) },
          create: { key: 'globalKycRequired', value: String(required) }
        })
        return required
      } catch (e) {
        // fallback to mock below
      }
    }
    syncMockDb()
    ;(globalThis as any).__isKycRequiredToCreateCommunity = required
    saveMockDb()
    return required
  },

  async createCommunity(data: {
    ketuaId: string
    name: string
    type: 'PERKUMPULAN' | 'KOPERASI'
    description?: string
    aktaNotaris?: string
    nomorAhu?: string
    nomorNpwp?: string
    domisili?: string
    kontakPj?: string
    avatarUrl?: string
    coverUrl?: string
    waGroupLink?: string
    joinFee?: number
    monthlyFee?: number
    isKycRequired?: boolean
    landingPageConfig?: string
    coinBalance?: number
    templateType?: string
  }) {
    return withMutationFallback(
      async () => {
        const community = await db.community.create({
                  data: {
                    name: data.name,
                    type: data.type as any,
                    description: data.description || '',
                    aktaNotaris: data.aktaNotaris || null,
                    nomorAhu: data.nomorAhu || null,
                    nomorNpwp: data.nomorNpwp || null,
                    domisili: data.domisili || null,
                    kontakPj: data.kontakPj || null,
                    avatarUrl: data.avatarUrl || null,
                    coverUrl: data.coverUrl || null,
                    waGroupLink: data.waGroupLink || null,
                    joinFee: data.joinFee || 0,
                    monthlyFee: data.monthlyFee || 0,
                    isKycRequired: Boolean(data.isKycRequired),
                    landingPageConfig: data.landingPageConfig || null,
                    coinBalance: data.coinBalance || 0,
                    ketuaId: data.ketuaId,
                    templateType: data.templateType || 'Community'
                  } as any
                })
                // Auto-join ketua as member with isInduk & set active indukCommunityId
                await db.communityMembership.create({
                  data: {
                    communityId: community.id,
                    userId: data.ketuaId,
                    isInduk: true,
                    isPaid: true
                  }
                })
                await db.user.update({
                  where: { id: data.ketuaId },
                  data: { indukCommunityId: community.id }
                })
                return community
      },
      async () => {
        // Mock DB
            if (!(globalThis as any).__mockCommunities) (globalThis as any).__mockCommunities = []
            if (!(globalThis as any).__mockCommunityMemberships) (globalThis as any).__mockCommunityMemberships = []
            
            const newCommunity = {
              id: `community-${Date.now()}`,
              name: data.name,
              type: data.type,
              description: data.description || '',
              aktaNotaris: data.aktaNotaris || null,
              nomorAhu: data.nomorAhu || null,
              nomorNpwp: data.nomorNpwp || null,
              domisili: data.domisili || null,
              kontakPj: data.kontakPj || null,
              avatarUrl: data.avatarUrl || null,
              coverUrl: data.coverUrl || null,
              waGroupLink: data.waGroupLink || null,
              landingPageConfig: data.landingPageConfig || null,
              joinFee: data.joinFee || 0,
              monthlyFee: data.monthlyFee || 0,
              isKycRequired: Boolean(data.isKycRequired),
              coinBalance: data.coinBalance || 0,
              templateType: data.templateType || 'Community',
              isSuspended: false,
              isVerified: false,
              ketuaId: data.ketuaId,
              createdAt: new Date(),
              updatedAt: new Date()
            };
            (globalThis as any).__mockCommunities.push(newCommunity);
            
            // Auto-join ketua and set active indukCommunityId
            (globalThis as any).__mockCommunityMemberships.push({
              id: `cm-${Date.now()}`,
              communityId: newCommunity.id,
              userId: data.ketuaId,
              isInduk: true,
              isPaid: true,
              joinedAt: new Date()
            })
        
            const ketuaUser = globalMockUsers.find((u: any) => u.id === data.ketuaId)
            if (ketuaUser) {
              (ketuaUser as any).indukCommunityId = newCommunity.id
            }
            
            return newCommunity
      }
    )
  },

  async updateCommunity(id: string, data: {
    name: string
    description?: string
    aktaNotaris?: string
    nomorAhu?: string
    nomorNpwp?: string
    domisili?: string
    kontakPj?: string
    avatarUrl?: string
    coverUrl?: string
    waGroupLink?: string
    landingPageConfig?: string
    joinFee?: number
    monthlyFee?: number
    isKycRequired?: boolean
  }) {
    return withMutationFallback(
      async () => {
        const dbUpdated = await db.community.update({
                  where: { id },
                  data: {
                    name: data.name,
                    description: data.description,
                    aktaNotaris: data.aktaNotaris || null,
                    nomorAhu: data.nomorAhu || null,
                    nomorNpwp: data.nomorNpwp || null,
                    domisili: data.domisili || null,
                    kontakPj: data.kontakPj || null,
                    avatarUrl: data.avatarUrl || null,
                    coverUrl: data.coverUrl || null,
                    waGroupLink: data.waGroupLink || null,
                    landingPageConfig: data.landingPageConfig || null,
                    joinFee: data.joinFee || 0,
                    monthlyFee: data.monthlyFee || 0,
                    ...(data.isKycRequired !== undefined && { isKycRequired: data.isKycRequired }),
                  }
                })
                return dbUpdated
      },
      async () => {
        if (!(globalThis as any).__mockCommunities) (globalThis as any).__mockCommunities = []
            const idx = (globalThis as any).__mockCommunities.findIndex((c: any) => c.id === id)
            if (idx !== -1) {
              const existing = (globalThis as any).__mockCommunities[idx]
              const mockUpdated = {
                ...existing,
                name: data.name,
                description: data.description ?? existing.description,
                aktaNotaris: data.aktaNotaris ?? existing.aktaNotaris,
                nomorAhu: data.nomorAhu ?? existing.nomorAhu,
                nomorNpwp: data.nomorNpwp ?? existing.nomorNpwp,
                domisili: data.domisili ?? existing.domisili,
                kontakPj: data.kontakPj ?? existing.kontakPj,
                avatarUrl: data.avatarUrl ?? existing.avatarUrl,
                coverUrl: data.coverUrl ?? existing.coverUrl,
                waGroupLink: data.waGroupLink ?? existing.waGroupLink,
                landingPageConfig: data.landingPageConfig ?? existing.landingPageConfig,
                joinFee: data.joinFee ?? existing.joinFee,
                monthlyFee: data.monthlyFee ?? existing.monthlyFee,
                ...(data.isKycRequired !== undefined && { isKycRequired: data.isKycRequired }),
                updatedAt: new Date()
              };
              (globalThis as any).__mockCommunities[idx] = mockUpdated
              return mockUpdated
            }
            throw new Error('Community not found')
      }
    )
  },

  async joinCommunity(userId: string, communityId: string, asInduk: boolean = false) {
    return withMutationFallback(
      async () => {
        const existing = await db.communityMembership.findUnique({
                  where: { communityId_userId: { communityId, userId } }
                })
                if (existing) {
                  if (existing.invoiceStatus === 'UNPAID') {
                    await db.communityMembership.update({
                      where: { id: existing.id },
                      data: { invoiceStatus: 'PAID' }
                    })
                    return { joined: true, statusUpdated: true, invoiceStatus: 'PAID' }
                  }
                  return { joined: true, alreadyMember: true }
                }
                
                const community = await db.community.findUnique({ where: { id: communityId } })
                if (!community) return { error: 'Komunitas tidak ditemukan.' }
        
                // KYC check if community requires KYC
                if ((community as any).isKycRequired) {
                  const userObj = await db.user.findUnique({ where: { id: userId } })
                  const isKycOk = userObj && (userObj.kycStatus === 'VERIFIED' || userObj.kycStatus === 'APPROVED')
                  if (!isKycOk) {
                    return { error: 'Komunitas ini mewajibkan verifikasi KYC (KTP/Selfie) untuk bergabung.', needsKyc: true }
                  }
                }
                
                // Auto-lock recruitment if coinBalance <= 0 (only for non-free communities) or isRecruitmentLocked
                const isFree = (community.joinFee || 0) === 0 || community.category === 'FREE';
                if ((community as any).isRecruitmentLocked) {
                  return { error: 'Rekrutmen komunitas dikunci. Hubungi ketua komunitas.' }
                }
                if (!isFree && community.coinBalance <= 0) {
                  return { error: 'Rekrutmen komunitas dikunci karena kas koin kosong. Hubungi ketua komunitas.' }
                }
        
                const needsPayment = (community.type === 'KOPERASI' || community.category === 'PAID' || community.category === 'KOPERASI') && (community.joinFee || 0) > 0
        
                const membership = await db.communityMembership.create({
                  data: {
                    communityId,
                    userId,
                    isInduk: asInduk,
                    isPaid: !needsPayment,
                    invoiceStatus: needsPayment ? 'UNPAID' : 'VERIFIED'
                  }
                })
        
                await db.user.update({
                  where: { id: userId },
                  data: { indukCommunityId: communityId }
                })
        
                // If joined immediately (no payment needed) and it's a paid community/koperasi, trigger 3-coin referral
                if (!needsPayment && (community.type === 'KOPERASI' || community.category === 'PAID')) {
                  const userObj = await db.user.findUnique({ where: { id: userId } })
                  if (userObj && userObj.parentAffiliateId && community.coinBalance >= 3) {
                    const referrerId = userObj.parentAffiliateId
                    
                    // Deduct from community
                    await db.community.update({
                      where: { id: communityId },
                      data: { 
                        coinBalance: { decrement: 3 },
                        isRecruitmentLocked: community.coinBalance - 3 <= 0 ? true : (community as any).isRecruitmentLocked
                      } as any
                    })
                    
                    // Add to referrer
                    await db.user.update({
                      where: { id: referrerId },
                      data: { coinBalance: { increment: 3 } }
                    })
                    
                    // Record logs
                    await db.coinTransaction.create({
                      data: {
                        type: 'REFERRAL_COMMISSION',
                        amount: 3,
                        description: `Komisi referral cross-community dari pendaftaran ${userObj.name} ke ${community.name}`,
                        userId: referrerId,
                        relatedUserId: userId
                      }
                    })
                    
                    await db.coinTransaction.create({
                      data: {
                        type: 'REFERRAL_COMMISSION',
                        amount: -3,
                        description: `Biaya komisi referral untuk anggota baru ${userObj.name}`,
                        userId: community.ketuaId,
                        communityId: communityId,
                        relatedUserId: userId
                      }
                    })
                  }
                }
        
                return { joined: true, needsPayment, invoiceStatus: needsPayment ? 'UNPAID' : 'VERIFIED' }
      },
      async () => {
        // Mock DB
            if (!(globalThis as any).__mockCommunityMemberships) (globalThis as any).__mockCommunityMemberships = []
            const memberships = (globalThis as any).__mockCommunityMemberships as any[]
            const existing = memberships.find(m => m.communityId === communityId && m.userId === userId)
            if (existing) {
              if (existing.invoiceStatus === 'UNPAID') {
                existing.invoiceStatus = 'PAID'
                return { joined: true, statusUpdated: true, invoiceStatus: 'PAID' }
              }
              return { joined: true, alreadyMember: true }
            }
        
            const communities = (globalThis as any).__mockCommunities || []
            const community = communities.find((c: any) => c.id === communityId)
            if (!community) return { error: 'Komunitas tidak ditemukan.' }
        
            // KYC check for mock DB
            if (community.isKycRequired) {
              const userObj = globalMockUsers.find(u => u.id === userId)
              const isKycOk = userObj && ((userObj as any).kycStatus === 'VERIFIED' || (userObj as any).kycStatus === 'APPROVED')
              if (!isKycOk) {
                return { error: 'Komunitas ini mewajibkan verifikasi KYC (KTP/Selfie) untuk bergabung.', needsKyc: true }
              }
            }
        
            // Auto-lock check for mock
            const isFree = (community.joinFee || 0) === 0 || community.category === 'FREE';
            if (community.isRecruitmentLocked) {
              return { error: 'Rekrutmen komunitas dikunci. Hubungi ketua komunitas.' }
            }
            if (!isFree && (community.coinBalance || 0) <= 0) {
              return { error: 'Rekrutmen komunitas dikunci karena kas koin kosong. Hubungi ketua komunitas.' }
            }
        
            const needsPayment = (community.type === 'KOPERASI' || community.category === 'PAID') && (community.joinFee || 0) > 0
        
            const newMembership = {
              id: `cm-${Date.now()}`,
              communityId,
              userId,
              isInduk: asInduk,
              isPaid: !needsPayment,
              invoiceStatus: needsPayment ? 'UNPAID' : 'VERIFIED',
              joinedAt: new Date()
            }
            memberships.push(newMembership)
        
            const user = globalMockUsers.find(u => u.id === userId)
            if (user) (user as any).indukCommunityId = communityId
        
            // Trigger mock referral commission if joined immediately
            if (!needsPayment && (community.type === 'KOPERASI' || community.category === 'PAID')) {
              const userObj = globalMockUsers.find(u => u.id === userId)
              if (userObj && userObj.parentAffiliateId && (community.coinBalance || 0) >= 3) {
                const referrerId = userObj.parentAffiliateId
                community.coinBalance = (community.coinBalance || 0) - 3
                if (community.coinBalance <= 0) community.isRecruitmentLocked = true
                
                const referrer = globalMockUsers.find(u => u.id === referrerId)
                if (referrer) {
                  referrer.coinBalance = (referrer.coinBalance || 0) + 3
                }
        
                if (!(globalThis as any).__mockCoinTransactions) (globalThis as any).__mockCoinTransactions = []
                ;(globalThis as any).__mockCoinTransactions.push({
                  id: `ctx-${Date.now()}-1`,
                  type: 'REFERRAL_COMMISSION',
                  amount: 3,
                  description: `Komisi referral cross-community dari pendaftaran ${userObj.name} ke ${community.name}`,
                  userId: referrerId,
                  relatedUserId: userId,
                  createdAt: new Date()
                }, {
                  id: `ctx-${Date.now()}-2`,
                  type: 'REFERRAL_COMMISSION',
                  amount: -3,
                  description: `Biaya komisi referral untuk anggota baru ${userObj.name}`,
                  userId: community.ketuaId,
                  communityId: communityId,
                  relatedUserId: userId,
                  createdAt: new Date()
                })
              }
            }
        
            return { joined: true, needsPayment, invoiceStatus: needsPayment ? 'UNPAID' : 'VERIFIED' }
      }
    )
  },

  async getUserIndukCommunity(userId: string) {
    return withFallback(
      async () => {
        const u = await db.user.findUnique({ where: { id: userId } })
                const indukId = u?.indukCommunityId
                if (!indukId) return null
                
                return await db.community.findUnique({
                  where: { id: indukId },
                  include: { ketua: { select: { id: true, name: true } } }
                })
      },
      async () => {
        const user = globalMockUsers.find(u => u.id === userId)
            const indukId = (user as any)?.indukCommunityId
            if (!indukId) return null
        
            const communities = (globalThis as any).__mockCommunities || []
            return communities.find((c: any) => c.id === indukId) || null
      }
    )
  },

  // ─── REMOVE SPECIFIC COMMUNITY MEMBERSHIP ───────────────────────────────────
  // Directly deletes a membership record by (userId, communityId).
  // Also clears user.indukCommunityId if it matches the kicked community.
  async removeCommunityMembership(userId: string, communityId: string) {
    return withMutationFallback(
      async () => {
        // Delete the specific membership record
                await db.communityMembership.deleteMany({
                  where: { userId, communityId }
                })
                // Clear indukCommunityId if it matches
                const existingUser = await db.user.findUnique({
                  where: { id: userId },
                  select: { indukCommunityId: true }
                })
                if (existingUser?.indukCommunityId === communityId) {
                  await db.user.update({
                    where: { id: userId },
                    data: { indukCommunityId: null }
                  })
                }
                return { success: true }
      },
      async () => {
        // Mock DB fallback
            if ((globalThis as any).__mockCommunityMemberships) {
              ;(globalThis as any).__mockCommunityMemberships = (
                globalThis as any
              ).__mockCommunityMemberships.filter(
                (m: any) => !(m.userId === userId && m.communityId === communityId)
              )
            }
            const user = globalMockUsers.find(u => u.id === userId)
            if (user && (user as any).indukCommunityId === communityId) {
              ;(user as any).indukCommunityId = null
              user.updatedAt = new Date()
            }
            return { success: true }
      }
    )
  },

  async setIndukCommunity(userId: string, communityId: string | null) {
    const targetCommunityId = communityId || null
    return withMutationFallback(
      async () => {
        const existingUser = await db.user.findUnique({
                  where: { id: userId },
                  select: { indukCommunityId: true }
                })
        
                const oldCommunityId = existingUser?.indukCommunityId
        
                if (oldCommunityId !== targetCommunityId) {
                  // Delete old membership
                  if (oldCommunityId) {
                    try {
                      await db.communityMembership.deleteMany({
                        where: {
                          userId,
                          communityId: oldCommunityId
                        }
                      })
                    } catch (err) {
                      console.error('Failed to delete old community membership:', err)
                    }
                  }
        
                  // Create new membership
                  if (targetCommunityId) {
                    const membershipExists = await db.communityMembership.findUnique({
                      where: {
                        communityId_userId: {
                          communityId: targetCommunityId,
                          userId
                        }
                      }
                    })
        
                    if (!membershipExists) {
                      await db.communityMembership.create({
                        data: {
                          communityId: targetCommunityId,
                          userId,
                          isInduk: false,
                          isPaid: true,
                          invoiceStatus: 'VERIFIED'
                        }
                      })
                    }
                  }
                }
        
                return await db.user.update({
                  where: { id: userId },
                  data: { indukCommunityId: targetCommunityId }
                })
      },
      async () => {
        // Mock DB logic
            const user = globalMockUsers.find(u => u.id === userId)
            if (user) {
              const oldCommunityId = (user as any).indukCommunityId
        
              if (oldCommunityId !== targetCommunityId) {
                // Delete old
                if (oldCommunityId && (globalThis as any).__mockCommunityMemberships) {
                  (globalThis as any).__mockCommunityMemberships = (globalThis as any).__mockCommunityMemberships.filter(
                    (m: any) => !(m.userId === userId && m.communityId === oldCommunityId)
                  )
                }
        
                // Add new
                if (targetCommunityId) {
                  if (!(globalThis as any).__mockCommunityMemberships) {
                    (globalThis as any).__mockCommunityMemberships = []
                  }
                  const exists = (globalThis as any).__mockCommunityMemberships.some(
                    (m: any) => m.userId === userId && m.communityId === targetCommunityId
                  )
                  if (!exists) {
                    (globalThis as any).__mockCommunityMemberships.push({
                      id: `membership-${Date.now()}-${Math.random()}`,
                      communityId: targetCommunityId,
                      userId,
                      isInduk: false,
                      isPaid: true,
                      invoiceStatus: 'VERIFIED',
                      createdAt: new Date(),
                      updatedAt: new Date()
                    })
                  }
                }
              }
        
              (user as any).indukCommunityId = targetCommunityId
              user.updatedAt = new Date()
              return user
            }
            return null
      }
    )
  },

  async updateUserAdminPermissions(userId: string, permissions: string[], isSuperAdmin?: boolean) {
    const permString = JSON.stringify(permissions)
    return withMutationFallback(
      async () => {
        return await db.user.update({
                  where: { id: userId },
                  data: {
                    adminPermissions: permString,
                    ...(typeof isSuperAdmin === 'boolean' ? { isSuperAdmin } : {})
                  }
                })
      },
      async () => {
        const user = globalMockUsers.find(u => u.id === userId)
            if (user) {
              (user as any).adminPermissions = permString
              if (typeof isSuperAdmin === 'boolean') {
                (user as any).isSuperAdmin = isSuperAdmin
              }
              user.updatedAt = new Date()
              return user
            }
            return null
      }
    )
  },

  async createCommunityAdmin(data: any) {
    return withMutationFallback(
      async () => {
        return await db.community.create({
                  data: {
                    name: data.name,
                    type: data.type || 'PERKUMPULAN',
                    category: data.category || 'FREE',
                    ketuaId: data.ketuaId,
                    aktaNotaris: data.aktaNotaris || null,
                    nomorAhu: data.nomorAhu || null,
                    nomorNpwp: data.nomorNpwp || null,
                    domisili: data.domisili || null,
                    kontakPj: data.kontakPj || null,
                    description: data.description || null,
                    joinFee: Number(data.joinFee || 0),
                    monthlyFee: Number(data.monthlyFee || 0),
                    simpananPokok: Number(data.simpananPokok || 100000),
                    simpananWajib: Number(data.simpananWajib || 25000),
                    minCoinForLoan: Number(data.minCoinForLoan || 1000),
                    minCoinRequired: Number(data.minCoinRequired || 100),
                    isVerified: Boolean(data.isVerified),
                    isSuspended: Boolean(data.isSuspended)
                  }
                })
      },
      async () => {
        const newComm = {
              id: `comm-${Date.now()}`,
              name: data.name,
              type: data.type || 'PERKUMPULAN',
              category: data.category || 'FREE',
              ketuaId: data.ketuaId,
              aktaNotaris: data.aktaNotaris || null,
              nomorAhu: data.nomorAhu || null,
              nomorNpwp: data.nomorNpwp || null,
              domisili: data.domisili || null,
              kontakPj: data.kontakPj || null,
              description: data.description || null,
              joinFee: Number(data.joinFee || 0),
              monthlyFee: Number(data.monthlyFee || 0),
              simpananPokok: Number(data.simpananPokok || 100000),
              simpananWajib: Number(data.simpananWajib || 25000),
              coinBalance: 0,
              minCoinForLoan: Number(data.minCoinForLoan || 1000),
              minCoinRequired: Number(data.minCoinRequired || 100),
              isVerified: Boolean(data.isVerified),
              isSuspended: Boolean(data.isSuspended),
              createdAt: new Date(),
              updatedAt: new Date()
            }
            if (!(globalThis as any).__mockCommunities) {
              (globalThis as any).__mockCommunities = []
            }
            (globalThis as any).__mockCommunities.push(newComm)
            return newComm
      }
    )
  },

  async updateCommunityAdmin(id: string, data: any) {
    return withMutationFallback(
      async () => {
        const updated = await db.community.update({
                  where: { id },
                  data: {
                    name: data.name,
                    type: data.type,
                    category: data.category,
                    ketuaId: data.ketuaId,
                    aktaNotaris: data.aktaNotaris,
                    nomorAhu: data.nomorAhu,
                    nomorNpwp: data.nomorNpwp,
                    domisili: data.domisili,
                    kontakPj: data.kontakPj,
                    description: data.description,
                    joinFee: typeof data.joinFee === 'number' ? data.joinFee : undefined,
                    monthlyFee: typeof data.monthlyFee === 'number' ? data.monthlyFee : undefined,
                    simpananPokok: typeof data.simpananPokok === 'number' ? data.simpananPokok : undefined,
                    simpananWajib: typeof data.simpananWajib === 'number' ? data.simpananWajib : undefined,
                    minCoinForLoan: typeof data.minCoinForLoan === 'number' ? data.minCoinForLoan : undefined,
                    minCoinRequired: typeof data.minCoinRequired === 'number' ? data.minCoinRequired : undefined,
                    isVerified: typeof data.isVerified === 'boolean' ? data.isVerified : undefined,
                    isSuspended: typeof data.isSuspended === 'boolean' ? data.isSuspended : undefined
                  }
                })
                if (data.isVerified && updated?.ketuaId) {
                  await db.user.update({
                    where: { id: updated.ketuaId },
                    data: { indukCommunityId: id }
                  })
                }
                return updated
      },
      async () => {
        const communities = (globalThis as any).__mockCommunities || []
            const comm = communities.find((c: any) => c.id === id)
            if (comm) {
              Object.assign(comm, data, { updatedAt: new Date() })
              if (data.isVerified && comm.ketuaId) {
                const ketuaUser = globalMockUsers.find((u: any) => u.id === comm.ketuaId)
                if (ketuaUser) {
                  (ketuaUser as any).indukCommunityId = id
                }
              }
              return comm
            }
            return null
      }
    )
  },

  async deleteCommunityAdmin(id: string) {
    return withMutationFallback(
      async () => {
        await db.community.delete({ where: { id } })
                return { success: true }
      },
      async () => {
        if ((globalThis as any).__mockCommunities) {
              (globalThis as any).__mockCommunities = (globalThis as any).__mockCommunities.filter((c: any) => c.id !== id)
              }
            return { success: true }
      }
    )
  },

  async getIndukCommunityMembers(communityId: string) {
    return withFallback(
      async () => {
        return await db.communityMembership.findMany({
                  where: { communityId },
                  include: { user: { select: { id: true, name: true, role: true, email: true, level: true, xp: true, image: true } } }
                })
      },
      async () => {
        const memberships = ((globalThis as any).__mockCommunityMemberships || []).filter((m: any) => m.communityId === communityId)
            return memberships.map((m: any) => {
              const user = globalMockUsers.find(u => u.id === m.userId)
              return {
                ...m,
                user: user ? { id: user.id, name: user.name, role: user.role, email: user.email, level: user.level, xp: user.xp, image: (user as any).image || (user as any).avatarUrl } : null
              }
            })
      }
    )
  },

  async isCommunityMember(userId: string, communityId: string) {
    return withFallback(
      async () => {
        const m = await db.communityMembership.findUnique({
                  where: { communityId_userId: { communityId, userId } }
                })
                return !!m
      },
      async () => {
        const memberships = (globalThis as any).__mockCommunityMemberships || []
            return memberships.some((m: any) => m.communityId === communityId && m.userId === userId)
      }
    )
  },

  async submitKyc(userId: string, ktpUrl: string, selfieUrl: string) {
    const isFailed = ktpUrl.toLowerCase().includes('fail') || ktpUrl.toLowerCase().includes('tolak') || ktpUrl.toLowerCase().includes('invalid');
        const finalStatus = isFailed ? 'REJECTED' : 'APPROVED';
    return withMutationFallback(
      async () => {
        return await db.user.update({
                  where: { id: userId },
                  data: {
                    kycStatus: finalStatus,
                    kycKtpUrl: ktpUrl,
                    kycSelfieUrl: selfieUrl,
                    kycSubmittedAt: new Date()
                  }
                })
      },
      async () => {
        const user = globalMockUsers.find(u => u.id === userId)
            if (user) {
              (user as any).kycStatus = finalStatus;
              (user as any).kycKtpUrl = ktpUrl;
              (user as any).kycSelfieUrl = selfieUrl;
              (user as any).kycSubmittedAt = new Date();
              user.updatedAt = new Date();
              return user
            }
            return null
      }
    )
  },

  async updateKycStatus(userId: string, status: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'VERIFIED', sessionId?: string) {
    return withMutationFallback(
      async () => {
        return await db.user.update({
                  where: { id: userId },
                  data: {
                    kycStatus: status as any,
                    ...(sessionId ? { kycSessionId: sessionId } as any : {}),
                    ...(status === 'VERIFIED' || status === 'APPROVED' ? { kycVerifiedAt: new Date() } as any : {}),
                  }
                })
      },
      async () => {
        const user = globalMockUsers.find(u => u.id === userId)
            if (user) {
              (user as any).kycStatus = status
              if (sessionId) (user as any).kycSessionId = sessionId
              if (status === 'VERIFIED' || status === 'APPROVED') (user as any).kycVerifiedAt = new Date()
              user.updatedAt = new Date()
              return user
            }
            return null
      }
    )
  },

  async getKycStatus(userId: string): Promise<{ status: string | null; sessionId: string | null; verifiedAt: Date | null }> {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        const u = await db.user.findUnique({ where: { id: userId } })
        if (u) {
          return {
            status: (u as any).kycStatus || null,
            sessionId: (u as any).kycSessionId || null,
            verifiedAt: (u as any).kycVerifiedAt || null,
          }
        }
      } catch (_) {}
    }
    const u = globalMockUsers.find(u => u.id === userId)
    return {
      status: (u as any)?.kycStatus || null,
      sessionId: (u as any)?.kycSessionId || null,
      verifiedAt: (u as any)?.kycVerifiedAt || null,
    }
  },

  async submitCooperativeLoan(data: { communityId: string, merchantId: string, amount: number, purpose: string }) {
    return withMutationFallback(
      async () => {
        return await db.cooperativeLoan.create({
                  data: {
                    communityId: data.communityId,
                    merchantId: data.merchantId,
                    amount: data.amount,
                    purpose: data.purpose,
                    status: 'PENDING'
                  }
                })
      },
      async () => {
        if (!(globalThis as any).__mockCooperativeLoans) {
              (globalThis as any).__mockCooperativeLoans = [];
            }
            const newLoan: { id: string; communityId: string; merchantId: string; amount: number; purpose: string; status: string; approvedByKetua: boolean; approvedByAdmin: boolean; createdAt: Date; updatedAt: Date } = {
              id: `loan-${Date.now()}`,
              communityId: data.communityId,
              merchantId: data.merchantId,
              amount: data.amount,
              purpose: data.purpose,
              status: 'PENDING',
              approvedByKetua: false,
              approvedByAdmin: false,
              createdAt: new Date(),
              updatedAt: new Date()
            };
            (globalThis as any).__mockCooperativeLoans.push(newLoan);
            return newLoan;
      }
    )
  },

  async getCooperativeLoans(communityId?: string, merchantId?: string) {
    return withFallback(
      async () => {
        const where: any = {}
                if (communityId) where.communityId = communityId
                if (merchantId) where.merchantId = merchantId
                return await db.cooperativeLoan.findMany({
                  where,
                  orderBy: { createdAt: 'desc' },
                  include: {
                    community: { select: { id: true, name: true } }
                  }
                })
      },
      async () => {
        let loans = (globalThis as any).__mockCooperativeLoans || []
            if (communityId) loans = loans.filter((l: any) => l.communityId === communityId)
            if (merchantId) loans = loans.filter((l: any) => l.merchantId === merchantId)
            const communities = (globalThis as any).__mockCommunities || []
            return loans.map((l: any) => ({
              ...l,
              community: communities.find((c: any) => c.id === l.communityId) || null
            })).sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime())
      }
    )
  },

  async getCooperativeLoanById(id: string) {
    return withFallback(
      async () => {
        return await db.cooperativeLoan.findUnique({
                  where: { id },
                  include: {
                    community: true
                  }
                })
      },
      async () => {
        const loans = (globalThis as any).__mockCooperativeLoans || []
            const loan = loans.find((l: any) => l.id === id)
            if (!loan) return null
            const communities = (globalThis as any).__mockCommunities || []
            return {
              ...loan,
              community: communities.find((c: any) => c.id === loan.communityId) || null
            }
      }
    )
  },

  async updateCooperativeLoanStatus(loanId: string, status: 'PENDING' | 'APPROVED_KETUA' | 'APPROVED_ADMIN' | 'DISBURSED' | 'REJECTED', approvedByKetua: boolean, approvedByAdmin: boolean) {
    return withMutationFallback(
      async () => {
        return await db.cooperativeLoan.update({
                  where: { id: loanId },
                  data: {
                    status: status as any,
                    approvedByKetua,
                    approvedByAdmin
                  }
                })
      },
      async () => {
        const loans = (globalThis as any).__mockCooperativeLoans || []
            const loan = loans.find((l: any) => l.id === loanId)
            if (loan) {
              loan.status = status
              loan.approvedByKetua = approvedByKetua
              loan.approvedByAdmin = approvedByAdmin
              loan.updatedAt = new Date()
              return loan
            }
            return null
      }
    )
  },


  // ═══════════════════════════════════════════════════════════════════════════
  // COIN SYSTEM (Revisi Pert Kelima)
  // ═══════════════════════════════════════════════════════════════════════════

  async getUserCoinBalance(userId: string): Promise<number> {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        const u = await db.user.findUnique({ where: { id: userId }, select: { coinBalance: true } as any })
        return (u as any)?.coinBalance || 0
      } catch (_) {}
    }
    const user = globalMockUsers.find(u => u.id === userId)
    return (user as any)?.coinBalance || 0
  },

  async getCommunityCoinBalance(communityId: string): Promise<{ coinBalance: number; minCoinForLoan: number } | null> {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        const c = await db.community.findUnique({
          where: { id: communityId },
          select: { coinBalance: true, minCoinForLoan: true } as any
        })
        if (!c) return null
        return { coinBalance: (c as any).coinBalance || 0, minCoinForLoan: (c as any).minCoinForLoan || 1000 }
      } catch (_) {}
    }
    const communities = (globalThis as any).__mockCommunities || []
    const c = communities.find((c: any) => c.id === communityId)
    if (!c) return null
    return { coinBalance: c.coinBalance || 0, minCoinForLoan: c.minCoinForLoan || 1000 }
  },

  async getCoinTransactions(userId: string): Promise<any[]> {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        return await (db as any).coinTransaction.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 50
        })
      } catch (_) {}
    }
    const txs = (globalThis as any).__mockCoinTransactions || []
    return txs.filter((t: any) => t.userId === userId).sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime())
  },

  async topupCommunityCoin(data: {
    communityId: string
    ketuaId: string
    jumlahCoin: number
    totalBiaya: number
    description: string
  }) {
    return withMutationFallback(
      async () => {
        await db.$transaction(async (tx: any) => {
                  // Tambah coin ke komunitas
                  await tx.community.update({
                    where: { id: data.communityId },
                    data: { coinBalance: { increment: data.jumlahCoin } }
                  })
                  // Catat transaksi coin
                  await tx.coinTransaction.create({
                    data: {
                      type: 'TOPUP',
                      amount: data.jumlahCoin,
                      description: data.description,
                      userId: data.ketuaId,
                      communityId: data.communityId,
                    }
                  })
                })
                return { newCoinBalance: data.jumlahCoin }
      },
      async () => {
        // Mock DB
            if (!(globalThis as any).__mockCoinTransactions) (globalThis as any).__mockCoinTransactions = []
            const communities = (globalThis as any).__mockCommunities || []
            const community = communities.find((c: any) => c.id === data.communityId)
            if (community) {
              community.coinBalance = (community.coinBalance || 0) + data.jumlahCoin
              community.updatedAt = new Date()
            }
            const tx = {
              id: `coin-tx-${Date.now()}`,
              type: 'TOPUP',
              amount: data.jumlahCoin,
              description: data.description,
              userId: data.ketuaId,
              communityId: data.communityId,
              createdAt: new Date()
            }
            ;(globalThis as any).__mockCoinTransactions.push(tx)
            return { newCoinBalance: community?.coinBalance || data.jumlahCoin, tx }
      }
    )
  },

  async rewardUserInviteCoin(data: {
    referrerId: string
    referredId: string
    coinAmount: number
  }) {
    return withMutationFallback(
      async () => {
        await db.$transaction(async (tx: any) => {
                  // Cek duplikasi
                  const existing = await tx.userReferral.findUnique({
                    where: { referrerId_referredId: { referrerId: data.referrerId, referredId: data.referredId } }
                  })
                  if (existing) return existing
        
                  // Tambah coin ke pengundang
                  await tx.user.update({
                    where: { id: data.referrerId },
                    data: { coinBalance: { increment: data.coinAmount } }
                  })
                  // Catat referral
                  const ref = await tx.userReferral.create({
                    data: {
                      referrerId: data.referrerId,
                      referredId: data.referredId,
                      coinAwarded: data.coinAmount,
                      isRewarded: true
                    }
                  })
                  // Catat transaksi coin
                  await tx.coinTransaction.create({
                    data: {
                      type: 'REWARD_USER_INVITE',
                      amount: data.coinAmount,
                      description: `Reward mengundang user baru`,
                      userId: data.referrerId,
                      relatedUserId: data.referredId,
                    }
                  })
                  return ref
                })
                return { rewarded: true, coinAmount: data.coinAmount }
      },
      async () => {
        // Mock DB
            if (!(globalThis as any).__mockCoinTransactions) (globalThis as any).__mockCoinTransactions = []
            if (!(globalThis as any).__mockUserReferrals) (globalThis as any).__mockUserReferrals = []
        
            const existingRef = ((globalThis as any).__mockUserReferrals || [])
              .find((r: any) => r.referrerId === data.referrerId && r.referredId === data.referredId)
            if (existingRef) return { rewarded: false, message: 'Sudah pernah diundang' }
        
            const referrer = globalMockUsers.find(u => u.id === data.referrerId)
            if (referrer) {
              (referrer as any).coinBalance = ((referrer as any).coinBalance || 0) + data.coinAmount
              referrer.updatedAt = new Date()
            }
            ;(globalThis as any).__mockUserReferrals.push({
              id: `ref-${Date.now()}`,
              referrerId: data.referrerId,
              referredId: data.referredId,
              coinAwarded: data.coinAmount,
              isRewarded: true,
              createdAt: new Date()
            })
            ;(globalThis as any).__mockCoinTransactions.push({
              id: `coin-tx-${Date.now()}`,
              type: 'REWARD_USER_INVITE',
              amount: data.coinAmount,
              description: `Reward mengundang user baru`,
              userId: data.referrerId,
              relatedUserId: data.referredId,
              createdAt: new Date()
            })
            return { rewarded: true, coinAmount: data.coinAmount }
      }
    )
  },

  async rewardMerchantInvite(data: {
    inviterId: string
    inviteeId: string
    communityId: string
  }) {
    const communities = (globalThis as any).__mockCommunities || []
        const community = communities.find((c: any) => c.id === data.communityId)
        const communityType = community?.type || 'PERKUMPULAN'
        const isKoperasi = communityType === 'KOPERASI'
    
        // Reward: COIN untuk PERKUMPULAN, SALDO untuk KOPERASI
        const rewardType = isKoperasi ? 'SALDO' : 'COIN'
        const rewardAmount = 3.0 // 3 coin (karena max 2 tier sekarang)
    return withMutationFallback(
      async () => {
        await db.$transaction(async (tx: any) => {
                  // Cek duplikasi
                  const existing = await (tx as any).merchantInvite.findFirst({
                    where: { inviterId: data.inviterId, inviteeId: data.inviteeId, communityId: data.communityId }
                  })
                  if (existing) return existing
        
                  // Verifikasi invitee join komunitas yang sama
                  const inviteeMembership = await tx.communityMembership.findUnique({
                    where: { communityId_userId: { communityId: data.communityId, userId: data.inviteeId } }
                  })
                  if (!inviteeMembership) throw new Error('Merchant yang diundang belum bergabung ke komunitas ini.')
        
                  if (isKoperasi) {
                    // Reward saldo wallet dari kas koperasi
                    const koperasi = await tx.community.findUnique({ where: { id: data.communityId } })
                    const kasBalance = (koperasi as any)?.coinBalance || 0
                    if (kasBalance < rewardAmount) throw new Error('Kas koperasi tidak mencukupi untuk reward.')
        
                    // Otomatis kurangi saldo kas koin koperasi
                    await tx.community.update({
                      where: { id: data.communityId },
                      data: { coinBalance: { decrement: rewardAmount } }
                    })
        
                    // Tambah saldo wallet pengundang
                    await tx.wallet.update({
                      where: { userId: data.inviterId },
                      data: { balance: { increment: rewardAmount * 1500 } } // convert ke rupiah
                    })
                    // Catat wallet transaction
                    await tx.walletTransaction.create({
                      data: {
                        amount: rewardAmount * 1500,
                        type: 'COMMISSION',
                        description: `Reward mengundang merchant ke komunitas koperasi`,
                        wallet: { connect: { userId: data.inviterId } }
                      }
                    })
                  } else {
                    // Kurangi alokasi koin komunitas perkumpulan
                    const perkumpulan = await tx.community.findUnique({ where: { id: data.communityId } })
                    const kasBalance = (perkumpulan as any)?.coinBalance || 0
                    if (kasBalance < rewardAmount) throw new Error('Alokasi koin komunitas tidak mencukupi untuk reward.')
        
                    // Otomatis kurangi koin komunitas setelah dialokasikan
                    await tx.community.update({
                      where: { id: data.communityId },
                      data: { coinBalance: { decrement: rewardAmount } }
                    })
        
                    // Reward coin untuk pengundang
                    await tx.user.update({
                      where: { id: data.inviterId },
                      data: { coinBalance: { increment: rewardAmount } }
                    })
                    await (tx as any).coinTransaction.create({
                      data: {
                        type: 'REWARD_MERCHANT_INVITE',
                        amount: rewardAmount,
                        description: `Reward mengundang merchant ke komunitas`,
                        userId: data.inviterId,
                        communityId: data.communityId,
                        relatedUserId: data.inviteeId,
                      }
                    })
                  }
        
                  // Catat merchant invite log
                  await (tx as any).merchantInvite.create({
                    data: {
                      communityId: data.communityId,
                      communityType,
                      rewardType,
                      rewardAmount,
                      isRewarded: true,
                      inviterId: data.inviterId,
                      inviteeId: data.inviteeId,
                    }
                  })
                })
                return { rewarded: true, rewardType, rewardAmount }
      },
      async () => {
        // Mock DB
            if (!(globalThis as any).__mockCoinTransactions) (globalThis as any).__mockCoinTransactions = []
            if (!(globalThis as any).__mockMerchantInvites) (globalThis as any).__mockMerchantInvites = []
        
            const existing = ((globalThis as any).__mockMerchantInvites || [])
              .find((m: any) => m.inviterId === data.inviterId && m.inviteeId === data.inviteeId && m.communityId === data.communityId)
            if (existing) return { rewarded: false, message: 'Sudah pernah mengundang merchant ini ke komunitas ini.' }
        
            const inviter = globalMockUsers.find(u => u.id === data.inviterId)
            const targetCommunity = communities.find((c: any) => c.id === data.communityId)
        
            if (isKoperasi) {
              // Otomatis kurangi saldo kas koin koperasi
              if (targetCommunity) {
                targetCommunity.coinBalance = Math.max(0, (targetCommunity.coinBalance || 0) - rewardAmount)
              }
              // Tambah saldo wallet
              const inviterWallet = globalMockWallets.find(w => w.userId === data.inviterId)
              if (inviterWallet) inviterWallet.balance += rewardAmount * 1500
              globalMockWalletTransactions.push({
                id: `wt-${Date.now()}`,
                amount: rewardAmount * 1500,
                type: 'COMMISSION',
                description: `Reward mengundang merchant ke komunitas koperasi`,
                walletId: inviterWallet?.id || '',
                createdAt: new Date()
              })
            } else {
              // Otomatis kurangi koin alokasi komunitas
              if (targetCommunity) {
                targetCommunity.coinBalance = Math.max(0, (targetCommunity.coinBalance || 0) - rewardAmount)
              }
              // Tambah coin ke inviter
              if (inviter) (inviter as any).coinBalance = ((inviter as any).coinBalance || 0) + rewardAmount
              ;(globalThis as any).__mockCoinTransactions.push({
                id: `coin-tx-${Date.now()}`,
                type: 'REWARD_MERCHANT_INVITE',
                amount: rewardAmount,
                description: `Reward mengundang merchant ke komunitas`,
                userId: data.inviterId,
                communityId: data.communityId,
                relatedUserId: data.inviteeId,
                createdAt: new Date()
              })
            }
        
            ;(globalThis as any).__mockMerchantInvites.push({
              id: `mi-${Date.now()}`,
              communityId: data.communityId,
              communityType,
              rewardType,
              rewardAmount,
              isRewarded: true,
              inviterId: data.inviterId,
              inviteeId: data.inviteeId,
              createdAt: new Date()
            })
            return { rewarded: true, rewardType, rewardAmount }
      }
    )
  },

  // Voucher Methods
  async getAllCoinVouchers(): Promise<any[]> {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        return await (db as any).coinVoucher.findMany({
          orderBy: { createdAt: 'desc' }
        })
      } catch (_) {}
    }
    return (globalThis as any).__mockCoinVouchers || []
  },

  async getActiveCoinVouchers(): Promise<any[]> {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        return await (db as any).coinVoucher.findMany({
          where: { isActive: true },
          orderBy: { coinCost: 'asc' }
        })
      } catch (_) {}
    }
    return ((globalThis as any).__mockCoinVouchers || []).filter((v: any) => v.isActive)
  },

  async getCoinVoucherById(id: string): Promise<any | null> {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        return await (db as any).coinVoucher.findUnique({ where: { id } })
      } catch (_) {}
    }
    return ((globalThis as any).__mockCoinVouchers || []).find((v: any) => v.id === id) || null
  },

  async createCoinVoucher(data: {
    name: string
    description: string
    type: 'INTERNAL' | 'EXTERNAL'
    coinCost: number
    value: number
    code?: string
    maxRedemption: number
    validUntil?: Date
  }): Promise<any> {
    if (!(globalThis as any).__mockCoinVouchers) (globalThis as any).__mockCoinVouchers = []
    if (await isDbConnected()) {
      try {
        return await (db as any).coinVoucher.create({ data: { ...data, totalRedeemed: 0 } })
      } catch (_) {}
    }
    const voucher = {
      id: `voucher-${Date.now()}`,
      ...data,
      totalRedeemed: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    ;(globalThis as any).__mockCoinVouchers.push(voucher)
    return voucher
  },

  async toggleCoinVoucherActive(id: string) {
    return withFallback(
      async () => {
        const v = await (db as any).coinVoucher.findUnique({ where: { id } })
                return await (db as any).coinVoucher.update({ where: { id }, data: { isActive: !v.isActive } })
      },
      async () => {
        const vouchers = (globalThis as any).__mockCoinVouchers || []
            const v = vouchers.find((v: any) => v.id === id)
            if (v) { v.isActive = !v.isActive; v.updatedAt = new Date() }
            return { toggled: true, isActive: v?.isActive }
      }
    )
  },

  async redeemCoinVoucher(data: {
    userId: string
    voucherId: string
    coinSpent: number
    voucherType: string
    externalCode?: string
  }): Promise<any> {
    syncMockDb()
    // Generate klaim kode unik untuk INTERNAL
    const claimCode = data.voucherType === 'INTERNAL'
      ? `SALOKA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
      : data.externalCode

    if (await isDbConnected()) {
      try {
        return await db.$transaction(async (tx: any) => {
          await tx.user.update({
            where: { id: data.userId },
            data: { coinBalance: { decrement: data.coinSpent } }
          })
          await (tx as any).coinVoucher.update({
            where: { id: data.voucherId },
            data: { totalRedeemed: { increment: 1 } }
          })
          const redemption = await (tx as any).coinRedemption.create({
            data: {
              userId: data.userId,
              voucherId: data.voucherId,
              coinSpent: data.coinSpent,
              status: 'CLAIMED',
              claimCode,
              claimedAt: new Date(),
            }
          })
          await (tx as any).coinTransaction.create({
            data: {
              type: 'REDEEM_VOUCHER',
              amount: -data.coinSpent,
              description: `Tukar coin dengan voucher`,
              userId: data.userId,
              relatedVoucherId: data.voucherId,
            }
          })
          return { redemption, claimCode }
        })
      } catch (_) {}
    }

    // Mock DB
    if (!(globalThis as any).__mockCoinRedemptions) (globalThis as any).__mockCoinRedemptions = []
    if (!(globalThis as any).__mockCoinTransactions) (globalThis as any).__mockCoinTransactions = []

    const user = globalMockUsers.find(u => u.id === data.userId)
    if (user) (user as any).coinBalance = ((user as any).coinBalance || 0) - data.coinSpent

    const vouchers = (globalThis as any).__mockCoinVouchers || []
    const voucher = vouchers.find((v: any) => v.id === data.voucherId)
    if (voucher) voucher.totalRedeemed = (voucher.totalRedeemed || 0) + 1

    const redemption = {
      id: `redeem-${Date.now()}`,
      userId: data.userId,
      voucherId: data.voucherId,
      coinSpent: data.coinSpent,
      status: 'CLAIMED',
      claimCode,
      claimedAt: new Date(),
      createdAt: new Date()
    }
    ;(globalThis as any).__mockCoinRedemptions.push(redemption)
    ;(globalThis as any).__mockCoinTransactions.push({
      id: `coin-tx-${Date.now()}`,
      type: 'REDEEM_VOUCHER',
      amount: -data.coinSpent,
      description: `Tukar coin dengan voucher`,
      userId: data.userId,
      relatedVoucherId: data.voucherId,
      createdAt: new Date()
    })
    saveMockDb()
    return { redemption, claimCode }
  },

  async getUserCoinRedemptions(userId: string): Promise<any[]> {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        return await (db as any).coinRedemption.findMany({
          where: { userId },
          include: { voucher: true },
          orderBy: { createdAt: 'desc' }
        })
      } catch (_) {}
    }
    const redemptions = ((globalThis as any).__mockCoinRedemptions || []).filter((r: any) => r.userId === userId)
    const vouchers = (globalThis as any).__mockCoinVouchers || []
    return redemptions.map((r: any) => ({
      ...r,
      voucher: vouchers.find((v: any) => v.id === r.voucherId) || null
    })).sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime())
  },

  async getCoinAdminStats() {
    return withFallback(
      async () => {
        const [totalTx, totalRedemptions, recentTx] = await Promise.all([
                  (db as any).coinTransaction.count(),
                  (db as any).coinRedemption.count(),
                  (db as any).coinTransaction.findMany({ orderBy: { createdAt: 'desc' }, take: 10 })
                ])
                return { totalTx, totalRedemptions, recentTx }
      },
      async () => {
        const txs = (globalThis as any).__mockCoinTransactions || []
            const redemptions = (globalThis as any).__mockCoinRedemptions || []
            return {
              totalTx: txs.length,
              totalRedemptions: redemptions.length,
              recentTx: txs.slice(-10).reverse()
            }
      }
    )
  },

  // Username methods
  async findUserByUsername(username: string): Promise<any | null> {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        return await db.user.findFirst({ where: { username: username.toLowerCase() } as any })
      } catch (_) {}
    }
    return globalMockUsers.find(u => (u as any).username?.toLowerCase() === username.toLowerCase()) || null
  },

  async isUsernameTaken(username: string, excludeUserId?: string): Promise<boolean> {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        const existing = await db.user.findFirst({
          where: { username: username.toLowerCase(), ...(excludeUserId ? { NOT: { id: excludeUserId } } : {}) } as any
        })
        return !!existing
      } catch (_) {}
    }
    return globalMockUsers.some(u =>
      (u as any).username?.toLowerCase() === username.toLowerCase() &&
      (!excludeUserId || u.id !== excludeUserId)
    )
  },

  async setUsername(userId: string, username: string): Promise<any> {
    syncMockDb()
    if (await isDbConnected()) {
      try {
        return await db.user.update({ where: { id: userId }, data: { username: username.toLowerCase() } as any })
      } catch (_) {}
    }
    const user = globalMockUsers.find(u => u.id === userId)
    if (user) {
      (user as any).username = username.toLowerCase()
      user.updatedAt = new Date()
      saveMockDb()
      return user
    }
    return null
  },

  async getInvoiceMemberships(status?: string) {
    return withFallback(
      async () => {
        const where: any = {}
                if (status) where.invoiceStatus = status
                return await db.communityMembership.findMany({
                  where,
                  include: {
                    community: { select: { id: true, name: true, type: true } },
                    user: { select: { id: true, name: true, email: true, role: true } }
                  },
                  orderBy: { joinedAt: 'desc' }
                })
      },
      async () => {
        let memberships = (globalThis as any).__mockCommunityMemberships || []
            if (status) memberships = memberships.filter((m: any) => m.invoiceStatus === status)
            const communities = (globalThis as any).__mockCommunities || []
            return memberships.map((m: any) => {
              const user = globalMockUsers.find(u => u.id === m.userId)
              const community = communities.find((c: any) => c.id === m.communityId)
              return {
                ...m,
                user: user ? { id: user.id, name: user.name, email: user.email, role: user.role } : null,
                community: community ? { id: community.id, name: community.name, type: community.type } : null
              }
            }).sort((a: any, b: any) => b.joinedAt.getTime() - a.joinedAt.getTime())
      }
    )
  },

  async verifyInvoiceMembership(membershipId: string, adminId: string) {
    return withMutationFallback(
      async () => {
        const membership = await db.communityMembership.update({
                  where: { id: membershipId },
                  data: {
                    isPaid: true,
                    invoiceStatus: 'VERIFIED',
                    invoiceVerifiedAt: new Date(),
                    invoiceVerifiedBy: adminId
                  },
                  include: {
                    community: true,
                    user: true
                  }
                })
        
                // Trigger multi-tier community referral distribution
                if (membership.community.category === 'PAID' || membership.community.type === 'KOPERASI') {
                  await this.processMultiTierCommunityReferral({
                    communityId: membership.community.id,
                    buyerId: membership.user.id,
                    totalFee: membership.community.joinFee || 100000
                  })
                }
                return { success: true, membership }
      },
      async () => {
        // Mock DB
            const memberships = (globalThis as any).__mockCommunityMemberships || []
            const m = memberships.find((x: any) => x.id === membershipId)
            if (!m) throw new Error('Keanggotaan tidak ditemukan.')
        
            m.isPaid = true
            m.invoiceStatus = 'VERIFIED'
            m.invoiceVerifiedAt = new Date()
            m.invoiceVerifiedBy = adminId
        
            const communities = (globalThis as any).__mockCommunities || []
            const community = communities.find((c: any) => c.id === m.communityId)
            const userObj = globalMockUsers.find(u => u.id === m.userId)
        
            if (community && (community.type === 'KOPERASI' || community.category === 'PAID') && userObj && userObj.parentAffiliateId) {
              const referrerId = userObj.parentAffiliateId
              if ((community.coinBalance || 0) >= 3) {
                community.coinBalance = (community.coinBalance || 0) - 3
                if (community.coinBalance <= 0) community.isRecruitmentLocked = true
                
                const referrer = globalMockUsers.find(u => u.id === referrerId)
                if (referrer) {
                  referrer.coinBalance = (referrer.coinBalance || 0) + 3
                }
        
                if (!(globalThis as any).__mockCoinTransactions) (globalThis as any).__mockCoinTransactions = []
                ;(globalThis as any).__mockCoinTransactions.push({
                  id: `ctx-${Date.now()}-1`,
                  type: 'REFERRAL_COMMISSION',
                  amount: 3,
                  description: `Komisi referral cross-community dari pendaftaran ${userObj.name} ke ${community.name}`,
                  userId: referrerId,
                  relatedUserId: userObj.id,
                  createdAt: new Date()
                 }, {
                  id: `ctx-${Date.now()}-2`,
                  type: 'REFERRAL_COMMISSION',
                  amount: -3,
                  description: `Biaya komisi referral untuk anggota baru ${userObj.name}`,
                  userId: community.ketuaId,
                  communityId: community.id,
                  relatedUserId: userObj.id,
                  createdAt: new Date()
                })
              }
            }
        
            return { success: true, membership: m }
      }
    )
  },

  async getAllCoinHolders() {
    return withFallback(
      async () => {
        const [users, communities] = await Promise.all([
                  db.user.findMany({
                    where: { coinBalance: { gt: 0 } },
                    select: { id: true, name: true, role: true, coinBalance: true }
                  }),
                  db.community.findMany({
                    where: { coinBalance: { gt: 0 } },
                    select: { id: true, name: true, type: true, coinBalance: true }
                  })
                ])
        
                const holders: any[] = []
                users.forEach(u => {
                  holders.push({
                    id: u.id,
                    name: u.name,
                    type: `MERCHANT/USER (${u.role})`,
                    coinBalance: u.coinBalance,
                    status: 'ACTIVE'
                  })
                })
                communities.forEach(c => {
                  holders.push({
                    id: c.id,
                    name: c.name,
                    type: `KOMUNITAS (${c.type})`,
                    coinBalance: c.coinBalance,
                    status: 'ACTIVE'
                  })
                })
                return holders
      },
      async () => {
        // Mock DB
            const holders: any[] = []
            globalMockUsers.forEach(u => {
              if ((u.coinBalance || 0) > 0) {
                holders.push({
                  id: u.id,
                  name: u.name,
                  type: `MERCHANT/USER (${u.role})`,
                  coinBalance: u.coinBalance,
                  status: 'ACTIVE'
                })
              }
            })
            const communities = (globalThis as any).__mockCommunities || []
            communities.forEach((c: any) => {
              if ((c.coinBalance || 0) > 0) {
                holders.push({
                  id: c.id,
                  name: c.name,
                  type: `KOMUNITAS (${c.type})`,
                  coinBalance: c.coinBalance,
                  status: 'ACTIVE'
                })
              }
            })
            return holders
      }
    )
  },

  async injectCoin(targetId: string, targetType: 'USER' | 'COMMUNITY', amount: number, reason: string, adminId: string) {
    const desc = `INJECT oleh Admin: ${reason}`
    return withMutationFallback(
      async () => {
        if (targetType === 'USER') {
                  const u = await db.user.update({
                    where: { id: targetId },
                    data: { coinBalance: { increment: amount } }
                  })
                  await db.coinTransaction.create({
                    data: {
                      type: 'INJECTION',
                      amount,
                      description: desc,
                      userId: targetId
                    }
                  })
                  return u
                } else {
                  const c = await db.community.update({
                    where: { id: targetId },
                    data: { 
                      coinBalance: { increment: amount },
                      isRecruitmentLocked: false
                    } as any
                  })
                  await db.coinTransaction.create({
                    data: {
                      type: 'INJECTION',
                      amount,
                      description: desc,
                      userId: adminId,
                      communityId: targetId
                    }
                  })
                  return c
                }
      },
      async () => {
        // Mock DB
            if (targetType === 'USER') {
              const u = globalMockUsers.find(x => x.id === targetId)
              if (!u) throw new Error('User tidak ditemukan.')
              u.coinBalance = (u.coinBalance || 0) + amount
              
              if (!(globalThis as any).__mockCoinTransactions) (globalThis as any).__mockCoinTransactions = []
              ;(globalThis as any).__mockCoinTransactions.push({
                id: `ctx-${Date.now()}`,
                type: 'INJECTION',
                amount,
                description: desc,
                userId: targetId,
                createdAt: new Date()
              })
              return u
            } else {
              const communities = (globalThis as any).__mockCommunities || []
              const c = communities.find((x: any) => x.id === targetId)
              if (!c) throw new Error('Komunitas tidak ditemukan.')
              c.coinBalance = (c.coinBalance || 0) + amount
              c.isRecruitmentLocked = false
              
              if (!(globalThis as any).__mockCoinTransactions) (globalThis as any).__mockCoinTransactions = []
              ;(globalThis as any).__mockCoinTransactions.push({
                id: `ctx-${Date.now()}`,
                type: 'INJECTION',
                amount,
                description: desc,
                userId: adminId,
                communityId: targetId,
                createdAt: new Date()
              })
              return c
            }
      }
    )
  },

  async getAdmins() {
    return withFallback(
      async () => {
        const admins = await db.user.findMany({
                  where: { role: 'ADMIN' },
                  select: { id: true, name: true, email: true, role: true, isSuperAdmin: true, adminPermissions: true, createdAt: true }
                })
                return admins.map(a => {
                  const emailLower = (a.email || '').toLowerCase()
                  const nameLower = (a.name || '').toLowerCase()
                  const isSuper = a.isSuperAdmin === true || 
                                  emailLower === 'admin@saloka.com' || 
                                  emailLower === 'admin@teras.com' || 
                                  nameLower.includes('super') ||
                                  a.isSuperAdmin !== false
                  return {
                    ...a,
                    isSuperAdmin: isSuper
                  }
                })
      },
      async () => {
        return globalMockUsers.filter(u => u.role === 'ADMIN').map(u => {
              const emailLower = (u.email || '').toLowerCase()
              const nameLower = (u.name || '').toLowerCase()
              const isSuper = (u as any).isSuperAdmin === true || 
                              emailLower === 'admin@saloka.com' || 
                              emailLower === 'admin@teras.com' || 
                              nameLower.includes('super') ||
                              (u as any).isSuperAdmin !== false
              return {
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role,
                isSuperAdmin: isSuper,
                adminPermissions: (u as any).adminPermissions || null,
                createdAt: u.createdAt
              }
            })
      }
    )
  },

  async createAdmin(data: { name: string, email: string, passwordHash: string, isSuperAdmin?: boolean, adminPermissions?: string | null }) {
    return withMutationFallback(
      async () => {
        const u = await db.user.create({
                  data: {
                    name: data.name,
                    email: data.email,
                    passwordHash: data.passwordHash,
                    role: 'ADMIN',
                    isSuperAdmin: data.isSuperAdmin ?? false,
                    adminPermissions: data.adminPermissions || null,
                    membershipLevel: 'Staff',
                    membershipAccess: 'Gold'
                  }
                })
                await db.wallet.create({ data: { userId: u.id, balance: 0.0 } })
                return u
      },
      async () => {
        // Mock DB
            const exists = globalMockUsers.some(u => u.email === data.email)
            if (exists) throw new Error('Email sudah terdaftar.')
        
            const newAdmin = {
              id: `admin-${Date.now()}`,
              email: data.email,
              name: data.name,
              passwordHash: data.passwordHash,
              role: 'ADMIN' as const,
              isSuperAdmin: data.isSuperAdmin ?? false,
              adminPermissions: data.adminPermissions || null,
              level: 1, xp: 0,
              landingPageTemplate: null, landingPageConfig: null, landingPageSetup: false,
              parentAffiliateId: null,
              membershipLevel: 'Staff',
              membershipAccess: 'Gold',
              createdAt: new Date(),
              updatedAt: new Date()
            }
            globalMockUsers.push(newAdmin)
            return newAdmin
      }
    )
  },

  async updateAdmin(id: string, data: { name?: string; email?: string; isSuperAdmin?: boolean; adminPermissions?: string | null; passwordHash?: string }) {
    return withMutationFallback(
      async () => {
        const updateData: any = {}
                if (data.name !== undefined) updateData.name = data.name
                if (data.email !== undefined) updateData.email = data.email
                if (data.isSuperAdmin !== undefined) updateData.isSuperAdmin = data.isSuperAdmin
                if (data.adminPermissions !== undefined) updateData.adminPermissions = data.adminPermissions
                if (data.passwordHash) updateData.passwordHash = data.passwordHash
        
                return await db.user.update({
                  where: { id },
                  data: updateData
                })
      },
      async () => {
        const admin = globalMockUsers.find(u => u.id === id)
            if (!admin) throw new Error('Admin tidak ditemukan.')
            if (data.name !== undefined) admin.name = data.name
            if (data.email !== undefined) admin.email = data.email
            if (data.isSuperAdmin !== undefined) (admin as any).isSuperAdmin = data.isSuperAdmin
            if (data.adminPermissions !== undefined) (admin as any).adminPermissions = data.adminPermissions
            if (data.passwordHash) admin.passwordHash = data.passwordHash
            return admin
      }
    )
  },

  async deleteAdmin(id: string) {
    return withMutationFallback(
      async () => {
        return await db.user.delete({ where: { id } })
      },
      async () => {
        // Mock DB
            const index = globalMockUsers.findIndex(u => u.id === id)
            if (index === -1) throw new Error('Admin tidak ditemukan.')
            const deleted = globalMockUsers.splice(index, 1)[0]
            return deleted
      }
    )
  },

  async createLevelRequest(data: { userId: string, targetLevel: number, radiusKm: number, omsetBulan: number, hasLegalitas: boolean, hasSertifikat: boolean, hasDesain: boolean, catatan?: string }) {
    return withMutationFallback(
      async () => {
        return await db.merchantLevelRequest.create({
                  data: {
                    userId: data.userId,
                    targetLevel: data.targetLevel,
                    radiusKm: data.radiusKm,
                    omsetBulan: data.omsetBulan,
                    hasLegalitas: data.hasLegalitas,
                    hasSertifikat: data.hasSertifikat,
                    hasDesain: data.hasDesain,
                    catatan: data.catatan || null
                  }
                })
      },
      async () => {
        // Mock DB
            if (!(globalThis as any).__mockLevelRequests) (globalThis as any).__mockLevelRequests = []
            const newRequest = {
              id: `req-${Date.now()}`,
              userId: data.userId,
              targetLevel: data.targetLevel,
              status: 'PENDING',
              radiusKm: data.radiusKm,
              omsetBulan: data.omsetBulan,
              hasLegalitas: data.hasLegalitas,
              hasSertifikat: data.hasSertifikat,
              hasDesain: data.hasDesain,
              catatan: data.catatan || null,
              createdAt: new Date(),
              updatedAt: new Date()
            }
            ;(globalThis as any).__mockLevelRequests.push(newRequest)
            return newRequest
      }
    )
  },

  async getLevelRequests(status?: string) {
    return withFallback(
      async () => {
        const where: any = {}
                if (status) where.status = status
                return await db.merchantLevelRequest.findMany({
                  where,
                  include: { user: { select: { id: true, name: true, email: true, role: true, merchantLevel: true } } },
                  orderBy: { createdAt: 'desc' }
                })
      },
      async () => {
        // Mock DB
            let reqs = (globalThis as any).__mockLevelRequests || []
            if (status) reqs = reqs.filter((r: any) => r.status === status)
            return reqs.map((r: any) => {
              const userObj = globalMockUsers.find(u => u.id === r.userId)
              return {
                ...r,
                user: userObj ? { id: userObj.id, name: userObj.name, email: userObj.email, role: userObj.role, merchantLevel: userObj.merchantLevel || 0 } : null
              }
            }).sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime())
      }
    )
  },

  async approveLevelRequest(requestId: string, adminId: string) {
    return withMutationFallback(
      async () => {
        const req = await db.merchantLevelRequest.update({
                  where: { id: requestId },
                  data: {
                    status: 'APPROVED',
                    reviewedAt: new Date(),
                    reviewedBy: adminId
                  }
                })
                // Update user merchant level
                await db.user.update({
                  where: { id: req.userId },
                  data: { merchantLevel: req.targetLevel, levelApprovedAt: new Date(), levelApprovedBy: adminId }
                })
                return req
      },
      async () => {
        // Mock DB
            const reqs = (globalThis as any).__mockLevelRequests || []
            const req = reqs.find((r: any) => r.id === requestId)
            if (!req) throw new Error('Pengajuan tidak ditemukan.')
            req.status = 'APPROVED'
            req.reviewedAt = new Date()
            req.reviewedBy = adminId
            
            const userObj = globalMockUsers.find(u => u.id === req.userId)
            if (userObj) {
              ;(userObj as any).merchantLevel = req.targetLevel
              ;(userObj as any).levelApprovedAt = new Date()
              ;(userObj as any).levelApprovedBy = adminId
            }
            return req
      }
    )
  },

  async rejectLevelRequest(requestId: string, note: string, adminId: string) {
    return withMutationFallback(
      async () => {
        return await db.merchantLevelRequest.update({
                  where: { id: requestId },
                  data: {
                    status: 'REJECTED',
                    reviewNote: note,
                    reviewedAt: new Date(),
                    reviewedBy: adminId
                  }
                })
      },
      async () => {
        // Mock DB
            const reqs = (globalThis as any).__mockLevelRequests || []
            const req = reqs.find((r: any) => r.id === requestId)
            if (!req) throw new Error('Pengajuan tidak ditemukan.')
            req.status = 'REJECTED'
            req.reviewNote = note
            req.reviewedAt = new Date()
            req.reviewedBy = adminId
            return req
      }
    )
  },

  // ─── SHU KOPERASI RAT DATASTORE METHODS ────────────────────────────────────
  async upsertShuConfig(data: {
    communityId: string
    year: number
    totalNetProfit: number
    pctCadangan?: number
    pctJasaModal?: number
    pctJasaUsaha?: number
    pctPengurus?: number
    pctPengawas?: number
    pctKaryawan?: number
    pctPendidikan?: number
    pctSosial?: number
    pctPembangunanDaerah?: number
  }) {
    return withMutationFallback(
      async () => {
        return await db.shuConfig.upsert({
                  where: {
                    communityId_year: {
                      communityId: data.communityId,
                      year: data.year
                    }
                  },
                  create: {
                    communityId: data.communityId,
                    year: data.year,
                    totalNetProfit: data.totalNetProfit,
                    pctCadangan: data.pctCadangan ?? 25.0,
                    pctJasaModal: data.pctJasaModal ?? 20.0,
                    pctJasaUsaha: data.pctJasaUsaha ?? 30.0,
                    pctPengurus: data.pctPengurus ?? 10.0,
                    pctPengawas: data.pctPengawas ?? 5.0,
                    pctKaryawan: data.pctKaryawan ?? 5.0,
                    pctPendidikan: data.pctPendidikan ?? 2.5,
                    pctSosial: data.pctSosial ?? 2.5,
                    pctPembangunanDaerah: data.pctPembangunanDaerah ?? 0.0
                  },
                  update: {
                    totalNetProfit: data.totalNetProfit,
                    pctCadangan: data.pctCadangan ?? 25.0,
                    pctJasaModal: data.pctJasaModal ?? 20.0,
                    pctJasaUsaha: data.pctJasaUsaha ?? 30.0,
                    pctPengurus: data.pctPengurus ?? 10.0,
                    pctPengawas: data.pctPengawas ?? 5.0,
                    pctKaryawan: data.pctKaryawan ?? 5.0,
                    pctPendidikan: data.pctPendidikan ?? 2.5,
                    pctSosial: data.pctSosial ?? 2.5,
                    pctPembangunanDaerah: data.pctPembangunanDaerah ?? 0.0
                  }
                })
      },
      async () => {
        const configs = (globalThis as any).__mockShuConfigs || []
            let config = configs.find((c: any) => c.communityId === data.communityId && c.year === data.year)
            if (config) {
              Object.assign(config, data, { updatedAt: new Date() })
            } else {
              config = {
                id: `shu-cfg-${Date.now()}`,
                ...data,
                createdAt: new Date(),
                updatedAt: new Date()
              }
              configs.push(config)
              ;(globalThis as any).__mockShuConfigs = configs
            }
            return config
      }
    )
  },

  async saveShuMemberDistributions(shuConfigId: string, distributions: Array<{
    communityId: string
    userId: string
    year: number
    simpananMember: number
    simpananTotalCommunity: number
    shuJasaModalAmount: number
    transaksiMember: number
    transaksiTotalCommunity: number
    shuJasaUsahaAmount: number
    totalShuAmount: number
  }>) {
    return withMutationFallback(
      async () => {
        await db.shuMemberDistribution.deleteMany({
                  where: { shuConfigId }
                })
                await db.shuMemberDistribution.createMany({
                  data: distributions.map(d => ({
                    shuConfigId,
                    communityId: d.communityId,
                    userId: d.userId,
                    year: d.year,
                    simpananMember: d.simpananMember,
                    simpananTotalCommunity: d.simpananTotalCommunity,
                    shuJasaModalAmount: d.shuJasaModalAmount,
                    transaksiMember: d.transaksiMember,
                    transaksiTotalCommunity: d.transaksiTotalCommunity,
                    shuJasaUsahaAmount: d.shuJasaUsahaAmount,
                    totalShuAmount: d.totalShuAmount
                  }))
                })
                return { success: true }
      },
      async () => {
        const dists = (globalThis as any).__mockShuMemberDistributions || []
            const filtered = dists.filter((d: any) => d.shuConfigId !== shuConfigId)
            const newItems = distributions.map((d, idx) => ({
              id: `shu-dist-${Date.now()}-${idx}`,
              shuConfigId,
              ...d,
              createdAt: new Date()
            }))
            ;(globalThis as any).__mockShuMemberDistributions = [...filtered, ...newItems]
            return { success: true }
      }
    )
  },

  async getShuConfigByCommunityAndYear(communityId: string, year: number) {
    return withFallback(
      async () => {
        return await db.shuConfig.findUnique({
                  where: {
                    communityId_year: { communityId, year }
                  },
                  include: {
                    distributions: true
                  }
                })
      },
      async () => {
        const configs = (globalThis as any).__mockShuConfigs || []
            const cfg = configs.find((c: any) => c.communityId === communityId && c.year === year)
            if (cfg) {
              const dists = ((globalThis as any).__mockShuMemberDistributions || []).filter((d: any) => d.shuConfigId === cfg.id)
              return { ...cfg, distributions: dists }
            }
            return null
      }
    )
  },

  async getMemberShuDistribution(userId: string, communityId: string, year?: number) {
    return withFallback(
      async () => {
        return await db.shuMemberDistribution.findMany({
                  where: {
                    userId,
                    communityId,
                    ...(year ? { year } : {})
                  },
                  include: {
                    shuConfig: true
                  },
                  orderBy: { year: 'desc' }
                })
      },
      async () => {
        const dists = ((globalThis as any).__mockShuMemberDistributions || []).filter(
              (d: any) => d.userId === userId && d.communityId === communityId && (!year || d.year === year)
            )
            const configs = (globalThis as any).__mockShuConfigs || []
            return dists.map((d: any) => ({
              ...d,
              shuConfig: configs.find((c: any) => c.id === d.shuConfigId) || null
            }))
      }
    )
  },

  async getCommunityShuHistory(communityId: string) {
    return withFallback(
      async () => {
        return await db.shuConfig.findMany({
                  where: { communityId },
                  include: { distributions: true },
                  orderBy: { year: 'desc' }
                })
      },
      async () => {
        const configs = (globalThis as any).__mockShuConfigs || []
            return configs.filter((c: any) => c.communityId === communityId)
      }
    )
  },

  // ─── TRANSAKSI SIMPANAN KOPERASI DATASTORE METHODS ─────────────────────────
  async createSavingsTransaction(data: {
    communityId: string
    userId: string
    type?: string
    transactionType?: string
    amount: number
    date?: Date
    notes?: string
    createdById?: string
  }) {
    return withMutationFallback(
      async () => {
        return await (db as any).cooperativeSavingsTransaction.create({
                  data: {
                    communityId: data.communityId,
                    userId: data.userId,
                    type: data.type || 'WAJIB',
                    transactionType: data.transactionType || 'SETOR',
                    amount: Number(data.amount || 0),
                    date: data.date || new Date(),
                    notes: data.notes || '',
                    createdById: data.createdById || null
                  }
                })
      },
      async () => {
        const txs = (globalThis as any).__mockSavingsTransactions || []
            const newTx = {
              id: `sav-tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              communityId: data.communityId,
              userId: data.userId,
              type: data.type || 'WAJIB',
              transactionType: data.transactionType || 'SETOR',
              amount: Number(data.amount || 0),
              date: data.date || new Date(),
              notes: data.notes || '',
              createdById: data.createdById || null,
              createdAt: new Date(),
              updatedAt: new Date()
            }
            txs.unshift(newTx)
            ;(globalThis as any).__mockSavingsTransactions = txs
            return newTx
      }
    )
  },

  async getSavingsTransactions(communityId: string, userId?: string) {
    return withFallback(
      async () => {
        return await (db as any).cooperativeSavingsTransaction.findMany({
                  where: {
                    communityId,
                    ...(userId ? { userId } : {})
                  },
                  orderBy: { date: 'desc' }
                })
      },
      async () => {
        const txs = (globalThis as any).__mockSavingsTransactions || []
            return txs.filter((t: any) => t.communityId === communityId && (!userId || t.userId === userId))
      }
    )
  },

  async getShuConfigs(communityId: string) {
    return withFallback(
      async () => {
        return await db.shuConfig.findMany({
                  where: { communityId },
                  include: {
                    distributions: true
                  },
                  orderBy: { year: 'desc' }
                })
      },
      async () => {
        const configs = ((globalThis as any).__mockShuConfigs || []).filter((c: any) => c.communityId === communityId)
            const dists = (globalThis as any).__mockShuMemberDistributions || []
            return configs.map((c: any) => ({
              ...c,
              distributions: dists.filter((d: any) => d.shuConfigId === c.id)
            }))
      }
    )
  },

  // ─── DYNAMIC COMMUNITY METRICS & CRUD FOR PRODUCTS & FUNDING ──────────────
  async getCommunityRealStats(communityId: string) {
    syncMockDb()
    let activeMembersCount = 0
    let activeMerchantsCount = 0
    let totalSavingsCollected = 0
    let shuCurrentYearProfit = 0

    const currentYear = new Date().getFullYear()

    if (await isDbConnected()) {
      try {
        const memberships = await db.communityMembership.findMany({
          where: { communityId },
          include: { user: { select: { id: true, role: true } } }
        })
        activeMembersCount = memberships.length
        activeMerchantsCount = memberships.filter(m => m.user?.role === 'MERCHANT').length

        const shuDist = await db.shuMemberDistribution.findMany({
          where: { communityId, year: currentYear }
        })
        totalSavingsCollected = shuDist.reduce((sum, d) => sum + (d.simpananMember || 0), 0)

        const shuCfg = await db.shuConfig.findUnique({
          where: { communityId_year: { communityId, year: currentYear } }
        })
        shuCurrentYearProfit = shuCfg?.totalNetProfit || 0
      } catch (_) {}
    } else {
      const memberships = ((globalThis as any).__mockCommunityMemberships || []).filter((m: any) => m.communityId === communityId)
      activeMembersCount = memberships.length
      
      const allUsers = (globalThis as any).__mockUsers || globalMockUsers || []
      const memberUserIds = memberships.map((m: any) => m.userId)
      activeMerchantsCount = allUsers.filter((u: any) => memberUserIds.includes(u.id) && u.role === 'MERCHANT').length

      const shuDists = ((globalThis as any).__mockShuMemberDistributions || []).filter((d: any) => d.communityId === communityId && d.year === currentYear)
      totalSavingsCollected = shuDists.reduce((sum: number, d: any) => sum + (d.simpananMember || 0), 0)

      const shuConfigs = (globalThis as any).__mockShuConfigs || []
      const shuCfg = shuConfigs.find((c: any) => c.communityId === communityId && c.year === currentYear)
      shuCurrentYearProfit = shuCfg?.totalNetProfit || 0
    }

    return {
      activeMembersCount,
      activeMerchantsCount,
      totalSavingsCollected,
      shuCurrentYearProfit
    }
  },

  // ─── COOPERATIVE PRODUCTS (SIMPANAN) CRUD ──────────────────────────────────
  async getCooperativeProducts(communityId: string) {
    return withMutationFallback(
      async () => {
        const dbProds = await db.cooperativeProduct.findMany({
                  where: { communityId },
                  orderBy: { createdAt: 'asc' }
                })
                if (dbProds.length > 0) {
                  return dbProds
                }
                // Auto-create defaults for Koperasi and Perkumpulan Free in the real database
                const community = await db.community.findUnique({ where: { id: communityId } })
                if (community && (community.type === 'KOPERASI' || (community.type === 'PERKUMPULAN' && community.category === 'FREE'))) {
                  const defaultData = [
                    {
                      communityId,
                      name: 'Simpanan Pokok',
                      type: 'POKOK',
                      amount: Number(community.joinFee || 150000),
                      periodText: 'Sekali Bayar',
                      isMandatory: true,
                      isPremium: false,
                      description: 'Simpanan pokok dibayarkan satu kali saat mendaftar keanggotaan koperasi.'
                    },
                    {
                      communityId,
                      name: 'Simpanan Wajib',
                      type: 'WAJIB',
                      amount: Number(community.monthlyFee || 50000),
                      periodText: 'Iuran rutin setiap bulan',
                      isMandatory: true,
                      isPremium: false,
                      description: 'Simpanan wajib dibayarkan secara rutin setiap bulan oleh anggota koperasi.'
                    }
                  ]
        
                  let hasSukarela = false
                  if (community.landingPageConfig) {
                    try {
                      const cfg = JSON.parse(community.landingPageConfig)
                      if (cfg.coopTier === 'PLUS' || cfg.coopTier === 'PRO') {
                        hasSukarela = true
                      }
                    } catch (_) {}
                  }
        
                  if (hasSukarela) {
                    defaultData.push({
                      communityId,
                      name: 'Simpanan Sukarela',
                      type: 'SUKARELA',
                      amount: 0,
                      periodText: 'Bebas Nominal',
                      isMandatory: false,
                      isPremium: false,
                      description: 'Simpanan sukarela dapat disetorkan kapan saja dengan nominal bebas.'
                    })
                  }
        
                  const createdProds = []
                  for (const item of defaultData) {
                    const p = await db.cooperativeProduct.create({ data: item })
                    createdProds.push(p)
                  }
                  return createdProds
                }
                return []
      },
      async () => {
        let products = (globalThis as any).__mockCooperativeProducts || []
            let commProducts = products.filter((p: any) => p.communityId === communityId)
            if (commProducts.length === 0) {
              const communities = (globalThis as any).__mockCommunities || []
              const community = communities.find((c: any) => c.id === communityId)
              
              let hasSukarela = false
              if (community && community.landingPageConfig) {
                try {
                  const cfg = JSON.parse(community.landingPageConfig)
                  if (cfg.coopTier === 'PLUS' || cfg.coopTier === 'PRO') {
                    hasSukarela = true
                  }
                } catch (_) {}
              }
        
              commProducts = [
                {
                  id: `coop-prod-pokok-${communityId}`,
                  communityId,
                  name: 'Simpanan Pokok',
                  type: 'POKOK',
                  amount: community ? Number(community.joinFee || 150000) : 150000,
                  periodText: 'Sekali Bayar',
                  isMandatory: true,
                  isPremium: false,
                  description: 'Simpanan pokok dibayarkan satu kali saat mendaftar keanggotaan koperasi.',
                  createdAt: new Date(),
                  updatedAt: new Date()
                },
                {
                  id: `coop-prod-wajib-${communityId}`,
                  communityId,
                  name: 'Simpanan Wajib',
                  type: 'WAJIB',
                  amount: community ? Number(community.monthlyFee || 50000) : 50000,
                  periodText: 'Iuran rutin setiap bulan',
                  isMandatory: true,
                  isPremium: false,
                  description: 'Simpanan wajib dibayarkan rutin setiap bulan oleh seluruh anggota.',
                  createdAt: new Date(),
                  updatedAt: new Date()
                }
              ]
        
              if (hasSukarela) {
                commProducts.push({
                  id: `coop-prod-sukarela-${communityId}`,
                  communityId,
                  name: 'Simpanan Sukarela',
                  type: 'SUKARELA',
                  amount: 0,
                  periodText: 'Bebas Nominal',
                  isMandatory: false,
                  isPremium: false,
                  description: 'Simpanan sukarela dapat disetorkan kapan saja dengan nominal bebas.',
                  createdAt: new Date(),
                  updatedAt: new Date()
                })
              }
        
              products = [...products, ...commProducts]
              ;(globalThis as any).__mockCooperativeProducts = products
              }
            return commProducts
      }
    )
  },

  async createCooperativeProduct(data: {
    communityId: string
    name: string
    type: string
    amount: number
    periodText?: string
    isMandatory?: boolean
    isPremium?: boolean
    description?: string
  }) {
    return withMutationFallback(
      async () => {
        return await db.cooperativeProduct.create({
                  data: {
                    communityId: data.communityId,
                    name: data.name,
                    type: data.type || 'POKOK',
                    amount: Number(data.amount || 0),
                    periodText: data.periodText || null,
                    isMandatory: Boolean(data.isMandatory),
                    isPremium: Boolean(data.isPremium),
                    description: data.description || null
                  }
                })
      },
      async () => {
        const products = (globalThis as any).__mockCooperativeProducts || []
            const newP = {
              id: `coop-prod-${Date.now()}`,
              ...data,
              amount: Number(data.amount || 0),
              isMandatory: Boolean(data.isMandatory),
              isPremium: Boolean(data.isPremium),
              createdAt: new Date(),
              updatedAt: new Date()
            }
            products.push(newP)
            ;(globalThis as any).__mockCooperativeProducts = products
            return newP
      }
    )
  },

  async updateCooperativeProduct(id: string, data: any) {
    return withMutationFallback(
      async () => {
        return await db.cooperativeProduct.update({
                  where: { id },
                  data: {
                    name: data.name,
                    type: data.type,
                    amount: typeof data.amount === 'number' ? data.amount : undefined,
                    periodText: data.periodText,
                    isMandatory: typeof data.isMandatory === 'boolean' ? data.isMandatory : undefined,
                    isPremium: typeof data.isPremium === 'boolean' ? data.isPremium : undefined,
                    description: data.description
                  }
                })
      },
      async () => {
        const products = (globalThis as any).__mockCooperativeProducts || []
            const p = products.find((x: any) => x.id === id)
            if (p) {
              Object.assign(p, data, { updatedAt: new Date() })
              return p
            }
            return null
      }
    )
  },

  async deleteCooperativeProduct(id: string) {
    return withMutationFallback(
      async () => {
        await db.cooperativeProduct.delete({ where: { id } })
                return { success: true }
      },
      async () => {
        if ((globalThis as any).__mockCooperativeProducts) {
              ;(globalThis as any).__mockCooperativeProducts = (globalThis as any).__mockCooperativeProducts.filter((p: any) => p.id !== id)
              }
            return { success: true }
      }
    )
  },

  // ─── MERCHANT FUNDING PROJECTS CRUD ────────────────────────────────────────
  async getMerchantFundingProjects(communityId: string) {
    return withFallback(
      async () => {
        return await db.merchantFundingProject.findMany({
                  where: { communityId },
                  orderBy: { createdAt: 'desc' }
                })
      },
      async () => {
        const projects = (globalThis as any).__mockMerchantFundingProjects || []
            return projects.filter((p: any) => p.communityId === communityId)
      }
    )
  },

  async createMerchantFundingProject(data: {
    communityId: string
    merchantId?: string
    title: string
    description?: string
    targetAmount: number
    minInvestment?: number
    estimatedReturn?: number
    durationMonths?: number
    imageUrl?: string
  }) {
    return withMutationFallback(
      async () => {
        return await db.merchantFundingProject.create({
                  data: {
                    communityId: data.communityId,
                    merchantId: data.merchantId || null,
                    title: data.title,
                    description: data.description || null,
                    targetAmount: Number(data.targetAmount || 0),
                    collectedAmount: 0,
                    minInvestment: Number(data.minInvestment || 50000),
                    estimatedReturn: Number(data.estimatedReturn || 12.0),
                    durationMonths: Number(data.durationMonths || 6),
                    status: 'OPEN',
                    imageUrl: data.imageUrl || null
                  }
                })
      },
      async () => {
        const projects = (globalThis as any).__mockMerchantFundingProjects || []
            const newProj = {
              id: `fund-proj-${Date.now()}`,
              ...data,
              collectedAmount: 0,
              status: 'OPEN',
              createdAt: new Date(),
              updatedAt: new Date()
            }
            projects.push(newProj)
            ;(globalThis as any).__mockMerchantFundingProjects = projects
            return newProj
      }
    )
  },

  async updateMerchantFundingProject(id: string, data: any) {
    return withMutationFallback(
      async () => {
        return await db.merchantFundingProject.update({
                  where: { id },
                  data
                })
      },
      async () => {
        const projects = (globalThis as any).__mockMerchantFundingProjects || []
            const proj = projects.find((p: any) => p.id === id)
            if (proj) {
              Object.assign(proj, data, { updatedAt: new Date() })
              return proj
            }
            return null
      }
    )
  },

  async deleteMerchantFundingProject(id: string) {
    return withMutationFallback(
      async () => {
        await db.merchantFundingProject.delete({ where: { id } })
                return { success: true }
      },
      async () => {
        if ((globalThis as any).__mockMerchantFundingProjects) {
              ;(globalThis as any).__mockMerchantFundingProjects = (globalThis as any).__mockMerchantFundingProjects.filter((p: any) => p.id !== id)
              }
            return { success: true }
      }
    )
  },

  async findUserByReferralCode(code: string) {
    if (!code) return null
        const cleanCode = code.trim().toUpperCase()
    return withFallback(
      async () => {
        const u = await db.user.findFirst({
                  where: {
                    OR: [
                      { referralCode: cleanCode } as any,
                      { username: cleanCode },
                      { id: code },
                      { email: code }
                    ]
                  }
                })
                if (u) return u
      },
      async () => {
        const mock = globalMockUsers.find((u: any) =>
              (u.referralCode && u.referralCode.toUpperCase() === cleanCode) ||
              (u.username && u.username.toUpperCase() === cleanCode) ||
              u.id === code ||
              u.email === code
            )
            return mock || null
      }
    )
  },

  async updateCommunityReferralConfig(data: {
    communityId: string
    joinFee: number
    referralBudget: number
    communityProfitShare: number
    maxTiers: number
    tierPercentages: string
  }) {
    return withMutationFallback(
      async () => {
        const updated = await db.community.update({
                  where: { id: data.communityId },
                  data: {
                    joinFee: data.joinFee,
                    referralBudget: data.referralBudget,
                    communityProfitShare: data.communityProfitShare,
                    maxTiers: data.maxTiers,
                    tierPercentages: data.tierPercentages
                  } as any
                })
                return updated
      },
      async () => {
        const communities = (globalThis as any).__mockCommunities || []
            const idx = communities.findIndex((c: any) => c.id === data.communityId)
            if (idx !== -1) {
              communities[idx] = {
                ...communities[idx],
                joinFee: data.joinFee,
                referralBudget: data.referralBudget,
                communityProfitShare: data.communityProfitShare,
                maxTiers: data.maxTiers,
                tierPercentages: data.tierPercentages,
                updatedAt: new Date()
              }
              return communities[idx]
            }
            throw new Error('Komunitas tidak ditemukan.')
      }
    )
  },

  async getCommunityReferralLogs(communityId: string) {
    return withFallback(
      async () => {
        const logs = await (db as any).communityReferralLog?.findMany({
                  where: { communityId },
                  orderBy: { createdAt: 'desc' },
                  take: 100
                })
                return logs
      },
      async () => {
        const logs = (globalThis as any).__mockCommunityReferralLogs || []
            return logs.filter((l: any) => l.communityId === communityId)
      }
    )
  },

  async processMultiTierCommunityReferral(data: {
    communityId: string
    buyerId: string
    totalFee: number
  }) {
    syncMockDb()
    const { communityId, buyerId, totalFee } = data

    let community: any = null
    let buyer: any = null

    if (await isDbConnected()) {
      try {
        community = await db.community.findUnique({ where: { id: communityId } })
        buyer = await db.user.findUnique({ where: { id: buyerId } })
      } catch (_) {}
    }

    if (!community) {
      const communities = (globalThis as any).__mockCommunities || []
      community = communities.find((c: any) => c.id === communityId)
    }

    if (!buyer) {
      buyer = globalMockUsers.find((u: any) => u.id === buyerId)
    }

    if (!community || !buyer) return { error: 'Komunitas atau user tidak ditemukan.' }

    if (community.category === 'FREE' || totalFee <= 0) {
      return { success: true, processed: false, reason: 'Komunitas gratis' }
    }

    const referralBudget = community.referralBudget ?? 40000
    const communityProfitShare = community.communityProfitShare ?? Math.max(0, totalFee - referralBudget)
    const maxTiers = community.maxTiers ?? 3

    let percentages: number[] = [50, 30, 20]
    if (community.tierPercentages) {
      try {
        percentages = JSON.parse(community.tierPercentages)
      } catch (_) {}
    }

    const ketuaId = community.ketuaId
    if (ketuaId && communityProfitShare > 0) {
      if (await isDbConnected()) {
        try {
          const w = await db.wallet.findUnique({ where: { userId: ketuaId } })
          if (w) {
            await db.wallet.update({ where: { userId: ketuaId }, data: { balance: { increment: communityProfitShare } } })
            await db.walletTransaction.create({
              data: {
                walletId: w.id,
                amount: communityProfitShare,
                type: 'COMMISSION',
                description: `Keuntungan Kas Komunitas ${community.name} dari pendaftaran ${buyer.name}`
              }
            })
          }
        } catch (_) {}
      } else {
        const kw = globalMockWallets.find(w => w.userId === ketuaId)
        if (kw) kw.balance += communityProfitShare
      }
    }

    let currentReferrerId: string | null = buyer.parentAffiliateId || null
    const logs: any[] = []

    for (let tier = 1; tier <= maxTiers; tier++) {
      const pct = percentages[tier - 1] || 0
      const tierAmount = (referralBudget * pct) / 100
      if (tierAmount <= 0) continue

      let recipientId: string | null = null
      let recipientType: 'REFERRER' | 'KOMUNITAS' | 'PLATFORM' = 'PLATFORM'
      let recipientName = 'Saloka.id Platform'

      if (currentReferrerId) {
        let refUser: any = null
        if (await isDbConnected()) {
          try {
            refUser = await db.user.findUnique({ where: { id: currentReferrerId } })
          } catch (_) {}
        }
        if (!refUser) {
          refUser = globalMockUsers.find((u: any) => u.id === currentReferrerId)
        }

        if (refUser) {
          recipientId = refUser.id
          recipientType = 'REFERRER'
          recipientName = refUser.name
          currentReferrerId = refUser.parentAffiliateId || null
        } else {
          currentReferrerId = null
        }
      }

      if (!recipientId) {
        if (tier === 1) {
          recipientId = ketuaId
          recipientType = 'KOMUNITAS'
          recipientName = `Kas Komunitas ${community.name}`
        } else {
          recipientId = 'user-admin-1'
          recipientType = 'PLATFORM'
          recipientName = 'Saloka.id Platform'
        }
      }

      if (recipientId && tierAmount > 0) {
        if (await isDbConnected()) {
          try {
            const rWallet = await db.wallet.findUnique({ where: { userId: recipientId } })
            if (rWallet) {
              await db.wallet.update({ where: { userId: recipientId }, data: { balance: { increment: tierAmount } } })
              await db.walletTransaction.create({
                data: {
                  walletId: rWallet.id,
                  amount: tierAmount,
                  type: 'COMMISSION',
                  description: `Komisi Referral Tier ${tier} (${recipientType}) Komunitas ${community.name} dari pendaftaran ${buyer.name}`
                }
              })
              await (db as any).communityReferralLog?.create({
                data: {
                  communityId,
                  buyerId,
                  referrerId: recipientType === 'REFERRER' ? recipientId : null,
                  tierLevel: tier,
                  amount: tierAmount,
                  recipientType,
                  description: `Komisi Tier ${tier} (${recipientType}: ${recipientName}) sebesar Rp ${tierAmount.toLocaleString('id-ID')}`
                }
              })
            }
          } catch (_) {}
        } else {
          const rw = globalMockWallets.find(w => w.userId === recipientId)
          if (rw) rw.balance += tierAmount

          if (!(globalThis as any).__mockCommunityReferralLogs) (globalThis as any).__mockCommunityReferralLogs = []
          const logEntry = {
            id: `crl-${Date.now()}-${tier}`,
            communityId,
            buyerId,
            referrerId: recipientType === 'REFERRER' ? recipientId : null,
            tierLevel: tier,
            amount: tierAmount,
            recipientType,
            description: `Komisi Tier ${tier} (${recipientType}: ${recipientName}) sebesar Rp ${tierAmount.toLocaleString('id-ID')}`,
            createdAt: new Date()
          }
          ;(globalThis as any).__mockCommunityReferralLogs.push(logEntry)
          logs.push(logEntry)
        }
      }
    }

    saveMockDb()
    return { success: true, processed: true, logs }
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // COIN SUPPLY MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════

  async getCoinSupplyConfig() {
    return withFallback(
      async () => {
        let config = await db.coinSystemConfig.findUnique({ where: { id: 'singleton' } })
                if (!config) {
                  config = await db.coinSystemConfig.create({
                    data: { id: 'singleton', totalSupply: 100000, circulatingSupply: 0 }
                  })
                }
                // Calculate real sum of all active coins held in ecosystem
                const [userSum, commSum] = await Promise.all([
                  db.user.aggregate({ _sum: { coinBalance: true } }),
                  db.community.aggregate({ _sum: { coinBalance: true } })
                ])
                const actualCirculating = (userSum._sum.coinBalance || 0) + (commSum._sum.coinBalance || 0)
                return {
                  ...config,
                  circulatingSupply: actualCirculating
                }
      },
      async () => {
        // Mock
            const userCirculating = globalMockUsers.reduce((sum, u) => sum + (Number(u.coinBalance) || 0), 0)
            const communities = (globalThis as any).__mockCommunities || []
            const commCirculating = communities.reduce((sum: number, c: any) => sum + (Number(c.coinBalance) || 0), 0)
            const actualCirculating = userCirculating + commCirculating
        
            if (!(globalThis as any).__mockCoinSupplyConfig) {
              (globalThis as any).__mockCoinSupplyConfig = {
                id: 'singleton',
                coinRateRupiah: 1500,
                totalSupply: 100000,
                circulatingSupply: actualCirculating,
                minTopupFree: 100,
                minTopupPaid: 1000,
                referralCoinAmount: 3,
                updatedAt: new Date(),
                updatedBy: null
              }
            } else {
              (globalThis as any).__mockCoinSupplyConfig.circulatingSupply = actualCirculating
            }
            return (globalThis as any).__mockCoinSupplyConfig
      }
    )
  },

  async updateCoinSupply(totalSupply: number, adminId: string) {
    return withMutationFallback(
      async () => {
        return await db.coinSystemConfig.upsert({
                  where: { id: 'singleton' },
                  create: { id: 'singleton', totalSupply, updatedBy: adminId },
                  update: { totalSupply, updatedBy: adminId }
                })
      },
      async () => {
        const config = (globalThis as any).__mockCoinSupplyConfig || {}
            config.totalSupply = totalSupply
            config.updatedBy = adminId
            config.updatedAt = new Date()
            ;(globalThis as any).__mockCoinSupplyConfig = config
            return config
      }
    )
  },

  async distributeCoinFromSupply(targetId: string, targetType: string, amount: number, reason: string, adminId: string) {
    const config = await this.getCoinSupplyConfig()
        const available = (config as any).totalSupply - (config as any).circulatingSupply
        if (amount > available) {
          throw new Error(`Supply tidak cukup. Tersedia: ${available} coin, diminta: ${amount} coin.`)
        }
    return withMutationFallback(
      async () => {
        await db.$transaction(async (tx: any) => {
                  // Update circulating supply
                  await tx.coinSystemConfig.update({
                    where: { id: 'singleton' },
                    data: { circulatingSupply: { increment: amount } }
                  })
                  // Add coin to target
                  if (targetType === 'KOPERASI' || targetType === 'KOMUNITAS') {
                    await tx.community.update({
                      where: { id: targetId },
                      data: { coinBalance: { increment: amount } }
                    })
                    await tx.coinTransaction.create({
                      data: { type: 'SUPPLY_DISTRIBUTE', amount, description: `Supply distribusi: ${reason}`, userId: adminId, communityId: targetId }
                    })
                  } else {
                    await tx.user.update({
                      where: { id: targetId },
                      data: { coinBalance: { increment: amount } }
                    })
                    await tx.coinTransaction.create({
                      data: { type: 'SUPPLY_DISTRIBUTE', amount, description: `Supply distribusi: ${reason}`, userId: targetId }
                    })
                  }
                  // Log supply action
                  await tx.coinSupplyLog.create({
                    data: { action: 'DISTRIBUTE', amount, targetType, targetId, reason, adminId }
                  })
                })
                return { success: true }
      },
      async () => {
        // Mock
            const mockConfig = (globalThis as any).__mockCoinSupplyConfig
            if (mockConfig) {
              mockConfig.circulatingSupply = (mockConfig.circulatingSupply || 0) + amount
            }
            if (targetType === 'KOPERASI' || targetType === 'KOMUNITAS') {
              const communities = (globalThis as any).__mockCommunities || []
              const c = communities.find((x: any) => x.id === targetId)
              if (c) c.coinBalance = (c.coinBalance || 0) + amount
            } else {
              const u = globalMockUsers.find(x => x.id === targetId)
              if (u) (u as any).coinBalance = ((u as any).coinBalance || 0) + amount
            }
            if (!(globalThis as any).__mockCoinSupplyLogs) (globalThis as any).__mockCoinSupplyLogs = []
            ;(globalThis as any).__mockCoinSupplyLogs.push({
              id: `csl-${Date.now()}`, action: 'DISTRIBUTE', amount, targetType, targetId, reason, adminId, createdAt: new Date()
            })
            if (!(globalThis as any).__mockCoinTransactions) (globalThis as any).__mockCoinTransactions = []
            ;(globalThis as any).__mockCoinTransactions.push({
              id: `ctx-${Date.now()}`, type: 'SUPPLY_DISTRIBUTE', amount, description: `Supply distribusi: ${reason}`,
              userId: targetType === 'USER' ? targetId : adminId,
              communityId: (targetType !== 'USER') ? targetId : undefined,
              createdAt: new Date()
            })
            return { success: true }
      }
    )
  },

  async getCoinSupplyLogs() {
    return withFallback(
      () => db.coinSupplyLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
      () => ((globalThis as any).__mockCoinSupplyLogs || []).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    )
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AUDIT LOG
  // ═══════════════════════════════════════════════════════════════════════════

  async createAuditLog(data: {
    actor: 'MEMBER' | 'ADMIN'
    actorId: string
    actorName?: string
    action: string
    module: string
    targetId?: string
    targetType?: string
    detail?: string
    ipAddress?: string
  }) {
    return withMutationFallback(
      async () => {
        return await db.auditLog.create({ data })
      },
      async () => {
        if (!(globalThis as any).__mockAuditLogs) (globalThis as any).__mockAuditLogs = []
            const log = { id: `al-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, ...data, createdAt: new Date() }
            ;(globalThis as any).__mockAuditLogs.push(log)
            return log
      }
    )
  },

  async getAuditLogs(filter?: { actor?: 'MEMBER' | 'ADMIN'; module?: string; limit?: number }) {
    const limit = filter?.limit || 200
    return withFallback(
      async () => {
        const where: any = {}
                if (filter?.actor) where.actor = filter.actor
                if (filter?.module) where.module = filter.module
                return await db.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit })
      },
      async () => {
        let logs = (globalThis as any).__mockAuditLogs || []
            if (filter?.actor) logs = logs.filter((l: any) => l.actor === filter.actor)
            if (filter?.module) logs = logs.filter((l: any) => l.module === filter.module)
            return logs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit)
      }
    )
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LANDING BANNER CRUD
  // ═══════════════════════════════════════════════════════════════════════════

  async getActiveBanners() {
    return withFallback(
      async () => {
        let banners = await db.landingBanner.findMany({
                  where: { isActive: true },
                  orderBy: { sortOrder: 'asc' }
                })
                if (banners.length === 0) {
                  const totalCount = await db.landingBanner.count()
                  if (totalCount === 0) {
                    await db.landingBanner.createMany({
                      data: [
                        {
                          title: 'Pesta Diskon UMKM Nusantara — Hemat Hingga 50%',
                          imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1600&q=85',
                          linkUrl: '/market',
                          sortOrder: 0,
                          isActive: true
                        },
                        {
                          title: 'Booking Jasa & Keahlian Profesional Terpercaya di Saloka',
                          imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=85',
                          linkUrl: '/jasa',
                          sortOrder: 1,
                          isActive: true
                        },
                        {
                          title: 'Program Afiliasi Koperasi Saloka — Dapatkan Komisi Multi-Tier',
                          imageUrl: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=1600&q=85',
                          linkUrl: '/affiliate',
                          sortOrder: 2,
                          isActive: true
                        }
                      ]
                    })
                    banners = await db.landingBanner.findMany({
                      where: { isActive: true },
                      orderBy: { sortOrder: 'asc' }
                    })
                  }
                }
                return banners
      },
      async () => {
        return ((globalThis as any).__mockBanners || []).filter((b: any) => b.isActive).sort((a: any, b: any) => a.sortOrder - b.sortOrder)
      }
    )
  },

  async getAllBanners() {
    return withFallback(
      async () => {
        let banners = await db.landingBanner.findMany({ orderBy: { sortOrder: 'asc' } })
                if (banners.length === 0) {
                  await db.landingBanner.createMany({
                    data: [
                      {
                        title: 'Pesta Diskon UMKM Nusantara — Hemat Hingga 50%',
                        imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1600&q=85',
                        linkUrl: '/market',
                        sortOrder: 0,
                        isActive: true
                      },
                      {
                        title: 'Booking Jasa & Keahlian Profesional Terpercaya di Saloka',
                        imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=85',
                        linkUrl: '/jasa',
                        sortOrder: 1,
                        isActive: true
                      },
                      {
                        title: 'Program Afiliasi Koperasi Saloka — Dapatkan Komisi Multi-Tier',
                        imageUrl: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=1600&q=85',
                        linkUrl: '/affiliate',
                        sortOrder: 2,
                        isActive: true
                      }
                    ]
                  })
                  banners = await db.landingBanner.findMany({ orderBy: { sortOrder: 'asc' } })
                }
                return banners
      },
      async () => {
        return ((globalThis as any).__mockBanners || []).sort((a: any, b: any) => a.sortOrder - b.sortOrder)
      }
    )
  },

  async createBanner(data: { title?: string; imageUrl: string; linkUrl?: string; sortOrder?: number }) {
    return withMutationFallback(
      async () => {
        return await db.landingBanner.create({ data })
      },
      async () => {
        if (!(globalThis as any).__mockBanners) (globalThis as any).__mockBanners = []
            const banner = {
              id: `banner-${Date.now()}`, ...data, isActive: true, sortOrder: data.sortOrder || 0,
              createdAt: new Date(), updatedAt: new Date()
            }
            ;(globalThis as any).__mockBanners.push(banner)
            return banner
      }
    )
  },

  async updateBanner(id: string, data: { title?: string; imageUrl?: string; linkUrl?: string; isActive?: boolean; sortOrder?: number }) {
    return withMutationFallback(
      async () => {
        return await db.landingBanner.update({ where: { id }, data })
      },
      async () => {
        const banners = (globalThis as any).__mockBanners || []
            const b = banners.find((x: any) => x.id === id)
            if (b) {
              Object.assign(b, data, { updatedAt: new Date() })
              }
            return b
      }
    )
  },

  async deleteBanner(id: string) {
    return withMutationFallback(
      async () => {
        return await db.landingBanner.delete({ where: { id } })
      },
      async () => {
        const banners = (globalThis as any).__mockBanners || []
            const idx = banners.findIndex((x: any) => x.id === id)
            if (idx >= 0) banners.splice(idx, 1)
            return { success: true }
      }
    )
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SERVICE / JASA CRUD
  // ═══════════════════════════════════════════════════════════════════════════

  async getServices(filters?: { merchantId?: string; category?: string; isActive?: boolean }) {
    return withFallback(
      async () => {
        const where: any = {}
                if (filters?.merchantId) where.merchantId = filters.merchantId
                if (filters?.category) where.category = filters.category
                if (filters?.isActive !== undefined) where.isActive = filters.isActive
                return await db.service.findMany({ where, orderBy: { createdAt: 'desc' } })
      },
      async () => {
        let services = (globalThis as any).__mockServices || []
            if (filters?.merchantId) services = services.filter((s: any) => s.merchantId === filters.merchantId)
            if (filters?.category) services = services.filter((s: any) => s.category === filters.category)
            if (filters?.isActive !== undefined) services = services.filter((s: any) => s.isActive === filters.isActive)
            return services
      }
    )
  },

  async createService(data: any) {
    return withMutationFallback(
      async () => {
        return await db.service.create({ data })
      },
      async () => {
        if (!(globalThis as any).__mockServices) (globalThis as any).__mockServices = []
            const service = { id: `svc-${Date.now()}`, ...data, isActive: true, createdAt: new Date(), updatedAt: new Date() }
            ;(globalThis as any).__mockServices.push(service)
            return service
      }
    )
  },

  async updateService(id: string, data: any) {
    return withMutationFallback(
      async () => {
        return await db.service.update({ where: { id }, data })
      },
      async () => {
        const services = (globalThis as any).__mockServices || []
            const s = services.find((x: any) => x.id === id)
            if (s) Object.assign(s, data, { updatedAt: new Date() })
            return s
      }
    )
  },

  async deleteService(id: string) {
    return withMutationFallback(
      async () => {
        return await db.service.delete({ where: { id } })
      },
      async () => {
        const services = (globalThis as any).__mockServices || []
            const idx = services.findIndex((x: any) => x.id === id)
            if (idx >= 0) services.splice(idx, 1)
            return { success: true }
      }
    )
  },

  // Service Availability
  async getServiceAvailability(serviceId: string) {
    return withFallback(
      () => db.serviceAvailability.findMany({
          where: { serviceId, date: { gte: new Date() } },
          orderBy: { date: 'asc' }
        }),
      () => ((globalThis as any).__mockServiceAvailability || [])
      .filter((a: any) => a.serviceId === serviceId && new Date(a.date) >= new Date())
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
    )
  },

  async setServiceAvailability(serviceId: string, date: Date, isAvailable: boolean) {
    return withMutationFallback(
      async () => {
        return await db.serviceAvailability.upsert({
                  where: { serviceId_date: { serviceId, date } },
                  create: { serviceId, date, isAvailable },
                  update: { isAvailable }
                })
      },
      async () => {
        if (!(globalThis as any).__mockServiceAvailability) (globalThis as any).__mockServiceAvailability = []
            const avails = (globalThis as any).__mockServiceAvailability
            const existing = avails.find((a: any) => a.serviceId === serviceId && new Date(a.date).toDateString() === date.toDateString())
            if (existing) {
              existing.isAvailable = isAvailable
            } else {
              avails.push({ id: `sa-${Date.now()}`, serviceId, date, isAvailable, createdAt: new Date() })
            }
            return { success: true }
      }
    )
  },

  // Service Booking
  async createServiceBooking(data: any) {
    // Check availability
        const avails = await this.getServiceAvailability(data.serviceId)
        const dateBooking = new Date(data.bookingDate)
        const avail = avails.find((a: any) => new Date(a.date).toDateString() === dateBooking.toDateString())
        if (avail && !avail.isAvailable) {
          throw new Error('Penyedia jasa tidak tersedia pada tanggal tersebut.')
        }
    return withMutationFallback(
      async () => {
        const booking = await db.serviceBooking.create({ data: { ...data, adminFee: 2500 } })
                // Mark date as unavailable
                await this.setServiceAvailability(data.serviceId, dateBooking, false)
                return booking
      },
      async () => {
        if (!(globalThis as any).__mockServiceBookings) (globalThis as any).__mockServiceBookings = []
            const booking = { id: `sb-${Date.now()}`, ...data, adminFee: 2500, status: 'PENDING', createdAt: new Date(), updatedAt: new Date() }
            ;(globalThis as any).__mockServiceBookings.push(booking)
            await this.setServiceAvailability(data.serviceId, dateBooking, false)
            return booking
      }
    )
  },

  async getServiceBookings(filters?: { merchantId?: string; customerId?: string; serviceId?: string }) {
    return withFallback(
      async () => {
        const where: any = {}
                if (filters?.merchantId) where.merchantId = filters.merchantId
                if (filters?.customerId) where.customerId = filters.customerId
                if (filters?.serviceId) where.serviceId = filters.serviceId
                return await db.serviceBooking.findMany({ where, orderBy: { createdAt: 'desc' }, include: { service: true } })
      },
      async () => {
        let bookings = (globalThis as any).__mockServiceBookings || []
            if (filters?.merchantId) bookings = bookings.filter((b: any) => b.merchantId === filters.merchantId)
            if (filters?.customerId) bookings = bookings.filter((b: any) => b.customerId === filters.customerId)
            if (filters?.serviceId) bookings = bookings.filter((b: any) => b.serviceId === filters.serviceId)
            return bookings
      }
    )
  },

  async updateServiceBookingStatus(id: string, status: string) {
    return withMutationFallback(
      async () => {
        return await db.serviceBooking.update({ where: { id }, data: { status } })
      },
      async () => {
        const bookings = (globalThis as any).__mockServiceBookings || []
            const b = bookings.find((x: any) => x.id === id)
            if (b) { b.status = status; b.updatedAt = new Date() }
            return b
      }
    )
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // USER MANAGEMENT (Enhanced with IP, Phone, Location)
  // ═══════════════════════════════════════════════════════════════════════════

  async updateUserLoginInfo(userId: string, ipAddress?: string, location?: string) {
    return withMutationFallback(
      async () => {
        return await db.user.update({
                  where: { id: userId },
                  data: { lastIp: ipAddress || null, lastLocation: location || null, lastLoginAt: new Date() }
                })
      },
      async () => {
        const u = globalMockUsers.find(x => x.id === userId)
            if (u) {
              ;(u as any).lastIp = ipAddress || null
              ;(u as any).lastLocation = location || null
              ;(u as any).lastLoginAt = new Date()
              }
            return u
      }
    )
  },

  async createUserAdmin(data: { name: string; email: string; passwordHash: string; phone?: string; role?: string }) {
    return withMutationFallback(
      async () => {
        return await db.user.create({
                  data: {
                    name: data.name,
                    email: data.email,
                    passwordHash: data.passwordHash,
                    phone: data.phone || null,
                    role: (data.role as any) || 'CUSTOMER'
                  }
                })
      },
      async () => {
        const newUser = {
              id: `user-${Date.now()}`, name: data.name, email: data.email, passwordHash: data.passwordHash,
              phone: data.phone || null, role: (data.role || 'CUSTOMER') as any, isSuperAdmin: false,
              latitude: null, longitude: null, level: 1, xp: 0,
              landingPageTemplate: null, landingPageConfig: null, landingPageSetup: false,
              parentAffiliateId: null, membershipLevel: 'Reseller', membershipAccess: 'Gold',
              createdAt: new Date(), updatedAt: new Date()
            }
            globalMockUsers.push(newUser as any)
            return newUser
      }
    )
  },

  async deleteUser(userId: string) {
    return withMutationFallback(
      async () => {
        return await db.user.delete({ where: { id: userId } })
      },
      async () => {
        const idx = globalMockUsers.findIndex(u => u.id === userId)
            if (idx >= 0) globalMockUsers.splice(idx, 1)
            return { success: true }
      }
    )
  },

  async updateUserPhone(userId: string, phone: string) {
    return withMutationFallback(
      async () => {
        return await db.user.update({ where: { id: userId }, data: { phone } })
      },
      async () => {
        const u = globalMockUsers.find(x => x.id === userId)
            if (u) { (u as any).phone = phone; }
            return u
      }
    )
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN MANAGEMENT (Update admin account details)
  // ═══════════════════════════════════════════════════════════════════════════

  async updateAdminAccount(adminId: string, data: { name?: string; email?: string; passwordHash?: string }) {
    return withMutationFallback(
      async () => {
        const updateData: any = {}
                if (data.name) updateData.name = data.name
                if (data.email) updateData.email = data.email
                if (data.passwordHash) updateData.passwordHash = data.passwordHash
                return await db.user.update({ where: { id: adminId }, data: updateData })
      },
      async () => {
        const admin = globalMockUsers.find(u => u.id === adminId)
            if (!admin) throw new Error('Admin tidak ditemukan.')
            if (data.name) admin.name = data.name
            if (data.email) admin.email = data.email
            if (data.passwordHash) admin.passwordHash = data.passwordHash
            admin.updatedAt = new Date()
            return admin
      }
    )
  },

  // ─── ANNOUNCEMENTS CRUD ────────────────────────────────────────
  async getAnnouncements(communityId: string) {
    return withFallback(
      async () => {
        return await db.announcement.findMany({
                  where: { communityId },
                  orderBy: [
                    { isPinned: 'desc' },
                    { publishedAt: 'desc' }
                  ]
                })
      },
      async () => {
        const list = (globalThis as any).__mockAnnouncements || []
            return list
              .filter((x: any) => x.communityId === communityId)
              .sort((a: any, b: any) => {
                if (a.isPinned !== b.isPinned) {
                  return a.isPinned ? -1 : 1
                }
                return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
              })
      }
    )
  },

  async createAnnouncement(data: {
    communityId: string
    title: string
    content: string
    publishedAt?: Date
    isPinned?: boolean
    status?: string
  }) {
    return withMutationFallback(
      async () => {
        return await db.announcement.create({
                  data: {
                    communityId: data.communityId,
                    title: data.title,
                    content: data.content,
                    publishedAt: data.publishedAt || new Date(),
                    isPinned: Boolean(data.isPinned),
                    status: data.status || 'PUBLISHED'
                  }
                })
      },
      async () => {
        if (!(globalThis as any).__mockAnnouncements) {
              (globalThis as any).__mockAnnouncements = []
            }
            const newAnn = {
              id: `ann-${Date.now()}`,
              communityId: data.communityId,
              title: data.title,
              content: data.content,
              publishedAt: data.publishedAt || new Date(),
              isPinned: Boolean(data.isPinned),
              status: data.status || 'PUBLISHED',
              createdAt: new Date(),
              updatedAt: new Date()
            }
            ;(globalThis as any).__mockAnnouncements.push(newAnn)
            return newAnn
      }
    )
  },

  async updateAnnouncement(id: string, data: {
    title?: string
    content?: string
    publishedAt?: Date
    isPinned?: boolean
    status?: string
  }) {
    return withMutationFallback(
      async () => {
        return await db.announcement.update({
                  where: { id },
                  data: {
                    title: data.title,
                    content: data.content,
                    publishedAt: data.publishedAt,
                    isPinned: data.isPinned !== undefined ? Boolean(data.isPinned) : undefined,
                    status: data.status
                  }
                })
      },
      async () => {
        const list = (globalThis as any).__mockAnnouncements || []
            const ann = list.find((x: any) => x.id === id)
            if (ann) {
              Object.assign(ann, data, { updatedAt: new Date() })
              return ann
            }
            return null
      }
    )
  },

  async deleteAnnouncement(id: string) {
    return withMutationFallback(
      async () => {
        await db.announcement.delete({ where: { id } })
                return { success: true }
      },
      async () => {
        if ((globalThis as any).__mockAnnouncements) {
              ;(globalThis as any).__mockAnnouncements = (globalThis as any).__mockAnnouncements.filter((x: any) => x.id !== id)
              }
            return { success: true }
      }
    )
  },

  // ─── COOPERATIVE REPORTS CRUD ────────────────────────────────────────
  async getCooperativeReports(communityId: string) {
    return withFallback(
      async () => {
        return await db.cooperativeReport.findMany({
                  where: { communityId },
                  orderBy: { publishedAt: 'desc' }
                })
      },
      async () => {
        const list = (globalThis as any).__mockCooperativeReports || []
            return list
              .filter((x: any) => x.communityId === communityId)
              .sort((a: any, b: any) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      }
    )
  },

  async createCooperativeReport(data: {
    communityId: string
    title: string
    type: string
    year: number
    fileUrl: string
    publishedAt?: Date
    status?: string
  }) {
    return withMutationFallback(
      async () => {
        return await db.cooperativeReport.create({
                  data: {
                    communityId: data.communityId,
                    title: data.title,
                    type: data.type,
                    year: Number(data.year),
                    fileUrl: data.fileUrl,
                    publishedAt: data.publishedAt || new Date(),
                    status: data.status || 'PUBLISHED'
                  }
                })
      },
      async () => {
        if (!(globalThis as any).__mockCooperativeReports) {
              (globalThis as any).__mockCooperativeReports = []
            }
            const newRep = {
              id: `rep-${Date.now()}`,
              communityId: data.communityId,
              title: data.title,
              type: data.type,
              year: Number(data.year),
              fileUrl: data.fileUrl,
              publishedAt: data.publishedAt || new Date(),
              status: data.status || 'PUBLISHED',
              createdAt: new Date(),
              updatedAt: new Date()
            }
            ;(globalThis as any).__mockCooperativeReports.push(newRep)
            return newRep
      }
    )
  },

  async updateCooperativeReport(id: string, data: {
    title?: string
    type?: string
    year?: number
    fileUrl?: string
    publishedAt?: Date
    status?: string
  }) {
    return withMutationFallback(
      async () => {
        return await db.cooperativeReport.update({
                  where: { id },
                  data: {
                    title: data.title,
                    type: data.type,
                    year: data.year !== undefined ? Number(data.year) : undefined,
                    fileUrl: data.fileUrl,
                    publishedAt: data.publishedAt,
                    status: data.status
                  }
                })
      },
      async () => {
        const list = (globalThis as any).__mockCooperativeReports || []
            const rep = list.find((x: any) => x.id === id)
            if (rep) {
              if (data.year !== undefined) data.year = Number(data.year)
              Object.assign(rep, data, { updatedAt: new Date() })
              return rep
            }
            return null
      }
    )
  },

  async deleteCooperativeReport(id: string) {
    return withMutationFallback(
      async () => {
        await db.cooperativeReport.delete({ where: { id } })
                return { success: true }
      },
      async () => {
        if ((globalThis as any).__mockCooperativeReports) {
              ;(globalThis as any).__mockCooperativeReports = (globalThis as any).__mockCooperativeReports.filter((x: any) => x.id !== id)
              }
            return { success: true }
      }
    )
  },

  // ─── DISCUSSION FORUM CRUD ────────────────────────────────────────
  async getDiscussions(communityId: string) {
    return withMutationFallback(
      async () => {
        return await (db as any).discussion.findMany({
                  where: { communityId },
                  include: {
                    author: {
                      select: { id: true, name: true, image: true }
                    },
                    replies: {
                      include: {
                        author: {
                          select: { id: true, name: true, image: true }
                        }
                      }
                    }
                  },
                  orderBy: [
                    { isPinned: 'desc' },
                    { createdAt: 'desc' }
                  ]
                })
      },
      async () => {
        // Seed initial dummy discussions if empty
            if (!(globalThis as any).__mockDiscussions || (globalThis as any).__mockDiscussions.length === 0) {
              (globalThis as any).__mockDiscussions = [
                {
                  id: 'disc-dummy-1',
                  communityId: 'comm-dummy-1',
                  title: 'Bagaimana cara mendaftarkan sertifikasi halal untuk produk jamu?',
                  category: 'Tanya Jawab',
                  content: 'Teman-teman pengrajin jamu, apakah ada yang tahu alur pendaftaran sertifikasi halal gratis (Sehati) tahun ini? Kebetulan produk saya belum memiliki sertifikat halal.',
                  tags: 'sertifikasi, halal, jamu, izin',
                  authorId: 'user-merchant-4',
                  isPinned: false,
                  isClosed: false,
                  bestReplyId: 'reply-dummy-1',
                  createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
                  updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000)
                },
                {
                  id: 'disc-dummy-2',
                  communityId: 'comm-dummy-1',
                  title: 'Tips menghemat biaya logistik pengiriman ke luar pulau Jawa',
                  category: 'Tips & Pengalaman',
                  content: 'Halo semua, saya ingin membagikan sedikit tips menghemat biaya pengiriman barang cargo. Selama ini kami menggunakan jasa ekspedisi darat-laut dengan sistem LCL (Less Container Load) daripada udara. Hematnya bisa sampai 50%! Ada yang punya rekomendasi kargo terpercaya?',
                  tags: 'logistik, cargo, tips, pengiriman',
                  authorId: 'user-merchant-7',
                  isPinned: true,
                  isClosed: false,
                  bestReplyId: null,
                  createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000),
                  updatedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000)
                },
                {
                  id: 'disc-dummy-3',
                  communityId: 'comm-dummy-2',
                  title: 'Kolaborasi pengadaan bahan baku kemasan kertas karton tebal',
                  category: 'Kolaborasi',
                  content: 'Rekan-rekan anggota koperasi, ada yang butuh suplai kemasan dus/box karton dalam jumlah besar? Jika kita order gabungan (group buy) ke pabrik di Solo, kita bisa dapat potongan harga sampai 20% untuk minimum pemesanan 5.000 pcs. Yang berminat silakan respon di bawah.',
                  tags: 'kolaborasi, kemasan, karton, groupbuy',
                  authorId: 'user-merchant-10',
                  isPinned: false,
                  isClosed: false,
                  bestReplyId: null,
                  createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000),
                  updatedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000)
                }
              ]
              ;(globalThis as any).__mockDiscussionReplies = [
                {
                  id: 'reply-dummy-1',
                  discussionId: 'disc-dummy-1',
                  authorId: 'user-merchant-1',
                  content: 'Untuk program Sehati (Sertifikasi Halal Gratis), alurnya bisa dilakukan lewat web SIHALAL BPJPH. Syarat utamanya adalah harus sudah memiliki NIB berbasis risiko dan masuk kategori usaha mikro/kecil dengan produk tidak berisiko tinggi. Kemarin saya daftar lewat pendamping halal setempat, prosesnya sekitar 3-4 minggu.',
                  helpfulCount: 3,
                  helpfulVotes: JSON.stringify(['user-merchant-6', 'user-merchant-7', 'user-merchant-8']),
                  createdAt: new Date(Date.now() - 2.5 * 24 * 3600 * 1000),
                  updatedAt: new Date(Date.now() - 2.5 * 24 * 3600 * 1000)
                },
                {
                  id: 'reply-dummy-2',
                  discussionId: 'disc-dummy-2',
                  authorId: 'user-merchant-6',
                  content: 'Sangat setuju! Untuk cargo laut, kami biasa menggunakan DAKOTA atau Indah Cargo untuk barang berat. Kalau untuk e-commerce eceran ke Kalimantan/Sulawesi, JTR (JNE Trucking) lumayan bersahabat tarifnya.',
                  helpfulCount: 2,
                  helpfulVotes: JSON.stringify(['user-merchant-1', 'user-merchant-9']),
                  createdAt: new Date(Date.now() - 4.5 * 24 * 3600 * 1000),
                  updatedAt: new Date(Date.now() - 4.5 * 24 * 3600 * 1000)
                }
              ]
              }
        
            const discs = (globalThis as any).__mockDiscussions || []
            const replies = (globalThis as any).__mockDiscussionReplies || []
        
            const enrichUser = (uid: string) => {
              const u = globalMockUsers.find(x => x.id === uid)
              return {
                id: uid,
                name: u ? u.name : 'Anggota Komunitas',
                image: u ? u.image : null
              }
            }
        
            return discs
              .filter((d: any) => d.communityId === communityId)
              .map((d: any) => {
                const discReplies = replies
                  .filter((r: any) => r.discussionId === d.id)
                  .map((r: any) => ({
                    ...r,
                    author: enrichUser(r.authorId)
                  }))
                return {
                  ...d,
                  author: enrichUser(d.authorId),
                  replies: discReplies
                }
              })
              .sort((a: any, b: any) => {
                if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              })
      }
    )
  },

  async createDiscussion(authorId: string, data: {
    communityId: string
    title: string
    category: string
    content: string
    tags: string
  }) {
    let createdDisc: any = null
    return withMutationFallback(
      async () => {
        createdDisc = await (db as any).discussion.create({
                  data: {
                    communityId: data.communityId,
                    title: data.title,
                    category: data.category,
                    content: data.content,
                    tags: data.tags,
                    authorId
                  },
                  include: {
                    author: { select: { id: true, name: true, image: true } }
                  }
                })
      },
      async () => {
        if (!createdDisc) {
              const newDisc = {
                id: `disc-${Date.now()}`,
                communityId: data.communityId,
                title: data.title,
                category: data.category,
                content: data.content,
                tags: data.tags,
                authorId,
                isPinned: false,
                isClosed: false,
                bestReplyId: null,
                createdAt: new Date(),
                updatedAt: new Date()
              }
              if (!(globalThis as any).__mockDiscussions) {
                (globalThis as any).__mockDiscussions = []
              }
              ;(globalThis as any).__mockDiscussions.push(newDisc)
              const u = globalMockUsers.find(x => x.id === authorId)
              createdDisc = {
                ...newDisc,
                author: {
                  id: authorId,
                  name: u ? u.name : 'Anggota Komunitas',
                  image: u ? u.image : null
                },
                replies: []
              }
            }
        
            // Trigger Notification Dispatch to all community members
            try {
              const authorUser = await DataStore.findUserById(authorId)
              const authorName = authorUser ? authorUser.name : 'Seorang anggota'
              const community = await DataStore.getCommunityById(data.communityId)
              const communityName = community ? community.name : 'Komunitas'
              const membersList = await DataStore.getIndukCommunityMembers(data.communityId)
        
              for (const m of membersList) {
                if (m.userId && m.userId !== authorId) {
                  await DataStore.createNotification(
                    m.userId,
                    'NEW_DISCUSSION',
                    `Diskusi Baru di ${communityName}`,
                    `${authorName} memulai diskusi baru: "${data.title}"`,
                    `/community/${data.communityId}?tab=diskusi&topic=${createdDisc.id}`
                  )
                }
              }
            } catch (err) {
              console.error("Error creating new discussion notification:", err)
            }
        
            return createdDisc
      }
    )
  },

  async updateDiscussion(id: string, authorId: string, data: {
    title: string
    category: string
    content: string
    tags: string
  }) {
    return withMutationFallback(
      async () => {
        return await (db as any).discussion.update({
                  where: { id },
                  data: {
                    title: data.title,
                    category: data.category,
                    content: data.content,
                    tags: data.tags
                  },
                  include: {
                    author: { select: { id: true, name: true, image: true } }
                  }
                })
      },
      async () => {
        const list = (globalThis as any).__mockDiscussions || []
            const d = list.find((x: any) => x.id === id)
            if (d) {
              if (d.authorId !== authorId) throw new Error('Bukan pemilik diskusi')
              Object.assign(d, data, { updatedAt: new Date() })
              const u = globalMockUsers.find(x => x.id === authorId)
              return {
                ...d,
                author: {
                  id: authorId,
                  name: u ? u.name : 'Anggota Komunitas',
                  image: u ? u.image : null
                }
              }
            }
            return null
      }
    )
  },

  async deleteDiscussion(id: string) {
    return withMutationFallback(
      async () => {
        await (db as any).discussion.delete({ where: { id } })
                return { success: true }
      },
      async () => {
        if ((globalThis as any).__mockDiscussions) {
              ;(globalThis as any).__mockDiscussions = (globalThis as any).__mockDiscussions.filter((x: any) => x.id !== id)
            }
            if ((globalThis as any).__mockDiscussionReplies) {
              ;(globalThis as any).__mockDiscussionReplies = (globalThis as any).__mockDiscussionReplies.filter((x: any) => x.discussionId !== id)
            }
            return { success: true }
      }
    )
  },

  async togglePinDiscussion(id: string) {
    return withMutationFallback(
      async () => {
        const current = await (db as any).discussion.findUnique({ where: { id } })
                return await (db as any).discussion.update({
                  where: { id },
                  data: { isPinned: !current?.isPinned }
                })
      },
      async () => {
        const list = (globalThis as any).__mockDiscussions || []
            const d = list.find((x: any) => x.id === id)
            if (d) {
              d.isPinned = !d.isPinned
              d.updatedAt = new Date()
              return d
            }
            return null
      }
    )
  },

  async toggleCloseDiscussion(id: string) {
    return withMutationFallback(
      async () => {
        const current = await (db as any).discussion.findUnique({ where: { id } })
                return await (db as any).discussion.update({
                  where: { id },
                  data: { isClosed: !current?.isClosed }
                })
      },
      async () => {
        const list = (globalThis as any).__mockDiscussions || []
            const d = list.find((x: any) => x.id === id)
            if (d) {
              d.isClosed = !d.isClosed
              d.updatedAt = new Date()
              return d
            }
            return null
      }
    )
  },

  async createDiscussionReply(authorId: string, discussionId: string, content: string) {
    syncMockDb()
    let createdReply: any = null

    if (await isDbConnected()) {
      try {
        createdReply = await (db as any).discussionReply.create({
          data: {
            discussionId,
            authorId,
            content
          },
          include: {
            author: { select: { id: true, name: true, image: true } }
          }
        })
      } catch (_) {}
    }

    if (!createdReply) {
      const newReply = {
        id: `reply-${Date.now()}`,
        discussionId,
        authorId,
        content,
        helpfulCount: 0,
        helpfulVotes: '[]',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      if (!(globalThis as any).__mockDiscussionReplies) {
        (globalThis as any).__mockDiscussionReplies = []
      }
      ;(globalThis as any).__mockDiscussionReplies.push(newReply)
      saveMockDb()

      const u = globalMockUsers.find(x => x.id === authorId)
      createdReply = {
        ...newReply,
        author: {
          id: authorId,
          name: u ? u.name : 'Anggota Komunitas',
          image: u ? u.image : null
        }
      }
    }

    // Trigger Notification Dispatch to discussion owner
    try {
      let discussion: any = null
      if (await isDbConnected()) {
        try {
          discussion = await (db as any).discussion.findUnique({
            where: { id: discussionId }
          })
        } catch (_) {}
      }
      if (!discussion) {
        const list = (globalThis as any).__mockDiscussions || []
        discussion = list.find((x: any) => x.id === discussionId)
      }

      if (discussion && discussion.authorId !== authorId) {
        const replier = await DataStore.findUserById(authorId)
        const replierName = replier ? replier.name : 'Seseorang'
        
        await DataStore.createNotification(
          discussion.authorId,
          'DISCUSSION_REPLY',
          'Balasan Baru pada Diskusi Anda',
          `${replierName} menanggapi diskusi Anda: "${discussion.title}"`,
          `/community/${discussion.communityId}?tab=diskusi&topic=${discussionId}`
        )
      }
    } catch (err) {
      console.error("Error creating discussion reply notification:", err)
    }

    return createdReply
  },

  async deleteDiscussionReply(id: string) {
    return withMutationFallback(
      async () => {
        await (db as any).discussionReply.delete({ where: { id } })
                return { success: true }
      },
      async () => {
        if ((globalThis as any).__mockDiscussionReplies) {
              ;(globalThis as any).__mockDiscussionReplies = (globalThis as any).__mockDiscussionReplies.filter((x: any) => x.id !== id)
              }
            return { success: true }
      }
    )
  },

  async toggleHelpfulReply(userId: string, id: string) {
    return withMutationFallback(
      async () => {
        const reply = await (db as any).discussionReply.findUnique({ where: { id } })
                if (reply) {
                  let votes: string[] = []
                  try {
                    votes = JSON.parse(reply.helpfulVotes)
                  } catch (_) {}
                  
                  if (votes.includes(userId)) {
                    votes = votes.filter(x => x !== userId)
                  } else {
                    votes.push(userId)
                  }
                  return await (db as any).discussionReply.update({
                    where: { id },
                    data: {
                      helpfulCount: votes.length,
                      helpfulVotes: JSON.stringify(votes)
                    }
                  })
                }
      },
      async () => {
        const list = (globalThis as any).__mockDiscussionReplies || []
            const r = list.find((x: any) => x.id === id)
            if (r) {
              let votes: string[] = []
              try {
                votes = typeof r.helpfulVotes === 'string' ? JSON.parse(r.helpfulVotes) : (r.helpfulVotes || [])
              } catch (_) {}
              
              if (votes.includes(userId)) {
                votes = votes.filter(x => x !== userId)
              } else {
                votes.push(userId)
              }
              r.helpfulVotes = JSON.stringify(votes)
              r.helpfulCount = votes.length
              r.updatedAt = new Date()
              return r
            }
            return null
      }
    )
  },

  async selectBestReply(discussionId: string, replyId: string) {
    syncMockDb()
    let updatedDisc: any = null

    // Find reply & discussion details first for notification context
    let reply: any = null
    let discussion: any = null
    try {
      if (await isDbConnected()) {
        try {
          reply = await (db as any).discussionReply.findUnique({ where: { id: replyId } })
          discussion = await (db as any).discussion.findUnique({ where: { id: discussionId } })
        } catch (_) {}
      }
      if (!reply) {
        const list = (globalThis as any).__mockDiscussionReplies || []
        reply = list.find((x: any) => x.id === replyId)
      }
      if (!discussion) {
        const list = (globalThis as any).__mockDiscussions || []
        discussion = list.find((x: any) => x.id === discussionId)
      }
    } catch (_) {}

    if (await isDbConnected()) {
      try {
        updatedDisc = await (db as any).discussion.update({
          where: { id: discussionId },
          data: { bestReplyId: replyId }
        })
      } catch (_) {}
    }


    if (!updatedDisc) {
      const list = (globalThis as any).__mockDiscussions || []
      const d = list.find((x: any) => x.id === discussionId)
      if (d) {
        d.bestReplyId = d.bestReplyId === replyId ? null : replyId
        d.updatedAt = new Date()
        saveMockDb()
        updatedDisc = d
      }
    }

    // Trigger Notification if best reply is selected (not removed)
    try {
      if (reply && discussion && reply.authorId !== discussion.authorId) {
        const isCurrentlyBest = discussion.bestReplyId === replyId
        if (!isCurrentlyBest) {
          await DataStore.createNotification(
            reply.authorId,
            'BEST_REPLY_SELECTED',
            'Jawaban Terbaik Terpilih! 🌟',
            `Selamat! Jawaban Anda terpilih sebagai Jawaban Terbaik di diskusi: "${discussion.title}"`,
            `/community/${discussion.communityId}?tab=diskusi&topic=${discussionId}`
          )
        }
      }
    } catch (err) {
      console.error("Error creating best reply notification:", err)
    }

    return updatedDisc
  }
}


// Global Registry for Midtrans transactions to handle polling/webhooks on local server
const pendingCheckouts: Record<string, any> = (globalThis as any).pendingCheckouts || {};
if (process.env.NODE_ENV !== 'production') {
  (globalThis as any).pendingCheckouts = pendingCheckouts;
}

const processedTransactions: Record<string, boolean> = (globalThis as any).processedTransactions || {};
if (process.env.NODE_ENV !== 'production') {
  (globalThis as any).processedTransactions = processedTransactions;
}

export const MidtransRegistry = {
  savePendingCheckout(orderId: string, data: {
    userId: string,
    items: Array<{ productId: string, quantity: number }>,
    affiliateId?: string,
    shippingDetails?: {
      shippingFee?: number
      courier?: string
      shippingAddress?: string
      couponCode?: string
      discountAmount?: number
      bumpSales?: string
    }
  }) {
    pendingCheckouts[orderId] = data;
  },
  getPendingCheckout(orderId: string) {
    return pendingCheckouts[orderId] || null;
  },
  isTransactionProcessed(orderId: string) {
    return !!processedTransactions[orderId];
  },
  markTransactionProcessed(orderId: string) {
    processedTransactions[orderId] = true;
  }
};
