import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// The community-scoped referral cookie's "first touch, never overwritten"
// rule is meant to protect one prospective member's attribution from being
// clobbered by a later, unrelated link click on their own device — not to
// merge every different logged-in account that happens to share a browser
// into a single slot. Scoping the cookie by the CURRENTLY logged-in user
// (falling back to a shared "anon" slot pre-login) means two different
// accounts on the same browser (a QA tester switching test users, or a
// shared/public device) each get independently tracked attribution instead
// of the second visit silently inheriting the first visitor's referrer.
async function referralCookieScope(request: NextRequest): Promise<string> {
  const token = request.cookies.get('session')?.value
  if (!token || !process.env.JWT_SECRET) return 'anon'
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET))
    return (payload.id as string) || 'anon'
  } catch {
    return 'anon'
  }
}

export async function proxy(request: NextRequest) {
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
    '/cms_admin',
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
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })

    // Community-scoped referral, first-touch per (community, visiting user)
    // — never overwritten within that scope — separate from the
    // platform-wide signup referral cookie set by /ref/[slug]. Must be set
    // here: cookies() can't be mutated from a Server Component's render
    // body, only from a Server Action, Route Handler, or proxy/middleware.
    const communityMatch = pathname.match(/^\/community\/([^/]+)/)
    const ref = request.nextUrl.searchParams.get('ref')
    if (communityMatch && ref) {
      const scope = await referralCookieScope(request)
      const cookieName = `cref_${communityMatch[1]}_${scope}`
      if (!request.cookies.get(cookieName)) {
        response.cookies.set(cookieName, ref, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 30, // 30 days
        })
      }
    }

    return response
  }

  // 3. Subdomain extraction logic
  let subdomain = ''
  const cleanHost = hostname.split(':')[0]
  const hostParts = cleanHost.split('.')

  // Subdomains to ignore (system/reserved)
  const reservedSubdomains = ['www', 'admin', 'affiliate', 'api', 'localhost', 'prev', 'rev', 'dev', 'stage', 'staging', 'preprod', 'preview', 'test', 'app']

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
