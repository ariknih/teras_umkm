import Link from "next/link";
import Image from "next/image";
import { getCourses, getUserProgress } from "@/app/actions/lms";
import { getCurrentUser } from "@/app/actions/auth";

export default async function AcademyPage() {
  const [user, courses] = await Promise.all([
    getCurrentUser().catch(() => null),
    getCourses().catch(() => []),
  ]);
  const progressList = user ? await getUserProgress(user.id).catch(() => []) : [];

  // Create a set of completed lesson IDs for easy lookup
  const completedLessons = new Set(
    progressList.filter((p: any) => p.completed).map((p: any) => p.lessonId)
  );

  // "Ditarik dari Pasar" — hidden from the catalog for everyone except superadmin.
  const visibleCourses = user?.isSuperAdmin
    ? courses
    : courses.filter((c: any) => c.isPublished ?? true);

  return (
    <div className="relative min-h-screen bg-background font-sans text-slate-900">
      <div className="relative z-10 max-w-[1240px] mx-auto px-3.5 sm:px-6 py-4 sm:py-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-market-green-50 border border-market-green-100 rounded-full text-market-green-700 text-xs font-bold">
            <span>🎓 Saloka Digital Academy UMKM</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Tingkatkan Skala Bisnis <span className="text-market-green-700">UMKM Indonesia</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Pelajari strategi pemasaran digital, manajemen keuangan toko, standarisasi produk, dan teknik jualan laris langsung dari praktisi berpengalaman.
          </p>
        </div>

        {/* Course Catalog Section */}
        <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xs">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm sm:text-base font-bold text-slate-900">Kursus Tersedia</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3.5 pt-1">
          {visibleCourses.map((course: any) => {
            const courseLessons = course.lessons || []
            const totalLessons = courseLessons.length
            const completedCount = courseLessons.filter((l: any) => completedLessons.has(l.id)).length
            const percent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

            return (
              <div
                key={course.id}
                className="group flex flex-col bg-white border border-slate-200/90 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-[0_4px_16px_0_rgba(45,178,74,0.12)] hover:border-market-green-500/50 h-full"
              >
                {/* Course Header with Image */}
                <div>
                  <div className="aspect-[21/9] w-full bg-slate-100 relative overflow-hidden flex items-center justify-center">
                    {course.coverImage ? (
                      <Image
                        src={course.coverImage}
                        alt={course.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
                        loading="lazy"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-sm bg-slate-100">
                        Modul Akademi Saloka
                      </div>
                    )}
                    <span className="absolute top-3 left-3 bg-market-green-50 text-market-green-600 font-extrabold text-[10px] px-1.5 py-0.5 rounded-md border border-market-green-100 shadow-2xs uppercase tracking-wider">
                      {course.accessRequired || 'Gold'}
                    </span>
                  </div>

                  {/* Course Info */}
                  <div className="p-4 space-y-2.5">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 line-clamp-1 group-hover:text-market-green-600 transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                      {course.description}
                    </p>

                    <div className="flex items-center gap-1 text-[10px] text-slate-500 pt-1.5 border-t border-slate-100">
                      <span>📚 {totalLessons} Modul Materi</span>
                    </div>

                    {/* Progress indicator */}
                    {user ? (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between items-center text-[11px] font-bold text-slate-600 uppercase">
                          <span>Progres Belajar</span>
                          <span className="text-market-green-600">{percent}% Selesai</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="bg-market-green-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {completedCount} dari {totalLessons} pelajaran telah diselesaikan.
                        </div>
                      </div>
                    ) : (
                      <div className="px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2 text-xs text-slate-500">
                        <span>🔒</span>
                        <span>Masuk akun untuk menyimpan sertifikat &amp; progres belajar.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 pt-0">
                  <Link
                    id={`btn-course-${course.id}`}
                    href={`/academy/course/${course.id}`}
                    className="w-full py-2.5 bg-market-green-500 hover:bg-market-green-600 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <span>{percent === 100 ? 'Review Materi' : percent > 0 ? 'Lanjutkan Belajar' : 'Mulai Belajar'}</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            )
          })}
          </div>
        </div>
      </div>
    </div>
  )
}
