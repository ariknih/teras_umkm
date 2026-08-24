import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Saloka.id - Platform Ekosistem UMKM Indonesia',
    short_name: 'Saloka.id',
    description: 'Marketplace produk UMKM lokal, booking jasa profesional, dan ekosistem komunitas bisnis digital.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: '#006E24',
    icons: [
      {
        src: '/images/Variant=Icon.webp',
        sizes: '192x192',
        type: 'image/webp',
      },
      {
        src: '/images/Variant=Icon.webp',
        sizes: '512x512',
        type: 'image/webp',
      },
    ],
  }
}
