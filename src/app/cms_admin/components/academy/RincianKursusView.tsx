import Link from 'next/link'
import CertificateSheet from '@/components/CertificateSheet'
import { PROTECTED_CERTIFICATE_TEMPLATE_NAME } from '@/lib/lms-rules'

/**
 * The Rincian (detail) view for one Kursus — read-only: course info,
 * participation stats, and the module list. No edit controls here; that's
 * what Sunting is for.
 */
export default function RincianKursusView({
  course,
  participation,
  templates,
}: {
  course: any
  participation: { berjalan: number; selesai: number }
  templates: any[]
}) {
  const sortedLessons = [...(course.lessons || [])].sort((a: any, b: any) => a.orderIndex - b.orderIndex)

  // A course with no template of its own still resolves to the platform
  // default at issuance time — mirror that here so this preview matches
  // what a real certificate for this course will actually look like.
  const effectiveTemplate =
    course.certificateTemplate || templates.find((t: any) => t.name === PROTECTED_CERTIFICATE_TEMPLATE_NAME) || null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/cms_admin/academy"
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#64748b] hover:text-[#0F5132] uppercase tracking-wider transition-colors"
        >
          ← Kembali ke Daftar Kursus
        </Link>
        <Link
          href={`/cms_admin/academy/sunting/${course.id}`}
          className="px-4 py-2 bg-primary hover:bg-[#259a3f] text-white font-bold uppercase text-[10px] tracking-wider rounded-[var(--radius-brand)] transition-colors cursor-pointer"
        >
          Sunting Kursus
        </Link>
      </div>

      <div className="bg-white border border-[#e2e8f0] rounded-[var(--radius-brand)] overflow-hidden shadow-sm">
        <div className="p-6 md:flex gap-6 border-b border-[#e2e8f0]">
          <div className="w-full md:w-[220px] aspect-[16/9] md:aspect-auto rounded-[var(--radius-brand)] bg-slate-50 overflow-hidden border border-[#cbd5e1] flex-shrink-0 flex items-center justify-center">
            {course.coverImage ? (
              <img src={course.coverImage} alt={course.title} className="object-cover w-full h-full" />
            ) : (
              <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest">Premium Module</span>
            )}
          </div>
          <div className="flex-grow mt-4 md:mt-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#E8F5E9] border border-[#0F5132]/20 text-[#0F5132] uppercase tracking-wider">
                Level Akses: {course.accessRequired || 'Gold'}
              </span>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 border border-slate-200 text-slate-600 uppercase tracking-wider">
                {sortedLessons.length} Modul
              </span>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 border border-slate-200 text-slate-600 uppercase tracking-wider">
                Rp {Number(course.price || 0).toLocaleString('id-ID')}
              </span>
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${(course.isPublished ?? true) ? 'bg-bank-blue-50 border-bank-blue-200 text-bank-blue-700' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                {(course.isPublished ?? true) ? 'Dipasarkan' : 'Ditarik dari Pasar'}
              </span>
            </div>
            <h4 className="font-sora text-sm font-bold text-slate-800 mt-2">{course.title}</h4>
            <p className="text-xs text-[#64748b] leading-relaxed mt-2.5">{course.description}</p>
          </div>
        </div>

        <div className="p-6 bg-[#fafbfc] grid grid-cols-2 gap-4">
          <div className="bg-white border border-[#e2e8f0] rounded-[var(--radius-brand)] p-4">
            <div className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Berjalan</div>
            <div className="text-2xl font-sora font-bold text-[#0F5132] mt-1">{participation.berjalan}</div>
            <div className="text-[10px] text-[#64748b] mt-0.5">Peserta sedang mempelajari kursus ini</div>
          </div>
          <div className="bg-white border border-[#e2e8f0] rounded-[var(--radius-brand)] p-4">
            <div className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Selesai</div>
            <div className="text-2xl font-sora font-bold text-[#0F5132] mt-1">{participation.selesai}</div>
            <div className="text-[10px] text-[#64748b] mt-0.5">Peserta telah menuntaskan semua modul</div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#e2e8f0] rounded-[var(--radius-brand)] p-6 shadow-sm space-y-3">
        <h5 className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Silabus / Daftar Modul ({sortedLessons.length} Modul)</h5>
        {sortedLessons.length > 0 ? (
          <div className="space-y-2">
            {sortedLessons.map((lesson: any) => (
              <div key={lesson.id} className="flex justify-between items-center p-3.5 bg-[#fafbfc] border border-[#e2e8f0] rounded-[var(--radius-brand)]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] font-bold text-[#0F5132] bg-[#E8F5E9] px-1.5 py-0.2 border border-[#0F5132]/10 rounded">Urutan {lesson.orderIndex}</span>
                    <span className="text-xs font-bold text-slate-800">{lesson.title}</span>
                  </div>
                  <p className="text-[10px] text-[#64748b] mt-1.5 line-clamp-1">{lesson.content}</p>
                </div>
                <div className="text-[10px] text-[#64748b] font-mono shrink-0">
                  {lesson.type || 'VIDEO'} · {Math.round(lesson.duration / 60)} menit
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#64748b] italic p-4 text-center">Kursus ini belum memiliki modul.</p>
        )}
      </div>

      <div className="bg-white border border-[#e2e8f0] rounded-[var(--radius-brand)] p-6 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h5 className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">
            Template Sertifikat{course.certificateTemplate ? '' : ' (Bawaan Saloka)'}
          </h5>
          {effectiveTemplate && (
            <span className="text-xs font-bold text-slate-800">{effectiveTemplate.name}</span>
          )}
        </div>
        {effectiveTemplate ? (
          <CertificateSheet
            backgroundImage={effectiveTemplate.backgroundImage}
            type={effectiveTemplate.type}
            recipientName="Nama Peserta"
            courseTitle={course.title}
            issuedDate="1 Januari 2026"
            serial="SLK-CONTOH-0001"
          />
        ) : (
          <p className="text-xs text-[#64748b] italic p-4 text-center">Belum ada template sertifikat yang tersedia.</p>
        )}
      </div>
    </div>
  )
}
