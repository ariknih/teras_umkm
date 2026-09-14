// Subdomains that are never merchant stores (system/reserved)
const RESERVED_SUBDOMAINS = ['www', 'admin', 'affiliate', 'api', 'localhost', 'prev', 'rev', 'dev', 'stage', 'staging', 'preprod', 'preview', 'test', 'app']

/**
 * Merchant store slug from the Host header, or '' for the main platform
 * domain (saloka.id, www.saloka.id, localhost, IP hosts, previews).
 * Import-free: used by src/proxy.ts and checked in lib/features.test.ts.
 */
export function merchantSubdomain(host: string): string {
  const cleanHost = host.split(':')[0].toLowerCase()
  // 127.0.0.1 or a LAN IP used to test from a phone — never a store.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(cleanHost)) return ''
  const hostParts = cleanHost.split('.')

  // Minimum host segments before the first one counts as a merchant subdomain.
  let minParts: number
  if (cleanHost.endsWith('localhost')) {
    minParts = 2 // Local development (e.g. tokorijal.localhost:3000)
  } else if (cleanHost.endsWith('saloka.varro.my.id')) {
    minParts = 5 // Cloudflare Tunnel testing (e.g. tokorijal.saloka.varro.my.id)
  } else if (cleanHost.endsWith('vercel.app')) {
    minParts = 4 // Vercel deployment (e.g. tokorijal.terasumkm.vercel.app)
  } else {
    minParts = 3 // Production (e.g. tokorijal.saloka.id)
  }

  if (hostParts.length < minParts) return ''
  return RESERVED_SUBDOMAINS.includes(hostParts[0]) ? '' : hostParts[0]
}

export function getCookieDomain(host: string): string | undefined {
  const cleanHost = host.split(':')[0].toLowerCase()
  if (cleanHost.endsWith('localhost')) {
    return '.localhost'
  }
  if (cleanHost.endsWith('varro.my.id')) {
    return '.varro.my.id'
  }
  if (cleanHost.endsWith('vercel.app')) {
    return undefined
  }
  return '.saloka.id'
}
