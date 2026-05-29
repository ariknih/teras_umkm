import Link from "next/link";
import { getCourses, getUserProgress } from "../actions/lms";
import { getCurrentUser } from "../actions/auth";

export default async function AcademyPage() {
  const user = await getCurrentUser();
  const courses = await getCourses();
  const progressList = user ? await getUserProgress() : [];

  // Create a set of completed lesson IDs for easy lookup
  const completedLessons = new Set(
    progressList.filter((p) => p.completed).map((p) => p.lessonId)
  );

  return (
    <div className="relative min-h-screen bg-bg-dark pt-12 pb-24 px-6 md:px-10">
      {/* Mesh Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1400px] h-[400px] bg-[radial-gradient(circle_at_center,rgba(198,169,107,0.04)_0%,transparent_70%)] pointer-events-none z-0" />

      <div className="relative z-10 max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="mb-16 text-center max-w-2xl mx-auto">
          <span className="text-[10px] font-geist font-bold text-primary tracking-[0.2em] mb-4 uppercase bg-primary/10 border border-primary/20 px-3 py-1 rounded inline-block">
            Teras Premium LMS Academy
          </span>
          <h1 className="font-sora text-3xl md:text-5xl font-bold text-text-primary mb-4">
            Master the Craft of <span className="text-primary">Luxury Commerce.</span>
          </h1>
          <p className="text-xs md:text-sm text-text-secondary">
            Pelajari taktik pemasaran eksklusif, sains produksi artisan, dan strategi manajemen keuangan terenkripsi dari para ahli terkemuka.
          </p>
        </div>

        {/* Course Catalog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {courses.map((course) => {
            const courseLessons = course.lessons || [];
            const totalLessons = courseLessons.length;
            const completedCount = courseLessons.filter((l: any) => completedLessons.has(l.id)).length;
            const percent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

            return (
              <div
                key={course.id}
                className="group bg-surface-dark border border-border-subtle hover:border-primary/45 rounded-lg overflow-hidden transition-all duration-300 flex flex-col justify-between"
              >
                {/* Course Header with Image */}
                <div>
                  <div className="aspect-[21/9] w-full bg-surface-container relative overflow-hidden border-b border-border-subtle flex items-center justify-center">
                    {course.coverImage ? (
                      <img
                        src={course.coverImage}
                        alt={course.title}
                        className="object-cover w-full h-full group-hover:scale-102 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-60" />
                    )}
                    <span className="absolute top-4 left-4 px-2 py-0.5 bg-surface-dark/95 border border-primary/20 rounded text-[9px] font-geist font-bold text-primary uppercase tracking-wider">
                      Academy Module
                    </span>
                  </div>

                  {/* Course Info */}
                  <div className="p-6">
                    <h3 className="font-sora text-base md:text-lg font-bold text-text-primary mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-xs text-text-secondary leading-relaxed mb-6">
                      {course.description}
                    </p>

                    {/* Progress indicator */}
                    {user ? (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-geist font-bold text-text-secondary uppercase">
                          <span>Progress Belajar</span>
                          <span className="text-primary font-bold">{percent}% Selesai</span>
                        </div>
                        <div className="w-full h-1 bg-surface-container rounded-full overflow-hidden border border-border-subtle">
                          <div
                            className="h-full bg-primary transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-text-secondary pt-1">
                          {completedCount} dari {totalLessons} pelajaran selesai didownload & dipelajari.
                        </div>
                      </div>
                    ) : (
                      <div className="px-4 py-3 bg-surface-container border border-border-subtle rounded flex items-center gap-2.5 text-xs text-text-secondary">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-4 h-4 text-primary"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0V10.5m-2.25 13.5h13.5c.621 0 1.125-.504 1.125-1.125V11.25c0-.621-.504-1.125-1.125-1.125H4.25c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125Z"
                          />
                        </svg>
                        <span>Masuk untuk melacak progres belajar.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-6 pt-0">
                  <Link
                    id={`btn-course-${course.id}`}
                    href={`/academy/course/${course.id}`}
                    className="w-full py-3 bg-surface-container hover:bg-surface-container-high border border-border-subtle hover:border-primary/40 text-text-primary hover:text-primary font-geist font-bold text-xs uppercase tracking-wider rounded transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    Mulai Belajar
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-3 h-3"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
