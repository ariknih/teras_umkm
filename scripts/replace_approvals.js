const fs = require('fs');
const code = fs.readFileSync('d:/PROJECT/teras_umkm/src/app/admin/AdminDashboardClient.tsx', 'utf8').split('\n');
const start = code.findIndex(l => l.includes("{activeTab === 'approvals' && ("));
const end = code.findIndex((l, i) => i > start && l.includes("{/* ─── TAB 2.6: WITHDRAWALS"));
const replacement = fs.readFileSync('C:/Users/User/.gemini/antigravity-ide/brain/6f1f5587-54fe-4918-94c5-edce486358d7/scratch/ApprovalsTab.tsx', 'utf8');
const newCode = [...code.slice(0, start), replacement, code.slice(end).join('\n')].join('\n');
fs.writeFileSync('d:/PROJECT/teras_umkm/src/app/admin/AdminDashboardClient.tsx', newCode);
console.log('Done!');
