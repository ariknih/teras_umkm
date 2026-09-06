/**
 * Self-check for the Saloka Academy learning rules.
 * Run with:  npx tsx src/lib/lms-rules.test.ts
 */
import assert from 'node:assert/strict'
import {
  isModuleUnlocked,
  computeWatchState,
  extractYouTubeId,
  effectiveDuration,
  computeCourseParticipation,
  COMPLETION_RATIO,
} from './lms-rules'

const lessons = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]

// ── Sequential unlocking ────────────────────────────────────────────────────
assert.equal(isModuleUnlocked(lessons, 'a', new Set()), true, 'first module is always open')
assert.equal(isModuleUnlocked(lessons, 'b', new Set()), false, 'module 2 locked while 1 unfinished')
assert.equal(isModuleUnlocked(lessons, 'b', new Set(['a'])), true, 'module 2 opens once 1 is done')
assert.equal(
  isModuleUnlocked(lessons, 'c', new Set(['a'])),
  false,
  'cannot skip module 2 to reach module 3'
)
assert.equal(
  isModuleUnlocked(lessons, 'c', new Set(['a', 'b'])),
  true,
  'module 3 opens once 1 and 2 are done'
)
assert.equal(isModuleUnlocked(lessons, 'zzz', new Set()), false, 'unknown module is never unlocked')

// ── Watch state ─────────────────────────────────────────────────────────────
const base = { duration: 100, existingWatched: 0, alreadyComplete: false }

assert.deepEqual(
  computeWatchState({ ...base, reportedSeconds: 50 }),
  { watchedSeconds: 50, completed: false },
  'halfway through is not complete'
)

assert.equal(
  computeWatchState({ ...base, reportedSeconds: 90 }).completed,
  true,
  `${COMPLETION_RATIO * 100}% watched completes the module`
)

assert.equal(
  computeWatchState({ ...base, reportedSeconds: 89 }).completed,
  false,
  'just under the threshold does not complete'
)

// A forged number must not be able to exceed the real duration.
assert.deepEqual(
  computeWatchState({ ...base, duration: 100, reportedSeconds: 99999 }),
  { watchedSeconds: 100, completed: true },
  'reported seconds are clamped to the real duration'
)

// Progress only ever moves forward, so rewinding cannot erase it.
assert.equal(
  computeWatchState({ ...base, existingWatched: 80, reportedSeconds: 10 }).watchedSeconds,
  80,
  'rewatching does not lower the recorded position'
)

// A module with no known duration must never auto-complete, or a zero-length
// lesson would unlock the whole course.
assert.equal(
  computeWatchState({ ...base, duration: 0, reportedSeconds: 500 }).completed,
  false,
  'zero duration never auto-completes'
)

// Once complete, always complete — there is no un-completing.
assert.equal(
  computeWatchState({ ...base, reportedSeconds: 1, alreadyComplete: true }).completed,
  true,
  'an already finished module stays finished'
)

// Garbage input must not throw or produce NaN.
const junk = computeWatchState({
  duration: NaN,
  reportedSeconds: NaN,
  existingWatched: NaN,
  alreadyComplete: false,
})
assert.deepEqual(junk, { watchedSeconds: 0, completed: false }, 'NaN input degrades safely')

// ── Duration reconciliation ─────────────────────────────────────────────────
// The real bug this came from: a module stored as 6:00 whose video is 5:17.
// The learner watched all 317s and still sat below 90% of 360 — permanently
// stuck, and blocking every module behind it.
assert.equal(
  computeWatchState({
    duration: 360,
    observedDuration: 317,
    reportedSeconds: 317,
    existingWatched: 317,
    alreadyComplete: false,
  }).completed,
  true,
  'watching a 5:17 video to the end completes it, even when stored as 6:00'
)

assert.equal(
  computeWatchState({
    duration: 317,
    observedDuration: 317,
    reportedSeconds: 200,
    existingWatched: 0,
    alreadyComplete: false,
  }).completed,
  false,
  'when stored and observed agree, the ordinary 90% threshold still applies'
)

