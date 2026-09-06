import Link from "next/link";
import { getCourseById, getUserProgress, getUserCertificates } from "@/app/actions/lms";
import { getCurrentUserProfile } from "@/app/actions/auth";
import { notFound, redirect } from "next/navigation";
import { isModuleUnlocked, isCourseAccessLocked } from "@/lib/lms-rules";
import LessonViewer from "./LessonViewer";
import UnavailableRedirect from "./UnavailableRedirect";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CoursePage({ params }: PageProps) {
  const { id } = await params;
  
  const course = await getCourseById(id);
  if (!course) {
    notFound();
  }

  const userProfile = await getCurrentUserProfile();

  // A kursus is only for signed-in accounts — no tier is reachable while
  // logged out, including via a saved direct link, so this check comes
  // before anything else and applies the same way regardless of course.
  if (!userProfile) {
    redirect('/auth?tab=register');
  }

  // "Ditarik dari Pasar" — blocks even a saved direct link, except for superadmin.
  if (!(course.isPublished ?? true) && userProfile?.isSuperAdmin !== true) {
    return <UnavailableRedirect />;
  }

  const progressList = userProfile ? await getUserProgress() : [];
  const completedLessonIds = progressList
    .filter((p: any) => p.completed)
    .map((p: any) => p.lessonId);

  // Watched position per module, so resume and the forward-seek clamp survive a
  // reload and follow the account across devices.
  const watchedByLesson: Record<string, number> = {};
  for (const p of progressList as any[]) {
    watchedByLesson[p.lessonId] = Number(p.watchedSeconds) || 0;
  }

  const certificates = userProfile ? await getUserCertificates() : [];
  const certificateSerial =
    (certificates as any[]).find((c) => c.courseId === id)?.serial || null;

  let purchasedCourseIds: string[] = []
  if (userProfile && userProfile.landingPageConfig) {
    try {
      const config = JSON.parse(userProfile.landingPageConfig)
      if (Array.isArray(config.purchasedCourseIds)) {
        purchasedCourseIds = config.purchasedCourseIds
      }
    } catch (_) {}
  }

  const lessons = course.lessons || [];
  // Open where the learner actually stopped, not always at module 1.
  const completedSet = new Set(completedLessonIds);
  const firstIncomplete = lessons.find((l: any) => !completedSet.has(l.id));
  const initialActiveLessonId = (firstIncomplete || lessons[0])?.id || "";

  const isAdmin = userProfile?.role === 'ADMIN';
  const isCourseLocked = isCourseAccessLocked({
    courseAccessRequired: course.accessRequired || 'Gold',
    userAccess: userProfile?.membershipAccess || 'Gold',
    isAdmin,
    isBootcampJoined: userProfile?.bootcampStatus === 'JOINED',
    hasPurchased: purchasedCourseIds.includes(id),
  });

  // The client only disables the UI for content the viewer can't reach yet —
  // the video URL and text itself must never leave the server for a locked
  // course or a not-yet-unlocked module, or they're fully readable straight
  // out of the page's own network payload regardless of what's rendered.
  const safeLessons = lessons.map((l: any) =>
    isAdmin || (!isCourseLocked && isModuleUnlocked(lessons, l.id, completedSet as Set<string>))
      ? l
      : { ...l, videoUrl: '', content: '' }
  );

  return (
    <div className="relative min-h-screen bg-background font-sans text-slate-900">
      <div className="relative z-10 max-w-[1240px] mx-auto px-3.5 sm:px-6 py-4 sm:py-6">
        {/* Back Link */}
        <Link
          href="/academy"
          className="mb-5 inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#006E24] tracking-wider uppercase transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Kembali ke Katalog Akademi
        </Link>

        {/* Header Title */}
        <div className="mb-4 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 bg-[#E8F5E9] text-[#006E24] border border-[#C8E6C9] rounded-md text-[11px] font-bold">
                {course.lessons?.length || 0} Modul Materi
              </span>
              <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-[11px] font-bold uppercase">
                Akses {course.accessRequired || 'Gold'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              {course.title}
            </h1>
          </div>
        </div>

        {/* Lesson viewer */}
        <LessonViewer
          courseId={course.id}
          courseTitle={course.title}
          lessons={safeLessons as any}
          initialActiveLessonId={initialActiveLessonId}
          completedLessonIds={completedLessonIds}
          watchedByLesson={watchedByLesson}
          coursePrice={Number((course as any).price) || 0}
          certificateSerial={certificateSerial}
          isLoggedIn={!!userProfile}
          userAccess={userProfile?.membershipAccess || "Gold"}
          courseAccessRequired={course.accessRequired || "Gold"}
          purchasedCourseIds={purchasedCourseIds}
          isBootcampJoined={userProfile?.bootcampStatus === 'JOINED'}
          isAdmin={userProfile?.role === 'ADMIN'}
        />
      </div>
    </div>
  );
}
