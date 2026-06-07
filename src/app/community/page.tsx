'use client'

import React, { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { 
  getPosts, 
  getPostById, 
  createPost, 
  createComment, 
  toggleLikePost, 
  getCommunityMembers,
  getGroups,
  getGroupById,
  createGroup,
  toggleJoinGroup,
  isGroupMember,
  toggleSuspendGroup,
  deletePostAction,
  deleteCommentAction
} from '../actions/community'
import { getCurrentUser } from '../actions/auth'

interface Group {
  id: string
  name: string
  description: string
  coverUrl: string | null
  avatarUrl: string | null
  isSuspended: boolean
  adminId: string
  createdAt: Date | string
  admin?: {
    id: string
    name: string
    role: string
  } | null
  _count: {
    members: number
    posts: number
  }
}

interface Post {
  id: string
  title: string
  content: string
  category: string
  imageUrl?: string | null
  videoUrl?: string | null
  likes: string[] // flat array of user IDs
  createdAt: string | Date
  groupId?: string | null
  authorId: string
  author: {
    id: string
    name: string
    role: string
    level?: number
    xp?: number
  } | null
  _count: {
    comments: number
  }
}

interface Comment {
  id: string
  content: string
  createdAt: string | Date
  authorId: string
  author: {
    id: string
    name: string
    role: string
    level?: number
  } | null
}

interface FullPost extends Post {
  comments: Comment[]
}

interface Member {
  id: string
  name: string
  role: string
  level: number
  xp: number
  membershipLevel: string
  membershipAccess: string
  createdAt: string | Date
}

const CATEGORIES = [
  { value: 'Diskusi', label: '💬 Umum & Diskusi' },
  { value: 'Tanya Jawab', label: '❓ Tanya Jawab' },
  { value: 'Tips Bisnis', label: '💡 Tips Bisnis' },
  { value: 'Pengumuman', label: '📢 Pengumuman' },
]

export default function CommunityPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const groupId = searchParams.get('groupId')

  const [user, setUser] = useState<any>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [isMember, setIsMember] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [members, setMembers] = useState<Member[]>([])
  
  const [groupSearch, setGroupSearch] = useState('')
  const [memberSearch, setMemberSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'Diskusi' | 'Media' | 'Anggota' | 'Tentang'>('Diskusi')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [expandedPost, setExpandedPost] = useState<FullPost | null>(null)
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null)

  // Modals / Creators
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDesc, setNewGroupDesc] = useState('')
  const [newGroupAvatar, setNewGroupAvatar] = useState('')
  const [newGroupCover, setNewGroupCover] = useState('')
  
  // Community Cooperative Registration States
  const [groupType, setGroupType] = useState<'REGULER' | 'KOPERASI'>('REGULER')
  const [nib, setNib] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'QRIS' | 'BANK'>('QRIS')
  const [paymentStatus, setPaymentStatus] = useState<'IDLE' | 'PENDING' | 'SUCCESS'>('IDLE')
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false)

  // Composer
  const [composerExpanded, setComposerExpanded] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newCategory, setNewCategory] = useState('Diskusi')
  const [newImageUrl, setNewImageUrl] = useState('')
  const [newVideoUrl, setNewVideoUrl] = useState('')
  
  const [replyContent, setReplyContent] = useState('')
  
  const [loading, setLoading] = useState(true)
  const [groupLoading, setGroupLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [replyError, setReplyError] = useState<string | null>(null)

  const [isPending, startTransition] = useTransition()
  const [isReplyPending, startReplyTransition] = useTransition()

  // 1. Initial Load: Fetch Session and Groups Directory
  async function loadDirectory() {
    try {
      const u = await getCurrentUser()
      if (u) setUser(u)
      
      const gList = await getGroups()
      setGroups(gList as any[])
    } catch (err) {
      console.error('Failed to load directory:', err)
    } finally {
      setLoading(false)
    }
  }

  // 2. Load Selected Group Details & Feed
  async function loadGroupDetails(id: string) {
    setGroupLoading(true)
    try {
      const groupData = await getGroupById(id)
      if (!groupData) {
        setSelectedGroup(null)
        setGroupLoading(false)
        return
      }
      
      setSelectedGroup(groupData as any)
      
      // Load feed and members specific to group
      const pList = await getPosts(id)
      setPosts(pList as any[])

      const mList = await getCommunityMembers(id)
      setMembers(mList as any[])

      // Check membership
      const u = await getCurrentUser()
      if (u) {
        const memberStatus = await isGroupMember(id)
        setIsMember(memberStatus)
      }
    } catch (err) {
      console.error('Failed to load group details:', err)
    } finally {
      setGroupLoading(false)
    }
  }

  useEffect(() => {
    loadDirectory()
  }, [])

  useEffect(() => {
    if (groupId) {
      loadGroupDetails(groupId)
      setActiveTab('Diskusi')
      setExpandedId(null)
      setExpandedPost(null)
    } else {
      setSelectedGroup(null)
      loadDirectory()
    }
  }, [groupId])

  // Simulate cooperative registration payment
  const handleSimulatePayment = () => {
    setIsVerifyingPayment(true)
    setTimeout(() => {
      setIsVerifyingPayment(false)
      setPaymentStatus('SUCCESS')
    }, 1500)
  }

  // Create Group Handler
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionError(null)

    if (!user) {
      setActionError('Anda harus masuk terlebih dahulu.')
      return
    }

    if (groupType === 'KOPERASI') {
      if (!nib) {
        setActionError('Nomor NIB / Legalitas wajib diisi untuk tipe Koperasi.')
        return
      }
      if (paymentStatus !== 'SUCCESS') {
        setActionError('Pembayaran pendaftaran Rp 150.000 wajib diselesaikan dan diverifikasi.')
        return
      }
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.append('name', newGroupName)
      formData.append('description', newGroupDesc)
      formData.append('avatarUrl', newGroupAvatar)
      formData.append('coverUrl', newGroupCover)
      formData.append('groupType', groupType)
      formData.append('nib', nib)

      const res = await createGroup(formData)
      if (res.error) {
        setActionError(res.error)
      } else {
        setNewGroupName('')
        setNewGroupDesc('')
        setNewGroupAvatar('')
        setNewGroupCover('')
        setNib('')
        setGroupType('REGULER')
        setPaymentStatus('IDLE')
        setCreateModalOpen(false)
        
        // Refresh list and navigate to new group
        const gList = await getGroups()
        setGroups(gList as any[])
        if (res.group) {
          router.push(`/community?groupId=${res.group.id}`)
        }
      }
    })
  }

  // Join/Leave Group Handler
  const handleJoinLeaveGroup = async (id: string) => {
    if (!user) {
      alert('Silakan masuk terlebih dahulu untuk bergabung.')
      return
    }

    try {
      const res = await toggleJoinGroup(id) as any
      if (res.success) {
        setIsMember(res.joined || false)
        // Refresh members list
        const mList = await getCommunityMembers(id)
        setMembers(mList as any[])
        
        // Refresh group info
        const groupData = await getGroupById(id)
        if (groupData) setSelectedGroup(groupData as any)
      }
    } catch (err) {
      console.error('Failed to join/leave group:', err)
    }
  }

  // Toggle Suspend Group (Superadmin only)
  const handleToggleSuspend = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin mengubah status penangguhan komunitas ini?')) {
      try {
        const res = await toggleSuspendGroup(id)
        if (res.error) {
          alert(res.error)
        } else {
          // Re-load group list
          const gList = await getGroups()
          setGroups(gList as any[])
          
          if (groupId === id) {
            const groupData = await getGroupById(id)
            if (groupData) setSelectedGroup(groupData as any)
          }
        }
      } catch (err) {
        console.error('Failed to suspend group:', err)
      }
    }
  }

  // Expand post and load comments
  const handleExpand = async (postId: string) => {
    if (expandedId === postId) {
      setExpandedId(null)
      setExpandedPost(null)
      return
    }
    
    setExpandedId(postId)
    setExpandedPost(null)
    setReplyContent('')
    setReplyError(null)

    try {
      const details = await getPostById(postId)
      setExpandedPost(details as any)
    } catch (err) {
      console.error(err)
    }
  }

  // Submit new post thread inside group
  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault()
    setActionError(null)

    if (!user) {
      setActionError('Anda harus masuk terlebih dahulu.')
      return
    }
    if (!groupId) return

    startTransition(async () => {
      const formData = new FormData()
      formData.append('title', newTitle)
      formData.append('content', newContent)
      formData.append('category', newCategory)
      formData.append('imageUrl', newImageUrl)
      formData.append('videoUrl', newVideoUrl)
      formData.append('groupId', groupId)

      const res = await createPost(formData)
      if (res.error) {
        setActionError(res.error)
      } else {
        setNewTitle('')
        setNewContent('')
        setNewImageUrl('')
        setNewVideoUrl('')
        setNewCategory('Diskusi')
        setComposerExpanded(false)
        
        // Refresh posts feed
        const pList = await getPosts(groupId)
        setPosts(pList as any[])
      }
    })
  }

  // Submit comment reply
  const handleCreateComment = (e: React.FormEvent) => {
    e.preventDefault()
    setReplyError(null)

    if (!user) {
      setReplyError('Anda harus masuk terlebih dahulu.')
      return
    }
    if (!expandedId) return

    startReplyTransition(async () => {
      const res = await createComment(expandedId, replyContent)
      if (res.error) {
        setReplyError(res.error)
      } else {
        setReplyContent('')
        const details = await getPostById(expandedId)
        setExpandedPost(details as any)
        
        // Refresh post comments count in list
        if (groupId) {
          const pList = await getPosts(groupId)
          setPosts(pList as any[])
        }
      }
    })
  }

  // Toggle Liking a Post
  const handleLike = async (postId: string) => {
    if (!user) {
      alert('Silakan masuk terlebih dahulu untuk menyukai postingan.')
      return
    }

    // Optimistic Update
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const isLiked = p.likes.includes(user.id)
        const updatedLikes = isLiked 
          ? p.likes.filter(id => id !== user.id)
          : [...p.likes, user.id]
        return { ...p, likes: updatedLikes }
      }
      return p
    }))

    if (expandedPost && expandedPost.id === postId) {
      setExpandedPost(prev => {
        if (!prev) return null
        const isLiked = prev.likes.includes(user.id)
        const updatedLikes = isLiked 
          ? prev.likes.filter(id => id !== user.id)
          : [...prev.likes, user.id]
        return { ...prev, likes: updatedLikes }
      })
    }

    try {
      await toggleLikePost(postId)
    } catch (e) {
      console.error('Failed to toggle like', e)
    }
  }

  // Delete Post
  const handleDeletePost = async (postId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus postingan diskusi ini?')) {
      try {
        const res = await deletePostAction(postId)
        if (res.error) {
          alert(res.error)
        } else {
          setPosts(prev => prev.filter(p => p.id !== postId))
          if (expandedId === postId) {
            setExpandedId(null)
            setExpandedPost(null)
          }
        }
      } catch (err) {
        console.error('Failed to delete post:', err)
      }
    }
  }

  // Delete Comment
  const handleDeleteComment = async (commentId: string, postId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus tanggapan/komentar ini?')) {
      try {
        const res = await deleteCommentAction(commentId, postId)
        if (res.error) {
          alert(res.error)
        } else {
          // Refresh comments list
          const details = await getPostById(postId)
          setExpandedPost(details as any)
          
          // Refresh posts feed comments count
          if (groupId) {
            const pList = await getPosts(groupId)
            setPosts(pList as any[])
          }
        }
      } catch (err) {
        console.error('Failed to delete comment:', err)
      }
    }
  }

  // Filter groups search
  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(groupSearch.toLowerCase()) ||
    g.description.toLowerCase().includes(groupSearch.toLowerCase())
  )

  // Filter members search
  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.role.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.membershipLevel.toLowerCase().includes(memberSearch.toLowerCase())
  )

  // Media preview items
  const mediaItems = posts.filter(p => p.imageUrl || p.videoUrl)

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-bg-dark">
        <span className="text-xs font-geist font-bold text-primary tracking-widest uppercase animate-pulse">
          Membuka Jaringan Komunitas Teras...
        </span>
      </div>
    )
  }

  // ───────────────────────────────────────────────────────────────────────────
  // DIRECTORY VIEW: LIST OF GROUPS
  // ───────────────────────────────────────────────────────────────────────────
  if (!groupId || !selectedGroup) {
    return (
      <div className="relative min-h-screen bg-bg-dark pt-28 pb-24 px-4 md:px-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1400px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(198,169,107,0.03)_0%,transparent_80%)] pointer-events-none z-0" />

        <div className="relative z-10 max-w-[1240px] mx-auto space-y-8">
          
          {/* Header Banner */}
          <div className="border border-border-subtle bg-surface-dark p-8 md:p-12 rounded-xl text-center space-y-4 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(198,169,107,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(198,169,107,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            
            <span className="px-3 py-1 border border-primary/20 bg-primary/5 text-primary text-[10px] font-bold rounded-full tracking-widest uppercase inline-block">
              Teras Business Network
            </span>
            <h1 className="font-sora text-2xl md:text-4xl font-extrabold text-text-primary tracking-tight">
              Pusat Kolaborasi <span className="text-primary bg-clip-text">Komunitas Teras UMKM</span>
            </h1>
            <p className="text-xs md:text-sm text-text-secondary max-w-2xl mx-auto leading-relaxed">
              Bergabunglah dengan grup dan komunitas sektoral sesuai bidang usaha Anda. Diskusikan trend bisnis, cari supplier, jalin kemitraan, dan temukan solusi bersama pelaku UMKM lainnya.
            </p>

            <div className="pt-2 flex justify-center gap-3">
              {user ? (
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="px-6 py-2.5 bg-primary hover:bg-primary/95 text-surface-dark font-geist font-bold text-xs uppercase tracking-wider rounded-lg transition-colors shadow-lg shadow-primary/10 flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Buat Komunitas Baru
                </button>
              ) : (
                <Link
                  href="/auth"
                  className="px-6 py-2.5 bg-primary hover:bg-primary/95 text-surface-dark font-geist font-bold text-xs uppercase tracking-wider rounded-lg transition-colors shadow-lg"
                >
                  Masuk Untuk Membuat Komunitas
                </Link>
              )}
            </div>
          </div>

          {/* Directory Search & Filters */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border-subtle/50 pb-4">
            <h2 className="font-sora text-base font-bold text-text-primary">
              Semua Komunitas Terdaftar ({filteredGroups.length})
            </h2>
            <input
              type="text"
              value={groupSearch}
              onChange={(e) => setGroupSearch(e.target.value)}
              placeholder="Cari komunitas berdasarkan nama / deskripsi..."
              className="w-full md:w-80 h-10 px-4 bg-surface-dark border border-border-subtle rounded-lg text-xs text-text-primary focus:outline-none focus:border-primary/50"
            />
          </div>

          {/* Group Cards Grid */}
          {filteredGroups.length === 0 ? (
            <div className="text-center py-24 border border-border-subtle bg-surface-dark rounded-xl">
              <h3 className="font-sora text-sm font-bold text-text-primary mb-2">Komunitas Tidak Ditemukan</h3>
              <p className="text-xs text-text-secondary max-w-xs mx-auto">
                Silakan coba cari dengan kata kunci lain atau daftarkan komunitas bisnis baru.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGroups.map((g) => {
                const isOwner = user && g.adminId === user.id
                const isAdmin = user && user.role === 'ADMIN'
                
                return (
                  <div
                    key={g.id}
                    className={`border rounded-xl bg-surface-dark overflow-hidden flex flex-col justify-between shadow-md hover:shadow-lg transition-all duration-300 ${
                      g.isSuspended ? 'border-red-500/30 opacity-70' : 'border-border-subtle hover:border-primary/25'
                    }`}
                  >
                    {/* Card Banner */}
                    <div className="relative h-28 w-full bg-gradient-to-r from-neutral-950 via-neutral-900 to-yellow-950/20">
                      {g.coverUrl ? (
                        <img src={g.coverUrl} alt={g.name} className="object-cover w-full h-full" />
                      ) : (
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(198,169,107,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(198,169,107,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
                      )}
                      
                      {g.isSuspended && (
                        <div className="absolute inset-0 bg-red-950/50 backdrop-blur-sm flex items-center justify-center">
                          <span className="px-3 py-1 bg-red-600 text-white font-bold font-geist text-[9px] uppercase tracking-widest rounded shadow">
                            🚫 DITANGGUHKAN
                          </span>
                        </div>
                      )}

                      {/* Creator badge */}
                      {isOwner && (
                        <span className="absolute top-3 right-3 px-2 py-0.5 bg-primary/20 border border-primary/30 text-primary text-[8px] font-bold rounded uppercase">
                          Pemilik
                        </span>
                      )}
                    </div>

                    {/* Content Details */}
                    <div className="p-5 flex-grow space-y-4">
                      <div className="flex gap-4">
                        {/* Group icon */}
                        <div className="w-12 h-12 rounded-xl bg-neutral-950 border border-primary/20 flex items-center justify-center font-sora font-extrabold text-lg text-primary shadow -mt-10 z-10 flex-shrink-0">
                          {g.avatarUrl ? (
                            <img src={g.avatarUrl} alt="" className="object-cover w-full h-full rounded-xl" />
                          ) : (
                            g.name.charAt(0)
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <h3 className="font-sora text-sm font-bold text-text-primary tracking-tight line-clamp-1">
                            {g.name}
                          </h3>
                          <div className="flex items-center gap-3 text-[9px] text-text-secondary font-medium font-geist">
                            <span>{g._count.members} Anggota</span>
                            <span>•</span>
                            <span>{g._count.posts} Diskusi</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-3">
                        {g.description}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="px-5 pb-5 pt-2 flex flex-col gap-2 bg-surface-container/10 border-t border-border-subtle/50">
                      {g.isSuspended && !isAdmin ? (
                        <button
                          disabled
                          className="w-full py-2 bg-neutral-900 border border-border-subtle text-text-secondary/50 font-geist font-bold text-[10px] uppercase tracking-wider rounded-lg cursor-not-allowed"
                        >
                          Komunitas Ditangguhkan
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => router.push(`/community?groupId=${g.id}`)}
                            className="flex-1 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary hover:text-primary/90 font-geist font-bold text-[10px] uppercase tracking-wider rounded-lg transition-colors text-center"
                          >
                            Masuk Komunitas
                          </button>
                        </div>
                      )}

                      {/* Superadmin Moderation controls */}
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleToggleSuspend(g.id)}
                          className={`w-full py-1.5 border rounded font-geist font-bold text-[9px] uppercase tracking-wider transition-colors ${
                            g.isSuspended
                              ? 'bg-green-600/10 border-green-600/30 text-green-400 hover:bg-green-600/25'
                              : 'bg-red-600/10 border-red-600/30 text-red-400 hover:bg-red-600/25'
                          }`}
                        >
                          {g.isSuspended ? '🔓 Batalkan Tangguhkan' : '🚫 Tangguhkan Komunitas'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

        </div>

        {/* ── CREATE GROUP FLOATING MODAL ────────────────────────────────────── */}
        {createModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg border border-border-subtle bg-surface-dark p-6 md:p-8 rounded-xl shadow-2xl space-y-5 animate-scaleUp">
              <div className="flex justify-between items-center border-b border-border-subtle/50 pb-3">
                <h3 className="font-sora text-sm font-bold text-text-primary uppercase tracking-wider">
                  Daftarkan Komunitas Baru
                </h3>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="text-text-secondary hover:text-text-primary text-sm font-bold p-1"
                >
                  ✕
                </button>
              </div>

              {actionError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-[11px] text-red-400 font-medium">
                  {actionError}
                </div>
              )}

              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-wider">Nama Komunitas</label>
                  <input
                    type="text"
                    required
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Contoh: Pengrajin Batik Sleman"
                    className="w-full h-10 px-3 bg-surface-container border border-border-subtle rounded text-xs text-text-primary focus:outline-none focus:border-primary/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-wider">Deskripsi Singkat</label>
                  <textarea
                    required
                    value={newGroupDesc}
                    onChange={(e) => setNewGroupDesc(e.target.value)}
                    placeholder="Jelaskan bidang usaha, tujuan, dan materi diskusi yang diangkat di komunitas ini..."
                    rows={4}
                    className="w-full px-3 py-2 bg-surface-container border border-border-subtle rounded text-xs text-text-primary focus:outline-none focus:border-primary/50 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-wider font-geist">URL Foto Logo / Avatar</label>
                    <input
                      type="text"
                      value={newGroupAvatar}
                      onChange={(e) => setNewGroupAvatar(e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className="w-full h-10 px-3 bg-surface-container border border-border-subtle rounded-xl text-xs text-text-primary focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-wider font-geist">URL Cover Banner</label>
                    <input
                      type="text"
                      value={newGroupCover}
                      onChange={(e) => setNewGroupCover(e.target.value)}
                      placeholder="https://example.com/cover.jpg"
                      className="w-full h-10 px-3 bg-surface-container border border-border-subtle rounded-xl text-xs text-text-primary focus:outline-none"
                    />
                  </div>
                </div>

                {/* Tipe Komunitas & NIB */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-wider">Tipe Komunitas</label>
                    <select
                      value={groupType}
                      onChange={(e) => {
                        setGroupType(e.target.value as any)
                        setPaymentStatus('IDLE')
                      }}
                      className="w-full h-10 px-3 bg-surface-container border border-border-subtle rounded-xl text-xs text-text-primary focus:outline-none focus:border-primary/50 cursor-pointer"
                    >
                      <option value="REGULER">Reguler (Gratis)</option>
                      <option value="KOPERASI">Koperasi (Paid - Rp 150.000)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-wider">No. NIB / Legalitas</label>
                    <input
                      type="text"
                      required={groupType === 'KOPERASI'}
                      value={nib}
                      onChange={(e) => setNib(e.target.value)}
                      placeholder="e.g. 1234567890123"
                      className="w-full h-10 px-3 bg-surface-container border border-border-subtle rounded-xl text-xs text-text-primary focus:outline-none focus:border-primary/50"
                    />
                  </div>
                </div>

                {/* Cooperative Paid Module */}
                {groupType === 'KOPERASI' && (
                  <div className="p-4 border border-border-subtle bg-surface-container/50 rounded-xl space-y-4 animate-in fade-in duration-300">
                    <div className="flex justify-between items-center border-b border-border-subtle/50 pb-2">
                      <span className="text-xs font-bold text-text-primary">Invoice Registrasi Koperasi</span>
                      <span className="text-sm font-extrabold text-primary">Rp 150.000</span>
                    </div>

                    {paymentStatus !== 'SUCCESS' ? (
                      <div className="space-y-3">
                        {/* Selector */}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('QRIS')}
                            className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                              paymentMethod === 'QRIS'
                                ? 'bg-primary/10 border-primary text-primary'
                                : 'bg-surface-container border-border-subtle text-text-secondary hover:text-text-primary'
                            }`}
                          >
                            QRIS
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('BANK')}
                            className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                              paymentMethod === 'BANK'
                                ? 'bg-primary/10 border-primary text-primary'
                                : 'bg-surface-container border-border-subtle text-text-secondary hover:text-text-primary'
                            }`}
                          >
                            Transfer Bank
                          </button>
                        </div>

                        {/* QRIS Display */}
                        {paymentMethod === 'QRIS' && (
                          <div className="flex flex-col items-center py-4 bg-white rounded-xl border border-neutral-200">
                            {/* SVG Mock QR Code */}
                            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" className="text-[#111111]">
                              <rect width="24" height="24" fill="white" />
                              <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm1 1h2v2H5V5zm9-3h8v8h-8V2zm2 2v4h4V4h-4zm1 1h2v2h-2V5zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm1 1h2v2H5v-2zm12-3h2v2h-2v-2zm2 2h2v2h-2v-2zm-2 2h2v2h-2v-2zm-2-2h2v2h-2v-2zm0 4h2v2h-2v-2zm4 0h2v2h-2v-2zm-8-4h2v2H9v-2zm2 2h2v2h-2v-2zm2-2h2v2h-2v-2z" fill="currentColor" />
                              <rect x="9.5" y="9.5" width="5" height="5" fill="#2DB24A" />
                            </svg>
                            <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider mt-2">Saloka QRIS Auto-Verify</span>
                          </div>
                        )}

                        {/* Bank Display */}
                        {paymentMethod === 'BANK' && (
                          <div className="p-3 bg-surface-dark border border-border-subtle rounded-xl space-y-1 text-center">
                            <span className="text-[10px] text-text-secondary block font-bold">Transfer ke rekening berikut:</span>
                            <span className="text-xs font-black text-text-primary block font-mono">Bank Mandiri: 123-456-789-012</span>
                            <span className="text-[10px] text-text-secondary block">a/n Saloka.id (Koperasi Register)</span>
                          </div>
                        )}

                        {/* Confirm Button */}
                        <button
                          type="button"
                          onClick={handleSimulatePayment}
                          disabled={isVerifyingPayment}
                          className="w-full py-2 bg-primary text-white text-xs font-bold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
                        >
                          {isVerifyingPayment ? (
                            <>
                              <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                              Memverifikasi Pembayaran...
                            </>
                          ) : (
                            'Konfirmasi & Verifikasi Pembayaran'
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-center text-xs text-green-600 font-bold flex items-center justify-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                        Pembayaran Rp 150.000 Terverifikasi!
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-4 py-2 hover:bg-surface-container border border-border-subtle text-text-secondary hover:text-text-primary rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isPending || (groupType === 'KOPERASI' && paymentStatus !== 'SUCCESS')}
                    className="px-5 py-2 bg-primary hover:bg-primary/90 text-surface-dark font-geist font-bold text-[10px] uppercase tracking-wider rounded-xl transition-colors shadow-md disabled:opacity-50"
                  >
                    {isPending ? 'Mendaftarkan...' : 'Daftarkan Komunitas'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    )
  }

  // ───────────────────────────────────────────────────────────────────────────
  // DETAILED VIEW: SELECTED ACTIVE COMMUNITY GROUP
  // ───────────────────────────────────────────────────────────────────────────
  if (selectedGroup.isSuspended && user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-bg-dark pt-28 pb-24 px-4 flex items-center justify-center">
        <div className="max-w-md border border-red-500/20 bg-surface-dark p-8 rounded-xl text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center text-red-500 mx-auto">
            🚫
          </div>
          <h2 className="font-sora text-lg font-bold text-text-primary">Komunitas Ditangguhkan</h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            Komunitas <strong>{selectedGroup.name}</strong> saat ini sedang ditangguhkan oleh Super Admin Teras UMKM karena dinilai melanggar standar komunitas bisnis kami.
          </p>
          <div className="pt-2">
            <button
              onClick={() => router.push('/community')}
              className="px-5 py-2.5 bg-surface-container hover:bg-surface-container-high border border-border-subtle text-text-secondary hover:text-text-primary font-geist font-bold text-xs uppercase tracking-wider rounded-lg transition-colors"
            >
              Kembali ke Direktori
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-bg-dark pt-28 pb-24 px-4 md:px-10">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1400px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(198,169,107,0.03)_0%,transparent_80%)] pointer-events-none z-0" />

      <div className="relative z-10 max-w-[1240px] mx-auto space-y-6">
        
        {/* Breadcrumb Back Button */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => router.push('/community')}
            className="px-4 py-2 bg-surface-dark border border-border-subtle rounded-lg text-[10px] font-geist font-bold text-text-secondary hover:text-text-primary uppercase tracking-wider transition-colors flex items-center gap-2"
          >
            ← Kembali ke Direktori Komunitas
          </button>

          {user?.role === 'ADMIN' && (
            <button
              onClick={() => handleToggleSuspend(selectedGroup.id)}
              className={`px-4 py-2 border rounded-lg text-[10px] font-geist font-bold uppercase tracking-wider transition-colors ${
                selectedGroup.isSuspended
                  ? 'bg-green-600/10 border-green-600/30 text-green-400'
                  : 'bg-red-600/10 border-red-600/30 text-red-400'
              }`}
            >
              {selectedGroup.isSuspended ? '🔓 Batalkan Tangguhkan' : '🚫 Tangguhkan Komunitas'}
            </button>
          )}
        </div>

        {/* Group Banner Header */}
        <div className="relative border border-border-subtle bg-surface-dark rounded-xl overflow-hidden shadow-xl">
          {/* Cover Image */}
          <div className="relative h-44 md:h-64 w-full bg-gradient-to-r from-neutral-950 via-neutral-900 to-yellow-950/20 overflow-hidden border-b border-border-subtle">
            {selectedGroup.coverUrl ? (
              <img src={selectedGroup.coverUrl} alt={selectedGroup.name} className="object-cover w-full h-full" />
            ) : (
              <>
                <div className="absolute inset-0 bg-[linear-gradient(rgba(198,169,107,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(198,169,107,0.05)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-dark via-surface-dark/10 to-transparent" />
                <div className="absolute -top-10 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-80 h-40 bg-yellow-950/20 rounded-full blur-2xl" />
              </>
            )}

            {selectedGroup.isSuspended && (
              <div className="absolute inset-0 bg-red-950/60 backdrop-blur-sm flex items-center justify-center">
                <span className="px-4 py-1.5 bg-red-600 text-white font-extrabold font-geist text-xs uppercase tracking-widest rounded shadow">
                  🚫 DITANGGUHKAN MODERATOR (HANYA ADMIN YANG DAPAT MELIHAT)
                </span>
              </div>
            )}

            <div className="absolute top-6 left-6 md:left-10 px-4 py-2 border border-primary/20 bg-surface-dark/80 backdrop-blur rounded-lg flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-geist font-bold text-primary tracking-widest uppercase">TERAS BUSINESS GRUP</span>
            </div>
          </div>

          {/* Group details overlays */}
          <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-surface-dark/80 backdrop-blur-md">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-5">
              {/* Group avatar */}
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-neutral-950 border border-primary/30 flex items-center justify-center shadow-lg font-sora font-extrabold text-2xl md:text-3xl text-primary tracking-tighter -mt-12 md:-mt-16 z-20 overflow-hidden flex-shrink-0">
                {selectedGroup.avatarUrl ? (
                  <img src={selectedGroup.avatarUrl} alt="" className="object-cover w-full h-full" />
                ) : (
                  selectedGroup.name.charAt(0)
                )}
              </div>
              <div className="space-y-1">
                <h1 className="font-sora text-lg md:text-2xl font-bold text-text-primary tracking-tight">
                  {selectedGroup.name}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-[10px] md:text-xs text-text-secondary font-medium">
                  <span className="flex items-center gap-1 text-primary">
                    🛡️ Admin: {selectedGroup.admin ? selectedGroup.admin.name : 'Super Admin'}
                  </span>
                  <span>•</span>
                  <span>{members.length} Anggota</span>
                  <span>•</span>
                  <span>{posts.length} Diskusi</span>
                </div>
              </div>
            </div>

            {/* Join / Active status toggler */}
            <button
              onClick={() => handleJoinLeaveGroup(selectedGroup.id)}
              className={`px-4 py-2 border rounded font-geist font-bold text-xs uppercase tracking-wider transition-all duration-300 ${
                isMember 
                  ? "bg-primary/10 border-primary/20 hover:bg-primary/25 text-primary" 
                  : "bg-primary hover:bg-primary/90 text-surface-dark border-primary"
              }`}
            >
              {isMember ? "✓ Anggota" : "Gabung Grup"}
            </button>
          </div>

          {/* Group subnavigation tabs */}
          <div className="border-t border-border-subtle bg-surface-container/30 px-6 md:px-10 flex gap-6 overflow-x-auto scrollbar-hide">
            {(['Diskusi', 'Media', 'Anggota', 'Tentang'] as const).map((tab) => {
              const active = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 text-[11px] font-bold uppercase tracking-wider transition-all relative whitespace-nowrap ${
                    active ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {tab}
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── TAB CONTENT: DISKUSI (Feed & Composer) ─────────────────────────── */}
        {activeTab === 'Diskusi' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Feed and composer column */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* COMPOSER FORM (Only for active members) */}
              {user && isMember && (
                <div className="border border-border-subtle bg-surface-dark p-5 rounded-xl space-y-4 shadow-md">
                  <div className="flex gap-4 items-center">
                    <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-sora font-extrabold text-xs text-primary flex-shrink-0">
                      {user.name.charAt(0)}
                    </div>
                    
                    <button
                      onClick={() => setComposerExpanded(true)}
                      className="flex-grow h-11 px-5 bg-surface-container border border-border-subtle hover:border-primary/25 rounded-full text-left text-xs text-text-secondary/60 hover:text-text-primary/70 transition-all flex items-center"
                    >
                      Bagikan ide atau ajukan pertanyaan ke grup, {user.name.split(' ')[0]}...
                    </button>
                  </div>

                  {/* Actions Bar (visible always) */}
                  <div className="flex justify-between items-center pt-3 border-t border-border-subtle/50 text-[10px] font-semibold text-text-secondary">
                    <button 
                      onClick={() => { setComposerExpanded(true); setTimeout(() => document.getElementById('post-image-url')?.focus(), 100); }} 
                      className="flex items-center gap-2 hover:text-text-primary px-3 py-2 rounded-lg hover:bg-surface-container transition-colors"
                    >
                      🟢 Gambar Link (JPG/PNG)
                    </button>
                    
                    <button 
                      onClick={() => { setComposerExpanded(true); setTimeout(() => document.getElementById('post-video-url')?.focus(), 100); }}
                      className="flex items-center gap-2 hover:text-text-primary px-3 py-2 rounded-lg hover:bg-surface-container transition-colors"
                    >
                      🔴 Video Link (MP4)
                    </button>

                    <button 
                      onClick={() => setComposerExpanded(true)}
                      className="flex items-center gap-2 hover:text-text-primary px-3 py-2 rounded-lg hover:bg-surface-container transition-colors"
                    >
                      📁 Kategori Obrolan
                    </button>
                  </div>

                  {/* Expanded composer inputs block */}
                  {composerExpanded && (
                    <form onSubmit={handleCreatePost} className="pt-4 border-t border-border-subtle space-y-4 animate-fadeIn">
                      {actionError && (
                        <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-[11px] text-red-400 font-medium">
                          {actionError}
                        </div>
                      )}
                      
                      <div className="space-y-3">
                        <input
                          type="text"
                          required
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          placeholder="Judul Diskusi"
                          className="w-full h-11 px-4 bg-surface-container border border-border-subtle rounded text-xs text-text-primary focus:outline-none focus:border-primary/50"
                        />
                        
                        <textarea
                          required
                          value={newContent}
                          onChange={(e) => setNewContent(e.target.value)}
                          placeholder="Tulis detail postingan Anda..."
                          rows={4}
                          className="w-full px-4 py-3 bg-surface-container border border-border-subtle rounded text-xs text-text-primary focus:outline-none focus:border-primary/50 resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[8px] font-bold text-text-secondary uppercase tracking-wider mb-1">Kategori Obrolan</label>
                          <select
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            className="w-full h-10 px-3 bg-surface-container border border-border-subtle rounded text-xs text-text-primary focus:outline-none"
                          >
                            {CATEGORIES.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[8px] font-bold text-text-secondary uppercase tracking-wider mb-1">Link Gambar (jpg/png)</label>
                          <input
                            id="post-image-url"
                            type="text"
                            value={newImageUrl}
                            onChange={(e) => setNewImageUrl(e.target.value)}
                            placeholder="Contoh: produk.jpg"
                            className="w-full h-10 px-3 bg-surface-container border border-border-subtle rounded text-xs text-text-primary focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] font-bold text-text-secondary uppercase tracking-wider mb-1">Link Video (mp4)</label>
                          <input
                            id="post-video-url"
                            type="text"
                            value={newVideoUrl}
                            onChange={(e) => setNewVideoUrl(e.target.value)}
                            placeholder="Contoh: presentasi.mp4"
                            className="w-full h-10 px-3 bg-surface-container border border-border-subtle rounded text-xs text-text-primary focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setComposerExpanded(false)}
                          className="px-4 py-2 hover:bg-surface-container border border-border-subtle text-text-secondary hover:text-text-primary rounded text-[10px] font-bold uppercase tracking-wider transition-colors"
                        >
                          Batal
                        </button>
                        
                        <button
                          type="submit"
                          disabled={isPending}
                          className="px-5 py-2 bg-primary hover:bg-primary/90 text-surface-dark rounded text-[10px] font-bold uppercase tracking-wider transition-colors shadow-md disabled:opacity-50"
                        >
                          {isPending ? 'Menerbitkan...' : 'Terbitkan'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* POSTS LIST (FEED) */}
              <div className="space-y-6">
                {posts.length === 0 ? (
                  <div className="text-center py-20 border border-border-subtle bg-surface-dark rounded-xl">
                    <h3 className="font-sora text-sm font-bold text-text-primary mb-2">Forum Masih Sunyi</h3>
                    <p className="text-xs text-text-secondary max-w-xs mx-auto">
                      Belum ada obrolan di grup ini. Bagikan sesuatu atau tanyakan sesuatu untuk memulai diskusi hari ini!
                    </p>
                  </div>
                ) : (
                  posts.map((post) => {
                    const date = new Date(post.createdAt)
                    const isExpanded = post.id === expandedId
                    const isLiked = user && post.likes.includes(user.id)
                    const categoryLabel = CATEGORIES.find(c => c.value === post.category)?.label || `💬 ${post.category}`
                    
                    // Permission deletion flags
                    const isPostAuthor = user && post.authorId === user.id
                    const isGroupAdmin = user && selectedGroup.adminId === user.id
                    const isSuperAdmin = user && user.role === 'ADMIN'
                    const canDeletePost = isPostAuthor || isGroupAdmin || isSuperAdmin

                    return (
                      <div
                        key={post.id}
                        className={`border rounded-xl bg-surface-dark overflow-hidden transition-all duration-300 ${
                          isExpanded ? 'border-primary/45 shadow-lg' : 'border-border-subtle hover:border-primary/20'
                        }`}
                      >
                        {/* Header Details */}
                        <div className="p-5 flex justify-between items-start gap-4">
                          <div className="flex gap-3.5 items-center">
                            {/* Author avatar */}
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-yellow-950/20 border border-primary/25 flex items-center justify-center font-sora font-extrabold text-xs text-primary flex-shrink-0">
                              {post.author ? post.author.name.charAt(0) : 'A'}
                            </div>
                            
                            <div>
                              <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-text-secondary">
                                {post.author ? (
                                  <Link
                                    href={`/profile/${post.author.id}`}
                                    className="font-bold text-text-primary hover:text-primary transition-colors underline decoration-dotted decoration-primary/20"
                                  >
                                    {post.author.name}
                                  </Link>
                                ) : (
                                  <span className="font-bold text-text-primary">Anonim</span>
                                )}
                                
                                {post.author?.role && (
                                  <span className="px-1.5 py-0.2 bg-primary/10 border border-primary/20 text-primary font-bold rounded uppercase text-[8px]">
                                    {post.author.role}
                                  </span>
                                )}

                                {post.author?.level && (
                                  <span className="px-1.5 py-0.2 bg-neutral-900 border border-border-subtle text-[8px] font-bold rounded">
                                    Lvl {post.author.level}
                                  </span>
                                )}
                                
                                <span>•</span>
                                <span className="font-geist">{date.toLocaleDateString('id-ID')}</span>
                              </div>
                              
                              {/* Category pill */}
                              <div className="mt-1 flex items-center gap-1">
                                <span className="px-2 py-0.5 bg-surface-container border border-border-subtle rounded text-[9px] font-bold text-text-secondary uppercase">
                                  {categoryLabel}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Delete Post Button */}
                          {canDeletePost && (
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="px-2 py-1 bg-red-950/20 hover:bg-red-950/40 border border-red-500/30 rounded text-red-400 hover:text-red-300 font-geist text-[8px] font-bold uppercase tracking-wider transition-colors"
                            >
                              Hapus
                            </button>
                          )}
                        </div>

                        {/* Title & Body content */}
                        <div className="px-5 pb-4 space-y-3">
                          <h3 
                            onClick={() => handleExpand(post.id)}
                            className="font-sora text-sm md:text-base font-bold text-text-primary hover:text-primary transition-colors cursor-pointer"
                          >
                            {post.title}
                          </h3>
                          <p className="text-xs md:text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                            {post.content}
                          </p>
                        </div>

                        {/* MEDIA ATTACHMENTS (Links rendered beautifully) */}
                        {post.imageUrl && (
                          <div className="relative w-full aspect-[16/9] border-y border-border-subtle overflow-hidden bg-neutral-900 flex items-center justify-center">
                            {post.imageUrl.startsWith('http') ? (
                              <img
                                src={post.imageUrl}
                                alt={post.title}
                                className="object-cover w-full h-full hover:scale-[1.02] transition-transform duration-700 cursor-pointer"
                                onClick={() => handleExpand(post.id)}
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-yellow-950/5 text-center p-4">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-primary mb-2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                                </svg>
                                <span className="text-[10px] font-bold text-text-primary uppercase tracking-wider mb-0.5">Lampiran File Gambar</span>
                                <span className="text-[9px] font-mono text-primary">{post.imageUrl}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {post.videoUrl && (
                          <div className="relative w-full aspect-[16/9] border-y border-border-subtle overflow-hidden bg-neutral-950 flex items-center justify-center">
                            {post.videoUrl.startsWith('http') ? (
                              playingVideoId === post.id ? (
                                <video 
                                  src={post.videoUrl} 
                                  controls 
                                  autoPlay 
                                  className="w-full h-full"
                                />
                              ) : (
                                <div 
                                  onClick={() => setPlayingVideoId(post.id)}
                                  className="absolute inset-0 group flex items-center justify-center cursor-pointer bg-neutral-900/40"
                                >
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                                  <div className="w-16 h-16 rounded-full bg-primary text-surface-dark flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 z-10">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 ml-1">
                                      <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between text-white/90 z-10">
                                    <span className="text-[10px] font-bold font-geist tracking-wider uppercase bg-black/60 backdrop-blur px-2.5 py-1 rounded">Putar Video Real</span>
                                  </div>
                                </div>
                              )
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-yellow-950/5 text-center p-4">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-primary mb-2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                                </svg>
                                <span className="text-[10px] font-bold text-text-primary uppercase tracking-wider mb-0.5">Lampiran File Video</span>
                                <span className="text-[9px] font-mono text-primary">{post.videoUrl}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Likes & Comments Counters */}
                        <div className="px-5 py-3 flex justify-between items-center text-[10px] text-text-secondary/70 font-semibold border-b border-border-subtle/50">
                          <div className="flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[8px] text-primary">👍</span>
                            <span>{post.likes.length} menyukai</span>
                          </div>
                          <button onClick={() => handleExpand(post.id)} className="hover:text-primary transition-colors">
                            {post._count.comments} komentar
                          </button>
                        </div>

                        {/* REACT ACTION BUTTONS */}
                        <div className="px-3 py-1 flex justify-around items-center text-xs text-text-secondary font-bold">
                          <button
                            onClick={() => handleLike(post.id)}
                            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-surface-container/60 transition-colors ${
                              isLiked ? 'text-primary' : ''
                            }`}
                          >
                            👍 {isLiked ? 'Menyukai' : 'Suka'}
                          </button>

                          <button
                            onClick={() => handleExpand(post.id)}
                            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-surface-container/60 transition-colors ${
                              isExpanded ? 'text-primary' : ''
                            }`}
                          >
                            💬 Komentar
                          </button>
                        </div>

                        {/* COLLAPSED EXPANDED COMMENTS SECTION */}
                        {isExpanded && (
                          <div className="px-5 pb-5 pt-3 border-t border-border-subtle bg-surface-container/10">
                            <div className="border-t border-border-subtle/50 pt-5 mb-4">
                              <h4 className="font-sora text-xs font-bold text-text-primary mb-4 flex items-center gap-2">
                                Tanggapan ({expandedPost?.comments.length ?? 0})
                              </h4>

                              {/* Comment List */}
                              {!expandedPost ? (
                                <div className="text-center py-6 text-xs text-primary/60 font-semibold animate-pulse">
                                  Memuat tanggapan...
                                </div>
                              ) : expandedPost.comments.length === 0 ? (
                                <div className="text-xs text-text-secondary/60 mb-6 italic">
                                  Belum ada tanggapan di sini. Jadilah yang pertama memberikan solusi!
                                </div>
                              ) : (
                                <div className="space-y-3.5 mb-6">
                                  {expandedPost.comments.map((comment) => {
                                    const cDate = new Date(comment.createdAt)
                                    const isCommentAuthor = user && comment.authorId === user.id
                                    const canDeleteComment = isCommentAuthor || isGroupAdmin || isSuperAdmin
                                    
                                    return (
                                      <div
                                        key={comment.id}
                                        className="p-4 bg-surface-container/40 border border-border-subtle/70 rounded-lg text-xs hover:border-primary/10 transition-all flex justify-between gap-4 items-start"
                                      >
                                        <div className="space-y-1 flex-grow">
                                          <div className="flex items-center gap-1.5 text-[10px] text-text-secondary">
                                            {comment.author ? (
                                              <Link
                                                href={`/profile/${comment.author.id}`}
                                                className="font-bold text-text-primary hover:text-primary transition-colors underline decoration-dotted decoration-primary/20"
                                              >
                                                {comment.author.name}
                                              </Link>
                                            ) : (
                                              <span className="font-bold text-text-primary">Anonim</span>
                                            )}
                                            {comment.author?.role && (
                                              <span className="px-1.5 py-0.2 bg-primary/10 border border-primary/20 text-primary text-[8px] font-bold rounded uppercase">
                                                {comment.author.role}
                                              </span>
                                            )}
                                            {comment.author?.level && (
                                              <span className="px-1.5 py-0.2 bg-neutral-900 border border-border-subtle text-[8px] font-bold rounded">
                                                Lvl {comment.author.level}
                                              </span>
                                            )}
                                            <span>•</span>
                                            <span className="font-geist">{cDate.toLocaleDateString('id-ID')}</span>
                                          </div>
                                          <p className="text-text-secondary leading-relaxed whitespace-pre-wrap">
                                            {comment.content}
                                          </p>
                                        </div>

                                        {canDeleteComment && (
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteComment(comment.id, post.id)}
                                            className="text-red-500 hover:text-red-400 font-bold font-geist text-[8px] uppercase tracking-wider p-1"
                                          >
                                            Hapus
                                          </button>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              )}

                              {/* Create Comment Form */}
                              {user && isMember ? (
                                <form onSubmit={handleCreateComment} className="space-y-3">
                                  {replyError && (
                                    <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-[11px] text-red-400 font-medium">
                                      {replyError}
                                    </div>
                                  )}
                                  
                                  <div className="flex gap-3 items-start">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-sora font-extrabold text-[10px] text-primary flex-shrink-0">
                                      {user.name.charAt(0)}
                                    </div>
                                    
                                    <div className="flex-grow space-y-3">
                                      <textarea
                                        id="reply-textarea"
                                        required
                                        value={replyContent}
                                        onChange={(e) => setReplyContent(e.target.value)}
                                        placeholder="Tulis komentar atau tanggapan..."
                                        rows={3}
                                        className="w-full px-4 py-3 bg-surface-container border border-border-subtle rounded-lg text-xs text-text-primary focus:outline-none focus:border-primary/50 transition-colors resize-none"
                                      />
                                      <button
                                        id="reply-submit-btn"
                                        type="submit"
                                        disabled={isReplyPending}
                                        className="px-4 py-2 bg-primary hover:bg-primary/95 text-surface-dark font-geist font-bold text-[10px] uppercase tracking-wider rounded transition-colors shadow disabled:opacity-50"
                                      >
                                        {isReplyPending ? 'Mengirim...' : 'Kirim Balasan'}
                                      </button>
                                    </div>
                                  </div>
                                </form>
                              ) : (
                                <div className="p-4 bg-surface-container/50 border border-border-subtle rounded-lg text-center text-xs text-text-secondary">
                                  {isMember 
                                    ? 'Silakan masuk ke terminal akun untuk menulis tanggapan.' 
                                    : 'Silakan bergabung dengan komunitas ini terlebih dahulu untuk menulis tanggapan.'}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Right sidebar column widgets */}
            <div className="space-y-6">
              
              {/* WIDGET 1: ABOUT COMPACT */}
              <div className="border border-border-subtle bg-surface-dark p-6 rounded-xl space-y-4 shadow-md">
                <h3 className="font-sora text-sm font-bold text-text-primary uppercase tracking-wider border-b border-border-subtle/50 pb-2">
                  Tentang Grup
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {selectedGroup.description}
                </p>
                <div className="text-[10px] font-semibold text-text-secondary space-y-2 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>Tipe Komunitas: <strong>Sektoral Bisnis</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>Status: <strong>{selectedGroup.isSuspended ? '🚫 Ditangguhkan' : '🟢 Aktif'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>Dibuat: <strong>{new Date(selectedGroup.createdAt).toLocaleDateString('id-ID')}</strong></span>
                  </div>
                </div>
              </div>

              {/* WIDGET 2: TOP CONTRIBUTORS */}
              <div className="border border-border-subtle bg-surface-dark p-6 rounded-xl space-y-4 shadow-md">
                <h3 className="font-sora text-sm font-bold text-text-primary uppercase tracking-wider border-b border-border-subtle/50 pb-2">
                  Anggota Aktif ({members.slice(0,5).length})
                </h3>
                <div className="space-y-3.5">
                  {members.slice(0, 5).map((m) => (
                    <div key={m.id} className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-sora font-extrabold text-[10px] text-primary">
                          {m.name.charAt(0)}
                        </div>
                        <div>
                          <Link href={`/profile/${m.id}`} className="text-xs font-bold text-text-primary hover:text-primary transition-colors block">
                            {m.name.split(' ').slice(0, 2).join(' ')}
                          </Link>
                          <span className="text-[9px] text-text-secondary/70 uppercase font-semibold">{m.role}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-neutral-900 border border-border-subtle rounded text-[9px] font-bold text-primary">
                        Lvl {m.level}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* WIDGET 3: RECENT MEDIA PREVIEW */}
              <div className="border border-border-subtle bg-surface-dark p-6 rounded-xl space-y-4 shadow-md">
                <div className="flex justify-between items-center border-b border-border-subtle/50 pb-2">
                  <h3 className="font-sora text-sm font-bold text-text-primary uppercase tracking-wider">
                    Galeri Media
                  </h3>
                  <button onClick={() => setActiveTab('Media')} className="text-[10px] text-primary font-bold hover:underline">
                    Lihat Semua
                  </button>
                </div>
                
                {mediaItems.length === 0 ? (
                  <p className="text-xs text-text-secondary/60 italic text-center py-4">Belum ada foto/video dibagikan.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {mediaItems.slice(0, 6).map((item) => (
                      <div 
                        key={item.id}
                        onClick={() => handleExpand(item.id)}
                        className="aspect-square bg-neutral-900 border border-border-subtle/60 rounded overflow-hidden cursor-pointer hover:opacity-85 transition-opacity relative group"
                      >
                        {item.imageUrl && item.imageUrl.startsWith('http') ? (
                          <img src={item.imageUrl} alt="" className="object-cover w-full h-full" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-yellow-950/20">
                            <span className="text-[8px] text-primary font-mono text-center overflow-hidden whitespace-nowrap text-ellipsis px-1">{item.imageUrl || item.videoUrl || 'Media'}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB CONTENT: MEDIA (Attachments Gallery) ───────────────────────── */}
        {activeTab === 'Media' && (
          <div className="border border-border-subtle bg-surface-dark p-6 md:p-8 rounded-xl space-y-6 shadow-md">
            <div>
              <h2 className="font-sora text-base font-bold text-text-primary mb-1">Galeri Media Grup</h2>
              <p className="text-xs text-text-secondary">Foto dan video yang telah dibagikan oleh anggota di komunitas ini.</p>
            </div>
            
            {mediaItems.length === 0 ? (
              <div className="text-center py-20 text-xs text-text-secondary/60 italic">
                Belum ada media dibagikan di grup ini.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {mediaItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => { setActiveTab('Diskusi'); handleExpand(item.id); }}
                    className="group relative aspect-video bg-neutral-950 border border-border-subtle rounded-lg overflow-hidden cursor-pointer hover:border-primary/40 transition-colors shadow-sm"
                  >
                    {item.imageUrl && item.imageUrl.startsWith('http') ? (
                      <img src={item.imageUrl} alt="" className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-neutral-900 to-yellow-950/20 text-white/90 p-2 text-center">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-primary mb-1">Lampiran File</span>
                        <span className="text-[8px] font-mono text-text-secondary truncate w-full">{item.imageUrl || item.videoUrl}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB CONTENT: ANGGOTA (Real Members list) ─────────────────────────── */}
        {activeTab === 'Anggota' && (
          <div className="border border-border-subtle bg-surface-dark p-6 md:p-8 rounded-xl space-y-6 shadow-md">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-subtle/50 pb-4">
              <div>
                <h2 className="font-sora text-base font-bold text-text-primary mb-1">Daftar Anggota Komunitas ({members.length})</h2>
                <p className="text-xs text-text-secondary">Daftar wirausahawan aktif yang tergabung dalam grup komunitas ini.</p>
              </div>

              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Cari anggota berdasarkan nama / role..."
                className="w-full sm:w-72 h-10 px-4 bg-surface-container border border-border-subtle rounded-lg text-xs text-text-primary focus:outline-none focus:border-primary/50"
              />
            </div>

            {filteredMembers.length === 0 ? (
              <div className="text-center py-20 text-xs text-text-secondary/60 italic">
                Anggota tidak ditemukan. Coba kata kunci lainnya.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMembers.map((member) => (
                  <div
                    key={member.id}
                    className="p-4 bg-surface-container/20 border border-border-subtle hover:border-primary/20 rounded-xl flex items-center justify-between gap-4 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-sora font-extrabold text-sm text-primary">
                        {member.name.charAt(0)}
                      </div>
                      
                      <div className="space-y-0.5">
                        <Link href={`/profile/${member.id}`} className="text-xs font-bold text-text-primary hover:text-primary transition-colors block">
                          {member.name}
                        </Link>
                        <div className="flex items-center gap-2 text-[9px] text-text-secondary font-semibold uppercase">
                          <span>{member.role}</span>
                          {member.membershipLevel && (
                            <>
                              <span>•</span>
                              <span className="text-primary">{member.membershipLevel}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <span className="inline-block px-2.5 py-0.5 bg-neutral-900 border border-border-subtle rounded text-[10px] font-bold text-primary">
                        Lvl {member.level}
                      </span>
                      <p className="text-[8px] text-text-secondary/60 font-medium font-geist">{member.xp} XP</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB CONTENT: TENTANG (Rules & Info) ───────────────────────────────── */}
        {activeTab === 'Tentang' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Description and Rules */}
            <div className="lg:col-span-2 space-y-6">
              <div className="border border-border-subtle bg-surface-dark p-6 md:p-8 rounded-xl space-y-4 shadow-md">
                <h2 className="font-sora text-base font-bold text-text-primary border-b border-border-subtle pb-3">Deskripsi Komunitas</h2>
                <p className="text-xs md:text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                  {selectedGroup.description}
                </p>
              </div>

              <div className="border border-border-subtle bg-surface-dark p-6 md:p-8 rounded-xl space-y-4 shadow-md">
                <h2 className="font-sora text-base font-bold text-text-primary border-b border-border-subtle pb-3">Aturan Anggota Grup</h2>
                
                <div className="space-y-4 pt-2">
                  <div className="flex gap-4 items-start">
                    <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/25 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0">1</div>
                    <div>
                      <h4 className="text-xs font-bold text-text-primary mb-1">Diskusi Relevan & Profesional</h4>
                      <p className="text-[11px] text-text-secondary">Posting dan komentar harus relevan dengan topik industri grup ini. Hormati hak cipta, merek dagang, dan hindari spamming.</p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/25 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0">2</div>
                    <div>
                      <h4 className="text-xs font-bold text-text-primary mb-1">Dilarang Penipuan / SARA</h4>
                      <p className="text-[11px] text-text-secondary">Tindakan penipuan, penghinaan SARA, dan share link berbahaya akan langsung dihapus oleh moderator/admin dengan sanksi banned.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="border border-border-subtle bg-surface-dark p-6 rounded-xl space-y-4 shadow-md">
              <h2 className="font-sora text-sm font-bold text-text-primary uppercase tracking-wider border-b border-border-subtle pb-2">Informasi Instan</h2>
              
              <div className="space-y-3 pt-2 text-xs text-text-secondary">
                <div className="flex justify-between border-b border-border-subtle/40 pb-2">
                  <span className="font-medium">Admin Grup</span>
                  <span className="font-bold text-primary">{selectedGroup.admin ? selectedGroup.admin.name : 'Super Admin'}</span>
                </div>
                <div className="flex justify-between border-b border-border-subtle/40 pb-2">
                  <span className="font-medium">Total Anggota</span>
                  <span className="font-bold text-text-primary">{members.length} Orang</span>
                </div>
                <div className="flex justify-between border-b border-border-subtle/40 pb-2">
                  <span className="font-medium">Total Postingan</span>
                  <span className="font-bold text-text-primary">{posts.length} Thread</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="font-medium">Tanggal Dibuat</span>
                  <span className="font-bold text-text-primary">{new Date(selectedGroup.createdAt).toLocaleDateString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
