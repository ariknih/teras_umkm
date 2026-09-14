'use server'

import { DataStore } from '@/lib/data-store'
import { getCurrentUser } from './auth'
import { logAudit } from '@/lib/audit-log'
import { revalidatePath } from 'next/cache'
import { deleteCache, invalidateCachePattern } from '@/lib/cache'
import { extractYouTubeId, CERTIFICATE_TEMPLATE_TYPES, PROTECTED_CERTIFICATE_TEMPLATE_NAME } from '@/lib/lms-rules'
import { hashPassword, verifyPassword } from '@/lib/password'
import { deleteUploadedFile } from '@/lib/delete-upload'
import { getDisabledModulesForTemplate, normalizeTemplateType } from '@/lib/community-templates'
import { isValidAdminType, DEFAULT_ADMIN_TYPE } from '@/app/cms_admin/admin-types'
import { validateConfig, diffConfig, type FeatureControl } from '@/lib/features'

// Logs a denied privilege check. Fires only on the throw path — access that
// succeeds is not logged here, only the specific mutations that matter are
// (see call sites below), so this stays cheap and doesn't drown the log.
async function logAccessDenied(action: string, user: { id: string; name?: string | null; email?: string | null; role?: string } | null, detail?: string) {
  await logAudit({
    actor: 'MEMBER',
    actorId: user?.id || 'anonymous',
    actorName: user?.name || user?.email || undefined,
    action,
    module: 'AUTH',
    detail
  })
}

// Helper to check admin access
async function ensureAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    await logAccessDenied('ADMIN_ACCESS_DENIED', user, 'Bukan administrator.')
    throw new Error('Unauthorized: Hanya untuk Administrator.')
  }
  return user
}

// Helper to check Superadmin access. Re-derives from the DB rather than
// trusting the session, and requires an explicit `true` — no email/name
// heuristics, no "any ADMIN counts" fallback. Superadmin count is fixed;
// this must never pass for anyone whose row doesn't already have the flag.
export async function ensureSuperAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    await logAccessDenied('SUPERADMIN_ACCESS_DENIED', user, 'Bukan administrator.')
    throw new Error('Unauthorized: Akses khusus Superadmin.')
  }
  const dbUser: any = await DataStore.findUserById(user.id)
  if (!dbUser || dbUser.isSuperAdmin !== true) {
    await logAccessDenied('SUPERADMIN_ACCESS_DENIED', user, 'Bukan superadmin.')
    throw new Error('Unauthorized: Akses khusus Superadmin.')
  }
  return dbUser
}

// Throws unless `targetId` is the caller's own account or a non-superadmin.
// A superadmin's account can only be changed by itself; nobody else — not
// even another superadmin — can edit or delete it via the app.
async function ensureNotEditingOtherSuperAdmin(currentUserId: string, targetId: string) {
  if (targetId === currentUserId) return
  const target: any = await DataStore.findUserById(targetId)
  if (target?.isSuperAdmin === true) {
    throw new Error('Unauthorized: Tidak dapat mengubah atau menghapus akun superadmin lain.')
  }
}

// ─── USER MANAGEMENT ACTIONS ────────────────────────────────────────────────
export async function updateUserRoleAndLevelAction(
  userId: string,
  role: string,
  level: number,
  xp: number,
  membershipLevel: string,
  membershipAccess: string,
  bootcampStatus?: string
) {
  const admin = await ensureAdmin()
  try {
    const target: any = await DataStore.findUserById(userId)
    if (role === 'ADMIN' || target?.role === 'ADMIN') {
      throw new Error('Akun admin dikelola lewat menu Admins, bukan lewat menu Users.')
    }
    await DataStore.updateUserRoleAndLevel(userId, role, level, xp, membershipLevel, membershipAccess, bootcampStatus)
    await logAudit({
      actor: 'ADMIN',
      actorId: admin.id,
      actorName: admin.name || admin.email,
      action: 'UPDATE_USER_ROLE',
      module: 'USERS',
      targetId: userId,
      targetType: 'USER',
      detail: `Role: ${target?.role || '-'} → ${role}. Level: ${target?.level ?? '-'} → ${level}.`
    })
    revalidatePath('/cms_admin', 'layout')
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal memperbarui user.' }
  }
}

// ─── COURSE ACTIONS ────────────────────────────────────────────────────────
// Every academy mutation clears the `lms:` cache. The public course reads are
// wrapped in a 300s cache that revalidatePath does not touch, so without this
// a CMS edit stayed invisible on /academy for up to five minutes.
async function revalidateAcademy(courseId?: string) {
  await invalidateCachePattern('lms:')
  revalidatePath('/cms_admin', 'layout')
  revalidatePath('/academy')
  if (courseId) revalidatePath(`/academy/course/${courseId}`)
}

function cleanCourseInput(title: string, description: string, price: number) {
  const cleanTitle = (title || '').trim()
  if (!cleanTitle) throw new Error('Judul kursus wajib diisi.')
  return {
    title: cleanTitle,
    description: (description || '').trim(),
    price: Math.max(0, Math.floor(Number(price) || 0)),
  }
}

export async function addCourseAction(title: string, description: string, coverImage: string, accessRequired: string, price: number = 0, certificateTemplateId?: string | null, isPublished: boolean = true) {
  const admin = await ensureAdmin()
  try {
    const clean = cleanCourseInput(title, description, price)
    const course = await DataStore.addCourse(clean.title, clean.description, coverImage, accessRequired, clean.price, certificateTemplateId, isPublished)
    await logAudit({
      actor: 'ADMIN',
      actorId: admin.id,
      actorName: admin.name || admin.email,
      action: 'CREATE_COURSE',
      module: 'ACADEMY',
      targetId: course.id,
      targetType: 'COURSE',
      detail: `Kelas "${clean.title}".`
    })
    await revalidateAcademy()
    return { success: true, course }
  } catch (e: any) {
    return { error: e.message || 'Gagal menambahkan kursus.' }
  }
}

