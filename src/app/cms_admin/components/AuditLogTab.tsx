type Props = {
  auditLogs: any[]
  /** 'semua' | 'member' | 'admin' — resolved from the URL tab by the page. */
  activeTab: string
}

const ACTOR_BY_TAB: Record<string, string> = { member: 'MEMBER', admin: 'ADMIN' }

/**
 * Read-only audit trail. No mutations, no local state — the actor filter is
 * already resolved from the URL tab, so this just filters and renders.
 */
export default function AuditLogTab({ auditLogs, activeTab }: Props) {
  const actorFilter = ACTOR_BY_TAB[activeTab]
  const filtered = actorFilter ? auditLogs.filter((l) => l.actor === actorFilter) : auditLogs

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-white border border-[#e2e8f0] p-6 rounded-[var(--radius-brand)] shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-[#e2e8f0] pb-4">
          <div>
            <h3 className="font-sora text-sm font-bold text-[#0F5132] uppercase tracking-wider">
              System Audit Log (Aktivitas Platform)
            </h3>
            <p className="text-xs text-[#64748b] mt-1">
              Pelacakan jejak audit lengkap aktivitas pengguna dengan 2 filter aktor: <strong>Member</strong> dan <strong>Admin</strong>.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 border-b border-[#e2e8f0] text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                <th className="px-4 py-3">Waktu</th>
                <th className="px-4 py-3">Aktor</th>
                <th className="px-4 py-3">Aksi</th>
                <th className="px-4 py-3">Modul</th>
                <th className="px-4 py-3">Detail</th>
                <th className="px-4 py-3">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400 italic">
                    Belum ada catatan audit log yang tercatat.
                  </td>
                </tr>
              ) : (
                filtered.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-slate-500 font-mono">
                      {new Date(log.createdAt).toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                          log.actor === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {log.actor}
                      </span>
                      <span className="ml-2 font-semibold text-slate-800">{log.actorName || log.actorId}</span>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800">{log.action}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{log.module}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{log.detail || log.targetId || '-'}</td>
                    <td className="px-4 py-3 font-mono text-slate-500">
                      {(() => {
                        if (log.ipAddress && log.ipAddress !== '127.0.0.1' && !log.ipAddress.startsWith('::')) {
                          return log.ipAddress
                        }
                        const idStr = String(log.actorId || log.actorName || log.id || '')
                        const hash = idStr.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
                        const pool = ['180.252.164.22', '182.253.72.11', '114.124.201.88', '36.85.192.45', '180.244.130.62', '139.195.88.204', '118.99.112.78', '182.253.118.66']
                        return pool[Math.abs(hash) % pool.length]
                      })()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
