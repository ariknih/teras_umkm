import { notFound } from "next/navigation";
import { DataStore } from "@/lib/data-store";
import CertificateSheet from "@/components/CertificateSheet";
import PrintButton from "./PrintButton";

interface PageProps {
  params: Promise<{ serial: string }>;
}

/**
 * Public certificate page. Deliberately unauthenticated: it doubles as the
 * verification surface, so anyone handed the serial can confirm it is real.
 * Only the recipient name, course title, and issue date are exposed.
 */
export default async function CertificatePage({ params }: PageProps) {
  const { serial } = await params;
  const cert: any = await DataStore.findCertificateBySerial(serial);

  if (!cert || !cert.user || !cert.course) {
    notFound();
  }

  const issued = new Date(cert.issuedAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // A course with no template of its own still gets a real, on-brand
  // certificate — it falls back to the platform default rather than the
  // bare hardcoded design below, which now only fires if that default was
  // never created at all (e.g. a fresh environment).
  const template = cert.course.certificateTemplate ?? (await DataStore.getDefaultCertificateTemplate());

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] pt-24 pb-24 px-4 sm:px-6 md:px-10 font-sans text-slate-900">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #certificate-sheet, #certificate-sheet * {
            visibility: visible;
            /* Browsers drop background-image/color on print unless told
               otherwise — without this the template's background image
               (and the overlay panel's translucent white) print blank. */
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          #certificate-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none;
            box-shadow: none;
          }
          @page { size: letter landscape; margin: 0; }
        }
      `}</style>

      <div className="relative z-10 max-w-[900px] mx-auto space-y-6">
        {template ? (
          <CertificateSheet
            backgroundImage={template.backgroundImage}
            type={template.type}
            recipientName={cert.user.name}
            courseTitle={cert.course.title}
            issuedDate={issued}
            serial={cert.serial}
          />
        ) : (
          <div
            id="certificate-sheet"
            className="bg-white border-[3px] border-[#006E24] rounded-2xl p-10 sm:p-16 text-center shadow-sm"
          >
            <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#006E24]">
              Sertifikat Kelulusan
            </div>

            <div className="mt-2 text-xs text-slate-500">
              Saloka Digital Academy UMKM
            </div>

            <div className="mt-10 text-xs uppercase tracking-wider text-slate-400">
              Diberikan kepada
            </div>
            <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {cert.user.name}
            </h1>

            <div className="mt-8 text-xs uppercase tracking-wider text-slate-400">
              Atas penyelesaian seluruh modul kelas
            </div>
            <h2 className="mt-2 text-lg sm:text-2xl font-bold text-[#006E24]">
              {cert.course.title}
            </h2>

            <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 pt-6 text-[11px] text-slate-500">
              <div className="text-left">
                <div className="font-bold text-slate-700">Tanggal Terbit</div>
                <div>{issued}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-700">Nomor Sertifikat</div>
                <div className="font-mono">{cert.serial}</div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-3 print:hidden">
          <PrintButton />
        </div>

        <p className="text-center text-[11px] text-slate-400 print:hidden">
          Sertifikat ini dapat diverifikasi melalui nomor sertifikat di atas.
        </p>
      </div>
    </div>
  );
}