// "Pasarkan" / "Tarik dari Pasar" — a standalone, immediate toggle in the CMS,
// deliberately separate from updateCourseAction's staged edit-form save.
export async function setCoursePublishedAction(id: string, isPublished: boolean) {
  const admin = await ensureAdmin()
  try {
    await DataStore.setCoursePublished(id, isPublished)
    await logAudit({
      actor: 'ADMIN',
      actorId: admin.id,
      actorName: admin.name || admin.email,
      action: 'SET_COURSE_PUBLISHED',
      module: 'ACADEMY',
      targetId: id,
      targetType: 'COURSE',
      detail: isPublished ? 'Dipasarkan.' : 'Ditarik dari pasar.'
    })
    await revalidateAcademy(id)
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal mengubah status pemasaran kursus.' }
  }
}

export async function updateCourseAction(id: string, title: string, description: string, coverImage: string, accessRequired: string, price: number = 0, certificateTemplateId?: string | null) {
  const admin = await ensureAdmin()
  try {
    const clean = cleanCourseInput(title, description, price)
    await DataStore.updateCourse(id, clean.title, clean.description, coverImage, accessRequired, clean.price, certificateTemplateId)
    await logAudit({
      actor: 'ADMIN',
      actorId: admin.id,
      actorName: admin.name || admin.email,
      action: 'UPDATE_COURSE',
      module: 'ACADEMY',
      targetId: id,
      targetType: 'COURSE'
    })
    await revalidateAcademy(id)
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal memperbarui kursus.' }
  }
}

export async function deleteCourseAction(id: string) {
  const admin = await ensureAdmin()
  try {
    await DataStore.deleteCourse(id)
    await logAudit({
      actor: 'ADMIN',
      actorId: admin.id,
      actorName: admin.name || admin.email,
      action: 'DELETE_COURSE',
      module: 'ACADEMY',
      targetId: id,
      targetType: 'COURSE'
    })
    await revalidateAcademy()
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal menghapus kursus.' }
  }
}

// ─── CERTIFICATE TEMPLATE ACTIONS ──────────────────────────────────────────
// Trust-boundary validation for `backgroundImage`: the CMS form already
// crops/resizes/converts it client-side, but a caller bypassing the client
// could send anything, so the server re-checks shape and caps the size.
const MAX_TEMPLATE_IMAGE_BASE64_LENGTH = 3 * 1024 * 1024

function cleanCertificateTemplateInput(name: string, type: string, backgroundImage: string) {
  const cleanName = (name || '').trim()
  if (!cleanName) throw new Error('Nama sertifikat wajib diisi.')
  if (!CERTIFICATE_TEMPLATE_TYPES.includes(type as any)) throw new Error('Tipe sertifikat tidak valid.')
  if (!backgroundImage || !backgroundImage.startsWith('data:image/')) throw new Error('Gambar sertifikat wajib diunggah.')
  if (backgroundImage.length > MAX_TEMPLATE_IMAGE_BASE64_LENGTH) throw new Error('Ukuran gambar sertifikat terlalu besar.')
  return { name: cleanName, type, backgroundImage }
}

export async function addCertificateTemplateAction(name: string, type: string, backgroundImage: string) {
  const admin = await ensureAdmin()
  try {
    const clean = cleanCertificateTemplateInput(name, type, backgroundImage)
    const template = await DataStore.addCertificateTemplate(clean.name, clean.type, clean.backgroundImage)
    await logAudit({
      actor: 'ADMIN',
      actorId: admin.id,
      actorName: admin.name || admin.email,
      action: 'CREATE_CERTIFICATE_TEMPLATE',
      module: 'ACADEMY',
      targetId: template.id,
      targetType: 'CERTIFICATE_TEMPLATE',
      detail: `Template "${clean.name}" (${clean.type}).`
    })
    await revalidateAcademy()
    return { success: true, template }
  } catch (e: any) {
    return { error: e.message || 'Gagal menambahkan template sertifikat.' }
  }
}

export async function updateCertificateTemplateAction(id: string, name: string, type: string, backgroundImage: string) {
  const admin = await ensureAdmin()
  try {
    const existing: any = await DataStore.getCertificateTemplateById(id)
    if (existing?.name === PROTECTED_CERTIFICATE_TEMPLATE_NAME) {
      await ensureSuperAdmin()
    }
    const clean = cleanCertificateTemplateInput(name, type, backgroundImage)
    await DataStore.updateCertificateTemplate(id, clean.name, clean.type, clean.backgroundImage)
    await logAudit({
      actor: 'ADMIN',
      actorId: admin.id,
      actorName: admin.name || admin.email,
      action: 'UPDATE_CERTIFICATE_TEMPLATE',
      module: 'ACADEMY',
      targetId: id,
      targetType: 'CERTIFICATE_TEMPLATE'
    })
    await revalidateAcademy()
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal memperbarui template sertifikat.' }
  }
}

export async function deleteCertificateTemplateAction(id: string) {
  const admin = await ensureAdmin()
  try {
    const existing: any = await DataStore.getCertificateTemplateById(id)
    if (existing?.name === PROTECTED_CERTIFICATE_TEMPLATE_NAME) {
      throw new Error('Template bawaan Saloka tidak dapat dihapus.')
    }
    await DataStore.deleteCertificateTemplate(id)
    await logAudit({
      actor: 'ADMIN',
      actorId: admin.id,
      actorName: admin.name || admin.email,
      action: 'DELETE_CERTIFICATE_TEMPLATE',
      module: 'ACADEMY',
      targetId: id,
      targetType: 'CERTIFICATE_TEMPLATE'
    })
    await revalidateAcademy()
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal menghapus template sertifikat.' }
  }
}

