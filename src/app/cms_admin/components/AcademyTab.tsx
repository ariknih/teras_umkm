'use client'

import { useState, useTransition } from 'react'
import { addCourseAction, updateCourseAction, deleteCourseAction, addLessonAction, updateLessonAction, deleteLessonAction } from '@/app/actions/admin'
import { useToast, Toast } from './Toast'

export default function AcademyTab({ initialCourses }: { initialCourses: any[] }) {
  const [courses, setCourses] = useState(initialCourses)
  const [isPending, startTransition] = useTransition()
  const { toast, showToast } = useToast()

  const [courseModal, setCourseModal] = useState<{ open: boolean; mode: 'add' | 'edit'; data?: any }>({ open: false, mode: 'add' })
  const [courseTitle, setCourseTitle] = useState('')
  const [courseDesc, setCourseDesc] = useState('')
  const [courseCover, setCourseCover] = useState('')
  const [courseAccess, setCourseAccess] = useState('Gold')
  const [courseImageError, setCourseImageError] = useState<string | null>(null)

  const [lessonModal, setLessonModal] = useState<{ open: boolean; mode: 'add' | 'edit'; courseId: string; data?: any }>({ open: false, mode: 'add', courseId: '' })
  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonContent, setLessonContent] = useState('')
  const [lessonVideo, setLessonVideo] = useState('')
  const [lessonDuration, setLessonDuration] = useState('300')
  const [lessonOrderIndex, setLessonOrderIndex] = useState('1')
  const [lessonVideoError, setLessonVideoError] = useState<string | null>(null)
  const [isUploadingVideo, setIsUploadingVideo] = useState(false)

  const resetCourseForm = () => {
    setCourseTitle('')
    setCourseDesc('')
    setCourseCover('')
    setCourseAccess('Gold')
    setCourseImageError(null)
  }

  const openEditCourse = (course: any) => {
    setCourseTitle(course.title)
    setCourseDesc(course.description)
    setCourseCover(course.coverImage || '')
    setCourseAccess(course.accessRequired || 'Gold')
    setCourseImageError(null)
    setCourseModal({ open: true, mode: 'edit', data: course })
  }

  const handleCourseSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      if (courseModal.mode === 'add') {
        const res = await addCourseAction(courseTitle, courseDesc, courseCover, courseAccess)
        if (res.success && res.course) {
          setCourses((prev) => [...prev, res.course])
          showToast('Kelas baru berhasil ditambahkan.')
          setCourseModal({ open: false, mode: 'add' })
          resetCourseForm()
        } else {
          showToast(res.error || 'Gagal menambahkan kelas.', 'error')
        }
      } else {
        const id = courseModal.data.id
        const res = await updateCourseAction(id, courseTitle, courseDesc, courseCover, courseAccess)
        if (res.success) {
          setCourses((prev) => prev.map((c) => (c.id === id ? { ...c, title: courseTitle, description: courseDesc, coverImage: courseCover, accessRequired: courseAccess } : c)))
          showToast('Kelas berhasil diperbarui.')
          setCourseModal({ open: false, mode: 'add' })
          resetCourseForm()
        } else {
          showToast(res.error || 'Gagal memperbarui kelas.', 'error')
        }
      }
    })
  }

  const handleDeleteCourse = (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kelas ini beserta semua pelajarannya?')) return
    startTransition(async () => {
      const res = await deleteCourseAction(id)
      if (res.success) {
        setCourses((prev) => prev.filter((c) => c.id !== id))
        showToast('Kelas berhasil dihapus.')
      } else {
        showToast(res.error || 'Gagal menghapus kelas.', 'error')
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

  const handleLessonSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const cId = lessonModal.courseId
    const dur = Number(lessonDuration)
    const idx = Number(lessonOrderIndex)

    startTransition(async () => {
      if (lessonModal.mode === 'add') {
        const res = await addLessonAction(cId, lessonTitle, lessonContent, lessonVideo, dur, idx)
        if (res.success && res.lesson) {
          setCourses((prev) =>
            prev.map((c) => {
              if (c.id === cId) {
                const lessons = [...(c.lessons || []), res.lesson].sort((a: any, b: any) => a.orderIndex - b.orderIndex)
                return { ...c, lessons }
              }
              return c
            })
          )
          showToast('Materi pelajaran berhasil ditambahkan.')
          setLessonModal({ open: false, mode: 'add', courseId: '' })
          resetLessonForm()
        } else {
          showToast(res.error || 'Gagal menambahkan materi pelajaran.', 'error')
        }
      } else {
        const id = lessonModal.data.id
        const res = await updateLessonAction(id, cId, lessonTitle, lessonContent, lessonVideo, dur, idx)
        if (res.success) {
          setCourses((prev) =>
            prev.map((c) => {
              if (c.id === cId) {
                const lessons = (c.lessons || [])
                  .map((l: any) => (l.id === id ? { ...l, title: lessonTitle, content: lessonContent, videoUrl: lessonVideo, duration: dur, orderIndex: idx } : l))
                  .sort((a: any, b: any) => a.orderIndex - b.orderIndex)
                return { ...c, lessons }
              }
              return c
            })
          )
          showToast('Materi pelajaran berhasil diperbarui.')
          setLessonModal({ open: false, mode: 'add', courseId: '' })
          resetLessonForm()
        } else {
          showToast(res.error || 'Gagal memperbarui materi pelajaran.', 'error')
        }
      }
    })
  }

  const handleDeleteLesson = (id: string, courseId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus materi pelajaran ini?')) return
    startTransition(async () => {
      const res = await deleteLessonAction(id, courseId)
      if (res.success) {
        setCourses((prev) =>
          prev.map((c) => (c.id === courseId ? { ...c, lessons: (c.lessons || []).filter((l: any) => l.id !== id) } : c))
        )
        showToast('Materi pelajaran berhasil dihapus.')
      } else {
        showToast(res.error || 'Gagal menghapus materi.', 'error')
      }
    })
  }

  const handleShiftLessonOrder = (lesson: any, direction: 'up' | 'down', course: any) => {
    const lessons = [...(course.lessons || [])].sort((a: any, b: any) => a.orderIndex - b.orderIndex)
    const idx = lessons.findIndex((l: any) => l.id === lesson.id)
    if (idx === -1) return
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= lessons.length) return

    const otherLesson = lessons[targetIdx]
    const tempIndex = lesson.orderIndex
    lesson.orderIndex = otherLesson.orderIndex
    otherLesson.orderIndex = tempIndex

    startTransition(async () => {
      const res1 = await updateLessonAction(lesson.id, course.id, lesson.title, lesson.content, lesson.videoUrl, lesson.duration, lesson.orderIndex)
      const res2 = await updateLessonAction(otherLesson.id, course.id, otherLesson.title, otherLesson.content, otherLesson.videoUrl, otherLesson.duration, otherLesson.orderIndex)
      if (res1.success && res2.success) {
        setCourses((prev) =>
          prev.map((c) => {
            if (c.id === course.id) {
              const updated = (c.lessons || [])
                .map((l: any) => {
                  if (l.id === lesson.id) return { ...l, orderIndex: lesson.orderIndex }
                  if (l.id === otherLesson.id) return { ...l, orderIndex: otherLesson.orderIndex }
                  return l
                })
                .sort((a: any, b: any) => a.orderIndex - b.orderIndex)
              return { ...c, lessons: updated }
            }
            return c
          })
        )
        showToast('Urutan materi pelajaran berhasil digeser.')
      } else {
        showToast('Gagal menggeser urutan materi pelajaran.', 'error')
      }
    })
  }

  const handleVideoUpload = async (file: File) => {
    setLessonVideoError(null)
    if (file.size > 500 * 1024 * 1024) {
      setLessonVideoError(`⚠️ Ukuran file video (${(file.size / 1024 / 1024).toFixed(1)} MB) terlalu besar (maksimal 500 MB).`)
      return
    }

    try {
      setIsUploadingVideo(true)

      try {
        const presignedRes = await fetch('/api/upload/presigned', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, fileType: file.type || 'video/mp4', folder: 'courses' })
        })

        if (presignedRes.ok) {
          const presignedData = await presignedRes.json()
          if (presignedData.uploadUrl && presignedData.publicUrl) {
            const s3Success = await new Promise<boolean>((resolve) => {
              const xhr = new XMLHttpRequest()
              xhr.open('PUT', presignedData.uploadUrl, true)
              xhr.setRequestHeader('Content-Type', file.type || 'video/mp4')
              xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300)
              xhr.onerror = () => resolve(false)
              xhr.ontimeout = () => resolve(false)
              xhr.send(file)
            })

            if (s3Success) {
              setLessonVideo(presignedData.publicUrl)
              return
            }
          }
        }
      } catch (s3Err) {
        console.warn('Presigned upload failed, attempting fallback server upload:', s3Err)
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'courses')
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()

      if (res.ok && data.url) {
        setLessonVideo(data.url)
      } else if (file.size <= 3.5 * 1024 * 1024) {
        const reader = new FileReader()
        reader.onload = () => setLessonVideo(reader.result as string)
        reader.readAsDataURL(file)
      } else {
        setLessonVideoError(data.error || '⚠️ Gagal mengunggah file. Silakan periksa koneksi atau gunakan Tautan URL Video.')
      }
    } catch {
      setLessonVideoError('⚠️ Gagal mengunggah file. Silakan periksa koneksi atau gunakan Tautan URL Video.')
    } finally {
      setIsUploadingVideo(false)
    }
  }

  return (
    <div className="space-y-8">
      <Toast toast={toast} />

      <div className="flex justify-between items-center bg-white border border-[#e2e8f0] p-5 rounded-[var(--radius-brand)] shadow-sm">
        <div>
          <h3 className="font-sora text-xs font-bold text-[#0F5132] uppercase tracking-wider">Kurikulum Akademi Premium</h3>
          <p className="text-[11px] text-[#64748b]">Manajemen kelas, edit silabus, tambahkan bab/pelajaran materi pembelajaran digital.</p>
        </div>
        <button
          onClick={() => { resetCourseForm(); setCourseModal({ open: true, mode: 'add' }) }}
          className="px-4 py-2.5 bg-primary hover:bg-[#259a3f] text-white font-bold uppercase text-xs tracking-wider rounded-[var(--radius-brand)] transition-colors cursor-pointer shadow-md"
        >
          + Tambah Kelas Baru
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="bg-white border border-[#e2e8f0] rounded-[var(--radius-brand)] overflow-hidden hover:border-[#0F5132]/20 transition-all duration-300 shadow-sm">
            <div className="p-6 md:flex gap-6 border-b border-[#e2e8f0]">
              <div className="w-full md:w-[220px] aspect-[16/9] md:aspect-auto rounded-[var(--radius-brand)] bg-slate-50 overflow-hidden border border-[#cbd5e1] flex-shrink-0 flex items-center justify-center">
                {course.coverImage ? (
                  <img src={course.coverImage} alt={course.title} className="object-cover w-full h-full" />
                ) : (
                  <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest">Premium Module</span>
                )}
              </div>
              <div className="flex-grow mt-4 md:mt-0 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#E8F5E9] border border-[#0F5132]/20 text-[#0F5132] uppercase tracking-wider">
                      Level Akses: {course.accessRequired || 'Gold'}
                    </span>
                    <span className="text-[10px] font-mono text-[#64748b]">{course.id}</span>
                  </div>
                  <h4 className="font-sora text-sm font-bold text-slate-800 mt-2">{course.title}</h4>
                  <p className="text-xs text-[#64748b] leading-relaxed mt-2.5">{course.description}</p>
                </div>
                <div className="flex gap-3 mt-4 pt-4 border-t border-slate-100">
                  <button onClick={() => openEditCourse(course)} className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-[#cbd5e1] font-bold text-[10px] uppercase tracking-widest rounded transition-colors cursor-pointer">
                    Edit Kelas
                  </button>
                  <button onClick={() => handleDeleteCourse(course.id)} className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-[10px] uppercase tracking-widest rounded transition-colors cursor-pointer">
                    Hapus Kelas
                  </button>
                  <button onClick={() => openAddLesson(course.id)} className="ml-auto px-4 py-1.5 bg-[#0F5132]/10 hover:bg-[#0F5132]/20 text-[#0F5132] border border-[#0F5132]/20 font-bold text-[10px] uppercase tracking-widest rounded transition-all cursor-pointer">
                    + Tambah Pelajaran
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 bg-[#fafbfc] space-y-3">
              <h5 className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Syllabus / Bab Pelajaran ({course.lessons?.length || 0} Bab)</h5>
              {course.lessons && course.lessons.length > 0 ? (
                <div className="space-y-2">
                  {course.lessons.map((lesson: any, idx: number) => (
                    <div key={lesson.id} className="flex justify-between items-center p-3.5 bg-white border border-[#e2e8f0] rounded-[var(--radius-brand)] hover:border-[#cbd5e1] transition-colors shadow-sm">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[9px] font-bold text-[#0F5132] bg-[#E8F5E9] px-1.5 py-0.2 border border-[#0F5132]/10 rounded">Urutan {lesson.orderIndex}</span>
                          <span className="text-xs font-bold text-slate-800">{lesson.title}</span>
                        </div>
                        <p className="text-[10px] text-[#64748b] mt-1.5 line-clamp-1">{lesson.content}</p>
                        <div className="flex items-center gap-3.5 mt-1.5 text-[10px] text-[#64748b] font-mono">
                          <span>Durasi: {Math.round(lesson.duration / 60)} menit</span>
                          <span>•</span>
                          <span className="truncate max-w-[250px]" title={lesson.videoUrl}>Video: {lesson.videoUrl || 'Tidak ada video'}</span>
                        </div>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0 items-center">
                        <button type="button" disabled={isPending || idx === 0} onClick={() => handleShiftLessonOrder(lesson, 'up', course)} title="Geser Urutan Ke Atas" className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-bold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors">▲</button>
                        <button type="button" disabled={isPending || idx === course.lessons.length - 1} onClick={() => handleShiftLessonOrder(lesson, 'down', course)} title="Geser Urutan Ke Bawah" className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-bold disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors">▼</button>
                        <button onClick={() => openEditLesson(lesson, course.id)} className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded text-[10px] uppercase font-bold tracking-wider cursor-pointer border border-[#e2e8f0]">Edit</button>
                        <button onClick={() => handleDeleteLesson(lesson.id, course.id)} className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded text-[10px] uppercase font-bold tracking-wider cursor-pointer border border-red-100">Hapus</button>
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

      {courseModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#0F5132]/25 rounded-[var(--radius-brand)] max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-sora text-sm font-bold text-[#0F5132] uppercase tracking-wider">{courseModal.mode === 'add' ? 'Tambah Kelas Baru' : 'Edit Kelas'}</h3>
              <button onClick={() => setCourseModal({ open: false, mode: 'add' })} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCourseSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Judul Kelas</label>
                <input type="text" required value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)} placeholder="e.g. Mastering Luxury Commerce" className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2.5 text-slate-800 outline-none focus:border-[#0F5132] focus:ring-1 focus:ring-[#0F5132]" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Deskripsi Singkat</label>
                <textarea required rows={3} value={courseDesc} onChange={(e) => setCourseDesc(e.target.value)} placeholder="Tulis ringkasan kurikulum..." className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2.5 text-slate-800 outline-none focus:border-[#0F5132] focus:ring-1 focus:ring-[#0F5132]" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Akses Keanggotaan</label>
                  <select value={courseAccess} onChange={(e) => setCourseAccess(e.target.value)} className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2 text-slate-800 outline-none focus:border-[#0F5132] focus:ring-1 focus:ring-[#0F5132]">
                    <option value="Gold">Gold</option>
                    <option value="Platinum">Platinum</option>
                    <option value="Diamond">Diamond</option>
                    <option value="Bootcamp">Bootcamp</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Cover Image (Upload File)</label>
                    <span className="text-[10px] font-semibold text-emerald-600">Maks. 10 MB (Auto-Kompresi)</span>
                  </div>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        setCourseImageError(null)
                        if (!file) return
                        if (file.size > 15 * 1024 * 1024) {
                          setCourseImageError(`⚠️ Ukuran file terlalu besar (${(file.size / 1024 / 1024).toFixed(1)} MB)! Maksimal ukuran file cover adalah 10 MB.`)
                          return
                        }
                        const reader = new FileReader()
                        reader.onload = (evt) => {
                          const img = new Image()
                          img.onload = () => {
                            const canvas = document.createElement('canvas')
                            let w = img.width
                            let h = img.height
                            const maxDim = 1200
                            if (w > maxDim || h > maxDim) {
                              if (w > h) { h = Math.round((h * maxDim) / w); w = maxDim } else { w = Math.round((w * maxDim) / h); h = maxDim }
                            }
                            canvas.width = w
                            canvas.height = h
                            const ctx = canvas.getContext('2d')
                            if (ctx) {
                              ctx.drawImage(img, 0, 0, w, h)
                              const compressed = canvas.toDataURL('image/jpeg', 0.82)
                              if (compressed.length > 3.5 * 1024 * 1024) {
                                setCourseImageError('⚠️ Ukuran gambar setelah kompresi melebihi 3 MB. Silakan pilih gambar yang lebih kecil.')
                              } else {
                                setCourseCover(compressed)
                              }
                            } else {
                              setCourseCover(evt.target?.result as string)
                            }
                          }
                          img.onerror = () => setCourseCover(evt.target?.result as string)
                          img.src = evt.target?.result as string
                        }
                        reader.readAsDataURL(file)
                      }}
                      className="w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-[11px] file:font-semibold file:bg-[#0F5132]/10 file:text-[#0F5132] hover:file:bg-[#0F5132]/20 cursor-pointer"
                    />
                    {courseImageError && <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-[11px] font-medium leading-relaxed">{courseImageError}</div>}
                    {courseCover && !courseImageError && (
                      <div className="w-16 h-10 relative rounded overflow-hidden border border-slate-200">
                        <img src={courseCover} alt="Preview" className="object-cover w-full h-full" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setCourseModal({ open: false, mode: 'add' })} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-850 font-bold rounded-[var(--radius-brand)] uppercase tracking-wider transition-colors cursor-pointer">Batal</button>
                <button type="submit" disabled={isPending || !!courseImageError} className="flex-1 py-2.5 bg-primary hover:bg-[#259a3f] text-white font-bold rounded-[var(--radius-brand)] uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                  {isPending ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {lessonModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#0F5132]/25 rounded-[var(--radius-brand)] max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-sora text-sm font-bold text-[#0F5132] uppercase tracking-wider">{lessonModal.mode === 'add' ? 'Tambah Pelajaran Baru' : 'Edit Pelajaran'}</h3>
              <button onClick={() => setLessonModal({ open: false, mode: 'add', courseId: '' })} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleLessonSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Judul Pelajaran</label>
                <input type="text" required value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} placeholder="e.g. 1. Dasar Pembuatan Brand" className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2.5 text-slate-800 outline-none focus:border-[#0F5132] focus:ring-1 focus:ring-[#0F5132]" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Isi Materi</label>
                <textarea required rows={4} value={lessonContent} onChange={(e) => setLessonContent(e.target.value)} placeholder="Tulis narasi pembelajaran materi secara rinci..." className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2.5 text-slate-800 outline-none focus:border-[#0F5132] focus:ring-1 focus:ring-[#0F5132]" />
              </div>

              <div className="space-y-3 p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-xl">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Tautan URL Video</label>
                    <span className="text-[9px] font-semibold text-emerald-600">YouTube, Vimeo, MP4 URL</span>
                  </div>
                  <input
                    type="url"
                    value={lessonVideo.startsWith('data:') || lessonVideo.includes('.s3.') || lessonVideo.startsWith('/uploads/') ? '' : lessonVideo}
                    onChange={(e) => { setLessonVideoError(null); setLessonVideo(e.target.value) }}
                    placeholder="https://www.youtube.com/watch?v=... atau https://..."
                    className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3 py-2 text-slate-800 text-xs outline-none focus:border-[#0F5132]"
                  />
                </div>

                <div className="border-t border-slate-200/60 pt-2.5">
                  <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1">Atau Unggah File Video</label>
                  <input
                    type="file"
                    accept="video/*"
                    disabled={isUploadingVideo}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleVideoUpload(file)
                    }}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-[#0F5132]/10 file:text-[#0F5132] hover:file:bg-[#0F5132]/20 cursor-pointer disabled:opacity-50"
                  />
                  {lessonVideoError && <div className="p-2.5 mt-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-[11px] font-medium leading-relaxed">{lessonVideoError}</div>}
                  {lessonVideo && !lessonVideoError && (
                    <div className="mt-2.5 space-y-2">
                      <div className="rounded-lg overflow-hidden border border-emerald-200 bg-black">
                        <video src={lessonVideo} controls preload="metadata" className="w-full max-h-[180px] object-contain" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                          <span>✓ Video Berhasil Diunggah</span>
                          <span className="truncate max-w-[180px] font-normal text-emerald-600/70">{lessonVideo.includes('/') ? decodeURIComponent(lessonVideo.split('/').pop() || '') : 'Base64 Video'}</span>
                        </div>
                        <button type="button" onClick={() => { setLessonVideo(''); setLessonVideoError(null) }} className="text-[9px] font-semibold text-red-500 hover:text-red-700 transition-colors">✕ Hapus</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">Durasi (Detik)</label>
                  <input type="number" required value={lessonDuration} onChange={(e) => setLessonDuration(e.target.value)} className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2 text-slate-850 outline-none focus:border-[#0F5132] focus:ring-1 focus:ring-[#0F5132]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#64748b] uppercase tracking-wider mb-1.5">No. Urut (Indeks)</label>
                  <input type="number" required value={lessonOrderIndex} onChange={(e) => setLessonOrderIndex(e.target.value)} className="w-full bg-white border border-[#cbd5e1] rounded-[var(--radius-brand)] px-3.5 py-2 text-slate-850 outline-none focus:border-[#0F5132] focus:ring-1 focus:ring-[#0F5132]" />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setLessonModal({ open: false, mode: 'add', courseId: '' })} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-850 font-bold rounded-[var(--radius-brand)] uppercase tracking-wider transition-colors cursor-pointer">Batal</button>
                <button type="submit" disabled={isPending || !!lessonVideoError} className="flex-1 py-2.5 bg-primary hover:bg-[#259a3f] text-white font-bold rounded-[var(--radius-brand)] uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                  {isPending ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
