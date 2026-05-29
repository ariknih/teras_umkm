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

  const lessons = course.lessons || [];
  const initialActiveLessonId = lessons[0]?.id || "";

  return (
    <div className="relative min-h-screen bg-bg-dark pt-12 pb-24 px-6 md:px-10">
      {/* Background Mesh Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1400px] h-[400px] bg-[radial-gradient(circle_at_center,rgba(198,169,107,0.04)_0%,transparent_70%)] pointer-events-none z-0" />

      <div className="relative z-10 max-w-[1200px] mx-auto">
        {/* Back Link */}
        <Link
          href="/academy"
          className="inline-flex items-center gap-2 text-xs font-geist font-bold text-text-secondary hover:text-primary tracking-wider uppercase mb-8 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Kembali ke Academy
        </Link>

        {/* Header Title */}
        <div className="mb-10 pb-6 border-b border-border-subtle flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-geist font-bold text-primary tracking-[0.2em] uppercase bg-primary/10 border border-primary/20 px-2 py-0.5 rounded inline-block">
                {course.lessons?.length || 0} Materi
              </span>
              <span className={`text-[10px] font-geist font-bold tracking-[0.1em] uppercase border px-2 py-0.5 rounded inline-block ${
                course.accessRequired === 'Diamond'
                  ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                  : course.accessRequired === 'Platinum'
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                  : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
              }`}>
                Akses {course.accessRequired || 'Gold'}
              </span>
            </div>
            <h1 className="font-sora text-2xl md:text-4xl font-bold text-text-primary">
              {course.title}
            </h1>
          </div>
        </div>

        {/* Lesson viewer */}
        <LessonViewer
          courseId={course.id}
          lessons={lessons as any}
          initialActiveLessonId={initialActiveLessonId}
          completedLessonIds={completedLessonIds}
          isLoggedIn={!!userProfile}
          userAccess={userProfile?.membershipAccess || "Gold"}
          courseAccessRequired={course.accessRequired || "Gold"}
        />
      </div>
    </div>
  );
}
