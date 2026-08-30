import { getCurrentUser } from '@/app/actions/auth'
import {
  getIndukCommunityDetail,
  getIndukCommunityMembersAction,
  getCommunityRealStatsAction,
  getCooperativeProductsAction,
  getMerchantFundingProjectsAction,
  getCooperativeLoansAction
} from '@/app/actions/community'
import { getProductsByMerchantIdsAction } from '@/app/actions/products'
import { getCommunityEventsAction } from '@/app/actions/community-events'
import { getCommunityGalleryAction } from '@/app/actions/community-gallery'
import { getCommunityOfficialProductsAction } from '@/app/actions/community-products'
import { getCommunityShuDataAction, getUserShuSummaryAction } from '@/app/actions/shu'
import { getCommunitySavingsSummaryAction } from '@/app/actions/savings'
import { getAnnouncementsAction } from '@/app/actions/announcements'
import { getCooperativeReportsAction } from '@/app/actions/reports'
import { DataStore } from '@/lib/data-store'
import CommunityDetailClient, { type CommunityDetailInitialData } from './CommunityDetailClient'

export default async function CommunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [currentUser, commDetailRes] = await Promise.all([
    getCurrentUser().catch(() => null),
    getIndukCommunityDetail(id).catch(() => null)
  ])

  let commDetail: any = commDetailRes
  if (!commDetail) {
    commDetail = {
      id: id || 'comm-dummy-2',
      name: id?.includes('dummy-1') || id?.includes('perahu') ? 'Perahu Kita' : 'Koperasi Produksi Maju Bersama',
      type: id?.includes('dummy-1') || id?.includes('perahu') ? 'PERKUMPULAN' : 'KOPERASI',
      category: id?.includes('dummy-1') || id?.includes('perahu') ? 'FREE' : 'KOPERASI',
      description: id?.includes('dummy-1') || id?.includes('perahu')
        ? 'Wadah bagi pelaku usaha, UMKM, dan masyarakat untuk saling berbagi pengalaman, memperluas relasi dan menciptakan peluang bersama.'
        : 'Koperasi produksi resmi pelaku usaha mikro kecil dan menengah untuk pengadaan bahan baku bersama, fasilitasi permodalan modal produksi, dan bagi hasil usaha (SHU) untuk kesejahteraan anggota.',
      slogan: id?.includes('dummy-1') || id?.includes('perahu') ? 'Komunitas Kolaborasi, Belajar dan Berkembang Bersama' : undefined,
      aktaNotaris: id?.includes('dummy-1') || id?.includes('perahu') ? 'Akta Notaris Perkumpulan No. 25 Tgl 25 Juli 2026' : 'Akta Notaris Koperasi No. 98 Tgl 01 Februari 2025',
      nomorAhu: id?.includes('dummy-1') || id?.includes('perahu') ? 'AHU-00250726.AH.01.07' : 'AHU-KOP-0029311.AH.01.11',
      nomorNpwp: id?.includes('dummy-1') || id?.includes('perahu') ? '98.765.432.1-012.000' : '12.987.654.3-012.000',
      domisili: id?.includes('dummy-1') || id?.includes('perahu') ? 'Kota Yogyakarta, DIY' : 'Sleman, DIY',
      kontakPj: '081234567890',
      waGroupLink: 'https://chat.whatsapp.com/JdK8X4bY12eD5xG',
      avatarUrl: id?.includes('dummy-1') || id?.includes('perahu')
        ? 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=150&h=150&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=150&h=150&fit=crop&q=80',
      coverUrl: id?.includes('dummy-1') || id?.includes('perahu')
        ? 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&h=400&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=300&fit=crop&q=80',
      joinFee: 0,
      monthlyFee: 0,
      ketuaId: 'user-admin-1',
      ketua: { name: 'Super Admin Saloka' },
      createdAt: new Date('2026-07-25')
    }
  }

  const isKetua = !!(currentUser && commDetail?.ketuaId === currentUser.id)
  const isMemberOfCommunity = currentUser && !isKetua ? await DataStore.isCommunityMember(currentUser.id, id) : false
  const viewerCtx = {
    userId: currentUser?.id || null,
    role: currentUser?.role || null,
    isKetua,
    isMember: isMemberOfCommunity || isKetua
  }

  // Loans, SHU, savings, cooperative reports, and cooperative products (simpanan
  // catalog) are Koperasi-only concepts - a Perkumpulan community has none of
  // this data, and its dashboard already hides these tabs, so skip the fetches
  // entirely rather than querying for data that will always be empty.
  const isKoperasi = commDetail?.type === 'KOPERASI'

  const [
    memberListRes,
    statsRes,
    officialProductsRes,
    commEventsRes,
    commGalleryRes,
    annListRes
  ] = await Promise.all([
    getIndukCommunityMembersAction(id, viewerCtx).catch(() => []),
    getCommunityRealStatsAction(id).catch(() => null),
    getCommunityOfficialProductsAction(id).catch(() => []),
    getCommunityEventsAction(id).catch(() => []),
    getCommunityGalleryAction(id).catch(() => []),
    getAnnouncementsAction(id, viewerCtx).catch(() => [])
  ])

  const [cProductsRes, fProjectsRes, loanListRes, shuRes, userShuRes, savingsRes, repListRes] = isKoperasi
    ? await Promise.all([
        getCooperativeProductsAction(id).catch(() => []),
        getMerchantFundingProjectsAction(id, viewerCtx).catch(() => []),
        getCooperativeLoansAction(id, commDetail).catch(() => []),
        getCommunityShuDataAction(id, undefined, viewerCtx).catch(() => null),
        currentUser ? getUserShuSummaryAction(id).catch(() => null) : Promise.resolve(null),
        getCommunitySavingsSummaryAction(id, viewerCtx).catch(() => ({ success: false as const, summary: null })),
        getCooperativeReportsAction(id, viewerCtx).catch(() => [])
      ])
    : [[] as any[], [] as any[], [] as any[], null, null, { success: false as const, summary: null }, [] as any[]]

  const memberList = memberListRes || []
  const memberIds = memberList.map((m: any) => m.userId)
  const products = memberIds.length > 0 ? await getProductsByMerchantIdsAction(memberIds).catch(() => []) : []

  const mem = currentUser ? memberList.find((m: any) => m.userId === currentUser.id) : null
  const isMember = !!(currentUser && (mem || currentUser.id === commDetail?.ketuaId))
  const isIndukMember = !!mem?.isInduk
  const membershipDetails = mem || null

  // DataStore.getCommunityById eagerly embeds the full member roster (each with
  // their linked user's name/role/email) plus the Ketua's email, since other
  // internal server-side consumers of that method rely on that shape. None of
  // that belongs in the public-facing community object sent to the browser -
  // the member roster is only ever exposed through the separately-gated
  // getIndukCommunityMembersAction above, so strip it (and the Ketua's email)
  // here before it's serialized into the client's initial props.
  const { members: _embeddedMembers, ketua: commKetua, ...publicCommFields } = commDetail
  const publicCommDetail = {
    ...publicCommFields,
    ketua: commKetua ? { id: commKetua.id, name: commKetua.name, role: commKetua.role } : commKetua
  }

  const initialData: CommunityDetailInitialData = {
    user: currentUser,
    community: publicCommDetail,
    members: memberList,
    products,
    isMember,
    isIndukMember,
    membershipDetails,
    shuConfig: (shuRes as any)?.success ? (shuRes as any).config : null,
    userShu: (userShuRes as any)?.success ? (userShuRes as any).distributions : null,
    communityEvents: commEventsRes || [],
    communityGallery: commGalleryRes || [],
    communityOfficialProducts: officialProductsRes || [],
    announcements: annListRes || [],
    reports: repListRes || [],
    realStats: statsRes || { activeMembersCount: 0, activeMerchantsCount: 0, totalSavingsCollected: 0, shuCurrentYearProfit: 0 },
    coopProducts: cProductsRes || [],
    fundingProjects: fProjectsRes || [],
    loans: loanListRes || [],
    communitySavingsSummary: (savingsRes as any)?.success ? (savingsRes as any).summary : null,
    communityShuData: (shuRes as any)?.success ? shuRes : null,
    viewerCtx
  }

  return <CommunityDetailClient key={id} initialData={initialData} />
}
