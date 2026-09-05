'use client'

/** Same CSV building + download logic every extracted menu with export used to share via the legacy shell's single handleExportCSV. */
export function downloadCsv(filename: string, rows: string[][]) {
  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n')
  const link = document.createElement('a')
  link.setAttribute('href', encodeURI(csvContent))
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export default function ExportCsvButton({ filenamePrefix, rows }: { filenamePrefix: string; rows: string[][] }) {
  return (
    <div className="flex justify-end mb-4">
      <button
        onClick={() => downloadCsv(`saloka_${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.csv`, rows)}
        className="px-3 py-1.5 bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#006E24] text-xs font-bold rounded-lg transition-colors border border-[#C8E6C9] shadow-2xs flex items-center gap-1.5 cursor-pointer"
        title="Unduh data tabel aktif sebagai file CSV"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" />
        </svg>
        <span>Export CSV</span>
      </button>
    </div>
  )
}
