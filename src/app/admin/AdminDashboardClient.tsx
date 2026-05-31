'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { logout } from '../actions/auth'
import {
  updateUserRoleAndLevelAction,
  addCourseAction,
  updateCourseAction,
  deleteCourseAction,
  addLessonAction,
  updateLessonAction,
  deleteLessonAction,
  trackTransactionAction
} from '../actions/admin'

interface AdminDashboardClientProps {
  currentUser: any
  initialUsers: any[]
  initialProducts: any[]
  initialPosts: any[]
  initialOrders: any[]
  initialCourses: any[]
}

type TabType = 'overview' | 'users' | 'products' | 'academy' | 'community' | 'transactions' | 'certificates'

export default function AdminDashboardClient({
  currentUser,
  initialUsers,
  initialProducts,
  initialPosts,
  initialOrders,
  initialCourses
}: AdminDashboardClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [isPending, startTransition] = useTransition()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // State lists
  const [users, setUsers] = useState(initialUsers)
  const [products, setProducts] = useState(initialProducts)
  const [posts, setPosts] = useState(initialPosts)
  const [orders, setOrders] = useState(initialOrders)
  const [courses, setCourses] = useState(initialCourses)

  // Filters / Search
  const [userSearch, setUserSearch] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('ALL')
  
  const [productSearch, setProductSearch] = useState('')
  const [productCatFilter, setProductCatFilter] = useState('ALL')

  const [txSearch, setTxSearch] = useState('')
  const [selectedTx, setSelectedTx] = useState<any>(null)

  const [certUserSearch, setCertUserSearch] = useState('')
  const [selectedCertUser, setSelectedCertUser] = useState<any>(null)

  // Modals / Forms State
  const [editUser, setEditUser] = useState<any>(null)
  
  const [courseModal, setCourseModal] = useState<{ open: boolean; mode: 'add' | 'edit'; data?: any }>({
    open: false,
    mode: 'add'
  })
  const [courseTitle, setCourseTitle] = useState('')
  const [courseDesc, setCourseDesc] = useState('')
  const [courseCover, setCourseCover] = useState('')
  const [courseAccess, setCourseAccess] = useState('Gold')

  const [lessonModal, setLessonModal] = useState<{ open: boolean; mode: 'add' | 'edit'; courseId: string; data?: any }>({
    open: false,
    mode: 'add',
    courseId: ''
  })
  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonContent, setLessonContent] = useState('')
  const [lessonVideo, setLessonVideo] = useState('')
  const [lessonDuration, setLessonDuration] = useState('300')
  const [lessonOrderIndex, setLessonOrderIndex] = useState('1')

  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  // Helper stats
  const totalVolume = orders.reduce((sum, o) => sum + o.totalAmount, 0)
  const totalUsers = users.length
  const totalProducts = products.length
  const totalPosts = posts.length

  const handleLogout = async () => {
    await logout()
    router.push('/')
    router.refresh()
  }

  // ─── USER SUBMIT HANDLERS ──────────────────────────────────────────────────
  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editUser) return
    setActionError(null)
    setActionSuccess(null)

    startTransition(async () => {
      const res = await updateUserRoleAndLevelAction(
        editUser.id,
        editUser.role,
        Number(editUser.level),
        Number(editUser.xp),
        editUser.membershipLevel,
        editUser.membershipAccess
      )

      if (res.success) {
        setUsers(prev => prev.map(u => u.id === editUser.id ? editUser : u))
        setActionSuccess(`User "${editUser.name}" berhasil diperbarui.`)
        setEditUser(null)
      } else {
        setActionError(res.error || 'Terjadi kesalahan.')
      }
    })
  }

  // ─── COURSE SUBMIT HANDLERS ────────────────────────────────────────────────
  const handleCourseSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setActionError(null)
    setActionSuccess(null)

    startTransition(async () => {
      if (courseModal.mode === 'add') {
        const res = await addCourseAction(courseTitle, courseDesc, courseCover, courseAccess)
        if (res.success && res.course) {
          setCourses(prev => [...prev, res.course])
          setActionSuccess('Kelas baru berhasil ditambahkan.')
          setCourseModal({ open: false, mode: 'add' })
          resetCourseForm()
        } else {
          setActionError(res.error || 'Gagal menambahkan kelas.')
        }
      } else {
        const id = courseModal.data.id
        const res = await updateCourseAction(id, courseTitle, courseDesc, courseCover, courseAccess)
        if (res.success) {
          setCourses(prev => prev.map(c => c.id === id ? { ...c, title: courseTitle, description: courseDesc, coverImage: courseCover, accessRequired: courseAccess } : c))
          setActionSuccess('Kelas berhasil diperbarui.')
          setCourseModal({ open: false, mode: 'add' })
          resetCourseForm()
        } else {
          setActionError(res.error || 'Gagal memperbarui kelas.')
        }
      }
    })
  }

  const handleDeleteCourse = (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kelas ini beserta semua pelajarannya?')) return
    setActionError(null)
    setActionSuccess(null)

    startTransition(async () => {
      const res = await deleteCourseAction(id)
      if (res.success) {
        setCourses(prev => prev.filter(c => c.id !== id))
        setActionSuccess('Kelas berhasil dihapus.')
      } else {
        setActionError(res.error || 'Gagal menghapus kelas.')
      }
    })
  }

  const resetCourseForm = () => {
    setCourseTitle('')
    setCourseDesc('')
    setCourseCover('')
    setCourseAccess('Gold')
  }

  const openEditCourse = (course: any) => {
    setCourseTitle(course.title)
    setCourseDesc(course.description)
    setCourseCover(course.coverImage || '')
    setCourseAccess(course.accessRequired || 'Gold')
    setCourseModal({ open: true, mode: 'edit', data: course })
  }

  // ─── LESSON SUBMIT HANDLERS ────────────────────────────────────────────────
  const handleLessonSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setActionError(null)
    setActionSuccess(null)

    const cId = lessonModal.courseId
    const dur = Number(lessonDuration)
    const idx = Number(lessonOrderIndex)

    startTransition(async () => {
      if (lessonModal.mode === 'add') {
        const res = await addLessonAction(cId, lessonTitle, lessonContent, lessonVideo, dur, idx)
        if (res.success && res.lesson) {
          setCourses(prev => prev.map(c => {
            if (c.id === cId) {
              const lessons = [...(c.lessons || []), res.lesson].sort((a,b) => a.orderIndex - b.orderIndex)
              return { ...c, lessons }
            }
            return c
          }))
          setActionSuccess('Materi pelajaran berhasil ditambahkan.')
          setLessonModal({ open: false, mode: 'add', courseId: '' })
          resetLessonForm()
        } else {
          setActionError(res.error || 'Gagal menambahkan materi pelajaran.')
        }
      } else {
        const id = lessonModal.data.id
        const res = await updateLessonAction(id, cId, lessonTitle, lessonContent, lessonVideo, dur, idx)
        if (res.success) {
          setCourses(prev => prev.map(c => {
            if (c.id === cId) {
              const lessons = (c.lessons || []).map((l: any) => l.id === id ? { ...l, title: lessonTitle, content: lessonContent, videoUrl: lessonVideo, duration: dur, orderIndex: idx } : l).sort((a: any, b: any) => a.orderIndex - b.orderIndex)
              return { ...c, lessons }
            }
            return c
          }))
          setActionSuccess('Materi pelajaran berhasil diperbarui.')
          setLessonModal({ open: false, mode: 'add', courseId: '' })
          resetLessonForm()
        } else {
          setActionError(res.error || 'Gagal memperbarui materi pelajaran.')
        }
      }
    })
  }

  const handleDeleteLesson = (id: string, courseId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus materi pelajaran ini?')) return
    setActionError(null)
    setActionSuccess(null)

    startTransition(async () => {
      const res = await deleteLessonAction(id, courseId)
      if (res.success) {
        setCourses(prev => prev.map(c => {
          if (c.id === courseId) {
            return { ...c, lessons: (c.lessons || []).filter((l: any) => l.id !== id) }
          }
          return c
        }))
        setActionSuccess('Materi pelajaran berhasil dihapus.')
      } else {
        setActionError(res.error || 'Gagal menghapus materi.')
      }
    })
  }

  const resetLessonForm = () => {
    setLessonTitle('')
    setLessonContent('')
    setLessonVideo('')
    setLessonDuration('300')
    setLessonOrderIndex('1')
  }

  const openAddLesson = (courseId: string) => {
    resetLessonForm()
    setLessonModal({ open: true, mode: 'add', courseId })
  }

  const openEditLesson = (lesson: any, courseId: string) => {
    setLessonTitle(lesson.title)
    setLessonContent(lesson.content || '')
    setLessonVideo(lesson.videoUrl || '')
    setLessonDuration(String(lesson.duration || 300))
    setLessonOrderIndex(String(lesson.orderIndex || 1))
    setLessonModal({ open: true, mode: 'edit', courseId, data: lesson })
  }

  // ─── SEARCH / FILTER CALCULATIONS ──────────────────────────────────────────
  const filteredUsers = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase())
    const matchRole = userRoleFilter === 'ALL' || u.role === userRoleFilter
    return matchSearch && matchRole
  })

  const filteredProducts = products.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(productSearch.toLowerCase()) || p.id.toLowerCase().includes(productSearch.toLowerCase())
    const matchCat = productCatFilter === 'ALL' || p.category === productCatFilter
    return matchSearch && matchCat
  })

  const searchedOrders = orders.filter(o => {
    if (!txSearch) return true
    return o.id.toLowerCase().includes(txSearch.toLowerCase()) || o.buyerId.toLowerCase().includes(txSearch.toLowerCase())
  })

  const certUsers = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(certUserSearch.toLowerCase()) || u.email.toLowerCase().includes(certUserSearch.toLowerCase())
    return matchSearch && u.level >= 3
  })

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f5f7] text-[#334155] font-sans antialiased relative">
      {/* Sidebar mobile overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden transition-all duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ─── SIDEBAR (Minimal Luxury Light Style) ─────────────────────────── */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-[280px] bg-white border-r border-[#e2e8f0] flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 lg:static lg:flex-shrink-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div>
          {/* Sidebar Brand Logo */}
          <div className="h-[74px] border-b border-[#e2e8f0] flex items-center px-6 gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8c6d12] to-[#bfa032] flex items-center justify-center shadow-md">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white stroke-current" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <span className="font-sora text-sm font-bold tracking-wider uppercase text-[#1e293b]">Teras Control</span>
              <p className="text-[9px] font-geist font-bold uppercase tracking-widest text-[#8c6d12] leading-none">Super Administrator</p>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="p-4 space-y-1.5">
            {[
              { id: 'overview', label: 'Dashboard Overview', icon: 'M4 6h16M4 12h16M4 18h16' },
              { id: 'users', label: 'Kelola User & Role', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm14-2a4 4 0 0 1-3.87 3M16 3.13a4 4 0 0 1 0 7.75' },
              { id: 'products', label: 'Katalog Produk & Jasa', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
              { id: 'academy', label: 'LMS Kelola Materi', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.168.477 4 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4 1.253' },
              { id: 'community', label: 'Daftar Komunitas', icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
              { id: 'transactions', label: 'Lacak Transaksi', icon: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9l2 2 4-4' },
              { id: 'certificates', label: 'Sertifikat Level Up', icon: 'M12 14l-4-4 1.41-1.41L12 11.17l2.59-2.58L16 10l-4 4zm-6 4h12V6H6v12zm12-14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12z' }
            ].map(item => {
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id as TabType); setSelectedTx(null); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    isActive 
                      ? 'bg-[#fbf7ee] text-[#8c6d12] border-l-4 border-[#8c6d12] shadow-sm' 
                      : 'text-[#475569] hover:text-[#0f172a] hover:bg-slate-50'
                  }`}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                    <path d={item.icon} />
                  </svg>
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Sidebar Footer User Info */}
        <div className="p-4 border-t border-[#e2e8f0] bg-[#f8f9fa] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#8c6d12] to-[#bfa032] flex items-center justify-center font-bold text-white shadow-sm text-sm">
              {currentUser.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate text-[#0f172a]">{currentUser.name}</p>
              <p className="text-[10px] text-[#64748b] truncate">{currentUser.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer transition-colors border border-red-100"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT (Light theme) ───────────────────────────────────── */}
      <main className="flex-grow flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-[74px] border-b border-[#e2e8f0] bg-white px-4 md:px-8 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 rounded-lg hover:bg-slate-50 lg:hidden text-[#475569] focus:outline-none cursor-pointer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h2 className="font-sora text-xs md:text-sm font-black text-slate-800 tracking-wider uppercase">
              {activeTab === 'overview' && 'Dashboard Overview'}
              {activeTab === 'users' && 'Kelola User & Role'}
              {activeTab === 'products' && 'Katalog Produk & Jasa'}
              {activeTab === 'academy' && 'LMS Academy - Kelola Materi'}
              {activeTab === 'community' && 'Daftar Forum Komunitas'}
              {activeTab === 'transactions' && 'Lacak Transaksi Jual Beli'}
              {activeTab === 'certificates' && 'Sertifikat Level Up'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[9px] font-bold text-[#8c6d12] bg-[#fbf7ee] border border-[#8c6d12]/20 px-2.5 py-1 rounded uppercase tracking-wider">
              <span className="w-1.5 h-1.5 bg-[#8c6d12] rounded-full animate-pulse inline-block" />
              Realtime Sandbox
            </span>
            <Link href="/" className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 rounded-lg transition-colors border border-[#e2e8f0] uppercase tracking-wider shadow-sm">
              Kembali ke Landing
            </Link>
          </div>
        </header>

        {/* Inner Content Area */}
        <div className="flex-grow overflow-y-auto p-8 relative">
          
          {/* Notifications */}
          {actionError && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              ⚠️ {actionError}
            </div>
          )}
          {actionSuccess && (
            <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 text-xs text-green-700 font-medium">
              ✅ {actionSuccess}
            </div>
          )}

          {/* ─── TAB 1: OVERVIEW ───────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stat Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { label: 'Total Volume Jual Beli', value: `Rp ${totalVolume.toLocaleString('id-ID')}`, sub: `${orders.length} order sukses`, color: 'text-[#8c6d12]' },
                  { label: 'Total Pengguna', value: totalUsers, sub: 'Customer, Merchant & Affiliate', color: 'text-blue-600' },
                  { label: 'Total Produk & Jasa', value: totalProducts, sub: 'Aktif di catalog', color: 'text-green-600' },
                  { label: 'Postingan Komunitas', value: totalPosts, sub: 'Artikel & tanya jawab', color: 'text-purple-600' }
                ].map((stat, i) => (
                  <div key={i} className="p-6 bg-white border border-[#e2e8f0] rounded-xl hover:shadow-md transition-all duration-300">
                    <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className={`text-2xl font-sora font-extrabold ${stat.color} tracking-tight`}>{stat.value}</p>
                    <p className="text-[10px] text-[#64748b] mt-1.5">{stat.sub}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* User Distribution */}
                <div className="lg:col-span-2 bg-white border border-[#e2e8f0] rounded-xl p-6">
                  <h3 className="font-sora text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-[#e2e8f0] pb-3 text-[#8c6d12]">Distribusi Pengguna</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { role: 'MERCHANT', count: users.filter(u => u.role === 'MERCHANT').length, desc: 'Penjual & Mitra', color: 'bg-amber-500' },
                      { role: 'AFFILIATE', count: users.filter(u => u.role === 'AFFILIATE').length, desc: 'Pemasar Mandiri', color: 'bg-purple-500' },
                      { role: 'CUSTOMER', count: users.filter(u => u.role === 'CUSTOMER').length, desc: 'Pembeli & LMS Learner', color: 'bg-blue-500' }
                    ].map((item, idx) => {
                      const pct = Math.round((item.count / totalUsers) * 100)
                      return (
                        <div key={idx} className="p-4 bg-[#f8f9fa] rounded-lg border border-[#e2e8f0]">
                          <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">{item.role}</p>
                          <p className="text-xl font-extrabold text-[#0f172a] mt-1">{item.count} <span className="text-xs text-[#64748b] font-normal">({pct}%)</span></p>
                          <p className="text-[10px] text-[#64748b] mt-0.5 leading-none">{item.desc}</p>
                          <div className="w-full bg-[#e2e8f0] h-1.5 rounded-full mt-3 overflow-hidden">
                            <div className={`${item.color} h-full`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Top categories */}
                <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                  <h3 className="font-sora text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-[#e2e8f0] pb-3 text-[#8c6d12]">Top Kategori</h3>
                  <div className="space-y-3.5">
                    {Array.from(new Set(products.map(p => p.category))).map(cat => {
                      const count = products.filter(p => p.category === cat).length
                      const pct = Math.round((count / totalProducts) * 100)
                      return (
                        <div key={cat}>
                          <div className="flex justify-between text-[11px] font-semibold text-[#64748b] mb-1">
                            <span className="uppercase text-[#334155]">{cat}</span>
                            <span>{count} item ({pct}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-[#8c6d12] h-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Latest Transactions Overview */}
              <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                <div className="flex justify-between items-center mb-4 border-b border-[#e2e8f0] pb-3">
                  <h3 className="font-sora text-xs font-bold text-slate-800 uppercase tracking-wider text-[#8c6d12]">5 Transaksi Terkini</h3>
                  <button onClick={() => setActiveTab('transactions')} className="text-[10px] text-[#8c6d12] hover:underline font-bold uppercase tracking-wider">Semua Transaksi →</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-[#e2e8f0] text-[#64748b] uppercase tracking-wider text-[10px]">
                        <th className="py-2.5">ID Order</th>
                        <th className="py-2.5">Pembeli</th>
                        <th className="py-2.5">Tanggal</th>
                        <th className="py-2.5 text-right">Total Nominal</th>
                        <th className="py-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.slice(0, 5).map(o => {
                        const buyer = users.find(u => u.id === o.buyerId)
                        return (
                          <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 font-mono font-bold text-[#8c6d12]">{o.id}</td>
                            <td className="py-3">
                              <p className="font-bold text-slate-800">{buyer?.name || 'Masyarakat/Customer'}</p>
                              <p className="text-[10px] text-[#64748b]">{buyer?.email || o.buyerId}</p>
                            </td>
                            <td className="py-3 text-[#64748b]">{new Date(o.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                            <td className="py-3 text-right font-bold text-slate-800">Rp {o.totalAmount.toLocaleString('id-ID')}</td>
                            <td className="py-3 text-center">
                              <span className="px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200 font-bold uppercase text-[9px] tracking-wider">
                                {o.status}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB 2: KELOLA USER ────────────────────────────────────────── */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Filter controls */}
              <div className="flex flex-col md:flex-row gap-4 bg-white border border-[#e2e8f0] p-4 rounded-xl shadow-sm">
                <input
                  type="text"
                  placeholder="Cari user berdasarkan nama atau email..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="flex-grow bg-white border border-[#cbd5e1] rounded-lg px-4 py-2.5 text-xs text-slate-800 placeholder-[#94a3b8] focus:outline-none focus:border-[#8c6d12] focus:ring-1 focus:ring-[#8c6d12]"
                />
                <select
                  value={userRoleFilter}
                  onChange={e => setUserRoleFilter(e.target.value)}
                  className="bg-white border border-[#cbd5e1] rounded-lg px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#8c6d12]"
                >
                  <option value="ALL">Semua Role</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="MERCHANT">MERCHANT</option>
                  <option value="AFFILIATE">AFFILIATE</option>
                  <option value="CUSTOMER">CUSTOMER</option>
                  <option value="CUSTOMER_SERVICE">CUSTOMER_SERVICE</option>
                </select>
              </div>

              {/* Users table */}
              <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-x-auto shadow-sm">
                <table className="w-full min-w-[800px] text-xs text-left">
                  <thead className="bg-[#f8f9fa] border-b border-[#e2e8f0] text-[#64748b] uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-6 py-3.5">Nama & Email</th>
                      <th className="px-6 py-3.5">Role</th>
                      <th className="px-6 py-3.5 text-center">Level / XP</th>
                      <th className="px-6 py-3.5">Membership</th>
                      <th className="px-6 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-800">{u.name}</p>
                          <p className="text-[10px] text-[#64748b] font-mono">{u.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${
                            u.role === 'ADMIN' ? 'bg-red-50 text-red-700 border-red-200' :
                            u.role === 'CUSTOMER_SERVICE' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                            u.role === 'MERCHANT' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            u.role === 'AFFILIATE' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <p className="font-bold text-slate-700">Level {u.level}</p>
                          <p className="text-[10px] text-[#64748b]">{u.xp} XP</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold border border-[#8c6d12]/20 bg-[#fbf7ee] text-[#8c6d12] uppercase tracking-wider">
                            {u.membershipLevel || 'Reseller'} / {u.membershipAccess || 'Gold'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setEditUser({ ...u })}
                            className="px-3.5 py-1 bg-[#8c6d12]/10 hover:bg-[#8c6d12]/20 text-[#8c6d12] border border-[#8c6d12]/20 rounded text-[11px] font-bold uppercase tracking-wider cursor-pointer"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Edit User Modal */}
              {editUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
                  <div className="bg-white border border-[#8c6d12]/25 rounded-xl max-w-md w-full p-6 space-y-6 shadow-2xl">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <h3 className="font-sora text-sm font-bold text-[#8c6d12] uppercase tracking-wider">Edit Pengguna</h3>
                      <button onClick={() => setEditUser(null)} className="text-slate-400 hover:text-slate-600">✕</button>
                    </div>

                    <form onSubmit={handleUpdateUser} className="space-y-4 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Nama Lengkap</label>
                        <input
                          type="text"
                          disabled
                          value={editUser.name}
                          className="w-full bg-[#f8f9fa] border border-[#cbd5e1] rounded-lg px-3.5 py-2.5 text-slate-500 outline-none"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Email</label>
                        <input
                          type="text"
                          disabled
                          value={editUser.email}
                          className="w-full bg-[#f8f9fa] border border-[#cbd5e1] rounded-lg px-3.5 py-2.5 text-slate-500 outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Role Sistem</label>
                          <select
                            value={editUser.role}
                            onChange={e => setEditUser({ ...editUser, role: e.target.value })}
                            className="w-full bg-white border border-[#cbd5e1] rounded-lg px-3.5 py-2 text-slate-850 outline-none focus:border-[#8c6d12] focus:ring-1 focus:ring-[#8c6d12]"
                          >
                            <option value="ADMIN">ADMIN</option>
                            <option value="MERCHANT">MERCHANT</option>
                            <option value="AFFILIATE">AFFILIATE</option>
                            <option value="CUSTOMER">CUSTOMER</option>
                            <option value="CUSTOMER_SERVICE">CUSTOMER_SERVICE</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Level</label>
                          <input
                            type="number"
                            value={editUser.level}
                            onChange={e => setEditUser({ ...editUser, level: Number(e.target.value), xp: Number(e.target.value) * 100 })}
                            className="w-full bg-white border border-[#cbd5e1] rounded-lg px-3.5 py-2 text-slate-850 outline-none focus:border-[#8c6d12] focus:ring-1 focus:ring-[#8c6d12]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Tingkatan Level</label>
                          <select
                            value={editUser.membershipLevel}
                            onChange={e => setEditUser({ ...editUser, membershipLevel: e.target.value })}
                            className="w-full bg-white border border-[#cbd5e1] rounded-lg px-3.5 py-2 text-slate-855 outline-none focus:border-[#8c6d12] focus:ring-1 focus:ring-[#8c6d12]"
                          >
                            <option value="Reseller">Reseller</option>
                            <option value="Agen">Agen</option>
                            <option value="Distributor">Distributor</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Akses Keanggotaan</label>
                          <select
                            value={editUser.membershipAccess}
                            onChange={e => setEditUser({ ...editUser, membershipAccess: e.target.value })}
                            className="w-full bg-white border border-[#cbd5e1] rounded-lg px-3.5 py-2 text-slate-855 outline-none focus:border-[#8c6d12] focus:ring-1 focus:ring-[#8c6d12]"
                          >
                            <option value="Gold">Gold</option>
                            <option value="Platinum">Platinum</option>
                            <option value="Diamond">Diamond</option>
                          </select>
                        </div>
                      </div>

                      <div className="pt-4 flex gap-3">
                        <button
                          type="button"
                          onClick={() => setEditUser(null)}
                          className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={isPending}
                          className="flex-1 py-2.5 bg-[#8c6d12] hover:bg-[#70560e] text-white font-bold rounded-lg uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {isPending ? 'Menyimpan...' : 'Simpan'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── TAB 3: KELOLA PRODUK ──────────────────────────────────────── */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              {/* Product catalog filters */}
              <div className="flex flex-col md:flex-row gap-4 bg-white border border-[#e2e8f0] p-4 rounded-xl shadow-sm">
                <input
                  type="text"
                  placeholder="Cari produk berdasarkan nama / SKU..."
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  className="flex-grow bg-white border border-[#cbd5e1] rounded-lg px-4 py-2.5 text-xs text-slate-800 placeholder-[#94a3b8] focus:outline-none focus:border-[#8c6d12] focus:ring-1 focus:ring-[#8c6d12]"
                />
                <select
                  value={productCatFilter}
                  onChange={e => setProductCatFilter(e.target.value)}
                  className="bg-white border border-[#cbd5e1] rounded-lg px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#8c6d12]"
                >
                  <option value="ALL">Semua Tipe</option>
                  <option value="PRODUCT">PRODUCT (Fisik / Digital)</option>
                  <option value="JASA">JASA (Jasa / Service)</option>
                </select>
              </div>

              {/* Products table */}
              <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-x-auto shadow-sm">
                <table className="w-full min-w-[800px] text-xs text-left">
                  <thead className="bg-[#f8f9fa] border-b border-[#e2e8f0] text-[#64748b] uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-6 py-3.5">ID & Gambar</th>
                      <th className="px-6 py-3.5">Nama Produk</th>
                      <th className="px-6 py-3.5">Tipe Kategori</th>
                      <th className="px-6 py-3.5 text-right">Harga Satuan</th>
                      <th className="px-6 py-3.5 text-center">Stok</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3 flex items-center gap-3">
                          <div className="w-9 h-9 rounded bg-slate-50 overflow-hidden border border-[#e2e8f0]">
                            {p.image ? (
                              <img src={p.image} alt={p.title} className="object-cover w-full h-full" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">UMKM</div>
                            )}
                          </div>
                          <span className="font-mono text-[10px] text-[#64748b]">{p.id}</span>
                        </td>
                        <td className="px-6 py-3 font-bold text-slate-800">{p.title}</td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${
                            p.category === 'JASA' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {p.category}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right font-bold text-slate-800">Rp {p.price.toLocaleString('id-ID')}</td>
                        <td className="px-6 py-3 text-center text-[#64748b] font-bold">{p.stock} pcs</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── TAB 4: LMS ACADEMY (KELOLA MATERI) ─────────────────────────── */}
          {activeTab === 'academy' && (
            <div className="space-y-8">
              {/* Header Action */}
              <div className="flex justify-between items-center bg-white border border-[#e2e8f0] p-5 rounded-xl shadow-sm">
                <div>
                  <h3 className="font-sora text-xs font-bold text-[#8c6d12] uppercase tracking-wider">Kurikulum Akademi Premium</h3>
                  <p className="text-[11px] text-[#64748b]">Manajemen kelas, edit silabus, tambahkan bab/pelajaran materi pembelajaran digital.</p>
                </div>
                <button
                  onClick={() => { resetCourseForm(); setCourseModal({ open: true, mode: 'add' }); }}
                  className="px-4 py-2.5 bg-[#8c6d12] hover:bg-[#70560e] text-white font-bold uppercase text-xs tracking-wider rounded-lg transition-colors cursor-pointer shadow-md"
                >
                  + Tambah Kelas Baru
                </button>
              </div>

              {/* Courses Grid */}
              <div className="grid grid-cols-1 gap-6">
                {courses.map(course => (
                  <div key={course.id} className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden hover:border-[#8c6d12]/20 transition-all duration-300 shadow-sm">
                    <div className="p-6 md:flex gap-6 border-b border-[#e2e8f0]">
                      <div className="w-full md:w-[220px] aspect-[16/9] md:aspect-auto rounded-lg bg-slate-50 overflow-hidden border border-[#cbd5e1] flex-shrink-0 flex items-center justify-center">
                        {course.coverImage ? (
                          <img src={course.coverImage} alt={course.title} className="object-cover w-full h-full" />
                        ) : (
                          <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest">Premium Module</span>
                        )}
                      </div>
                      <div className="flex-grow mt-4 md:mt-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#fbf7ee] border border-[#8c6d12]/20 text-[#8c6d12] uppercase tracking-wider">
                              Level Akses: {course.accessRequired || 'Gold'}
                            </span>
                            <span className="text-[10px] font-mono text-[#64748b]">{course.id}</span>
                          </div>
                          <h4 className="font-sora text-sm font-bold text-slate-800 mt-2">{course.title}</h4>
                          <p className="text-xs text-[#64748b] leading-relaxed mt-2.5">{course.description}</p>
                        </div>
                        <div className="flex gap-3 mt-4 pt-4 border-t border-slate-100">
                          <button
                            onClick={() => openEditCourse(course)}
                            className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-[#cbd5e1] font-bold text-[10px] uppercase tracking-widest rounded transition-colors cursor-pointer"
                          >
                            Edit Kelas
                          </button>
                          <button
                            onClick={() => handleDeleteCourse(course.id)}
                            className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-[10px] uppercase tracking-widest rounded transition-colors cursor-pointer"
                          >
                            Hapus Kelas
                          </button>
                          <button
                            onClick={() => openAddLesson(course.id)}
                            className="ml-auto px-4 py-1.5 bg-[#8c6d12]/10 hover:bg-[#8c6d12]/20 text-[#8c6d12] border border-[#8c6d12]/20 font-bold text-[10px] uppercase tracking-widest rounded transition-all cursor-pointer"
                          >
                            + Tambah Pelajaran
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Lessons list inside course */}
                    <div className="p-6 bg-[#fafbfc] space-y-3">
                      <h5 className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Syllabus / Bab Pelajaran ({course.lessons?.length || 0} Bab)</h5>
                      {course.lessons && course.lessons.length > 0 ? (
                        <div className="space-y-2">
                          {course.lessons.map((lesson: any) => (
                            <div key={lesson.id} className="flex justify-between items-center p-3.5 bg-white border border-[#e2e8f0] rounded-lg hover:border-[#cbd5e1] transition-colors shadow-sm">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[9px] font-bold text-[#8c6d12] bg-[#fbf7ee] px-1.5 py-0.2 border border-[#8c6d12]/10 rounded">
                                    Urutan {lesson.orderIndex}
                                  </span>
                                  <span className="text-xs font-bold text-slate-800">{lesson.title}</span>
                                </div>
                                <p className="text-[10px] text-[#64748b] mt-1.5 line-clamp-1">{lesson.content}</p>
                                <div className="flex items-center gap-3.5 mt-1.5 text-[10px] text-[#64748b] font-mono">
                                  <span>Durasi: {Math.round(lesson.duration / 60)} menit</span>
                                  <span>•</span>
                                  <span className="truncate max-w-[250px]" title={lesson.videoUrl}>Video: {lesson.videoUrl || 'Tidak ada video'}</span>
                                </div>
                              </div>
                              <div className="flex gap-2 flex-shrink-0">
                                <button
                                  onClick={() => openEditLesson(lesson, course.id)}
                                  className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded text-[10px] uppercase font-bold tracking-wider cursor-pointer border border-[#e2e8f0]"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteLesson(lesson.id, course.id)}
                                  className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded text-[10px] uppercase font-bold tracking-wider cursor-pointer border border-red-100"
                                >
                                  Hapus
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-[#64748b] italic p-4 text-center">Kelas ini belum memiliki bab pelajaran. Silakan klik "+ Tambah Pelajaran" di atas.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Course Create/Edit Modal */}
              {courseModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
                  <div className="bg-white border border-[#8c6d12]/25 rounded-xl max-w-md w-full p-6 space-y-6 shadow-2xl">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <h3 className="font-sora text-sm font-bold text-[#8c6d12] uppercase tracking-wider">
                        {courseModal.mode === 'add' ? 'Tambah Kelas Baru' : 'Edit Kelas'}
                      </h3>
                      <button onClick={() => setCourseModal({ open: false, mode: 'add' })} className="text-slate-400 hover:text-slate-600">✕</button>
                    </div>

                    <form onSubmit={handleCourseSubmit} className="space-y-4 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Judul Kelas</label>
                        <input
                          type="text"
                          required
                          value={courseTitle}
                          onChange={e => setCourseTitle(e.target.value)}
                          placeholder="e.g. Mastering Luxury Commerce"
                          className="w-full bg-white border border-[#cbd5e1] rounded-lg px-3.5 py-2.5 text-slate-800 outline-none focus:border-[#8c6d12] focus:ring-1 focus:ring-[#8c6d12]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Deskripsi Singkat</label>
                        <textarea
                          required
                          rows={3}
                          value={courseDesc}
                          onChange={e => setCourseDesc(e.target.value)}
                          placeholder="Tulis ringkasan kurikulum..."
                          className="w-full bg-white border border-[#cbd5e1] rounded-lg px-3.5 py-2.5 text-slate-800 outline-none focus:border-[#8c6d12] focus:ring-1 focus:ring-[#8c6d12]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Akses Keanggotaan</label>
                          <select
                            value={courseAccess}
                            onChange={e => setCourseAccess(e.target.value)}
                            className="w-full bg-white border border-[#cbd5e1] rounded-lg px-3.5 py-2 text-slate-800 outline-none focus:border-[#8c6d12] focus:ring-1 focus:ring-[#8c6d12]"
                          >
                            <option value="Gold">Gold</option>
                            <option value="Platinum">Platinum</option>
                            <option value="Diamond">Diamond</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Cover Image URL</label>
                          <input
                            type="text"
                            value={courseCover}
                            onChange={e => setCourseCover(e.target.value)}
                            placeholder="https://unsplash..."
                            className="w-full bg-white border border-[#cbd5e1] rounded-lg px-3.5 py-2.5 text-slate-800 outline-none focus:border-[#8c6d12] focus:ring-1 focus:ring-[#8c6d12]"
                          />
                        </div>
                      </div>

                      <div className="pt-4 flex gap-3">
                        <button
                          type="button"
                          onClick={() => setCourseModal({ open: false, mode: 'add' })}
                          className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-850 font-bold rounded-lg uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={isPending}
                          className="flex-1 py-2.5 bg-[#8c6d12] hover:bg-[#70560e] text-white font-bold rounded-lg uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          {isPending ? 'Menyimpan...' : 'Simpan'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Lesson Create/Edit Modal */}
              {lessonModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
                  <div className="bg-white border border-[#8c6d12]/25 rounded-xl max-w-md w-full p-6 space-y-6 shadow-2xl">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <h3 className="font-sora text-sm font-bold text-[#8c6d12] uppercase tracking-wider">
                        {lessonModal.mode === 'add' ? 'Tambah Pelajaran Baru' : 'Edit Pelajaran'}
                      </h3>
                      <button onClick={() => setLessonModal({ open: false, mode: 'add', courseId: '' })} className="text-slate-400 hover:text-slate-600">✕</button>
                    </div>

                    <form onSubmit={handleLessonSubmit} className="space-y-4 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Judul Pelajaran</label>
                        <input
                          type="text"
                          required
                          value={lessonTitle}
                          onChange={e => setLessonTitle(e.target.value)}
                          placeholder="e.g. 1. Dasar Pembuatan Brand"
                          className="w-full bg-white border border-[#cbd5e1] rounded-lg px-3.5 py-2.5 text-slate-800 outline-none focus:border-[#8c6d12] focus:ring-1 focus:ring-[#8c6d12]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Isi Materi</label>
                        <textarea
                          required
                          rows={4}
                          value={lessonContent}
                          onChange={e => setLessonContent(e.target.value)}
                          placeholder="Tulis narasi pembelajaran materi secara rinci..."
                          className="w-full bg-white border border-[#cbd5e1] rounded-lg px-3.5 py-2.5 text-slate-800 outline-none focus:border-[#8c6d12] focus:ring-1 focus:ring-[#8c6d12]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Video URL (MP4 / YouTube)</label>
                        <input
                          type="text"
                          value={lessonVideo}
                          onChange={e => setLessonVideo(e.target.value)}
                          placeholder="https://www.w3schools.com/html/mov_bbb.mp4"
                          className="w-full bg-white border border-[#cbd5e1] rounded-lg px-3.5 py-2.5 text-slate-800 outline-none focus:border-[#8c6d12] focus:ring-1 focus:ring-[#8c6d12]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Durasi (Detik)</label>
                          <input
                            type="number"
                            required
                            value={lessonDuration}
                            onChange={e => setLessonDuration(e.target.value)}
                            className="w-full bg-white border border-[#cbd5e1] rounded-lg px-3.5 py-2 text-slate-850 outline-none focus:border-[#8c6d12] focus:ring-1 focus:ring-[#8c6d12]"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">No. Urut (Indeks)</label>
                          <input
                            type="number"
                            required
                            value={lessonOrderIndex}
                            onChange={e => setLessonOrderIndex(e.target.value)}
                            className="w-full bg-white border border-[#cbd5e1] rounded-lg px-3.5 py-2 text-slate-850 outline-none focus:border-[#8c6d12] focus:ring-1 focus:ring-[#8c6d12]"
                          />
                        </div>
                      </div>

                      <div className="pt-4 flex gap-3">
                        <button
                          type="button"
                          onClick={() => setLessonModal({ open: false, mode: 'add', courseId: '' })}
                          className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-850 font-bold rounded-lg uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={isPending}
                          className="flex-1 py-2.5 bg-[#8c6d12] hover:bg-[#70560e] text-white font-bold rounded-lg uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          {isPending ? 'Menyimpan...' : 'Simpan'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── TAB 5: DAFTAR KOMUNITAS ───────────────────────────────────── */}
          {activeTab === 'community' && (
            <div className="space-y-6">
              <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-[#e2e8f0] bg-[#f8f9fa]">
                  <h3 className="font-sora text-xs font-bold text-[#8c6d12] uppercase tracking-wider">Aktivitas Forum Komunitas</h3>
                  <p className="text-[11px] text-[#64748b]">Daftar postingan diskusi bisnis UMKM dan komentar terhubung.</p>
                </div>
                <div className="divide-y divide-[#e2e8f0]">
                  {posts.map(post => {
                    const author = users.find(u => u.id === post.authorId)
                    return (
                      <div key={post.id} className="p-6 hover:bg-slate-50/50 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8c6d12]/20 to-[#bfa032]/20 flex items-center justify-center font-bold text-[#8c6d12] border border-[#8c6d12]/30 text-xs">
                            {author?.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">{author?.name || 'UMKM Mitra'}</p>
                            <p className="text-[10px] text-[#64748b]">Role: {author?.role} • Level {author?.level || 1}</p>
                          </div>
                          <span className="ml-auto text-[10px] text-[#64748b] font-mono">
                            {new Date(post.createdAt).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        <h4 className="font-sora text-sm font-bold text-slate-850 mt-3">{post.title}</h4>
                        <p className="text-xs text-[#475569] leading-relaxed mt-2 bg-[#f8f9fa] p-3 rounded-lg border border-[#e2e8f0]">{post.content}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB 6: LACAK TRANSAKSI ────────────────────────────────────── */}
          {activeTab === 'transactions' && (
            <div className="space-y-6">
              {/* Search Order Input */}
              <div className="bg-white border border-[#e2e8f0] p-5 rounded-xl shadow-sm flex flex-col md:flex-row gap-4">
                <div className="flex-grow">
                  <h3 className="font-sora text-xs font-bold text-[#8c6d12] uppercase tracking-wider mb-1">Pelacakan Transaksi Jual Beli</h3>
                  <p className="text-[11px] text-[#64748b] mb-3">Masukkan ID Transaksi (Order ID) untuk melakukan trace pembagian laba, komisi afliasi multi-level, cashback, dan points.</p>
                  <input
                    type="text"
                    placeholder="Masukkan ID Transaksi, e.g. order-1779515200000"
                    value={txSearch}
                    onChange={e => setTxSearch(e.target.value)}
                    className="w-full bg-white border border-[#cbd5e1] rounded-lg px-4 py-2.5 text-xs text-slate-850 placeholder-[#94a3b8] focus:outline-none focus:border-[#8c6d12] focus:ring-1 focus:ring-[#8c6d12] font-mono"
                  />
                </div>
              </div>

              {/* Transactions grid & Detail */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* List of Orders */}
                <div className="lg:col-span-2 bg-white border border-[#e2e8f0] rounded-xl overflow-hidden shadow-sm h-[500px] overflow-y-auto">
                  <div className="px-5 py-3.5 border-b border-[#e2e8f0] bg-[#f8f9fa] sticky top-0 z-10 flex justify-between items-center">
                    <h4 className="font-sora text-xs font-bold text-[#8c6d12] uppercase tracking-wider">Daftar Transaksi Sandbox</h4>
                    <span className="text-[10px] font-mono text-[#64748b]">{searchedOrders.length} transaksi</span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {searchedOrders.map(o => {
                      const buyer = users.find(u => u.id === o.buyerId)
                      return (
                        <div
                          key={o.id}
                          onClick={() => setSelectedTx(o)}
                          className={`p-4 transition-all duration-150 cursor-pointer ${
                            selectedTx?.id === o.id ? 'bg-[#fbf7ee] border-l-4 border-[#8c6d12]' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-mono font-bold text-[#8c6d12]">{o.id}</span>
                            <span className="text-[10px] text-[#64748b] font-mono">{new Date(o.createdAt).toLocaleDateString('id-ID')}</span>
                          </div>
                          <div className="flex justify-between items-end mt-2">
                            <div>
                              <p className="text-[11px] text-slate-700">Pembeli: <b>{buyer?.name || 'Masyarakat'}</b></p>
                              <p className="text-[10px] text-[#64748b] mt-0.5">Item: {o.items?.map((item: any) => `${item.productTitle || 'Produk'} (x${item.quantity})`).join(', ') || '1x Item'}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-black text-slate-800">Rp {o.totalAmount.toLocaleString('id-ID')}</p>
                              <span className="text-[8px] bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.2 rounded font-bold uppercase mt-1 inline-block">COMPLETED</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Audit details panel */}
                <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 shadow-sm">
                  {selectedTx ? (
                    <div className="space-y-6 text-xs">
                      <div className="border-b border-[#e2e8f0] pb-3 text-center">
                        <h4 className="font-sora text-xs font-bold text-[#8c6d12] uppercase tracking-wider">Detail Audit Transaksi</h4>
                        <p className="font-mono text-[10px] text-[#64748b] mt-1">{selectedTx.id}</p>
                      </div>

                      {/* Summary item */}
                      <div>
                        <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Item Pembelian:</span>
                        <div className="mt-2 space-y-1.5 bg-[#f8f9fa] p-2.5 rounded-lg border border-[#e2e8f0]">
                          {selectedTx.items?.map((item: any, i: number) => (
                            <div key={i} className="flex justify-between leading-tight text-[11px]">
                              <span className="text-slate-800 truncate max-w-[140px] font-medium">{item.productTitle}</span>
                              <span className="text-[#64748b] font-mono">x{item.quantity} - Rp {item.price?.toLocaleString('id-ID')}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Flow Ledger Audit */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Ledger Aliran Laba & Komisi:</span>
                        <div className="space-y-1.5 font-mono text-[11px]">
                          <div className="flex justify-between text-slate-800 font-bold">
                            <span>Nilai Transaksi:</span>
                            <span>Rp {selectedTx.totalAmount.toLocaleString('id-ID')}</span>
                          </div>

                          {/* Splits values */}
                          <div className="border-t border-[#e2e8f0] my-1.5" />
                          
                          <div className="flex justify-between text-green-700 font-medium">
                            <span>Bagi Laba Penjual (HPP):</span>
                            <span>Rp {Math.round(selectedTx.totalAmount * 0.83).toLocaleString('id-ID')}</span>
                          </div>

                          <div className="flex justify-between text-purple-700 font-medium">
                            <span>Affiliate Tier 1 (10%):</span>
                            <span>Rp {Math.round(selectedTx.totalAmount * 0.10).toLocaleString('id-ID')}</span>
                          </div>

                          <div className="flex justify-between text-purple-700 font-medium">
                            <span>Affiliate Tier 2 (5%):</span>
                            <span>Rp {Math.round(selectedTx.totalAmount * 0.05).toLocaleString('id-ID')}</span>
                          </div>

                          <div className="flex justify-between text-purple-700 font-medium">
                            <span>Affiliate Tier 3 (2%):</span>
                            <span>Rp {Math.round(selectedTx.totalAmount * 0.02).toLocaleString('id-ID')}</span>
                          </div>

                          <div className="flex justify-between text-blue-700 font-medium">
                            <span>Points Cashback (5%):</span>
                            <span>Rp {Math.round(selectedTx.totalAmount * 0.05).toLocaleString('id-ID')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Audit verification stamp */}
                      <div className="p-3 bg-gradient-to-br from-[#fbf7ee] to-white border border-[#8c6d12]/20 rounded-lg text-center">
                        <span className="text-[9px] font-bold text-[#8c6d12] uppercase tracking-widest block">Midtrans / Wallet Secured</span>
                        <span className="text-[9px] text-[#64748b] block mt-0.5 font-mono">Audit Stamp Hash: Verified Ledger 2026</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#64748b] italic">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mb-2">
                        <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
                      </svg>
                      <span>Pilih salah satu transaksi di daftar sebelah kiri untuk melihat rincian laba / komisi afiliasi.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB 7: SERTIFIKAT LEVEL UP ─────────────────────────────────── */}
          {activeTab === 'certificates' && (
            <div className="space-y-6">
              {/* User Selector */}
              <div className="bg-white border border-[#e2e8f0] p-5 rounded-xl shadow-sm flex flex-col md:flex-row gap-4">
                <div className="flex-grow">
                  <h3 className="font-sora text-xs font-bold text-[#8c6d12] uppercase tracking-wider mb-1">Generate Sertifikat Level Up</h3>
                  <p className="text-[11px] text-[#64748b] mb-3">Pilih user bisnis yang telah mencapai minimal Level 3 untuk mengunduh / generate sertifikat resmi mereka secara otomatis.</p>
                  <input
                    type="text"
                    placeholder="Cari user (e.g. Kala Sourdough, Herba, dll)..."
                    value={certUserSearch}
                    onChange={e => setCertUserSearch(e.target.value)}
                    className="w-full bg-white border border-[#cbd5e1] rounded-lg px-4 py-2.5 text-xs text-slate-850 placeholder-[#94a3b8] focus:outline-none focus:border-[#8c6d12]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Users List for Cert */}
                <div className="lg:col-span-1 bg-white border border-[#e2e8f0] rounded-xl overflow-hidden shadow-sm h-[420px] overflow-y-auto">
                  <div className="px-4 py-3 bg-[#f8f9fa] border-b border-[#e2e8f0] text-[10px] font-bold text-[#64748b] uppercase tracking-wider sticky top-0 z-10">
                    Pengguna Level 3+ Terkualifikasi
                  </div>
                  <div className="divide-y divide-slate-100">
                    {certUsers.map(u => (
                      <div
                        key={u.id}
                        onClick={() => setSelectedCertUser(u)}
                        className={`p-3.5 transition-all duration-150 cursor-pointer flex justify-between items-center ${
                          selectedCertUser?.id === u.id ? 'bg-[#fbf7ee] border-l-4 border-[#8c6d12]' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-800">{u.name}</p>
                          <p className="text-[9px] text-[#64748b]">{u.email}</p>
                        </div>
                        <div className="text-right">
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-[#8c6d12]/10 border border-[#8c6d12]/20 text-[#8c6d12] uppercase">
                            Lv.{u.level}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live Certificate Design Rendering */}
                <div className="lg:col-span-2 bg-white border border-[#e2e8f0] rounded-xl p-6 shadow-sm flex flex-col items-center">
                  {selectedCertUser ? (
                    <div className="w-full flex flex-col items-center">
                      <div className="w-full border-4 border-double border-[#8c6d12]/60 bg-black text-[#e2e8f0] rounded-xl p-8 shadow-2xl max-w-lg aspect-[1.414/1] relative overflow-hidden flex flex-col justify-between items-center text-center">
                        {/* Gold Filigree Ornaments */}
                        <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-[#8c6d12]/40 pointer-events-none" />
                        <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-[#8c6d12]/40 pointer-events-none" />
                        <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-[#8c6d12]/40 pointer-events-none" />
                        <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-[#8c6d12]/40 pointer-events-none" />

                        {/* Title Header */}
                        <div>
                          <h4 className="font-sora text-xs font-bold text-[#8c6d12] tracking-[0.25em] uppercase leading-none mt-2">Sertifikat Penghargaan</h4>
                          <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-[#8c6d12] to-transparent mx-auto mt-2" />
                        </div>

                        {/* Recipient */}
                        <div className="my-auto space-y-3">
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest leading-none">Diberikan secara terhormat kepada:</p>
                          <h3 className="font-sora text-lg md:text-xl font-bold text-white tracking-tight uppercase border-b border-[#2b2c34] pb-2 px-6">{selectedCertUser.name}</h3>
                          <p className="text-[10px] text-slate-400 leading-relaxed max-w-sm mx-auto">
                            Atas dedikasi luar biasa dalam mengembangkan ekosistem UMKM Digital Indonesia dan berhasil mencapai tingkat keanggotaan bisnis elit
                          </p>
                          <p className="font-sora text-[#8c6d12] font-bold text-xs uppercase tracking-widest">
                            Level {selectedCertUser.level} - {selectedCertUser.membershipLevel} Elite
                          </p>
                        </div>

                        {/* Signatures & Serial */}
                        <div className="w-full flex justify-between items-end border-t border-slate-800 pt-4 text-[9px] text-slate-400">
                          <div className="text-left font-mono">
                            <span className="block font-sans">No. Serial Sertifikat:</span>
                            <span className="text-[#8c6d12] uppercase">TR-{selectedCertUser.id.toUpperCase()}-{selectedCertUser.level}</span>
                          </div>
                          <div className="text-right">
                            <span className="block italic text-white font-mono font-bold">TERAS_OFFICIAL_STAMP</span>
                            <span className="block mt-0.5">Tanggal: {new Date().toLocaleDateString('id-ID')}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => alert(`Unduhan Sertifikat untuk "${selectedCertUser.name}" berhasil diproses!`)}
                        className="mt-6 px-6 py-2.5 bg-[#8c6d12] hover:bg-[#70560e] text-white text-xs font-bold uppercase tracking-widest rounded-lg shadow-lg cursor-pointer transition-colors"
                      >
                        Cetak / Download PDF Sertifikat
                      </button>
                    </div>
                  ) : (
                    <div className="h-[300px] flex flex-col items-center justify-center text-center p-6 text-[#64748b] italic">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mb-2">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                      </svg>
                      <span>Pilih pengguna di daftar sebelah kiri untuk melihat preview sertifikat level up otomatis.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