// ─── LESSON (MODULE) ACTIONS ───────────────────────────────────────────────
// Single object param rather than positional args: the CMS reorder handler
// re-sends every field on each swap, so a field missed at one call site used to
// be silently wiped.
export type LessonActionInput = {
  title: string
  content: string
  videoUrl: string
  type?: string
  duration: number
  orderIndex: number
}

function cleanLessonInput(input: LessonActionInput) {
  const title = (input.title || '').trim()
  if (!title) throw new Error('Judul modul wajib diisi.')
  return {
    title,
    content: (input.content || '').trim(),
    videoUrl: input.videoUrl || '',
    type: input.type || 'VIDEO',
    duration: Math.max(0, Math.floor(Number(input.duration) || 0)),
    orderIndex: Math.max(0, Math.floor(Number(input.orderIndex) || 0)),
  }
}

export async function addLessonAction(courseId: string, input: LessonActionInput) {
  const admin = await ensureAdmin()
  try {
    const lesson = await DataStore.addLesson({ courseId, ...cleanLessonInput(input) })
    await logAudit({
      actor: 'ADMIN',
      actorId: admin.id,
      actorName: admin.name || admin.email,
      action: 'CREATE_LESSON',
      module: 'ACADEMY',
      targetId: lesson.id,
      targetType: 'LESSON',
      detail: `Modul untuk kelas #${courseId}.`
    })
    await revalidateAcademy(courseId)
    return { success: true, lesson }
  } catch (e: any) {
    return { error: e.message || 'Gagal menambahkan modul.' }
  }
}

export async function updateLessonAction(id: string, courseId: string, input: LessonActionInput) {
  const admin = await ensureAdmin()
  try {
    await DataStore.updateLesson(id, cleanLessonInput(input))
    await logAudit({
      actor: 'ADMIN',
      actorId: admin.id,
      actorName: admin.name || admin.email,
      action: 'UPDATE_LESSON',
      module: 'ACADEMY',
      targetId: id,
      targetType: 'LESSON'
    })
    await revalidateAcademy(courseId)
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal memperbarui modul.' }
  }
}

/**
 * Reads the true length of a YouTube video so the CMS never has to rely on a
 * hand-typed duration. The 90% completion rule divides by this number: too
 * high and the module can never be finished, too low and it completes early.
 *
 * ponytail: parses `lengthSeconds` out of the watch page rather than using the
 * YouTube Data API, which would need a key and a quota. Swap to the API if this
 * ever starts failing — the caller already treats failure as "leave it alone".
 */
