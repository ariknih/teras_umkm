import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const { pathname } = request.nextUrl

  // Pass custom header x-pathname for layout path checking
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)

  // 1. Exclusion Rule: Ignore API routes, Next.js static internal files, and files with extensions
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  // 2. Skip global platform routes so they function correctly under subdomains if accessed directly
  const globalPaths = [
    '/market',
    '/cart',
    '/auth',
    '/academy',
    '/community',
    '/wallet',
    '/profile',
    '/orders',
    '/cs',
    '/settings',
    '/admin',
    '/affiliate',
    '/privacy',
    '/terms',
    '/onboarding',
    '/ref',
    '/setup-landing',
    '/merchant/dashboard',
    '/merchant/builder'
  ]

  const isGlobalPath = globalPaths.some((p) => pathname === p || pathname.startsWith(p + '/'))
  if (isGlobalPath) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  // 3. Subdomain extraction logic
  let subdomain = ''
  const cleanHost = hostname.split(':')[0]
  const hostParts = cleanHost.split('.')

  // Subdomains to ignore (system/reserved)
  const reservedSubdomains = ['www', 'admin', 'affiliate', 'api', 'localhost', 'prev', 'preprod', 'app']

  if (cleanHost.endsWith('localhost') || cleanHost.endsWith('127.0.0.1')) {
    // Local development (e.g. tokorijal.localhost:3000)
    if (hostParts.length > 1) {
      const firstPart = hostParts[0].toLowerCase()
      if (!reservedSubdomains.includes(firstPart)) {
        subdomain = firstPart
      }
    }
  } else if (cleanHost.endsWith('saloka.varro.my.id')) {
    // Cloudflare Tunnel testing (e.g. tokorijal.saloka.varro.my.id)
    if (hostParts.length > 4) {
      const firstPart = hostParts[0].toLowerCase()
      if (!reservedSubdomains.includes(firstPart)) {
        subdomain = firstPart
      }
    }
  } else if (cleanHost.endsWith('vercel.app')) {
    // Vercel deployment (e.g. tokorijal.terasumkm.vercel.app)
    if (hostParts.length > 3) {
      const firstPart = hostParts[0].toLowerCase()
      if (!reservedSubdomains.includes(firstPart)) {
        subdomain = firstPart
      }
    }
  } else {
    // Production (e.g. tokorijal.saloka.id)
    if (hostParts.length > 2) {
      const firstPart = hostParts[0].toLowerCase()
      if (!reservedSubdomains.includes(firstPart)) {
        subdomain = firstPart
      }
    }
  }

  // 4. Rewrite logic for merchant subdomain
  if (subdomain) {
    const targetPath = pathname === '/' ? '' : pathname
    
    // Internal rewrite to /merchant/[slug]
    const url = request.nextUrl.clone()
    url.pathname = `/merchant/${subdomain}${targetPath}`

    return NextResponse.rewrite(url, {
      request: {
        headers: requestHeaders,
      },
    })
  }

  // Default: Main app / Landing page for root domain saloka.id & www.saloka.id
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     * - Static asset file extensions (.png, .jpg, .jpeg, .svg, .css, .js, .webp, .ico, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)',
  ],
}
