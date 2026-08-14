import Link from "next/link";
import { getCourseById, getUserProgress } from "@/app/actions/lms";
import { getCurrentUserProfile } from "@/app/actions/auth";
import { notFound } from "next/navigation";
import LessonViewer from "./LessonViewer";

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
  const progressList = userProfile ? await getUserProgress() : [];
  const completedLessonIds = progressList
    .filter((p) => p.completed)
    .map((p) => p.lessonId);

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
  const initialActiveLessonId = lessons[0]?.id || "";

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] pt-24 pb-24 px-4 sm:px-6 md:px-10 font-sans text-slate-900">
      <div className="relative z-10 max-w-[1140px] mx-auto space-y-6">
        {/* Back Link */}
        <Link
          href="/academy"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#006E24] tracking-wider uppercase transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Kembali ke Katalog Akademi
        </Link>

        {/* Header Title */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
          lessons={lessons as any}
          initialActiveLessonId={initialActiveLessonId}
          completedLessonIds={completedLessonIds}
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
