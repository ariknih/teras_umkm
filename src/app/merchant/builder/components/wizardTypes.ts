// Types for the simplified 4-step wizard

export type BusinessCategory =
  | 'makanan'
  | 'fashion'
  | 'kecantikan'
  | 'kerajinan'
  | 'jasa'
  | 'lainnya'

// Kesan visual yang diinginkan merchant
export type DesignImpression = 'modern' | 'profesional' | 'ramah' | 'elegan'

// Layout pilihan utama
export type PreferredLayout = 'fokus_produk' | 'fokus_promosi' | 'fokus_informasi'

// Keep DesignStyle as alias for backward compat with generateLandingPageFromAnswers
export type DesignStyle = 'sederhana' | 'menarik' | 'profesional'

export interface WizardAnswers {
  // Slide 1: Informasi Usaha
  businessName: string
  businessCategory: BusinessCategory

  // Slide 3: Kesan Landing Page
  designImpression: DesignImpression

  // Slide 4: Preferensi Layout
  preferredLayout: PreferredLayout
}

export const DEFAULT_WIZARD_ANSWERS: WizardAnswers = {
  businessName: '',
  businessCategory: 'makanan',
  designImpression: 'modern',
  preferredLayout: 'fokus_produk',
}