export async function fetchYouTubeDurationAction(url: string) {
  await ensureAdmin()
  const id = extractYouTubeId(url)
  if (!id) return { error: 'Bukan tautan YouTube.' }

  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${id}`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })
    if (!res.ok) return { error: `YouTube membalas ${res.status}.` }
    const m = (await res.text()).match(/"lengthSeconds":"(\d+)"/)
    if (!m) return { error: 'Durasi tidak ditemukan pada halaman video.' }
    return { success: true, duration: Number(m[1]) }
  } catch (e: any) {
    return { error: e.message || 'Gagal membaca durasi video.' }
  }
}

export async function deleteLessonAction(id: string, courseId: string) {
  const admin = await ensureAdmin()
  try {
    await DataStore.deleteLesson(id)
    await logAudit({
      actor: 'ADMIN',
      actorId: admin.id,
      actorName: admin.name || admin.email,
      action: 'DELETE_LESSON',
      module: 'ACADEMY',
      targetId: id,
      targetType: 'LESSON'
    })
    await revalidateAcademy(courseId)
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal menghapus modul.' }
  }
}

// ─── TRANSACTION TRACKING ───────────────────────────────────────────────────
export async function trackTransactionAction(orderId: string) {
  await ensureAdmin()
  try {
    const order = await DataStore.findOrderById(orderId)
    if (!order) {
      return { error: `Transaksi dengan ID "${orderId}" tidak ditemukan.` }
    }
    return { success: true, order }
  } catch (e: any) {
    return { error: e.message || 'Gagal melacak transaksi.' }
  }
}

export async function generateDummyAffiliatesAction(count: number = 10) {
  await ensureAdmin()
  try {
    await DataStore.generateDummyAffiliates(count)
    revalidatePath('/cms_admin', 'layout')
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal membuat dummy affiliate.' }
  }
}

export async function getAdminsAction() {
  await ensureSuperAdmin()
  try {
    return await DataStore.getAdmins()
  } catch (e: any) {
    throw new Error(e.message || 'Gagal mengambil data admin.')
  }
}

export async function createAdminAction(formData: FormData) {
  const currentUser = await ensureSuperAdmin()
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const adminPermissions = formData.get('adminPermissions') as string || null
  const adminTypeRaw = formData.get('adminType') as string
  const adminType = isValidAdminType(adminTypeRaw) ? adminTypeRaw : DEFAULT_ADMIN_TYPE

  if (!name || !email || !password) {
    return { error: 'Nama, email, dan password wajib diisi.' }
  }

  const passwordHash = await hashPassword(password)

  try {
    // isSuperAdmin is never accepted from the client: the superadmin count is
    // fixed and no app code path may ever create another one.
    const admin = await DataStore.createAdmin({
      name,
      email,
      passwordHash,
      isSuperAdmin: false,
      adminPermissions,
      adminType
    })
    await logAudit({
      actor: 'ADMIN',
      actorId: currentUser.id,
      actorName: currentUser.name || currentUser.email,
      action: 'CREATE_ADMIN',
      module: 'ADMINS',
      targetId: admin.id,
      targetType: 'USER',
      detail: `Admin baru "${name}" (${email}) dibuat.`
    })
    revalidatePath('/cms_admin', 'layout')
    return { success: true, admin }
  } catch (e: any) {
    return { error: e.message || 'Gagal menambahkan admin.' }
  }
}

export async function updateAdminAction(formData: FormData) {
  const currentUser = await ensureSuperAdmin()
  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const currentPassword = formData.get('currentPassword') as string
  const adminPermissions = formData.get('adminPermissions') as string || null
  const adminTypeRaw = formData.get('adminType') as string
  const adminType = isValidAdminType(adminTypeRaw) ? adminTypeRaw : undefined

  if (!id || !name || !email) {
    return { error: 'ID, nama, dan email wajib diisi.' }
  }

  try {
    await ensureNotEditingOtherSuperAdmin(currentUser.id, id)

    // isSuperAdmin is intentionally never written here: this action can
    // neither promote a new superadmin nor demote an existing one.
    const updateData: any = {
      name,
      email,
      adminPermissions,
      ...(adminType !== undefined ? { adminType } : {})
    }

    if (password && password.trim().length > 0) {
      // Changing your own password requires proving you know the current
      // one — this is the one field an authenticated session alone must
      // not be enough to change on its own account.
      if (id === currentUser.id) {
        if (!currentPassword || !(await verifyPassword(currentPassword, currentUser.passwordHash))) {
          return { error: 'Kata sandi saat ini salah.' }
        }
      }
      updateData.passwordHash = await hashPassword(password)
    }

    const admin = await DataStore.updateAdmin(id, updateData)
    await logAudit({
      actor: 'ADMIN',
      actorId: currentUser.id,
      actorName: currentUser.name || currentUser.email,
      action: 'UPDATE_ADMIN',
      module: 'ADMINS',
      targetId: id,
      targetType: 'USER',
      detail: `Admin "${name}" (${email}) diperbarui.${updateData.passwordHash ? ' Password diubah.' : ''}`
    })
    revalidatePath('/cms_admin', 'layout')
    return { success: true, admin }
  } catch (e: any) {
    return { error: e.message || 'Gagal memperbarui admin.' }
  }
}

export async function deleteAdminAction(id: string) {
  const currentUser = await ensureSuperAdmin()
  if (currentUser.id === id) {
    return { error: 'Anda tidak dapat menghapus akun Anda sendiri.' }
  }
  try {
    await ensureNotEditingOtherSuperAdmin(currentUser.id, id)
    await DataStore.deleteAdmin(id)
    await logAudit({
      actor: 'ADMIN',
      actorId: currentUser.id,
      actorName: currentUser.name || currentUser.email,
      action: 'DELETE_ADMIN',
      module: 'ADMINS',
      targetId: id,
      targetType: 'USER'
    })
    revalidatePath('/cms_admin', 'layout')
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal menghapus admin.' }
  }
}

export async function getInvoiceMembershipsAction(status?: string) {
  await ensureAdmin()
  try {
    return await DataStore.getInvoiceMemberships(status)
  } catch (e: any) {
    throw new Error(e.message || 'Gagal mengambil data invoice.')
  }
}

export async function verifyInvoiceMembershipAction(membershipId: string) {
  const admin = await ensureAdmin()
  try {
    const res: any = await DataStore.verifyInvoiceMembership(membershipId, admin.id)
    if (res?.success) {
      await logAudit({
        actor: 'ADMIN',
        actorId: admin.id,
        actorName: admin.name || admin.email,
        action: 'VERIFY_INVOICE_MEMBERSHIP',
        module: 'COOPERATIVE',
        targetId: membershipId,
        targetType: 'COMMUNITY_MEMBERSHIP'
      })
      // Flips this member's isPaid true - the same field the members-list
      // and membership caches key off of, so without busting them the newly
      // verified member stays invisible on the front page for the cache's
      // full TTL.
      const membership = res.membership
      if (membership?.community?.id) {
        deleteCache(`community:members:${membership.community.id}`)
        deleteCache(`community:stats:${membership.community.id}`)
        revalidatePath(`/community/${membership.community.id}`)
      }
      if (membership?.user?.id) deleteCache(`user:communities:roles:${membership.user.id}`)
    }
    revalidatePath('/cms_admin', 'layout')
    revalidatePath('/community')
    return res
  } catch (e: any) {
    return { success: false, error: e.message || 'Gagal memverifikasi invoice.' }
  }
}

export async function getAllCoinHoldersAction() {
  await ensureAdmin()
  try {
    return await DataStore.getAllCoinHolders()
  } catch (e: any) {
    throw new Error(e.message || 'Gagal mengambil data holder koin.')
  }
}

export async function injectCoinAction(formData: FormData) {
  const admin = await ensureSuperAdmin()
  const targetId = formData.get('targetId') as string
  const targetType = formData.get('targetType') as 'USER' | 'COMMUNITY'
  const amountStr = formData.get('amount') as string
  const reason = formData.get('reason') as string

  if (!targetId || !targetType || !amountStr || !reason) {
    return { error: 'Semua kolom wajib diisi.' }
  }

  const amount = parseFloat(amountStr)
  if (isNaN(amount) || amount <= 0) {
    return { error: 'Jumlah koin tidak valid.' }
  }

  try {
    await DataStore.injectCoin(targetId, targetType, amount, reason, admin.id)
    await logAudit({
      actor: 'ADMIN',
      actorId: admin.id,
      actorName: admin.name || admin.email,
      action: 'INJECT_COIN',
      module: 'COINS',
      targetId,
      targetType,
      detail: `Inject ${amount} koin ke ${targetType} #${targetId}. Alasan: ${reason}`
    })
    revalidatePath('/cms_admin', 'layout')
    revalidatePath('/community')
    revalidatePath('/wallet')
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal melakukan inject koin.' }
  }
}

