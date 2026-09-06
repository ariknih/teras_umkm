'use client'

export default function PrintButton() {
  // The browser's own "Save as PDF" in the print dialog covers the PDF
  // requirement — no PDF library, no server-side rendering cost.
  return (
    <button
      id="btn-print-certificate"
      onClick={() => window.print()}
      className="px-5 py-2.5 bg-[#006E24] hover:bg-[#005a1d] text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
    >
      Unduh / Cetak PDF
    </button>
  )
}
