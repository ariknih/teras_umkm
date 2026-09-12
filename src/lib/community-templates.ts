// Single source of truth for which navigation modules exist per Perkumpulan
// page template (Society/Business/Education/Culinary), and which of them are
// on by default for each. Shared between the client-side Pengaturan tab
// (toggle list + template dropdown) and the server-side community-creation
// action, so a freshly created community's initial disabledModules always
// matches the template chosen at creation instead of drifting from it.

export const PERKUMPULAN_TEMPLATE_MODULE_IDS = [
  'diskusi',
  'aktivitas',
  'event',
  'galeri',
  'produk_komunitas',
  'marketplace',
  'pengumuman',
  'business_matching',
  'pelatihan',
  'mentor',
  'kolaborasi',
  'kelas',
  'kompetisi',
  'startup',
  'merchant',
  'supplier',
  'promo'
] as const

export const PERKUMPULAN_TEMPLATE_OPTIONS = ['Society', 'Business', 'Education', 'Culinary'] as const

// Plain-text labels for the module ids above - used by the "Modul Bawaan"
// preview in the create-community forms (no icons needed there, unlike the
// Pengaturan toggle list which pairs these ids with lucide-react icons).
export const PERKUMPULAN_MODULE_LABELS: Record<string, string> = {
  diskusi: 'Diskusi',
  aktivitas: 'Aktivitas',
  event: 'Event',
  galeri: 'Galeri',
  produk_komunitas: 'Produk Komunitas',
  marketplace: 'Produk Anggota',
  pengumuman: 'Pengumuman',
  business_matching: 'Business Matching',
  pelatihan: 'Pelatihan',
  mentor: 'Mentor',
  kolaborasi: 'Kolaborasi',
  kelas: 'Kelas',
  kompetisi: 'Kompetisi',
  startup: 'Startup',
  merchant: 'Merchant',
  supplier: 'Supplier',
  promo: 'Promo'
}

// Modul Bawaan preview for a given template, in the order that template
// enables them - Hero Banner and Anggota are always on regardless of
// template (same as in the real Pengaturan toggle list), so they're prepended.
export function getModulePreviewLabels(templateType: string): string[] {
  if (templateType === 'Koperasi') {
    return ['Hero Banner', 'Simpanan', 'Diskusi', 'SHU', 'Produk Komunitas', 'Anggota']
  }
  const defaults = PERKUMPULAN_TEMPLATE_DEFAULTS[templateType] || PERKUMPULAN_TEMPLATE_DEFAULTS.Society
  return ['Hero Banner', ...defaults.map((id) => PERKUMPULAN_MODULE_LABELS[id] || id), 'Anggota']
}

export const PERKUMPULAN_TEMPLATE_DEFAULTS: Record<string, string[]> = {
  Society: ['aktivitas', 'diskusi', 'event', 'galeri', 'produk_komunitas', 'marketplace', 'pengumuman'],
  Business: ['diskusi', 'business_matching', 'pelatihan', 'mentor', 'kolaborasi', 'produk_komunitas', 'marketplace', 'event', 'pengumuman'],
  Education: ['kelas', 'mentor', 'kompetisi', 'startup', 'produk_komunitas', 'event', 'diskusi', 'pengumuman'],
  Culinary: ['diskusi', 'merchant', 'produk_komunitas', 'marketplace', 'supplier', 'event', 'galeri', 'promo']
}

// Detects which template (if any) the currently-enabled module set matches
// exactly. Returns 'Custom' when no template's default set is an exact match.
export function detectPerkumpulanTemplate(enabledIds: string[]): string {
  const sortedEnabled = [...enabledIds].sort().join(',')
  for (const tpl of PERKUMPULAN_TEMPLATE_OPTIONS) {
    const defaults = [...PERKUMPULAN_TEMPLATE_DEFAULTS[tpl]].sort().join(',')
    if (defaults === sortedEnabled) return tpl
  }
  return 'Custom'
}

// The disabledModules list a newly-created (or template-switched) Perkumpulan
// community should start with: every module NOT in that template's defaults.
export function getDisabledModulesForTemplate(templateType: string): string[] {
  const defaults = PERKUMPULAN_TEMPLATE_DEFAULTS[templateType] || []
  return PERKUMPULAN_TEMPLATE_MODULE_IDS.filter((id) => !defaults.includes(id))
}

// 'Community' is the legacy stored value for communities created before the
// template was relabeled 'Society'.
export function normalizeTemplateType(value: string | undefined | null): string {
  if (!value) return 'Society'
  return value === 'Community' ? 'Society' : value
}