export async function getLevelRequestsAction(status?: string) {
  await ensureAdmin()
  try {
    return await DataStore.getLevelRequests(status)
  } catch (e: any) {
    throw new Error(e.message || 'Gagal mengambil pengajuan level.')
  }
}

export async function approveLevelRequestAction(requestId: string) {
  const admin = await ensureSuperAdmin()
  try {
    await DataStore.approveLevelRequest(requestId, admin.id)
    await logAudit({
      actor: 'ADMIN',
      actorId: admin.id,
      actorName: admin.name || admin.email,
      action: 'APPROVE_LEVEL_REQUEST',
      module: 'USERS',
      targetId: requestId,
      targetType: 'LEVEL_REQUEST'
    })
    revalidatePath('/cms_admin', 'layout')
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal menyetujui pengajuan level.' }
  }
}

export async function rejectLevelRequestAction(requestId: string, note: string) {
  const admin = await ensureSuperAdmin()
  try {
    await DataStore.rejectLevelRequest(requestId, note, admin.id)
    await logAudit({
      actor: 'ADMIN',
      actorId: admin.id,
      actorName: admin.name || admin.email,
      action: 'REJECT_LEVEL_REQUEST',
      module: 'USERS',
      targetId: requestId,
      targetType: 'LEVEL_REQUEST',
      detail: note || undefined
    })
    revalidatePath('/cms_admin', 'layout')
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal menolak pengajuan level.' }
  }
}

export async function createLevelRequestAction(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Anda harus masuk terlebih dahulu.' }

  const targetLevel = parseInt(formData.get('targetLevel') as string)
  const radiusKm = parseFloat(formData.get('radiusKm') as string)
  const omsetBulan = parseFloat(formData.get('omsetBulan') as string)
  const hasLegalitas = formData.get('hasLegalitas') === 'true'
  const hasSertifikat = formData.get('hasSertifikat') === 'true'
  const hasDesain = formData.get('hasDesain') === 'true'
  const catatan = formData.get('catatan') as string || undefined

  if (isNaN(targetLevel) || isNaN(radiusKm) || isNaN(omsetBulan)) {
    return { error: 'Data pengajuan tidak valid.' }
  }

  try {
    await DataStore.createLevelRequest({
      userId: user.id,
      targetLevel,
      radiusKm,
      omsetBulan,
      hasLegalitas,
      hasSertifikat,
      hasDesain,
      catatan
    })
    revalidatePath('/merchant/dashboard')
    revalidatePath('/cms_admin', 'layout')
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal membuat pengajuan level.' }
  }
}

// Helper to check specific admin module permission
export async function ensureAdminPermission(permissionKey: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    await logAccessDenied('ADMIN_ACCESS_DENIED', user, `Modul: ${permissionKey}.`)
    throw new Error('Unauthorized: Hanya untuk Administrator.')
  }
  const dbUser = await DataStore.findUserById(user.id)
  if (!dbUser) throw new Error('Unauthorized.')
  if ((dbUser as any).isSuperAdmin) return dbUser

  let permissions: string[] = []
  try {
    permissions = (dbUser as any).adminPermissions
      ? JSON.parse((dbUser as any).adminPermissions)
      : ['overview', 'users', 'community', 'approvals', 'withdrawals', 'products', 'academy', 'transactions', 'coins', 'affiliates', 'certificates']
  } catch (_) {
    permissions = ['overview', 'users', 'community', 'approvals', 'withdrawals', 'products', 'academy', 'transactions', 'coins', 'affiliates', 'certificates']
  }

  if (!permissions.includes(permissionKey)) {
    await logAccessDenied('ADMIN_PERMISSION_DENIED', user, `Modul: ${permissionKey}.`)
    throw new Error(`Unauthorized: Anda tidak memiliki akses ke modul ${permissionKey}.`)
  }
  return dbUser
}

// ─── FEATURE CONTROL ACTIONS ───────────────────────────────────────────────
const FEATURE_CONTROL_STALE = 'Konfigurasi telah diubah oleh admin lain. Silakan muat ulang halaman.'

// One entry point for every change made in FeatureControlTab (toggle on/off,
// CTA/destination edit, dependency-modal bulk reassignment), so every change
// is validated, concurrency-checked and audited the same way.
export async function updateFeatureControlAction(
  next: unknown,
  lastKnownVersion: string | null
): Promise<{ ok: true; config: FeatureControl; version: string } | { ok: false; error: string; stale?: boolean }> {
  const admin = await ensureAdminPermission('features')
  const audit = (action: string, targetId: string | undefined, detail: object) =>
    logAudit({
      actor: 'ADMIN',
      actorId: admin.id,
      actorName: admin.name || admin.email,
      action,
      module: 'FEATURE_CONTROL',
      targetType: 'FEATURE',
      targetId,
      detail: JSON.stringify(detail)
    })

  const result = validateConfig(next)
  if (!result.ok) {
    // The CMS UI can't produce an invalid config, so this is tamper evidence.
    await audit('FEATURE_CONTROL_REJECTED', undefined, {
      reason: result.error,
      submitted: JSON.stringify(next)?.slice(0, 1000)
    })
    return { ok: false, error: result.error }
  }
  if (lastKnownVersion !== null && (typeof lastKnownVersion !== 'string' || Number.isNaN(Date.parse(lastKnownVersion)))) {
    return { ok: false, error: FEATURE_CONTROL_STALE, stale: true }
  }

  try {
    const { config: before } = await DataStore.getFeatureControl()
    const version = await DataStore.setFeatureControl(result.config, lastKnownVersion)
    // Nothing was written, so nothing is audited.
    if (!version) return { ok: false, error: FEATURE_CONTROL_STALE, stale: true }

    // Diffed server-side against the stored state, never from client labels.
    // A retarget whose old destination got disabled in this same save is the
    // dependency modal's bulk reassignment.
    const changes = diffConfig(before, result.config)
    const disabledNow = new Set(changes.filter((c) => c.change === 'DISABLED').map((c) => c.key))
    for (const c of changes) {
      const bulk = c.change === 'REDIRECT_UPDATED' && disabledNow.has(c.before!.target)
      await audit(bulk ? 'FEATURE_REDIRECT_BULK_REASSIGNED' : `FEATURE_${c.change}`, c.key, {
        before: c.before,
        after: c.after,
        ...(bulk ? { triggeredBy: c.before!.target } : {})
      })
    }

    revalidatePath('/cms_admin', 'layout')
    return { ok: true, config: result.config, version }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Gagal menyimpan Feature Control.' }
  }
}

