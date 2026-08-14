import Link from "next/link";
import { getCourses, getUserProgress } from "@/app/actions/lms";
import { getCurrentUser } from "@/app/actions/auth";

export default async function AcademyPage() {
  const user = await getCurrentUser();
  const courses = await getCourses();
  const progressList = user ? await getUserProgress() : [];

  // Create a set of completed lesson IDs for easy lookup
  const completedLessons = new Set(
    progressList.filter((p) => p.completed).map((p) => p.lessonId)
  );

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] pt-24 pb-24 px-4 sm:px-6 md:px-10 font-sans text-slate-900">
      <div className="relative z-10 max-w-[1140px] mx-auto space-y-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#E8F5E9] border border-[#C8E6C9] rounded-full text-[#006E24] text-xs font-bold">
            <span>🎓 Saloka Digital Academy UMKM</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Tingkatkan Skala Bisnis <span className="text-[#006E24]">UMKM Indonesia</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Pelajari strategi pemasaran digital, manajemen keuangan toko, standarisasi produk, dan teknik jualan laris langsung dari praktisi berpengalaman.
          </p>
        </div>

        {/* Course Catalog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((course) => {
            const courseLessons = course.lessons || []
            const totalLessons = courseLessons.length
            const completedCount = courseLessons.filter((l: any) => completedLessons.has(l.id)).length
            const percent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

            return (
              <div
                key={course.id}
                className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:border-[#006E24]/60 transition-all duration-300 flex flex-col justify-between group"
              >
                {/* Course Header with Image */}
                <div>
                  <div className="aspect-[21/9] w-full bg-slate-100 relative overflow-hidden flex items-center justify-center">
                    {course.coverImage ? (
                      <img
                        src={course.coverImage}
                        alt={course.title}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-sm bg-slate-100">
                        Modul Akademi Saloka
                      </div>
                    )}
                    <span className="absolute top-3 left-3 px-2.5 py-1 bg-white/95 rounded-lg text-[10px] font-extrabold text-[#006E24] shadow-xs uppercase tracking-wider">
                      {totalLessons} Modul Materi
                    </span>
                  </div>

                  {/* Course Info */}
                  <div className="p-6 space-y-3">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 line-clamp-1 group-hover:text-[#006E24] transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                      {course.description}
                    </p>

                    {/* Progress indicator */}
                    {user ? (
                      <div className="space-y-1.5 pt-2">
                        <div className="flex justify-between items-center text-[11px] font-bold text-slate-600 uppercase">
                          <span>Progres Belajar</span>
                          <span className="text-[#006E24]">{percent}% Selesai</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="bg-[#006E24] h-full rounded-full transition-all duration-500"
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
                <div className="p-6 pt-0">
                  <Link
                    id={`btn-course-${course.id}`}
                    href={`/academy/course/${course.id}`}
                    className="w-full py-2.5 bg-[#006E24] hover:bg-[#005a1d] text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
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
  )
}
