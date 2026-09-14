import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify, type JWTPayload } from 'jose'
import { db } from '@/lib/db'
import { merchantSubdomain } from '@/lib/cookie-domain'
import {
  matchFeature,
  findFeature,
  parseFeatureControl,
  FEATURE_CONTROL_KEY,
  type FeatureControl,
  type FeatureEntry
} from '@/lib/features'

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
  return ((await sessionPayload(request))?.id as string) || 'anon'
}

async function sessionPayload(request: NextRequest): Promise<JWTPayload | null> {
  const token = request.cookies.get('session')?.value
  if (!token || !process.env.JWT_SECRET) return null
  try {
    return (await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET))).payload
  } catch {
    return null
  }
}

// ─── Feature Control (/cms_admin/features) ──────────────────────────────────
// ponytail: 30s per-instance TTL, so a toggle takes up to 30s to reach every
// instance; move to Redis via lib/cache if instant propagation matters.
const FEATURE_TTL_MS = 30_000
let featureControlMemo: { at: number; value: FeatureControl } | null = null
const placeholderMemo = new Map<string, { at: number; html: string }>()

// No x-robots-tag here on purpose. A bare 503 + Retry-After means "temporarily
// down, keep the ranking"; Google ignores 5xx content anyway, while a noindex
// that ever leaked onto a 200 (e.g. Beranda) would de-index the real page.
// Note: Google still drops URLs that return 5xx persistently, so keep
// outages of high-value pages short.
const PLACEHOLDER_HEADERS = {
  'retry-after': '3600',
  'cache-control': 'no-store'
}

async function getFeatureControl(): Promise<FeatureControl> {
  if (featureControlMemo && Date.now() - featureControlMemo.at < FEATURE_TTL_MS) return featureControlMemo.value
  let value: FeatureControl = {}
  try {
    const row = await db.systemSetting.findUnique({ where: { key: FEATURE_CONTROL_KEY } })
    value = parseFeatureControl(row?.value)
  } catch (e) {
    // Fail open: a DB hiccup must never take every public feature offline.
    console.error('[feature-control] config read failed, serving all features:', e)
  }
  featureControlMemo = { at: Date.now(), value }
  return value
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

// ponytail: bare-bones page for when the real placeholder can't be rendered;
// it can't reach the hashed design-system CSS, so the CTA is an unstyled link.
// Still a 503, so neither users nor crawlers ever get the disabled feature
// or a 200 in its place.
function fallbackPlaceholderHtml(entry: FeatureEntry): string {
  const href = findFeature(entry.target)?.href ?? '/'
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Saloka.id</title></head><body style="font-family:system-ui,sans-serif;text-align:center;padding:4rem 1rem"><h1 style="font-size:1.25rem">Fitur ini sedang dalam tahap penyempurnaan untuk pengalaman yang lebih baik.</h1><p><a href="${escapeHtml(href)}">${escapeHtml(entry.cta)}</a></p></body></html>`
}

// A rewrite can't carry a 503 — Next resets the status to 200 before a page
// renders (base-server.js `res.statusCode = 200` ahead of run()). So the
// placeholder page is rendered via an internal fetch and re-served as a body
// response, whose status the router does keep.
//
// Anonymous visitors share one cookie-less render per TTL. Logged-in visitors
// get a fresh render with their own cookies and it is never cached: after
// login the app pushes to '/', and if Beranda is off the header must show
// they are signed in — a logged-out header there reads as "login failed".
async function featureDisabledResponse(request: NextRequest, key: string, entry: FeatureEntry, loggedIn: boolean) {
  const cached = placeholderMemo.get(key)
  let html = !loggedIn && cached && Date.now() - cached.at < FEATURE_TTL_MS ? cached.html : null
  if (!html) {
    try {
      const res = await fetch(new URL(`/fitur-nonaktif?f=${key}`, request.nextUrl.origin), {
        cache: 'no-store',
        headers: loggedIn ? { cookie: request.headers.get('cookie') ?? '' } : undefined
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      html = await res.text()
      if (!loggedIn) placeholderMemo.set(key, { at: Date.now(), html })
    } catch (e) {
      console.error('[feature-control] placeholder render failed, serving fallback page:', e)
      html = fallbackPlaceholderHtml(entry)
    }
  }
  return new NextResponse(html, {
    status: 503,
    headers: { ...PLACEHOLDER_HEADERS, 'content-type': 'text/html; charset=utf-8' }
  })
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

  // 1b. Feature Control: a disabled public feature (and every nested route)
  // gets the 503 placeholder before anything renders. GET/HEAD only, so a
  // server action or form POST already in flight still lands. The catalog in
  // lib/features.ts never contains CMS or API prefixes.
  const feature = request.method === 'GET' || request.method === 'HEAD' ? matchFeature(pathname) : null
  // A merchant subdomain's root ('tokorijal.saloka.id/') is that store's
  // storefront, not Beranda, so disabling Beranda must not touch it.
  const isStorefrontRoot = feature?.key === 'home' && !!merchantSubdomain(hostname)
  if (feature && !isStorefrontRoot) {
    const entry = (await getFeatureControl())[feature.key]
    const session = entry ? await sessionPayload(request) : null
    if (entry && session?.role !== 'ADMIN') {
      return featureDisabledResponse(request, feature.key, entry, !!session)
    }
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
    '/bantuan',
    '/onboarding',
    '/ref',
    '/setup-landing',
    '/merchant/dashboard',
    '/merchant/builder',
    // Must not be rewritten into a merchant store when the proxy fetches it
    // from a subdomain host.
    '/fitur-nonaktif'
  ]

  const isGlobalPath = globalPaths.some((p) => pathname === p || pathname.startsWith(p + '/'))
  if (isGlobalPath) {
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })

    // The placeholder is only meant to be seen through the proxy's 503. A
    // direct visit returns 200, so keep that URL out of search results.
    if (pathname === '/fitur-nonaktif') response.headers.set('x-robots-tag', 'noindex')

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
  const subdomain = merchantSubdomain(hostname)

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
