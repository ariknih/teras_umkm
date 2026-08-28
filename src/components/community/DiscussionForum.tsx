'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { 
  MessageSquare, Plus, Search, MessageCircle, Check, ThumbsUp, 
  Share2, CornerDownRight, MoreVertical, AlertCircle, Trash2, 
  Edit3, Pin, Lock, Unlock, ChevronRight, ArrowLeft, Tag, Send, Loader2
} from 'lucide-react'
import { goeyToast } from 'goey-toast'
import { 
  getDiscussionsAction, createDiscussionAction, updateDiscussionAction, 
  deleteDiscussionAction, togglePinDiscussionAction, toggleCloseDiscussionAction, 
  createDiscussionReplyAction, deleteDiscussionReplyAction, toggleHelpfulReplyAction, 
  selectBestReplyAction, toggleLikeDiscussionAction 
} from '@/app/actions/discussion'
import { ForumPostSkeleton } from '@/components/ui/GhostSkeleton'

interface DiscussionForumProps {
  communityId: string
  communityName: string
  communityLogo: string | null
  communityMembersCount: number
  currentUser: any
  isCanManageCoop: boolean
  isMember: boolean
}

export default function DiscussionForum({
  communityId,
  communityName,
  communityLogo,
  communityMembersCount,
  currentUser,
  isCanManageCoop,
  isMember
}: DiscussionForumProps) {
  const [isPending, startTransition] = useTransition()
  const [discussions, setDiscussions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [visibleCount, setVisibleCount] = useState(6)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Navigation states
  const [view, setView] = useState<'list' | 'create' | 'edit' | 'detail'>('list')
  const [selectedDiscussion, setSelectedDiscussion] = useState<any>(null)
  
  // Filter & Search states
  const [categoryFilter, setCategoryFilter] = useState<string>('Semua')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [sortOption, setSortOption] = useState<'terbaru' | 'terpopuler' | 'belum_terjawab'>('terbaru')

  // Form states
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Tanya Jawab')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  // Reply state
  const [replyContent, setReplyContent] = useState('')
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

  // Load discussions
  const loadDiscussions = async () => {
    setIsLoading(true)
    try {
      const data = await getDiscussionsAction(communityId)
      setDiscussions(data)
    } catch (e: any) {
      goeyToast.error('Gagal memuat diskusi.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDiscussions()
  }, [communityId])

  // Handle create
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !category || !content) {
      goeyToast.error('Harap isi semua kolom wajib!')
      return
    }

    const formData = new FormData()
    formData.append('communityId', communityId)
    formData.append('title', title)
    formData.append('category', category)
    formData.append('content', content)
    formData.append('tags', tags)

    startTransition(async () => {
      const res = await createDiscussionAction(formData) as any
      if (res.error) {
        goeyToast.error(res.error)
      } else {
        goeyToast.success('Topik diskusi berhasil dipublikasikan!')
        setTitle('')
        setCategory('Tanya Jawab')
        setContent('')
        setTags('')
        setView('list')
        loadDiscussions()
      }
    })
  }

  // Handle edit
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId || !title || !category || !content) {
      goeyToast.error('Harap isi semua kolom wajib!')
      return
    }

    const formData = new FormData()
    formData.append('title', title)
    formData.append('category', category)
    formData.append('content', content)
    formData.append('tags', tags)

    startTransition(async () => {
      const res = await updateDiscussionAction(editingId, communityId, formData) as any
      if (res.error) {
        goeyToast.error(res.error)
      } else {
        goeyToast.success('Topik diskusi berhasil diperbarui!')
        setTitle('')
        setCategory('Tanya Jawab')
        setContent('')
        setTags('')
        setEditingId(null)
        setView('list')
        loadDiscussions()
      }
    })
  }

  // Handle toggle like on discussion
  const handleToggleLike = async (discussionId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (!currentUser) {
      goeyToast.error('Silakan masuk terlebih dahulu untuk menyukai topik ini.')
      return
    }

    // Optimistic UI update for instant feedback
    setDiscussions(prev => prev.map(d => {
      if (d.id === discussionId) {
        const likes = Array.isArray(d.likes) ? [...d.likes] : []
        const idx = likes.indexOf(currentUser.id)
        if (idx !== -1) {
          likes.splice(idx, 1)
        } else {
          likes.push(currentUser.id)
        }
        return { ...d, likes, likesCount: likes.length }
      }
      return d
    }))

    if (selectedDiscussion && selectedDiscussion.id === discussionId) {
      setSelectedDiscussion((prev: any) => {
        if (!prev) return prev
        const likes = Array.isArray(prev.likes) ? [...prev.likes] : []
        const idx = likes.indexOf(currentUser.id)
        if (idx !== -1) {
          likes.splice(idx, 1)
        } else {
          likes.push(currentUser.id)
        }
        return { ...prev, likes, likesCount: likes.length }
      })
    }

    try {
      const res = await toggleLikeDiscussionAction(discussionId, communityId) as any
      if (res.error) {
        goeyToast.error(res.error)
        loadDiscussions()
      }
    } catch (_) {}
  }

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus diskusi ini? Semua balasan juga akan terhapus.')) return
    startTransition(async () => {
      const res = await deleteDiscussionAction(id, communityId) as any
      if (res.error) {
        goeyToast.error(res.error)
      } else {
        goeyToast.success('Diskusi berhasil dihapus!')
        if (selectedDiscussion && selectedDiscussion.id === id) {
          setSelectedDiscussion(null)
          setView('list')
        }
        loadDiscussions()
      }
    })
  }

  // Handle toggle pin
  const handleTogglePin = async (id: string) => {
    startTransition(async () => {
      const res = await togglePinDiscussionAction(id, communityId) as any
      if (res.error) {
        goeyToast.error(res.error)
      } else {
        goeyToast.success(res.discussion?.isPinned ? 'Diskusi disematkan (pinned)!' : 'Diskusi dilepas semat!')
        if (selectedDiscussion && selectedDiscussion.id === id) {
          setSelectedDiscussion(res.discussion)
        }
        loadDiscussions()
      }
    })
  }

  // Handle toggle close
  const handleToggleClose = async (id: string) => {
    startTransition(async () => {
      const res = await toggleCloseDiscussionAction(id, communityId) as any
      if (res.error) {
        goeyToast.error(res.error)
      } else {
        goeyToast.success(res.discussion?.isClosed ? 'Diskusi ditutup!' : 'Diskusi dibuka kembali!')
        if (selectedDiscussion && selectedDiscussion.id === id) {
          setSelectedDiscussion(res.discussion)
        }
        loadDiscussions()
      }
    })
  }

  // Handle reply
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyContent.trim()) return

    startTransition(async () => {
      const res = await createDiscussionReplyAction(selectedDiscussion.id, communityId, replyContent) as any
      if (res.error) {
        goeyToast.error(res.error)
      } else {
        goeyToast.success('Balasan berhasil dikirim!')
        setReplyContent('')
        
        // Refresh details in selectedDiscussion locally to avoid page reload stutter
        const updatedDiscussions = await getDiscussionsAction(communityId)
        setDiscussions(updatedDiscussions)
        const updated = updatedDiscussions.find((d: any) => d.id === selectedDiscussion.id)
        if (updated) setSelectedDiscussion(updated)
      }
    })
  }

  // Handle delete reply
  const handleDeleteReply = async (replyId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus balasan ini?')) return
    startTransition(async () => {
      const res = await deleteDiscussionReplyAction(replyId, communityId) as any
      if (res.error) {
        goeyToast.error(res.error)
      } else {
        goeyToast.success('Balasan berhasil dihapus!')
        const updatedDiscussions = await getDiscussionsAction(communityId)
        setDiscussions(updatedDiscussions)
        const updated = updatedDiscussions.find((d: any) => d.id === selectedDiscussion.id)
        if (updated) setSelectedDiscussion(updated)
      }
    })
  }

  // Handle helpful reply toggle
  const handleToggleHelpful = async (replyId: string) => {
    if (!isMember && !isCanManageCoop) {
      goeyToast.error('Anda harus bergabung dengan komunitas untuk memberikan tanda membantu.')
      return
    }
    startTransition(async () => {
      const res = await toggleHelpfulReplyAction(replyId, communityId) as any
      if (res.error) {
        goeyToast.error(res.error)
      } else {
        const updatedDiscussions = await getDiscussionsAction(communityId)
        setDiscussions(updatedDiscussions)
        const updated = updatedDiscussions.find((d: any) => d.id === selectedDiscussion.id)
        if (updated) setSelectedDiscussion(updated)
      }
    })
  }

  // Handle select best reply
  const handleSelectBestReply = async (replyId: string) => {
    startTransition(async () => {
      const res = await selectBestReplyAction(selectedDiscussion.id, replyId, communityId) as any
      if (res.error) {
        goeyToast.error(res.error)
      } else {
        goeyToast.success('Jawaban terbaik diperbarui!')
        const updatedDiscussions = await getDiscussionsAction(communityId)
        setDiscussions(updatedDiscussions)
        const updated = updatedDiscussions.find((d: any) => d.id === selectedDiscussion.id)
        if (updated) setSelectedDiscussion(updated)
      }
    })
  }

  // Copy discussion link to clipboard
  const handleShare = (discussionId: string) => {
    const shareUrl = `${window.location.origin}/community/${communityId}?tab=diskusi&topic=${discussionId}`
    navigator.clipboard.writeText(shareUrl)
    goeyToast.success('Tautan diskusi disalin ke papan klip!')
  }

  // Categories list
  const categories = ['Semua', 'Tanya Jawab', 'Tips & Pengalaman', 'Kolaborasi', 'Diskusi Umum']

  // Filtered discussions
  const filteredDiscussions = discussions
    .filter((d: any) => {
      const matchesCategory = categoryFilter === 'Semua' || d.category === categoryFilter
      const matchesSearch = searchQuery.trim() === '' || 
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        d.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.tags.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
    .sort((a: any, b: any) => {
      // Pin is always on top
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
      
      if (sortOption === 'terpopuler') {
        const repliesA = a.replies?.length || 0
        const repliesB = b.replies?.length || 0
        return repliesB - repliesA
      }
      if (sortOption === 'belum_terjawab') {
        const answeredA = a.bestReplyId ? 1 : 0
        const answeredB = b.bestReplyId ? 1 : 0
        if (answeredA !== answeredB) return answeredA - answeredB // 0 comes first (unanswered)
      }
      // default: terbaru
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      {view === 'list' && (
        <div className="p-6 bg-white border border-gray-200/80 rounded-3xl shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-200">
          <div>
            <h2 className="text-xl font-black text-gray-900 font-sora flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-[#2DB24A]" /> Forum Diskusi {communityName}
            </h2>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Tempat anggota berbagi pengalaman, bertanya, berdiskusi, dan saling membantu.
            </p>
          </div>
          {isMember || isCanManageCoop ? (
            <button
              onClick={() => {
                setTitle('')
                setCategory('Tanya Jawab')
                setContent('')
                setTags('')
                setView('create')
              }}
              className="px-4 py-2.5 bg-[#2DB24A] hover:bg-[#24943E] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" /> Buat Topik Diskusi
            </button>
          ) : (
            <div className="px-4 py-2.5 bg-gray-100 text-gray-400 font-bold text-xs rounded-xl flex items-center gap-2 select-none">
              <Lock className="w-4 h-4" /> Gabung untuk Berdiskusi
            </div>
          )}
        </div>
      )}

      {/* VIEW: DISCUSSIONS LIST */}
      {view === 'list' && (
        <div className="space-y-4">
          {/* SEARCH & FILTERS CONTROLS */}
          <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari topik diskusi, pertanyaan, atau tag..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#2DB24A] focus:bg-white transition-all"
                />
              </div>
              
              {/* Sort selector */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Urutkan:</span>
                <select
                  value={sortOption}
                  onChange={(e: any) => setSortOption(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-extrabold text-gray-700 focus:outline-none focus:border-[#2DB24A]"
                >
                  <option value="terbaru">Terbaru</option>
                  <option value="terpopuler">Terpopuler (Balasan terbanyak)</option>
                  <option value="belum_terjawab">Belum Terjawab</option>
                </select>
              </div>
            </div>

            {/* Category tabs */}
            <div className="flex flex-wrap gap-1.5 border-t border-gray-100 pt-3">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-[#E8F8EE] text-[#2DB24A]'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* DISCUSSIONS LISTING */}
          {isLoading ? (
            <div className="space-y-4">
              <ForumPostSkeleton />
              <ForumPostSkeleton />
              <ForumPostSkeleton />
            </div>
          ) : filteredDiscussions.length === 0 ? (
            /* EMPTY STATE */
            <div className="p-16 text-center bg-white border border-gray-200/80 rounded-3xl space-y-4">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto opacity-80" />
              <div className="space-y-1">
                <h4 className="text-base font-extrabold text-gray-800">Belum ada diskusi di komunitas ini</h4>
                <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                  Jadilah anggota pertama yang memulai percakapan. Bagikan pertanyaan, pengalaman, informasi, atau ide yang relevan dengan komunitas.
                </p>
              </div>
              {(isMember || isCanManageCoop) && (
                <button
                  onClick={() => {
                    setTitle('')
                    setCategory('Tanya Jawab')
                    setContent('')
                    setTags('')
                    setView('create')
                  }}
                  className="px-5 py-2.5 bg-[#2DB24A] hover:bg-[#24943E] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Buat Topik Diskusi
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-3">
                {filteredDiscussions.slice(0, visibleCount).map((disc: any) => {
                  const authorName = disc.author?.name || disc.authorName || 'Anggota Komunitas'
                  const repliesCount = disc.replies?.length !== undefined && disc.replies?.length > 0 ? disc.replies.length : (disc.repliesCount || 0)
                  const likesCount = disc.likesCount !== undefined ? disc.likesCount : (disc.replies?.reduce((acc: number, r: any) => acc + (r.helpfulCount || 0), 0) || 0)
                  const isAnswered = !!disc.bestReplyId

                  // Helper for initials
                  const parts = authorName.trim().split(' ')
                  const authorInitials = parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : authorName.slice(0, 2).toUpperCase()

                  // Helper for category badge color
                  const getCategoryPill = (cat: string) => {
                    switch (cat) {
                      case 'Tanya Jawab':
                        return 'bg-blue-50 text-blue-700 border-blue-100'
                      case 'Tips & Pengalaman':
                        return 'bg-amber-50 text-amber-800 border-amber-100'
                      case 'Kolaborasi':
                        return 'bg-purple-50 text-purple-700 border-purple-100'
                      case 'Diskusi Umum':
                      default:
                        return 'bg-gray-100 text-gray-700 border-gray-200'
                    }
                  }

                  // Relative time
                  const date = disc.createdAt ? new Date(disc.createdAt) : new Date()
                  const diffMs = Date.now() - date.getTime()
                  const diffHour = Math.floor(diffMs / (1000 * 60 * 60))
                  const diffDay = Math.floor(diffHour / 24)
                  const timeAgoStr = diffHour < 1 ? 'Baru saja' : diffHour < 24 ? `${diffHour} jam lalu` : `${diffDay} hari lalu`
                  
                  return (
                    <div 
                      key={disc.id} 
                      className="p-5 bg-white border border-gray-200/90 hover:border-[#15803D]/40 rounded-2xl shadow-xs transition-all duration-200 flex items-start gap-4 group"
                    >
                      {/* Left: Green initials avatar circle */}
                      <div className="w-12 h-12 rounded-full bg-[#15803D] text-white font-extrabold flex items-center justify-center text-sm shadow-xs shrink-0 select-none">
                        {disc.author?.image ? (
                          <img src={disc.author.image} alt={authorName} className="w-full h-full object-cover rounded-full" />
                        ) : (
                          authorInitials
                        )}
                      </div>

                      {/* Right: Topic content & metadata */}
                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Badges row */}
                        <div className="flex flex-wrap items-center gap-2">
                          {disc.isPinned && (
                            <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 font-extrabold text-[10px] rounded-md border border-rose-100 flex items-center gap-1">
                              📌 Disematkan
                            </span>
                          )}
                          <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-md border ${getCategoryPill(disc.category)}`}>
                            {disc.category || 'Diskusi Umum'}
                          </span>
                          {isAnswered && (
                            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-extrabold text-[10px] rounded-md border border-emerald-100 flex items-center gap-1">
                              ✓ Terjawab
                            </span>
                          )}
                          {disc.isClosed && (
                            <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 font-extrabold text-[10px] rounded-md border border-gray-200 flex items-center gap-1">
                              🔒 Ditutup
                            </span>
                          )}
                        </div>

                        {/* Title & snippet */}
                        <div 
                          onClick={() => {
                            setSelectedDiscussion(disc)
                            setView('detail')
                          }}
                          className="cursor-pointer space-y-1"
                        >
                          <h4 className="text-sm sm:text-base font-extrabold text-gray-900 group-hover:text-[#15803D] transition-colors leading-snug font-sora">
                            {disc.title}
                          </h4>
                          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed font-normal">
                            {disc.content}
                          </p>
                        </div>

                        {/* Tags */}
                        {disc.tags && disc.tags.split(',').filter(Boolean).length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {disc.tags.split(',').map((tag: string, idx: number) => (
                              <span key={idx} className="px-2 py-0.5 bg-gray-50 text-gray-500 text-[10px] font-semibold rounded-md flex items-center gap-0.5">
                                <Tag className="w-2.5 h-2.5 text-gray-400" /> {tag.trim()}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Author & Footer stats */}
                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-4 flex-wrap">
                            <span className="font-bold text-gray-800 text-xs">
                              {authorName}
                            </span>
                            <div 
                              onClick={() => {
                                setSelectedDiscussion(disc)
                                setView('detail')
                              }}
                              className="flex items-center gap-1.5 font-bold hover:text-[#15803D] cursor-pointer transition-colors text-gray-600"
                            >
                              <span>💬 {repliesCount} balasan</span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => handleToggleLike(disc.id, e)}
                              className={`flex items-center gap-1.5 font-bold transition-all cursor-pointer px-2 py-0.5 rounded-lg text-xs ${
                                Array.isArray(disc.likes) && currentUser && disc.likes.includes(currentUser.id)
                                  ? 'text-rose-600 bg-rose-50 scale-105'
                                  : 'text-gray-500 hover:text-rose-600 hover:bg-rose-50/60'
                              }`}
                              title="Sukai topik ini"
                            >
                              <span>❤️ {likesCount}</span>
                            </button>
                            <span className="text-gray-400 font-medium">
                              {timeAgoStr}
                            </span>
                          </div>

                          {/* Action icons / Menu */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleShare(disc.id)}
                              className="hover:text-[#15803D] transition-colors flex items-center gap-1 cursor-pointer font-bold text-gray-400 hover:text-gray-700"
                              title="Bagikan Tautan"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>

                            {(isCanManageCoop || (currentUser && currentUser.id === disc.authorId)) && (
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setActiveMenuId(activeMenuId === disc.id ? null : disc.id)
                                  }}
                                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer text-gray-400 hover:text-gray-600"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>

                              {activeMenuId === disc.id && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={() => setActiveMenuId(null)} />
                                  <div className="absolute right-0 bottom-full mb-1 bg-white border border-gray-150 rounded-xl shadow-md z-20 py-1.5 w-40 text-left">
                                    {currentUser && currentUser.id === disc.authorId && !disc.isClosed && (
                                      <button
                                        onClick={() => {
                                          setEditingId(disc.id)
                                          setTitle(disc.title)
                                          setCategory(disc.category)
                                          setContent(disc.content)
                                          setTags(disc.tags)
                                          setView('edit')
                                          setActiveMenuId(null)
                                        }}
                                        className="w-full px-3 py-1.5 hover:bg-gray-50 font-bold text-xs text-gray-700 flex items-center gap-2 cursor-pointer"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" /> Edit Diskusi
                                      </button>
                                    )}
                                    {isCanManageCoop && (
                                      <>
                                        <button
                                          onClick={() => {
                                            handleTogglePin(disc.id)
                                            setActiveMenuId(null)
                                          }}
                                          className="w-full px-3 py-1.5 hover:bg-gray-50 font-bold text-xs text-gray-700 flex items-center gap-2 cursor-pointer"
                                        >
                                          <Pin className="w-3.5 h-3.5" />
                                          {disc.isPinned ? 'Lepas Pin' : 'Pin Diskusi'}
                                        </button>
                                        <button
                                          onClick={() => {
                                            handleToggleClose(disc.id)
                                            setActiveMenuId(null)
                                          }}
                                          className="w-full px-3 py-1.5 hover:bg-gray-50 font-bold text-xs text-gray-700 flex items-center gap-2 cursor-pointer"
                                        >
                                          {disc.isClosed ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                                          {disc.isClosed ? 'Buka Diskusi' : 'Tutup Diskusi'}
                                        </button>
                                      </>
                                    )}
                                    {(isCanManageCoop || (currentUser && currentUser.id === disc.authorId)) && (
                                      <button
                                        onClick={() => {
                                          handleDelete(disc.id)
                                          setActiveMenuId(null)
                                        }}
                                        className="w-full px-3 py-1.5 hover:bg-gray-50 font-bold text-xs text-rose-600 flex items-center gap-2 cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" /> Hapus Diskusi
                                      </button>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  )
                })}

                {isLoadingMore && (
                  <div className="space-y-3 pt-2">
                    <ForumPostSkeleton />
                    <ForumPostSkeleton />
                  </div>
                )}
              </div>

              {filteredDiscussions.length > visibleCount && (
                <div className="flex justify-center pt-3">
                  <button
                    type="button"
                    disabled={isLoadingMore}
                    onClick={() => {
                      setIsLoadingMore(true)
                      setTimeout(() => {
                        setVisibleCount(prev => prev + 6)
                        setIsLoadingMore(false)
                      }, 350)
                    }}
                    className="px-6 py-2.5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs uppercase tracking-wider rounded-xl border border-slate-200 shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>{isLoadingMore ? 'Memuat Topik...' : 'Muat Lebih Banyak Topik'}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({Math.min(visibleCount, filteredDiscussions.length)} / {filteredDiscussions.length})</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEW: CREATE/EDIT DISCUSSION */}
      {(view === 'create' || view === 'edit') && (
        <div className="p-6 bg-white border border-gray-200/80 rounded-3xl shadow-xs space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <button
              onClick={() => setView('list')}
              className="p-2 hover:bg-gray-50 border border-gray-150 rounded-xl transition-all cursor-pointer text-gray-500"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-base font-black text-gray-900 font-sora">
                {view === 'create' ? 'Tuliskan Topik Diskusi Baru' : 'Ubah Topik Diskusi'}
              </h2>
              <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                {view === 'create' 
                  ? 'Bagikan pertanyaan, pengalaman, informasi, atau ide yang relevan dengan komunitas.'
                  : 'Perbarui judul, kategori, atau isi dari diskusi Anda.'}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={view === 'create' ? handlePublish : handleUpdate} className="space-y-4">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Judul Diskusi *</label>
              <input
                type="text"
                placeholder="Masukkan judul diskusi Anda..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:border-[#2DB24A] focus:bg-white transition-all"
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Kategori Diskusi *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:border-[#2DB24A] focus:bg-white transition-all"
              >
                {categories.filter(c => c !== 'Semua').map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Content */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Isi Diskusi *</label>
              <textarea
                placeholder="Tulis pertanyaan, pengalaman, informasi, atau ide Anda di sini..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={6}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-semibold text-gray-800 leading-relaxed focus:outline-none focus:border-[#2DB24A] focus:bg-white transition-all resize-none"
              />
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-gray-400" /> Label / Tag (Opsional)
              </label>
              <input
                type="text"
                placeholder="Masukkan tag dipisahkan koma, misal: kuliner, resep, permodalan..."
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:border-[#2DB24A] focus:bg-white transition-all"
              />
              <span className="text-[10px] text-gray-400 font-medium block">
                Maksimal 3-5 label ringkas untuk memudahkan anggota lain melakukan pencarian.
              </span>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setView('list')}
                className="px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 font-extrabold text-xs rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-5 py-2.5 bg-[#2DB24A] hover:bg-[#24943E] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Memproses...
                  </>
                ) : (
                  view === 'create' ? 'Publikasikan' : 'Simpan Perubahan'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW: DISCUSSION DETAIL & REPLIES */}
      {view === 'detail' && selectedDiscussion && (
        <div className="space-y-6">
          {/* Main Card */}
          <div className="p-6 bg-white border border-gray-200/80 rounded-3xl shadow-xs space-y-4">
            {/* Breadcrumb & Back */}
            <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              <button
                onClick={() => setView('list')}
                className="hover:text-gray-700 transition-colors flex items-center gap-1 cursor-pointer"
              >
                Diskusi
              </button>
              <ChevronRight className="w-3 h-3 text-gray-300" />
              <span className="text-gray-500 truncate max-w-[200px]">{selectedDiscussion.category}</span>
            </div>

            {/* Title and Status labels */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 bg-[#E8F8EE] text-[#2DB24A] font-extrabold text-[10px] rounded-md border border-[#2DB24A]/20">
                  {selectedDiscussion.category}
                </span>
                {selectedDiscussion.isPinned && (
                  <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 font-extrabold text-[10px] rounded-md border border-amber-100">
                    📌 Terpaku
                  </span>
                )}
                {!!selectedDiscussion.bestReplyId && (
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-extrabold text-[10px] rounded-md border border-emerald-100 flex items-center gap-1">
                    ✓ Terjawab
                  </span>
                )}
                {selectedDiscussion.isClosed && (
                  <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 font-extrabold text-[10px] rounded-md border border-rose-100 flex items-center gap-1">
                    🔒 Ditutup
                  </span>
                )}
              </div>
              <h2 className="text-lg font-black text-gray-900 leading-snug">
                {selectedDiscussion.title}
              </h2>
            </div>

            {/* Author info & Time */}
            <div className="flex items-center justify-between border-y border-gray-100 py-3 text-xs text-gray-500 font-medium">
              <div className="flex items-center gap-2">
                {selectedDiscussion.author?.image ? (
                  <img
                    src={selectedDiscussion.author.image}
                    alt={selectedDiscussion.author.name}
                    className="w-7 h-7 rounded-full object-cover border border-gray-100"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#2DB24A]/10 text-[#2DB24A] font-bold text-xs flex items-center justify-center border border-[#2DB24A]/20">
                    {(selectedDiscussion.author?.name || 'A').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-bold text-gray-800">{selectedDiscussion.author?.name || 'Anggota Komunitas'}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    Diposting pada {new Date(selectedDiscussion.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>

              {/* Discussion owner or admin edit operations */}
              {(isCanManageCoop || (currentUser && currentUser.id === selectedDiscussion.authorId)) && (
                <div className="flex items-center gap-2">
                  {currentUser && currentUser.id === selectedDiscussion.authorId && !selectedDiscussion.isClosed && (
                    <button
                      onClick={() => {
                        setEditingId(selectedDiscussion.id)
                        setTitle(selectedDiscussion.title)
                        setCategory(selectedDiscussion.category)
                        setContent(selectedDiscussion.content)
                        setTags(selectedDiscussion.tags)
                        setView('edit')
                      }}
                      className="p-2 border border-gray-250 hover:bg-gray-50 text-gray-600 rounded-xl transition-all cursor-pointer"
                      title="Edit Diskusi"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {isCanManageCoop && (
                    <>
                      <button
                        onClick={() => handleTogglePin(selectedDiscussion.id)}
                        className={`p-2 border rounded-xl transition-all cursor-pointer ${
                          selectedDiscussion.isPinned 
                            ? 'bg-amber-50 border-amber-250 text-amber-700 hover:bg-amber-100' 
                            : 'border-gray-250 hover:bg-gray-50 text-gray-600'
                        }`}
                        title={selectedDiscussion.isPinned ? 'Lepas Sematkan' : 'Sematkan'}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleClose(selectedDiscussion.id)}
                        className={`p-2 border rounded-xl transition-all cursor-pointer ${
                          selectedDiscussion.isClosed 
                            ? 'bg-rose-50 border-rose-250 text-rose-700 hover:bg-rose-100' 
                            : 'border-gray-250 hover:bg-gray-50 text-gray-600'
                        }`}
                        title={selectedDiscussion.isClosed ? 'Buka Diskusi' : 'Tutup Diskusi'}
                      >
                        {selectedDiscussion.isClosed ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(selectedDiscussion.id)}
                    className="p-2 border border-rose-150 hover:bg-rose-50 text-rose-600 rounded-xl transition-all cursor-pointer"
                    title="Hapus Diskusi"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Content body */}
            <p className="text-xs text-gray-700 leading-relaxed font-semibold whitespace-pre-wrap py-2">
              {selectedDiscussion.content}
            </p>

            {/* Tags */}
            {selectedDiscussion.tags && (
              <div className="flex flex-wrap gap-2 pt-2">
                {selectedDiscussion.tags.split(',').map((tag: string, i: number) => (
                  <span key={i} className="text-[10px] font-bold text-gray-400 bg-gray-50 border border-gray-100 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                    <Tag className="w-3 h-3" /> {tag.trim()}
                  </span>
                ))}
              </div>
            )}

            {/* Footer Buttons: Like, Share & Stats */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-100 text-xs text-gray-500 font-semibold flex-wrap gap-3">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => handleToggleLike(selectedDiscussion.id)}
                  className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-extrabold transition-all cursor-pointer text-xs ${
                    Array.isArray(selectedDiscussion.likes) && currentUser && selectedDiscussion.likes.includes(currentUser.id)
                      ? 'bg-rose-50 text-rose-600 border-rose-200 shadow-xs'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-rose-600'
                  }`}
                >
                  <span>❤️</span>
                  <span>{selectedDiscussion.likes?.length !== undefined ? selectedDiscussion.likes.length : (selectedDiscussion.likesCount || 0)} Suka</span>
                </button>
                <div className="flex items-center gap-1.5 font-bold text-gray-600">
                  <MessageCircle className="w-4 h-4 text-gray-400" />
                  <span>{selectedDiscussion.replies?.length || 0} Balasan</span>
                </div>
              </div>
              <button
                onClick={() => handleShare(selectedDiscussion.id)}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-extrabold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-all"
              >
                <Share2 className="w-4 h-4 text-gray-400" /> Bagikan Diskusi
              </button>
            </div>
          </div>

          {/* LIST OF REPLIES */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Semua Balasan ({selectedDiscussion.replies?.length || 0})
            </h3>

            {selectedDiscussion.replies?.length === 0 ? (
              <div className="p-10 bg-white border border-gray-100 rounded-3xl text-center space-y-2">
                <MessageCircle className="w-10 h-10 text-gray-300 mx-auto" />
                <h4 className="text-xs font-extrabold text-gray-700">Belum ada balasan</h4>
                <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
                  Belum ada yang merespon topik ini. {selectedDiscussion.isClosed ? 'Diskusi ini sudah ditutup.' : 'Berikan jawaban Anda di bawah!'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDiscussion.replies.map((reply: any) => {
                  const isBest = selectedDiscussion.bestReplyId === reply.id
                  const votesList = JSON.parse(reply.helpfulVotes || '[]')
                  const hasUpvoted = currentUser && votesList.includes(currentUser.id)
                  const repAuthorName = reply.author?.name || 'Anggota Komunitas'
                  const repAuthorImage = reply.author?.image
                  
                  return (
                    <div
                      key={reply.id}
                      className={`p-5 transition-all duration-200 flex gap-4 ${
                        isBest 
                          ? 'bg-[#F4FBF7] border border-[#2DB24A]/30 rounded-2xl shadow-xs' 
                          : 'bg-white border border-gray-200/60 rounded-2xl'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="shrink-0">
                        {repAuthorImage ? (
                          <img
                            src={repAuthorImage}
                            alt={repAuthorName}
                            className="w-7 h-7 rounded-full object-cover border border-gray-100"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-[#2DB24A]/10 text-[#2DB24A] font-bold text-xs flex items-center justify-center border border-[#2DB24A]/20">
                            {repAuthorName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Content Box */}
                      <div className="flex-1 space-y-2.5">
                        {/* Header metadata */}
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-gray-800">{repAuthorName}</span>
                              {reply.authorId === selectedDiscussion.authorId && (
                                <span className="text-[9px] font-bold bg-gray-100 text-gray-500 border border-gray-150 px-1.5 py-0.2 rounded">
                                  Pembuat Topik
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] text-gray-400 font-bold block mt-0.5">
                              {new Date(reply.createdAt).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>

                          {/* Best Reply Badge or Option */}
                          <div className="flex items-center gap-2">
                            {isBest && (
                              <span className="px-2.5 py-0.5 bg-[#2DB24A]/10 text-[#2DB24A] border border-[#2DB24A]/20 font-black text-[9px] rounded-md flex items-center gap-1 shadow-2xs">
                                ✓ JAWABAN TERBAIK
                              </span>
                            )}

                            {/* Mark as Best Reply Button for Discussion Creator */}
                            {currentUser && currentUser.id === selectedDiscussion.authorId && !selectedDiscussion.isClosed && (
                              <button
                                onClick={() => handleSelectBestReply(reply.id)}
                                className={`px-2 py-1 rounded-md text-[9px] font-black tracking-wider transition-all cursor-pointer ${
                                  isBest
                                    ? 'bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100'
                                    : 'bg-emerald-50 border border-emerald-250 text-emerald-700 hover:bg-emerald-100'
                                }`}
                              >
                                {isBest ? 'BATALKAN TERBAIK' : 'PILIH TERBAIK'}
                              </button>
                            )}

                            {/* Delete Reply Option */}
                            {(isCanManageCoop || (currentUser && currentUser.id === reply.authorId)) && (
                              <button
                                onClick={() => handleDeleteReply(reply.id)}
                                className="p-1 text-gray-300 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Hapus Balasan"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Reply content body */}
                        <p className="text-xs text-gray-700 leading-relaxed font-medium whitespace-pre-wrap">
                          {reply.content}
                        </p>

                        {/* Vote Helpful Buttons */}
                        <div className="flex items-center gap-4 pt-1.5 text-[11px] text-gray-400 font-bold">
                          <button
                            onClick={() => handleToggleHelpful(reply.id)}
                            className={`flex items-center gap-1 cursor-pointer transition-colors ${
                              hasUpvoted ? 'text-[#2DB24A]' : 'hover:text-gray-600'
                            }`}
                          >
                            <ThumbsUp className={`w-3.5 h-3.5 ${hasUpvoted ? 'fill-current' : ''}`} />
                            <span>
                              {reply.helpfulCount || 0} Membantu
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* WRITE REPLY BOX */}
          {!selectedDiscussion.isClosed ? (
            isMember || isCanManageCoop ? (
              <form onSubmit={handleSendReply} className="p-5 bg-white border border-gray-200/80 rounded-3xl shadow-xs space-y-3.5">
                <div className="flex items-center gap-2">
                  <CornerDownRight className="w-4 h-4 text-gray-400" />
                  <span className="text-[11px] font-black text-gray-500 uppercase tracking-wider">Kirim Balasan Diskusi</span>
                </div>
                <textarea
                  placeholder="Tulis tanggapan, saran, solusi, atau jawaban Anda di sini..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={4}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-semibold text-gray-800 leading-relaxed focus:outline-none focus:border-[#2DB24A] focus:bg-white transition-all resize-none"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-5 py-2.5 bg-[#2DB24A] hover:bg-[#24943E] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" /> Kirim Balasan
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-6 bg-gray-50 border border-dashed border-gray-200 rounded-3xl text-center space-y-1.5 select-none">
                <Lock className="w-6 h-6 text-gray-400 mx-auto" />
                <h4 className="text-xs font-extrabold text-gray-700">Akses Terbatas</h4>
                <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
                  Anda harus terdaftar sebagai anggota komunitas ini untuk dapat mengirimkan balasan diskusi.
                </p>
              </div>
            )
          ) : (
            <div className="p-6 bg-rose-50/50 border border-rose-100 rounded-3xl text-center space-y-1 select-none">
              <Lock className="w-6 h-6 text-rose-500 mx-auto" />
              <h4 className="text-xs font-extrabold text-rose-800">Diskusi Ditutup</h4>
              <p className="text-[11px] text-rose-600/80 max-w-xs mx-auto">
                Topik diskusi ini telah ditutup oleh pengurus/admin komunitas dan tidak menerima balasan baru.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