// ─── GLOBAL KYC SETTINGS ACTIONS ───────────────────────────────────────────
export async function getGlobalKycSettingAction() {
  try {
    const required = await DataStore.getGlobalKycRequirementToCreateCommunity()
    return { success: true, required }
  } catch (e: any) {
    return { success: true, required: true }
  }
}

export async function updateGlobalKycSettingAction(required: boolean) {
  const admin = await ensureAdminPermission('community')
  try {
    await DataStore.setGlobalKycRequirementToCreateCommunity(required)
    await logAudit({
      actor: 'ADMIN',
      actorId: admin.id,
      actorName: admin.name || admin.email,
      action: 'UPDATE_KYC_SETTING',
      module: 'COMMUNITY',
      detail: `Wajib KYC untuk membuat komunitas: ${required ? 'AKTIF' : 'NON-AKTIF'}.`
    })
    revalidatePath('/cms_admin', 'layout')
    revalidatePath('/community')
    return { success: true, required }
  } catch (e: any) {
    return { error: e.message || 'Gagal mengubah pengaturan KYC.' }
  }
}

// ─── COMMUNITY ADMIN ACTIONS ────────────────────────────────────────────────
export async function getCommunitiesAdminAction() {
  await ensureAdminPermission('community')
  try {
    const communities = await DataStore.getCommunities()
    return { success: true, communities }
  } catch (e: any) {
    return { error: e.message || 'Gagal mengambil data komunitas.' }
  }
}

export async function createCommunityAdminAction(data: any) {
  const admin = await ensureAdminPermission('community')
  try {
    const templateType = normalizeTemplateType(data.templateType)
    // Only Perkumpulan actually has page templates - Koperasi keeps its own
    // fixed module set, so its landingPageConfig is left untouched here (it
    // has no template-driven disabledModules concept to compute).
    const landingPageConfig = data.type === 'PERKUMPULAN'
      ? JSON.stringify({ disabledModules: getDisabledModulesForTemplate(templateType) })
      : undefined
    const community = await DataStore.createCommunityAdmin({ ...data, templateType, landingPageConfig })
    await logAudit({
      actor: 'ADMIN',
      actorId: admin.id,
      actorName: admin.name || admin.email,
      action: 'CREATE_COMMUNITY_ADMIN',
      module: 'COMMUNITY',
      targetId: community.id,
      targetType: 'COMMUNITY',
      detail: `Komunitas "${data.name}" (${data.type}) dibuat via CMS admin.`
    })
    deleteCache('community:induk:all')
    revalidatePath('/cms_admin', 'layout')
    revalidatePath('/community')
    return { success: true, community }
  } catch (e: any) {
    return { error: e.message || 'Gagal membuat komunitas baru.' }
  }
}

export async function updateCommunityAdminAction(communityId: string, data: any) {
  const admin = await ensureAdminPermission('community')
  try {
    let updateData = data
    if (data.type === 'PERKUMPULAN' && data.templateType) {
      // Merge into the existing config (not overwrite) so unrelated saved
      // keys (perkumpulanTier, activationFeePaid, ...) survive an edit that
      // only changed the template - resetting disabledModules to the newly
      // picked template's defaults, same as the Pengaturan tab's own
      // template switcher.
      const existing = await DataStore.getCommunityById(communityId)
      let existingConfig: any = {}
      if (existing?.landingPageConfig) {
        try { existingConfig = JSON.parse(existing.landingPageConfig) } catch (_) {}
      }
      const templateType = normalizeTemplateType(data.templateType)
      updateData = {
        ...data,
        templateType,
        landingPageConfig: JSON.stringify({
          ...existingConfig,
          disabledModules: getDisabledModulesForTemplate(templateType)
        })
      }
    }
    const community = await DataStore.updateCommunityAdmin(communityId, updateData)
    const detail = typeof data.isVerified === 'boolean' || typeof data.isSuspended === 'boolean'
      ? `Status komunitas "${community?.name}" diubah — Verified: ${!!community?.isVerified}, Suspended: ${!!community?.isSuspended}.`
      : `Komunitas "${community?.name}" diperbarui via CMS admin.`
    await logAudit({
      actor: 'ADMIN',
      actorId: admin.id,
      actorName: admin.name || admin.email,
      action: 'UPDATE_COMMUNITY_ADMIN',
      module: 'COMMUNITY',
      targetId: communityId,
      targetType: 'COMMUNITY',
      detail
    })
    // This is the CMS's own community-mutation path, separate from the
    // ketua-facing updateIndukCommunity - it writes the same fields (menu
    // toggles, verified/suspended status, join fee, etc.) but reads via
    // getIndukCommunityDetail() go through a cacheWrap('community:induk:${id}')
    // layer that revalidatePath doesn't reach, so without this the front
    // page kept serving whatever it cached before this CMS edit.
    deleteCache(`community:induk:${communityId}`)
    deleteCache('community:induk:all')
    revalidatePath('/cms_admin', 'layout')
    revalidatePath(`/community/${communityId}`)
    revalidatePath('/community')
    return { success: true, community }
  } catch (e: any) {
    return { error: e.message || 'Gagal mengedit komunitas.' }
  }
}

