import Link from 'next/link'
import CertificateSheet from '@/components/CertificateSheet'
import { PROTECTED_CERTIFICATE_TEMPLATE_NAME } from '@/lib/lms-rules'

/**
 * The Rincian (detail) view for one certificate template — read-only,
 * reached from the "Kelola Template" link on Tambah/Sunting Kursus when a
 * template is already selected. Editing itself stays where it always was
 * (the Sunting modal on the Sertifikat list) — "Sunting Template" here just
 * deep-links there with `?edit=<id>` so it opens pre-filled.
 */
export default function RincianTemplateView({
  template,
  courses,
}: {
  template: any
  courses: any[]
}) {
  const usingCourses = courses.filter((c: any) => c.certificateTemplateId === template.id)
  const isProtected = template.name === PROTECTED_CERTIFICATE_TEMPLATE_NAME

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/cms_admin/academy/sertifikat"
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#64748b] hover:text-[#0F5132] uppercase tracking-wider transition-colors"
        >
          ← Kembali ke Daftar Template
        </Link>
        <Link
          href={`/cms_admin/academy/sertifikat?edit=${template.id}`}
          className="px-4 py-2 bg-primary hover:bg-[#259a3f] text-white font-bold uppercase text-[10px] tracking-wider rounded-[var(--radius-brand)] transition-colors cursor-pointer"
        >
          Sunting Template
        </Link>
      </div>

      <div className="bg-white border border-[#e2e8f0] rounded-[var(--radius-brand)] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-sora text-sm font-bold text-slate-800">{template.name}</h4>
            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#E8F5E9] border border-[#0F5132]/20 text-[#0F5132] uppercase tracking-wider">
              {template.type}
            </span>
            {isProtected && (
              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-slate-100 border border-slate-200 text-slate-500 uppercase tracking-wider">Bawaan</span>
            )}
          </div>
          <span className="text-[10px] text-[#64748b]">Dipakai oleh {usingCourses.length} kursus</span>
        </div>

        <CertificateSheet
          backgroundImage={template.backgroundImage}
          type={template.type}
          recipientName="Nama Peserta"
          courseTitle="Judul Kursus Contoh"
          issuedDate="1 Januari 2026"
          serial="SLK-CONTOH-0001"
        />
      </div>

      <div className="bg-white border border-[#e2e8f0] rounded-[var(--radius-brand)] p-6 shadow-sm space-y-3">
        <h5 className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Kursus yang Memakai Template Ini ({usingCourses.length})</h5>
        {usingCourses.length > 0 ? (
          <div className="space-y-2">
            {usingCourses.map((c: any) => (
              <Link
                key={c.id}
                href={`/cms_admin/academy/rincian/${c.id}`}
                className="flex justify-between items-center p-3.5 bg-[#fafbfc] hover:bg-slate-100 border border-[#e2e8f0] rounded-[var(--radius-brand)] transition-colors"
              >
                <span className="text-xs font-bold text-slate-800">{c.title}</span>
                <span className="text-[10px] text-[#64748b]">Lihat Kursus →</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#64748b] italic p-4 text-center">Belum ada kursus yang memakai template ini.</p>
        )}
      </div>
    </div>
  )
}
