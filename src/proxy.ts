import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const { pathname } = request.nextUrl

  // Set x-pathname header for layout path checks
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)

  // Skip api routes, static files, next assets
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

  // Skip global platform routes so they work correctly even under merchant subdomains
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
    '/merchant'
  ]

  const isGlobalPath = globalPaths.some(p => pathname === p || pathname.startsWith(p + '/'))

  if (isGlobalPath) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  // Parse subdomain
  let subdomain = ''
  const cleanHost = hostname.split(':')[0]
  const hostParts = cleanHost.split('.')
  
  if (cleanHost.endsWith('localhost')) {
    // Local development subdomain check (e.g. arik.localhost)
    if (hostParts.length > 1) {
      const firstPart = hostParts[0].toLowerCase()
      if (!['www', 'admin', 'affiliate', 'api', 'localhost'].includes(firstPart)) {
        subdomain = firstPart
      }
    }
  } else if (cleanHost.endsWith('saloka.varro.my.id')) {
    // Cloudflare Tunnel development subdomain check (e.g. arik.saloka.varro.my.id)
    if (hostParts.length > 4) {
      const firstPart = hostParts[0].toLowerCase()
      if (!['www', 'admin', 'affiliate', 'api'].includes(firstPart)) {
        subdomain = firstPart
      }
    }
  } else if (cleanHost.endsWith('vercel.app')) {
    // Vercel deployment subdomain check (e.g. arik.terasumkm.vercel.app)
    if (hostParts.length > 3) {
      const firstPart = hostParts[0].toLowerCase()
      if (!['www', 'admin', 'affiliate', 'api'].includes(firstPart)) {
        subdomain = firstPart
      }
    }
  } else {
    // Production subdomain check (e.g. arik.saloka.id)
    if (hostParts.length > 2) {
      const firstPart = hostParts[0].toLowerCase()
      if (!['www', 'admin', 'affiliate', 'api'].includes(firstPart)) {
        subdomain = firstPart
      }
    }
  }

  if (subdomain) {
    const pageSlug = pathname === '/' ? '' : pathname.replace(/^\//, '')
    
    // Internal rewrite to /store/by-subdomain/[subdomain]/[pageSlug]
    const url = request.nextUrl.clone()
    url.pathname = `/store/by-subdomain/${subdomain}/${pageSlug}`
    
    return NextResponse.rewrite(url, {
      request: {
        headers: requestHeaders,
      },
    })
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