export async function deleteCommunityAdminAction(communityId: string) {
  const admin = await ensureAdminPermission('community')
  try {
    await DataStore.deleteCommunityAdmin(communityId)
    await logAudit({
      actor: 'ADMIN',
      actorId: admin.id,
      actorName: admin.name || admin.email,
      action: 'DELETE_COMMUNITY_ADMIN',
      module: 'COMMUNITY',
      targetId: communityId,
      targetType: 'COMMUNITY'
    })
    deleteCache(`community:induk:${communityId}`)
    deleteCache('community:induk:all')
    revalidatePath('/cms_admin', 'layout')
    revalidatePath('/community')
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal menghapus komunitas.' }
  }
}

export async function updateUserIndukCommunityAction(userId: string, communityId: string | null) {
  const admin = await ensureAdminPermission('users')
  try {
    await DataStore.setIndukCommunity(userId, communityId)
    await logAudit({
      actor: 'ADMIN',
      actorId: admin.id,
      actorName: admin.name || admin.email,
      action: 'UPDATE_USER_INDUK_COMMUNITY',
      module: 'USERS',
      targetId: userId,
      targetType: 'USER',
      detail: communityId ? `Set induk komunitas menjadi #${communityId}.` : 'Hapus induk komunitas.'
    })
    deleteCache(`user:communities:roles:${userId}`)
    revalidatePath('/cms_admin', 'layout')
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal menetapkan Induk Komunitas.' }
  }
}

// ─── KICK MEMBER FROM COMMUNITY (ADMIN) ─────────────────────────────────────
// Directly removes the CommunityMembership record for (userId, communityId)
// without relying on indukCommunityId matching. Fixes the refresh-persistence bug.
export async function kickMemberFromCommunityAdminAction(userId: string, communityId: string) {
  const admin = await ensureAdminPermission('users')
  if (!userId || !communityId) return { error: 'userId dan communityId wajib diisi.' }
  try {
    await DataStore.removeCommunityMembership(userId, communityId)
    await logAudit({
      actor: 'ADMIN',
      actorId: admin.id,
      actorName: admin.name || admin.email,
      action: 'KICK_COMMUNITY_MEMBER_ADMIN',
      module: 'USERS',
      targetId: userId,
      targetType: 'USER',
      detail: `Keluarkan anggota dari komunitas #${communityId}.`
    })
    try {
      const community = await DataStore.getCommunityById(communityId)
      await DataStore.createNotification(
        userId,
        'KICKED_FROM_COMMUNITY',
        'Dikeluarkan dari Komunitas',
        `Anda telah dikeluarkan dari komunitas "${community?.name || communityId}" oleh Admin Saloka.id.`,
        '/community'
      )
    } catch (err) {
      console.error('Error creating kick notification:', err)
    }
    deleteCache(`community:members:${communityId}`)
    invalidateCachePattern(`community:members:${communityId}*`)
    deleteCache(`community:stats:${communityId}`)
    deleteCache(`user:communities:roles:${userId}`)
    invalidateCachePattern('user:communities:roles:*')
    deleteCache('community:induk:all')
    invalidateCachePattern('community:induk:*')
    revalidatePath('/cms_admin', 'layout')
    revalidatePath(`/community/${communityId}`)
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal mengeluarkan anggota dari komunitas.' }
  }
}

export async function updateAdminPermissionsAction(adminId: string, permissions: string[]) {
  const currentUser = await ensureSuperAdmin()
  try {
    await ensureNotEditingOtherSuperAdmin(currentUser.id, adminId)
    // isSuperAdmin is never written here — permission grants can't touch it.
    await DataStore.updateUserAdminPermissions(adminId, permissions, false)
    await logAudit({
      actor: 'ADMIN',
      actorId: currentUser.id,
      actorName: currentUser.name || currentUser.email,
      action: 'UPDATE_ADMIN_PERMISSIONS',
      module: 'ADMINS',
      targetId: adminId,
      targetType: 'USER',
      detail: `Hak akses diubah menjadi: ${permissions.join(', ')}.`
    })
    revalidatePath('/cms_admin', 'layout')
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal meng-update hak akses admin.' }
  }
}

// ─── ADMIN ACCOUNT UPDATE ───────────────────────────────────────────────────
export async function updateAdminAccountAction(adminId: string, data: { name?: string; email?: string; password?: string }) {
  const currentUser = await ensureSuperAdmin()
  try {
    await ensureNotEditingOtherSuperAdmin(currentUser.id, adminId)
    const updateData: any = {}
    if (data.name) updateData.name = data.name
    if (data.email) updateData.email = data.email
    if (data.password) updateData.passwordHash = await hashPassword(data.password)
    await DataStore.updateAdminAccount(adminId, updateData)
    await logAudit({
      actor: 'ADMIN',
      actorId: currentUser.id,
      actorName: currentUser.name || currentUser.email,
      action: 'UPDATE_ADMIN_ACCOUNT',
      module: 'ADMINS',
      targetId: adminId,
      targetType: 'USER',
      detail: `Field diubah: ${Object.keys(updateData).join(', ') || '-'}.`
    })
    revalidatePath('/cms_admin', 'layout')
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal update admin.' }
  }
}

