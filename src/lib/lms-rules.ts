/**
 * Pure learning rules for Saloka Academy.
 *
 * Kept free of DB and request concerns so the decisions that actually gate
 * progress — sequential unlocking and the watch threshold — can be tested
 * directly. The server action in actions/lms.ts is the only place these should
 * be applied; the browser never decides any of it.
 */

/** Share of a module's duration that must be watched before it counts as finished. */
export const COMPLETION_RATIO = 0.9

/**
 * Valid values for CertificateTemplate.type — the dropdown options shown in
 * the CMS and the whitelist the server action validates against. Single
 * source of truth so the client select and the server never drift.
 */
export const CERTIFICATE_TEMPLATE_TYPES = ['Kelulusan'] as const

/**
 * The platform-provided default template — never deletable, and editable
 * only by a superadmin. Matched by name rather than a dedicated schema flag
 * since there's exactly one protected row; add a real `isProtected` column
 * if a second one is ever needed.
 */
export const PROTECTED_CERTIFICATE_TEMPLATE_NAME = 'Sertifikat Default Saloka'

/**
 * Returns the 11-character YouTube video id, or null when the URL is not a
 * YouTube link (and therefore plays through the native file player).
 *
 * This decides which player a module gets, so getting it wrong means a blank
 * video rather than a subtle glitch.
 */
export function extractYouTubeId(url: string | null | undefined): string | null {
  if (!url) return null
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/
  )
  return m ? m[1] : null
}

/** Membership tiers, ranked — a higher tier satisfies any lower requirement. */
const ACCESS_LEVELS: Record<string, number> = { Gold: 1, Platinum: 2, Diamond: 3 }

export interface CourseAccessInput {
  courseAccessRequired: string
  userAccess: string
  isAdmin: boolean
  isBootcampJoined: boolean
  hasPurchased: boolean
}

/**
 * Whether a course's paid/tiered content is off-limits to this viewer. The
 * single source of truth for that decision — both the page that decides what
 * to ship to the client and the component that decides what to render must
 * agree, or a locked course's video becomes readable straight out of the
 * page's own payload regardless of what the UI shows.
 */
export function isCourseAccessLocked(input: CourseAccessInput): boolean {
  if (input.isAdmin) return false
  if (input.courseAccessRequired === 'Bootcamp') return !input.isBootcampJoined
  const userRank = ACCESS_LEVELS[input.userAccess] || 1
  const reqRank = ACCESS_LEVELS[input.courseAccessRequired] || 1
  return userRank < reqRank && !input.hasPurchased
}

/** A module opens only once every module before it has been completed. */
export function isModuleUnlocked(
  lessons: { id: string }[],
  lessonId: string,
  completedIds: Set<string>
): boolean {
  const index = lessons.findIndex((l) => l.id === lessonId)
  if (index === -1) return false
  return lessons.slice(0, index).every((l) => completedIds.has(l.id))
}

export interface WatchStateInput {
  /** Module length in seconds, as stored on the lesson. */
  duration: number
  /** Seconds the client claims to have reached. Untrusted. */
  reportedSeconds: number
  /** Furthest point already recorded for this user and module. */
  existingWatched: number
  /** Whether the module was already marked complete. */
  alreadyComplete: boolean
  /** Length the player actually observed for the media, if known. Untrusted. */
  observedDuration?: number
}

/**
 * Stored durations are typed by hand in the CMS and drift from the real media.
 * A stored value *longer* than the video makes a module impossible to finish —
 * the learner watches to the end and still falls short of the threshold — and a
 * stored value shorter marks it done far too early.
 *
 * The player knows the true length, but it reports from the browser, so it is
 * trusted only within half to double the stored value. That corrects ordinary
 * drift while capping how much a forged value could lower the bar.
 */
export function effectiveDuration(stored: number, observed?: number): number {
  const base = Math.max(0, Number(stored) || 0)
  const seen = Math.max(0, Number(observed) || 0)
  if (seen <= 0 || base <= 0) return base
  return Math.round(Math.min(Math.max(seen, base * 0.5), base * 2))
}

export interface ParticipationCounts {
  /** Started at least one module, but hasn't finished the course. */
  berjalan: number
  /** Completed every module — same condition that issues the certificate. */
  selesai: number
}

/**
 * Buckets every (user, course) pair that has any activity into exactly one of
 * two states. A user with zero progress rows for a course isn't in either
 * bucket ("Terkunci") — there's no bounded denominator for "everyone who could
 * have started," so that state is never counted, only implied by absence.
 *
 * One pass over every progress row, independent of how many courses exist —
 * this is what keeps the admin course list a single query instead of an
 * N+1 fan-out per course.
 */
export function computeCourseParticipation(
  courses: { id: string; lessons: { id: string }[] }[],
  progress: { userId: string; lessonId: string; completed: boolean }[]
): Record<string, ParticipationCounts> {
  const lessonToCourse = new Map<string, string>()
  const totalLessons = new Map<string, number>()
  for (const c of courses) {
    totalLessons.set(c.id, c.lessons.length)
    for (const l of c.lessons) lessonToCourse.set(l.id, c.id)
  }

  // courseId -> userId -> completed-lesson count for that course
  const perCourse = new Map<string, Map<string, number>>()

  for (const p of progress) {
    const courseId = lessonToCourse.get(p.lessonId)
    if (!courseId) continue
    let byUser = perCourse.get(courseId)
    if (!byUser) {
      byUser = new Map()
      perCourse.set(courseId, byUser)
    }
    if (!byUser.has(p.userId)) byUser.set(p.userId, 0)
    if (p.completed) byUser.set(p.userId, byUser.get(p.userId)! + 1)
  }

  const result: Record<string, ParticipationCounts> = {}
  for (const c of courses) {
    const total = totalLessons.get(c.id) || 0
    const byUser = perCourse.get(c.id)
    const counts: ParticipationCounts = { berjalan: 0, selesai: 0 }
    if (byUser) {
      for (const done of byUser.values()) {
        if (total > 0 && done >= total) counts.selesai++
        else counts.berjalan++
      }
    }
    result[c.id] = counts
  }

  return result
}

/**
 * Decides the new watched position and whether the module is now finished.
 * The reported value is clamped to the real duration and can only move the
 * stored position forward, so a forged number cannot fake completion or rewind
 * someone's progress.
 */
export function computeWatchState(input: WatchStateInput): {
  watchedSeconds: number
  completed: boolean
} {
  const duration = effectiveDuration(input.duration, input.observedDuration)
  const reported = Math.max(0, Math.floor(Number(input.reportedSeconds) || 0))
  const existing = Math.max(0, Number(input.existingWatched) || 0)

  const capped = duration > 0 ? Math.min(reported, duration) : reported
  const watchedSeconds = Math.max(existing, capped)
  const completed =
    input.alreadyComplete || (duration > 0 && watchedSeconds / duration >= COMPLETION_RATIO)

  return { watchedSeconds, completed }
}