// A forged short duration must not be able to complete a module instantly.
assert.equal(
  computeWatchState({ duration: 600, observedDuration: 1, reportedSeconds: 5, existingWatched: 0, alreadyComplete: false }).completed,
  false,
  'a claimed 1-second duration is floored at half the stored value'
)
assert.equal(effectiveDuration(600, 1), 300, 'observed duration cannot fall below half of stored')
assert.equal(effectiveDuration(600, 5000), 1200, 'observed duration cannot exceed double stored')
assert.equal(effectiveDuration(600, 500), 500, 'a plausible observed duration is used as-is')
assert.equal(effectiveDuration(600, 0), 600, 'no observation falls back to stored')
assert.equal(effectiveDuration(0, 300), 0, 'a zero stored duration stays zero')

// ── Video source detection ──────────────────────────────────────────────────
// Picking the wrong player leaves a blank video, so every shape of URL the
// content actually uses has to resolve.
const ID = 'XvkKvZJHfIQ'
for (const url of [
  `https://www.youtube.com/watch?v=${ID}`,
  `https://youtube.com/watch?v=${ID}`,
  `https://www.youtube.com/watch?v=${ID}&t=30s`,
  `https://www.youtube.com/watch?list=PL123&v=${ID}`, // v= not first
  `https://youtu.be/${ID}`,
  `https://youtu.be/${ID}?t=12`,
  `https://www.youtube.com/embed/${ID}`, // the old parser broke on these
  `https://www.youtube.com/shorts/${ID}`,
  `https://www.youtube.com/live/${ID}`,
]) {
  assert.equal(extractYouTubeId(url), ID, `should extract id from ${url}`)
}

// Anything not YouTube must fall through to the native file player.
for (const url of [
  'https://pub-abc.r2.dev/courses/admin-123.mp4',
  'https://bucket.s3.ap-southeast-2.amazonaws.com/courses/x.mp4',
  'https://www.w3schools.com/html/mov_bbb.mp4',
  'data:video/mp4;base64,AAAA',
  '',
]) {
  assert.equal(extractYouTubeId(url), null, `should NOT treat as YouTube: ${url}`)
}

assert.equal(extractYouTubeId(null), null, 'null URL is safe')
assert.equal(extractYouTubeId(undefined), null, 'undefined URL is safe')

// ── Course participation (Terkunci / Berjalan / Selesai) ────────────────────
{
  const courses = [
    { id: 'c1', lessons: [{ id: 'c1-l1' }, { id: 'c1-l2' }] },
    { id: 'c2', lessons: [{ id: 'c2-l1' }] },
  ]

  // alice: finished c1 entirely -> Selesai
  // bob: started c1 but only 1 of 2 modules -> Berjalan
  // carol: never touched anything -> not counted anywhere (Terkunci, implicit)
  const progress = [
    { userId: 'alice', lessonId: 'c1-l1', completed: true },
    { userId: 'alice', lessonId: 'c1-l2', completed: true },
    { userId: 'bob', lessonId: 'c1-l1', completed: true },
    { userId: 'bob', lessonId: 'c1-l2', completed: false },
  ]

  const result = computeCourseParticipation(courses, progress)
  assert.deepEqual(result.c1, { berjalan: 1, selesai: 1 }, 'bob is berjalan, alice is selesai')
  assert.deepEqual(result.c2, { berjalan: 0, selesai: 0 }, 'untouched course counts nobody')

  // A course with zero modules can't have a "finisher" — falling through to
  // Selesai on an empty course would be a false graduation.
  const emptyCourse = [{ id: 'c3', lessons: [] }]
  const touchedGhostLesson = [{ userId: 'x', lessonId: 'orphan-lesson', completed: true }]
  assert.deepEqual(
    computeCourseParticipation(emptyCourse, touchedGhostLesson).c3,
    { berjalan: 0, selesai: 0 },
    'progress on a lesson that belongs to no known course is ignored'
  )

  assert.deepEqual(
    computeCourseParticipation(courses, []),
    { c1: { berjalan: 0, selesai: 0 }, c2: { berjalan: 0, selesai: 0 } },
    'no progress rows at all -> every course reports zero, not an error'
  )
}

console.log('✓ lms-rules: all checks passed')