// ─── USER CRUD (Create / Delete) ──────────────────────────────────────────
export async function createUserAction(formData: FormData) {
  const admin = await ensureAdminPermission('users')
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const phone = formData.get('phone') as string || undefined
  const role = formData.get('role') as string || 'CUSTOMER'

  if (!name || !email || !password) {
    return { error: 'Nama, email, dan password wajib diisi.' }
  }
  if (!['CUSTOMER', 'MERCHANT', 'AFFILIATE', 'CUSTOMER_SERVICE'].includes(role)) {
    return { error: 'Role tidak valid. Akun admin dibuat lewat menu Admins.' }
  }

  const passwordHash = await hashPassword(password)

  try {
    const user = await DataStore.createUserAdmin({ name, email, passwordHash, phone, role })
    await logAudit({
      actor: 'ADMIN',
      actorId: admin.id,
      actorName: admin.name || admin.email,
      action: 'CREATE_USER',
      module: 'USERS',
      targetId: user.id,
      targetType: 'USER',
      detail: `User "${name}" (${email}) dibuat dengan role ${role}.`
    })
    revalidatePath('/cms_admin', 'layout')
    return { success: true, user }
  } catch (e: any) {
    return { error: e.message || 'Gagal membuat user.' }
  }
}

export async function deleteUserAction(userId: string) {
  const admin = await ensureAdminPermission('users')
  try {
    const target: any = await DataStore.findUserById(userId)
    if (target?.role === 'ADMIN') {
      throw new Error('Akun admin dikelola lewat menu Admin & Hak Akses, bukan lewat menu Users.')
    }
    await DataStore.deleteUser(userId)
    // Best-effort: the DB row is the source of truth and is already gone;
    // don't let a storage-cleanup failure surface as a failed deletion.
    if (target) {
      await Promise.all([
        deleteUploadedFile(target.image),
        deleteUploadedFile(target.kycKtpUrl),
        deleteUploadedFile(target.kycSelfieUrl),
      ]).catch(() => {})
    }
    await logAudit({
      actor: 'ADMIN',
      actorId: admin.id,
      actorName: admin.name || admin.email,
      action: 'DELETE_USER',
      module: 'USERS',
      targetId: userId,
      targetType: 'USER',
      detail: target ? `User "${target.name}" (${target.email}) dihapus.` : undefined
    })
    revalidatePath('/cms_admin', 'layout')
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal menghapus user.' }
  }
}

// ─── SNACKBOX ADMIN OPERATIONS ──────────────────────────────────────────────
export async function updateProductSnackboxAction(productId: string, isSnackbox: boolean, kelurahanName?: string) {
  const admin = await ensureAdmin()
  try {
    const existing = await DataStore.getProductById(productId)
    if (!existing) throw new Error('Produk tidak ditemukan.')

    // updateProduct scopes its update to `where: { id, merchantId }` — the
    // admin's own id can never match a real product's merchantId, so this
    // must be the product's actual owner, not the acting admin.
    await DataStore.updateProduct(productId, (existing as any).merchantId, {
      ...existing,
      isSnackboxEligible: isSnackbox,
      kelurahanName: kelurahanName || (existing as any).kelurahanName || 'Menteng'
    })

    await logAudit({
      actor: 'ADMIN',
      actorId: admin.id,
      actorName: admin.name || admin.email,
      action: isSnackbox ? 'ENABLE_SNACKBOX_PRODUCT' : 'DISABLE_SNACKBOX_PRODUCT',
      module: 'PRODUCTS',
      targetId: productId,
      detail: `Status Snackbox diubah menjadi ${isSnackbox ? 'AKTIF' : 'NON-AKTIF'}.`
    })

    await invalidateCachePattern('snackbox-products:')
    revalidatePath('/cms_admin', 'layout')
    revalidatePath('/snackbox')
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal update status Snackbox produk.' }
  }
}

export async function updateMerchantSnackboxEligibilityAction(userId: string, isEligible: boolean, kelurahanName?: string) {
  const admin = await ensureAdmin()
  try {
    const user = await DataStore.findUserById(userId)
    if (!user) throw new Error('User tidak ditemukan.')

    await DataStore.updateUserRoleAndLevel(
      userId,
      user.role,
      user.level || 1,
      user.xp || 0,
      user.membershipLevel || 'REGULAR',
      user.membershipAccess || 'ALL',
      user.bootcampStatus
    )

    await logAudit({
      actor: 'ADMIN',
      actorId: admin.id,
      actorName: admin.name || admin.email,
      action: isEligible ? 'APPROVE_SNACKBOX_MERCHANT' : 'REVOKE_SNACKBOX_MERCHANT',
      module: 'MERCHANTS',
      targetId: userId,
      detail: `Status Snackbox Eligibility mitra "${user.name || user.email}" menjadi ${isEligible ? 'ELIGIBLE' : 'INELIGIBLE'} di Kel. ${kelurahanName || 'Menteng'}.`
    })

    revalidatePath('/cms_admin', 'layout')
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal update kelayakan Snackbox merchant.' }
  }
}

// ponytail: Snackbox relay status is a seeded UI fixture (see TransactionsTab.tsx),
// no real Order.relayStatus field exists yet — no audit log until there's a real mutation to log.
export async function updateSnackboxRelayStatusAction(orderId: string, relayStatus: string, relayNote?: string) {
  await ensureAdmin()
  try {
    void orderId
    void relayStatus
    void relayNote
    revalidatePath('/cms_admin', 'layout')
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal update status relay pesanan.' }
  }
}

// ponytail: Snackbox batch payout is fully mock (see SnackboxPayoutTab.tsx),
// no real payout/escrow backend exists yet — no audit log until there's a real mutation to log.
export async function processSnackboxBatchPayoutAction(batchId: string, totalAmount: number, merchantCount: number) {
  await ensureAdmin()
  try {
    void batchId
    void totalAmount
    void merchantCount
    revalidatePath('/cms_admin', 'layout')
    return { success: true }
  } catch (e: any) {
    return { error: e.message || 'Gagal memproses payout batch snackbox.' }
  }
}
