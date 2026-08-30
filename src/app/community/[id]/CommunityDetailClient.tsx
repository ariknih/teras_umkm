'use client'

import React, { useState, useEffect, useLayoutEffect, useRef, useTransition } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  getIndukCommunityDetail,
  joinIndukCommunity,
  getIndukCommunityMembersAction,
  submitCooperativeLoanAction,
  getCooperativeLoansAction,
  approveCooperativeLoanAction,
  rejectCooperativeLoanAction,
  getCommunityRealStatsAction,
  getCooperativeProductsAction,
  createCooperativeProductAction,
  updateCooperativeProductAction,
  deleteCooperativeProductAction,
  getMerchantFundingProjectsAction,
  createMerchantFundingProjectAction,
  deleteMerchantFundingProjectAction,
  upgradeCommunityTierAction,
  kickCommunityMemberAction,
  updateIndukCommunity
} from '@/app/actions/community'
import { getCurrentUser } from '@/app/actions/auth'
import { getProducts, getProductsByMerchantIdsAction, createMemberProductAction, updateMemberProductAction, deleteMemberProductAction } from '@/app/actions/products'
import { getCommunityEventsAction, createCommunityEventAction, updateCommunityEventAction, deleteCommunityEventAction, registerCommunityEventAction } from '@/app/actions/community-events'
import { getCommunityGalleryAction, createCommunityGalleryItemAction, deleteCommunityGalleryItemAction } from '@/app/actions/community-gallery'
import { getCommunityOfficialProductsAction, createCommunityOfficialProductAction, updateCommunityOfficialProductAction, deleteCommunityOfficialProductAction } from '@/app/actions/community-products'
import { createUserNotificationAction } from '@/app/actions/orders'
import { getCommunityShuDataAction, getUserShuSummaryAction, calculateAndSaveShuAction } from '@/app/actions/shu'
import { recordSavingsTransactionAction, getCommunitySavingsSummaryAction } from '@/app/actions/savings'
import {
  getAnnouncementsAction,
  createAnnouncementAction,
  updateAnnouncementAction,
  deleteAnnouncementAction,
  togglePublishAnnouncementAction,
  togglePinAnnouncementAction
} from '@/app/actions/announcements'
import {
  getCooperativeReportsAction,
  createCooperativeReportAction,
  updateCooperativeReportAction,
  deleteCooperativeReportAction,
  togglePublishReportAction
} from '@/app/actions/reports'
import {
  getCommunityReferralConfig,
  updateCommunityReferralConfig,
  getCommunityReferralHistory
} from '@/app/actions/community-referral'
import { goeyToast } from 'goey-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { CommunityDashboardSkeleton } from '@/components/ui/GhostSkeleton'
import { LandingPageView } from './LandingPageView'
import { LandingPageEditor } from './LandingPageEditor'
import DiscussionForum from '@/components/community/DiscussionForum'
import {
  Shield,
  Users,
  MessageSquare,
  MapPin,
  DollarSign,
  TrendingUp,
  Info,
  CheckCircle2,
  ExternalLink,
  PlusCircle,
  Plus,
  Clock,
  Check,
  X,
  FileText,
  Upload,
  Loader2,
  Share2,
  Crown,
  Lock,
  ChevronRight,
  ChevronLeft,
  Building2,
  Sparkles,
  PieChart,
  Calendar,
  Coins,
  GraduationCap,
  PiggyBank,
  Home,
  ArrowRight,
  Store,
  Wallet,
  BarChart3,
  Award,
  Edit3,
  Trash2,
  QrCode,
  Megaphone,
  MoreVertical,
  MoreHorizontal,
  AlertTriangle,
  Image as ImageIcon,
  Utensils,
  ChefHat,
  Handshake,
  BookOpen,
  Trophy,
  Rocket,
  Truck,
  Tag,
  Landmark,
  Activity,
  ShoppingBag,
  Package,
  ShoppingCart,
  Search,
  Filter,
  Eye,
  Sliders,
  User,
  ArrowUpCircle,
  HelpCircle,
  Headphones
} from 'lucide-react'

const SailboatIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 21h20" />
    <path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4a11.6 11.6 0 0 0 1.62 6" fill="currentColor" fillOpacity="0.2" />
    <path d="M12 3v11" />
    <path d="M12 3 4.5 14h15L12 3z" fill="currentColor" fillOpacity="0.3" />
  </svg>
)

export interface CommunityDetailInitialData {
  user: any
  community: any
  members: any[]
  products: any[]
  isMember: boolean
  isIndukMember: boolean
  membershipDetails: any
  shuConfig: any
  userShu: any
  communityEvents: any[]
  communityGallery: any[]
  communityOfficialProducts: any[]
  announcements: any[]
  reports: any[]
  realStats: { activeMembersCount: number; activeMerchantsCount: number; totalSavingsCollected: number; shuCurrentYearProfit: number }
  coopProducts: any[]
  fundingProjects: any[]
  loans: any[]
  communitySavingsSummary: any
  communityShuData: any
  viewerCtx: { userId: string | null; role: string | null; isKetua: boolean; isMember: boolean }
}

export default function CommunityDetailPage({ initialData }: { initialData: CommunityDetailInitialData }) {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [user, setUser] = useState<any>(initialData.user)
  const [community, setCommunity] = useState<any>(initialData.community)
  const [members, setMembers] = useState<any[]>(initialData.members)
  const [products, setProducts] = useState<any[]>(initialData.products)
  const [isMember, setIsMember] = useState(initialData.isMember)
  const [isIndukMember, setIsIndukMember] = useState(initialData.isIndukMember)
  const [membershipDetails, setMembershipDetails] = useState<any>(initialData.membershipDetails)
  const [shuConfig, setShuConfig] = useState<any>(initialData.shuConfig)
  const [userShu, setUserShu] = useState<any>(initialData.userShu)
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false)



  // State for Community Events (Agenda & Event Komunitas)
  const [communityEvents, setCommunityEvents] = useState<any[]>(initialData.communityEvents)
  const [isLoadingEvents, setIsLoadingEvents] = useState(false)
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<any>(null)
  const [eventTitle, setEventTitle] = useState('')
  const [eventDesc, setEventDesc] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [eventIsOnline, setEventIsOnline] = useState(false)
  const [eventLinkUrl, setEventLinkUrl] = useState('')
  const [eventBannerUrl, setEventBannerUrl] = useState('https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80')
  const [eventMaxParticipants, setEventMaxParticipants] = useState('100')
  const [eventPrice, setEventPrice] = useState('0')
  const [eventOrganizer, setEventOrganizer] = useState('Pengurus Komunitas')
  const [isSavingEvent, setIsSavingEvent] = useState(false)
  const [isUploadingEventBanner, setIsUploadingEventBanner] = useState(false)
  const [registeredEventIds, setRegisteredEventIds] = useState<string[]>([])

  // State for Community Gallery (Galeri Dokumentasi Kegiatan)
  const [communityGallery, setCommunityGallery] = useState<any[]>(initialData.communityGallery)
  const [isLoadingGallery, setIsLoadingGallery] = useState(false)
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false)
  const [galleryTitle, setGalleryTitle] = useState('')
  const [galleryCaption, setGalleryCaption] = useState('')
  const [galleryCategory, setGalleryCategory] = useState('Kopdar & Networking')
  const [galleryDate, setGalleryDate] = useState('')
  const [galleryImageUrl, setGalleryImageUrl] = useState('')
  const [galleryCategoryFilter, setGalleryCategoryFilter] = useState('Semua')
  const [isUploadingGalleryImage, setIsUploadingGalleryImage] = useState(false)
  const [isSavingGallery, setIsSavingGallery] = useState(false)
  const [selectedLightboxImage, setSelectedLightboxImage] = useState<any>(null)

  // State for Member Directory Search & Filters & Detail Modal
  const [memberSearchQuery, setMemberSearchQuery] = useState('')
  const [memberRoleFilter, setMemberRoleFilter] = useState<'Semua' | 'Pengurus' | 'Anggota'>('Semua')
  const [selectedMemberDetail, setSelectedMemberDetail] = useState<any>(null)
  const [isMemberDetailModalOpen, setIsMemberDetailModalOpen] = useState(false)


  // State for Member Products (Produk Anggota) CRUD
  const [isMemberProductModalOpen, setIsMemberProductModalOpen] = useState(false)
  const [editingMemberProduct, setEditingMemberProduct] = useState<any>(null)
  const [memberProdTitle, setMemberProdTitle] = useState('')
  const [memberProdDesc, setMemberProdDesc] = useState('')
  const [memberProdPrice, setMemberProdPrice] = useState('')
  const [memberProdCategory, setMemberProdCategory] = useState('Makanan & Minuman')
  const [memberProdStock, setMemberProdStock] = useState('10')
  const [memberProdImageUrl, setMemberProdImageUrl] = useState('')
  const [memberProdMerchantId, setMemberProdMerchantId] = useState('')
  const [isSavingMemberProduct, setIsSavingMemberProduct] = useState(false)
  const [isUploadingMemberProdImage, setIsUploadingMemberProdImage] = useState(false)
  const [memberProdSearchQuery, setMemberProdSearchQuery] = useState('')
  const [memberProdCategoryFilter, setMemberProdCategoryFilter] = useState('Semua')
  const [selectedMemberProductDetail, setSelectedMemberProductDetail] = useState<any>(null)
  const [isMemberProductDetailModalOpen, setIsMemberProductDetailModalOpen] = useState(false)
  const [memberProductDetailQty, setMemberProductDetailQty] = useState(1)

  // State for Official Community Products (Produk Resmi Komunitas)
  const [communityOfficialProducts, setCommunityOfficialProducts] = useState<any[]>(initialData.communityOfficialProducts)
  const [isLoadingOfficialProducts, setIsLoadingOfficialProducts] = useState(false)
  const [isOfficialProductModalOpen, setIsOfficialProductModalOpen] = useState(false)
  const [editingOfficialProduct, setEditingOfficialProduct] = useState<any>(null)
  const [isDetailOfficialProductModalOpen, setIsDetailOfficialProductModalOpen] = useState(false)
  const [selectedOfficialProductDetail, setSelectedOfficialProductDetail] = useState<any>(null)
  const [officialProdName, setOfficialProdName] = useState('')
  const [officialProdDesc, setOfficialProdDesc] = useState('')
  const [officialProdPrice, setOfficialProdPrice] = useState('95000')
  const [officialProdStock, setOfficialProdStock] = useState('50')
  const [officialProdCategory, setOfficialProdCategory] = useState('Merchandise & Seragam')
  const [officialProdImageUrl, setOfficialProdImageUrl] = useState('https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=80')
  const [officialProdStatus, setOfficialProdStatus] = useState('TERSEDIA')
  const [officialProdSku, setOfficialProdSku] = useState('')
  const [isUploadingOfficialImage, setIsUploadingOfficialImage] = useState(false)
  const [isSavingOfficialProduct, setIsSavingOfficialProduct] = useState(false)
  const [officialProductSearchQuery, setOfficialProductSearchQuery] = useState('')
  const [officialProductCategoryFilter, setOfficialProductCategoryFilter] = useState('Semua')
  const [officialProductDetailQty, setOfficialProductDetailQty] = useState(1)

  // State for Announcements
  const [announcements, setAnnouncements] = useState<any[]>(initialData.announcements)
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(false)
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null)
  const [annTitle, setAnnTitle] = useState('')
  const [annContent, setAnnContent] = useState('')
  const [annPublishDate, setAnnPublishDate] = useState('')
  const [annStatus, setAnnStatus] = useState<'DRAFT' | 'PUBLISHED'>('PUBLISHED')
  const [annIsPinned, setAnnIsPinned] = useState(false)
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false)

  // State for Reports
  const [reports, setReports] = useState<any[]>(initialData.reports)
  const [isLoadingReports, setIsLoadingReports] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [editingReport, setEditingReport] = useState<any>(null)
  const [repTitle, setRepTitle] = useState('')
  const [repType, setRepType] = useState('Keuangan')
  const [repYear, setRepYear] = useState(new Date().getFullYear())
  const [repPublishDate, setRepPublishDate] = useState('')
  const [repStatus, setRepStatus] = useState<'DRAFT' | 'PUBLISHED'>('PUBLISHED')
  const [repFileUrl, setRepFileUrl] = useState('')
  const [repFileName, setRepFileName] = useState('')
  const [isUploadingReportFile, setIsUploadingReportFile] = useState(false)
  const [isSavingReport, setIsSavingReport] = useState(false)

  // Flag boolean untuk akses CRUD Admin / Superadmin / Ketua Koperasi
  const isCanManageCoop = Boolean(
    user && (
      user.role === 'ADMIN' ||
      user.role === 'SUPERADMIN' ||
      user.role === 'SUPER_ADMIN' ||
      user.isSuperAdmin ||
      Boolean((user as any).adminPermissions) ||
      user.id === community?.ketuaId
    )
  )

  // Dynamic Real Stats (0-default)
  const [realStats, setRealStats] = useState(initialData.realStats)

  // Cooperative Products & Projects
  const [coopProducts, setCoopProducts] = useState<any[]>(initialData.coopProducts)
  const [fundingProjects, setFundingProjects] = useState<any[]>(initialData.fundingProjects)



  // Handlers for Community Events CRUD
  const handleOpenCreateEvent = () => {
    setEditingEvent(null)
    setEventTitle('')
    setEventDesc('')
    setEventDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16))
    setEventLocation('Gedung Serbaguna Komunitas / Space')
    setEventIsOnline(false)
    setEventLinkUrl('')
    setEventBannerUrl('https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80')
    setEventMaxParticipants('100')
    setEventPrice('0')
    setEventOrganizer('Pengurus ' + (community?.name || 'Komunitas'))
    setIsEventModalOpen(true)
  }

  const handleOpenEditEvent = (ev: any) => {
    setEditingEvent(ev)
    setEventTitle(ev.title || '')
    setEventDesc(ev.description || '')
    setEventDate(ev.eventDate ? (ev.eventDate.includes('T') ? ev.eventDate.slice(0, 16) : ev.eventDate) : '')
    setEventLocation(ev.location || '')
    setEventIsOnline(Boolean(ev.isOnline))
    setEventLinkUrl(ev.linkUrl || '')
    setEventBannerUrl(ev.bannerUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80')
    setEventMaxParticipants(String(ev.maxParticipants || 100))
    setEventPrice(String(ev.price || 0))
    setEventOrganizer(ev.organizer || 'Pengurus Komunitas')
    setIsEventModalOpen(true)
  }

  const handleEventBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingEventBanner(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) {
        setEventBannerUrl(data.url)
        goeyToast.success('Banner event berhasil diunggah!')
      } else {
        goeyToast.error(data.error || 'Gagal mengunggah banner.')
      }
    } catch (err: any) {
      goeyToast.error(err.message || 'Gagal mengunggah banner.')
    } finally {
      setIsUploadingEventBanner(false)
    }
  }

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eventTitle.trim()) {
      goeyToast.error('Judul event wajib diisi!')
      return
    }
    if (!eventDate) {
      goeyToast.error('Tanggal event wajib ditentukan!')
      return
    }

    setIsSavingEvent(true)
    try {
      const fd = new FormData()
      fd.append('communityId', id)
      fd.append('title', eventTitle.trim())
      fd.append('description', eventDesc.trim())
      fd.append('eventDate', eventDate)
      fd.append('location', eventLocation.trim())
      fd.append('isOnline', String(eventIsOnline))
      fd.append('linkUrl', eventLinkUrl.trim())
      fd.append('bannerUrl', eventBannerUrl)
      fd.append('maxParticipants', eventMaxParticipants)
      fd.append('price', eventPrice)
      fd.append('organizer', eventOrganizer.trim())

      if (editingEvent) {
        const res = await updateCommunityEventAction(editingEvent.id, fd)
        if (res.error) {
          goeyToast.error(res.error)
        } else {
          goeyToast.success('Event berhasil diperbarui!')
          setIsEventModalOpen(false)
          setEditingEvent(null)
          loadData()
        }
      } else {
        const res = await createCommunityEventAction(fd)
        if (res.error) {
          goeyToast.error(res.error)
        } else {
          goeyToast.success('Event baru berhasil ditambahkan!')
          setIsEventModalOpen(false)
          loadData()
        }
      }
    } catch (err: any) {
      goeyToast.error(err.message || 'Gagal menyimpan event.')
    } finally {
      setIsSavingEvent(false)
    }
  }

  const handleDeleteEvent = (eventId: string, title: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Event Komunitas',
      message: `Apakah Anda yakin ingin menghapus event "${title}" dari jadwal kegiatan komunitas?`,
      confirmText: 'Ya, Hapus Event',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const res = await deleteCommunityEventAction(eventId, id)
          if (res?.error) {
            goeyToast.error(res.error)
          } else {
            setCommunityEvents(prev => prev.filter(e => e.id !== eventId))
            goeyToast.success('Event berhasil dihapus!')
          }
        } catch (err: any) {
          goeyToast.error(err.message || 'Gagal menghapus event.')
        }
      }
    })
  }

  const handleRegisterEvent = async (eventId: string, title: string) => {
    if (!user) {
      goeyToast.error('Silakan login terlebih dahulu untuk mendaftar event.')
      return
    }
    try {
      const res = await registerCommunityEventAction(eventId, id)
      if (res?.error) {
        goeyToast.error(res.error)
      } else {
        setRegisteredEventIds(prev => [...prev, eventId])
        goeyToast.success(`Pendaftaran Anda untuk event "${title}" berhasil dikonfirmasi!`)
        loadData()
      }
    } catch (err: any) {
      goeyToast.error('Gagal melakukan pendaftaran event.')
    }
  }

  // Handlers for Community Gallery CRUD
  const handleOpenCreateGallery = () => {
    setGalleryTitle('')
    setGalleryCaption('')
    setGalleryCategory('Kopdar & Networking')
    setGalleryDate(new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }))
    setGalleryImageUrl('')
    setIsGalleryModalOpen(true)
  }

  const handleGalleryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingGalleryImage(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) {
        setGalleryImageUrl(data.url)
        goeyToast.success('Foto berhasil diunggah!')
      } else {
        goeyToast.error(data.error || 'Gagal mengunggah foto.')
      }
    } catch (err: any) {
      goeyToast.error(err.message || 'Gagal mengunggah foto.')
    } finally {
      setIsUploadingGalleryImage(false)
    }
  }

  const handleSaveGallery = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!galleryTitle.trim()) {
      goeyToast.error('Judul foto wajib diisi!')
      return
    }
    if (!galleryImageUrl) {
      goeyToast.error('Foto kegiatan wajib diunggah!')
      return
    }

    setIsSavingGallery(true)
    try {
      const fd = new FormData()
      fd.append('communityId', id)
      fd.append('title', galleryTitle.trim())
      fd.append('caption', galleryCaption.trim())
      fd.append('category', galleryCategory)
      fd.append('date', galleryDate.trim())
      fd.append('imageUrl', galleryImageUrl)

      const res = await createCommunityGalleryItemAction(fd)
      if (res.error) {
        goeyToast.error(res.error)
      } else {
        goeyToast.success('Foto kegiatan berhasil ditambahkan ke galeri!')
        setIsGalleryModalOpen(false)
        loadData()
      }
    } catch (err: any) {
      goeyToast.error(err.message || 'Gagal menyimpan foto galeri.')
    } finally {
      setIsSavingGallery(false)
    }
  }

  const handleDeleteGallery = (itemId: string, title: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Foto Galeri',
      message: `Apakah Anda yakin ingin menghapus foto "${title}" dari galeri komunitas?`,
      confirmText: 'Ya, Hapus Foto',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const res = await deleteCommunityGalleryItemAction(itemId, id)
          if (res?.error) {
            goeyToast.error(res.error)
          } else {
            setCommunityGallery(prev => prev.filter(g => g.id !== itemId))
            goeyToast.success('Foto galeri berhasil dihapus!')
          }
        } catch (err: any) {
          goeyToast.error(err.message || 'Gagal menghapus foto galeri.')
        }
      }
    })
  }

  const handleOpenMemberDetail = (mem: any) => {
    setSelectedMemberDetail(mem)
    setIsMemberDetailModalOpen(true)
  }


  // Handlers for Member Products CRUD
  const handleOpenCreateMemberProduct = () => {
    setEditingMemberProduct(null)
    setMemberProdTitle('')
    setMemberProdDesc('')
    setMemberProdPrice('')
    setMemberProdCategory('Makanan & Minuman')
    setMemberProdStock('10')
    setMemberProdImageUrl('')
    setMemberProdMerchantId(user?.id || '')
    setIsMemberProductModalOpen(true)
  }

  const handleOpenEditMemberProduct = (p: any) => {
    setEditingMemberProduct(p)
    setMemberProdTitle(p.title || p.name || '')
    setMemberProdDesc(p.description || '')
    setMemberProdPrice(String(p.price || 0))
    setMemberProdCategory(p.category || 'Makanan & Minuman')
    setMemberProdStock(String(p.stock || 10))
    setMemberProdImageUrl(p.imageUrl || p.img || '')
    setMemberProdMerchantId(p.merchantId || user?.id || '')
    setIsMemberProductModalOpen(true)
  }

  const handleMemberProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingMemberProdImage(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) {
        setMemberProdImageUrl(data.url)
        goeyToast.success('Foto produk berhasil diunggah!')
      } else {
        goeyToast.error(data.error || 'Gagal mengunggah foto.')
      }
    } catch (err: any) {
      goeyToast.error(err.message || 'Gagal mengunggah foto.')
    } finally {
      setIsUploadingMemberProdImage(false)
    }
  }

  const handleSaveMemberProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!memberProdTitle.trim()) {
      goeyToast.error('Nama produk wajib diisi!')
      return
    }
    const numPrice = Number(memberProdPrice)
    if (isNaN(numPrice) || numPrice < 0) {
      goeyToast.error('Harga produk tidak valid!')
      return
    }

    setIsSavingMemberProduct(true)
    try {
      const fd = new FormData()
      fd.append('communityId', id)
      fd.append('title', memberProdTitle.trim())
      fd.append('description', memberProdDesc.trim())
      fd.append('price', String(numPrice))
      fd.append('category', memberProdCategory)
      fd.append('stock', memberProdStock || '10')
      fd.append('imageUrl', memberProdImageUrl || 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&h=200&fit=crop&q=80')
      fd.append('merchantId', memberProdMerchantId || user?.id || '')

      if (editingMemberProduct) {
        const res = await updateMemberProductAction(editingMemberProduct.id, fd)
        if (res.error) {
          goeyToast.error(res.error)
        } else {
          goeyToast.success('Produk anggota berhasil diperbarui!')
          setIsMemberProductModalOpen(false)
          setEditingMemberProduct(null)
          loadData()
        }
      } else {
        const res = await createMemberProductAction(fd)
        if (res.error) {
          goeyToast.error(res.error)
        } else {
          goeyToast.success('Produk anggota baru berhasil ditambahkan!')
          setIsMemberProductModalOpen(false)
          loadData()
        }
      }
    } catch (err: any) {
      goeyToast.error(err.message || 'Gagal menyimpan produk.')
    } finally {
      setIsSavingMemberProduct(false)
    }
  }

  const handleDeleteMemberProduct = (prodId: string, prodTitle: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Produk Anggota',
      message: `Apakah Anda yakin ingin menghapus produk "${prodTitle}" dari etalase anggota komunitas?`,
      confirmText: 'Ya, Hapus Produk',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const res = await deleteMemberProductAction(prodId, id)
          if (res?.error) {
            goeyToast.error(res.error)
          } else {
            setProducts((prev: any[]) => prev.filter((p: any) => p.id !== prodId))
            goeyToast.success('Produk berhasil dihapus!')
          }
        } catch (err: any) {
          goeyToast.error(err.message || 'Gagal menghapus produk.')
        }
      }
    })
  }

  const handleOpenDetailMemberProduct = (p: any) => {
    setSelectedMemberProductDetail(p)
    setMemberProductDetailQty(1)
    setIsMemberProductDetailModalOpen(true)
  }

  // Handlers for Official Community Products CRUD
  const handleOpenCreateOfficialProduct = () => {
    setEditingOfficialProduct(null)
    setOfficialProdName('')
    setOfficialProdDesc('')
    setOfficialProdPrice('95000')
    setOfficialProdStock('50')
    setOfficialProdCategory('Merchandise & Seragam')
    setOfficialProdImageUrl('https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=80')
    setOfficialProdStatus('TERSEDIA')
    setOfficialProdSku(`COMM-${Date.now().toString().slice(-6)}`)
    setIsOfficialProductModalOpen(true)
  }

  const handleOpenEditOfficialProduct = (prod: any) => {
    setEditingOfficialProduct(prod)
    setOfficialProdName(prod.name || '')
    setOfficialProdDesc(prod.description || '')
    setOfficialProdPrice(String(prod.price || 0))
    setOfficialProdStock(String(prod.stock || 0))
    setOfficialProdCategory(prod.category || 'Merchandise & Seragam')
    setOfficialProdImageUrl(prod.imageUrl || '')
    setOfficialProdStatus(prod.status || 'TERSEDIA')
    setOfficialProdSku(prod.sku || '')
    setIsOfficialProductModalOpen(true)
  }

  const handleOpenDetailOfficialProduct = (prod: any) => {
    setSelectedOfficialProductDetail(prod)
    setOfficialProductDetailQty(1)
    setIsDetailOfficialProductModalOpen(true)
  }

  const handleOfficialImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingOfficialImage(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) {
        setOfficialProdImageUrl(data.url)
        goeyToast.success('Foto produk berhasil diunggah!')
      } else {
        goeyToast.error(data.error || 'Gagal mengunggah foto.')
      }
    } catch (err: any) {
      goeyToast.error(err.message || 'Gagal mengunggah foto.')
    } finally {
      setIsUploadingOfficialImage(false)
    }
  }

  const handleSaveOfficialProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!officialProdName.trim()) {
      goeyToast.error('Nama produk wajib diisi!')
      return
    }
    const priceNum = Number(officialProdPrice) || 0
    if (priceNum <= 0) {
      goeyToast.error('Harga produk tidak valid!')
      return
    }

    setIsSavingOfficialProduct(true)
    try {
      const fd = new FormData()
      fd.append('communityId', id)
      fd.append('name', officialProdName.trim())
      fd.append('description', officialProdDesc.trim())
      fd.append('price', String(priceNum))
      fd.append('stock', String(Number(officialProdStock) || 0))
      fd.append('category', officialProdCategory)
      fd.append('imageUrl', officialProdImageUrl)
      fd.append('status', officialProdStatus)
      fd.append('sku', officialProdSku || `COMM-${Date.now()}`)

      if (editingOfficialProduct) {
        const res = await updateCommunityOfficialProductAction(editingOfficialProduct.id, fd)
        if (res.error) {
          goeyToast.error(res.error)
        } else {
          goeyToast.success('Produk resmi komunitas berhasil diperbarui!')
          setIsOfficialProductModalOpen(false)
          setEditingOfficialProduct(null)
          loadData()
        }
      } else {
        const res = await createCommunityOfficialProductAction(fd)
        if (res.error) {
          goeyToast.error(res.error)
        } else {
          goeyToast.success('Produk resmi komunitas berhasil ditambahkan!')
          setIsOfficialProductModalOpen(false)
          loadData()
        }
      }
    } catch (err: any) {
      goeyToast.error(err.message || 'Gagal menyimpan produk komunitas.')
    } finally {
      setIsSavingOfficialProduct(false)
    }
  }

  const handleDeleteOfficialProduct = (productId: string, productName: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Produk Komunitas',
      message: `Apakah Anda yakin ingin menghapus produk "${productName}" dari katalog resmi komunitas ini?`,
      confirmText: 'Ya, Hapus Produk',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const res = await deleteCommunityOfficialProductAction(productId, id)
          if (res?.error) {
            goeyToast.error(res.error)
          } else {
            setCommunityOfficialProducts(prev => prev.filter(p => p.id !== productId))
            goeyToast.success('Produk resmi komunitas berhasil dihapus!')
          }
        } catch (err: any) {
          goeyToast.error(err.message || 'Gagal menghapus produk.')
        }
      }
    })
  }

  const handleBuyOfficialProduct = (prod: any, qty: number = 1) => {
    try {
      const cartItem = {
        id: prod.id,
        name: prod.name,
        price: prod.price,
        quantity: qty,
        image: prod.imageUrl,
        merchantId: community.id,
        merchantName: `Resmi ${community.name}`,
        isOfficialCommunity: true
      }
      const existingCart = JSON.parse(localStorage.getItem('cart') || '[]')
      const idx = existingCart.findIndex((x: any) => x.id === prod.id)
      if (idx >= 0) {
        existingCart[idx].quantity += qty
      } else {
        existingCart.push(cartItem)
      }
      localStorage.setItem('cart', JSON.stringify(existingCart))
      window.dispatchEvent(new Event('cart-updated'))
      goeyToast.success(`"${prod.name}" (${qty} pcs) berhasil dimasukkan ke keranjang!`)
      if (isDetailOfficialProductModalOpen) {
        setIsDetailOfficialProductModalOpen(false)
      }
    } catch (_) {
      goeyToast.error('Gagal menambahkan ke keranjang.')
    }
  }

  // Product CRUD Modal State
  const [productModalOpen, setProductModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [prodName, setProdName] = useState('')
  const [prodType, setProdType] = useState('POKOK')
  const [prodAmount, setProdAmount] = useState('100000')
  const [prodPeriod, setProdPeriod] = useState('Sekali Bayar')
  const [prodIsMandatory, setProdIsMandatory] = useState(true)
  const [prodIsPremium, setProdIsPremium] = useState(false)
  const [prodDesc, setProdDesc] = useState('')

  const handleOpenCreateProduct = (isPremium = false) => {
    setEditingProduct(null)
    setProdName('')
    setProdType('SUKARELA')
    setProdAmount('50000')
    setProdPeriod('Setor Kapan Saja')
    setProdIsMandatory(false)
    setProdIsPremium(isPremium)
    setProdDesc('')
    setProductModalOpen(true)
  }

  const handleOpenEditProduct = (cp: any) => {
    setEditingProduct(cp)
    setProdName(cp.name)
    setProdType(cp.type)
    setProdAmount(String(cp.amount))
    setProdPeriod(cp.periodText || '')
    setProdIsMandatory(Boolean(cp.isMandatory))
    setProdIsPremium(Boolean(cp.isPremium))
    setProdDesc(cp.description || '')
    setProductModalOpen(true)
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus produk simpanan ini?')) return
    startTransition(async () => {
      const res = await deleteCooperativeProductAction(productId, id)
      if (res.success) {
        setCoopProducts(prev => prev.filter(p => p.id !== productId))
        goeyToast.success('Produk simpanan berhasil dihapus!')
      } else {
        alert(res.error || 'Gagal menghapus produk simpanan.')
      }
    })
  }

  const handleUpgradeTier = async (target: string) => {
    if (!community) return
    startTransition(async () => {
      try {
        const res = await upgradeCommunityTierAction(community.id, target)
        if (res.error) {
          goeyToast.error(res.error)
        } else {
          goeyToast.success(`Berhasil upgrade ke Koperasi ${target}!`)
          window.location.reload()
        }
      } catch (err: any) {
        goeyToast.error(err.message || 'Gagal melakukan upgrade.')
      }
    })
  }

  // Funding Project CRUD Modal State
  const [projectModalOpen, setProjectModalOpen] = useState(false)
  const [projTitle, setProjTitle] = useState('')
  const [projTarget, setProjTarget] = useState('50000000')
  const [projMinInvest, setProjMinInvest] = useState('100000')
  const [projReturn, setProjReturn] = useState('12')
  const [projDuration, setProjDuration] = useState('6')
  const [projDesc, setProjDesc] = useState('')
  const [projImageUrl, setProjImageUrl] = useState('')

  // Layout preview toggle: 'AUTO' | 'FREE' | 'PREMIUM'
  const [previewMode, setPreviewMode] = useState<'AUTO' | 'FREE' | 'PREMIUM'>('AUTO')
  const [viewMode, setViewMode] = useState<'landing' | 'dashboard'>('landing')

  // URL Tab & View Persistence on Refresh / Navigation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const tabParam = urlParams.get('tab')
      const viewParam = urlParams.get('view')
      if (tabParam) {
        setActiveSidebarNav(tabParam as any)
        setViewMode('dashboard')
      } else if (viewParam === 'dashboard') {
        setViewMode('dashboard')
      }
    }
  }, [])

  // Keuangan Koperasi / Loan States
  const [loans, setLoans] = useState<any[]>(initialData.loans)
  const [loanModalOpen, setLoanModalOpen] = useState(false)
  const [loanAmount, setLoanAmount] = useState('')
  const [loanPurpose, setLoanPurpose] = useState('')
  const [loanError, setLoanError] = useState<string | null>(null)
  const [copiedProductId, setCopiedProductId] = useState<string | null>(null)

  // Investment Modal State
  const [investModalOpen, setInvestModalOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [investAmount, setInvestAmount] = useState('100000')
  const [investPaymentMethod, setInvestPaymentMethod] = useState<'SALDO' | 'QRIS' | 'BANK'>('QRIS')
  const [disabledModules, setDisabledModules] = useState<string[]>(() => {
    try {
      const cfg = initialData.community?.landingPageConfig ? JSON.parse(initialData.community.landingPageConfig) : null
      return cfg?.disabledModules || []
    } catch (_) {
      return []
    }
  })
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [savedDisabledModules, setSavedDisabledModules] = useState<string[]>(() => {
    try {
      const cfg = initialData.community?.landingPageConfig ? JSON.parse(initialData.community.landingPageConfig) : null
      return cfg?.disabledModules || []
    } catch (_) {
      return []
    }
  })
  const [showUnsavedModal, setShowUnsavedModal] = useState(false)
  const [pendingTargetNav, setPendingTargetNav] = useState<string | null>(null)

  // Payment states for Koperasi Upgrade/Join
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'QRIS' | 'BANK'>('QRIS')
  const [isVerifying, setIsVerifying] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  // Setor Simpanan Modal & Interactive Transactions State
  const [userBalance, setUserBalance] = useState(0)
  const [paySavingsModalOpen, setPaySavingsModalOpen] = useState(false)
  const [selectedSavingsProduct, setSelectedSavingsProduct] = useState<any>(null)
  const [depositAmount, setDepositAmount] = useState('')
  const [depositPaymentMethod, setDepositPaymentMethod] = useState<'SALDO' | 'QRIS' | 'BANK'>('QRIS')
  const [shuDetailModalOpen, setShuDetailModalOpen] = useState(false)

  // Automated Savings Transaction & SHU States
  const [savingsTxModalOpen, setSavingsTxModalOpen] = useState(false)
  const [txMemberId, setTxMemberId] = useState('')
  const [txCategory, setTxCategory] = useState<'POKOK' | 'WAJIB' | 'SUKARELA'>('WAJIB')
  const [txType, setTxType] = useState<'SETOR' | 'TARIK'>('SETOR')
  const [txAmount, setTxAmount] = useState('50000')
  const [txDate, setTxDate] = useState('')
  const [txNotes, setTxNotes] = useState('')
  const [isRecordingSavingsTx, setIsRecordingSavingsTx] = useState(false)

  const [communitySavingsSummary, setCommunitySavingsSummary] = useState<any>(initialData.communitySavingsSummary)
  const [communityShuData, setCommunityShuData] = useState<any>(initialData.communityShuData)
  const [userShuSummary, setUserShuSummary] = useState<any>(null)

  // SHU Admin Form Config States
  const [shuNetProfit, setShuNetProfit] = useState('0')
  const [shuPctCadangan, setShuPctCadangan] = useState(0)
  const [shuPctJasaModal, setShuPctJasaModal] = useState(0)
  const [shuPctJasaUsaha, setShuPctJasaUsaha] = useState(0)
  const [shuPctPengurus, setShuPctPengurus] = useState(0)
  const [shuPctPengawas, setShuPctPengawas] = useState(0)
  const [shuPctKaryawan, setShuPctKaryawan] = useState(0)
  const [shuPctPendidikan, setShuPctPendidikan] = useState(0)
  const [shuPctSosial, setShuPctSosial] = useState(0)
  const [isCalculatingShu, setIsCalculatingShu] = useState(false)
  const [shuTab, setShuTab] = useState<'preview' | 'final'>('preview')

  // Multi-Tier Referral & KYC States
  const [refJoinFee, setRefJoinFee] = useState<number>(100000)
  const [refReferralBudget, setRefReferralBudget] = useState<number>(40000)
  const [refCommunityProfitShare, setRefCommunityProfitShare] = useState<number>(60000)
  const [refMaxTiers, setRefMaxTiers] = useState<number>(3)
  const [refTierPercentages, setRefTierPercentages] = useState<number[]>([50, 30, 20])
  const [refIsKycRequired, setRefIsKycRequired] = useState<boolean>(false)
  const [refCommissionMethod, setRefCommissionMethod] = useState<'PERCENTAGE' | 'NOMINAL'>('PERCENTAGE')
  const [refLogs, setRefLogs] = useState<any[]>([])
  const [isSavingRefSettings, setIsSavingRefSettings] = useState(false)
  const [kycWarningModalOpen, setKycWarningModalOpen] = useState(false)

  // Perkumpulan Premium Membership Config States
  const [communityMembershipType, setCommunityMembershipType] = useState<'FREE' | 'PREMIUM'>('PREMIUM')
  const [communityMemberFee, setCommunityMemberFee] = useState<number>(50000)
  const [communityMemberFeePeriod, setCommunityMemberFeePeriod] = useState<'MONTHLY' | 'YEARLY' | 'ONETIME'>('MONTHLY')

  const [requireMemberModalOpen, setRequireMemberModalOpen] = useState(false)
  const [requireMemberFeature, setRequireMemberFeature] = useState('Fitur Internal')
  const [openMemberMenuId, setOpenMemberMenuId] = useState<string | null>(null)
  const [kickTargetMember, setKickTargetMember] = useState<{ userId: string; name: string } | null>(null)
  const [isKicking, setIsKicking] = useState<string | null>(null)

  const handleKickMember = (userId: string, name: string) => {
    setKickTargetMember({ userId, name })
  }

  const handleConfirmKick = () => {
    if (!kickTargetMember) return
    const target = kickTargetMember
    setIsKicking(target.userId)

    startTransition(async () => {
      try {
        const res = await kickCommunityMemberAction(target.userId, id)
        if (res?.error) {
          goeyToast.error(res.error)
        } else {
          goeyToast.success(`Anggota "${target.name}" telah dikeluarkan.`)
          setMembers(prev => prev.filter((m: any) => m.userId !== target.userId))
        }
      } catch (e: any) {
        goeyToast.error('Gagal mengeluarkan anggota.')
      } finally {
        setIsKicking(null)
        setKickTargetMember(null)
      }
    })
  }

  const triggerMemberRequired = (featureName: string) => {
    setRequireMemberFeature(featureName)
    setRequireMemberModalOpen(true)
  }

  useEffect(() => {
    if (id) {
      getCommunityReferralConfig(id).then(res => {
        if (res.success && res.config) {
          setRefJoinFee(res.config.joinFee)
          setRefReferralBudget(res.config.referralBudget)
          setRefCommunityProfitShare(res.config.communityProfitShare)
          setRefMaxTiers(res.config.maxTiers)
          setRefTierPercentages(res.config.tierPercentages)
          if (res.config.isKycRequired !== undefined) {
            setRefIsKycRequired(res.config.isKycRequired)
          }
          if (res.config.commissionMethod) {
            setRefCommissionMethod(res.config.commissionMethod as 'PERCENTAGE' | 'NOMINAL')
          }
        }
      })
      getCommunityReferralHistory(id).then(res => {
        if (res.success && res.logs) {
          setRefLogs(res.logs)
        }
      })
    }
  }, [id])

  const handleSaveReferralSettings = async () => {
    // Validate: only enforce 100% total for PERCENTAGE mode
    if (refCommissionMethod === 'PERCENTAGE') {
      const totalPct = refTierPercentages.slice(0, refMaxTiers).reduce((a, b) => a + Number(b || 0), 0)
      if (Math.abs(totalPct - 100) > 0.1) {
        goeyToast.error('Total persentase tier harus 100%!')
        return
      }
    }
    setIsSavingRefSettings(true)
    const res = await updateCommunityReferralConfig({
      communityId: id,
      joinFee: refJoinFee,
      referralBudget: refReferralBudget,
      communityProfitShare: refCommunityProfitShare,
      maxTiers: refMaxTiers,
      tierPercentages: refTierPercentages.slice(0, refMaxTiers),
      isKycRequired: refIsKycRequired,
      commissionMethod: refCommissionMethod
    })
    setIsSavingRefSettings(false)
    if (res.success) {
      goeyToast.success('Pengaturan Referral Multi-Tier & KYC berhasil disimpan!')
    } else {
      goeyToast.error(res.error || 'Gagal menyimpan pengaturan referral.')
    }
  }

  const handleShareReferralLink = () => {
    const code = user?.referralCode || user?.username || 'REF001'
    const shortCommId = id && id.length > 12 ? id.slice(0, 8) : id
    const shareUrl = `${window.location.origin}/community/${shortCommId}?ref=${code}`
    navigator.clipboard.writeText(shareUrl)
    goeyToast.success(`Link referral disalin: ${shareUrl}`)
  }

  // Perahu Kita Perkumpulan navigation & filter states
  const [activeSidebarNav, setActiveSidebarNav] = useState<
    | 'beranda'
    | 'aktivitas'
    | 'diskusi'
    | 'event'
    | 'marketplace'
    | 'produk_komunitas'
    | 'anggota'
    | 'galeri'
    | 'pengumuman'
    | 'tentang'
    | 'business_matching'
    | 'pelatihan'
    | 'mentor'
    | 'kolaborasi'
    | 'kelas'
    | 'kompetisi'
    | 'startup'
    | 'merchant'
    | 'supplier'
    | 'promo'
    | 'simpanan'
    | 'pendanaan'
    | 'shu'
    | 'laporan'
    | 'pengaturan'
    | 'desain_landing'
  >('beranda')

  const [isManualScrolling, setIsManualScrolling] = useState(false)

  const [feedFilter, setFeedFilter] = useState<'semua' | 'diskusi' | 'pengumuman' | 'event' | 'produk'>('semua')

  const [recentTransactions, setRecentTransactions] = useState<any[]>([
    {
      id: 'tx-1',
      date: '23 Jul 2026',
      title: 'Setor Simpanan Wajib',
      amount: 50000,
      status: 'Berhasil',
      type: 'WAJIB',
      isIncome: true
    },
    {
      id: 'tx-2',
      date: '20 Jul 2026',
      title: 'Setor Simpanan Pokok',
      amount: 150000,
      status: 'Berhasil',
      type: 'POKOK',
      isIncome: true
    },
    {
      id: 'tx-3',
      date: '15 Jul 2026',
      title: 'Pendaftaran Anggota Koperasi',
      amount: 0,
      status: 'Berhasil',
      type: 'MEMBERSHIP',
      isIncome: true
    }
  ])

  const handleOpenPaySavings = (cp: any) => {
    if (!isMember) {
      triggerMemberRequired('Setor Simpanan & Iuran Keanggotaan')
      return
    }
    setSelectedSavingsProduct(cp)
    const targetAmt = Number(cp.amount || 50000)
    setDepositAmount(String(targetAmt))
    // If user balance is 0 or less than target amount, auto select QRIS for instant payment!
    if (userBalance >= targetAmt) {
      setDepositPaymentMethod('SALDO')
    } else {
      setDepositPaymentMethod('QRIS')
    }
    setPaySavingsModalOpen(true)
  }

  const handleConfirmDeposit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSavingsProduct) return
    const amt = Number(depositAmount) || 0
    if (amt <= 0) {
      goeyToast.error('Nominal setoran tidak valid.')
      return
    }

    if (depositPaymentMethod === 'SALDO' && amt > userBalance) {
      goeyToast.error(`Saldo Wallet Anda tidak cukup! (Sisa Saldo: Rp ${userBalance.toLocaleString('id-ID')})`)
      return
    }

    startTransition(async () => {
      try {
        const fd = new FormData()
        fd.append('communityId', id)
        fd.append('userId', user?.id || '')
        fd.append('type', selectedSavingsProduct.type)
        fd.append('transactionType', 'SETOR')
        fd.append('amount', String(amt))
        fd.append('date', new Date().toISOString())
        fd.append('notes', `Setor mandiri via ${depositPaymentMethod === 'SALDO' ? 'Saldo Wallet' : depositPaymentMethod}`)

        const res = await recordSavingsTransactionAction(fd)
        if (res.error) {
          goeyToast.error(res.error)
          return
        }

        if (depositPaymentMethod === 'SALDO') {
          setUserBalance(prev => prev - amt)
        }

        goeyToast.success(`Setor ${selectedSavingsProduct.name} sebesar Rp ${amt.toLocaleString('id-ID')} berhasil disetor!`)
        setPaySavingsModalOpen(false)
        loadData()
      } catch (err) {
        goeyToast.error('Gagal mencatat transaksi simpanan ke database.')
      }
    })
  }

  const [loading, setLoading] = useState(false)
  const [actionPending, startTransition] = useTransition()

  // Custom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    confirmText: string
    variant?: 'danger' | 'success' | 'warning'
    onConfirm: () => void | Promise<void>
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Konfirmasi',
    variant: 'danger',
    onConfirm: () => { }
  })

  const askConfirmation = (opts: {
    title: string
    message: string
    confirmText?: string
    variant?: 'danger' | 'success' | 'warning'
    onConfirm: () => void | Promise<void>
  }) => {
    setConfirmModal({
      isOpen: true,
      title: opts.title,
      message: opts.message,
      confirmText: opts.confirmText || 'Ya, Lanjutkan',
      variant: opts.variant || 'danger',
      onConfirm: opts.onConfirm
    })
  }

  // Edit Community Landing Page / Builder States
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editAkta, setEditAkta] = useState('')
  const [editAhu, setEditAhu] = useState('')
  const [editNpwp, setEditNpwp] = useState('')
  const [editDomisili, setEditDomisili] = useState('')
  const [editKontakPj, setEditKontakPj] = useState('')
  const [editWaGroupLink, setEditWaGroupLink] = useState('')
  const [editAvatarUrl, setEditAvatarUrl] = useState('')
  const [editCoverUrl, setEditCoverUrl] = useState('')
  const [settingsAvatarUrl, setSettingsAvatarUrl] = useState('')
  const [settingsCoverUrl, setSettingsCoverUrl] = useState('')
  const [editJoinFee, setEditJoinFee] = useState('')
  const [editMonthlyFee, setEditMonthlyFee] = useState('')
  const [editError, setEditError] = useState<string | null>(null)
  const [editSuccess, setEditSuccess] = useState<string | null>(null)

  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingSettingsAvatar, setUploadingSettingsAvatar] = useState(false)
  const [uploadingSettingsCover, setUploadingSettingsCover] = useState(false)

  const handleFileUpload = async (file: File, type: 'avatar' | 'cover', dest: 'edit' | 'settings' = 'edit') => {
    const setUploading = type === 'avatar'
      ? (dest === 'settings' ? setUploadingSettingsAvatar : setUploadingAvatar)
      : (dest === 'settings' ? setUploadingSettingsCover : setUploadingCover)
    const setUrl = type === 'avatar'
      ? (dest === 'settings' ? setSettingsAvatarUrl : setEditAvatarUrl)
      : (dest === 'settings' ? setSettingsCoverUrl : setEditCoverUrl)

    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'community')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Gagal mengunggah file.')
      }

      const data = await res.json()
      setUrl(data.url)
      goeyToast.success(`Foto ${type === 'avatar' ? 'Logo' : 'Sampul'} berhasil diunggah!`)
    } catch (e: any) {
      console.error(e)
      goeyToast.error(e.message || 'Terjadi kesalahan saat mengunggah file.')
    } finally {
      setUploading(false)
    }
  }

  async function loadData(isBackgroundSync: boolean = false) {
    try {
      const [
        currentUser,
        commDetailRes,
        memberListRes,
        statsRes,
        cProductsRes,
        fProjectsRes,
        loanListRes,
        shuRes,
        userShuRes,
        savingsRes,
        annListRes,
        repListRes,
        officialProductsRes,
        commEventsRes,
        commGalleryRes
      ] = await Promise.all([
        getCurrentUser().catch(() => null),
        getIndukCommunityDetail(id).catch(() => null),
        getIndukCommunityMembersAction(id).catch(() => []),
        getCommunityRealStatsAction(id).catch(() => null),
        getCooperativeProductsAction(id).catch(() => []),
        getMerchantFundingProjectsAction(id).catch(() => []),
        getCooperativeLoansAction(id).catch(() => []),
        getCommunityShuDataAction(id).catch(() => null),
        getUserShuSummaryAction(id).catch(() => null),
        getCommunitySavingsSummaryAction(id).catch(() => ({ success: false, summary: null })),
        getAnnouncementsAction(id).catch(() => []),
        getCooperativeReportsAction(id).catch(() => []),
        getCommunityOfficialProductsAction(id).catch(() => []),
        getCommunityEventsAction(id).catch(() => []),
        getCommunityGalleryAction(id).catch(() => [])
      ])

      setUser(currentUser)
      const userAny = currentUser as any
      if (userAny?.walletBalance !== undefined) {
        setUserBalance(userAny.walletBalance)
      } else if (userAny?.balance !== undefined) {
        setUserBalance(userAny.balance)
      }

      let commDetail = commDetailRes
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
      setCommunity(commDetail)
      setEditName(commDetail.name || '')
      setEditDescription(commDetail.description || '')
      setEditAkta(commDetail.aktaNotaris || '')
      setEditAhu(commDetail.nomorAhu || '')
      setEditNpwp(commDetail.nomorNpwp || '')
      setEditDomisili(commDetail.domisili || '')
      setEditKontakPj(commDetail.kontakPj || '')
      setEditWaGroupLink(commDetail.waGroupLink || '')
      setEditAvatarUrl(commDetail.avatarUrl || '')
      setEditCoverUrl(commDetail.coverUrl || '')
      setSettingsAvatarUrl(commDetail.avatarUrl || '')
      setSettingsCoverUrl(commDetail.coverUrl || '')
      setEditJoinFee(commDetail.joinFee ? String(commDetail.joinFee) : '')
      setEditMonthlyFee(commDetail.monthlyFee ? String(commDetail.monthlyFee) : '')

      // Get members
      const memberList = memberListRes || []
      setMembers(memberList)

      // Check if logged in user is a member
      if (currentUser) {
        const mem = memberList.find((m: any) => m.userId === currentUser.id)
        if (mem || currentUser.id === commDetail?.ketuaId) {
          setIsMember(true)
          if (mem) {
            setIsIndukMember(mem.isInduk)
            setMembershipDetails(mem)
          } else {
            setIsIndukMember(false)
            setMembershipDetails(null)
          }
        } else {
          setIsMember(false)
          setIsIndukMember(false)
          setMembershipDetails(null)
        }
      } else {
        setIsMember(false)
        setIsIndukMember(false)
        setMembershipDetails(null)
      }

      // Fetch products targeted strictly to members of this community
      const memberIds = memberList.map((m: any) => m.userId)
      if (memberIds.length > 0) {
        getProductsByMerchantIdsAction(memberIds)
          .then((communityProducts) => setProducts(communityProducts || []))
          .catch(() => setProducts([]))
      } else {
        setProducts([])
      }

      // Set cooperative loans
      setLoans(loanListRes || [])

      // Set real stats
      if (statsRes) {
        setRealStats(statsRes)
      }

      // Set cooperative products & funding projects
      setCoopProducts(cProductsRes || [])
      setFundingProjects(fProjectsRes || [])

      // Get disabled modules from landingPageConfig
      if (commDetailRes?.landingPageConfig) {
        try {
          const cfg = JSON.parse(commDetailRes.landingPageConfig)
          if (cfg?.disabledModules) {
            setDisabledModules(cfg.disabledModules)
            setSavedDisabledModules(cfg.disabledModules)
          } else {
            setDisabledModules([])
            setSavedDisabledModules([])
          }
        } catch (_) {
          setDisabledModules([])
          setSavedDisabledModules([])
        }
      } else {
        setDisabledModules([])
        setSavedDisabledModules([])
      }

      // Apply automated savings summary & SHU data from parallel fetch
      if (savingsRes?.success && savingsRes.summary) {
        setCommunitySavingsSummary(savingsRes.summary)
      }

      if (shuRes?.success) {
        setCommunityShuData(shuRes)
        if (shuRes.config) {
          setShuConfig(shuRes.config)
          setShuNetProfit(String(shuRes.config.totalNetProfit ?? 0))
          setShuPctCadangan(0)
          setShuPctJasaModal(shuRes.config.pctJasaModal ?? 0)
          setShuPctJasaUsaha(shuRes.config.pctJasaUsaha ?? 0)
          setShuPctPengurus(0)
          setShuPctPengawas(0)
          setShuPctKaryawan(0)
          setShuPctPendidikan(0)
          setShuPctSosial(0)
          setShuTab('final')
        }
      }

      if (userShuRes?.success && userShuRes.distributions) {
        setUserShuSummary(userShuRes.distributions)
      }

      // Set official community products, events, and gallery
      setCommunityOfficialProducts(officialProductsRes || [])
      setCommunityEvents(commEventsRes || [])
      setCommunityGallery(commGalleryRes || [])

      // Set announcements and reports directly from parallel fetch
      setAnnouncements(annListRes || [])
      setReports(repListRes || [])
      setIsLoadingAnnouncements(false)
      setIsLoadingReports(false)

      // Save to client-side SWR sessionStorage cache for 0ms next time
      try {
        if (commDetail) {
          sessionStorage.setItem(`cache_comm_detail_${id}`, JSON.stringify({
            community: commDetail,
            members: memberList,
            realStats: statsRes || null,
            officialProducts: officialProductsRes || [],
            events: commEventsRes || [],
            gallery: commGalleryRes || [],
            announcements: annListRes || [],
            reports: repListRes || [],
            coopProducts: cProductsRes || [],
            fundingProjects: fProjectsRes || [],
            loans: loanListRes || [],
            isMember: Boolean(currentUser && (memberList.some((m: any) => m.userId === currentUser.id) || currentUser.id === commDetail?.ketuaId))
          }))
        }
      } catch (_) {}

    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // The server already fetched fresh data for this exact request (see the
    // server component in page.tsx), so the initial state above is already
    // correct and at least as fresh as anything sessionStorage could offer -
    // reading the cache here would risk overwriting it with a stale entry
    // from a previous visit. Instead, write it through for a future soft
    // navigation back to this page, then revalidate quietly in the background.
    try {
      if (initialData.community) {
        sessionStorage.setItem(`cache_comm_detail_${id}`, JSON.stringify({
          community: initialData.community,
          members: initialData.members,
          realStats: initialData.realStats,
          officialProducts: initialData.communityOfficialProducts,
          events: communityEvents,
          gallery: initialData.communityGallery,
          announcements: initialData.announcements,
          reports: initialData.reports,
          coopProducts: initialData.coopProducts,
          fundingProjects: initialData.fundingProjects,
          loans: initialData.loans,
          isMember: initialData.isMember
        }))
      }
      if (initialData.user) {
        sessionStorage.setItem('cache_community_user', JSON.stringify(initialData.user))
      }
    } catch (_) {}

    loadData(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // ─── ANNOUNCEMENTS HANDLERS ───────────────────────────────────
  const handleOpenAnnouncementModal = (ann: any = null) => {
    if (ann) {
      setEditingAnnouncement(ann)
      setAnnTitle(ann.title)
      setAnnContent(ann.content)
      setAnnPublishDate(ann.publishedAt ? new Date(ann.publishedAt).toISOString().split('T')[0] : '')
      setAnnStatus(ann.status || 'PUBLISHED')
      setAnnIsPinned(ann.isPinned || false)
    } else {
      setEditingAnnouncement(null)
      setAnnTitle('')
      setAnnContent('')
      setAnnPublishDate(new Date().toISOString().split('T')[0])
      setAnnStatus('PUBLISHED')
      setAnnIsPinned(false)
    }
    setIsAnnouncementModalOpen(true)
  }

  const handleSubmitAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!annTitle.trim() || !annContent.trim()) {
      goeyToast.error('Judul dan isi pengumuman wajib diisi.')
      return
    }

    setIsSavingAnnouncement(true)
    const fd = new FormData()
    fd.append('communityId', id)
    fd.append('title', annTitle)
    fd.append('content', annContent)
    fd.append('publishedAt', annPublishDate)
    fd.append('status', annStatus)
    fd.append('isPinned', String(annIsPinned))

    try {
      let res: any
      if (editingAnnouncement) {
        res = await updateAnnouncementAction(editingAnnouncement.id, fd)
      } else {
        res = await createAnnouncementAction(fd)
      }

      if (res.success) {
        goeyToast.success(editingAnnouncement ? 'Pengumuman diperbarui!' : 'Pengumuman diterbitkan!')
        setIsAnnouncementModalOpen(false)
        
        // Refresh local list
        const annList = await getAnnouncementsAction(id).catch(() => [])
        setAnnouncements(annList || [])
      } else {
        goeyToast.error(res.error || 'Gagal menyimpan pengumuman.')
      }
    } catch (err: any) {
      goeyToast.error(err.message || 'Terjadi kesalahan sistem.')
    } finally {
      setIsSavingAnnouncement(false)
    }
  }

  const handleDeleteAnnouncement = async (annId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pengumuman ini?')) return

    try {
      const res: any = await deleteAnnouncementAction(annId, id)
      if (res.success) {
        goeyToast.success('Pengumuman dihapus!')
        setAnnouncements(prev => prev.filter(x => x.id !== annId))
      } else {
        goeyToast.error(res.error || 'Gagal menghapus pengumuman.')
      }
    } catch (err: any) {
      goeyToast.error(err.message || 'Terjadi kesalahan sistem.')
    }
  }

  const handleTogglePublishAnnouncement = async (ann: any) => {
    try {
      const res: any = await togglePublishAnnouncementAction(ann.id, ann.status, id)
      if (res.success) {
        goeyToast.success(ann.status === 'DRAFT' ? 'Pengumuman dipublikasikan!' : 'Pengumuman disimpan sebagai draft!')
        
        // Refresh local list
        const annList = await getAnnouncementsAction(id).catch(() => [])
        setAnnouncements(annList || [])
      } else {
        goeyToast.error(res.error || 'Gagal mengubah status publikasi.')
      }
    } catch (err: any) {
      goeyToast.error(err.message || 'Terjadi kesalahan sistem.')
    }
  }

  const handleTogglePinAnnouncement = async (ann: any) => {
    try {
      const res: any = await togglePinAnnouncementAction(ann.id, ann.isPinned, id)
      if (res.success) {
        goeyToast.success(ann.isPinned ? 'Pin dilepas!' : 'Pengumuman dipatok/terpaku di atas!')
        
        // Refresh local list
        const annList = await getAnnouncementsAction(id).catch(() => [])
        setAnnouncements(annList || [])
      } else {
        goeyToast.error(res.error || 'Gagal mengubah status pin.')
      }
    } catch (err: any) {
      goeyToast.error(err.message || 'Terjadi kesalahan sistem.')
    }
  }

  // ─── REPORTS HANDLERS ──────────────────────────────────────────
  const handleOpenReportModal = (rep: any = null) => {
    if (rep) {
      setEditingReport(rep)
      setRepTitle(rep.title)
      setRepType(rep.type)
      setRepYear(rep.year)
      setRepPublishDate(rep.publishedAt ? new Date(rep.publishedAt).toISOString().split('T')[0] : '')
      setRepStatus(rep.status || 'PUBLISHED')
      setRepFileUrl(rep.fileUrl || '')
      setRepFileName(rep.fileUrl ? rep.fileUrl.split('/').pop() || '' : '')
    } else {
      setEditingReport(null)
      setRepTitle('')
      setRepType('Keuangan')
      setRepYear(new Date().getFullYear())
      setRepPublishDate(new Date().toISOString().split('T')[0])
      setRepStatus('PUBLISHED')
      setRepFileUrl('')
      setRepFileName('')
    }
    setIsReportModalOpen(true)
  }

  const handleReportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'pdf' && ext !== 'xlsx' && ext !== 'xls') {
      goeyToast.error('Hanya diperbolehkan mengunggah file PDF atau Excel (.xlsx/.xls).')
      return
    }

    setIsUploadingReportFile(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('folder', 'reports')

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: fd
      })
      const resData = await response.json()
      if (response.ok && resData.url) {
        setRepFileUrl(resData.url)
        setRepFileName(file.name)
        goeyToast.success('File laporan berhasil diunggah!')
      } else {
        goeyToast.error(resData.error || 'Gagal mengunggah file.')
      }
    } catch (err: any) {
      goeyToast.error(err.message || 'Gagal mengunggah file.')
    } finally {
      setIsUploadingReportFile(false)
    }
  }

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!repTitle.trim() || !repType.trim() || !repFileUrl.trim()) {
      goeyToast.error('Judul, jenis laporan, dan file wajib diisi.')
      return
    }

    setIsSavingReport(true)
    const fd = new FormData()
    fd.append('communityId', id)
    fd.append('title', repTitle)
    fd.append('type', repType)
    fd.append('year', String(repYear))
    fd.append('fileUrl', repFileUrl)
    fd.append('publishedAt', repPublishDate)
    fd.append('status', repStatus)

    try {
      let res: any
      if (editingReport) {
        res = await updateCooperativeReportAction(editingReport.id, fd)
      } else {
        res = await createCooperativeReportAction(fd)
      }

      if (res.success) {
        goeyToast.success(editingReport ? 'Laporan diperbarui!' : 'Laporan ditambahkan!')
        setIsReportModalOpen(false)
        
        // Refresh local list
        const repList = await getCooperativeReportsAction(id).catch(() => [])
        setReports(repList || [])
      } else {
        goeyToast.error(res.error || 'Gagal menyimpan laporan.')
      }
    } catch (err: any) {
      goeyToast.error(err.message || 'Terjadi kesalahan sistem.')
    } finally {
      setIsSavingReport(false)
    }
  }

  const handleDeleteReport = async (repId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus laporan ini?')) return

    try {
      const res: any = await deleteCooperativeReportAction(repId, id)
      if (res.success) {
        goeyToast.success('Laporan dihapus!')
        setReports(prev => prev.filter(x => x.id !== repId))
      } else {
        goeyToast.error(res.error || 'Gagal menghapus laporan.')
      }
    } catch (err: any) {
      goeyToast.error(err.message || 'Terjadi kesalahan sistem.')
    }
  }

  const handleTogglePublishReport = async (rep: any) => {
    try {
      const res: any = await togglePublishReportAction(rep.id, rep.status, id)
      if (res.success) {
        goeyToast.success(rep.status === 'DRAFT' ? 'Laporan dipublikasikan!' : 'Laporan disimpan sebagai draft!')
        
        // Refresh local list
        const repList = await getCooperativeReportsAction(id).catch(() => [])
        setReports(repList || [])
      } else {
        goeyToast.error(res.error || 'Gagal mengubah status publikasi.')
      }
    } catch (err: any) {
      goeyToast.error(err.message || 'Terjadi kesalahan sistem.')
    }
  }

  const handleAddToCart = async (product: any) => {
    if (!user) {
      goeyToast.error('Silakan login terlebih dahulu untuk menambahkan produk ke keranjang.')
      router.push('/auth?tab=login')
      return
    }

    try {
      const cartKey = `teras_cart_${user.id}_${id}`
      const storedCart = localStorage.getItem(cartKey)
      let currentCart: any[] = []

      if (storedCart) {
        try {
          currentCart = JSON.parse(storedCart)
        } catch (_) {}
      }

      const existingIndex = currentCart.findIndex((item: any) => item.productId === product.id)
      if (existingIndex > -1) {
        const newQty = currentCart[existingIndex].quantity + 1
        if (newQty > product.stock) {
          goeyToast.error(`Stok produk tidak mencukupi. Maksimum tersedia: ${product.stock}`)
          return
        }
        currentCart[existingIndex].quantity = newQty
      } else {
        if (product.stock < 1) {
          goeyToast.error('Stok produk habis.')
          return
        }
        currentCart.push({ productId: product.id, quantity: 1 })
      }

      localStorage.setItem(cartKey, JSON.stringify(currentCart))
      
      // Notify badge components in real-time
      window.dispatchEvent(new Event('storage'))

      goeyToast.success(`"${product.name || product.title}" ditambahkan ke keranjang!`)

      // Create database notification
      await createUserNotificationAction(
        'CART_ADD',
        'Produk Masuk Keranjang',
        `Produk "${product.name || product.title}" berhasil ditambahkan ke keranjang belanja Anda.`,
        `/cart?communityId=${id}`
      )
    } catch (e: any) {
      console.error(e)
      goeyToast.error('Gagal menambahkan produk ke keranjang.')
    }
  }

  const handleRecordSavingsTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!txMemberId) {
      goeyToast.error('Pilih anggota koperasi terlebih dahulu.')
      return
    }
    if (Number(txAmount) <= 0) {
      goeyToast.error('Nominal transaksi harus lebih dari 0.')
      return
    }

    setIsRecordingSavingsTx(true)
    try {
      const fd = new FormData()
      fd.append('communityId', id)
      fd.append('userId', txMemberId)
      fd.append('type', txCategory)
      fd.append('transactionType', txType)
      fd.append('amount', txAmount)
      fd.append('date', txDate || new Date().toISOString())
      fd.append('notes', txNotes)

      const res = await recordSavingsTransactionAction(fd)
      if (res.error) {
        goeyToast.error(res.error)
      } else {
        goeyToast.success(`Berhasil mencatat transaksi ${txType === 'SETOR' ? 'Setor' : 'Tarik'} Simpanan ${txCategory}!`)
        setSavingsTxModalOpen(false)
        setTxNotes('')
        setTxAmount('50000')
        loadData()
      }
    } catch (err: any) {
      goeyToast.error('Terjadi kesalahan sistem saat mencatat simpanan.')
    } finally {
      setIsRecordingSavingsTx(false)
    }
  }

  const handleCalculateAndSaveShu = async (e: React.FormEvent) => {
    e.preventDefault()
    const profitNum = Number(shuNetProfit)
    if (profitNum < 0) {
      goeyToast.error('Nominal SHU Bersih / Laba Koperasi tidak boleh kurang dari 0.')
      return
    }

    setIsCalculatingShu(true)
    try {
      const fd = new FormData()
      fd.append('communityId', id)
      fd.append('year', String(new Date().getFullYear()))
      fd.append('totalNetProfit', String(profitNum))
      fd.append('pctCadangan', '0')
      fd.append('pctJasaModal', String(shuPctJasaModal))
      fd.append('pctJasaUsaha', String(shuPctJasaUsaha))
      fd.append('pctPengurus', '0')
      fd.append('pctPengawas', '0')
      fd.append('pctKaryawan', '0')
      fd.append('pctPendidikan', '0')
      fd.append('pctSosial', '0')
      fd.append('pctPembangunanDaerah', '0')

      const res = await calculateAndSaveShuAction(fd)
      if (res.error) {
        goeyToast.error(res.error)
      } else {
        goeyToast.success('Kalkulasi & pembagian SHU anggota berhasil dihitung secara otomatis!')
        loadData()
        setShuTab('final')
      }
    } catch (err: any) {
      goeyToast.error('Terjadi kesalahan saat menghitung SHU.')
    } finally {
      setIsCalculatingShu(false)
    }
  }

  const handleJoin = async () => {
    if (!user) {
      router.push('/auth?tab=register')
      return
    }

    if (community?.type === 'KOPERASI' && !isMember) {
      setPaymentModalOpen(true)
      return
    }

    // Free Perkumpulan join
    startTransition(async () => {
      const res = await joinIndukCommunity(id, true)
      if ((res as any).needsKyc || (res.error && res.error.includes('KYC'))) {
        setKycWarningModalOpen(true)
        return
      }
      if (res.error) {
        goeyToast.error(res.error)
      } else {
        goeyToast.success('Berhasil bergabung ke Komunitas!')
        loadData()
      }
    })
  }

  const handleConfirmPayment = () => {
    setIsVerifying(true)
    setTimeout(async () => {
      try {
        const res = await joinIndukCommunity(id, true)
        if ((res as any).needsKyc || (res.error && res.error.includes('KYC'))) {
          setIsVerifying(false)
          setPaymentModalOpen(false)
          setKycWarningModalOpen(true)
          return
        }
        if (res.error) {
          goeyToast.error(res.error)
          setIsVerifying(false)
        } else {
          setPaymentSuccess(true)
          setIsVerifying(false)
          setTimeout(() => {
            setPaymentModalOpen(false)
            setPaymentSuccess(false)
            setIsMember(true)
            loadData()
          }, 2000)
        }
      } catch (e) {
        console.error(e)
        setIsVerifying(false)
      }
    }, 2000)
  }



  const handleToggleModule = (moduleId: string) => {
    setDisabledModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    )
  }

  const arraysEqual = (a: string[], b: string[]) => {
    if (a.length !== b.length) return false
    const sortedA = [...a].sort()
    const sortedB = [...b].sort()
    return sortedA.every((val, index) => val === sortedB[index])
  }

  const handleSidebarClick = (targetId: string) => {
    if (targetId === 'landing_view') {
      setViewMode('landing')
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href)
        url.searchParams.delete('tab')
        url.searchParams.delete('view')
        window.history.replaceState(null, '', url.toString())
      }
      return
    }
    if (activeSidebarNav === 'pengaturan' && targetId !== 'pengaturan' && !arraysEqual(disabledModules, savedDisabledModules)) {
      setPendingTargetNav(targetId)
      setShowUnsavedModal(true)
      return
    }
    setActiveSidebarNav(targetId as any)
    setViewMode('dashboard')
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('view', 'dashboard')
      url.searchParams.set('tab', targetId)
      window.history.replaceState(null, '', url.toString())
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (activeSidebarNav === 'pengaturan' && !arraysEqual(disabledModules, savedDisabledModules)) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [disabledModules, savedDisabledModules, activeSidebarNav])

  const handleSaveSettings = async () => {
    if (!community) return
    setIsSavingSettings(true)
    try {
      const formData = new FormData()
      formData.append('name', community.name)
      formData.append('description', community.description || '')
      if (community.aktaNotaris) formData.append('aktaNotaris', community.aktaNotaris)
      if (community.nomorAhu) formData.append('nomorAhu', community.nomorAhu)
      if (community.nomorNpwp) formData.append('nomorNpwp', community.nomorNpwp)
      if (community.domisili) formData.append('domisili', community.domisili)
      if (community.kontakPj) formData.append('kontakPj', community.kontakPj)
      formData.append('avatarUrl', settingsAvatarUrl)
      formData.append('coverUrl', settingsCoverUrl)
      if (community.waGroupLink) formData.append('waGroupLink', community.waGroupLink)
      formData.append('joinFee', String(community.joinFee || 0))
      formData.append('monthlyFee', String(community.monthlyFee || 0))

      // Update landingPageConfig
      let currentCfg: any = {}
      if (community.landingPageConfig) {
        try {
          currentCfg = JSON.parse(community.landingPageConfig)
        } catch (_) {}
      }
      currentCfg.disabledModules = disabledModules
      formData.append('landingPageConfig', JSON.stringify(currentCfg))

      const res = await updateIndukCommunity(community.id, formData)
      if (res.success) {
        goeyToast.success('Pengaturan fitur komunitas berhasil disimpan!')
        setSavedDisabledModules(disabledModules)
        if (res.community) {
          setCommunity(res.community)
          setSettingsAvatarUrl(res.community.avatarUrl || '')
          setSettingsCoverUrl(res.community.coverUrl || '')
        }
      } else {
        goeyToast.error(res.error || 'Gagal menyimpan pengaturan.')
      }
    } catch (e: any) {
      goeyToast.error('Gagal menyimpan pengaturan.')
    } finally {
      setIsSavingSettings(false)
    }
  }

  const handleLoanSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoanError(null)

    if (!loanAmount || !loanPurpose) {
      setLoanError('Semua kolom wajib diisi.')
      return
    }

    const formData = new FormData()
    formData.append('communityId', id)
    formData.append('amount', loanAmount)
    formData.append('purpose', loanPurpose)

    const res = await submitCooperativeLoanAction(formData)
    if (res.error) {
      setLoanError(res.error)
    } else {
      goeyToast.success('Pengajuan pinjaman modal berhasil dikirim!')
      setLoanAmount('')
      setLoanPurpose('')
      setLoanModalOpen(false)
      loadData()
    }
  }

  const handleApproveLoan = async (loanId: string, role: 'KETUA' | 'ADMIN') => {
    askConfirmation({
      title: 'Setujui Pinjaman Modal',
      message: 'Apakah Anda yakin ingin menyetujui pengajuan pinjaman modal ini?',
      confirmText: 'Setujui',
      variant: 'success',
      onConfirm: async () => {
        const res = await approveCooperativeLoanAction(loanId, role)
        if (res.error) {
          goeyToast.error(res.error)
        } else {
          goeyToast.success('Pinjaman modal berhasil disetujui!')
          loadData()
        }
      }
    })
  }

  const handleRejectLoan = async (loanId: string, role: 'KETUA' | 'ADMIN') => {
    askConfirmation({
      title: 'Tolak Pinjaman Modal',
      message: 'Apakah Anda yakin ingin menolak pengajuan pinjaman modal ini?',
      confirmText: 'Tolak Pinjaman',
      variant: 'danger',
      onConfirm: async () => {
        const res = await rejectCooperativeLoanAction(loanId, role)
        if (res.error) {
          goeyToast.error(res.error)
        } else {
          goeyToast.success('Pinjaman modal berhasil ditolak.')
          loadData()
        }
      }
    })
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditError(null)
    setEditSuccess(null)

    if (!editName || !editDescription) {
      setEditError('Nama dan deskripsi komunitas wajib diisi.')
      return
    }

    const formData = new FormData()
    formData.append('name', editName)
    formData.append('description', editDescription)
    formData.append('aktaNotaris', editAkta)
    formData.append('nomorAhu', editAhu)
    formData.append('nomorNpwp', editNpwp)
    formData.append('domisili', editDomisili)
    formData.append('kontakPj', editKontakPj)
    formData.append('waGroupLink', editWaGroupLink)
    formData.append('avatarUrl', editAvatarUrl)
    formData.append('coverUrl', editCoverUrl)
    formData.append('joinFee', editJoinFee)
    formData.append('monthlyFee', editMonthlyFee)

    startTransition(async () => {
      const res = await updateIndukCommunity(id, formData)
      if (res.error) {
        setEditError(res.error)
      } else {
        setEditSuccess('Landing page komunitas berhasil diperbarui!')
        setTimeout(() => {
          setEditModalOpen(false)
          setEditSuccess(null)
          loadData()
        }, 1500)
      }
    })
  }

  const nameLower = (community?.name || '').toLowerCase()
  const catLower = (community?.category || '').toLowerCase()
  const typeLower = (community?.type || '').toLowerCase()

  // Strict templateType check with backward-compatible auto-detection for older communities
  const activeTemplate = community?.templateType || (
    typeLower === 'koperasi' || catLower === 'koperasi' || nameLower.includes('koperasi') ? 'Koperasi' :
    catLower === 'kuliner' || catLower === 'culinary' || nameLower.includes('kuliner') ? 'Culinary' :
    catLower === 'business' || nameLower.includes('kopjaswara') || nameLower.includes('bisnis') || nameLower.includes('umkm') ? 'Business' :
    catLower === 'education' || nameLower.includes('pelajar') || nameLower.includes('pengusaha') || nameLower.includes('pendidikan') ? 'Education' :
    'Community'
  )

  const isKoperasi = activeTemplate === 'Koperasi'

  let coopTier = 'BASIC'
  if (community?.landingPageConfig) {
    try {
      const cfg = JSON.parse(community.landingPageConfig)
      if (cfg.coopTier) coopTier = cfg.coopTier
    } catch (_) {}
  } else if (isKoperasi && (community?.joinFee > 0 || community?.monthlyFee > 0 || community?.category === 'PAID')) {
    coopTier = 'PLUS'
  }

  const isKoperasiPremium = isKoperasi && coopTier !== 'BASIC'
  const isDefaultProduct = editingProduct && (editingProduct.type === 'POKOK' || editingProduct.type === 'WAJIB')
  const isKuliner = activeTemplate === 'Culinary'
  const isBusiness = activeTemplate === 'Business'
  const isEducation = activeTemplate === 'Education'
  const isPerahu = activeTemplate === 'Community'

  const sidebarNavList = isKoperasi ? [
    { id: 'beranda', label: 'Beranda', icon: Home },
    { id: 'diskusi', label: 'Diskusi', icon: MessageSquare },
    { id: 'simpanan', label: 'Simpanan', icon: Wallet },
    { id: 'pendanaan', label: 'Pendanaan', icon: Landmark, badge: 'PRO' },
    { id: 'shu', label: 'SHU', icon: PieChart },
    { id: 'produk_komunitas', label: 'Produk Komunitas', icon: Package },
    { id: 'marketplace', label: 'Marketplace', icon: Store },
    { id: 'laporan', label: 'Laporan', icon: FileText },
    { id: 'anggota', label: 'Anggota', icon: Users },
    { id: 'pengumuman', label: 'Pengumuman', icon: Megaphone },
    { id: 'tentang', label: 'Tentang', icon: Info },
  ] : isBusiness ? [
    { id: 'beranda', label: 'Beranda', icon: Home },
    { id: 'diskusi', label: 'Diskusi', icon: MessageSquare },
    { id: 'business_matching', label: 'Business Matching', icon: Handshake },
    { id: 'pelatihan', label: 'Pelatihan', icon: GraduationCap },
    { id: 'mentor', label: 'Mentor', icon: Award },
    { id: 'kolaborasi', label: 'Kolaborasi', icon: Users },
    { id: 'produk_komunitas', label: 'Produk Komunitas', icon: Package },
    { id: 'marketplace', label: 'Produk UMKM', icon: Store },
    { id: 'anggota', label: 'Anggota', icon: Users },
    { id: 'event', label: 'Event', icon: Calendar },
    { id: 'pengumuman', label: 'Pengumuman', icon: Megaphone },
    { id: 'tentang', label: 'Tentang', icon: Info },
  ] : isEducation ? [
    { id: 'beranda', label: 'Beranda', icon: Home },
    { id: 'kelas', label: 'Kelas', icon: BookOpen },
    { id: 'mentor', label: 'Mentor', icon: Award },
    { id: 'kompetisi', label: 'Kompetisi', icon: Trophy },
    { id: 'startup', label: 'Startup', icon: Rocket },
    { id: 'produk_komunitas', label: 'Produk Komunitas', icon: Package },
    { id: 'event', label: 'Event', icon: Calendar },
    { id: 'diskusi', label: 'Diskusi', icon: MessageSquare },
    { id: 'pengumuman', label: 'Pengumuman', icon: Megaphone },
    { id: 'tentang', label: 'Tentang', icon: Info },
  ] : isKuliner ? [
    { id: 'beranda', label: 'Beranda', icon: Home },
    { id: 'diskusi', label: 'Diskusi', icon: MessageSquare },
    { id: 'merchant', label: 'Merchant', icon: Store },
    { id: 'produk_komunitas', label: 'Produk Komunitas', icon: Package },
    { id: 'marketplace', label: 'Produk', icon: ShoppingBag },
    { id: 'supplier', label: 'Supplier', icon: Truck },
    { id: 'event', label: 'Event', icon: Calendar },
    { id: 'galeri', label: 'Galeri', icon: ImageIcon },
    { id: 'anggota', label: 'Anggota', icon: Users },
    { id: 'promo', label: 'Promo', icon: Tag },
    { id: 'tentang', label: 'Tentang', icon: Info },
  ] : [
    { id: 'beranda', label: 'Beranda', icon: Home },
    { id: 'aktivitas', label: 'Aktivitas', icon: Activity },
    { id: 'diskusi', label: 'Diskusi', icon: MessageSquare },
    { id: 'event', label: 'Event', icon: Calendar },
    { id: 'galeri', label: 'Galeri', icon: ImageIcon },
    { id: 'anggota', label: 'Anggota', icon: Users },
    { id: 'produk_komunitas', label: 'Produk Komunitas', icon: Package },
    { id: 'marketplace', label: 'Produk Anggota', icon: Store },
    { id: 'pengumuman', label: 'Pengumuman', icon: Megaphone },
    { id: 'tentang', label: 'Tentang', icon: Info },
  ]

  const togglableModules = sidebarNavList.filter(
    (item) => item.id !== 'beranda' && item.id !== 'tentang' && item.id !== 'anggota'
  )

  // Content tabs visible to this viewer (visitor/member/admin), independent of
  // template - shared by the desktop sidebar, the responsive mobile bar, and
  // the "Lainnya" overflow popup so all three always agree on the same set.
  const filteredContentTabs = sidebarNavList.filter((item) => {
    if (!isCanManageCoop && !isMember) {
      return ['beranda', 'produk_komunitas', 'marketplace', 'tentang'].includes(item.id)
    }
    if (!isCanManageCoop && item.id === 'laporan') return false
    return !disabledModules.includes(item.id)
  })

  const activeSidebarNavList = [
    { id: 'landing_view', label: 'Halaman Landing', icon: ExternalLink },
    ...(isCanManageCoop ? [{ id: 'desain_landing', label: 'Desain Landing', icon: Sparkles, badge: 'EDIT' }] : []),
    ...filteredContentTabs,
    ...(isCanManageCoop ? [{ id: 'pengaturan', label: 'Pengaturan', icon: Sliders }] : [])
  ]

  // Responsive mobile tab bar: measure how many content tabs actually fit in
  // the available width (plus room for the "Lainnya" button) and show exactly
  // that many directly - the rest fold into "Lainnya" alongside the tabs that
  // always stay there (Halaman Landing, Desain Landing, Pengaturan).
  const mobileNavBarRef = useRef<HTMLDivElement>(null)
  const mobileNavMeasureRef = useRef<HTMLDivElement>(null)
  const [visibleMobileTabCount, setVisibleMobileTabCount] = useState(filteredContentTabs.length)

  useLayoutEffect(() => {
    const container = mobileNavBarRef.current
    const measure = mobileNavMeasureRef.current
    if (!container || !measure) return

    function recalculate() {
      if (!container || !measure) return
      const containerStyle = window.getComputedStyle(container)
      const paddingLeft = parseFloat(containerStyle.paddingLeft) || 0
      const paddingRight = parseFloat(containerStyle.paddingRight) || 0
      const gap = parseFloat(containerStyle.columnGap || containerStyle.gap) || 0
      const availableWidth = container.clientWidth - paddingLeft - paddingRight

      const itemEls = Array.from(measure.querySelectorAll<HTMLElement>('[data-nav-item]'))
      const moreEl = measure.querySelector<HTMLElement>('[data-more-item]')
      const moreWidth = moreEl?.offsetWidth || 0

      let usedWidth = 0
      let count = 0
      for (let i = 0; i < itemEls.length; i++) {
        const isLast = i === itemEls.length - 1
        const gapBefore = count > 0 ? gap : 0
        const reserve = isLast ? 0 : gap + moreWidth
        const w = itemEls[i].offsetWidth
        if (usedWidth + gapBefore + w + reserve <= availableWidth) {
          usedWidth += gapBefore + w
          count++
        } else {
          break
        }
      }
      setVisibleMobileTabCount(Math.max(count, 1))
    }

    recalculate()
    const resizeObserver = new ResizeObserver(recalculate)
    resizeObserver.observe(container)
    return () => resizeObserver.disconnect()
  }, [filteredContentTabs.length, isCanManageCoop, isMember, viewMode])

  const visibleMobileTabs = filteredContentTabs.slice(0, visibleMobileTabCount)
  const visibleMobileTabIds = new Set(visibleMobileTabs.map((t) => t.id))
  const overflowNavList = activeSidebarNavList.filter((item) => !visibleMobileTabIds.has(item.id))

  // If the current tab isn't one this viewer is actually allowed to see (module
  // disabled, or a tab beyond their role), fall back to Beranda. Checks against
  // activeSidebarNavList - the same canonical list used to build every menu -
  // instead of a separately hardcoded allow-list, so this can never drift out
  // of sync with what's actually shown in the nav again.
  useEffect(() => {
    const allowedIds = activeSidebarNavList.filter((item) => item.id !== 'landing_view').map((item) => item.id)
    if (!allowedIds.includes(activeSidebarNav)) {
      setActiveSidebarNav('beranda')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabledModules, activeSidebarNav, isCanManageCoop, isMember])

  const isKetua = Boolean(user && community && community.ketuaId === user.id)
  const isAdmin = Boolean(user && user.role === 'ADMIN')

  const activeMode: 'FREE' | 'PREMIUM' =
    previewMode === 'FREE' ? 'FREE' :
      previewMode === 'PREMIUM' ? 'PREMIUM' :
        (community?.type === 'KOPERASI' || isMember) ? 'PREMIUM' : 'FREE'

  const merchantProjects = [
    {
      id: 'proj-1',
      title: 'Kopi Nusantara',
      category: 'Minuman',
      image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80',
      target: 30000000,
      collected: 19500000,
      progress: 65,
      minInvest: 100000
    },
    {
      id: 'proj-2',
      title: 'Warung Sembako Sejahtera',
      category: 'Sembako',
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
      target: 20000000,
      collected: 8400000,
      progress: 42,
      minInvest: 100000
    },
    {
      id: 'proj-3',
      title: 'Keripik Pedas Mantap',
      category: 'Makanan Ringan',
      image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=400&q=80',
      target: 15000000,
      collected: 5700000,
      progress: 38,
      minInvest: 50000
    }
  ]

  if (loading) {
    return <CommunityDashboardSkeleton />
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-[#F5F7F9] text-[#111111] flex flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-bold font-sora">Komunitas Tidak Ditemukan</h2>
        <Link href="/community" className="text-xs text-[#2DB24A] hover:underline">Kembali ke direktori</Link>
      </div>
    )
  }

  if (community.isVerified === false || community.isSuspended) {
    if (!isAdmin && !isKetua) {
      return (
        <div className="min-h-screen bg-[#F5F7F9] text-[#111111] flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shadow-xs">
            <Clock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black font-sora text-slate-900">Komunitas Dalam Proses Verifikasi</h2>
          <p className="text-xs text-slate-600 max-w-md leading-relaxed">
            Komunitas <strong>"{community.name}"</strong> saat ini sedang dalam proses verifikasi legalitas oleh Super Admin Saloka. Halaman ini belum dapat diakses publik hingga verifikasi disetujui.
          </p>
          <Link href="/community" className="px-6 py-2.5 bg-[#2DB24A] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#0F5132] transition-colors">
            ← Kembali ke Direktori Komunitas
          </Link>
        </div>
      )
    }
  }

  const parsedCommunityConfig = community?.landingPageConfig ? (typeof community.landingPageConfig === 'string' ? JSON.parse(community.landingPageConfig) : community.landingPageConfig) : {}

  const isPerkumpulanPrem = community?.type === 'PERKUMPULAN' && (parsedCommunityConfig?.perkumpulanTier === 'PREMIUM' || (parsedCommunityConfig?.activationFeePaid ?? 0) > 0 || community?.category === 'PAID')

  const bannerBadge = isKoperasi 
    ? `KOPERASI (${parsedCommunityConfig?.coopTier || 'PRODUKSI'})`
    : isPerkumpulanPrem
      ? 'PERKUMPULAN PREMIUM'
      : 'PERKUMPULAN REGULER'
  
  const bannerCover = community?.coverUrl || (
    isKuliner ? 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80' :
    isKoperasi ? 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80' :
    isBusiness ? 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80' :
    isEducation ? 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80' :
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80'
  )

  const bannerSlogan = community?.slogan || (
    isKuliner ? 'Bersama Memajukan Industri Kuliner Kreatif' :
    isKoperasi ? 'Membangun Ekonomi Bersama, Sejahtera untuk Anggota' :
    isBusiness ? 'Kolaborasi • Inovasi • Sejahtera Bersama Komunitas Bisnis & UMKM' :
    isEducation ? 'Belajar Bisnis Sejak Dini, Wujudkan Ide Jadi Nyata' :
    'Bersama Belajar, Berbagi dan Bertumbuh'
  )

  const bannerCta = isKoperasi ? 'Menjadi Anggota' : isKuliner ? 'Jelajahi Merchant' : isBusiness ? 'Ajukan Kolaborasi' : isEducation ? 'Daftar Kelas' : 'Gabung Komunitas'

  const formatCompactRupiah = (val: number) => {
    if (val >= 1000000000) {
      return 'Rp ' + (val / 1000000000).toFixed(1).replace('.', ',').replace(',0', '') + ' M'
    }
    if (val >= 1000000) {
      return 'Rp ' + (val / 1000000).toFixed(1).replace('.', ',').replace(',0', '') + ' Jt'
    }
    return 'Rp ' + val.toLocaleString('id-ID')
  }

  const activeMembersCount = members.length
  const discussionsCount = (announcements || []).filter((a: any) => a.type !== 'EVENT' && a.status === 'PUBLISHED').length
  const eventsCount = (announcements || []).filter((a: any) => a.type === 'EVENT' || a.title?.toLowerCase().includes('event') || a.title?.toLowerCase().includes('workshop') || a.title?.toLowerCase().includes('kopdar')).length
  const galleryCount = 0

  const statCards = isKoperasi ? [
    { label: 'Anggota', value: String(activeMembersCount), icon: Users, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Total Simpanan', value: formatCompactRupiah(communitySavingsSummary?.totalSavingsCommunity || 0), icon: Wallet, color: 'text-[#2DB24A] bg-[#E8F8EE]' },
    { label: 'SHU Tahun Ini', value: formatCompactRupiah(Number(shuNetProfit || 0)), icon: PieChart, color: 'text-amber-600 bg-amber-50' },
    { label: 'Unit Usaha', value: String(realStats?.activeMerchantsCount || 0), icon: Building2, color: 'text-blue-600 bg-blue-50' },
  ] : isBusiness ? [
    { label: 'Anggota', value: String(activeMembersCount), icon: Users, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Mitra', value: String(realStats?.activeMerchantsCount || 0), icon: Handshake, color: 'text-[#2DB24A] bg-[#E8F8EE]' },
    { label: 'Pelatihan', value: '0', icon: GraduationCap, color: 'text-amber-600 bg-amber-50' },
    { label: 'Peluang Usaha', value: String(fundingProjects?.length || 0), icon: Rocket, color: 'text-blue-600 bg-blue-50' },
  ] : isEducation ? [
    { label: 'Anggota', value: String(activeMembersCount), icon: Users, color: 'text-purple-600 bg-purple-50' },
    { label: 'Kelas', value: '0', icon: BookOpen, color: 'text-[#2DB24A] bg-[#E8F8EE]' },
    { label: 'Kompetisi', value: '0', icon: Trophy, color: 'text-amber-600 bg-amber-50' },
    { label: 'Startup', value: String(realStats?.activeMerchantsCount || 0), icon: Rocket, color: 'text-indigo-600 bg-indigo-50' },
  ] : isKuliner ? [
    { label: 'Merchant', value: String(realStats?.activeMerchantsCount || 0), icon: Store, color: 'text-orange-600 bg-orange-50' },
    { label: 'Produk', value: String(products.length || 0), icon: ShoppingBag, color: 'text-[#2DB24A] bg-[#E8F8EE]' },
    { label: 'Supplier', value: '0', icon: Truck, color: 'text-amber-600 bg-amber-50' },
    { label: 'Event', value: String(eventsCount), icon: Calendar, color: 'text-rose-600 bg-rose-50' },
  ] : [
    { label: 'Anggota', value: String(activeMembersCount), icon: Users, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Diskusi', value: String(discussionsCount), icon: MessageSquare, color: 'text-[#2DB24A] bg-[#E8F8EE]' },
    { label: 'Event', value: String(eventsCount), icon: Calendar, color: 'text-amber-600 bg-amber-50' },
    { label: 'Galeri', value: String(galleryCount), icon: ImageIcon, color: 'text-indigo-600 bg-indigo-50' },
  ]

  const promoWidget = isKoperasi ? {
    icon: Building2,
    title: 'Menjadi Anggota',
    desc: 'Bergabung dan dapatkan manfaat koperasi bersama.',
    buttonText: 'Menjadi Anggota',
  } : isBusiness ? {
    icon: Handshake,
    title: 'Ajukan Kolaborasi',
    desc: 'Temukan peluang bisnis bersama anggota Kopjaswara.',
    buttonText: 'Ajukan Kolaborasi',
  } : isEducation ? {
    icon: GraduationCap,
    title: 'Daftar Kelas',
    desc: 'Tingkatkan skill dan wujudkan ide bisnismu sekarang!',
    buttonText: 'Daftar Kelas',
  } : isKuliner ? {
    icon: Utensils,
    title: 'Jelajahi Merchant',
    desc: 'Temukan kuliner terbaik dari anggota kami.',
    buttonText: 'Jelajahi Merchant',
  } : {
    icon: SailboatIcon,
    title: 'Gabung Komunitas',
    desc: 'Bersama lebih kuat, berbagi, belajar, dan bertumbuh.',
    buttonText: 'Gabung Komunitas',
  }

  const PromoIcon = promoWidget.icon

  const merchantAvatars = [
    { name: 'Super Admin Saloka', initial: 'SU', bg: 'bg-emerald-100 text-emerald-800' },
    { name: 'rijal Merchant', initial: 'RI', bg: 'bg-[#E8F8EE] text-[#2DB24A]' },
    { name: 'saloka Merchant', initial: 'SA', bg: 'bg-[#E8F8EE] text-[#2DB24A]' },
  ]

  const handleSaveLandingPageConfig = async (newConfig: any) => {
    const formData = new FormData()
    formData.append('name', community.name)
    formData.append('description', community.description || '')
    if (community.aktaNotaris) formData.append('aktaNotaris', community.aktaNotaris)
    if (community.nomorAhu) formData.append('nomorAhu', community.nomorAhu)
    if (community.nomorNpwp) formData.append('nomorNpwp', community.nomorNpwp)
    if (community.domisili) formData.append('domisili', community.domisili)
    if (community.kontakPj) formData.append('kontakPj', community.kontakPj)
    if (community.waGroupLink) formData.append('waGroupLink', community.waGroupLink)
    if (community.avatarUrl) formData.append('avatarUrl', community.avatarUrl)
    if (community.coverUrl) formData.append('coverUrl', community.coverUrl)
    formData.append('joinFee', String(community.joinFee || 0))
    formData.append('monthlyFee', String(community.monthlyFee || 0))
    formData.append('landingPageConfig', JSON.stringify(newConfig))

    const res = await updateIndukCommunity(id, formData)
    if (res.error) {
      throw new Error(res.error)
    } else {
      loadData()
    }
  }

  if (viewMode === 'landing') {
    return (
      <LandingPageView
        community={community}
        config={parsedCommunityConfig}
        onJoin={handleJoin}
        onViewDashboard={() => {
          setViewMode('dashboard')
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href)
            url.searchParams.set('view', 'dashboard')
            window.history.replaceState(null, '', url.toString())
          }
        }}
        isCanManage={isCanManageCoop}
        isMember={isMember}
        onEdit={() => {
          setViewMode('dashboard')
          setActiveSidebarNav('desain_landing')
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href)
            url.searchParams.set('view', 'dashboard')
            url.searchParams.set('tab', 'desain_landing')
            window.history.replaceState(null, '', url.toString())
          }
        }}
        officialProducts={communityOfficialProducts}
        memberProducts={products}
        products={parsedCommunityConfig?.productShowcase?.sourceType === 'member' ? products : communityOfficialProducts}
        onNavigateToProducts={(target) => {
          const targetTab = target === 'member' ? 'marketplace' : 'produk_komunitas'
          setViewMode('dashboard')
          setActiveSidebarNav(targetTab)
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href)
            url.searchParams.set('view', 'dashboard')
            url.searchParams.set('tab', targetTab)
            window.history.replaceState(null, '', url.toString())
          }
        }}
        onAddProduct={(target) => {
          const targetTab = target === 'member' ? 'marketplace' : 'produk_komunitas'
          setViewMode('dashboard')
          setActiveSidebarNav(targetTab)
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href)
            url.searchParams.set('view', 'dashboard')
            url.searchParams.set('tab', targetTab)
            window.history.replaceState(null, '', url.toString())
          }
          if (target === 'member') {
            setTimeout(() => handleOpenCreateProduct(false), 200)
          } else {
            setTimeout(() => handleOpenCreateOfficialProduct(), 200)
          }
        }}
        realStats={realStats}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F7F9] text-[#111827] pt-4 md:pt-8 pb-28 md:pb-20 px-3 md:px-8 font-sans max-w-full overflow-x-hidden">
      <div className="max-w-[1280px] mx-auto space-y-4 md:space-y-6">

        {/* TOP BAR / PACKAGE HEADER (Khusus Admin Koperasi) */}
        {isKoperasi && isCanManageCoop && (
          <div className="flex flex-wrap justify-between items-center bg-white border border-gray-200/80 rounded-2xl p-4 gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="font-extrabold text-sm text-gray-900 font-sora">
                {community.name}
              </span>
              <span className={`px-2.5 py-1 text-[9px] font-black rounded-lg border uppercase tracking-wider ${
                coopTier === 'PRO'
                  ? 'bg-purple-500/10 border-purple-500/35 text-purple-600'
                  : coopTier === 'PLUS'
                    ? 'bg-blue-500/10 border-blue-500/35 text-blue-600'
                    : 'bg-emerald-500/10 border-emerald-500/35 text-emerald-600'
              }`}>
                KOPERASI {coopTier}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {coopTier !== 'PRO' && (
                <button
                  onClick={() => handleUpgradeTier(coopTier === 'BASIC' ? 'PLUS' : 'PRO')}
                  className="px-4 py-2.5 bg-[#FF9800] hover:bg-[#F57C00] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowUpCircle className="w-4 h-4" /> Upgrade ke {coopTier === 'BASIC' ? 'Plus' : 'Pro'}
                </button>
              )}
            </div>
          </div>
        )}

        {community.isVerified === false && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-center justify-between gap-4 mb-6 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-amber-900 font-sora">Status Komunitas: PENDING VERIFIKASI SUPER ADMIN</h4>
                <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                  Komunitas Anda sedang diverifikasi secara manual oleh Super Admin Saloka. Komunitas belum ditampilkan di Direktori Publik dan belum dapat dimasuki oleh anggota umum.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-amber-200 text-amber-900 text-[10px] font-black uppercase rounded-full shrink-0">
              PENDING VERIFIKASI
            </span>
          </div>
        )}

        {/* ── 2-PANEL FLEX LAYOUT: UNIFIED SALOKA DESIGN SYSTEM FOR ALL 5 COMMUNITIES ── */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* ── MOBILE ONLY: COMPACT COMMUNITY HEADER & HORIZONTAL TABS ──────────────── */}
          <div className="lg:hidden w-full space-y-3">
            {/* Back Button */}
            <Link href="/community" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 font-semibold transition-colors">
              <ChevronLeft className="w-4 h-4" /> Kembali ke Komunitas
            </Link>

            {/* Compact Mobile Community Info Card */}
            <div className="p-3.5 bg-white border border-gray-200/80 rounded-2xl shadow-xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#E8F8EE] border border-emerald-200/80 flex items-center justify-center overflow-hidden shrink-0 shadow-xs relative">
                  {community.avatarUrl ? (
                    <Image src={community.avatarUrl} alt={community.name} fill sizes="48px" className="object-cover" />
                  ) : (
                    <span className="font-sora font-black text-sm text-[#0F5132]">
                      {community.name.substring(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-sora text-sm font-black text-gray-900 line-clamp-1">
                    {community.name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                    <span className={`px-2 py-0.5 text-[8px] font-black rounded uppercase tracking-wider ${
                      community.type === 'KOPERASI'
                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {community.type === 'KOPERASI' ? `KOPERASI ${coopTier}` : 'PERKUMPULAN'}
                    </span>
                    <span className="text-[10px] text-gray-500 font-semibold flex items-center gap-1">
                      <Users className="w-3 h-3 text-[#2DB24A]" /> {realStats.activeMembersCount || (members || []).length} Anggota
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Landing & Edit */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => handleSidebarClick('landing_view')}
                  className="flex-1 py-2 px-2.5 bg-gray-50 hover:bg-emerald-50 border border-gray-250 hover:border-[#2DB24A]/40 text-gray-700 hover:text-[#0F5132] font-bold text-[11px] rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#2DB24A]" />
                  <span>Halaman Landing</span>
                </button>
                {isCanManageCoop && (
                  <button
                    onClick={() => handleSidebarClick('desain_landing')}
                    className="flex-1 py-2 px-2.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 font-bold text-[11px] rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>Edit Desain</span>
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Responsive Tab Bar: shows as many content tabs as fit, rest fold into "Lainnya" */}
            <div className="relative">
              {/* Hidden measurement clone - same buttons, off-screen, used only to read natural widths */}
              <div
                ref={mobileNavMeasureRef}
                className="absolute -top-[9999px] left-0 flex items-center gap-1.5 invisible pointer-events-none"
                aria-hidden="true"
              >
                {filteredContentTabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <div key={tab.id} data-nav-item className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap shrink-0 border">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{tab.label}</span>
                    </div>
                  )
                })}
                <div data-more-item className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap shrink-0 border">
                  <MoreHorizontal className="w-4 h-4 shrink-0" />
                  {/* The real "Lainnya" button can instead show the currently-active overflow tab's own
                      (possibly longer) label, so measure against the longest label in the whole list to
                      keep the reserved space wide enough for that case too. */}
                  <span>{activeSidebarNavList.reduce((longest, item) => item.label.length > longest.length ? item.label : longest, 'Lainnya')} ▾</span>
                </div>
              </div>

              <div ref={mobileNavBarRef} className="flex items-center gap-1.5 p-1.5 bg-white border border-gray-200/80 rounded-2xl shadow-xs overflow-hidden">
                {visibleMobileTabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeSidebarNav === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleSidebarClick(tab.id)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                        isActive
                          ? 'bg-[#E8F8EE] text-[#0F5132] font-black border border-[#2DB24A]/35 shadow-xs'
                          : 'text-gray-600 bg-gray-50/70 hover:bg-gray-100 hover:text-gray-900 border border-transparent'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#2DB24A]' : 'text-gray-400'}`} />
                      <span>{tab.label}</span>
                    </button>
                  )
                })}

                {/* Lainnya Dropdown Tab */}
                {overflowNavList.length > 0 && (() => {
                  const isMoreActive = (activeSidebarNav as string) !== 'landing_view' && !visibleMobileTabIds.has(activeSidebarNav)
                  const currentMoreItem = overflowNavList.find(item => item.id === activeSidebarNav)
                  return (
                    <button
                      onClick={() => setMobileMoreOpen(!mobileMoreOpen)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                        isMoreActive
                          ? 'bg-[#E8F8EE] text-[#0F5132] font-black border border-[#2DB24A]/35 shadow-xs'
                          : 'text-gray-600 bg-gray-50/70 hover:bg-gray-100 hover:text-gray-900 border border-transparent'
                      }`}
                    >
                      <MoreHorizontal className={`w-4 h-4 shrink-0 ${isMoreActive ? 'text-[#2DB24A]' : 'text-gray-400'}`} />
                      <span>{isMoreActive && currentMoreItem ? currentMoreItem.label : 'Lainnya'} ▾</span>
                    </button>
                  )
                })()}
              </div>

              {/* Mobile "Lainnya" Drawer / Modal */}
              <AnimatePresence>
                {mobileMoreOpen && (
                  <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-3">
                    <motion.div
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 50, opacity: 0 }}
                      className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-4 border border-gray-100 max-h-[80vh] overflow-y-auto"
                    >
                      <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-[#0F5132] flex items-center justify-center font-bold">
                            <MoreHorizontal className="w-4 h-4" />
                          </div>
                          <h3 className="font-sora text-sm font-black text-gray-900">Menu Komunitas Lainnya</h3>
                        </div>
                        <button onClick={() => setMobileMoreOpen(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer p-1">
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {overflowNavList.map((item) => {
                          const Icon = item.icon
                          const isActive = activeSidebarNav === item.id
                          return (
                            <button
                              key={item.id}
                              onClick={() => {
                                setMobileMoreOpen(false)
                                handleSidebarClick(item.id)
                              }}
                              className={`p-3 rounded-2xl text-left border flex flex-col justify-between gap-2 transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-[#E8F8EE] border-[#2DB24A] text-[#0F5132]'
                                  : 'bg-gray-50 border-gray-200/80 text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              <Icon className={`w-5 h-5 ${isActive ? 'text-[#2DB24A]' : 'text-gray-500'}`} />
                              <span className="text-xs font-bold leading-tight">{item.label}</span>
                            </button>
                          )
                        })}
                      </div>

                      <button
                        onClick={() => setMobileMoreOpen(false)}
                        className="w-full py-2.5 bg-gray-100 text-gray-600 font-bold text-xs rounded-xl hover:bg-gray-200 transition-colors"
                      >
                        Tutup Menu
                      </button>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ── DESKTOP LEFT SIDEBAR MENU PANEL (Sticky Docked on lg screens only) ──────────────────────────────────────── */}
          <div className="hidden lg:block lg:w-60 shrink-0 space-y-4 lg:sticky lg:top-24 self-start max-h-[calc(100vh-6.5rem)] overflow-y-auto overflow-x-hidden pr-1 scrollbar-thin scrollbar-thumb-slate-200">
            <Link href="/community" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 font-semibold transition-colors">
              <ChevronLeft className="w-4 h-4" /> Kembali ke Komunitas
            </Link>

            <h2 className="text-xl font-black text-gray-900 font-sora px-1 tracking-tight">
              {community.name}
            </h2>

            {/* Sidebar Navigation Links (Responsive for Koperasi & Perkumpulan based on User Role) */}
            <div className="space-y-1">
              {activeSidebarNavList.map((item) => {
                const Icon = item.icon
                const isActive = activeSidebarNav === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSidebarClick(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
                      isActive
                        ? 'bg-[#E8F8EE] text-[#0F5132] font-black shadow-xs'
                        : 'text-gray-600 hover:bg-gray-100/70 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#2DB24A]' : 'text-gray-400'}`} />
                      <span className="font-extrabold">{item.label}</span>
                    </div>
                    {(item as any).badge && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-600 text-[8px] font-extrabold rounded-md uppercase tracking-wider shrink-0">
                        {(item as any).badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Bottom Green Promotional Card / Invite Card */}
            {!isMember ? (
              <div className="p-4 bg-[#E8F8EE] border border-[#2DB24A]/25 rounded-2xl text-center space-y-3 shadow-xs">
                <div className="w-11 h-11 rounded-2xl bg-[#2DB24A] text-white flex items-center justify-center mx-auto shadow-sm">
                  <PromoIcon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-[#0F5132] text-xs">
                    {promoWidget.title}
                  </h4>
                  <p className="text-[10px] text-emerald-800/80 font-medium mt-1 leading-relaxed">
                    {promoWidget.desc}
                  </p>
                </div>
                <button
                  onClick={() => handleJoin()}
                  className="w-full py-2.5 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> {promoWidget.buttonText}
                </button>
              </div>
            ) : (
              <div className="p-4 bg-[#E8F8EE] border border-[#2DB24A]/25 rounded-2xl text-center space-y-3 shadow-xs">
                <div className="w-11 h-11 rounded-2xl bg-[#2DB24A]/10 text-[#2DB24A] flex items-center justify-center mx-auto">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-[#0F5132] text-xs font-sora">
                    Ajak Teman Bergabung
                  </h4>
                  <p className="text-[10px] text-emerald-800/80 font-medium mt-1 leading-relaxed">
                    Semakin banyak anggota, semakin besar peluang yang kita ciptakan bersama.
                  </p>
                </div>
                <button
                  onClick={handleShareReferralLink}
                  className="w-full py-2.5 bg-white border border-[#2DB24A] hover:bg-[#2DB24A] hover:text-white text-[#0F5132] font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-4 h-4" /> Bagikan Komunitas
                </button>
              </div>
            )}
          </div>

          {/* ── RIGHT MAIN DASHBOARD CONTENT (DYNAMIC TABS) ────────────────────── */}
          <div className="flex-1 space-y-6 min-w-0 w-full">

            {/* TAB 1: BERANDA ─────────────────────────────────────────────────── */}
            {activeSidebarNav === 'beranda' && (
              <div className="space-y-6">
                {/* HERO BANNER CARD (Responsive 180-220px on Mobile, 260-290px on Desktop) */}
                <div className="relative rounded-3xl overflow-hidden text-white shadow-xs border border-gray-200/60 min-h-[190px] sm:min-h-[220px] md:min-h-[260px] flex flex-col justify-between">
                  <Image
                    src={bannerCover}
                    alt="Cover"
                    fill
                    sizes="(max-width: 768px) 100vw, 900px"
                    priority
                    className="object-cover"
                  />
                  <div className="relative z-10 inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-black/90 via-[#0F5132]/85 to-[#0F5132]/40 md:to-transparent p-4 sm:p-6 md:p-8 flex flex-col justify-between flex-1 gap-3">
                    <div className="space-y-1.5">
                      <span className="inline-block px-2.5 py-0.5 bg-white/20 backdrop-blur-md text-white font-extrabold text-[9px] uppercase tracking-wider rounded-full border border-white/30 shadow-xs">
                        {bannerBadge}
                      </span>
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shrink-0 overflow-hidden relative">
                          {community.avatarUrl ? (
                            <Image src={community.avatarUrl} alt="Logo" fill sizes="44px" className="object-cover" />
                          ) : (
                            <PromoIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                          )}
                        </div>
                        <h1 className="text-lg sm:text-xl md:text-3xl font-black font-sora tracking-tight drop-shadow-sm line-clamp-2">
                          {community.name}
                        </h1>
                      </div>
                      <p className="text-[11px] sm:text-xs md:text-sm font-semibold text-emerald-100 line-clamp-1">
                        {bannerSlogan}
                      </p>
                      <p className="text-[10px] sm:text-xs text-emerald-100/90 max-w-xl leading-relaxed line-clamp-2 hidden sm:block">
                        {community.description || "Wadah bagi pelaku usaha, UMKM, dan masyarakat untuk saling berbagi pengalaman, memperluas relasi dan menciptakan peluang bersama."}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2.5 border-t border-white/20 text-[11px] text-emerald-100 font-medium">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs">
                        <span className="flex items-center gap-1 font-semibold text-white">
                          <Shield className="w-3.5 h-3.5 text-emerald-300" />
                          Ketua: {community.ketua?.name || 'Super Admin Saloka'}
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span className="hidden sm:flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-emerald-300" />
                          {community.createdAt ? new Date(community.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '25 Juli 2026'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {!isMember && (
                          <button
                            onClick={() => handleJoin()}
                            className="px-3.5 py-1.5 sm:px-5 sm:py-2.5 bg-white text-[#0F5132] hover:bg-emerald-50 font-extrabold text-[10px] sm:text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Users className="w-3.5 h-3.5" /> {bannerCta}
                          </button>
                        )}
                        <button
                          onClick={handleShareReferralLink}
                          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-white/20 hover:bg-white/35 text-white font-extrabold text-[10px] sm:text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer border border-white/30 backdrop-blur-md"
                        >
                          <Share2 className="w-3.5 h-3.5 text-emerald-200" /> Share Link ({user?.referralCode || user?.username || 'REF001'})
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── 4 STAT METRIC CARDS BAR (MATCHING BLUEPRINT SYSTEM) ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  {statCards.map((stat, idx) => {
                    const StatIcon = stat.icon
                    return (
                      <div key={idx} className="p-4 bg-white border border-gray-200/80 rounded-2xl shadow-xs flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${stat.color}`}>
                          <StatIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-sm font-black text-gray-900 block leading-tight">{stat.value}</span>
                          <span className="text-[11px] text-gray-500 font-semibold block mt-0.5">{stat.label}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* PRODUK RESMI KOMUNITAS (SHOWCASE) */}
                <div className="p-5 bg-white border border-gray-200/80 rounded-2xl shadow-xs space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-[#2DB24A]" /> Produk Resmi {community.name}
                      </h3>
                      <p className="text-[11px] text-gray-500 font-medium mt-0.5">Katalog resmi merchandise, seragam, bahan baku, dan produk yang dikelola pengurus komunitas</p>
                    </div>
                    <button onClick={() => setActiveSidebarNav('produk_komunitas')} className="text-xs font-bold text-[#2DB24A] hover:underline flex items-center gap-1 cursor-pointer">
                      Lihat Semua ({communityOfficialProducts.length}) <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Mobile Horizontal Carousel & Desktop Grid */}
                  <div className="pt-1">
                    {communityOfficialProducts && communityOfficialProducts.length > 0 ? (
                      <>
                        {/* Mobile Carousel (Horizontal Scroll) */}
                        <div className="flex md:hidden overflow-x-auto no-scrollbar gap-3 pb-2 -mx-1 px-1 snap-x snap-mandatory">
                          {communityOfficialProducts.map((prod: any) => (
                            <div
                              key={prod.id}
                              onClick={() => handleOpenDetailOfficialProduct(prod)}
                              className="w-[210px] shrink-0 snap-start p-3 bg-gray-50 border border-gray-150 rounded-2xl space-y-2 group hover:border-[#2DB24A]/40 transition-all cursor-pointer flex flex-col justify-between shadow-xs"
                            >
                              <div className="space-y-2">
                                <div className="relative rounded-xl overflow-hidden h-28 bg-gray-100">
                                  <Image
                                    src={prod.imageUrl || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=80'}
                                    alt={prod.name}
                                    fill
                                    sizes="210px"
                                    className="object-cover"
                                  />
                                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-[#2DB24A] text-white font-extrabold text-[9px] rounded-md uppercase tracking-wider shadow-xs">
                                    {prod.category || 'Official'}
                                  </span>
                                  <span className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 text-white font-extrabold text-[8px] rounded-md">
                                    Stok: {prod.stock || 0}
                                  </span>
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-gray-900 group-hover:text-[#2DB24A] transition-colors line-clamp-1">
                                    {prod.name}
                                  </h4>
                                  <p className="text-[10px] text-gray-500 font-medium line-clamp-1 mt-0.5">
                                    {prod.description || 'Produk resmi komunitas'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex justify-between items-center pt-2 border-t border-gray-200/60">
                                <span className="text-xs font-black text-[#0F5132]">
                                  Rp {Number(prod.price || 0).toLocaleString('id-ID')}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleBuyOfficialProduct(prod, 1)
                                  }}
                                  className="px-2.5 py-1 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-[10px] rounded-lg transition-all cursor-pointer flex items-center gap-1"
                                >
                                  <ShoppingCart className="w-3 h-3" /> Beli
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Desktop Grid (3 Columns) */}
                        <div className="hidden md:grid md:grid-cols-3 gap-3.5">
                          {communityOfficialProducts.slice(0, 3).map((prod: any) => (
                            <div
                              key={prod.id}
                              onClick={() => handleOpenDetailOfficialProduct(prod)}
                              className="p-3 bg-gray-50 border border-gray-100 rounded-xl space-y-2 group hover:border-[#2DB24A]/40 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
                            >
                              <div className="space-y-2">
                                <div className="relative rounded-lg overflow-hidden h-32 bg-gray-100">
                                  <Image
                                    src={prod.imageUrl || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=80'}
                                    alt={prod.name}
                                    fill
                                    sizes="(max-width: 768px) 33vw, 300px"
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-[#2DB24A] text-white font-extrabold text-[9px] rounded-md uppercase tracking-wider shadow-xs">
                                    {prod.category || 'Official'}
                                  </span>
                                  <span className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 text-white font-extrabold text-[8px] rounded-md">
                                    Stok: {prod.stock || 0}
                                  </span>
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-gray-900 group-hover:text-[#2DB24A] transition-colors line-clamp-1">
                                    {prod.name}
                                  </h4>
                                  <p className="text-[10px] text-gray-500 font-medium line-clamp-1 mt-0.5">
                                    {prod.description || 'Produk resmi komunitas'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex justify-between items-center pt-2 border-t border-gray-200/60">
                                <span className="text-xs font-black text-[#0F5132]">
                                  Rp {Number(prod.price || 0).toLocaleString('id-ID')}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleBuyOfficialProduct(prod, 1)
                                  }}
                                  className="px-2.5 py-1 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-[10px] rounded-lg transition-all cursor-pointer flex items-center gap-1"
                                >
                                  <ShoppingCart className="w-3 h-3" /> Beli
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="col-span-full p-6 text-center bg-gray-50 border border-dashed border-gray-200 rounded-2xl space-y-2">
                        <Package className="w-8 h-8 text-[#2DB24A] mx-auto opacity-70" />
                        <h4 className="text-xs font-bold text-gray-800">Belum Ada Produk Resmi Komunitas</h4>
                        <p className="text-[11px] text-gray-500 max-w-sm mx-auto">Pengurus komunitas dapat menambahkan produk resmi untuk dijual kepada anggota dan publik.</p>
                        {isCanManageCoop && (
                          <button onClick={handleOpenCreateOfficialProduct} className="px-3.5 py-1.5 bg-[#2DB24A] text-white font-extrabold text-xs rounded-xl shadow-xs hover:bg-[#0F5132] transition-all cursor-pointer inline-flex items-center gap-1.5 mt-1">
                            <Plus className="w-3.5 h-3.5" /> Tambah Produk Komunitas
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* PRODUK UNGGULAN ANGGOTA */}
                <div className="p-5 bg-white border border-gray-200/80 rounded-2xl shadow-xs space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" /> {isKuliner ? 'Menu Kuliner Unggulan Anggota' : isKoperasi ? 'Bahan Baku & Produk Koperasi' : 'Produk Unggulan Anggota'}
                      </h3>
                      <p className="text-[11px] text-gray-500 font-medium mt-0.5">Produk pilihan berkualitas karya terbaik dari UMKM & anggota {community.name}</p>
                    </div>
                    <button onClick={() => setActiveSidebarNav('marketplace')} className="text-xs font-bold text-[#2DB24A] hover:underline flex items-center gap-1 cursor-pointer">
                      Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Mobile Horizontal Carousel & Desktop Grid */}
                  <div className="pt-1">
                    {products && products.length > 0 ? (
                      <>
                        {/* Mobile Carousel (Horizontal Scroll) */}
                        <div className="flex md:hidden overflow-x-auto no-scrollbar gap-3 pb-2 -mx-1 px-1 snap-x snap-mandatory">
                          {products.map((p, idx) => (
                            <div 
                              key={p.id || idx} 
                              onClick={() => router.push(`/cart`)}
                              className="w-[190px] shrink-0 snap-start p-3 bg-gray-50 border border-gray-150 rounded-2xl space-y-2 group hover:border-[#2DB24A]/40 transition-all cursor-pointer flex flex-col justify-between shadow-xs"
                            >
                              <div className="space-y-2">
                                <div className="relative rounded-xl overflow-hidden h-28 bg-gray-100">
                                  <Image
                                    src={p.imageUrl || p.img || 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&h=200&fit=crop&q=80'}
                                    alt={p.name || p.title}
                                    fill
                                    sizes="190px"
                                    className="object-cover"
                                  />
                                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-[#2DB24A] text-white font-extrabold text-[9px] rounded-md uppercase tracking-wider shadow-xs">
                                    {p.category || 'Unggulan'}
                                  </span>
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-gray-900 group-hover:text-[#2DB24A] transition-colors line-clamp-1">{p.name || p.title}</h4>
                                  <p className="text-[10px] text-gray-400 font-semibold truncate">{p.merchant?.name || p.merchantName || p.merchant || 'Merchant Saloka'}</p>
                                </div>
                              </div>
                              <div className="flex justify-between items-center pt-2 border-t border-gray-200/60">
                                <span className="text-xs font-black text-[#0F5132]">Rp {Number(p.price || 0).toLocaleString('id-ID')}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    goeyToast.success(`"${p.name || p.title}" ditambahkan ke keranjang belanja!`)
                                  }}
                                  className="px-2.5 py-1 bg-white border border-[#2DB24A] text-[#2DB24A] hover:bg-[#2DB24A] hover:text-white font-extrabold text-[10px] rounded-lg transition-all cursor-pointer"
                                >
                                  Beli
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Desktop Grid (4 Columns) */}
                        <div className="hidden md:grid md:grid-cols-4 gap-3.5">
                          {products.slice(0, 4).map((p, idx) => (
                            <div
                              key={p.id || idx}
                              onClick={() => router.push(`/cart`)}
                              className="p-3 bg-gray-50 border border-gray-100 rounded-xl space-y-2 group hover:border-[#2DB24A]/40 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
                            >
                              <div className="space-y-2">
                                <div className="relative rounded-lg overflow-hidden h-28 bg-gray-100">
                                  <Image
                                    src={p.imageUrl || p.img || 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&h=200&fit=crop&q=80'}
                                    alt={p.name || p.title}
                                    fill
                                    sizes="(max-width: 768px) 25vw, 250px"
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-[#2DB24A] text-white font-extrabold text-[9px] rounded-md uppercase tracking-wider shadow-xs">
                                    {p.category || 'Unggulan'}
                                  </span>
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-gray-900 group-hover:text-[#2DB24A] transition-colors line-clamp-1">{p.name || p.title}</h4>
                                  <p className="text-[10px] text-gray-400 font-semibold">{p.merchant?.name || p.merchantName || p.merchant || 'Merchant Saloka'}</p>
                                </div>
                              </div>
                              <div className="flex justify-between items-center pt-2 border-t border-gray-200/60">
                                <span className="text-xs font-black text-[#0F5132]">Rp {Number(p.price || 0).toLocaleString('id-ID')}</span>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    goeyToast.success(`"${p.name || p.title}" ditambahkan ke keranjang belanja!`)
                                  }} 
                                  className="px-2.5 py-1 bg-white border border-[#2DB24A] text-[#2DB24A] hover:bg-[#2DB24A] hover:text-white font-extrabold text-[10px] rounded-lg transition-all cursor-pointer"
                                >
                                  Beli
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="col-span-full p-8 text-center bg-gray-50 border border-dashed border-gray-200 rounded-2xl space-y-2">
                        <Store className="w-8 h-8 text-[#2DB24A] mx-auto opacity-70" />
                        <h4 className="text-xs font-bold text-gray-800">Belum Ada Produk Anggota</h4>
                        <p className="text-[11px] text-gray-500 max-w-sm mx-auto">Admin atau merchant anggota komunitas belum menambahkan produk. Klik tombol di bawah untuk menambah produk baru.</p>
                        <button onClick={() => setActiveSidebarNav('marketplace')} className="px-3.5 py-1.5 bg-[#2DB24A] text-white font-extrabold text-xs rounded-xl shadow-xs hover:bg-[#0F5132] transition-all cursor-pointer inline-flex items-center gap-1.5 mt-1">
                          <Plus className="w-3.5 h-3.5" /> Kelola Produk Anggota
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* PRODUK SIMPANAN / IURAN KEANGGOTAAN (HANYA UNTUK KOPERASI) */}
                {isKoperasi && (
                  <div className="p-5 bg-white border border-gray-200/80 rounded-2xl shadow-xs space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Wallet className="w-4 h-4 text-[#2DB24A]" /> Simpanan & Iuran Keanggotaan
                        </h3>
                        <p className="text-[11px] text-gray-500 font-medium mt-0.5">Iuran resmi anggota {community.name} untuk operasional dan pengembangan usaha bersama</p>
                      </div>
                      {isKoperasiPremium && isCanManageCoop && (
                        <button
                          onClick={() => handleOpenCreateProduct(false)}
                          className="px-3 py-1.5 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer shrink-0 animate-pulse"
                        >
                          <Plus className="w-3.5 h-3.5" /> Tambah Baru
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      {coopProducts && coopProducts.length > 0 ? (
                        coopProducts.map((p: any, idx: number) => {
                          const Icon = p.type === 'POKOK' ? Home : p.type === 'WAJIB' ? Calendar : p.type === 'SUKARELA' ? PiggyBank : p.type === 'UMROH' ? Landmark : p.type === 'QURBAN' ? Award : Wallet
                          const priceText = p.type === 'SUKARELA' ? 'Bebas Nominal' : `Rp ${Number(p.amount || 0).toLocaleString('id-ID')}${p.periodText ? ` / ${p.periodText}` : ''}`
                          
                          return (
                            <div key={p.id || idx} className="p-4 bg-gray-50/80 border border-gray-200/80 rounded-xl space-y-3 flex flex-col justify-between hover:border-[#2DB24A]/40 transition-all">
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-[#E8F8EE] text-[#2DB24A] flex items-center justify-center font-bold shrink-0">
                                    <Icon className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-gray-900">{p.name}</h4>
                                    <p className="text-[10px] text-gray-500 font-medium line-clamp-1">{p.description || '-'}</p>
                                    <span className="text-xs font-extrabold text-[#0F5132] block mt-0.5">{priceText}</span>
                                  </div>
                                </div>
                                {isKoperasiPremium && isCanManageCoop && (
                                  <div className="flex items-center gap-1 text-[10px] shrink-0">
                                    <button onClick={() => handleOpenEditProduct(p)} className="text-gray-500 hover:text-[#2DB24A] font-bold cursor-pointer">Edit</button>
                                    <span className="text-gray-300">|</span>
                                    <button onClick={() => handleDeleteProduct(p.id)} className="text-gray-500 hover:text-red-500 font-bold cursor-pointer">Hapus</button>
                                  </div>
                                )}
                              </div>
                              <div className="pt-2 border-t border-gray-200/60 flex justify-end">
                                <button
                                  onClick={() => handleOpenPaySavings({ name: p.name, amount: p.amount || 50000, type: p.type })}
                                  className="px-3.5 py-1.5 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
                                >
                                  Setor
                                </button>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <p className="text-xs text-gray-500 col-span-full text-center">Belum ada iuran keanggotaan tersedia.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* SHOWCASE FITUR PENDANAAN MERCHANT & SHU (SEKILAS TAMPAK PADA LANDING PAGE) */}
                {isKoperasi && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Card 1: Pendanaan Merchant */}
                    <div className="p-5 bg-white border border-gray-200/80 rounded-2xl shadow-xs space-y-3 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5 font-sora">
                            <Landmark className="w-4 h-4 text-purple-600" /> Fitur Pendanaan Merchant
                            <span className="px-1.5 py-0.5 bg-purple-100 text-purple-600 text-[8px] font-extrabold rounded-md uppercase">PRO</span>
                          </h3>
                          <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-md">Investasi & Modal</span>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed font-medium">
                          Program permodalan usaha antar merchant anggota koperasi untuk ekspansi bisnis dan bagi hasil bersama.
                        </p>
                        <div className="p-3 bg-purple-50/60 border border-purple-100/80 rounded-xl space-y-2 text-xs">
                          <div className="flex justify-between items-center font-bold text-purple-900">
                            <span>Estimasi Profit Margin</span>
                            <span className="text-purple-700 font-black">12% - 15% / thn</span>
                          </div>
                          <div className="flex justify-between items-center text-[11px] text-gray-500 font-medium">
                            <span>Akses Pendanaan Usaha</span>
                            <span className="font-extrabold text-emerald-700">Tersedia untuk Anggota</span>
                          </div>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-purple-100/80 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            if (!isMember) {
                              triggerMemberRequired('Pendanaan Merchant & Permodalan Usaha')
                            } else {
                              setActiveSidebarNav('pendanaan')
                            }
                          }}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          {isMember ? 'Lihat Proyek Pendanaan →' : '🔒 Menjadi Anggota untuk Akses'}
                        </button>
                      </div>
                    </div>

                    {/* Card 2: Estimasi & Pembagian SHU */}
                    <div className="p-5 bg-white border border-gray-200/80 rounded-2xl shadow-xs space-y-3 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5 font-sora">
                            <PieChart className="w-4 h-4 text-[#2DB24A]" /> Fitur Sisa Hasil Usaha (SHU)
                          </h3>
                          <span className="text-[10px] text-emerald-700 font-extrabold bg-[#E8F8EE] px-2 py-0.5 rounded-md">RAT 2026</span>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed font-medium">
                          Perhitungan otomatis pembagian keuntungan tahunan koperasi secara transparan berdasarkan partisipasi simpanan & transaksi.
                        </p>
                        <div className="p-3 bg-[#E8F8EE]/70 border border-[#2DB24A]/20 rounded-xl space-y-2 text-xs">
                          <div className="flex justify-between items-center font-bold text-[#0F5132]">
                            <span>Komponen SHU</span>
                            <span className="text-[#2DB24A] font-black">Jasa Modal & Jasa Usaha</span>
                          </div>
                          <div className="flex justify-between items-center text-[11px] text-gray-500 font-medium">
                            <span>Sistem Perhitungan</span>
                            <span className="font-extrabold text-emerald-700">Real-time & Transparan</span>
                          </div>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-emerald-100 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            if (!isMember) {
                              triggerMemberRequired('Rincian & Pembagian SHU Koperasi')
                            } else {
                              setShuDetailModalOpen(true)
                            }
                          }}
                          className="px-4 py-2 bg-[#007A3D] hover:bg-[#006030] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          {isMember ? 'Lihat Detail SHU →' : '🔒 Menjadi Anggota untuk Akses'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── MOBILE SINGLE-COLUMN FLOW (Tentang -> Aktivitas -> Event -> Galeri -> Ajak Teman) ── */}
                <div className="lg:hidden space-y-4">
                  {/* 1. Tentang Komunitas */}
                  <div className="p-4 sm:p-5 bg-white border border-gray-200/80 rounded-2xl shadow-xs space-y-2.5">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Tentang {community.name}</h3>
                      <button onClick={() => setActiveSidebarNav('tentang')} className="text-[10px] font-bold text-[#2DB24A] hover:underline cursor-pointer">Lihat Selengkapnya →</button>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed font-medium">
                      {community.name} adalah perkumpulan yang menghubungkan orang-orang dengan minat dan tujuan yang sama untuk belajar, berkolaborasi, dan berkembang bersama.
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {['Kolaborasi', 'Edukasi', 'Networking', 'Promosi Produk', 'Pengembangan Usaha'].map((tag) => (
                        <span key={tag} className="px-2.5 py-1 bg-gray-100 text-gray-600 font-semibold text-[10px] rounded-lg">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 2. Aktivitas Terbaru */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Aktivitas Terbaru</h3>
                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                        {['Semua', 'Diskusi', 'Pengumuman', 'Event'].map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setFeedFilter(tab.toLowerCase() as any)}
                            className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all shrink-0 cursor-pointer ${
                              feedFilter === tab.toLowerCase()
                                ? 'bg-[#2DB24A] text-white shadow-xs'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 bg-white border border-gray-200/80 rounded-2xl shadow-xs space-y-2.5">
                      <div className="flex justify-between items-start">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 font-extrabold text-[9px] rounded-md uppercase">
                          Pengumuman
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">2 jam lalu</span>
                      </div>
                      <h4 className="font-extrabold text-xs sm:text-sm text-gray-900">
                        Workshop Digital Marketing untuk UMKM
                      </h4>
                      <p className="text-xs text-gray-600 leading-relaxed font-medium">
                        Mari tingkatkan penjualan produk lokal melalui strategi digital yang tepat. Terbuka untuk semua anggota {community.name}!
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500 font-semibold">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">👍 24</span>
                          <span className="flex items-center gap-1">💬 12</span>
                        </div>
                        <button onClick={() => setActiveSidebarNav('pengumuman')} className="text-[11px] font-bold text-[#2DB24A] hover:underline cursor-pointer">Lihat Detail →</button>
                      </div>
                    </div>

                    <div className="p-4 bg-white border border-gray-200/80 rounded-2xl shadow-xs space-y-2.5">
                      <div className="flex justify-between items-start">
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 font-extrabold text-[9px] rounded-md uppercase">
                          Diskusi
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">5 jam lalu</span>
                      </div>
                      <h4 className="font-extrabold text-xs sm:text-sm text-gray-900">
                        Bagaimana cara mendapatkan supplier kemasan ramah lingkungan?
                      </h4>
                      <p className="text-xs text-gray-600 leading-relaxed font-medium">
                        Saya sedang mencari rekomendasi supplier kemasan untuk produk makanan. Ada yang punya pengalaman?
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500 font-semibold">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">👍 18</span>
                          <span className="flex items-center gap-1">💬 28</span>
                        </div>
                        <button onClick={() => setActiveSidebarNav('diskusi')} className="text-[11px] font-bold text-[#2DB24A] hover:underline cursor-pointer">Lihat Diskusi →</button>
                      </div>
                    </div>
                  </div>

                  {/* 3. Event Mendatang */}
                  <div className="p-4 sm:p-5 bg-white border border-gray-200/80 rounded-2xl shadow-xs space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Event Mendatang</h3>
                      <button onClick={() => setActiveSidebarNav('event')} className="text-[10px] font-bold text-[#2DB24A] hover:underline cursor-pointer">Lihat Semua</button>
                    </div>
                    <div className="space-y-2">
                      {communityEvents && communityEvents.length > 0 ? (
                        communityEvents.slice(0, 2).map((ev: any, idx: number) => {
                          const dateObj = ev.eventDate ? new Date(ev.eventDate) : new Date()
                          const day = String(dateObj.getDate())
                          const month = dateObj.toLocaleDateString('id-ID', { month: 'short' }).toUpperCase()
                          return (
                            <div key={ev.id || idx} className="flex items-center gap-2.5 p-2 bg-gray-50 rounded-xl">
                              <div className="w-11 h-11 rounded-xl bg-white border border-gray-200 text-center flex flex-col justify-center shrink-0">
                                <span className="text-xs font-black text-gray-900 leading-none">{day}</span>
                                <span className="text-[9px] font-bold text-[#2DB24A] leading-none mt-0.5">{month}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-[11px] font-bold text-gray-900 line-clamp-1">{ev.title}</h4>
                                <p className="text-[9px] text-gray-500 font-medium line-clamp-1">{ev.description || 'Event Komunitas'}</p>
                              </div>
                              <button onClick={() => setActiveSidebarNav('event')} className="px-2 py-1 bg-white border border-[#2DB24A] text-[#2DB24A] hover:bg-[#2DB24A] hover:text-white font-extrabold text-[10px] rounded-lg transition-colors cursor-pointer shrink-0">
                                Lihat
                              </button>
                            </div>
                          )
                        })
                      ) : (
                        <div className="p-4 text-center bg-gray-50 border border-dashed border-gray-200 rounded-xl space-y-1">
                          <Calendar className="w-5 h-5 text-gray-300 mx-auto" />
                          <p className="text-[11px] font-bold text-gray-500">Belum Ada Event Mendatang</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 4. Galeri Kegiatan */}
                  <div className="p-4 sm:p-5 bg-white border border-gray-200/80 rounded-2xl shadow-xs space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Galeri Kegiatan</h3>
                      <button onClick={() => setActiveSidebarNav('galeri')} className="text-[10px] font-bold text-[#2DB24A] hover:underline cursor-pointer">Lihat Semua</button>
                    </div>
                    {communityGallery && communityGallery.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {communityGallery.slice(0, 3).map((item: any) => (
                          <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                            <Image src={item.imageUrl} alt={item.title} fill sizes="150px" className="object-cover" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center bg-gray-50 border border-dashed border-gray-200 rounded-xl space-y-1">
                        <ImageIcon className="w-5 h-5 text-gray-300 mx-auto" />
                        <p className="text-[11px] font-bold text-gray-500">Belum Ada Foto di Galeri</p>
                      </div>
                    )}
                  </div>

                  {/* 5. Ajak Teman Bergabung */}
                  <div className="p-4 bg-[#E8F8EE] border border-[#2DB24A]/25 rounded-2xl space-y-2 text-center shadow-xs">
                    <div className="flex justify-center text-[#2DB24A]"><Users className="w-6 h-6" /></div>
                    <h4 className="font-extrabold text-xs text-[#0F5132]">Ajak Teman Bergabung</h4>
                    <p className="text-[10px] text-emerald-800/80 leading-relaxed font-medium">
                      Semakin banyak anggota, semakin besar peluang yang kita ciptakan bersama.
                    </p>
                    <button onClick={handleShareReferralLink} className="w-full py-2 bg-white border border-[#2DB24A] text-[#0F5132] font-bold text-xs rounded-xl hover:bg-[#2DB24A] hover:text-white transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer">
                      <Share2 className="w-3.5 h-3.5" /> Bagikan Komunitas
                    </button>
                  </div>
                </div>

                {/* ── DESKTOP 3-COLUMN GRID (lg and above only) ── */}
                <div className="hidden lg:grid lg:grid-cols-7 gap-5 items-start">
                  <div className="lg:col-span-2 space-y-4">
                    <div className="p-5 bg-white border border-gray-200/80 rounded-2xl shadow-xs space-y-3">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Tentang {community.name}</h3>
                        <button onClick={() => setActiveSidebarNav('tentang')} className="text-[10px] font-bold text-[#2DB24A] hover:underline cursor-pointer">Lihat Selengkapnya →</button>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed font-medium">
                        {community.name} adalah perkumpulan yang menghubungkan orang-orang dengan minat dan tujuan yang sama untuk belajar, berkolaborasi, dan berkembang bersama.
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {['Kolaborasi', 'Edukasi', 'Networking', 'Promosi Produk', 'Pengembangan Usaha'].map((tag) => (
                          <span key={tag} className="px-2.5 py-1 bg-gray-100 text-gray-600 font-semibold text-[10px] rounded-lg">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="p-4 bg-[#E8F8EE] border border-[#2DB24A]/25 rounded-2xl space-y-2 text-center shadow-xs">
                      <div className="flex justify-center text-[#2DB24A]"><Users className="w-7 h-7" /></div>
                      <h4 className="font-extrabold text-xs text-[#0F5132]">Ajak Teman Bergabung</h4>
                      <p className="text-[10px] text-emerald-800/80 leading-relaxed font-medium">
                        Semakin banyak anggota, semakin besar peluang yang kita ciptakan bersama.
                      </p>
                      <button onClick={handleShareReferralLink} className="w-full py-2 bg-white border border-[#2DB24A] text-[#0F5132] font-bold text-xs rounded-xl hover:bg-[#2DB24A] hover:text-white transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer">
                        <Share2 className="w-3.5 h-3.5" /> Bagikan Komunitas
                      </button>
                    </div>
                  </div>

                  <div className="lg:col-span-3 space-y-4">
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {['Semua', 'Diskusi', 'Pengumuman', 'Event', 'Produk'].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setFeedFilter(tab.toLowerCase() as any)}
                          className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all shrink-0 cursor-pointer ${
                            feedFilter === tab.toLowerCase()
                              ? 'bg-[#2DB24A] text-white shadow-xs'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>

                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Aktivitas Terbaru</h3>

                    <div className="p-5 bg-white border border-gray-200/80 rounded-2xl shadow-xs space-y-3 hover:border-gray-300 transition-all">
                      <div className="flex justify-between items-start">
                        <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 font-extrabold text-[10px] rounded-md uppercase">
                          Pengumuman
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">2 jam lalu</span>
                      </div>
                      <h4 className="font-extrabold text-sm text-gray-900">
                        Workshop Digital Marketing untuk UMKM
                      </h4>
                      <p className="text-xs text-gray-600 leading-relaxed font-medium">
                        Mari tingkatkan penjualan produk lokal melalui strategi digital yang tepat. Terbuka untuk semua anggota {community.name}!
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500 font-semibold">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1 hover:text-gray-900 cursor-pointer">👍 24</span>
                          <span className="flex items-center gap-1 hover:text-gray-900 cursor-pointer">💬 12</span>
                        </div>
                        <button onClick={() => setActiveSidebarNav('pengumuman')} className="text-[11px] font-bold text-[#2DB24A] hover:underline cursor-pointer">Lihat Detail →</button>
                      </div>
                    </div>

                    <div className="p-5 bg-white border border-gray-200/80 rounded-2xl shadow-xs space-y-3 hover:border-gray-300 transition-all">
                      <div className="flex justify-between items-start">
                        <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 font-extrabold text-[10px] rounded-md uppercase">
                          Diskusi
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">5 jam lalu</span>
                      </div>
                      <h4 className="font-extrabold text-sm text-gray-900">
                        Bagaimana cara mendapatkan supplier kemasan ramah lingkungan?
                      </h4>
                      <p className="text-xs text-gray-600 leading-relaxed font-medium">
                        Saya sedang mencari rekomendasi supplier kemasan untuk produk makanan. Ada yang punya pengalaman?
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500 font-semibold">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1 hover:text-gray-900 cursor-pointer">👍 18</span>
                          <span className="flex items-center gap-1 hover:text-gray-900 cursor-pointer">💬 28</span>
                        </div>
                        <button onClick={() => setActiveSidebarNav('diskusi')} className="text-[11px] font-bold text-[#2DB24A] hover:underline cursor-pointer">Lihat Diskusi →</button>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2 space-y-4">
                    <div className="p-5 bg-white border border-gray-200/80 rounded-2xl shadow-xs space-y-3">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Event Mendatang</h3>
                        <button onClick={() => setActiveSidebarNav('event')} className="text-[10px] font-bold text-[#2DB24A] hover:underline cursor-pointer">Lihat Semua</button>
                      </div>
                      <div className="space-y-2.5">
                        {(() => {
                          const realEvents = (announcements || []).filter((a: any) => a.type === 'EVENT' || a.title?.toLowerCase().includes('event') || a.title?.toLowerCase().includes('workshop') || a.title?.toLowerCase().includes('kopdar'))
                          if (realEvents.length === 0) {
                            return (
                              <div className="p-4 text-center bg-gray-50 border border-dashed border-gray-200 rounded-xl space-y-1">
                                <Calendar className="w-5 h-5 text-gray-300 mx-auto" />
                                <p className="text-[11px] font-bold text-gray-500">Belum Ada Event Mendatang</p>
                              </div>
                            )
                          }
                          return realEvents.slice(0, 3).map((ev: any, idx: number) => {
                            const dateObj = ev.publishedAt ? new Date(ev.publishedAt) : new Date()
                            const day = String(dateObj.getDate())
                            const month = dateObj.toLocaleDateString('id-ID', { month: 'short' }).toUpperCase()
                            return (
                              <div key={ev.id || idx} className="flex items-center gap-2.5 p-2 bg-gray-50 rounded-xl">
                                <div className="w-11 h-11 rounded-xl bg-white border border-gray-200 text-center flex flex-col justify-center shrink-0">
                                  <span className="text-xs font-black text-gray-900 leading-none">{day}</span>
                                  <span className="text-[9px] font-bold text-[#2DB24A] leading-none mt-0.5">{month}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-[11px] font-bold text-gray-900 line-clamp-1">{ev.title}</h4>
                                  <p className="text-[9px] text-gray-500 font-medium line-clamp-1">{ev.content || 'Event Komunitas'}</p>
                                </div>
                                <button onClick={() => setActiveSidebarNav('event')} className="px-2 py-1 bg-white border border-[#2DB24A] text-[#2DB24A] hover:bg-[#2DB24A] hover:text-white font-extrabold text-[10px] rounded-lg transition-colors cursor-pointer shrink-0">
                                  Lihat
                                </button>
                              </div>
                            )
                          })
                        })()}
                      </div>
                    </div>

                    <div className="p-5 bg-white border border-gray-200/80 rounded-2xl shadow-xs space-y-3">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Galeri Kegiatan</h3>
                        <button onClick={() => setActiveSidebarNav('galeri')} className="text-[10px] font-bold text-[#2DB24A] hover:underline cursor-pointer">Lihat Semua</button>
                      </div>
                      <div className="p-4 text-center bg-gray-50 border border-dashed border-gray-200 rounded-xl space-y-1">
                        <ImageIcon className="w-5 h-5 text-gray-300 mx-auto" />
                        <p className="text-[11px] font-bold text-gray-500">Belum Ada Foto Galeri</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: DISKUSI ─────────────────────────────────────────────────── */}
            {activeSidebarNav === 'diskusi' && (
              <DiscussionForum
                communityId={community.id}
                communityName={community.name}
                communityLogo={community.avatarUrl}
                communityMembersCount={realStats.activeMembersCount || (members || []).length}
                currentUser={user}
                isCanManageCoop={isCanManageCoop}
                isMember={isMember}
              />
            )}

                        {/* TAB 3: EVENT ────────────────────────────────────────────────────── */}
            {activeSidebarNav === 'event' && (
              <div className="space-y-6">
                <div className="p-6 bg-white border border-gray-200/80 rounded-3xl shadow-xs space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-2 bg-[#E8F8EE] text-[#0F5132] rounded-xl">
                          <Calendar className="w-5 h-5" />
                        </span>
                        <h2 className="text-xl font-black text-gray-900 font-sora">
                          Event & Agenda Kegiatan {community.name}
                        </h2>
                      </div>
                      <p className="text-xs text-gray-500 font-medium mt-1.5">
                        Ikuti workshop, web seminar, bazaar UMKM, dan kegiatan kopdar rutin anggota untuk memperluas jejaring dan wawasan usaha.
                      </p>
                    </div>
                    {isCanManageCoop && (
                      <button
                        onClick={handleOpenCreateEvent}
                        className="px-4 py-2.5 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Plus className="w-4 h-4" /> Tambah Event Baru
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
                    {communityEvents && communityEvents.length > 0 ? (
                      communityEvents.map((ev: any) => {
                        const dateObj = ev.eventDate ? new Date(ev.eventDate) : new Date()
                        const day = String(dateObj.getDate())
                        const month = dateObj.toLocaleDateString('id-ID', { month: 'short' }).toUpperCase()
                        const year = String(dateObj.getFullYear())
                        const timeStr = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                        
                        let regs: any[] = []
                        try {
                          regs = typeof ev.registeredUsers === 'string' ? JSON.parse(ev.registeredUsers) : (ev.registeredUsers || [])
                        } catch (_) { regs = [] }
                        const isUserRegistered = user && (registeredEventIds.includes(ev.id) || regs.some((r: any) => r.userId === user.id))
                        const isPast = dateObj.getTime() < Date.now()

                        return (
                          <div
                            key={ev.id}
                            className="p-5 bg-white border border-gray-200/90 rounded-2xl space-y-4 hover:border-[#2DB24A]/50 hover:shadow-md transition-all flex flex-col justify-between"
                          >
                            <div className="space-y-3.5">
                              {/* Banner Image & Top Header */}
                              {ev.bannerUrl && (
                                <div className="relative rounded-xl overflow-hidden h-36 bg-gray-100">
                                  <Image src={ev.bannerUrl} alt={ev.title} fill sizes="(max-width: 768px) 100vw, 400px" className="object-cover" />
                                  <span className={`absolute top-2.5 left-2.5 px-2.5 py-0.5 font-extrabold text-[9px] rounded-md uppercase tracking-wider shadow-xs ${
                                    isPast ? 'bg-gray-700 text-white' : 'bg-[#2DB24A] text-white'
                                  }`}>
                                    {isPast ? 'Selesai' : 'Mendatang'}
                                  </span>
                                  {ev.isOnline && (
                                    <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 bg-blue-600/90 backdrop-blur-md text-white font-extrabold text-[9px] rounded-md shadow-xs">
                                      Online Event
                                    </span>
                                  )}
                                </div>
                              )}

                              <div className="flex gap-3.5 items-start">
                                <div className="w-14 h-14 rounded-2xl bg-[#E8F8EE] border border-emerald-200/80 text-center flex flex-col justify-center shadow-xs shrink-0">
                                  <span className="text-base font-black text-[#0F5132] leading-none">{day}</span>
                                  <span className="text-[10px] font-extrabold text-[#2DB24A] leading-none mt-1 uppercase">{month} {year}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-sm font-extrabold text-gray-900 leading-snug font-sora line-clamp-2">
                                    {ev.title}
                                  </h3>
                                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-gray-500 font-semibold">
                                    <span>⏰ {timeStr} WIB</span>
                                    <span>•</span>
                                    <span>📍 {ev.location || 'Online'}</span>
                                  </div>
                                </div>
                              </div>

                              <p className="text-xs text-gray-600 leading-relaxed font-medium line-clamp-3">
                                {ev.description || 'Mari berpartisipasi dalam event kebersamaan komunitas.'}
                              </p>

                              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-gray-50 rounded-xl text-xs font-semibold text-gray-600 border border-gray-100">
                                <span>👥 Terdaftar: <strong className="text-gray-900">{regs.length} / {ev.maxParticipants || 100}</strong> peserta</span>
                                <span className="font-extrabold text-[#0F5132]">
                                  {Number(ev.price || 0) === 0 ? 'Gratis untuk Anggota' : `Rp ${Number(ev.price).toLocaleString('id-ID')}`}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
                              {isCanManageCoop ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleOpenEditEvent(ev)}
                                    className="px-3 py-1.5 text-xs font-bold text-gray-700 hover:text-[#2DB24A] hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" /> Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteEvent(ev.id, ev.title)}
                                    className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" /> Hapus
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[11px] font-semibold text-gray-400">
                                  Penyelenggara: {ev.organizer || 'Pengurus'}
                                </span>
                              )}

                              <button
                                onClick={() => handleRegisterEvent(ev.id, ev.title)}
                                disabled={isPast || isUserRegistered}
                                className={`px-4 py-2 text-xs font-extrabold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                                  isUserRegistered
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
                                    : isPast
                                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                      : 'bg-[#2DB24A] hover:bg-[#0F5132] text-white'
                                }`}
                              >
                                {isUserRegistered ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Terdaftar
                                  </>
                                ) : isPast ? (
                                  'Event Telah Berakhir'
                                ) : (
                                  'Daftar / Ikuti Event'
                                )}
                              </button>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="col-span-full p-12 text-center bg-gray-50 border border-dashed border-gray-200 rounded-3xl space-y-3">
                        <Calendar className="w-12 h-12 text-[#2DB24A] mx-auto opacity-70" />
                        <h4 className="text-sm font-extrabold text-gray-800">Belum Ada Agenda Event</h4>
                        <p className="text-xs text-gray-500 max-w-md mx-auto">
                          Komunitas ini belum memiliki agenda workshop, kopdar, atau bazaar mendatang. Pengurus dapat menambahkan jadwal event baru.
                        </p>
                        {isCanManageCoop && (
                          <button
                            onClick={handleOpenCreateEvent}
                            className="px-4 py-2 bg-[#2DB24A] text-white font-extrabold text-xs rounded-xl shadow-xs hover:bg-[#0F5132] transition-all cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <Plus className="w-4 h-4" /> Buat Event Sekarang
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: PRODUK RESMI KOMUNITAS (OFFICIAL PRODUCTS CRUD) ──────────────── */}
            {activeSidebarNav === 'produk_komunitas' && (
              <div className="space-y-6">
                <div className="p-6 bg-white border border-gray-200/80 rounded-3xl shadow-xs space-y-6">
                  {/* Header */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-2 bg-[#E8F8EE] text-[#0F5132] rounded-xl">
                          <Package className="w-5 h-5" />
                        </span>
                        <h2 className="text-xl font-black text-gray-900 font-sora">
                          Produk Resmi {community.name}
                        </h2>
                        <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black uppercase rounded-md tracking-wider">
                          Official Catalog
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 font-medium mt-1.5">
                        Koleksi produk resmi, merchandise, seragam, bahan baku, dan paket usaha terpercaya yang dikelola langsung oleh pengurus komunitas.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {isCanManageCoop && (
                        <button
                          onClick={handleOpenCreateOfficialProduct}
                          className="px-4 py-2.5 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" /> Tambah Produk Komunitas
                        </button>
                      )}
                      <Link
                        href="/cart"
                        className="px-4 py-2.5 bg-white border border-gray-200 hover:border-[#2DB24A] hover:text-[#2DB24A] text-gray-700 font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <ShoppingCart className="w-4 h-4 text-[#2DB24A]" /> Keranjang Belanja
                      </Link>
                    </div>
                  </div>

                  {/* Search & Category Filter Pills */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                      <div className="relative w-full sm:w-80">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Cari produk resmi komunitas..."
                          value={officialProductSearchQuery}
                          onChange={(e) => setOfficialProductSearchQuery(e.target.value)}
                          className="w-full pl-9.5 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 placeholder-gray-400 focus:bg-white focus:border-[#2DB24A] focus:ring-1 focus:ring-[#2DB24A] outline-hidden transition-all"
                        />
                      </div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 w-full sm:w-auto justify-end">
                        <span>Total: <strong className="text-gray-900">{communityOfficialProducts.length}</strong> produk</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                      {['Semua', 'Merchandise & Seragam', 'Bahan Baku', 'Produk Olahan', 'Paket Usaha', 'Lainnya'].map((cat) => {
                        const isSelected = officialProductCategoryFilter === cat
                        return (
                          <button
                            key={cat}
                            onClick={() => setOfficialProductCategoryFilter(cat)}
                            className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#2DB24A] text-white shadow-xs'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200/70 hover:text-gray-900'
                            }`}
                          >
                            {cat}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Product Cards Grid */}
                  {(() => {
                    const filteredProducts = communityOfficialProducts.filter((p) => {
                      const matchQuery = !officialProductSearchQuery.trim() ||
                        p.name?.toLowerCase().includes(officialProductSearchQuery.toLowerCase()) ||
                        p.description?.toLowerCase().includes(officialProductSearchQuery.toLowerCase()) ||
                        p.category?.toLowerCase().includes(officialProductSearchQuery.toLowerCase())
                      const matchCat = officialProductCategoryFilter === 'Semua' || p.category === officialProductCategoryFilter
                      return matchQuery && matchCat
                    })

                    if (filteredProducts.length === 0) {
                      return (
                        <div className="p-12 text-center bg-gray-50 border border-dashed border-gray-200 rounded-3xl space-y-3">
                          <Package className="w-12 h-12 text-gray-300 mx-auto" />
                          <h4 className="text-sm font-extrabold text-gray-800">
                            {officialProductSearchQuery || officialProductCategoryFilter !== 'Semua'
                              ? 'Tidak Ada Produk yang Cocok'
                              : 'Belum Ada Produk Resmi Komunitas'}
                          </h4>
                          <p className="text-xs text-gray-500 max-w-md mx-auto">
                            {officialProductSearchQuery || officialProductCategoryFilter !== 'Semua'
                              ? 'Coba gunakan kata kunci pencarian lain atau pilih kategori Semua.'
                              : 'Pengurus komunitas belum menambahkan katalog produk resmi. Klik tombol Tambah Produk Komunitas untuk mulai menjual.'}
                          </p>
                          {isCanManageCoop && (
                            <button
                              onClick={handleOpenCreateOfficialProduct}
                              className="px-4 py-2 bg-[#2DB24A] text-white font-extrabold text-xs rounded-xl shadow-xs hover:bg-[#0F5132] transition-all cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <Plus className="w-4 h-4" /> Tambah Produk Sekarang
                            </button>
                          )}
                        </div>
                      )
                    }

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4.5">
                        {filteredProducts.map((prod: any) => {
                          const isOutOfStock = Number(prod.stock || 0) <= 0
                          return (
                            <div
                              key={prod.id}
                              className="p-4 bg-white border border-gray-200/90 rounded-2xl space-y-3.5 hover:border-[#2DB24A]/50 hover:shadow-md transition-all flex flex-col justify-between group"
                            >
                              <div className="space-y-3">
                                {/* Image & Badges */}
                                <div className="relative rounded-xl overflow-hidden h-44 bg-gray-100">
                                  <Image
                                    src={prod.imageUrl || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=80'}
                                    alt={prod.name}
                                    fill
                                    sizes="(max-width: 768px) 50vw, 300px"
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                  <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 bg-[#2DB24A] text-white font-extrabold text-[9px] rounded-md uppercase tracking-wider shadow-xs">
                                    {prod.category || 'Official'}
                                  </span>
                                  <span className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-black/60 backdrop-blur-md text-white font-extrabold text-[9px] rounded-md shadow-xs">
                                    {isOutOfStock ? 'Stok Habis' : `Stok: ${prod.stock} unit`}
                                  </span>
                                </div>

                                {/* Title & Info */}
                                <div>
                                  <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold mb-1">
                                    <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
                                    <span>Resmi {community.name}</span>
                                  </div>
                                  <h4 className="text-sm font-extrabold text-gray-900 group-hover:text-[#2DB24A] transition-colors line-clamp-1">
                                    {prod.name}
                                  </h4>
                                  <p className="text-xs text-gray-500 font-medium line-clamp-2 mt-1 leading-relaxed">
                                    {prod.description || 'Produk resmi berkualitas pilihan dari komunitas.'}
                                  </p>
                                </div>
                              </div>

                              {/* Price & Action Buttons */}
                              <div className="pt-3 border-t border-gray-100 space-y-2.5">
                                <div className="flex justify-between items-baseline">
                                  <div>
                                    <span className="text-[10px] text-gray-400 font-bold block">Harga Komunitas</span>
                                    <span className="text-base font-black text-[#0F5132]">
                                      Rp {Number(prod.price || 0).toLocaleString('id-ID')}
                                    </span>
                                  </div>
                                  {prod.sku && (
                                    <span className="text-[9px] font-mono text-gray-400">
                                      {prod.sku}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleOpenDetailOfficialProduct(prod)}
                                    className="flex-1 py-2 bg-gray-100 hover:bg-gray-200/80 text-gray-800 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                  >
                                    <Eye className="w-3.5 h-3.5" /> Detail
                                  </button>

                                  <button
                                    onClick={() => handleBuyOfficialProduct(prod, 1)}
                                    disabled={isOutOfStock}
                                    className={`flex-1 py-2 font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                      isOutOfStock
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        : 'bg-[#2DB24A] hover:bg-[#0F5132] text-white'
                                    }`}
                                  >
                                    <ShoppingCart className="w-3.5 h-3.5" /> + Keranjang
                                  </button>
                                </div>

                                {isCanManageCoop && (
                                  <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-dashed border-gray-100">
                                    <button
                                      onClick={() => handleOpenEditOfficialProduct(prod)}
                                      className="px-2.5 py-1 text-[11px] font-bold text-gray-600 hover:text-[#2DB24A] hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                                    >
                                      <Edit3 className="w-3 h-3" /> Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteOfficialProduct(prod.id, prod.name)}
                                      className="px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                                    >
                                      <Trash2 className="w-3 h-3" /> Hapus
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}
                </div>
              </div>
            )}

                        {/* TAB 4: PRODUK ANGGOTA (MARKETPLACE) ─────────────────────────────── */}
            {activeSidebarNav === 'marketplace' && (
              <div className="space-y-6">
                <div className="p-6 bg-white border border-gray-200/80 rounded-3xl shadow-xs space-y-6">
                  {/* Header */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-2 bg-[#E8F8EE] text-[#0F5132] rounded-xl">
                          <Store className="w-5 h-5" />
                        </span>
                        <h2 className="text-xl font-black text-gray-900 font-sora">
                          Produk Anggota {community.name}
                        </h2>
                        <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase rounded-md tracking-wider">
                          UMKM Member Catalog
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 font-medium mt-1.5">
                        Dukung produk lokal! Belanja langsung beragam produk berkualitas dari para pelaku usaha dan pengrajin anggota resmi komunitas.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {(isMember || isCanManageCoop) && (
                        <button
                          onClick={handleOpenCreateMemberProduct}
                          className="px-4 py-2.5 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" /> Tambah Produk Anggota
                        </button>
                      )}
                      <Link
                        href="/cart"
                        className="px-4 py-2.5 bg-white border border-gray-200 hover:border-[#2DB24A] hover:text-[#2DB24A] text-gray-700 font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <ShoppingCart className="w-4 h-4 text-[#2DB24A]" /> Keranjang Belanja
                      </Link>
                    </div>
                  </div>

                  {/* Search & Category Filter Pills */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                      <div className="relative w-full sm:w-80">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Cari nama produk anggota, merchant, kategori..."
                          value={memberProdSearchQuery}
                          onChange={(e) => setMemberProdSearchQuery(e.target.value)}
                          className="w-full pl-9.5 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 placeholder-gray-400 focus:bg-white focus:border-[#2DB24A] focus:ring-1 focus:ring-[#2DB24A] outline-hidden transition-all"
                        />
                      </div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 w-full sm:w-auto justify-end">
                        <span>Total: <strong className="text-gray-900">{products ? products.length : 0}</strong> produk anggota</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                      {['Semua', 'Makanan & Minuman', 'Pakaian & Fashion', 'Kerajinan & Kriya', 'Kecantikan & Herbal', 'Jasa & Lainnya'].map((cat) => {
                        const isSelected = memberProdCategoryFilter === cat
                        return (
                          <button
                            key={cat}
                            onClick={() => setMemberProdCategoryFilter(cat)}
                            className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#2DB24A] text-white shadow-xs'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200/70 hover:text-gray-900'
                            }`}
                          >
                            {cat}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Member Product Cards Grid */}
                  {(() => {
                    const filteredProducts = (products || []).filter((p: any) => {
                      const prodName = p.title || p.name || ''
                      const prodDesc = p.description || ''
                      const prodCat = p.category || ''
                      const merchantName = p.merchant?.name || p.merchantName || p.merchant || ''
                      const matchQuery = !memberProdSearchQuery.trim() ||
                        prodName.toLowerCase().includes(memberProdSearchQuery.toLowerCase()) ||
                        prodDesc.toLowerCase().includes(memberProdSearchQuery.toLowerCase()) ||
                        prodCat.toLowerCase().includes(memberProdSearchQuery.toLowerCase()) ||
                        merchantName.toLowerCase().includes(memberProdSearchQuery.toLowerCase())
                      const matchCat = memberProdCategoryFilter === 'Semua' || prodCat === memberProdCategoryFilter
                      return matchQuery && matchCat
                    })

                    if (filteredProducts.length === 0) {
                      return (
                        <div className="p-12 text-center bg-gray-50 border border-dashed border-gray-200 rounded-3xl space-y-3">
                          <Store className="w-12 h-12 text-gray-300 mx-auto" />
                          <h4 className="text-sm font-extrabold text-gray-800">
                            {memberProdSearchQuery || memberProdCategoryFilter !== 'Semua'
                              ? 'Tidak Ada Produk Anggota yang Cocok'
                              : 'Belum Ada Produk Anggota Terdaftar'}
                          </h4>
                          <p className="text-xs text-gray-500 max-w-md mx-auto">
                            {memberProdSearchQuery || memberProdCategoryFilter !== 'Semua'
                              ? 'Coba gunakan kata kunci pencarian lain atau pilih kategori Semua.'
                              : 'Anggota UMKM komunitas belum menambahkan katalog produk. Klik tombol di bawah untuk menambahkan produk anggota.'}
                          </p>
                          {(isMember || isCanManageCoop) && (
                            <button
                              onClick={handleOpenCreateMemberProduct}
                              className="px-4 py-2 bg-[#2DB24A] text-white font-extrabold text-xs rounded-xl shadow-xs hover:bg-[#0F5132] transition-all cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <Plus className="w-4 h-4" /> Tambah Produk Anggota Sekarang
                            </button>
                          )}
                        </div>
                      )
                    }

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4.5">
                        {filteredProducts.map((p: any, idx: number) => {
                          const isOutOfStock = Number(p.stock !== undefined ? p.stock : 10) <= 0
                          const canManageThisProduct = isCanManageCoop || (user && p.merchantId === user.id) || user?.role === 'ADMIN'
                          const merchantDisplayName = p.merchant?.name || p.merchantName || p.merchant || 'Merchant Saloka'

                          return (
                            <div
                              key={p.id || idx}
                              className="p-4 bg-white border border-gray-200/90 rounded-2xl space-y-3.5 hover:border-[#2DB24A]/50 hover:shadow-md transition-all flex flex-col justify-between group"
                            >
                              <div className="space-y-3">
                                {/* Image & Badges */}
                                <div className="relative rounded-xl overflow-hidden h-44 bg-gray-100">
                                  <Image
                                    src={p.imageUrl || p.img || 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&h=200&fit=crop&q=80'}
                                    alt={p.title || p.name}
                                    fill
                                    sizes="(max-width: 768px) 50vw, 300px"
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                  <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 bg-[#2DB24A] text-white font-extrabold text-[9px] rounded-md uppercase tracking-wider shadow-xs">
                                    {p.category || 'Produk UMKM'}
                                  </span>
                                  <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 bg-black/60 backdrop-blur-md text-white font-extrabold text-[9px] rounded-md shadow-xs">
                                    {isOutOfStock ? 'Stok Habis' : `Stok: ${p.stock !== undefined ? p.stock : 10} unit`}
                                  </span>
                                </div>

                                {/* Title & Info */}
                                <div>
                                  <span className="text-[10px] text-gray-400 font-bold block mb-0.5 truncate">
                                    Toko / Pemilik: <strong className="text-gray-700">{merchantDisplayName}</strong>
                                  </span>
                                  <h4 className="text-sm font-extrabold text-gray-900 group-hover:text-[#2DB24A] transition-colors line-clamp-1">
                                    {p.title || p.name}
                                  </h4>
                                  <p className="text-xs text-gray-500 font-medium line-clamp-2 mt-1 leading-relaxed">
                                    {p.description || 'Produk UMKM berkualitas dari anggota komunitas.'}
                                  </p>
                                </div>
                              </div>

                              {/* Price & Action Buttons */}
                              <div className="pt-3 border-t border-gray-100 space-y-2.5">
                                <div className="flex justify-between items-baseline">
                                  <div>
                                    <span className="text-[10px] text-gray-400 font-bold block">Harga</span>
                                    <span className="text-base font-black text-[#0F5132]">
                                      Rp {Number(p.price || 0).toLocaleString('id-ID')}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5">
                                    ⭐ 5.0
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleOpenDetailMemberProduct(p)}
                                    className="flex-1 py-2 bg-gray-100 hover:bg-gray-200/80 text-gray-800 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                  >
                                    <Eye className="w-3.5 h-3.5" /> Detail
                                  </button>

                                  <button
                                    onClick={() => handleAddToCart(p)}
                                    disabled={isOutOfStock}
                                    className={`flex-1 py-2 font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                      isOutOfStock
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        : 'bg-[#2DB24A] hover:bg-[#0F5132] text-white'
                                    }`}
                                  >
                                    <ShoppingCart className="w-3.5 h-3.5" /> + Keranjang
                                  </button>
                                </div>

                                {canManageThisProduct && (
                                  <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-dashed border-gray-100">
                                    <button
                                      onClick={() => handleOpenEditMemberProduct(p)}
                                      className="px-2.5 py-1 text-[11px] font-bold text-gray-600 hover:text-[#2DB24A] hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                                    >
                                      <Edit3 className="w-3 h-3" /> Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteMemberProduct(p.id, p.title || p.name)}
                                      className="px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                                    >
                                      <Trash2 className="w-3 h-3" /> Hapus
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}
                </div>
              </div>
            )}

            {/* TAB 5: ANGGOTA ──────────────────────────────────────────────────── */}
            {activeSidebarNav === 'anggota' && (
              <div className="space-y-6">
                <div className="p-6 bg-white border border-gray-200/80 rounded-3xl shadow-xs space-y-5">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-2 bg-[#E8F8EE] text-[#0F5132] rounded-xl">
                          <Users className="w-5 h-5" />
                        </span>
                        <h2 className="text-xl font-black text-gray-900 font-sora">
                          Direktori Anggota {community.name}
                        </h2>
                      </div>
                      <p className="text-xs text-gray-500 font-medium mt-1.5">
                        Jejaring resmi pelaku UMKM, pemilik usaha, dan pengurus komunitas. Saling terhubung untuk berbagi peluang usaha.
                      </p>
                    </div>
                    <button
                      onClick={() => handleJoin()}
                      className="px-4 py-2.5 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" /> Undang Anggota Baru
                    </button>
                  </div>

                  {/* Search & Role Filter Pills */}
                  {isMember && (
                    <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pb-1">
                      <div className="relative w-full sm:w-80">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Cari nama anggota atau lokasi..."
                          value={memberSearchQuery}
                          onChange={(e) => setMemberSearchQuery(e.target.value)}
                          className="w-full pl-9.5 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 placeholder-gray-400 focus:bg-white focus:border-[#2DB24A] focus:ring-1 focus:ring-[#2DB24A] outline-hidden transition-all"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                        {(['Semua', 'Pengurus', 'Anggota'] as const).map((rf) => (
                          <button
                            key={rf}
                            onClick={() => setMemberRoleFilter(rf)}
                            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                              memberRoleFilter === rf
                                ? 'bg-[#2DB24A] text-white shadow-xs'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {rf}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {!isMember ? (
                      <div className="col-span-full p-10 bg-gradient-to-b from-emerald-50/50 via-white to-gray-50 border border-emerald-200/70 rounded-3xl text-center space-y-4 shadow-xs">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-[#007A3D] border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
                          <Lock className="w-7 h-7" />
                        </div>
                        <div className="space-y-1.5 max-w-md mx-auto">
                          <h4 className="font-extrabold text-sm text-gray-900 font-sora">
                            Direktori & Kontak Anggota Khusus Anggota Terdaftar
                          </h4>
                          <p className="text-xs text-gray-600 font-medium leading-relaxed">
                            Untuk menjaga privasi data dan keamanan jejaring bisnis, rincian kontak & profil lengkap anggota hanya dapat diakses oleh anggota resmi <strong className="text-gray-900">{community.name}</strong>.
                          </p>
                        </div>
                        <div className="pt-2">
                          <button
                            onClick={handleJoin}
                            className="px-6 py-3 bg-[#007A3D] hover:bg-[#006030] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
                          >
                            <Users className="w-4 h-4" /> {isKoperasi ? 'Menjadi Anggota' : 'Gabung Komunitas'}
                          </button>
                        </div>
                      </div>
                    ) : (() => {
                      const filteredMembers = (members || []).filter((m: any) => {
                        const memberName = m.user?.name || m.name || ''
                        const memberLoc = m.user?.locationName || m.loc || ''
                        const matchQ = !memberSearchQuery.trim() ||
                          memberName.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                          memberLoc.toLowerCase().includes(memberSearchQuery.toLowerCase())
                        const isPengurus = m.role === 'ADMIN' || m.role === 'KETUA' || m.userId === community?.ketuaId
                        const matchR = memberRoleFilter === 'Semua' || (memberRoleFilter === 'Pengurus' ? isPengurus : !isPengurus)
                        return matchQ && matchR
                      })

                      if (filteredMembers.length === 0) {
                        return (
                          <div className="col-span-full p-10 text-center bg-gray-50 border border-dashed border-gray-200 rounded-3xl space-y-3">
                            <Users className="w-10 h-10 text-gray-300 mx-auto" />
                            <h4 className="text-sm font-extrabold text-gray-800">Tidak Ada Anggota yang Cocok</h4>
                            <p className="text-xs text-gray-500 max-w-md mx-auto">
                              Silakan sesuaikan kata kunci pencarian atau ubah filter peranan.
                            </p>
                          </div>
                        )
                      }

                      return filteredMembers.map((m: any, idx: number) => {
                        const memberId = m.userId || m.id || `m-${idx}`
                        const memberName = m.user?.name || m.name || 'Anggota Saloka'
                        const userAvatar = m.user?.image || m.user?.avatarUrl || m.avatarUrl || m.img
                        const avatarSrc = userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(memberName)}&background=2DB24A&color=ffffff&bold=true`

                        const isAuthorizedToKick = user?.role === 'ADMIN' || user?.id === community?.ketuaId
                        const canKickThisMember = isAuthorizedToKick && m.userId !== community?.ketuaId && m.userId !== user?.id
                        const isMenuOpen = openMemberMenuId === memberId
                        const isLeader = m.role === 'ADMIN' || m.role === 'KETUA' || m.userId === community?.ketuaId

                        return (
                          <div
                            key={memberId}
                            onClick={() => handleOpenMemberDetail(m)}
                            className="relative p-4 bg-white border border-gray-200/80 rounded-2xl flex items-center justify-between shadow-xs hover:border-[#2DB24A]/50 hover:shadow-md transition-all cursor-pointer group"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <Image
                                src={avatarSrc}
                                alt={memberName}
                                width={48}
                                height={48}
                                className="w-12 h-12 rounded-full object-cover shrink-0 border border-gray-100 shadow-xs group-hover:scale-105 transition-transform"
                              />
                              <div className="min-w-0">
                                <span className={`inline-block px-2.5 py-0.5 font-bold text-[9px] rounded-md uppercase tracking-wider ${
                                  isLeader ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-[#E8F8EE] text-[#0F5132]'
                                }`}>
                                  {isLeader ? 'Pengurus' : 'Anggota UMKM'}
                                </span>
                                <h4 className="text-sm font-extrabold text-gray-900 leading-tight mt-1 font-sora truncate group-hover:text-[#2DB24A] transition-colors">
                                  {memberName}
                                </h4>
                                <p className="text-xs text-gray-400 font-medium mt-0.5 truncate">
                                  {m.user?.locationName || m.loc || 'Yogyakarta, Indonesia'}
                                </p>
                              </div>
                            </div>

                            <div className="relative shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => setOpenMemberMenuId(isMenuOpen ? null : memberId)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                                title="Opsi Anggota"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {isMenuOpen && (
                                <div className="absolute right-0 top-9 z-30 bg-white border border-gray-100 rounded-2xl shadow-xl p-1.5 min-w-[130px] animate-in fade-in zoom-in-95 duration-150">
                                  {canKickThisMember ? (
                                    <button
                                      type="button"
                                      disabled={isKicking === m.userId}
                                      onClick={() => {
                                        setOpenMemberMenuId(null)
                                        handleKickMember(m.userId, memberName)
                                      }}
                                      className="w-full text-left px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                      {isKicking === m.userId ? '...' : 'Keluarkan'}
                                    </button>
                                  ) : (
                                    <div className="px-3 py-1.5 text-[11px] font-medium text-gray-400 text-center">
                                      {isLeader ? 'Ketua / Pengurus' : 'Tidak ada aksi'}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })
                    })()}
                  </div>
                </div>
              </div>
            )}

                        {/* TAB 6: GALERI ──────────────────────────────────────────────────── */}
            {activeSidebarNav === 'galeri' && (
              <div className="space-y-6">
                <div className="p-6 bg-white border border-gray-200/80 rounded-3xl shadow-xs space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-2 bg-[#E8F8EE] text-[#0F5132] rounded-xl">
                          <ImageIcon className="w-5 h-5" />
                        </span>
                        <h2 className="text-xl font-black text-gray-900 font-sora">
                          Galeri Foto Kegiatan {community.name}
                        </h2>
                      </div>
                      <p className="text-xs text-gray-500 font-medium mt-1.5">
                        Dokumentasi momen kebersamaan, workshop, pelatihan usaha, bazaar UMKM, dan kopdar silaturahmi anggota.
                      </p>
                    </div>
                    {(isMember || isCanManageCoop) && (
                      <button
                        onClick={handleOpenCreateGallery}
                        className="px-4 py-2.5 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Upload className="w-4 h-4" /> Unggah Foto Kegiatan
                      </button>
                    )}
                  </div>

                  {/* Album Category Filter Pills */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                    {['Semua', 'Kopdar & Networking', 'Workshop & Pelatihan', 'Bazaar & Pameran', 'Kunjungan Usaha'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setGalleryCategoryFilter(cat)}
                        className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                          galleryCategoryFilter === cat
                            ? 'bg-[#2DB24A] text-white shadow-xs'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Gallery Image Grid */}
                  {(() => {
                    const filteredGallery = (communityGallery || []).filter((g: any) => {
                      return galleryCategoryFilter === 'Semua' || g.category === galleryCategoryFilter
                    })

                    if (filteredGallery.length === 0) {
                      return (
                        <div className="p-12 text-center bg-gray-50 border border-dashed border-gray-200 rounded-3xl space-y-3">
                          <ImageIcon className="w-12 h-12 text-gray-300 mx-auto" />
                          <h4 className="text-sm font-extrabold text-gray-800">Belum Ada Foto di Kategori Ini</h4>
                          <p className="text-xs text-gray-500 max-w-md mx-auto">
                            Pengurus atau anggota dapat mengunggah momen kegiatan komunitas di sini.
                          </p>
                          {(isMember || isCanManageCoop) && (
                            <button
                              onClick={handleOpenCreateGallery}
                              className="px-4 py-2 bg-[#2DB24A] text-white font-extrabold text-xs rounded-xl shadow-xs hover:bg-[#0F5132] transition-all cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <Plus className="w-4 h-4" /> Unggah Foto Sekarang
                            </button>
                          )}
                        </div>
                      )
                    }

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4.5">
                        {filteredGallery.map((item: any) => (
                          <div
                            key={item.id}
                            className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-xs hover:border-[#2DB24A]/40 hover:shadow-md transition-all flex flex-col justify-between group"
                          >
                            <div className="relative h-48 bg-gray-100 overflow-hidden cursor-pointer" onClick={() => setSelectedLightboxImage(item)}>
                              <Image
                                src={item.imageUrl}
                                alt={item.title}
                                fill
                                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 bg-[#2DB24A] text-white font-extrabold text-[9px] rounded-md uppercase tracking-wider shadow-xs">
                                {item.category || 'Dokumentasi'}
                              </span>
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-xl text-xs font-black text-gray-900 flex items-center gap-1.5 shadow-md">
                                  <Eye className="w-3.5 h-3.5 text-[#2DB24A]" /> Lihat Foto
                                </span>
                              </div>
                            </div>

                            <div className="p-4 space-y-2">
                              <h4 className="text-xs font-extrabold text-gray-900 group-hover:text-[#2DB24A] transition-colors line-clamp-1 font-sora">
                                {item.title}
                              </h4>
                              <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed font-medium">
                                {item.caption || 'Dokumentasi kegiatan resmi komunitas.'}
                              </p>
                              <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-[10px] text-gray-400 font-semibold">
                                <span>📅 {item.date || 'Juli 2026'}</span>
                                {isCanManageCoop && (
                                  <button
                                    onClick={() => handleDeleteGallery(item.id, item.title)}
                                    className="text-rose-500 hover:text-rose-700 font-bold hover:underline cursor-pointer"
                                  >
                                    Hapus
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                </div>
              </div>
            )}

            {/* TAB 7: PENGUMUMAN ──────────────────────────────────────────────── */}
            {activeSidebarNav === 'pengumuman' && (
              <div className="space-y-6">
                <div className="p-6 bg-white border border-gray-200/80 rounded-3xl shadow-xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-black text-gray-900 font-sora flex items-center gap-2">
                        <Megaphone className="w-6 h-6 text-[#2DB24A]" /> Pengumuman Resmi Komunitas
                      </h2>
                      <p className="text-xs text-gray-500 font-medium mt-1">Informasi penting, edaran resmi pengurus, serta pengumuman program kerja {community.name}.</p>
                    </div>
                    {isCanManageCoop && (
                      <button
                        onClick={() => handleOpenAnnouncementModal()}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-2xl shadow-xs transition-all cursor-pointer whitespace-nowrap"
                      >
                        <Plus className="w-4 h-4" /> Tambah Pengumuman
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    {isLoadingAnnouncements ? (
                      <div className="flex justify-center items-center py-10">
                        <Loader2 className="w-8 h-8 text-[#2DB24A] animate-spin" />
                      </div>
                    ) : announcements.filter(p => isCanManageCoop || p.status === 'PUBLISHED').length === 0 ? (
                      <div className="p-10 text-center bg-gray-50/70 border border-gray-200/80 rounded-2xl space-y-2">
                        <Megaphone className="w-8 h-8 text-gray-400 mx-auto opacity-70" />
                        <p className="text-sm font-bold text-gray-500">Belum ada pengumuman</p>
                      </div>
                    ) : (
                      announcements
                        .filter(p => isCanManageCoop || p.status === 'PUBLISHED')
                        .map((p) => (
                          <div key={p.id} className={`p-5 bg-gray-50/70 border ${p.isPinned ? 'border-amber-300 bg-amber-50/20' : 'border-gray-200/80'} rounded-2xl space-y-2.5 transition-all`}>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                {p.isPinned && (
                                  <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 font-extrabold text-[10px] rounded-md flex items-center gap-1">
                                    📌 TERPAKU
                                  </span>
                                )}
                                {isCanManageCoop && (
                                  <span className={`px-2 py-0.5 font-extrabold text-[9px] rounded-md ${p.status === 'DRAFT' ? 'bg-gray-200 text-gray-700' : 'bg-green-100 text-green-800'}`}>
                                    {p.status === 'DRAFT' ? 'DRAFT' : 'PUBLIKASI'}
                                  </span>
                                )}
                                <span className="text-[10px] text-gray-400 font-semibold">
                                  {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                                </span>
                              </div>

                              {isCanManageCoop && (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleTogglePinAnnouncement(p)}
                                    title={p.isPinned ? 'Lepas Pin' : 'Patok ke Atas'}
                                    className="p-1.5 text-gray-500 hover:text-amber-600 bg-white border border-gray-200 rounded-lg hover:border-amber-300 transition-all cursor-pointer"
                                  >
                                    <MapPin className={`w-3.5 h-3.5 ${p.isPinned ? 'fill-amber-600 text-amber-600' : ''}`} />
                                  </button>
                                  <button
                                    onClick={() => handleTogglePublishAnnouncement(p)}
                                    title={p.status === 'DRAFT' ? 'Publikasikan' : 'Simpan sebagai Draft'}
                                    className="p-1.5 text-gray-500 hover:text-green-600 bg-white border border-gray-200 rounded-lg hover:border-green-300 transition-all cursor-pointer"
                                  >
                                    {p.status === 'DRAFT' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                                  </button>
                                  <button
                                    onClick={() => handleOpenAnnouncementModal(p)}
                                    title="Edit Pengumuman"
                                    className="p-1.5 text-gray-500 hover:text-blue-600 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-all cursor-pointer"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteAnnouncement(p.id)}
                                    title="Hapus Pengumuman"
                                    className="p-1.5 text-gray-500 hover:text-red-600 bg-white border border-gray-200 rounded-lg hover:border-red-300 transition-all cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                            <h3 className="text-sm font-extrabold text-gray-900 font-sora">{p.title}</h3>
                            <p className="text-xs text-gray-600 leading-relaxed font-medium whitespace-pre-wrap">{p.content}</p>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 8: TENTANG ─────────────────────────────────────────────────── */}
            {activeSidebarNav === 'tentang' && (
              <div className="space-y-6">
                <div className="p-6 bg-white border border-gray-200/80 rounded-3xl shadow-xs space-y-6">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 font-sora flex items-center gap-2">
                      <Info className="w-6 h-6 text-[#2DB24A]" /> Tentang {community.name}
                    </h2>
                    <p className="text-xs text-gray-500 font-medium mt-1">Profil lengkap, visi & misi, struktur pengurus, serta legalitas hukum perkumpulan.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-5 bg-gray-50/70 border border-gray-200/80 rounded-2xl space-y-3">
                      <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Visi & Misi</h3>
                      <p className="text-xs text-gray-600 leading-relaxed font-medium">
                        <strong className="text-gray-900">Visi:</strong> Menjadi perkumpulan UMKM terdepan di Indonesia yang mandiri, berdaya saing tinggi, berlandaskan semangat kolaborasi dan kebersamaan.
                      </p>
                      <div className="text-xs text-gray-600 space-y-1 font-medium pt-1">
                        <strong className="text-gray-900 block">Misi:</strong>
                        <p>1. Mendorong edukasi & literasi digital pemasaran UMKM.</p>
                        <p>2. Memfasilitasi jejaring promosi produk anggota secara luas.</p>
                        <p>3. Memperkuat sinergi usaha dan kolaborasi bisnis antar anggota.</p>
                      </div>
                    </div>

                    <div className="p-5 bg-gray-50/70 border border-gray-200/80 rounded-2xl space-y-3">
                      <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Informasi & Legalitas Hukum</h3>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between border-b border-gray-200/60 pb-1.5">
                          <span className="text-gray-500">Bentuk Organisasi:</span>
                          <span className="font-bold text-gray-800">{isKoperasi ? 'Koperasi Resmi' : 'Perkumpulan UMKM'}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-200/60 pb-1.5">
                          <span className="text-gray-500">Ketua / Penanggung Jawab:</span>
                          <span className="font-bold text-gray-800">{community.ketua?.name || members.find((m: any) => m.role === 'KETUA' || m.role === 'ADMIN' || m.userId === community.ketuaId)?.user?.name || community.ketuaName || '-'}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-200/60 pb-1.5">
                          <span className="text-gray-500">Tanggal Dibentuk:</span>
                          <span className="font-bold text-gray-800">{community.createdAt ? new Date(community.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-200/60 pb-1.5">
                          <span className="text-gray-500">Akta Notaris:</span>
                          <span className="font-bold text-gray-800 font-mono text-[11px]">{community.aktaNotaris || '-'}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-200/60 pb-1.5">
                          <span className="text-gray-500">Nomor AHU Kemenkumham:</span>
                          <span className="font-bold text-gray-800 font-mono text-[11px]">{community.nomorAhu || '-'}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-200/60 pb-1.5">
                          <span className="text-gray-500">Nomor NPWP Organisasi:</span>
                          <span className="font-bold text-gray-800 font-mono text-[11px]">{community.nomorNpwp || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Domisili Sekretariat:</span>
                          <span className="font-bold text-gray-800">{community.domisili || '-'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

                        {/* TAB 9: AKTIVITAS ───────────────────────────────────────────────── */}
            {activeSidebarNav === 'aktivitas' && (
              <div className="space-y-6">
                <div className="p-6 bg-white border border-gray-200/80 rounded-3xl shadow-xs space-y-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="p-2 bg-[#E8F8EE] text-[#0F5132] rounded-xl">
                        <Activity className="w-5 h-5" />
                      </span>
                      <h2 className="text-xl font-black text-gray-900 font-sora">
                        Log Aktivitas & Timeline {community.name}
                      </h2>
                    </div>
                    <p className="text-xs text-gray-500 font-medium mt-1.5">
                      Jejak kegiatan terbaru, pengumuman resmi, diskusi anggota, produk baru, dan perkembangan komunitas secara real-time.
                    </p>
                  </div>

                  <div className="space-y-3.5">
                    {(() => {
                      const dynamicActivities: any[] = [];
                      const annList = announcements || [];
                      const evList = communityEvents || [];
                      const opList = communityOfficialProducts || [];

                      // 1. Announcements activities
                      for (const a of annList.slice(0, 3)) {
                        dynamicActivities.push({
                          id: `act-ann-${a.id}`,
                          title: a.title,
                          desc: a.content,
                          category: 'PENGUMUMAN',
                          color: 'bg-blue-50 text-blue-600',
                          time: a.publishedAt ? new Date(a.publishedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'Terbaru',
                          author: 'Pengurus Komunitas',
                          targetTab: 'pengumuman'
                        });
                      }

                      // 2. Events activities
                      for (const ev of evList.slice(0, 3)) {
                        dynamicActivities.push({
                          id: `act-ev-${ev.id}`,
                          title: `Event Baru: ${ev.title}`,
                          desc: ev.description || 'Agenda pertemuan dan pelatihan anggota komunitas.',
                          category: 'EVENT',
                          color: 'bg-amber-50 text-amber-700',
                          time: ev.eventDate ? new Date(ev.eventDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'Mendatang',
                          author: ev.organizer || 'Divisi Acara',
                          targetTab: 'event'
                        });
                      }

                      // 3. Official Products activities
                      for (const op of opList.slice(0, 2)) {
                        dynamicActivities.push({
                          id: `act-op-${op.id}`,
                          title: `Produk Resmi Baru: ${op.name}`,
                          desc: `Telah dirilis di katalog resmi komunitas dengan harga Rp ${Number(op.price || 0).toLocaleString('id-ID')}.`,
                          category: 'PRODUK RESMI',
                          color: 'bg-emerald-50 text-emerald-700',
                          time: 'Tersedia',
                          author: 'Manajemen Komunitas',
                          targetTab: 'produk_komunitas'
                        });
                      }

                      if (dynamicActivities.length === 0) {
                        return (
                          <div className="p-10 text-center bg-gray-50 border border-dashed border-gray-200 rounded-2xl space-y-2">
                            <Activity className="w-8 h-8 text-gray-300 mx-auto" />
                            <p className="text-sm font-bold text-gray-500">Belum ada jejak aktivitas tercatat</p>
                          </div>
                        )
                      }

                      return dynamicActivities.map((act) => (
                        <div
                          key={act.id}
                          className="p-4 bg-gray-50/80 border border-gray-200/80 rounded-2xl flex items-start gap-4 hover:border-[#2DB24A]/40 transition-all group"
                        >
                          <div className="w-10 h-10 rounded-xl bg-[#E8F8EE] text-[#2DB24A] flex items-center justify-center font-bold shrink-0">
                            <Activity className="w-5 h-5" />
                          </div>
                          <div className="flex-1 space-y-1 min-w-0">
                            <div className="flex justify-between items-center">
                              <span className={`px-2 py-0.5 font-extrabold text-[9px] rounded uppercase ${act.color}`}>
                                {act.category}
                              </span>
                              <span className="text-[10px] text-gray-400 font-semibold">{act.time}</span>
                            </div>
                            <h4 className="text-xs font-extrabold text-gray-900 group-hover:text-[#2DB24A] transition-colors line-clamp-1">
                              {act.title}
                            </h4>
                            <p className="text-xs text-gray-600 font-medium leading-relaxed line-clamp-2">
                              {act.desc}
                            </p>
                            <div className="flex justify-between items-center pt-1.5 border-t border-gray-100">
                              <span className="text-[10px] text-gray-400 font-semibold">Oleh: {act.author}</span>
                              <button
                                onClick={() => setActiveSidebarNav(act.targetTab)}
                                className="text-[11px] font-bold text-[#2DB24A] hover:underline cursor-pointer flex items-center gap-1"
                              >
                                Buka {act.category.toLowerCase()} →
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 10: BUSINESS MATCHING ───────────────────────────────────────── */}
            {activeSidebarNav === 'business_matching' && (
              <div className="space-y-6">
                <div className="p-6 bg-white border border-gray-200/80 rounded-3xl shadow-xs space-y-5">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4">
                    <div>
                      <h2 className="text-xl font-black text-gray-900 font-sora flex items-center gap-2">
                        <Handshake className="w-6 h-6 text-[#2DB24A]" /> Business Matching & Temu Investor
                      </h2>
                      <p className="text-xs text-gray-500 font-medium mt-1">Temukan mitra distributor, investor F&B, dan kerjasama pemasaran skala nasional.</p>
                    </div>
                    <button onClick={() => goeyToast.info('Formulir pengajuan business matching telah dibuka!')} className="px-4 py-2.5 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer shrink-0">
                      <Plus className="w-4 h-4" /> Ajukan Kolaborasi
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { title: 'Distributor Produk Makanan Olahan Kemasan', partner: 'PT Boga Nusantara Jabar', target: 'Rp 150.000.000', status: 'Terbuka', slots: '3 Kuota Partner' },
                      { title: 'Kerjasama Pemasaran Export Batik & Fashion', partner: 'ExportHub Asia Singapore', target: 'Rp 300.000.000', status: 'Terbuka', slots: '5 Kuota Partner' },
                      { title: 'Kemitraan Franchise Outlet Kuliner Jogja', partner: 'Kopjaswara Commercial', target: 'Rp 75.000.000', status: 'Proses Matching', slots: '2 Kuota Partner' },
                      { title: 'Pendanaan Investor Angel untuk Startup F&B', partner: 'Jogja Ventures Group', target: 'Rp 500.000.000', status: 'Terbuka', slots: '1 Startup Tersisa' },
                    ].map((bm, idx) => (
                      <div key={idx} className="p-5 bg-gray-50/70 border border-gray-200/80 rounded-2xl space-y-3 hover:border-[#2DB24A]/40 transition-all flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="px-2.5 py-0.5 bg-[#E8F8EE] text-[#0F5132] font-extrabold text-[10px] rounded-md">{bm.status}</span>
                            <span className="text-[10px] text-gray-400 font-semibold">{bm.slots}</span>
                          </div>
                          <h4 className="text-xs font-black text-gray-900">{bm.title}</h4>
                          <p className="text-[11px] text-gray-500 font-semibold">Mitra: {bm.partner}</p>
                          <span className="text-xs font-black text-[#0F5132] block">Potensi Nilai: {bm.target}</span>
                        </div>
                        <button onClick={() => goeyToast.success(`Pengajuan proposal matching untuk "${bm.partner}" dikirim!`)} className="w-full py-2 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer text-center">
                          Ajukan Matching Proposal
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 11: PELATIHAN ───────────────────────────────────────────────── */}
            {activeSidebarNav === 'pelatihan' && (
              <div className="space-y-6">
                <div className="p-6 bg-white border border-gray-200/80 rounded-3xl shadow-xs space-y-5">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 font-sora flex items-center gap-2">
                      <GraduationCap className="w-6 h-6 text-[#2DB24A]" /> Pelatihan & Certification Bootcamps
                    </h2>
                    <p className="text-xs text-gray-500 font-medium mt-1">Tingkatkan kapabilitas bisnis, literasi keuangan, dan legalitas usaha bersama narasumber ahli.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { title: 'Strategi Digital Marketing & TikTok Live 2026', trainer: 'Siska Putri (Praktisi E-Commerce)', level: 'Semua Level', date: '30 Juli 2026', price: 'Gratis Anggota' },
                      { title: 'Penyusunan Laporan Keuangan Standar SAK EMKM', trainer: 'Dra. Tri Haryati, Ak.', level: 'Menengah', date: '05 Agustus 2026', price: 'Gratis Anggota' },
                      { title: 'Pendampingan Sertifikasi Halal Gratis (SEHATI)', trainer: 'LPPOM MUI DIY', level: 'Resmi', date: '12 Agustus 2026', price: 'Gratis Anggota' },
                    ].map((tc, idx) => (
                      <div key={idx} className="p-5 bg-gray-50/70 border border-gray-200/80 rounded-2xl space-y-3 hover:border-[#2DB24A]/40 transition-all flex flex-col justify-between">
                        <div className="space-y-2">
                          <span className="px-2 py-0.5 bg-[#E8F8EE] text-[#0F5132] font-extrabold text-[9px] rounded uppercase">{tc.level}</span>
                          <h4 className="text-xs font-black text-gray-900">{tc.title}</h4>
                          <p className="text-[10px] text-gray-500 font-semibold">Pemateri: {tc.trainer}</p>
                          <p className="text-[10px] text-gray-400 font-medium">📅 {tc.date}</p>
                        </div>
                        <div className="pt-2 border-t border-gray-200/60 flex justify-between items-center">
                          <span className="text-xs font-bold text-[#0F5132]">{tc.price}</span>
                          <button onClick={() => goeyToast.success(`Anda terdaftar di kelas "${tc.title}"!`)} className="px-3 py-1.5 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer">
                            Ikuti Kelas
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 12: MENTOR ──────────────────────────────────────────────────── */}
            {activeSidebarNav === 'mentor' && (
              <div className="space-y-6">
                <div className="p-6 bg-white border border-gray-200/80 rounded-3xl shadow-xs space-y-5">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 font-sora flex items-center gap-2">
                      <Award className="w-6 h-6 text-[#2DB24A]" /> Direktori Mentor Bisnis Terverifikasi
                    </h2>
                    <p className="text-xs text-gray-500 font-medium mt-1">Dapatkan bimbingan 1-on-1 langsung dari praktisi usaha, akademisi, dan pakar industri.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { name: 'Dr. Irvan Prasetya, M.M.', specialty: 'Branding & Scale-Up Bisnis', rating: '⭐ 4.9 (120 Sesi)', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&q=80' },
                      { name: 'Hj. Endang Setyowati', specialty: 'Manufaktur & Ekspor Pangan', rating: '⭐ 5.0 (95 Sesi)', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&q=80' },
                      { name: 'Budi Santoso, S.T.', specialty: 'Perencanaan Keuangan & Startup', rating: '⭐ 4.8 (80 Sesi)', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&q=80' },
                    ].map((m, idx) => (
                      <div key={idx} className="p-5 bg-gray-50/70 border border-gray-200/80 rounded-2xl space-y-3 flex flex-col justify-between hover:border-[#2DB24A]/40 transition-all text-center">
                        <div className="space-y-2">
                          <Image src={m.img} alt="" width={64} height={64} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-xs mx-auto" />
                          <h4 className="text-xs font-black text-gray-900">{m.name}</h4>
                          <p className="text-[10px] font-bold text-[#0F5132]">{m.specialty}</p>
                          <span className="text-[10px] text-amber-600 font-semibold block">{m.rating}</span>
                        </div>
                        <button onClick={() => goeyToast.success(`Sesi konsultasi dengan ${m.name} berhasil dijadwalkan!`)} className="w-full py-2 bg-white border border-[#2DB24A] text-[#2DB24A] hover:bg-[#2DB24A] hover:text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer">
                          Jadwalkan Konsultasi
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 13: KOLABORASI ──────────────────────────────────────────────── */}
            {activeSidebarNav === 'kolaborasi' && (
              <div className="space-y-6">
                <div className="p-6 bg-white border border-gray-200/80 rounded-3xl shadow-xs space-y-5">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 font-sora flex items-center gap-2">
                      <Users className="w-6 h-6 text-[#2DB24A]" /> Proyek Kolaborasi Bersama
                    </h2>
                    <p className="text-xs text-gray-500 font-medium mt-1">Gabung dalam proyek patungan, kargo bersama, dan pameran kolektif anggota.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { title: 'Pengiriman Kargo Bersama (Hemat 35% Ongkir)', desc: 'Konsolidasi pengiriman bahan baku dari Surabaya ke Jogja.', slots: '12 Merchant Terdaftar' },
                      { title: 'Pameran Stand Joint Booth Saloka Festival 2026', desc: 'Sewa space booth besar untuk display 10 merchant UMKM.', slots: '8 Merchant Terdaftar' },
                    ].map((col, idx) => (
                      <div key={idx} className="p-5 bg-gray-50/70 border border-gray-200/80 rounded-2xl space-y-3 hover:border-[#2DB24A]/40 transition-all flex flex-col justify-between">
                        <div className="space-y-2">
                          <h4 className="text-xs font-black text-gray-900">{col.title}</h4>
                          <p className="text-xs text-gray-600 font-medium leading-relaxed">{col.desc}</p>
                          <span className="text-[10px] text-[#0F5132] font-bold block">Status: {col.slots}</span>
                        </div>
                        <button onClick={() => goeyToast.success(`Anda bergabung dalam proyek "${col.title}"!`)} className="w-full py-2 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer">
                          Bergabung Kolaborasi
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 14: KELAS ───────────────────────────────────────────────────── */}
            {activeSidebarNav === 'kelas' && (
              <div className="space-y-6">
                <div className="p-6 bg-white border border-gray-200/80 rounded-3xl shadow-xs space-y-5">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 font-sora flex items-center gap-2">
                      <BookOpen className="w-6 h-6 text-[#2DB24A]" /> Katalog Kelas Pelajar Pengusaha
                    </h2>
                    <p className="text-xs text-gray-500 font-medium mt-1">Modul pembelajaran interaktif bisnis sejak dini untuk siswa dan mahasiswa.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { title: 'Business Model Canvas (BMC) Pemula', duration: '4 Modul Video', badge: 'Terpopuler' },
                      { title: 'Digital Marketing & Content Creator', duration: '6 Modul Video', badge: 'Favorit' },
                      { title: 'Leadership & Public Speaking Mastery', duration: '3 Modul Live', badge: 'Baru' },
                      { title: 'Financial Literacy untuk Pelajar', duration: '5 Modul Video', badge: 'Dasar' },
                    ].map((k, idx) => (
                      <div key={idx} className="p-4 bg-gray-50/70 border border-gray-200/80 rounded-2xl space-y-3 hover:border-[#2DB24A]/40 transition-all flex flex-col justify-between">
                        <div className="space-y-2">
                          <span className="px-2 py-0.5 bg-[#E8F8EE] text-[#0F5132] font-extrabold text-[9px] rounded uppercase">{k.badge}</span>
                          <h4 className="text-xs font-extrabold text-gray-900 leading-snug">{k.title}</h4>
                          <p className="text-[10px] text-gray-400 font-medium">🕒 {k.duration}</p>
                        </div>
                        <button onClick={() => goeyToast.success(`Kelas "${k.title}" dimulai!`)} className="w-full py-1.5 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer">
                          Mulai Belajar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 15: KOMPETISI ───────────────────────────────────────────────── */}
            {activeSidebarNav === 'kompetisi' && (
              <div className="space-y-6">
                <div className="p-6 bg-white border border-gray-200/80 rounded-3xl shadow-xs space-y-5">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 font-sora flex items-center gap-2">
                      <Trophy className="w-6 h-6 text-[#2DB24A]" /> Kompetisi & Challenge Pengusaha Muda
                    </h2>
                    <p className="text-xs text-gray-500 font-medium mt-1">Uji ide bisnismu dan menangkan total hadiah puluhan juta rupiah serta fasilitas inkubasi.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { title: 'Saloka Youth Business Plan Competition 2026', prize: 'Rp 25.000.000 Total Hadiah', dl: '15 Agustus 2026', status: 'Pendaftaran Buka' },
                      { title: 'National EdTech & Eco-Startup Challenge', prize: 'Rp 15.000.000 Total Hadiah', dl: '30 Agustus 2026', status: 'Pendaftaran Buka' },
                    ].map((comp, idx) => (
                      <div key={idx} className="p-5 bg-gray-50/70 border border-gray-200/80 rounded-2xl space-y-3 hover:border-[#2DB24A]/40 transition-all flex flex-col justify-between">
                        <div className="space-y-2">
                          <span className="px-2.5 py-0.5 bg-emerald-100 text-[#0F5132] font-extrabold text-[10px] rounded-md">{comp.status}</span>
                          <h4 className="text-xs font-black text-gray-900">{comp.title}</h4>
                          <p className="text-xs font-black text-[#0F5132]">🏆 {comp.prize}</p>
                          <p className="text-[10px] text-gray-400 font-medium">⏳ Deadline: {comp.dl}</p>
                        </div>
                        <button onClick={() => goeyToast.success(`Pendaftaran tim untuk "${comp.title}" dibuka!`)} className="w-full py-2 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer">
                          Daftar Tim Kompetisi
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 16: STARTUP ─────────────────────────────────────────────────── */}
            {activeSidebarNav === 'startup' && (
              <div className="space-y-6">
                <div className="p-6 bg-white border border-gray-200/80 rounded-3xl shadow-xs space-y-5">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 font-sora flex items-center gap-2">
                      <Rocket className="w-6 h-6 text-[#2DB24A]" /> Showcase Startup Anggota Pelajar
                    </h2>
                    <p className="text-xs text-gray-500 font-medium mt-1">Inovasi teknologi dan produk kreatif buatan generasi muda pengusaha.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { title: 'EduForm', desc: 'Platform Pembelajaran Interaktif Pelajar SMR/SMA', founder: 'Rian & Tim', stage: 'Pre-Seed' },
                      { title: 'GreenPack', desc: 'Kemasan Ramah Lingkungan dari Ampas Tebu', founder: 'Anisa Student', stage: 'Seed Stage' },
                      { title: 'StudyBox', desc: 'Layanan Subscription Alat Tulis & Buku Edukasi', founder: 'Fajar Youth', stage: 'Early Stage' },
                    ].map((st, idx) => (
                      <div key={idx} className="p-5 bg-gray-50/70 border border-gray-200/80 rounded-2xl space-y-3 hover:border-[#2DB24A]/40 transition-all flex flex-col justify-between">
                        <div className="space-y-2">
                          <span className="px-2 py-0.5 bg-[#E8F8EE] text-[#0F5132] font-extrabold text-[9px] rounded uppercase">{st.stage}</span>
                          <h4 className="text-xs font-black text-gray-900">{st.title}</h4>
                          <p className="text-xs text-gray-600 font-medium leading-relaxed">{st.desc}</p>
                          <p className="text-[10px] text-gray-400 font-semibold">Founder: {st.founder}</p>
                        </div>
                        <button onClick={() => goeyToast.info(`Pitch deck "${st.title}" sedang diunduh.`)} className="w-full py-2 bg-white border border-[#2DB24A] text-[#2DB24A] hover:bg-[#2DB24A] hover:text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer">
                          Lihat Pitch Deck
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 17: MERCHANT ────────────────────────────────────────────────── */}
            {activeSidebarNav === 'merchant' && (
              <div className="space-y-6">
                <div className="p-6 bg-white border border-gray-200/80 rounded-3xl shadow-xs space-y-5">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 font-sora flex items-center gap-2">
                      <Store className="w-6 h-6 text-[#2DB24A]" /> Direktori Merchant Kuliner Resmi
                    </h2>
                    <p className="text-xs text-gray-500 font-medium mt-1">Jelajahi outlet kuliner khas dan restoran unggulan anggota Asosiasi Kuliner Kreatif Jogja.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { name: 'Gudeg Yu Djum Wijilan', menu: 'Gudeg Kendil & Gudeg Kaleng Asli', address: 'Jl. Wijilan No. 167, Kraton, Yogyakarta', status: 'BUKA (06:00 - 21:00)' },
                      { name: 'Bakmi Jawa Mbah Mo', menu: 'Bakmi Godhog & Bakmi Goreng Nyemek', address: 'Code, Trirenggo, Bantul, DIY', status: 'BUKA (17:00 - 23:00)' },
                      { name: 'Sate Klatak Pak Bari', menu: 'Sate Kambing Muda Jeruji Besi', address: 'Pasar Jejeran, Imogiri Timur, Bantul', status: 'BUKA (18:00 - 24:00)' },
                      { name: 'Kopi Joss Lik Man', menu: 'Kopi Arang Arang & Nasi Kucing Joss', address: 'Jl. Pangeran Mangkubumi, Stasiun Tugu', status: 'BUKA (16:00 - 02:00)' },
                    ].map((merch, idx) => (
                      <div key={idx} className="p-5 bg-gray-50/70 border border-gray-200/80 rounded-2xl space-y-3 hover:border-[#2DB24A]/40 transition-all flex flex-col justify-between">
                        <div className="space-y-2">
                          <span className="px-2 py-0.5 bg-emerald-100 text-[#0F5132] font-extrabold text-[9px] rounded uppercase">{merch.status}</span>
                          <h4 className="text-sm font-black text-gray-900">{merch.name}</h4>
                          <p className="text-xs font-bold text-[#0F5132]">🍲 Menu Utama: {merch.menu}</p>
                          <p className="text-xs text-gray-500 font-medium">📍 {merch.address}</p>
                        </div>
                        <button onClick={() => goeyToast.success(`Detail lokasi merchant "${merch.name}" dibuka!`)} className="w-full py-2 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer">
                          Lihat Menu & Lokasi
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 18: SUPPLIER ────────────────────────────────────────────────── */}
            {activeSidebarNav === 'supplier' && (
              <div className="space-y-6">
                <div className="p-6 bg-white border border-gray-200/80 rounded-3xl shadow-xs space-y-5">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 font-sora flex items-center gap-2">
                      <Truck className="w-6 h-6 text-[#2DB24A]" /> Direktori Supplier Bahan Baku Kuliner
                    </h2>
                    <p className="text-xs text-gray-500 font-medium mt-1">Dapatkan pasokan bahan segar, bumbu rempah, dan kemasan food-grade harga grosir.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { item: 'Suplai Daging Ayam & Sapi Segar', supplier: 'UD Ayam Segar Sleman', moq: 'Min. Order 10 kg', price: 'Harga Grosir' },
                      { item: 'Sentra Box Kemasan Food Grade Custom', supplier: 'PT Kemasan Pack Jogja', moq: 'Min. Order 500 pcs', price: 'Rp 1.200 / pcs' },
                      { item: 'Distro Rempah & Bumbu Tradisional', supplier: 'Toko Rempah Merapi', moq: 'Min. Order 5 kg', price: 'Harga Pabrik' },
                    ].map((sup, idx) => (
                      <div key={idx} className="p-5 bg-gray-50/70 border border-gray-200/80 rounded-2xl space-y-3 hover:border-[#2DB24A]/40 transition-all flex flex-col justify-between">
                        <div className="space-y-2">
                          <h4 className="text-xs font-black text-gray-900">{sup.item}</h4>
                          <p className="text-[11px] text-gray-500 font-semibold">Supplier: {sup.supplier}</p>
                          <span className="text-[10px] text-gray-400 font-medium block">📦 {sup.moq}</span>
                        </div>
                        <button onClick={() => goeyToast.success(`Permintaan penawaran grosir untuk "${sup.item}" dikirim!`)} className="w-full py-2 bg-white border border-[#2DB24A] text-[#2DB24A] hover:bg-[#2DB24A] hover:text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer">
                          Minta Penawaran Grosir
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 19: PROMO ───────────────────────────────────────────────────── */}
            {activeSidebarNav === 'promo' && (
              <div className="space-y-6">
                <div className="p-6 bg-white border border-gray-200/80 rounded-3xl shadow-xs space-y-5">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 font-sora flex items-center gap-2">
                      <Tag className="w-6 h-6 text-[#2DB24A]" /> Voucher & Promo Khusus Anggota
                    </h2>
                    <p className="text-xs text-gray-500 font-medium mt-1">Gunakan voucher promo eksklusif untuk menikmati kuliner anggota dengan harga hemat.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { title: 'Diskon 20% Gudeg Kendil Wijilan', code: 'GUDEG20', valid: '31 Agu 2026' },
                      { title: 'Buy 1 Get 1 Kopi Joss Lik Man', code: 'KOPIJOSS', valid: '15 Agu 2026' },
                      { title: 'Cashback Rp 15.000 Sate Klatak', code: 'KLATAK15', valid: '31 Agu 2026' },
                    ].map((pr, idx) => (
                      <div key={idx} className="p-5 bg-gradient-to-br from-[#E8F8EE] to-emerald-50 border border-[#2DB24A]/30 rounded-2xl space-y-3 text-center flex flex-col justify-between">
                        <div className="space-y-2">
                          <h4 className="text-xs font-black text-[#0F5132]">{pr.title}</h4>
                          <div className="px-3 py-1 bg-white border border-dashed border-[#2DB24A] rounded-lg inline-block font-mono text-xs font-bold text-emerald-800">
                            {pr.code}
                          </div>
                          <p className="text-[10px] text-gray-500 font-medium block">Berlaku s/d {pr.valid}</p>
                        </div>
                        <button onClick={() => goeyToast.success(`Voucher "${pr.code}" berhasil diklaim!`)} className="w-full py-2 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer">
                          Klaim Voucher
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 20: SIMPANAN KOPERASI ───────────────────────────────────────── */}
            {activeSidebarNav === 'simpanan' && (
              <div className="space-y-6">
                {!isCanManageCoop ? (
                // --- MEMBER (ANGGOTA) VIEW ---
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h2 className="text-xl font-black text-gray-900 font-sora">Simpanan Saya</h2>
                      <p className="text-xs text-gray-500 font-medium mt-1">Pantau dan kelola saldo simpanan pribadi Anda di Koperasi {community.name}</p>
                    </div>
                    <button onClick={() => handleOpenPaySavings({ name: 'Simpanan Koperasi', amount: 50000, type: 'WAJIB' })} className="px-4 py-2.5 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer shrink-0">
                      <Wallet className="w-4 h-4" /> Setor Simpanan Mandiri
                    </button>
                  </div>

                  {/* Personal Savings Grid */}
                  {(() => {
                    const mBalance = communitySavingsSummary?.memberBalances?.[user?.id] || { pokok: 0, wajib: 0, sukarela: 0, total: 0 };
                    const reqPokok = community?.simpananPokok || 100000;
                    const reqWajib = community?.simpananWajib || 25000;
                    const isPokokLunas = mBalance.pokok >= reqPokok;
                    const wajibMonths = reqWajib > 0 ? Math.floor(mBalance.wajib / reqWajib) : 0;

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-5 bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-2xl space-y-3 relative overflow-hidden shadow-xs">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <User className="w-4.5 h-4.5 text-[#2DB24A]" />
                          </div>
                          <div>
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Simpanan Pokok</h4>
                            <span className="text-lg font-black text-gray-950 block mt-1">
                              Rp {mBalance.pokok.toLocaleString('id-ID')}
                            </span>
                            <span className={`px-2 py-0.5 text-[8px] font-black rounded uppercase tracking-wider mt-2 inline-block ${
                              isPokokLunas ? 'bg-emerald-100 text-[#0F5132]' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {isPokokLunas ? '✓ Sudah Lunas' : 'Belum Lunas'}
                            </span>
                          </div>
                        </div>

                        <div className="p-5 bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-2xl space-y-3 relative overflow-hidden shadow-xs">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <Calendar className="w-4.5 h-4.5 text-[#2DB24A]" />
                          </div>
                          <div>
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Simpanan Wajib</h4>
                            <span className="text-lg font-black text-gray-950 block mt-1">
                              Rp {mBalance.wajib.toLocaleString('id-ID')}
                            </span>
                            <span className="text-[9px] text-gray-500 font-semibold block mt-2">
                              Terbayar {wajibMonths} Bulan • Rp {reqWajib.toLocaleString('id-ID')} / bln
                            </span>
                          </div>
                        </div>

                        <div className="p-5 bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-2xl space-y-3 relative overflow-hidden shadow-xs">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <PiggyBank className="w-4.5 h-4.5 text-[#2DB24A]" />
                          </div>
                          <div>
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Simpanan Sukarela</h4>
                            <span className="text-lg font-black text-gray-950 block mt-1">
                              Rp {mBalance.sukarela.toLocaleString('id-ID')}
                            </span>
                            <span className="text-[9px] text-gray-500 font-semibold block mt-2">
                              Dapat ditarik atau disetor kapan saja
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Jenis Simpanan Aktif Koperasi (untuk disetor) */}
                  <div className="bg-white border border-gray-200/80 rounded-3xl p-6 space-y-4 shadow-xs">
                    <h3 className="text-sm font-black text-gray-900 font-sora">Setor Produk Simpanan Koperasi</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {coopProducts.map((p: any, idx: number) => {
                        const badge = p.type === 'POKOK' ? 'Pokok' : p.type === 'WAJIB' ? 'Bulanan' : p.type === 'SUKARELA' ? 'Sukarela' : p.type === 'UMROH' ? 'Umroh' : p.type === 'QURBAN' ? 'Qurban' : 'Lain-lain'
                        const priceText = p.type === 'SUKARELA' ? 'Bebas Nominal' : `Rp ${Number(p.amount || 0).toLocaleString('id-ID')}${p.periodText ? ` / ${p.periodText}` : ''}`
                        
                        return (
                          <div key={p.id || idx} className="p-4 bg-gray-50/70 border border-gray-200/80 rounded-2xl space-y-3 flex flex-col justify-between hover:border-[#2DB24A]/40 transition-all">
                            <div className="space-y-1">
                              <div className="flex justify-between items-start">
                                <span className="px-2 py-0.5 bg-[#E8F8EE] text-[#0F5132] font-extrabold text-[9px] rounded uppercase">{badge}</span>
                              </div>
                              <h4 className="text-xs font-black text-gray-900">{p.name}</h4>
                              <p className="text-[10px] text-gray-500 font-medium">{p.description || '-'}</p>
                              <span className="text-sm font-black text-[#0F5132] block">{priceText}</span>
                            </div>
                            <button onClick={() => handleOpenPaySavings({ name: p.name, amount: p.amount || 50000, type: p.type })} className="w-full py-2 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer">
                              Setor {p.name}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Riwayat Simpanan Saya */}
                  <div className="bg-white border border-gray-200/80 rounded-3xl p-6 space-y-4 shadow-xs">
                    <h4 className="text-sm font-black text-gray-900 font-sora">Riwayat Transaksi Saya</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            <th className="py-2 px-2">Tanggal</th>
                            <th className="py-2 px-2">Jenis Simpanan</th>
                            <th className="py-2 px-2">Nominal</th>
                            <th className="py-2 px-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-xs font-medium text-gray-700">
                          {communitySavingsSummary?.transactions && communitySavingsSummary.transactions.filter((t: any) => t.userId === user?.id).length > 0 ? (
                            communitySavingsSummary.transactions
                              .filter((t: any) => t.userId === user?.id)
                              .map((tx: any, idx: number) => {
                                const formattedDate = new Date(tx.date).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                }) + ', ' + new Date(tx.date).toLocaleTimeString('id-ID', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                                const isSetor = tx.transactionType === 'SETOR'
                                return (
                                  <tr key={tx.id || idx} className="hover:bg-gray-50/30 transition-colors">
                                    <td className="py-3 px-2 text-gray-500 font-semibold">{formattedDate}</td>
                                    <td className="py-3 px-2 text-gray-600 font-bold">Simpanan {tx.type === 'POKOK' ? 'Pokok' : tx.type === 'WAJIB' ? 'Wajib' : 'Sukarela'}</td>
                                    <td className={`py-3 px-2 font-black ${isSetor ? 'text-[#0F5132]' : 'text-red-600'}`}>
                                      {isSetor ? '+' : '-'} Rp {tx.amount.toLocaleString('id-ID')}
                                    </td>
                                    <td className="py-3 px-2">
                                      <span className="px-2 py-0.5 bg-emerald-50 text-[#0F5132] font-black text-[9px] rounded-md uppercase font-mono">✓ Berhasil</span>
                                    </td>
                                  </tr>
                                )
                              })
                          ) : (
                            <tr>
                              <td colSpan={4} className="py-8 text-center text-gray-400 font-medium">
                                Belum ada riwayat transaksi simpanan.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                // --- ADMIN (PENGURUS) VIEW ---
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h2 className="text-xl font-black text-gray-900 font-sora">Simpanan</h2>
                      <p className="text-xs text-gray-500 font-medium mt-1">Kelola seluruh jenis simpanan anggota koperasi {community.name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {coopTier !== 'BASIC' && isCanManageCoop && (
                        <button
                          onClick={() => handleOpenCreateProduct(false)}
                          className="px-4 py-2.5 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                        >
                          <Plus className="w-4 h-4" /> Tambah Simpanan Baru
                        </button>
                      )}
                      <button onClick={() => handleOpenPaySavings({ name: 'Simpanan Koperasi', amount: 50000, type: 'WAJIB' })} className="px-4 py-2.5 bg-white border border-[#2DB24A] hover:bg-[#E8F8EE] text-[#2DB24A] font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer shrink-0">
                        <Wallet className="w-4 h-4" /> Setor Simpanan
                      </button>
                    </div>
                  </div>

                  {/* Alert Box */}
                  <div className="p-4 bg-[#E8F8EE]/75 border border-[#2DB24A]/25 rounded-2xl flex items-start justify-between gap-3 shadow-xs">
                    <div className="flex gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                        <Shield className="w-5 h-5 text-[#2DB24A]" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-[#0F5132] text-xs">Kelola simpanan dengan mudah</h4>
                        <p className="text-[10px] text-emerald-800/80 font-medium mt-0.5 leading-relaxed">
                          Pantau, tambah, dan kelola semua jenis simpanan anggota koperasi Anda dalam satu tempat.
                        </p>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column (Main cards + transactions) */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="bg-white border border-gray-200/80 rounded-3xl p-6 space-y-5 shadow-xs">
                        <h3 className="text-sm font-black text-gray-900 font-sora">Jenis Simpanan Anda</h3>

                        <div className="space-y-4">
                          {/* Simpanan Pokok Card */}
                          {coopProducts.filter((p: any) => p.type === 'POKOK').map((p: any) => (
                            <div key={p.id} className="p-4 bg-white border border-gray-200/80 rounded-2xl flex items-center justify-between hover:border-emerald-500/20 hover:shadow-xs transition-all gap-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#2DB24A] flex items-center justify-center shrink-0">
                                  <User className="w-5 h-5" />
                                </div>
                                <div>
                                  <h4 className="text-xs font-black text-gray-900">{p.name}</h4>
                                  <p className="text-[10px] text-gray-500 font-medium mt-0.5">Simpanan wajib yang dibayarkan sekali saat menjadi anggota koperasi.</p>
                                  <span className="text-[10px] font-black text-[#0F5132] block mt-1">Rp {Number(p.amount || 0).toLocaleString('id-ID')} / Sekali Bayar</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2.5">
                                <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-[#0F5132] text-[9px] font-black rounded-md shrink-0">✓ Aktif</span>
                                {isCanManageCoop && (
                                  <button onClick={() => handleOpenEditProduct(p)} className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold text-[10px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0">
                                    Kelola <ChevronRight className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}

                          {/* Simpanan Wajib Card */}
                          {coopProducts.filter((p: any) => p.type === 'WAJIB').map((p: any) => (
                            <div key={p.id} className="p-4 bg-white border border-gray-200/80 rounded-2xl flex items-center justify-between hover:border-emerald-500/20 hover:shadow-xs transition-all gap-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#2DB24A] flex items-center justify-center shrink-0">
                                  <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                  <h4 className="text-xs font-black text-gray-900">{p.name}</h4>
                                  <p className="text-[10px] text-gray-500 font-medium mt-0.5">Simpanan rutin yang dibayarkan setiap bulan oleh anggota.</p>
                                  <span className="text-[10px] font-black text-[#0F5132] block mt-1">Rp {Number(p.amount || 0).toLocaleString('id-ID')} / Bulan</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2.5">
                                <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-[#0F5132] text-[9px] font-black rounded-md shrink-0">✓ Aktif</span>
                                {isCanManageCoop && (
                                  <button onClick={() => handleOpenEditProduct(p)} className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold text-[10px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0">
                                    Kelola <ChevronRight className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}

                          {/* Tambah Jenis Simpanan Card (Premium/Locked/Unlocked depending on tier) */}
                          {coopTier === 'BASIC' ? (
                            // Locked card for BASIC
                            <div className="p-5 bg-purple-50/20 border border-purple-100 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
                              <div className="absolute top-3 right-3 text-purple-400">
                                <Lock className="w-4 h-4 opacity-50" />
                              </div>
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                                  <PiggyBank className="w-5 h-5" />
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="text-xs font-black text-gray-900">Tambah Jenis Simpanan</h4>
                                    <span className="px-1.5 py-0.5 bg-purple-100 text-purple-600 text-[8px] font-black rounded uppercase tracking-wider">PREMIUM</span>
                                  </div>
                                  <p className="text-[10px] text-gray-500 font-medium">Buat jenis simpanan lain seperti Simpanan Sukarela, Pendidikan, Qurban, Hari Raya, dan lainnya.</p>
                                  
                                  <div className="bg-white border border-purple-100/50 rounded-xl p-3 mt-3 space-y-1.5 max-w-sm">
                                    <h5 className="text-[9px] font-black text-purple-950 uppercase tracking-wider">Keuntungan Fitur Ini:</h5>
                                    <ul className="space-y-1 text-[9px] font-bold text-purple-900">
                                      <li className="flex items-center gap-1.5">✓ Buat berbagai jenis simpanan sesuai kebutuhan</li>
                                      <li className="flex items-center gap-1.5">✓ Tingkatkan kebiasaan menabung anggota</li>
                                      <li className="flex items-center gap-1.5">✓ Kelola target dan periode simpanan lebih fleksibel</li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1.5 justify-center mt-2 md:mt-0 shrink-0">
                                <span className="text-[9px] text-purple-600 font-extrabold uppercase">Tersedia di Paket</span>
                                <span className="text-xs font-black text-purple-800">PLUS</span>
                                <button onClick={() => handleUpgradeTier('PLUS')} className="px-4 py-2 bg-white hover:bg-purple-50 border border-purple-300 text-purple-700 font-extrabold text-[10px] rounded-xl transition-all shadow-xs flex items-center gap-1 cursor-pointer">
                                  <ArrowUpCircle className="w-3.5 h-3.5" /> Upgrade ke Plus
                                </button>
                              </div>
                            </div>
                          ) : (
                            // Unlocked card for PLUS / PRO
                            <>
                              {coopProducts.filter((p: any) => p.type !== 'POKOK' && p.type !== 'WAJIB').map((p: any) => {
                                const badge = p.type === 'SUKARELA' ? 'Sukarela' : p.type === 'UMROH' ? 'Umroh' : p.type === 'QURBAN' ? 'Qurban' : 'Lain-lain'
                                const priceText = p.type === 'SUKARELA' ? 'Bebas Nominal' : `Rp ${Number(p.amount || 0).toLocaleString('id-ID')}${p.periodText ? ` / ${p.periodText}` : ''}`
                                return (
                                  <div key={p.id} className="p-4 bg-white border border-gray-200/80 rounded-2xl flex items-center justify-between hover:border-emerald-500/20 hover:shadow-xs transition-all gap-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                                        <Sparkles className="w-5 h-5" />
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <h4 className="text-xs font-black text-gray-900">{p.name}</h4>
                                          <span className="px-1.5 py-0.5 bg-purple-50 text-purple-600 text-[8px] font-black rounded uppercase tracking-wider">{badge}</span>
                                        </div>
                                        <p className="text-[10px] text-gray-500 font-medium mt-0.5">{p.description || '-'}</p>
                                        <span className="text-[10px] font-black text-purple-700 block mt-1">{priceText}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      {isCanManageCoop && (
                                        <div className="flex items-center gap-1.5 mr-2">
                                          <button onClick={() => handleOpenEditProduct(p)} className="text-[10px] text-gray-500 hover:text-emerald-600 font-bold cursor-pointer">Edit</button>
                                          <span className="text-gray-200 text-[10px]">|</span>
                                          <button onClick={() => handleDeleteProduct(p.id)} className="text-[10px] text-gray-500 hover:text-red-500 font-bold cursor-pointer">Hapus</button>
                                        </div>
                                      )}
                                      <button onClick={() => handleOpenPaySavings({ name: p.name, amount: p.amount || 50000, type: p.type })} className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] rounded-lg transition-colors cursor-pointer">
                                        Setor
                                      </button>
                                    </div>
                                  </div>
                                )
                              })}

                              {isCanManageCoop && (
                                <button
                                  onClick={() => handleOpenCreateProduct(false)}
                                  className="w-full py-4 border-2 border-dashed border-purple-200 hover:border-purple-400 bg-purple-50/5 text-purple-600 hover:bg-purple-50/20 font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                                >
                                  <Plus className="w-4 h-4" /> Tambah Jenis Simpanan Baru
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Butuh bantuan? */}
                      <div className="p-4 bg-emerald-50/20 border border-emerald-100/50 rounded-2xl flex flex-wrap justify-between items-center gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <HelpCircle className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-gray-900">Butuh bantuan?</h4>
                            <p className="text-[10px] text-gray-500 font-medium">Tim kami siap membantu Anda mengelola simpanan koperasi dengan lebih baik.</p>
                          </div>
                        </div>
                        <button onClick={() => goeyToast.info('Layanan pelanggan Saloka dihubungi!')} className="px-4 py-2 bg-white border border-gray-200 hover:border-[#2DB24A] text-gray-700 hover:text-[#2DB24A] font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer">
                          <Headphones className="w-4 h-4" /> Hubungi Tim Saloka
                        </button>
                      </div>

                      {/* Transaksi Terakhir */}
                      <div className="bg-white border border-gray-200/80 rounded-3xl p-6 space-y-4 shadow-xs">
                        <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                          <h4 className="text-sm font-black text-gray-900 font-sora">Transaksi Terakhir</h4>
                          <button onClick={() => goeyToast.info('Membuka riwayat lengkap transaksi simpanan...')} className="text-xs font-extrabold text-emerald-600 hover:text-emerald-700">Lihat Semua</button>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                <th className="py-2 px-2">Tanggal</th>
                                <th className="py-2 px-2">Anggota</th>
                                <th className="py-2 px-2">Jenis Simpanan</th>
                                <th className="py-2 px-2">Nominal</th>
                                <th className="py-2 px-2">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-xs font-medium text-gray-700">
                              {[
                                { date: '2 Mei 2026, 10:30', name: 'Ahmad Rizki', type: 'Simpanan Wajib', amount: 100000, status: 'Berhasil' },
                                { date: '1 Mei 2026, 14:15', name: 'Siti Aminah', type: 'Simpanan Pokok', amount: 150000, status: 'Berhasil' },
                                { date: '28 Apr 2026, 09:00', name: 'Budi Santoso', type: 'Simpanan Wajib', amount: 100000, status: 'Berhasil' },
                              ].map((tx, i) => (
                                <tr key={i} className="hover:bg-gray-50/30 transition-colors">
                                  <td className="py-3 px-2 text-gray-500 font-semibold">{tx.date}</td>
                                  <td className="py-3 px-2 font-black text-gray-900">{tx.name}</td>
                                  <td className="py-3 px-2 text-gray-600 font-bold">{tx.type}</td>
                                  <td className="py-3 px-2 font-black text-[#0F5132]">Rp {tx.amount.toLocaleString('id-ID')}</td>
                                  <td className="py-3 px-2">
                                    <span className="px-2 py-0.5 bg-emerald-50 text-[#0F5132] font-black text-[9px] rounded-md uppercase">✓ {tx.status}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Right Column (Sidebar packages) */}
                    <div className="space-y-6">
                      {/* Tingkatkan Paket Anda */}
                      {coopTier !== 'PRO' && (
                        <div className="bg-white border border-gray-200/80 rounded-3xl p-5 shadow-xs space-y-4">
                          <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">Tingkatkan Paket Anda</h4>
                          <div className="p-4 bg-gradient-to-br from-amber-50/50 to-orange-50/50 border border-amber-100 rounded-2xl space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-xs shrink-0">
                                <Crown className="w-5 h-5" />
                              </div>
                              <div>
                                <h5 className="font-black text-xs text-gray-900">Upgrade ke {coopTier === 'BASIC' ? 'Plus' : 'Pro'}</h5>
                                <p className="text-[9px] text-gray-500 font-medium">dan nikmati fitur lengkap untuk mengelola simpanan dengan lebih fleksibel.</p>
                              </div>
                            </div>

                            <ul className="space-y-2 border-t border-amber-100 pt-3">
                              {coopTier === 'BASIC' ? (
                                <>
                                  <li className="flex items-center gap-2 text-[10px] font-bold text-gray-700">✓ Tambah jenis simpanan</li>
                                  <li className="flex items-center gap-2 text-[10px] font-bold text-gray-700">✓ Kelola target simpanan</li>
                                  <li className="flex items-center gap-2 text-[10px] font-bold text-gray-700">✓ Laporan simpanan detail</li>
                                  <li className="flex items-center gap-2 text-[10px] font-bold text-gray-700">✓ Export data simpanan</li>
                                </>
                              ) : (
                                <>
                                  <li className="flex items-center gap-2 text-[10px] font-bold text-gray-700">✓ Portal permodalan merchant</li>
                                  <li className="flex items-center gap-2 text-[10px] font-bold text-gray-700">✓ Pendanaan proyek anggota</li>
                                  <li className="flex items-center gap-2 text-[10px] font-bold text-gray-700">✓ Perhitungan SHU otomatis</li>
                                  <li className="flex items-center gap-2 text-[10px] font-bold text-gray-700">✓ Multi-rekening & target dinamis</li>
                                </>
                              )}
                            </ul>

                            <button 
                              onClick={() => handleUpgradeTier(coopTier === 'BASIC' ? 'PLUS' : 'PRO')}
                              className="w-full py-2.5 bg-[#FF9800] hover:bg-[#F57C00] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <ArrowUpCircle className="w-4 h-4" /> Upgrade ke {coopTier === 'BASIC' ? 'Plus' : 'Pro'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Paket Anda Saat Ini */}
                      <div className="bg-white border border-gray-200/80 rounded-3xl p-5 shadow-xs space-y-4">
                        <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Paket Anda Saat Ini</h4>
                          <span className={`px-2 py-0.5 text-[9px] font-black rounded uppercase tracking-wider ${
                            coopTier === 'PRO'
                              ? 'bg-purple-100 text-purple-600 font-bold'
                              : coopTier === 'PLUS'
                                ? 'bg-blue-100 text-blue-600 font-bold'
                                : 'bg-emerald-100 text-[#0f5132] font-bold'
                          }`}>
                            {coopTier}
                          </span>
                        </div>

                        <ul className="space-y-2.5 text-[11px] font-semibold text-gray-700">
                          <li className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-emerald-600">✓ Simpanan Pokok</span>
                          </li>
                          <li className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-emerald-600">✓ Simpanan Wajib</span>
                          </li>
                          <li className="flex items-center justify-between">
                            {coopTier !== 'BASIC' ? (
                              <span className="flex items-center gap-2 text-emerald-600">✓ Tambah Jenis Simpanan</span>
                            ) : (
                              <span className="flex items-center gap-2 text-gray-400">🔒 Tambah Jenis Simpanan</span>
                            )}
                          </li>
                          <li className="flex items-center justify-between">
                            {coopTier === 'PRO' ? (
                              <span className="flex items-center gap-2 text-emerald-600">✓ Pendanaan Merchant</span>
                            ) : (
                              <span className="flex items-center gap-2 text-gray-400">🔒 Pendanaan Merchant</span>
                            )}
                          </li>
                        </ul>

                        <button onClick={() => goeyToast.info('Detail perbandingan fitur paket langganan dibuka.')} className="w-full py-2 bg-white border border-gray-200 hover:border-emerald-600 text-gray-600 hover:text-emerald-700 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                          Lihat Perbandingan Paket <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

            {/* TAB 21: PENDANAAN KOPERASI ──────────────────────────────────────── */}
            {activeSidebarNav === 'pendanaan' && (
              <div className="space-y-6">
                {coopTier !== 'PRO' ? (
                  !isCanManageCoop ? (
                  // Locked screen for regular members (no upgrade button)
                  <div className="p-6 bg-white border border-gray-200/80 rounded-3xl shadow-xs space-y-6 text-center max-w-2xl mx-auto py-12">
                    <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                      <Lock className="w-8 h-8 text-[#2DB24A]" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-xl font-black text-gray-900 font-sora">Fitur Pendanaan Belum Aktif</h2>
                      <p className="text-xs text-gray-500 font-medium max-w-md mx-auto leading-relaxed">
                        Fasilitas pinjaman permodalan usaha koperasi belum diaktifkan oleh pengurus Koperasi {community.name}. Silakan hubungi pengurus untuk informasi lebih lanjut.
                      </p>
                    </div>
                  </div>
                ) : (
                  // Locked screen for Admin (includes upgrade button)
                  <div className="p-6 bg-white border border-gray-200/80 rounded-3xl shadow-xs space-y-6 text-center max-w-2xl mx-auto py-12">
                    <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto shadow-sm">
                      <Lock className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                      <span className="px-2.5 py-1 bg-purple-100 text-purple-600 text-[10px] font-black rounded-full uppercase tracking-wider">FITUR PREMIUM PRO</span>
                      <h2 className="text-xl font-black text-gray-900 font-sora">Pendanaan Merchant Terkunci</h2>
                      <p className="text-xs text-gray-500 font-medium max-w-md mx-auto leading-relaxed">
                        Fitur pendanaan merchant (Pinjaman Permodalan Usaha Koperasi) hanya tersedia bagi komunitas dengan tingkat langganan Koperasi Pro.
                      </p>
                    </div>
                    <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-5 text-left max-w-md mx-auto space-y-3">
                      <h4 className="text-xs font-bold text-purple-950 uppercase tracking-wider font-sora">Keuntungan Paket Pro:</h4>
                      <ul className="space-y-2 text-[11px] font-bold text-purple-900">
                        <li className="flex items-center gap-2">✓ Seluruh fitur Simpanan (Pokok, Wajib, Sukarela, dll)</li>
                        <li className="flex items-center gap-2">✓ Penambahan jenis simpanan tanpa batas</li>
                        <li className="flex items-center gap-2">✓ Portal Permodalan & Pendanaan Merchant</li>
                        <li className="flex items-center gap-2">✓ Kalkulator SHU & Laporan Keuangan RAT otomatis</li>
                      </ul>
                    </div>
                    <button 
                      onClick={() => handleUpgradeTier('PRO')}
                      className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
                    >
                      <ArrowUpCircle className="w-4 h-4" /> Upgrade ke Koperasi Pro sekarang
                    </button>
                  </div>
                )
              ) : (
                // Normal view
                <div className="space-y-6">
                  <div className="p-6 bg-white border border-gray-200/80 rounded-3xl shadow-xs space-y-5">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4">
                      <div>
                        <h2 className="text-xl font-black text-gray-900 font-sora flex items-center gap-2">
                          <Landmark className="w-6 h-6 text-[#2DB24A]" /> Portal Permodalan Usaha Koperasi
                        </h2>
                        <p className="text-xs text-gray-500 font-medium mt-1">Fasilitas pinjaman permodalan modal kerja & pengadaan alat produksi bunga ringan.</p>
                      </div>
                      <button onClick={() => setLoanModalOpen(true)} className="px-4 py-2.5 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer shrink-0">
                        <Plus className="w-4 h-4" /> Ajukan Pinjaman Permodalan
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { title: 'Pinjaman Modal Kerja Pembelian Bahan Baku', ceiling: 'Plafon s/d Rp 25.000.000', rate: 'Bunga 0,8% / bulan', tenor: 'Tenor 3 - 12 Bulan' },
                        { title: 'Pinjaman Pengadaan Mesin & Alat Produksi', ceiling: 'Plafon s/d Rp 50.000.000', rate: 'Bunga 0,9% / bulan', tenor: 'Tenor 6 - 24 Bulan' },
                      ].map((fund, idx) => (
                        <div key={idx} className="p-5 bg-gray-50/70 border border-gray-200/80 rounded-2xl space-y-3 hover:border-[#2DB24A]/40 transition-all flex flex-col justify-between">
                          <div className="space-y-2">
                            <h4 className="text-xs font-black text-gray-900">{fund.title}</h4>
                            <span className="text-sm font-black text-[#0F5132] block">{fund.ceiling}</span>
                            <p className="text-[10px] text-gray-500 font-semibold">{fund.rate} • {fund.tenor}</p>
                          </div>
                          <button onClick={() => setLoanModalOpen(true)} className="w-full py-2 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer">
                            Ajukan Permodalan
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

            {/* TAB 22: SHU KOPERASI ────────────────────────────────────────────── */}
            {activeSidebarNav === 'shu' && (
              <div className="space-y-6">
                <div className="p-6 bg-white border border-gray-200/80 rounded-3xl shadow-xs space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4">
                    <div>
                      <h2 className="text-xl font-black text-gray-900 font-sora flex items-center gap-2">
                        <PieChart className="w-6 h-6 text-[#2DB24A]" /> Kalkulator &amp; Laporan Bagi Hasil SHU
                      </h2>
                      <p className="text-xs text-gray-500 font-medium mt-1">
                        Perhitungan otomatis Sisa Hasil Usaha (SHU) Koperasi berdasarkan laba bersih, simpanan, dan keaktifan transaksi anggota.
                      </p>
                    </div>
                  </div>

                  {/* ADMIN VIEW TABS SWITCHER */}
                  {isCanManageCoop && (
                    <div className="flex gap-2 border-b border-gray-100 pb-1">
                      <button
                        type="button"
                        onClick={() => setShuTab('preview')}
                        className={`px-4 py-2 text-xs font-black font-sora rounded-t-2xl transition-all cursor-pointer border-b-2 outline-none ${
                          shuTab === 'preview'
                            ? 'border-[#2DB24A] text-[#2DB24A]'
                            : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        📊 Simulasi &amp; Live Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => setShuTab('final')}
                        className={`px-4 py-2 text-xs font-black font-sora rounded-t-2xl transition-all cursor-pointer border-b-2 outline-none ${
                          shuTab === 'final'
                            ? 'border-[#2DB24A] text-[#2DB24A]'
                            : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        🔒 Hasil SHU Final Disimpan
                      </button>
                    </div>
                  )}

                  {/* ADMIN VIEW: PREVIEW TAB */}
                  {isCanManageCoop && shuTab === 'preview' && (
                    <div className="space-y-6">
                      {/* ADMIN CONFIGURATION PANEL — only Jasa Modal & Jasa Usaha */}
                      <form onSubmit={handleCalculateAndSaveShu} className="p-6 bg-gray-50/80 border border-gray-200/80 rounded-3xl space-y-5">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-gray-200/60 pb-3">
                          <div>
                            <h3 className="text-sm font-black text-gray-900 font-sora flex items-center gap-2">
                              <Sliders className="w-4 h-4 text-[#2DB24A]" /> Pengaturan Alokasi Persentase SHU (RAT)
                            </h3>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">
                              Atur total laba bersih, lalu persentase Jasa Modal &amp; Jasa Usaha. Bagian per anggota dihitung otomatis.
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`px-3 py-1 rounded text-xs font-bold font-mono ${
                              (shuPctJasaModal >= 0 && shuPctJasaModal <= 100 && shuPctJasaUsaha >= 0 && shuPctJasaUsaha <= 100)
                                ? 'bg-green-100 text-green-800 border border-green-300'
                                : 'bg-red-100 text-red-800 border border-red-300'
                            }`}>
                              {(shuPctJasaModal >= 0 && shuPctJasaModal <= 100 && shuPctJasaUsaha >= 0 && shuPctJasaUsaha <= 100)
                                ? `✓ Persentase Valid (0-100%)`
                                : `⚠️ Nilai harus di antara 0% s/d 100%`
                              }
                            </div>
                            <button
                              type="submit"
                              disabled={isCalculatingShu || !(shuPctJasaModal >= 0 && shuPctJasaModal <= 100 && shuPctJasaUsaha >= 0 && shuPctJasaUsaha <= 100)}
                              className="px-5 py-2.5 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center gap-2 shrink-0 disabled:opacity-50"
                            >
                              {isCalculatingShu ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Hitung & Simpan SHU Otomatis'}
                            </button>
                          </div>
                        </div>

                        {/* Laba Bersih Input */}
                        <div className="max-w-md">
                          <label className="block text-xs font-black text-gray-800 uppercase tracking-wider mb-1">
                            Total Laba Bersih Koperasi (SHU Bersih Rp) *
                          </label>
                          <input
                            type="number"
                            required
                            min="0"
                            value={shuNetProfit}
                            onChange={e => setShuNetProfit(e.target.value)}
                            className="w-full px-4 py-2.5 text-base font-mono font-black text-gray-900 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2DB24A] outline-none"
                            placeholder="0"
                          />
                          <span className="text-[10px] text-gray-400 font-semibold mt-1 block">
                            Nominal bersih: Rp {Number(shuNetProfit || 0).toLocaleString('id-ID')}
                          </span>
                        </div>

                        {/* Percentages — hanya Jasa Modal & Jasa Usaha */}
                        <div className="grid grid-cols-2 gap-4 pt-1">
                          <div className="p-4 bg-white border border-amber-200 rounded-2xl space-y-1.5">
                            <label className="block text-[10px] font-black text-amber-800 uppercase tracking-wider">
                              % Jasa Modal
                            </label>
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max="100"
                              value={shuPctJasaModal}
                              onChange={e => setShuPctJasaModal(Number(e.target.value))}
                              className="w-full px-3 py-2 text-sm font-bold border rounded-xl border-amber-200 focus:ring-2 focus:ring-amber-300 outline-none"
                            />
                            <span className="text-[9px] text-amber-700 font-black block">
                              Pool: Rp {(Number(shuNetProfit || 0) * shuPctJasaModal / 100).toLocaleString('id-ID')}
                            </span>
                            <p className="text-[9px] text-gray-400 font-medium leading-tight">
                              Dibagikan proporsional simpanan anggota
                            </p>
                          </div>

                          <div className="p-4 bg-white border border-blue-200 rounded-2xl space-y-1.5">
                            <label className="block text-[10px] font-black text-blue-800 uppercase tracking-wider">
                              % Jasa Usaha
                            </label>
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              max="100"
                              value={shuPctJasaUsaha}
                              onChange={e => setShuPctJasaUsaha(Number(e.target.value))}
                              className="w-full px-3 py-2 text-sm font-bold border rounded-xl border-blue-200 focus:ring-2 focus:ring-blue-300 outline-none"
                            />
                            <span className="text-[9px] text-blue-700 font-black block">
                              Pool: Rp {(Number(shuNetProfit || 0) * shuPctJasaUsaha / 100).toLocaleString('id-ID')}
                            </span>
                            <p className="text-[9px] text-gray-400 font-medium leading-tight">
                              Dibagikan proporsional keaktifan transaksi anggota
                            </p>
                          </div>
                        </div>
                      </form>

                      {/* ── BARIS 1: SHU Bersih, Total Tabungan, Total Transaksi ── */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-5 bg-gradient-to-br from-emerald-800 to-emerald-950 text-white rounded-3xl space-y-2 shadow-md">
                          <span className="text-[10px] font-black text-emerald-300 uppercase tracking-wider">SHU Bersih Koperasi (Preview)</span>
                          <span className="text-xl font-black block font-sora">
                            Rp {Number(shuNetProfit || 0).toLocaleString('id-ID')}
                          </span>
                          <p className="text-[10px] text-emerald-200/80 font-medium">Total laba bersih koperasi tahun berjalan</p>
                        </div>

                        <div className="p-5 bg-white border border-gray-200/80 rounded-3xl space-y-2 shadow-xs">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Total Tabungan Koperasi</span>
                          <span className="text-xl font-black text-gray-900 block font-sora">
                            Rp {Number(communitySavingsSummary?.totalSavingsCommunity || 0).toLocaleString('id-ID')}
                          </span>
                          <p className="text-[10px] text-gray-500 font-medium">Akumulasi simpanan seluruh anggota</p>
                        </div>

                        <div className="p-5 bg-white border border-gray-200/80 rounded-3xl space-y-2 shadow-xs">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Total Transaksi Koperasi</span>
                          <span className="text-xl font-black text-gray-900 block font-sora">
                            Rp {Number(communitySavingsSummary?.totalTransaksiCommunity || 0).toLocaleString('id-ID')}
                          </span>
                          <p className="text-[10px] text-gray-500 font-medium">Total transaksi belanja seluruh anggota</p>
                        </div>
                      </div>

                      {/* ── BARIS 2: Jasa Modal, Jasa Usaha ── */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-5 bg-gradient-to-br from-amber-50 to-white border border-amber-200 rounded-3xl space-y-2 shadow-xs">
                          <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider">Pool Jasa Modal ({shuPctJasaModal}%)</span>
                          <span className="text-xl font-black text-gray-900 block font-sora">
                            Rp {(Number(shuNetProfit || 0) * shuPctJasaModal / 100).toLocaleString('id-ID')}
                          </span>
                          <p className="text-[10px] text-gray-500 font-medium">
                            Rumus: (Simpanan Anggota / Total Tabungan Koperasi) × Pool ini
                          </p>
                        </div>

                        <div className="p-5 bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-3xl space-y-2 shadow-xs">
                          <span className="text-[10px] font-black text-blue-800 uppercase tracking-wider">Pool Jasa Usaha ({shuPctJasaUsaha}%)</span>
                          <span className="text-xl font-black text-gray-900 block font-sora">
                            Rp {(Number(shuNetProfit || 0) * shuPctJasaUsaha / 100).toLocaleString('id-ID')}
                          </span>
                          <p className="text-[10px] text-gray-500 font-medium">
                            Rumus: (Transaksi Anggota / Total Transaksi Koperasi) × Pool ini
                          </p>
                        </div>
                      </div>

                      {/* Admin View: Full Member Distribution Table */}
                      <div className="bg-white border border-gray-200/80 rounded-3xl p-6 space-y-4 shadow-xs">
                        <div className="border-b border-gray-100 pb-3">
                          <h3 className="text-sm font-black text-gray-900 font-sora">Rincian Preview Pembagian SHU Anggota</h3>
                          <p className="text-xs text-gray-500 font-medium mt-0.5">
                            Menampilkan simulasi hasil realtime berdasarkan transaksi database terbaru. Belum disimpan/dibagikan secara resmi.
                          </p>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                <th className="py-3 px-3">Nama Anggota</th>
                                <th className="py-3 px-3">Total Simpanan (Rp)</th>
                                <th className="py-3 px-3">SHU Jasa Modal</th>
                                <th className="py-3 px-3">Total Transaksi (Rp)</th>
                                <th className="py-3 px-3">SHU Jasa Usaha</th>
                                <th className="py-3 px-3">Total SHU Diterima</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-xs font-medium text-gray-700">
                              {(() => {
                                const totSimp = communitySavingsSummary?.totalSavingsCommunity || 0
                                const totTx = communitySavingsSummary?.totalTransaksiCommunity || 0
                                const poolJasaModal = Number(shuNetProfit || 0) * shuPctJasaModal / 100
                                const poolJasaUsaha = Number(shuNetProfit || 0) * shuPctJasaUsaha / 100

                                if (!members || members.length === 0) {
                                  return (
                                    <tr>
                                      <td colSpan={6} className="py-8 text-center text-gray-400 font-bold">
                                        Belum ada anggota terdaftar di komunitas ini
                                      </td>
                                    </tr>
                                  )
                                }

                                return members.map((m: any, i: number) => {
                                  const name = m.name || m.user?.name || m.email || `Anggota ${i + 1}`
                                  const userSimp = communitySavingsSummary?.memberBalances?.[m.userId]?.total || 0
                                  const userTx   = communitySavingsSummary?.memberTransaksi?.[m.userId] || 0

                                  // Proportional formulas: Jasa Modal & Jasa Usaha
                                  const jModal = totSimp > 0 ? (userSimp / totSimp) * poolJasaModal : 0
                                  const jUsaha = totTx   > 0 ? (userTx   / totTx)   * poolJasaUsaha : 0
                                  const totShu = jModal + jUsaha

                                  return (
                                    <tr key={m.id || i} className="hover:bg-gray-50/50 transition-colors">
                                      <td className="py-3 px-3 font-bold text-gray-900">{name}</td>
                                      <td className="py-3 px-3 text-gray-600 font-semibold">
                                        Rp {Number(userSimp).toLocaleString('id-ID')}
                                      </td>
                                      <td className="py-3 px-3 text-amber-700 font-bold">
                                        Rp {Math.round(jModal).toLocaleString('id-ID')}
                                      </td>
                                      <td className="py-3 px-3 text-gray-600 font-semibold">
                                        Rp {Number(userTx).toLocaleString('id-ID')}
                                      </td>
                                      <td className="py-3 px-3 text-blue-700 font-bold">
                                        Rp {Math.round(jUsaha).toLocaleString('id-ID')}
                                      </td>
                                      <td className="py-3 px-3 font-black text-[#0F5132] text-sm">
                                        Rp {Math.round(totShu).toLocaleString('id-ID')}
                                      </td>
                                    </tr>
                                  )
                                })
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ADMIN VIEW: FINAL SHU TAB */}
                  {isCanManageCoop && shuTab === 'final' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      {communityShuData?.config ? (
                        <>
                          {/* Saved Config Overview Cards */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="p-5 bg-gradient-to-br from-emerald-950 to-emerald-900 text-white rounded-3xl space-y-2 shadow-md">
                              <span className="text-[10px] font-black text-emerald-300 uppercase tracking-wider">SHU Bersih Koperasi (Final)</span>
                              <span className="text-xl font-black block font-sora">
                                Rp {Number(communityShuData.config.totalNetProfit || 0).toLocaleString('id-ID')}
                              </span>
                              <p className="text-[10px] text-emerald-200/80 font-medium">Tahun buku RAT: {communityShuData.config.year}</p>
                            </div>

                            <div className="p-5 bg-gradient-to-br from-amber-50 to-white border border-amber-200 rounded-3xl space-y-2 shadow-xs">
                              <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider">Jasa Modal ({communityShuData.config.pctJasaModal}%)</span>
                              <span className="text-xl font-black text-gray-900 block font-sora">
                                Rp {(Number(communityShuData.config.totalNetProfit || 0) * communityShuData.config.pctJasaModal / 100).toLocaleString('id-ID')}
                              </span>
                              <p className="text-[10px] text-gray-500 font-medium">Alokasi pool Jasa Modal disimpan</p>
                            </div>

                            <div className="p-5 bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-3xl space-y-2 shadow-xs">
                              <span className="text-[10px] font-black text-blue-800 uppercase tracking-wider">Jasa Usaha ({communityShuData.config.pctJasaUsaha}%)</span>
                              <span className="text-xl font-black text-gray-900 block font-sora">
                                Rp {(Number(communityShuData.config.totalNetProfit || 0) * communityShuData.config.pctJasaUsaha / 100).toLocaleString('id-ID')}
                              </span>
                              <p className="text-[10px] text-gray-500 font-medium">Alokasi pool Jasa Usaha disimpan</p>
                            </div>
                          </div>

                          {/* Final Snapshot Table */}
                          <div className="bg-white border border-gray-200/80 rounded-3xl p-6 space-y-4 shadow-xs">
                            <div className="border-b border-gray-100 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                              <div>
                                <h3 className="text-sm font-black text-gray-900 font-sora">Daftar Pembagian SHU Anggota Terkunci</h3>
                                <p className="text-xs text-gray-500 font-medium mt-0.5">
                                  Data resmi di bawah ini disimpan di database. Gunakan tombol &quot;Simulasi &amp; Live Preview&quot; untuk memperbarui porsi SHU jika terdapat transaksi baru.
                                </p>
                              </div>
                              <span className="text-xs font-mono font-bold bg-[#eef8e9] text-[#006e24] px-3 py-1.5 rounded-full border border-[#2db24a]/20">
                                🔒 LOCKED / FINAL
                              </span>
                            </div>

                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                    <th className="py-3 px-3">Nama Anggota</th>
                                    <th className="py-3 px-3">Total Simpanan (Rp)</th>
                                    <th className="py-3 px-3">SHU Jasa Modal</th>
                                    <th className="py-3 px-3">Total Transaksi (Rp)</th>
                                    <th className="py-3 px-3">SHU Jasa Usaha</th>
                                    <th className="py-3 px-3">Total SHU Diterima</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 text-xs font-medium text-gray-700">
                                  {communityShuData.config.distributions && communityShuData.config.distributions.length > 0 ? (
                                    communityShuData.config.distributions.map((d: any, i: number) => (
                                      <tr key={d.id || i} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-3 px-3 font-bold text-gray-900">
                                          <div>{d.userName}</div>
                                          <div className="text-[9px] text-gray-400 font-medium">{d.userEmail}</div>
                                        </td>
                                        <td className="py-3 px-3 text-gray-600 font-semibold">
                                          Rp {Number(d.simpananMember || 0).toLocaleString('id-ID')}
                                        </td>
                                        <td className="py-3 px-3 text-amber-700 font-bold">
                                          Rp {Number(d.shuJasaModalAmount || 0).toLocaleString('id-ID')}
                                        </td>
                                        <td className="py-3 px-3 text-gray-600 font-semibold">
                                          Rp {Number(d.transaksiMember || 0).toLocaleString('id-ID')}
                                        </td>
                                        <td className="py-3 px-3 text-blue-700 font-bold">
                                          Rp {Number(d.shuJasaUsahaAmount || 0).toLocaleString('id-ID')}
                                        </td>
                                        <td className="py-3 px-3 font-black text-[#0F5132] text-sm">
                                          Rp {Number(d.totalShuAmount || 0).toLocaleString('id-ID')}
                                        </td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan={6} className="py-8 text-center text-gray-400 font-bold">
                                        Tidak ada rincian anggota tersimpan.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="p-8 bg-gray-50 border border-dashed border-gray-200 rounded-3xl text-center">
                          <p className="text-sm text-gray-500 font-bold">Belum ada pembagian SHU yang disimpan untuk tahun buku ini.</p>
                          <p className="text-xs text-gray-400 font-medium mt-1">Silakan atur persentase di tab &quot;Simulasi &amp; Live Preview&quot; terlebih dahulu kemudian simpan.</p>
                          <button
                            type="button"
                            onClick={() => setShuTab('preview')}
                            className="mt-4 px-4 py-2 bg-[#2DB24A] hover:bg-[#0F5132] text-white text-xs font-bold rounded-xl cursor-pointer transition-colors border-none"
                          >
                            Buka Simulasi &amp; Live Preview
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Member View: Personal SHU Card Grid */}
                  {!isCanManageCoop && (
                    <div className="space-y-6">
                      {(() => {
                        const hasConfig = !!communityShuData?.config;
                        const myDist = communityShuData?.config?.distributions?.find((d: any) => d.userId === user?.id);
                        
                        const configNetProfit = communityShuData?.config?.totalNetProfit ?? 3000000;
                        const configPctJasaModal = communityShuData?.config?.pctJasaModal ?? 20;
                        const configPctJasaUsaha = communityShuData?.config?.pctJasaUsaha ?? 25;

                        const poolJasaModal = (configNetProfit * configPctJasaModal) / 100;
                        const poolJasaUsaha = (configNetProfit * configPctJasaUsaha) / 100;

                        const totSimp = myDist ? myDist.simpananTotalCommunity : (communitySavingsSummary?.totalSavingsCommunity || 0);
                        const totTx = myDist ? myDist.transaksiTotalCommunity : (communitySavingsSummary?.totalTransaksiCommunity || 0);
                        
                        const mySimp = myDist ? myDist.simpananMember : (communitySavingsSummary?.memberBalances?.[user?.id]?.total || 0);
                        const myTx   = myDist ? myDist.transaksiMember : (communitySavingsSummary?.memberTransaksi?.[user?.id] || 0);
                        
                        const jModal = myDist ? myDist.shuJasaModalAmount : (totSimp > 0 ? (mySimp / totSimp) * poolJasaModal : 0);
                        const jUsaha = myDist ? myDist.shuJasaUsahaAmount : (totTx > 0 ? (myTx / totTx) * poolJasaUsaha : 0);
                        const totShu = jModal + jUsaha;

                        return (
                          <div className="space-y-6">
                            {!hasConfig && (
                              <div className="p-4 bg-amber-50/80 border border-amber-200 text-amber-800 rounded-3xl text-xs font-semibold flex items-start gap-2 shadow-2xs">
                                <span className="mt-0.5">⚠️</span>
                                <span>Ini adalah <strong>Data Simulasi/Testing</strong>. Hasil perhitungan di bawah merupakan estimasi menggunakan nilai default sementara (SHU Bersih: Rp 3.000.000, Jasa Modal: 20%, Jasa Usaha: 25%) dan belum dicatat ke data produksi/saldo dompet Anda.</span>
                              </div>
                            )}
                            <div className="p-6 bg-gradient-to-br from-[#E8F8EE] to-white border border-emerald-100 rounded-3xl space-y-4 shadow-sm">
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                <h3 className="text-sm font-black text-emerald-950 uppercase tracking-wider font-sora">
                                  Laporan SHU Saya Tahun Buku {new Date().getFullYear()}
                                </h3>
                                {!hasConfig && (
                                  <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full border border-amber-200 uppercase tracking-wider">
                                    Simulasi / Testing
                                  </span>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-5 bg-white border border-gray-100 rounded-2xl space-y-1 shadow-2xs">
                                  <span className="text-[10px] text-gray-400 font-bold uppercase">SHU Jasa Modal Saya</span>
                                  <span className="text-lg font-black text-gray-950 block">
                                    Rp {Math.round(jModal).toLocaleString('id-ID')}
                                  </span>
                                  <span className="text-[9px] text-gray-400 block font-medium">
                                    Proporsi Simpanan: {totSimp > 0 ? ((mySimp / totSimp) * 100).toFixed(2) : '0'}%
                                  </span>
                                </div>
                                <div className="p-5 bg-white border border-gray-100 rounded-2xl space-y-1 shadow-2xs">
                                  <span className="text-[10px] text-gray-400 font-bold uppercase">SHU Jasa Usaha Saya</span>
                                  <span className="text-lg font-black text-gray-950 block">
                                    Rp {Math.round(jUsaha).toLocaleString('id-ID')}
                                  </span>
                                  <span className="text-[9px] text-gray-400 block font-medium">
                                    Proporsi Belanja: {totTx > 0 ? ((myTx / totTx) * 100).toFixed(2) : '0'}%
                                  </span>
                                </div>
                                <div className="p-5 bg-[#2DB24A] text-white rounded-2xl space-y-1 shadow-2xs">
                                  <span className="text-[10px] text-emerald-100 font-bold uppercase">Total SHU Diterima</span>
                                  <span className="text-xl font-black block font-sora">
                                    Rp {Math.round(totShu).toLocaleString('id-ID')}
                                  </span>
                                  <span className="text-[9px] text-emerald-100/90 block font-medium">
                                    Transfer otomatis ke Saldo Dompet
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="bg-white border border-gray-200/80 rounded-3xl p-6 space-y-3 shadow-2xs">
                              <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider font-sora">
                                Transparansi Rumus & Perhitungan SHU Anda
                              </h4>
                              
                              <div className="overflow-x-auto font-medium text-gray-700">
                                <table className="w-full text-left text-xs border-collapse">
                                  <thead>
                                    <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                      <th className="py-2.5 px-3">Kategori</th>
                                      <th className="py-2.5 px-3 text-right">Data Anda</th>
                                      <th className="py-2.5 px-3 text-right">Total Koperasi</th>
                                      <th className="py-2.5 px-3 text-right font-semibold">Pool SHU ({hasConfig ? 'Terkunci' : 'Estimasi'})</th>
                                      <th className="py-2.5 px-3 text-right font-black text-emerald-950">SHU Anda</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-50 text-gray-600">
                                    <tr>
                                      <td className="py-3 px-3 font-bold text-gray-900">Jasa Modal (Simpanan)</td>
                                      <td className="py-3 px-3 text-right font-mono">Rp {mySimp.toLocaleString('id-ID')}</td>
                                      <td className="py-3 px-3 text-right font-mono">Rp {totSimp.toLocaleString('id-ID')}</td>
                                      <td className="py-3 px-3 text-right font-mono text-amber-700">Rp {Math.round(poolJasaModal).toLocaleString('id-ID')}</td>
                                      <td className="py-3 px-3 text-right font-mono text-amber-700 font-bold">Rp {Math.round(jModal).toLocaleString('id-ID')}</td>
                                    </tr>
                                    <tr>
                                      <td className="py-3 px-3 font-bold text-gray-900">Jasa Usaha (Belanja)</td>
                                      <td className="py-3 px-3 text-right font-mono">Rp {myTx.toLocaleString('id-ID')}</td>
                                      <td className="py-3 px-3 text-right font-mono">Rp {totTx.toLocaleString('id-ID')}</td>
                                      <td className="py-3 px-3 text-right font-mono text-blue-700">Rp {Math.round(poolJasaUsaha).toLocaleString('id-ID')}</td>
                                      <td className="py-3 px-3 text-right font-mono text-blue-700 font-bold">Rp {Math.round(jUsaha).toLocaleString('id-ID')}</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 23: LAPORAN KOPERASI ────────────────────────────────────────── */}
            {activeSidebarNav === 'laporan' && (
              <div className="space-y-6">
                <div className="p-6 bg-white border border-gray-200/80 rounded-3xl shadow-xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-black text-gray-900 font-sora flex items-center gap-2">
                        <FileText className="w-6 h-6 text-[#2DB24A]" /> Laporan Keuangan Audited & Dokumentasi RAT
                      </h2>
                      <p className="text-xs text-gray-500 font-medium mt-1">Unduh berkas laporan keuangan, neraca saldo, serta risalah Rapat Anggota Tahunan (RAT).</p>
                    </div>
                    {isCanManageCoop && (
                      <button
                        onClick={() => handleOpenReportModal()}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-2xl shadow-xs transition-all cursor-pointer whitespace-nowrap"
                      >
                        <Plus className="w-4 h-4" /> Tambah Laporan
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {isLoadingReports ? (
                      <div className="flex justify-center items-center py-10">
                        <Loader2 className="w-8 h-8 text-[#2DB24A] animate-spin" />
                      </div>
                    ) : reports.filter(r => isCanManageCoop || r.status === 'PUBLISHED').length === 0 ? (
                      <div className="p-10 text-center bg-gray-50/70 border border-gray-200/80 rounded-2xl space-y-2">
                        <FileText className="w-8 h-8 text-gray-400 mx-auto opacity-70" />
                        <p className="text-sm font-bold text-gray-500">Belum ada laporan</p>
                      </div>
                    ) : (
                      reports
                        .filter(r => isCanManageCoop || r.status === 'PUBLISHED')
                        .map((rep) => {
                          const isExcel = rep.fileUrl?.toLowerCase().endsWith('.xlsx') || rep.fileUrl?.toLowerCase().endsWith('.xls')
                          return (
                            <div key={rep.id} className="p-4 bg-gray-50/70 border border-gray-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:border-[#2DB24A]/40 transition-all">
                              <div className="flex items-start gap-3">
                                <div className="p-2.5 bg-green-50 rounded-xl text-[#2DB24A] mt-0.5">
                                  <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h4 className="text-xs font-black text-gray-900 font-sora">{rep.title}</h4>
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 font-bold text-[9px] rounded-md uppercase">
                                      {rep.type}
                                    </span>
                                    {isCanManageCoop && (
                                      <span className={`px-2 py-0.5 font-extrabold text-[9px] rounded-md ${rep.status === 'DRAFT' ? 'bg-gray-200 text-gray-700' : 'bg-green-100 text-green-800'}`}>
                                        {rep.status === 'DRAFT' ? 'DRAFT' : 'PUBLIKASI'}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-gray-400 font-semibold mt-1">
                                    Tahun Buku {rep.year} • Diunggah {rep.publishedAt ? new Date(rep.publishedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 self-end sm:self-center">
                                {isCanManageCoop && (
                                  <div className="flex items-center gap-1.5 mr-2">
                                    <button
                                      onClick={() => handleTogglePublishReport(rep)}
                                      title={rep.status === 'DRAFT' ? 'Publikasikan' : 'Simpan sebagai Draft'}
                                      className="p-1.5 text-gray-500 hover:text-green-600 bg-white border border-gray-200 rounded-lg hover:border-green-300 transition-all cursor-pointer"
                                    >
                                      {rep.status === 'DRAFT' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                                    </button>
                                    <button
                                      onClick={() => handleOpenReportModal(rep)}
                                      title="Edit Laporan"
                                      className="p-1.5 text-gray-500 hover:text-blue-600 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-all cursor-pointer"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteReport(rep.id)}
                                      title="Hapus Laporan"
                                      className="p-1.5 text-gray-500 hover:text-red-600 bg-white border border-gray-200 rounded-lg hover:border-red-300 transition-all cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                                <a
                                  href={rep.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3.5 py-2 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1"
                                >
                                  {isExcel ? 'Unduh Excel' : 'Unduh PDF'}
                                </a>
                              </div>
                            </div>
                          )
                        })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 24: PENGATURAN FITUR KOMUNITAS (CRUD TOGGLE MODULES) ────────── */}
            {activeSidebarNav === 'pengaturan' && (
              <div className="space-y-6">
                <div className="p-6 bg-white border border-gray-200/80 rounded-3xl shadow-xs space-y-6">
                  <div className="border-b border-gray-100 pb-4">
                    <h2 className="text-xl font-black text-gray-900 font-sora flex items-center gap-2">
                      <Sliders className="w-6 h-6 text-[#2DB24A]" /> Pengaturan Fitur Komunitas
                    </h2>
                    <p className="text-xs text-gray-500 font-medium mt-1">
                      Kelola fitur dan menu navigasi yang aktif di halaman {community?.name}.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Daftar Fitur Navigasi
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {togglableModules.map((mod) => {
                        const isEnabled = !disabledModules.includes(mod.id)
                        const ModIcon = mod.icon
                        return (
                          <div
                            key={mod.id}
                            className="p-4 bg-gray-50/60 border border-gray-200/80 rounded-2xl flex items-center justify-between hover:border-gray-300 transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                                isEnabled ? 'bg-[#E8F8EE] text-[#2DB24A]' : 'bg-gray-200 text-gray-400'
                              }`}>
                                <ModIcon className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="text-xs font-black text-gray-900">{mod.label}</h4>
                                <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                                  {isEnabled ? 'Navigasi aktif di menu' : 'Navigasi disembunyikan'}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleToggleModule(mod.id)}
                              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 ${
                                isEnabled ? 'bg-[#2DB24A] justify-end' : 'bg-gray-300 justify-start'
                              }`}
                            >
                              <span className="bg-white w-4 h-4 rounded-full shadow-xs transition-all" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* SECTION: IDENTITAS VISUAL DASHBOARD */}
                  <div className="pt-6 border-t border-gray-100 space-y-4">
                    <div>
                      <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-[#2DB24A]" /> Identitas Visual & Tampilan Dashboard
                      </h3>
                      <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                        Unggah logo dan foto sampul banner baru untuk mempercantik tampilan dashboard komunitas Anda.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Logo Upload */}
                      <div className="p-4 bg-gray-50/60 border border-gray-200/80 rounded-2xl space-y-3">
                        <span className="text-[10px] font-black text-gray-800 uppercase tracking-wider block">Logo Komunitas (Avatar)</span>
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                            {settingsAvatarUrl ? (
                              <img src={settingsAvatarUrl} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                              <Users className="w-8 h-8 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 space-y-2">
                            <label className="inline-flex px-3 py-1.5 bg-white border border-gray-300 hover:border-[#2DB24A] hover:text-[#2DB24A] text-gray-700 font-extrabold text-[11px] rounded-lg shadow-2xs transition-all cursor-pointer items-center gap-1.5">
                              {uploadingSettingsAvatar ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Mengunggah...
                                </>
                              ) : (
                                <>
                                  <Upload className="w-3.5 h-3.5" /> Pilih Logo Baru
                                </>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={uploadingSettingsAvatar}
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) handleFileUpload(file, 'avatar', 'settings')
                                }}
                              />
                            </label>
                            <p className="text-[9px] text-gray-400 font-medium">Rekomendasi rasio 1:1 format PNG/JPG maks 2MB.</p>
                          </div>
                        </div>
                      </div>

                      {/* Banner Upload */}
                      <div className="p-4 bg-gray-55/40 border border-gray-200/80 rounded-2xl space-y-3">
                        <span className="text-[10px] font-black text-gray-800 uppercase tracking-wider block">Foto Sampul (Banner Cover)</span>
                        <div className="flex items-center gap-4">
                          <div className="w-24 h-16 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                            {settingsCoverUrl ? (
                              <img src={settingsCoverUrl} alt="Banner" className="w-full h-full object-cover" />
                            ) : (
                              <div className="text-[9px] text-gray-400 font-bold">No Banner</div>
                            )}
                          </div>
                          <div className="flex-1 space-y-2">
                            <label className="inline-flex px-3 py-1.5 bg-white border border-gray-300 hover:border-[#2DB24A] hover:text-[#2DB24A] text-gray-700 font-extrabold text-[11px] rounded-lg shadow-2xs transition-all cursor-pointer items-center gap-1.5">
                              {uploadingSettingsCover ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Mengunggah...
                                </>
                              ) : (
                                <>
                                  <Upload className="w-3.5 h-3.5" /> Pilih Sampul Baru
                                </>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={uploadingSettingsCover}
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) handleFileUpload(file, 'cover', 'settings')
                                }}
                              />
                            </label>
                            <p className="text-[9px] text-gray-400 font-medium">rekomendasi rasio 3:1 format PNG/JPG maks 2MB.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex justify-end">
                    <button
                      onClick={handleSaveSettings}
                      disabled={isSavingSettings}
                      className="px-5 py-2.5 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isSavingSettings ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...
                        </>
                      ) : (
                        'Simpan Pengaturan'
                      )}
                    </button>
                  </div>

                  {/* SECTION 2: PENGATURAN REFERRAL MULTI-TIER (3-5 TIER) */}
                  <div className="pt-6 border-t border-gray-100 space-y-5">
                    <div>
                      <h3 className="text-sm font-black text-gray-900 font-sora flex items-center gap-2">
                        <Handshake className="w-4 h-4 text-[#2DB24A]" /> Pengaturan Referral Multi-Tier Komunitas
                      </h3>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">
                        Atur alokasi dana pendaftaran, jumlah tier referral (3 - 5 tier), dan persentase komisi per tier. Total dana referral tidak bisa melebihi alokasi yang ditentukan.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">Harga Masuk Komunitas (Rp)</label>
                        <input
                          type="number"
                          value={refJoinFee}
                          onChange={e => setRefJoinFee(Number(e.target.value))}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-[#2DB24A]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">Keuntungan Kas Komunitas (Rp)</label>
                        <input
                          type="number"
                          value={refCommunityProfitShare}
                          onChange={e => setRefCommunityProfitShare(Number(e.target.value))}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-[#2DB24A]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">Total Alokasi Dana Referral (Rp)</label>
                        <input
                          type="number"
                          value={refReferralBudget}
                          onChange={e => setRefReferralBudget(Number(e.target.value))}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-[#2DB24A]"
                        />
                      </div>
                    </div>

                    {/* KYC Requirement Toggle */}
                    <div className="p-3.5 bg-[#E8F8EE] border border-[#2DB24A]/25 rounded-2xl flex items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-extrabold text-[#0F5132] block font-sora">
                          Wajibkan Verifikasi KYC (KTP/Selfie) untuk Anggota
                        </span>
                        <p className="text-[10px] text-emerald-800/80 font-medium mt-0.5 leading-relaxed">
                          Aktifkan untuk membatasi pendaftaran hanya bagi merchant yang telah terverifikasi KYC.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setRefIsKycRequired(!refIsKycRequired)}
                        className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 shrink-0 ${
                          refIsKycRequired ? 'bg-[#2DB24A] justify-end' : 'bg-gray-300 justify-start'
                        }`}
                      >
                        <span className="bg-white w-4 h-4 rounded-full shadow-xs transition-all" />
                      </button>
                    </div>

                    {/* Commission Method Selector */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-gray-800">Metode Komisi Referral:</label>
                      <div className="flex gap-2">
                        {(['PERCENTAGE', 'NOMINAL'] as const).map(method => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => {
                              setRefCommissionMethod(method)
                              // Reset tier values to sensible defaults for each mode
                              if (method === 'PERCENTAGE') {
                                if (refMaxTiers === 3) setRefTierPercentages([50, 30, 20])
                                else if (refMaxTiers === 4) setRefTierPercentages([40, 30, 20, 10])
                                else setRefTierPercentages([40, 30, 15, 10, 5])
                              } else {
                                // Nominal: default based on referral budget split
                                const share = Math.round(refReferralBudget / refMaxTiers)
                                setRefTierPercentages(Array(refMaxTiers).fill(share))
                              }
                            }}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer ${
                              refCommissionMethod === method
                                ? method === 'PERCENTAGE'
                                  ? 'bg-[#2DB24A] border-[#2DB24A] text-white shadow-sm'
                                  : 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            {method === 'PERCENTAGE' ? (
                              <><span className="text-base leading-none">%</span> Persentase</>
                            ) : (
                              <><span className="text-base leading-none font-mono">Rp</span> Nominal</>
                            )}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-500 font-medium">
                        {refCommissionMethod === 'PERCENTAGE'
                          ? 'Komisi dihitung sebagai persentase (%) dari total alokasi dana referral. Total semua tier harus 100%.'
                          : 'Komisi ditentukan sebagai nominal Rupiah (Rp) tetap per tier. Tidak ada validasi total.'}
                      </p>
                    </div>

                    {/* Tier Selector (3, 4, 5) */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-gray-800">Jumlah Tier Referral (Min 3, Max 5 Tier):</label>
                      <div className="flex gap-2">
                        {[3, 4, 5].map(tCount => (
                          <button
                            key={tCount}
                            type="button"
                            onClick={() => {
                              setRefMaxTiers(tCount)
                              if (refCommissionMethod === 'PERCENTAGE') {
                                if (tCount === 3) setRefTierPercentages([50, 30, 20])
                                else if (tCount === 4) setRefTierPercentages([40, 30, 20, 10])
                                else setRefTierPercentages([40, 30, 15, 10, 5])
                              } else {
                                const share = Math.round(refReferralBudget / tCount)
                                setRefTierPercentages(Array(tCount).fill(share))
                              }
                            }}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              refMaxTiers === tCount
                                ? 'bg-[#2DB24A] text-white shadow-xs'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {tCount} Tier
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Commission inputs per tier */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-gray-800">
                        {refCommissionMethod === 'PERCENTAGE'
                          ? 'Persentase Komisi per Tier (Total Harus 100%):'
                          : 'Nominal Komisi per Tier (Rp):'}
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                        {Array.from({ length: refMaxTiers }).map((_, idx) => {
                          const val = refTierPercentages[idx] ?? 0
                          const calcAmount = refCommissionMethod === 'PERCENTAGE'
                            ? Math.round((refReferralBudget * val) / 100)
                            : val
                          return (
                            <div key={idx} className={`p-3 border rounded-xl space-y-1 ${
                              refCommissionMethod === 'PERCENTAGE' ? 'bg-emerald-50/60 border-emerald-100' : 'bg-blue-50/60 border-blue-100'
                            }`}>
                              <span className="block text-[10px] font-bold text-gray-600 uppercase">Tier {idx + 1}</span>
                              <div className="flex items-center gap-1">
                                {refCommissionMethod === 'NOMINAL' && (
                                  <span className="text-[10px] font-bold text-blue-600 shrink-0">Rp</span>
                                )}
                                <input
                                  type="number"
                                  value={val}
                                  onChange={e => {
                                    const v = Number(e.target.value)
                                    setRefTierPercentages(prev => {
                                      const newArr = [...prev]
                                      newArr[idx] = v
                                      return newArr
                                    })
                                  }}
                                  className="w-full border rounded-lg px-2 py-1 text-xs font-bold font-mono focus:outline-none focus:border-[#2DB24A]"
                                />
                                {refCommissionMethod === 'PERCENTAGE' && (
                                  <span className="text-xs font-bold text-gray-500 shrink-0">%</span>
                                )}
                              </div>
                              <span className="block text-[9px] font-bold text-[#0F5132] font-mono">
                                {refCommissionMethod === 'PERCENTAGE'
                                  ? `≈ Rp ${calcAmount.toLocaleString('id-ID')}`
                                  : `Rp ${calcAmount.toLocaleString('id-ID')}`}
                              </span>
                            </div>
                          )
                        })}
                      </div>

                      {/* Validation summary */}
                      {refCommissionMethod === 'PERCENTAGE' ? (() => {
                        const total = refTierPercentages.slice(0, refMaxTiers).reduce((a, b) => a + Number(b || 0), 0)
                        const isValid = Math.abs(total - 100) <= 0.1
                        return (
                          <p className={`text-[11px] font-bold ${isValid ? 'text-emerald-700' : 'text-red-600'}`}>
                            Total Persentase Tier: {total}% {isValid ? '✓ (Valid)' : '⚠️ Total harus persis 100%'}
                          </p>
                        )
                      })() : (() => {
                        const totalNominal = refTierPercentages.slice(0, refMaxTiers).reduce((a, b) => a + Number(b || 0), 0)
                        const overBudget = totalNominal > refReferralBudget
                        return (
                          <p className={`text-[11px] font-bold ${overBudget ? 'text-amber-600' : 'text-blue-700'}`}>
                            Total Nominal: Rp {totalNominal.toLocaleString('id-ID')}
                            {overBudget ? ' ⚠️ Melebihi alokasi dana referral' : ' ✓'}
                          </p>
                        )
                      })()}
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={handleSaveReferralSettings}
                        disabled={isSavingRefSettings}
                        className="px-5 py-2.5 bg-[#0F5132] hover:bg-emerald-900 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isSavingRefSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan Pengaturan Referral Multi-Tier'}
                      </button>
                    </div>
                  </div>

                  {/* SECTION 3: PENGATURAN MEMBERSHIP & BENEFIT PERKUMPULAN PREMIUM */}
                  <div className="pt-6 border-t border-gray-100 space-y-5">
                    <div>
                      <h3 className="text-sm font-black text-gray-900 font-sora flex items-center gap-2">
                        <Award className="w-4 h-4 text-purple-600" /> Pengaturan Membership & Benefit Perkumpulan Premium
                      </h3>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">
                        Sebagai Admin Komunitas, Anda dapat menentukan sendiri biaya keanggotaan (membership fee), periode iuran, kit merchandise, dan benefit eksklusif bagi anggota komunitas Anda.
                      </p>
                    </div>

                    {/* Notice Alert */}
                    <div className="p-4 bg-purple-50/80 border border-purple-200 rounded-2xl space-y-1.5">
                      <div className="flex items-center gap-2 font-extrabold text-xs text-purple-900 font-sora">
                        <Info className="w-4 h-4 text-purple-600 shrink-0" />
                        <span>Catatan Transparansi Finansial Kas Komunitas:</span>
                      </div>
                      <p className="text-[11px] text-purple-800 font-medium leading-relaxed">
                        Seluruh dana iuran membership anggota di bawah ini diatur penuh oleh Admin komunitas dan <strong>100% masuk ke Kas/Rekening Komunitas Anda</strong>. Biaya ini sepenuhnya terpisah dari <strong>Biaya Aktivasi Platform Saloka (Rp200.000)</strong> yang dibayarkan satu kali saat pendaftaran awal.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">Model Keanggotaan Anggota</label>
                        <select
                          value={communityMembershipType}
                          onChange={e => setCommunityMembershipType(e.target.value as any)}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#2DB24A]"
                        >
                          <option value="FREE">Gratis (Semua Anggota Bebas Join)</option>
                          <option value="PREMIUM">Premium Berbayar (Exclusive Member)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">Biaya Membership Anggota (Rp)</label>
                        <input
                          type="number"
                          value={communityMemberFee}
                          onChange={e => setCommunityMemberFee(Number(e.target.value))}
                          placeholder="e.g. 50000"
                          disabled={communityMembershipType === 'FREE'}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-[#2DB24A] disabled:bg-gray-100 disabled:opacity-60"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">Periode Keanggotaan</label>
                        <select
                          value={communityMemberFeePeriod}
                          onChange={e => setCommunityMemberFeePeriod(e.target.value as any)}
                          disabled={communityMembershipType === 'FREE'}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#2DB24A] disabled:bg-gray-100 disabled:opacity-60"
                        >
                          <option value="MONTHLY">Per Bulan (Bulanan)</option>
                          <option value="YEARLY">Per Tahun (Tahunan)</option>
                          <option value="ONETIME">Pembayaran Satu Kali (Selamanya)</option>
                        </select>
                      </div>
                    </div>

                    {/* Benefit Checklist */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-gray-800">Benefit & Fasilitas Anggota Premium:</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {[
                          { id: 'b1', label: '🎽 Kit Merchandise Komunitas (Kaos, Pin & Stiker)' },
                          { id: 'b2', label: '🎟️ Akses Event VIP & Kopdar Eksklusif Anggota' },
                          { id: 'b3', label: '🏷️ Voucher Diskon Khusus Produk Anggota Merchant' },
                          { id: 'b4', label: '🛡️ Lencana Profil Verified & Akses Direktori Kontak' },
                        ].map((b) => (
                          <div key={b.id} className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-800">{b.label}</span>
                            <span className="text-xs font-black text-emerald-600">✓ Aktif</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => {
                          goeyToast.success('Pengaturan Membership & Benefit Perkumpulan Premium berhasil disimpan!')
                        }}
                        className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        Simpan Pengaturan Membership Premium
                      </button>
                    </div>
                  </div>

                  {/* SECTION 4: HISTORI REFERRAL DOWNLINE & AUDIT LOG */}
                  <div className="pt-6 border-t border-gray-100 space-y-4">
                    <div>
                      <h3 className="text-sm font-black text-gray-900 font-sora flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#2DB24A]" /> Audit History Downline & Pembagian Referral
                      </h3>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">
                        Histori lengkap aliran dana komisi referral dari setiap merchant yang mendaftar.
                      </p>
                    </div>

                    <div className="overflow-x-auto border border-gray-200 rounded-2xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 border-b border-gray-200 text-[10px] uppercase font-bold text-gray-500">
                          <tr>
                            <th className="p-3">Tanggal</th>
                            <th className="p-3">Tier</th>
                            <th className="p-3">Penerima Komisi</th>
                            <th className="p-3">Tipe Penerima</th>
                            <th className="p-3">Nominal</th>
                            <th className="p-3">Keterangan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                          {refLogs && refLogs.length > 0 ? (
                            refLogs.map((log: any, idx: number) => (
                              <tr key={log.id || idx} className="hover:bg-gray-50/80">
                                <td className="p-3 text-[10px] text-gray-500 font-mono">
                                  {log.createdAt ? new Date(log.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Baru saja'}
                                </td>
                                <td className="p-3">
                                  <span className="px-2 py-0.5 bg-[#E8F8EE] text-[#0F5132] font-bold text-[9px] rounded-full">
                                    Tier {log.tierLevel}
                                  </span>
                                </td>
                                <td className="p-3 font-bold text-gray-900">
                                  {log.recipientType === 'REFERRER' ? 'Merchant (Referrer)' : log.recipientType === 'KOMUNITAS' ? 'Kas Komunitas' : 'Saloka.id Platform'}
                                </td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 font-bold text-[9px] rounded-full ${
                                    log.recipientType === 'REFERRER' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                    log.recipientType === 'KOMUNITAS' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                    'bg-purple-50 text-purple-700 border border-purple-200'
                                  }`}>
                                    {log.recipientType}
                                  </span>
                                </td>
                                <td className="p-3 font-mono font-extrabold text-[#0F5132]">
                                  Rp {Number(log.amount || 0).toLocaleString('id-ID')}
                                </td>
                                <td className="p-3 text-[11px] text-gray-500">
                                  {log.description || '-'}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="p-6 text-center text-xs text-gray-400 font-medium">
                                Belum ada histori transaksi referral downline.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 25: DESAIN LANDING PAGE EDITOR ──────────────────────────────── */}
            {activeSidebarNav === 'desain_landing' && (
              <div className="space-y-6">
                <LandingPageEditor
                  community={community}
                  config={parsedCommunityConfig}
                  onSave={handleSaveLandingPageConfig}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ── MODALS (LOAN, PAYMENT, EDIT, INVESTMENT) ────────────────────── */}
      {/* ─────────────────────────────────────────────────────────────────── */}

      {/* ── INVESTMENT MODAL ────────────────────────────────────────────── */}
      <AnimatePresence>
        {investModalOpen && selectedProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md border border-gray-100 bg-white p-6 rounded-3xl shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <div>
                  <h3 className="font-sora text-sm font-bold text-gray-900">
                    Pendanaan Merchant
                  </h3>
                  <span className="text-[10px] text-gray-400">{selectedProject.title || selectedProject.name || 'Proyek Pendanaan'}</span>
                </div>
                <button onClick={() => setInvestModalOpen(false)} className="text-gray-400 hover:text-gray-700 text-sm font-bold cursor-pointer">✕</button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
                  <span className="text-gray-500">Target Dana:</span>
                  <span className="font-bold text-gray-900">
                    Rp {Number(selectedProject.targetAmount ?? selectedProject.target ?? 0).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
                  <span className="text-gray-500">Minimal Pendanaan:</span>
                  <span className="font-bold text-[#2DB24A]">
                    Rp {Number(selectedProject.minInvestment ?? selectedProject.minInvest ?? 50000).toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="space-y-1.5 pt-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Masukkan Jumlah Pendanaan (Rp)</label>
                  <input
                    type="number"
                    value={investAmount}
                    onChange={(e) => setInvestAmount(e.target.value)}
                    min={Number(selectedProject.minInvestment ?? selectedProject.minInvest ?? 50000)}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-[#2DB24A]"
                  />
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Pilih Metode Pembayaran</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setInvestPaymentMethod('SALDO')}
                      className={`p-2 rounded-xl border text-[10px] font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${investPaymentMethod === 'SALDO' ? 'bg-[#E8F8EE] border-[#2DB24A] text-[#0F5132]' : 'bg-gray-50 border-gray-200 text-gray-600'
                        }`}
                    >
                      <Wallet className="w-3.5 h-3.5" /> Saldo Wallet
                    </button>
                    <button
                      type="button"
                      onClick={() => setInvestPaymentMethod('QRIS')}
                      className={`p-2 rounded-xl border text-[10px] font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${investPaymentMethod === 'QRIS' ? 'bg-[#E8F8EE] border-[#2DB24A] text-[#0F5132]' : 'bg-gray-50 border-gray-200 text-gray-600'
                        }`}
                    >
                      <QrCode className="w-3.5 h-3.5" /> QRIS Instant
                    </button>
                    <button
                      type="button"
                      onClick={() => setInvestPaymentMethod('BANK')}
                      className={`p-2 rounded-xl border text-[10px] font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${investPaymentMethod === 'BANK' ? 'bg-[#E8F8EE] border-[#2DB24A] text-[#0F5132]' : 'bg-gray-50 border-gray-200 text-gray-600'
                        }`}
                    >
                      <Building2 className="w-3.5 h-3.5" /> Bank Transfer
                    </button>
                  </div>
                </div>

                {/* Details per method */}
                {investPaymentMethod === 'SALDO' && (
                  <div className="p-3 bg-white border border-gray-200 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between items-center text-gray-700">
                      <span>Saldo Wallet Anda:</span>
                      <span className="font-mono font-extrabold text-[#0F5132]">Rp {userBalance.toLocaleString('id-ID')}</span>
                    </div>
                    {userBalance < Number(investAmount || 0) ? (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-amber-900">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold">
                          <Info className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Saldo Wallet Rp {userBalance.toLocaleString('id-ID')} (Belum mencukupi)</span>
                        </div>
                        <p className="text-[10px] text-amber-800 font-medium leading-relaxed">
                          Saldo Wallet Anda tidak mencukupi untuk investasi sebesar Rp {Number(investAmount || 0).toLocaleString('id-ID')}. Silakan bayar langsung lewat QRIS Instant atau Transfer Bank
                        </p>
                        <button
                          type="button"
                          onClick={() => setInvestPaymentMethod('QRIS')}
                          className="w-full py-2 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-[10px] rounded-lg shadow-sm transition-colors cursor-pointer text-center"
                        >
                          📱 Bayar via QRIS Instant
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center text-[10px] text-emerald-800 font-medium pt-1 border-t border-[#2DB24A]/20">
                        <span>Sisa Saldo Setelah Investasi:</span>
                        <span className="font-bold font-mono">Rp {(userBalance - Number(investAmount || 0)).toLocaleString('id-ID')}</span>
                      </div>
                    )}
                  </div>
                )}

                {investPaymentMethod === 'QRIS' && (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-center space-y-2">
                    <div className="bg-white p-2.5 rounded-xl inline-block shadow-sm border border-gray-200">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=QRIS_INVEST_${selectedProject.id}_${investAmount || 0}`}
                        alt="QRIS Code"
                        className="w-28 h-28 mx-auto rounded-lg"
                      />
                      <div className="flex items-center justify-center gap-1 mt-1 text-[9px] font-extrabold text-gray-800 uppercase tracking-wider">
                        <QrCode className="w-3 h-3 text-[#2DB24A]" /> QRIS TERAS INVESTASI
                      </div>
                    </div>
                    <p className="text-[9px] text-gray-500 font-medium">Scan dengan GoPay, OVO, Dana, ShopeePay, atau Mobile Banking.</p>
                  </div>
                )}

                {investPaymentMethod === 'BANK' && (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5 text-xs">
                    <span className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider">Nomor Virtual Account</span>
                    <div className="flex justify-between items-center p-2.5 bg-white rounded-xl border border-gray-200">
                      <div>
                        <span className="block text-[9px] text-gray-400 font-bold">BCA Virtual Account</span>
                        <span className="font-mono font-extrabold text-gray-900 text-xs">8801 9920 3841 002</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => goeyToast.success('Nomor Virtual Account BCA berhasil disalin!')}
                        className="px-2.5 py-1 bg-[#E8F8EE] hover:bg-[#2DB24A] text-[#0F5132] hover:text-white font-bold text-[10px] rounded-lg transition-colors cursor-pointer"
                      >
                        Salin
                      </button>
                    </div>
                  </div>
                )}

                <button
                  disabled={investPaymentMethod === 'SALDO' && userBalance < Number(investAmount || 0)}
                  onClick={() => {
                    const amt = Number(investAmount || 0)
                    const minAllowed = Number(selectedProject.minInvestment ?? selectedProject.minInvest ?? 50000)
                    if (amt < minAllowed) {
                      goeyToast.error(`Minimal investasi adalah Rp ${minAllowed.toLocaleString('id-ID')}`)
                      return
                    }

                    if (investPaymentMethod === 'SALDO' && userBalance < amt) {
                      goeyToast.error('Saldo Wallet Anda tidak mencukupi. Silakan gunakan QRIS Instant atau Transfer Bank.')
                      return
                    }

                    if (investPaymentMethod === 'SALDO') {
                      setUserBalance(prev => prev - amt)
                    }

                    const titleStr = selectedProject.title || selectedProject.name || 'Proyek Merchant'
                    const now = new Date()
                    const timeStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + ', ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

                    // 1. Update project collected amount progress bar
                    setFundingProjects(prev =>
                      prev.map(p => (p.id === selectedProject.id ? { ...p, collectedAmount: (p.collectedAmount || 0) + amt } : p))
                    )

                    // 2. Record transaction in recentTransactions history
                    setRecentTransactions(prev => [
                      {
                        id: `tx-${Date.now()}`,
                        date: timeStr,
                        title: `Investasi ${titleStr}`,
                        amount: amt,
                        status: 'Berhasil',
                        type: 'INVESTMENT',
                        isIncome: false
                      },
                      ...prev
                    ])

                    // 3. Update personal SHU calculation dynamically
                    setUserShu((prev: any) => {
                      const newTxTotal = (prev?.transaksiMember || 3500000) + amt
                      const netProfit = shuConfig?.totalNetProfit || 500000000
                      const poolJasaUsaha = (netProfit * (shuConfig?.pctJasaUsaha || 30)) / 100
                      const newJasaUsaha = Math.round((newTxTotal / 500000000) * poolJasaUsaha)
                      const jasaModal = prev?.shuJasaModalAmount || 250000

                      return {
                        ...prev,
                        transaksiMember: newTxTotal,
                        shuJasaUsahaAmount: newJasaUsaha,
                        shuJasaModalAmount: jasaModal,
                        totalShuAmount: newJasaUsaha + jasaModal
                      }
                    })

                    goeyToast.success(`Investasi Rp ${amt.toLocaleString('id-ID')} pada "${titleStr}" berhasil dikonfirmasi!`)
                    setInvestModalOpen(false)
                  }}
                  className={`w-full py-3 font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 ${investPaymentMethod === 'SALDO' && userBalance < Number(investAmount || 0)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-[#2DB24A] hover:bg-[#228e3b] text-white cursor-pointer'
                    }`}
                >
                  Konfirmasi Investasi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── PAYMENT MODAL (Simulated Midtrans/Saloka QRIS) ──────────────── */}
      <AnimatePresence>
        {paymentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md border border-gray-100 bg-white p-6 rounded-3xl shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="font-sora text-sm font-bold text-gray-900 uppercase tracking-wider">
                  Pembayaran Upgrade Premium Koperasi
                </h3>
                <button onClick={() => setPaymentModalOpen(false)} className="text-gray-400 hover:text-gray-700 text-sm font-bold">✕</button>
              </div>

              {paymentSuccess ? (
                <div className="p-6 text-center space-y-2">
                  <div className="w-12 h-12 bg-[#E8F8EE] border border-[#2DB24A]/20 rounded-full flex items-center justify-center text-[#2DB24A] mx-auto text-xl font-bold">✓</div>
                  <h4 className="font-bold text-gray-900 text-sm">Pembayaran Sukses!</h4>
                  <p className="text-xs text-gray-500">Selamat! Status keanggotaan Anda kini resmi menjadi PREMIUM.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <span className="text-xs font-bold text-gray-800">Biaya Simpanan Pokok & Upgrade</span>
                    <span className="text-sm font-extrabold text-[#2DB24A]">Rp {community.joinFee ? community.joinFee.toLocaleString('id-ID') : '150.000'}</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setPaymentMethod('QRIS')}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${paymentMethod === 'QRIS'
                          ? 'bg-[#E8F8EE] border-[#2DB24A] text-[#2DB24A]'
                          : 'bg-gray-50 border-gray-200 text-gray-500'
                        }`}
                    >
                      QRIS Auto-Verify
                    </button>
                    <button
                      onClick={() => setPaymentMethod('BANK')}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${paymentMethod === 'BANK'
                          ? 'bg-[#E8F8EE] border-[#2DB24A] text-[#2DB24A]'
                          : 'bg-gray-50 border-gray-200 text-gray-500'
                        }`}
                    >
                      Transfer Bank Saloka
                    </button>
                  </div>

                  {paymentMethod === 'QRIS' ? (
                    <div className="flex flex-col items-center py-5 bg-white rounded-2xl border border-gray-100">
                      <svg width="110" height="110" viewBox="0 0 24 24" fill="none" className="text-gray-900">
                        <rect width="24" height="24" fill="white" />
                        <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm1 1h2v2H5V5zm9-3h8v8h-8V2zm2 2v4h4V4h-4zm1 1h2v2h-2V5zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm1 1h2v2H5v-2zm12-3h2v2h-2v-2zm2 2h2v2h-2v-2zm-2 2h2v2h-2v-2zm-2-2h2v2h-2v-2zm0 4h2v2h-2v-2zm4 0h2v2h-2v-2zm-8-4h2v2H9v-2zm2 2h2v2h-2v-2zm2-2h2v2h-2v-2z" fill="currentColor" />
                        <rect x="9.5" y="9.5" width="5" height="5" fill="#2DB24A" />
                      </svg>
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-2">Saloka Instant QRIS Verification</span>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl space-y-1 text-center">
                      <span className="text-[10px] text-gray-400 block font-bold">Kirim ke Rekening Bersama Saloka:</span>
                      <span className="text-sm font-black text-gray-900 block font-mono">BCA: 712-094-1182</span>
                      <span className="text-[9px] text-gray-500 block">a/n PT Saloka Digital Indonesia</span>
                    </div>
                  )}

                  <button
                    onClick={handleConfirmPayment}
                    disabled={isVerifying}
                    className="w-full py-3 bg-[#2DB24A] hover:bg-[#228e3b] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-md"
                  >
                    {isVerifying ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                        Memverifikasi Pembayaran...
                      </>
                    ) : (
                      'Konfirmasi Pembayaran Selesai'
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── EDIT COMMUNITY LANDING PAGE MODAL ────────────────────────────────── */}
      <AnimatePresence>
        {editModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl border border-gray-100 bg-white p-6 rounded-3xl shadow-2xl space-y-4 my-8"
            >
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="font-sora text-sm font-bold text-gray-900 uppercase tracking-wider">
                  Edit Landing Page & Profil Komunitas
                </h3>
                <button onClick={() => setEditModalOpen(false)} className="text-gray-400 hover:text-gray-700 text-sm font-bold">✕</button>
              </div>

              {editError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-semibold">{editError}</div>
              )}
              {editSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-600 font-semibold">{editSuccess}</div>
              )}

              <form onSubmit={handleEditSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Nama Komunitas</label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#2DB24A]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Link Grup WhatsApp</label>
                    <input
                      type="url"
                      value={editWaGroupLink}
                      onChange={(e) => setEditWaGroupLink(e.target.value)}
                      placeholder="https://chat.whatsapp.com/..."
                      className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#2DB24A]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Deskripsi Komunitas</label>
                  <textarea
                    required
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#2DB24A] resize-none"
                  />
                </div>

                <div className="border-t border-gray-100 pt-3 space-y-3">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Legalitas & Kantor</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={editAkta}
                      onChange={(e) => setEditAkta(e.target.value)}
                      placeholder="Akta Notaris"
                      className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
                    />
                    <input
                      type="text"
                      value={editAhu}
                      onChange={(e) => setEditAhu(e.target.value)}
                      placeholder="Nomor AHU"
                      className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
                    />
                    <input
                      type="text"
                      value={editNpwp}
                      onChange={(e) => setEditNpwp(e.target.value)}
                      placeholder="NPWP Organisasi"
                      className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
                    />
                    <input
                      type="text"
                      value={editDomisili}
                      onChange={(e) => setEditDomisili(e.target.value)}
                      placeholder="Domisili Kantor"
                      className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="flex-1 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs uppercase tracking-wider rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={actionPending}
                    className="flex-1 py-2.5 bg-[#2DB24A] hover:bg-[#228e3b] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md"
                  >
                    {actionPending ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* MODAL CRUD: TAMBAH / EDIT PRODUK SIMPANAN KOPERASI */}
        {productModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-gray-100"
            >
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-sora text-sm font-bold text-gray-900">
                  {editingProduct ? 'Edit Produk Simpanan' : 'Tambah Produk Simpanan Baru'}
                </h3>
                <button onClick={() => setProductModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
              </div>

              {(() => {
                const isDefaultProduct = editingProduct?.isDefault || false
                return (
                  <form onSubmit={(e) => {
                e.preventDefault()
                startTransition(async () => {
                  const fd = new FormData()
                  if (editingProduct) fd.append('id', editingProduct.id)
                  fd.append('communityId', id)
                  fd.append('name', prodName)
                  fd.append('type', prodType)
                  fd.append('amount', prodAmount)
                  fd.append('periodText', prodPeriod)
                  fd.append('isMandatory', String(prodIsMandatory))
                  fd.append('isPremium', String(prodIsPremium))
                  fd.append('description', prodDesc)

                  if (editingProduct) {
                    const res = await updateCooperativeProductAction(fd)
                    if (res.success && res.product) {
                      setCoopProducts(prev => prev.map(p => p.id === res.product.id ? res.product : p))
                      setProductModalOpen(false)
                      goeyToast.success('Produk simpanan berhasil diperbarui!')
                    } else {
                      alert(res.error || 'Gagal mengubah produk simpanan.')
                    }
                  } else {
                    const res = await createCooperativeProductAction(fd)
                    if (res.success && res.product) {
                      setCoopProducts(prev => [...prev, res.product])
                      setProductModalOpen(false)
                      goeyToast.success('Produk simpanan berhasil ditambahkan!')
                    } else {
                      alert(res.error || 'Gagal menambahkan produk simpanan.')
                    }
                  }
                })
              }} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Nama Produk Simpanan *</label>
                  <input type="text" required value={prodName} onChange={e => setProdName(e.target.value)} placeholder="e.g. Simpanan Sukarela Suka-Suka" className="w-full border rounded-xl px-3 py-2 text-xs" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Tipe Simpanan</label>
                    <select value={prodType} onChange={e => setProdType(e.target.value)} disabled={isDefaultProduct} className="w-full border rounded-xl px-3 py-2 text-xs disabled:bg-gray-100 disabled:text-gray-400">
                      <option value="POKOK">Simpanan Pokok</option>
                      <option value="WAJIB">Simpanan Wajib</option>
                      <option value="SUKARELA">Simpanan Sukarela</option>
                      {activeMode !== 'FREE' ? (
                        <>
                          <option value="UMROH">Simpanan Umroh (Premium)</option>
                          <option value="QURBAN">Simpanan Qurban (Premium)</option>
                          <option value="OTHER">Lain-lain (Premium)</option>
                        </>
                      ) : (
                        <>
                          <option value="LOCKED_UMROH" disabled>🔒 Simpanan Umroh (Perlu Upgrade Premium)</option>
                          <option value="LOCKED_QURBAN" disabled>🔒 Simpanan Qurban (Perlu Upgrade Premium)</option>
                          <option value="LOCKED_OTHER" disabled>🔒 Lain-lain (Perlu Upgrade Premium)</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Nominal (Rp) *</label>
                    <input type="number" required value={prodAmount} onChange={e => setProdAmount(e.target.value)} disabled={isDefaultProduct} placeholder="100000" className="w-full border rounded-xl px-3 py-2 text-xs font-mono font-bold disabled:bg-gray-100 disabled:text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Keterangan Periode (Teks Short)</label>
                  <input type="text" value={prodPeriod} onChange={e => setProdPeriod(e.target.value)} disabled={isDefaultProduct} placeholder="e.g. Setor Kapan Saja / Per Bulan" className="w-full border rounded-xl px-3 py-2 text-xs disabled:bg-gray-100 disabled:text-gray-400" />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Deskripsi Produk Simpanan</label>
                  <textarea rows={2} value={prodDesc} onChange={e => setProdDesc(e.target.value)} placeholder="Tuliskan rincian atau ketentuan simpanan ini..." className="w-full border rounded-xl px-3 py-2 text-xs" />
                </div>

                <div className="flex gap-4 pt-1">
                  <label className={`flex items-center gap-2 ${isDefaultProduct ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                    <input type="checkbox" disabled={isDefaultProduct} checked={prodIsMandatory} onChange={e => setProdIsMandatory(e.target.checked)} className="rounded text-[#2DB24A]" />
                    <span className="font-bold text-gray-700">Wajib untuk Anggota</span>
                  </label>
                  <label className={`flex items-center gap-2 ${(activeMode === 'FREE' || isDefaultProduct) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      disabled={activeMode === 'FREE' || isDefaultProduct}
                      checked={prodIsPremium}
                      onChange={e => {
                        const isPrem = e.target.checked
                        setProdIsPremium(isPrem)
                        if (!isPrem && ['UMROH', 'QURBAN', 'OTHER'].includes(prodType)) {
                          setProdType('SUKARELA')
                        }
                      }}
                      className="rounded text-[#2DB24A]"
                    />
                    <span className="font-bold text-gray-700">
                      Fitur Premium {activeMode === 'FREE' && '🔒'}
                    </span>
                  </label>
                </div>

                {activeMode === 'FREE' && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-amber-800">
                      <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Simpanan Premium Terkunci</span>
                    </div>
                    <p className="text-[11px] text-amber-700 leading-relaxed">
                      Anda berada dalam tampilan Free. Upgrade ke Koperasi Premium untuk menambah Simpanan Umroh, Qurban, dan fitur investasi lanjutan.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setProductModalOpen(false)
                        setPaymentModalOpen(true)
                      }}
                      className="w-full py-1.5 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-bold text-[11px] rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Crown className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                      Upgrade Ke Premium Sekarang
                    </button>
                  </div>
                )}

                <div className="flex gap-2 pt-3">
                  <button type="button" onClick={() => setProductModalOpen(false)} className="flex-1 py-2.5 border rounded-xl font-bold">Batal</button>
                  <button type="submit" disabled={actionPending} className="flex-1 py-2.5 bg-[#0F5132] text-white font-bold rounded-xl">
                    {actionPending ? 'Menyimpan...' : (editingProduct ? 'Simpan Perubahan' : 'Simpan Produk')}
                  </button>
                </div>
              </form>
                )
              })()}
            </motion.div>
          </div>
        )}

        {/* MODAL CRUD: TAMBAH PROYEK PENDANAAN MERCHANT */}
        {projectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-gray-100"
            >
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-sora text-sm font-bold text-gray-900">Buka Proyek Pendanaan Merchant</h3>
                <button onClick={() => setProjectModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault()
                startTransition(async () => {
                  const fd = new FormData()
                  fd.append('communityId', id)
                  fd.append('title', projTitle)
                  fd.append('targetAmount', projTarget)
                  fd.append('minInvestment', projMinInvest)
                  fd.append('estimatedReturn', projReturn)
                  fd.append('durationMonths', projDuration)
                  fd.append('description', projDesc)
                  if (projImageUrl) {
                    fd.append('imageUrl', projImageUrl)
                  }

                  const res = await createMerchantFundingProjectAction(fd)
                  if (res.success && res.project) {
                    setFundingProjects(prev => [res.project, ...prev])
                    setProjectModalOpen(false)
                    setProjTitle('')
                    setProjImageUrl('')
                    goeyToast.success('Proyek pendanaan berhasil dibuka!')
                  } else {
                    alert(res.error || 'Gagal membuka proyek pendanaan.')
                  }
                })
              }} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Judul Proyek Pendanaan *</label>
                  <input type="text" required value={projTitle} onChange={e => setProjTitle(e.target.value)} placeholder="e.g. Pengadaan Bahan Baku Kuliner Jogja" className="w-full border rounded-xl px-3 py-2 text-xs" />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Upload Gambar / Sampul Proyek *</label>
                  <div className="border-2 border-dashed border-gray-200 hover:border-[#0F5132] rounded-xl p-3 text-center transition-all bg-gray-50/50 relative cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            goeyToast.error('Ukuran gambar terlalu besar (maksimal 5MB)')
                            return
                          }
                          const reader = new FileReader()
                          reader.onloadend = () => {
                            setProjImageUrl(reader.result as string)
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    {projImageUrl ? (
                      <div className="relative group rounded-lg overflow-hidden h-28 w-full border border-gray-200">
                        <img src={projImageUrl} alt="Preview Proyek" className="w-full h-full object-cover rounded-lg" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                          Klik untuk Mengganti Foto
                        </div>
                      </div>
                    ) : (
                      <div className="py-2 space-y-1">
                        <div className="w-8 h-8 rounded-full bg-[#E8F8EE] text-[#0F5132] flex items-center justify-center mx-auto">
                          <Upload className="w-4 h-4" />
                        </div>
                        <span className="block text-[11px] font-bold text-gray-800">Unggah Gambar Proyek Mandiri</span>
                        <span className="block text-[9px] text-gray-400">Pilih berkas dari HP / Komputer Anda (Maks 5MB)</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Target Dana (Rp) *</label>
                    <input type="number" required value={projTarget} onChange={e => setProjTarget(e.target.value)} placeholder="50000000" className="w-full border rounded-xl px-3 py-2 text-xs font-mono font-bold" />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Minimal Investasi (Rp)</label>
                    <input type="number" value={projMinInvest} onChange={e => setProjMinInvest(e.target.value)} placeholder="100000" className="w-full border rounded-xl px-3 py-2 text-xs font-mono" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Bagi Hasil (% p.a.)</label>
                    <input type="number" step="0.1" value={projReturn} onChange={e => setProjReturn(e.target.value)} placeholder="12.0" className="w-full border rounded-xl px-3 py-2 text-xs font-bold" />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Tenor (Bulan)</label>
                    <input type="number" value={projDuration} onChange={e => setProjDuration(e.target.value)} placeholder="6" className="w-full border rounded-xl px-3 py-2 text-xs" />
                  </div>
                </div>

                <div className="flex gap-2 pt-3">
                  <button type="button" onClick={() => setProjectModalOpen(false)} className="flex-1 py-2.5 border rounded-xl font-bold">Batal</button>
                  <button type="submit" disabled={actionPending} className="flex-1 py-2.5 bg-[#0F5132] text-white font-bold rounded-xl">{actionPending ? 'Membuka...' : 'Buka Proyek'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* MODAL KONFIRMASI (CUSTOM ALERT / CONFIRMATION DIALOG) */}
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-gray-100"
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${confirmModal.variant === 'danger' ? 'bg-red-100 text-red-600' :
                  confirmModal.variant === 'success' ? 'bg-emerald-100 text-emerald-600' :
                    'bg-amber-100 text-amber-600'
                }`}>
                {confirmModal.variant === 'danger' ? <Trash2 className="w-6 h-6" /> :
                  confirmModal.variant === 'success' ? <CheckCircle2 className="w-6 h-6" /> :
                    <Info className="w-6 h-6" />}
              </div>

              <div className="space-y-1">
                <h3 className="font-sora text-base font-bold text-gray-900">
                  {confirmModal.title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {confirmModal.message}
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    startTransition(async () => {
                      await confirmModal.onConfirm()
                      setConfirmModal(prev => ({ ...prev, isOpen: false }))
                    })
                  }}
                  disabled={actionPending}
                  className={`flex-1 py-2.5 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer ${confirmModal.variant === 'danger' ? 'bg-red-600 hover:bg-red-700' :
                      confirmModal.variant === 'success' ? 'bg-[#0F5132] hover:bg-emerald-900' :
                        'bg-amber-600 hover:bg-amber-700'
                    }`}
                >
                  {actionPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : confirmModal.confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* MODAL CATAT TRANSAKSI SIMPANAN (ADMIN PENGURUS) */}
        {savingsTxModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-gray-100 relative"
            >
              <button
                type="button"
                onClick={() => setSavingsTxModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#2DB24A] flex items-center justify-center shrink-0">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-sora text-base font-extrabold text-gray-900">
                    Catat Transaksi Simpanan Anggota
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    Input transaksi simpanan pokok, wajib, atau sukarela per anggota
                  </p>
                </div>
              </div>

              <form onSubmit={handleRecordSavingsTransaction} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Pilih Anggota Koperasi *</label>
                  <select
                    required
                    value={txMemberId}
                    onChange={e => setTxMemberId(e.target.value)}
                    className="w-full border rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-900 border-gray-300 focus:ring-2 focus:ring-[#2DB24A] outline-none"
                  >
                    <option value="">-- Pilih Anggota --</option>
                    {members.map((m: any) => (
                      <option key={m.id || m.userId} value={m.userId}>
                        {m.name || m.user?.name || m.email || m.userId}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Kategori Simpanan *</label>
                    <select
                      value={txCategory}
                      onChange={e => setTxCategory(e.target.value as any)}
                      className="w-full border rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-900 border-gray-300 focus:ring-2 focus:ring-[#2DB24A] outline-none"
                    >
                      <option value="POKOK">Simpanan Pokok</option>
                      <option value="WAJIB">Simpanan Wajib</option>
                      <option value="SUKARELA">Simpanan Sukarela</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Jenis Transaksi *</label>
                    <select
                      value={txType}
                      onChange={e => setTxType(e.target.value as any)}
                      className="w-full border rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-900 border-gray-300 focus:ring-2 focus:ring-[#2DB24A] outline-none"
                    >
                      <option value="SETOR">SETOR (+ Setoran)</option>
                      <option value="TARIK">TARIK (- Penarikan)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Nominal (Rp) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={txAmount}
                      onChange={e => setTxAmount(e.target.value)}
                      className="w-full border rounded-xl px-3 py-2.5 text-sm font-mono font-black text-gray-900 border-gray-300 focus:ring-2 focus:ring-[#2DB24A] outline-none"
                      placeholder="50000"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Tanggal Transaksi</label>
                    <input
                      type="date"
                      value={txDate}
                      onChange={e => setTxDate(e.target.value)}
                      className="w-full border rounded-xl px-3 py-2.5 text-xs font-medium text-gray-900 border-gray-300 focus:ring-2 focus:ring-[#2DB24A] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Keterangan / Catatan (Opsional)</label>
                  <input
                    type="text"
                    value={txNotes}
                    onChange={e => setTxNotes(e.target.value)}
                    className="w-full border rounded-xl px-3 py-2.5 text-xs font-medium text-gray-900 border-gray-300 focus:ring-2 focus:ring-[#2DB24A] outline-none"
                    placeholder="Contoh: Setoran Simpanan Wajib Bulan Mei"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setSavingsTxModalOpen(false)}
                    className="px-4 py-2.5 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isRecordingSavingsTx}
                    className="px-5 py-2.5 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    {isRecordingSavingsTx ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan Transaksi'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* MODAL SETOR / BAYAR SIMPANAN KOPERASI */}
        {paySavingsModalOpen && selectedSavingsProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-gray-100 relative"
            >
              <button
                type="button"
                onClick={() => setPaySavingsModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#E8F8EE] text-[#2DB24A] flex items-center justify-center shrink-0">
                  {selectedSavingsProduct.type === 'POKOK' ? <Home className="w-6 h-6" /> :
                    selectedSavingsProduct.type === 'WAJIB' ? <Calendar className="w-6 h-6" /> :
                      <Coins className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="font-sora text-base font-extrabold text-gray-900">
                    Setor {selectedSavingsProduct.name}
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    {selectedSavingsProduct.periodText || 'Setor simpanan anggota'}
                  </p>
                </div>
              </div>

              <form onSubmit={handleConfirmDeposit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Nominal Setoran (Rp) *</label>
                  <input
                    type="number"
                    required
                    min="10000"
                    value={depositAmount}
                    onChange={e => setDepositAmount(e.target.value)}
                    className="w-full border rounded-xl px-3 py-2.5 text-sm font-mono font-extrabold text-gray-900 border-gray-300 focus:ring-2 focus:ring-[#2DB24A]"
                    placeholder="50000"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1.5">Metode Pembayaran</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setDepositPaymentMethod('SALDO')}
                      className={`p-2.5 border rounded-xl text-center space-y-1 transition-all cursor-pointer ${depositPaymentMethod === 'SALDO' ? 'border-[#2DB24A] bg-[#E8F8EE] text-[#0F5132]' : 'border-gray-200 text-gray-600'
                        }`}
                    >
                      <Wallet className="w-4 h-4 mx-auto text-[#2DB24A]" />
                      <span className="block text-[10px] font-bold">Saldo Wallet</span>
                      <span className="block text-[8px] font-semibold text-gray-500">
                        Rp {userBalance.toLocaleString('id-ID')}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDepositPaymentMethod('QRIS')}
                      className={`p-2.5 border rounded-xl text-center space-y-1 transition-all cursor-pointer ${depositPaymentMethod === 'QRIS' ? 'border-[#2DB24A] bg-[#E8F8EE] text-[#0F5132]' : 'border-gray-200 text-gray-600'
                        }`}
                    >
                      <QrCode className="w-4 h-4 mx-auto text-[#2DB24A]" />
                      <span className="block text-[10px] font-bold">QRIS Instant</span>
                      <span className="block text-[8px] font-semibold text-gray-500">Scan & Pay</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDepositPaymentMethod('BANK')}
                      className={`p-2.5 border rounded-xl text-center space-y-1 transition-all cursor-pointer ${depositPaymentMethod === 'BANK' ? 'border-[#2DB24A] bg-[#E8F8EE] text-[#0F5132]' : 'border-gray-200 text-gray-600'
                        }`}
                    >
                      <Building2 className="w-4 h-4 mx-auto text-[#2DB24A]" />
                      <span className="block text-[10px] font-bold">Bank Transfer</span>
                      <span className="block text-[8px] font-semibold text-gray-500">VA Automated</span>
                    </button>
                  </div>
                </div>

                {/* DYNAMIC PAYMENT METHOD DETAILS */}
                {depositPaymentMethod === 'SALDO' && (
                  <div className="p-3 bg-white border border-gray-200 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-600 font-medium">Saldo Wallet saat ini:</span>
                      <span className="font-extrabold text-[#0F5132]">Rp {userBalance.toLocaleString('id-ID')}</span>
                    </div>
                    {Number(depositAmount || 0) > userBalance ? (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-amber-900">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold">
                          <Info className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Saldo Wallet Rp {userBalance.toLocaleString('id-ID')} (Belum mencukupi)</span>
                        </div>
                        <p className="text-[10px] text-amber-800 font-medium leading-relaxed">
                          Saldo Wallet Anda tidak mencukupi untuk nominal setoran ini. Silakan bayar langsung lewat QRIS Instant atau Transfer Bank
                        </p>
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => setDepositPaymentMethod('QRIS')}
                            className="w-full py-2 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-[10px] rounded-lg transition-colors cursor-pointer text-center"
                          >
                            📱 Bayar via QRIS Instant
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center text-[10px] text-emerald-800 font-medium pt-1 border-t border-[#2DB24A]/20">
                        <span>Sisa Saldo Setelah Setor:</span>
                        <span className="font-bold">Rp {(userBalance - Number(depositAmount || 0)).toLocaleString('id-ID')}</span>
                      </div>
                    )}
                  </div>
                )}

                {depositPaymentMethod === 'QRIS' && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3 text-center">
                    <div className="bg-white p-3 rounded-2xl inline-block shadow-sm border border-gray-200">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=QRIS_SETOR_${selectedSavingsProduct.id}_${depositAmount || 0}`}
                        alt="QRIS Code"
                        className="w-36 h-36 mx-auto rounded-lg"
                      />
                      <div className="flex items-center justify-center gap-1 mt-2 text-[10px] font-extrabold text-gray-800 uppercase tracking-wider">
                        <QrCode className="w-3.5 h-3.5 text-[#2DB24A]" /> QRIS TERAS KOPERASI
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                      Scan QRIS ini dengan mobile banking atau e-wallet (GoPay, OVO, Dana, ShopeePay, LinkAja).
                    </p>
                  </div>
                )}

                {depositPaymentMethod === 'BANK' && (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2 text-xs">
                    <span className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider">Nomor Virtual Account</span>
                    <div className="flex justify-between items-center p-2.5 bg-white rounded-xl border border-gray-200">
                      <div>
                        <span className="block text-[9px] text-gray-400 font-bold">BCA Virtual Account</span>
                        <span className="font-mono font-extrabold text-gray-900 text-xs">8801 2398 4920 192</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => goeyToast.success('Nomor Virtual Account BCA berhasil disalin!')}
                        className="px-2.5 py-1 bg-[#E8F8EE] hover:bg-[#2DB24A] text-[#0F5132] hover:text-white font-bold text-[10px] rounded-lg transition-colors cursor-pointer"
                      >
                        Salin
                      </button>
                    </div>
                  </div>
                )}

                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-gray-500">Total Pembayaran:</span>
                    <span className="font-extrabold text-[#2DB24A]">
                      Rp {Number(depositAmount || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPaySavingsModalOpen(false)}
                    className="flex-1 py-2.5 border rounded-xl font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={actionPending || (depositPaymentMethod === 'SALDO' && userBalance < Number(depositAmount || 0))}
                    className={`flex-1 py-2.5 font-extrabold rounded-xl shadow-md flex items-center justify-center gap-1.5 ${depositPaymentMethod === 'SALDO' && userBalance < Number(depositAmount || 0)
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-[#0F5132] hover:bg-emerald-900 text-white cursor-pointer'
                      }`}
                  >
                    {actionPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Konfirmasi Setor'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* MODAL DETAIL SHU & PERHITUNGAN RAT ANGGOTA */}
        {shuDetailModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-gray-100 relative text-gray-800"
            >
              <button
                type="button"
                onClick={() => setShuDetailModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                <div className="w-12 h-12 rounded-2xl bg-[#E8F8EE] text-[#2DB24A] flex items-center justify-center shrink-0">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-sora text-base font-extrabold text-gray-900">
                    Detail SHU {shuConfig?.year || new Date().getFullYear()}
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    Sisa Hasil Usaha Koperasi Anggota
                  </p>
                </div>
              </div>

              {/* Total Card */}
              <div className="p-4 bg-gradient-to-br from-[#0F5132] to-emerald-800 text-white rounded-2xl shadow-sm flex items-center justify-between">
                <div>
                  <span className="block text-[10px] text-emerald-200 font-bold uppercase tracking-wider">Estimasi Total SHU Diterima</span>
                  <span className="font-sora font-extrabold text-xl md:text-2xl text-white">
                    Rp {Math.round(userShu?.totalShuAmount || 670000).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold text-emerald-100 font-mono">
                  RAT 2026
                </div>
              </div>

              {/* Breakdown Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Rincian Komponen Pembagian:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-[#E8F8EE] border border-[#2DB24A]/30 rounded-xl space-y-1">
                    <span className="block text-[10px] font-bold text-[#0F5132] uppercase">1. SHU Jasa Modal</span>
                    <span className="block font-mono font-extrabold text-emerald-800 text-sm">
                      Rp {Math.round(userShu?.shuJasaModalAmount || 250000).toLocaleString('id-ID')}
                    </span>
                    <span className="block text-[9px] text-gray-500">
                      Berdasarkan Simpanan Saya: Rp {(userShu?.simpananMember || 400000).toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                    <span className="block text-[10px] font-bold text-amber-800 uppercase">2. SHU Jasa Usaha</span>
                    <span className="block font-mono font-extrabold text-amber-900 text-sm">
                      Rp {Math.round(userShu?.shuJasaUsahaAmount || 420000).toLocaleString('id-ID')}
                    </span>
                    <span className="block text-[9px] text-gray-500">
                      Berdasarkan Transaksi Saya: Rp {(userShu?.transaksiMember || 3500000).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Allocation Config Info */}
              <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-2 text-xs">
                <span className="block font-bold text-gray-700 text-[11px]">Komposisi Pembagian Hasil Koperasi:</span>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-gray-600 font-medium">
                  <div className="flex justify-between"><span>Cadangan Koperasi:</span> <span className="font-bold">{shuConfig?.pctCadangan || 25}%</span></div>
                  <div className="flex justify-between"><span>SHU Jasa Modal:</span> <span className="font-bold">{shuConfig?.pctJasaModal || 20}%</span></div>
                  <div className="flex justify-between"><span>SHU Jasa Usaha:</span> <span className="font-bold">{shuConfig?.pctJasaUsaha || 30}%</span></div>
                  <div className="flex justify-between"><span>Dana Diklat Member:</span> <span className="font-bold">{shuConfig?.pctPendidikan || 2.5}%</span></div>
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShuDetailModalOpen(false)}
                  className="w-full py-2.5 bg-[#0F5132] hover:bg-emerald-900 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer text-center"
                >
                  Tutup Detail SHU
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* MODAL AJUKAN PINJAMAN PERMODALAN (PENDANAAN) */}
        {loanModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-gray-100 relative text-gray-800"
            >
              <button
                type="button"
                onClick={() => setLoanModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#2DB24A] flex items-center justify-center shrink-0">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-sora text-base font-extrabold text-gray-900">
                    Ajukan Pinjaman Permodalan
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    Fasilitas modal kerja &amp; pengadaan alat produksi anggota Koperasi
                  </p>
                </div>
              </div>

              {/* Personal Savings Requirement Validation Banner */}
              {(() => {
                const userSavings = communitySavingsSummary?.memberBalances?.[user?.id]?.total || 0;
                const hasSavings = userSavings > 0;
                
                return (
                  <form onSubmit={handleLoanSubmit} className="space-y-4 text-xs">
                    <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase">
                        <span>Saldo Simpanan Anda saat ini:</span>
                        <span className={hasSavings ? 'text-[#0F5132]' : 'text-red-600'}>
                          Rp {Number(userSavings).toLocaleString('id-ID')}
                        </span>
                      </div>
                      {!hasSavings && (
                        <div className="p-2.5 bg-red-50 border border-red-200 text-red-800 rounded-lg text-[10px] font-medium leading-relaxed mt-2 flex items-start gap-2">
                          <Info className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                          <span>Anda harus memiliki saldo simpanan aktif di koperasi ini sebelum dapat mengajukan pinjaman permodalan. Silakan setor simpanan terlebih dahulu.</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Pilih Rencana Plafon Pinjaman *</label>
                      <select
                        required
                        className="w-full border rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-900 border-gray-300 focus:ring-2 focus:ring-[#2DB24A] outline-none"
                        onChange={(e) => {
                          const val = e.target.value;
                          setLoanAmount(val);
                        }}
                      >
                        <option value="">-- Pilih Plafon / Jenis --</option>
                        <option value="25000000">Pinjaman Modal Kerja Pembelian Bahan Baku (Maks. Rp 25.000.000)</option>
                        <option value="50000000">Pinjaman Pengadaan Mesin &amp; Alat Produksi (Maks. Rp 50.000.000)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Nominal yang Diajukan (Rp) *</label>
                      <input
                        type="number"
                        required
                        min="100000"
                        value={loanAmount}
                        onChange={e => setLoanAmount(e.target.value)}
                        className="w-full border rounded-xl px-3 py-2.5 text-sm font-mono font-black text-gray-900 border-gray-300 focus:ring-2 focus:ring-[#2DB24A] outline-none"
                        placeholder="Contoh: 15000000"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Rencana Penggunaan &amp; Keperluan Pinjaman *</label>
                      <textarea
                        required
                        rows={3}
                        value={loanPurpose}
                        onChange={e => setLoanPurpose(e.target.value)}
                        className="w-full border rounded-xl px-3 py-2.5 text-xs font-medium text-gray-900 border-gray-300 focus:ring-2 focus:ring-[#2DB24A] outline-none resize-none"
                        placeholder="Tuliskan detail rencana penggunaan dana permodalan..."
                      />
                    </div>

                    {loanError && (
                      <p className="text-[10px] text-red-600 font-bold text-center">{loanError}</p>
                    )}

                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => setLoanModalOpen(false)}
                        className="px-4 py-2.5 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={actionPending || !hasSavings}
                        className={`px-5 py-2.5 font-extrabold rounded-xl shadow-xs transition-all flex items-center gap-2 ${
                          !hasSavings
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-[#2DB24A] hover:bg-[#0F5132] text-white cursor-pointer'
                        }`}
                      >
                        {actionPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Kirim Pengajuan'}
                      </button>
                    </div>
                  </form>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* UNSAVED SETTINGS WARNING MODAL (EXACTLY MATCHING THE USER'S ATTACHED DESIGN) */}
      {showUnsavedModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-[999] animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full mx-4 shadow-xl space-y-4 animate-scaleUp text-center">
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto text-amber-500">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-base font-bold text-gray-800 font-sora">Pengaturan belum tersimpan</h3>
              <p className="text-[11px] text-gray-500 font-medium leading-relaxed px-2">
                Pengaturan belum kamu simpan, apakah kamu ingin pindah ke halaman lain?
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowUnsavedModal(false)
                  setPendingTargetNav(null)
                }}
                className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-600 font-extrabold text-xs rounded-xl hover:bg-gray-50 transition-all cursor-pointer"
              >
                Tidak Pindah
              </button>
              <button
                onClick={() => {
                  setDisabledModules(savedDisabledModules)
                  if (pendingTargetNav) {
                    setActiveSidebarNav(pendingTargetNav as any)
                  }
                  setShowUnsavedModal(false)
                  setPendingTargetNav(null)
                }}
                className="flex-1 py-2.5 bg-[#FF9800] hover:bg-[#F57C00] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Pindah
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KYC WARNING MODAL */}
      {kycWarningModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-[999] animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full mx-4 shadow-xl space-y-4 text-center animate-scaleUp">
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto text-amber-600 border border-amber-200">
              <Shield className="w-6 h-6" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-base font-extrabold text-gray-900 font-sora">Verifikasi KYC Dibutuhkan</h3>
              <p className="text-xs text-gray-600 font-medium leading-relaxed px-2">
                Komunitas ini mewajibkan verifikasi identitas KYC (KTP/Selfie) bagi seluruh anggotanya. Silakan selesaikan verifikasi identitas Anda terlebih dahulu.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Link
                href="/settings"
                className="w-full py-2.5 bg-[#0F5132] hover:bg-emerald-900 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all text-center block"
              >
                🪪 Verifikasi KYC Sekarang
              </Link>
              <button
                onClick={() => setKycWarningModalOpen(false)}
                className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACCESS RESTRICTED / REQUIRE MEMBER GUARD MODAL */}
      <AnimatePresence>
        {requireMemberModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[999] p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-5 text-center border border-gray-100"
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center mx-auto shadow-xs">
                <Lock className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-black text-gray-900 font-sora">
                  Akses Khusus Anggota
                </h3>
                <p className="text-xs text-gray-600 font-medium leading-relaxed px-2">
                  Fitur <strong className="text-gray-900 font-bold">{requireMemberFeature}</strong> hanya dapat diakses oleh anggota terdaftar <span className="font-bold text-[#0F5132]">{community?.name || 'Komunitas'}</span>.
                </p>
              </div>

              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/60 rounded-2xl text-left space-y-1.5 text-[11px]">
                <span className="font-bold text-[#0F5132] flex items-center gap-1">
                  ✨ Manfaat Bergabung {community?.type === 'KOPERASI' ? 'Koperasi' : 'Komunitas'}:
                </span>
                <ul className="text-gray-600 font-medium space-y-1 pl-4 list-disc text-[10px]">
                  {community?.type === 'KOPERASI' ? (
                    <>
                      <li>Akses simpanan pokok, wajib, dan sukarela</li>
                      <li>Perhitungan & pembagian Sisa Hasil Usaha (SHU)</li>
                      <li>Akses pendanaan merchant & permodalan usaha</li>
                      <li>Forum diskusi & jejaring bisnis antar anggota</li>
                    </>
                  ) : (
                    <>
                      <li>Forum diskusi eksklusif antar pelaku usaha</li>
                      <li>Akses katalog marketplace & promosi produk</li>
                      <li>Partisipasi kelas, pelatihan, & event jejaring</li>
                    </>
                  )}
                </ul>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setRequireMemberModalOpen(false)
                    handleJoin()
                  }}
                  className="w-full py-3 bg-[#007A3D] hover:bg-[#006030] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Users className="w-4 h-4" /> {community?.type === 'KOPERASI' ? 'Menjadi Anggota' : 'Gabung Komunitas'}
                </button>
                <button
                  type="button"
                  onClick={() => setRequireMemberModalOpen(false)}
                  className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL CRUD EVENT KOMUNITAS ─────────────────────────────────── */}
      <AnimatePresence>
        {isEventModalOpen && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]"
            >
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-emerald-50/50 to-white">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#0F5132] flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-sora text-sm font-black text-gray-900">
                      {editingEvent ? 'Ubah Informasi Event' : 'Tambah Event Komunitas Baru'}
                    </h3>
                    <p className="text-[10px] text-gray-500 font-medium">
                      {editingEvent ? 'Perbarui jadwal dan detail agenda event komunitas.' : 'Buat jadwal workshop, kopdar, atau seminar baru untuk anggota.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsEventModalOpen(false)
                    setEditingEvent(null)
                  }}
                  className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEvent} className="p-5 space-y-4 overflow-y-auto flex-1">
                {/* Judul Event */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Judul Event *</label>
                  <input
                    type="text"
                    required
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="Contoh: Workshop Digital Marketing & Foto Produk 2026"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-250 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#2DB24A] transition-all"
                  />
                </div>

                {/* Tanggal & Waktu */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Tanggal & Waktu Pelaksanaan *</label>
                  <input
                    type="datetime-local"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-250 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#2DB24A] transition-all"
                  />
                </div>

                {/* Status Online / Offline */}
                <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">Event Diselenggarakan Online</span>
                    <span className="text-[10px] text-gray-500">Centang jika event diadakan via Zoom / Google Meet / Webinar</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={eventIsOnline}
                    onChange={(e) => setEventIsOnline(e.target.checked)}
                    className="w-4 h-4 accent-[#2DB24A] cursor-pointer"
                  />
                </div>

                {/* Lokasi / Link URL */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Lokasi / Gedung</label>
                    <input
                      type="text"
                      value={eventLocation}
                      onChange={(e) => setEventLocation(e.target.value)}
                      placeholder={eventIsOnline ? "Online via Zoom" : "Contoh: Gedung UMKM Saloka & Coffee Space"}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-250 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#2DB24A] transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Link Pertemuan / Web (Opsional)</label>
                    <input
                      type="url"
                      value={eventLinkUrl}
                      onChange={(e) => setEventLinkUrl(e.target.value)}
                      placeholder="https://zoom.us/j/..."
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-250 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#2DB24A] transition-all"
                    />
                  </div>
                </div>

                {/* Kapasitas & Biaya */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Kapasitas Maksimal Peserta</label>
                    <input
                      type="number"
                      value={eventMaxParticipants}
                      onChange={(e) => setEventMaxParticipants(e.target.value)}
                      placeholder="100"
                      min="1"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-250 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#2DB24A] transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Biaya Pendaftaran (Rp)</label>
                    <input
                      type="number"
                      value={eventPrice}
                      onChange={(e) => setEventPrice(e.target.value)}
                      placeholder="0 (Gratis)"
                      min="0"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-250 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#2DB24A] transition-all"
                    />
                  </div>
                </div>

                {/* Penyelenggara */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Penyelenggara / Kontak PJ</label>
                  <input
                    type="text"
                    value={eventOrganizer}
                    onChange={(e) => setEventOrganizer(e.target.value)}
                    placeholder="Contoh: Pengurus Komunitas & Divisi Edukasi"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-250 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#2DB24A] transition-all"
                  />
                </div>

                {/* Banner Event Image Upload */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Banner Foto Event</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={eventBannerUrl}
                      onChange={(e) => setEventBannerUrl(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-250 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#2DB24A] transition-all"
                    />
                    <label className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 border border-gray-250 text-gray-700 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 shrink-0 transition-colors">
                      {isUploadingEventBanner ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2DB24A]" /> : <Upload className="w-3.5 h-3.5" />}
                      <span>Unggah</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleEventBannerUpload} />
                    </label>
                  </div>
                </div>

                {/* Deskripsi Event */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Deskripsi & Agenda Event</label>
                  <textarea
                    rows={3}
                    value={eventDesc}
                    onChange={(e) => setEventDesc(e.target.value)}
                    placeholder="Jelaskan topik materi, manfaat untuk anggota, pembicara, dan panduan mengikuti acara..."
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-250 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#2DB24A] transition-all resize-none"
                  />
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEventModalOpen(false)
                      setEditingEvent(null)
                    }}
                    className="px-4 py-2.5 border border-gray-250 text-gray-600 hover:bg-gray-50 font-extrabold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingEvent || isUploadingEventBanner}
                    className="px-5 py-2.5 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSavingEvent ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...
                      </>
                    ) : (
                      editingEvent ? 'Simpan Perubahan' : 'Publikasikan Event'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL CRUD GALERI FOTO KEGIATAN ─────────────────────────────── */}
      <AnimatePresence>
        {isGalleryModalOpen && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]"
            >
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-emerald-50/50 to-white">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#0F5132] flex items-center justify-center">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-sora text-sm font-black text-gray-900">
                      Tambah Foto Dokumentasi Kegiatan
                    </h3>
                    <p className="text-[10px] text-gray-500 font-medium">
                      Unggah momen kopdar, workshop, pameran UMKM, atau aktivitas komunitas.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsGalleryModalOpen(false)}
                  className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveGallery} className="p-5 space-y-4 overflow-y-auto flex-1">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Judul Dokumentasi *</label>
                  <input
                    type="text"
                    required
                    value={galleryTitle}
                    onChange={(e) => setGalleryTitle(e.target.value)}
                    placeholder="Contoh: Kopdar Akbar & Business Matching 2026"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-250 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#2DB24A] transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Kategori Foto</label>
                    <select
                      value={galleryCategory}
                      onChange={(e) => setGalleryCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-250 rounded-xl text-xs font-bold text-gray-700 focus:bg-white focus:outline-none focus:border-[#2DB24A] transition-all"
                    >
                      <option value="Kopdar & Networking">Kopdar & Networking</option>
                      <option value="Pelatihan & Workshop">Pelatihan & Workshop</option>
                      <option value="Bazaar & Pameran">Bazaar & Pameran</option>
                      <option value="Rapat Pengurus">Rapat Pengurus</option>
                      <option value="Dokumentasi Umum">Dokumentasi Umum</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Tanggal Kegiatan</label>
                    <input
                      type="text"
                      value={galleryDate}
                      onChange={(e) => setGalleryDate(e.target.value)}
                      placeholder="18 Agustus 2026"
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-250 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#2DB24A] transition-all"
                    />
                  </div>
                </div>

                {/* Upload Foto */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Foto Kegiatan *</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      required
                      value={galleryImageUrl}
                      onChange={(e) => setGalleryImageUrl(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-250 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#2DB24A] transition-all"
                    />
                    <label className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 border border-gray-250 text-gray-700 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 shrink-0 transition-colors">
                      {isUploadingGalleryImage ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2DB24A]" /> : <Upload className="w-3.5 h-3.5" />}
                      <span>Unggah</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleGalleryImageUpload} />
                    </label>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Keterangan / Cerita Singkat</label>
                  <textarea
                    rows={3}
                    value={galleryCaption}
                    onChange={(e) => setGalleryCaption(e.target.value)}
                    placeholder="Ceritakan momen seru, jumlah peserta yang hadir, atau hasil dari kegiatan ini..."
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-250 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#2DB24A] transition-all resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsGalleryModalOpen(false)}
                    className="px-4 py-2.5 border border-gray-250 text-gray-600 hover:bg-gray-50 font-extrabold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingGallery || isUploadingGalleryImage}
                    className="px-5 py-2.5 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSavingGallery ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...
                      </>
                    ) : (
                      'Simpan Foto Galeri'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL CRUD PENGUMUMAN */}
      {isAnnouncementModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-[999] animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full mx-4 shadow-xl space-y-4 animate-scaleUp text-left">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-800 font-sora">
                {editingAnnouncement ? 'Edit Pengumuman' : 'Tambah Pengumuman Baru'}
              </h3>
              <button onClick={() => setIsAnnouncementModalOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAnnouncement} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Judul Pengumuman</label>
                <input
                  type="text"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="Masukkan judul pengumuman..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-[#2DB24A] focus:border-[#2DB24A] outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Isi Pengumuman</label>
                <textarea
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  placeholder="Tuliskan isi pengumuman secara rinci..."
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-[#2DB24A] focus:border-[#2DB24A] outline-none resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Tanggal Publikasi</label>
                  <input
                    type="date"
                    value={annPublishDate}
                    onChange={(e) => setAnnPublishDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-[#2DB24A] focus:border-[#2DB24A] outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Status</label>
                  <select
                    value={annStatus}
                    onChange={(e: any) => setAnnStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-[#2DB24A] focus:border-[#2DB24A] outline-none bg-white"
                  >
                    <option value="PUBLISHED">Publikasikan Langsung</option>
                    <option value="DRAFT">Simpan Sebagai Draft</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="annIsPinned"
                  checked={annIsPinned}
                  onChange={(e) => setAnnIsPinned(e.target.checked)}
                  className="w-4 h-4 text-[#2DB24A] border-gray-300 rounded focus:ring-[#2DB24A] cursor-pointer"
                />
                <label htmlFor="annIsPinned" className="text-xs font-bold text-gray-700 cursor-pointer select-none">
                  Tandai sebagai Penting / Terpaku (Pinned di atas list)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAnnouncementModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingAnnouncement}
                  className="px-5 py-2 bg-[#2DB24A] hover:bg-[#0F5132] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {isSavingAnnouncement ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingAnnouncement ? 'Simpan Perubahan' : 'Terbitkan Pengumuman')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CRUD LAPORAN */}
      {isReportModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-[999] animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full mx-4 shadow-xl space-y-4 animate-scaleUp text-left">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-800 font-sora">
                {editingReport ? 'Edit Laporan' : 'Tambah Laporan Baru'}
              </h3>
              <button onClick={() => setIsReportModalOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Judul Laporan</label>
                <input
                  type="text"
                  value={repTitle}
                  onChange={(e) => setRepTitle(e.target.value)}
                  placeholder="Masukkan judul laporan (misal: Laporan Keuangan Audited 2025)..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-[#2DB24A] focus:border-[#2DB24A] outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Jenis Laporan</label>
                  <select
                    value={repType}
                    onChange={(e) => setRepType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-[#2DB24A] focus:border-[#2DB24A] outline-none bg-white"
                  >
                    <option value="Keuangan">Laporan Keuangan</option>
                    <option value="Neraca">Neraca Saldo / Rugi Laba</option>
                    <option value="RAT">Risalah RAT</option>
                    <option value="Lainnya">Lain-lain</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Tahun Buku</label>
                  <input
                    type="number"
                    value={repYear}
                    onChange={(e) => setRepYear(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-[#2DB24A] focus:border-[#2DB24A] outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Tanggal Publikasi</label>
                  <input
                    type="date"
                    value={repPublishDate}
                    onChange={(e) => setRepPublishDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-[#2DB24A] focus:border-[#2DB24A] outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700">Status</label>
                  <select
                    value={repStatus}
                    onChange={(e: any) => setRepStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-[#2DB24A] focus:border-[#2DB24A] outline-none bg-white"
                  >
                    <option value="PUBLISHED">Publikasikan Langsung</option>
                    <option value="DRAFT">Simpan Sebagai Draft</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">File Laporan (PDF atau Excel)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={repFileName || repFileUrl}
                    readOnly
                    placeholder="Pilih file dokumen..."
                    className="flex-1 px-4 py-2 border border-gray-200 bg-gray-50 rounded-xl text-xs outline-none"
                  />
                  <label className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5" />
                    Unggah File
                    <input
                      type="file"
                      accept=".pdf,.xlsx,.xls"
                      onChange={handleReportFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
                {isUploadingReportFile && (
                  <p className="text-[10px] text-green-600 font-bold flex items-center gap-1 mt-1 animate-pulse">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Mengunggah berkas ke storage...
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingReport || isUploadingReportFile || !repFileUrl}
                  className={`px-5 py-2 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 ${
                    isSavingReport || isUploadingReportFile || !repFileUrl
                      ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                      : 'bg-[#2DB24A] hover:bg-[#0F5132] cursor-pointer'
                  }`}
                >
                  {isSavingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingReport ? 'Simpan Laporan' : 'Tambahkan Laporan')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KICK MEMBER CONFIRMATION MODAL (Matching Image 1 Design) */}
      {kickTargetMember && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xs w-full p-6 text-center shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 border border-red-100 flex items-center justify-center mx-auto shadow-xs">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-gray-900 font-sora">
                Keluarkan anggota?
              </h3>
              <p className="text-xs text-gray-400 font-medium">
                Anda akan mengeluarkan anggota
              </p>
              <p className="text-xs font-bold text-gray-800 font-sora">
                {kickTargetMember.name}
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setKickTargetMember(null)}
                className="flex-1 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isKicking === kickTargetMember.userId}
                onClick={handleConfirmKick}
                className="flex-1 py-2.5 bg-[#E54D4D] hover:bg-red-600 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                {isKicking === kickTargetMember.userId ? '...' : 'Keluarkan'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
