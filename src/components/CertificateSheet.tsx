/**
 * Shared certificate layout — the background image (logo/signature/job title
 * all baked into the artwork by the admin) plus the overlay text that's
 * genuinely per-recipient. Used both by the public /certificate/[serial]
 * page (real data) and the CMS "Lihat"/form preview (sample data), so the
 * admin preview always matches exactly what a real certificate renders.
 *
 * Sized entirely in `cqw` (container query width) units, not viewport
 * breakpoints (`sm:`) — this sheet gets embedded at very different widths
 * (a ~340px CMS modal vs. a ~900px public page), and viewport breakpoints
 * fire based on the browser window, not this component's own rendered
 * width, so a desktop browser would apply "sm:" sizing meant for a wide
 * card even while the sheet itself is squeezed into a narrow modal —
 * overflowing the fixed aspect-ratio box. `cqw` scales purely off this
 * component's own width, so the proportions (and therefore the fit within
 * the aspect-ratio box) stay correct at any embedding size.
 */
export default function CertificateSheet({
  backgroundImage,
  type,
  recipientName,
  courseTitle,
  issuedDate,
  serial,
}: {
  backgroundImage: string
  type: string
  recipientName: string
  courseTitle: string
  issuedDate: string
  serial: string
}) {
  return (
    <div
      id="certificate-sheet"
      // max-w-[776px] (600px * 11/8.5) caps the rendered height at 600px on
      // screen without touching max-height directly — with a fixed
      // aspect-ratio, capping width by the equivalent value caps height too,
      // and avoids the aspect-ratio/max-height interaction edge cases that
      // come with a plain max-height on a box whose width otherwise stretches
      // to fill its (often much wider) container. Print is unaffected: the
      // print stylesheet's #certificate-sheet rule sets width:100% with
      // higher (ID) specificity, overriding this for the exported PDF.
      className="@container relative w-full max-w-[776px] mx-auto aspect-[11/8.5] rounded-2xl overflow-hidden shadow-sm bg-cover bg-center"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="absolute inset-0 flex items-center justify-center p-[3cqw]">
        <div className="w-full max-w-[85%] px-[4cqw] py-[3cqw] text-center">
          <div className="text-[5cqw] font-extrabold tracking-tight text-slate-900 leading-tight">SERTIFIKAT</div>
          <div className="mt-[0.8cqw] text-[2.2cqw] font-bold uppercase tracking-[0.3em] text-[#006E24] leading-tight">{type}</div>

          <div className="mt-[2.5cqw] flex items-center justify-between gap-[2cqw] border-y border-slate-200 py-[1.5cqw] text-[1.8cqw] text-slate-500 leading-tight">
            <div className="text-left">
              <div className="font-bold text-slate-700">Nomor Sertifikat</div>
              <div className="font-mono">{serial}</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-slate-700">Tanggal Terbit</div>
              <div>{issuedDate}</div>
            </div>
          </div>

          <div className="mt-[2.5cqw] text-[1.8cqw] uppercase tracking-wider text-slate-400 leading-tight">
            Sertifikat ini dianugerahkan kepada
          </div>
          <h1 className="mt-[0.5cqw] text-[4.5cqw] font-extrabold text-slate-900 tracking-tight leading-tight">
            {recipientName}
          </h1>

          <div className="mt-[2cqw] text-[1.8cqw] text-slate-500 leading-tight">
            Pada tanggal {issuedDate} telah menyelesaikan kursus
          </div>
          <h2 className="mt-[0.5cqw] text-[3cqw] font-bold text-[#006E24] leading-tight">
            {courseTitle}
          </h2>
        </div>
      </div>
    </div>
  )
}
