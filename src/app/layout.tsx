import type { Metadata } from "next";
import { Inter, Poppins, Geist } from "next/font/google";
import "./globals.css";
import { getCurrentUser, logout } from "./actions/auth";
import { getWalletDetails } from "./actions/wallet-affiliate";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DataStore } from "@/lib/data-store";
import OnboardingGuard from "./components/OnboardingGuard";
import { headers } from "next/headers";
import FloatingChat from "@/components/FloatingChat";
import HeaderNavigation from "./components/HeaderNavigation";
import ThemeToggle from "@/components/ThemeToggle";
import { GsapScrollTrigger } from "@/components/GsapScrollTrigger";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Saloka.id | Platform Digital UMKM Premium Indonesia",
  description: "Ekosistem digital terlengkap untuk UMKM Indonesia: Marketplace, LMS Academy, Affiliate Hub, dan Community Forum dalam satu platform premium.",
  keywords: "UMKM, marketplace, toko online, jasa, affiliate, kursus bisnis, Indonesia",
  openGraph: {
    title: "Saloka.id | Platform Digital UMKM Premium",
    description: "Marketplace, LMS Academy, Affiliate & Community untuk UMKM Indonesia.",
    type: "website",
    locale: "id_ID",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  let dbUser = user ? await DataStore.findUserById(user.id) : null;
  if (user && !dbUser) {
    dbUser = await DataStore.recreateMissingUser({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });
  }
  const wallet = user ? await getWalletDetails() : null;
  const userSetupCompleted = dbUser 
    ? (['MERCHANT', 'AFFILIATE'].includes(dbUser.role) ? dbUser.landingPageSetup : true)
    : true;

  const headerList = await headers();
  const pathname = headerList.get("x-pathname") || "";
  const isAdminRoute = pathname.startsWith("/admin");
  const isBuilderRoute = pathname.startsWith("/merchant/builder");

  return (
    <html
      lang="id"
      className={`${inter.variable} ${poppins.variable} ${geist.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
        <script src="https://app.sandbox.midtrans.com/snap/snap.js" async />
      </head>
      <body
        className={`min-h-full flex flex-col text-on-surface font-inter select-none overflow-x-hidden ${
          isAdminRoute ? "bg-[#0c0d0e]" : isBuilderRoute ? "bg-[#e8eaed]" : "bg-bg-dark pb-16 md:pb-0"
        }`}
        suppressHydrationWarning
      >
        {isAdminRoute || isBuilderRoute ? (
          <main className="flex-grow flex flex-col">
            {children}
          </main>
        ) : (
          <>
            <GsapScrollTrigger />
            <OnboardingGuard isLoggedIn={!!user} userSetupCompleted={!!userSetupCompleted} userId={dbUser?.id || ''} />

            {/* ── RESPONSIVE NAVIGATION HEADER ──────────────────────────── */}
            <HeaderNavigation user={dbUser} wallet={wallet} logoutAction={logout} />

        {/* Page Content */}
        <main className="flex-grow flex flex-col pt-[72px]">
          {children}
        </main>

        {/* ── GLOBAL FOOTER ──────────────────────────────────────────────── */}
        <footer className="w-full py-16 border-t border-outline-variant/20 bg-surface-container-low print:hidden">
          <div className="max-w-[1280px] mx-auto px-4 md:px-10 grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-md bg-primary-container flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-on-primary-container">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </div>
                <span className="font-poppins font-bold text-secondary text-lg">Saloka<span className="text-tertiary">.id</span></span>
              </div>
              <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
                Platform ekosistem digital terlengkap untuk pelaku UMKM Indonesia yang ingin berkembang.
              </p>
              <div className="flex gap-3">
                {/* Instagram */}
                <a href="#" className="w-9 h-9 rounded-lg bg-white border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary/40 transition-all" aria-label="Instagram">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                  </svg>
                </a>
                {/* TikTok */}
                <a href="#" className="w-9 h-9 rounded-lg bg-white border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary/40 transition-all" aria-label="TikTok">
                  <svg width="14" height="16" viewBox="0 0 448 512" fill="currentColor">
                    <path d="M448 209.91a210.06 210.06 0 0 1-122.77-39.25v178.72A162.55 162.55 0 1 1 185 188.31v89.89a74.62 74.62 0 1 0 52.23 71.18V0h88a121.18 121.18 0 0 0 1.86 22.17A122.18 122.18 0 0 0 381 102.39a121.43 121.43 0 0 0 67 20.14z"/>
                  </svg>
                </a>
                {/* WhatsApp */}
                <a href="#" className="w-9 h-9 rounded-lg bg-white border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary/40 transition-all" aria-label="WhatsApp">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Platform links */}
            <div className="space-y-4">
              <h5 className="text-xs font-geist font-bold text-on-surface uppercase tracking-widest flex items-center gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
                Platform
              </h5>
              <nav className="flex flex-col gap-2">
                <Link href="/market" className="text-sm text-on-surface-variant hover:text-primary transition-colors">Marketplace</Link>
                <Link href="/market?category=JASA" className="text-sm text-on-surface-variant hover:text-primary transition-colors">Katalog Jasa</Link>
                <Link href="/academy" className="text-sm text-on-surface-variant hover:text-primary transition-colors">LMS Academy</Link>
                <Link href="/affiliate" className="text-sm text-on-surface-variant hover:text-primary transition-colors">Affiliate Hub</Link>
                <Link href="/community" className="text-sm text-on-surface-variant hover:text-primary transition-colors">Community Forum</Link>
              </nav>
            </div>

            {/* Legal links */}
            <div className="space-y-4">
              <h5 className="text-xs font-geist font-bold text-on-surface uppercase tracking-widest flex items-center gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
                Legal
              </h5>
              <nav className="flex flex-col gap-2">
                <Link href="/privacy" className="text-sm text-on-surface-variant hover:text-primary transition-colors">Kebijakan Privasi</Link>
                <Link href="/terms" className="text-sm text-on-surface-variant hover:text-primary transition-colors">Syarat & Ketentuan</Link>
                <a href="#" className="text-sm text-on-surface-variant hover:text-primary transition-colors">Merchant Agreement</a>
                <a href="#" className="text-sm text-on-surface-variant hover:text-primary transition-colors">Pusat Bantuan</a>
              </nav>
            </div>

            {/* Newsletter */}
            <div className="space-y-4">
              <h5 className="text-xs font-geist font-bold text-on-surface uppercase tracking-widest flex items-center gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
                Newsletter
              </h5>
              <p className="text-sm text-on-surface-variant leading-relaxed">Insight bisnis UMKM setiap minggu, gratis.</p>
              <div className="flex bg-white border border-outline-variant/30 rounded-lg p-1 overflow-hidden">
                <input className="bg-transparent border-none focus:ring-0 text-on-surface flex-1 px-3 text-sm outline-none" placeholder="Email Anda" type="email" />
                <button className="bg-primary-container text-on-surface px-4 py-2 rounded-md font-bold text-xs transition-all hover:bg-primary-container/90">Daftar</button>
              </div>
            </div>
          </div>

          <div className="max-w-[1280px] mx-auto px-4 md:px-10 mt-12 pt-6 border-t border-outline-variant/20 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
            <p className="text-xs text-on-surface-variant">© 2026 Saloka.id. Dibuat dengan ❤️ untuk UMKM Indonesia.</p>
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 sm:gap-6 text-xs text-on-surface-variant">
              <a
                href="https://arikporto.netlify.app"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary hover:underline transition-colors"
              >
                Contact Developer
              </a>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                SYSTEM STABLE
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
                Midtrans Secured
              </span>
            </div>
          </div>
        </footer>

        {/* ── MOBILE NAV BAR ──────────────────────────────────────────────── */}
        <nav className="md:hidden bg-white/95 backdrop-blur-2xl fixed bottom-0 left-0 right-0 w-full z-50 rounded-t-2xl border-t border-outline-variant/20 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-safe print:hidden">
          <div className="flex justify-around items-center h-16 px-2">
            <Link href="/" className="flex flex-col items-center justify-center text-primary transition-colors flex-1 gap-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <span className="text-[9px] font-geist font-semibold">Home</span>
            </Link>
            <Link href="/market" className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-colors flex-1 gap-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              <span className="text-[9px] font-geist font-semibold">Market</span>
            </Link>
            <Link href="/academy" className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-colors flex-1 gap-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
              <span className="text-[9px] font-geist font-semibold">Academy</span>
            </Link>
            <Link href="/cart" className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-colors flex-1 gap-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              <span className="text-[9px] font-geist font-semibold">Keranjang</span>
            </Link>
            <Link href={user ? "/wallet" : "/auth"} className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-colors flex-1 gap-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              <span className="text-[9px] font-geist font-semibold">Profil</span>
            </Link>
          </div>
        </nav>
        <FloatingChat />
        <ThemeToggle />
        </>
        )}
      </body>
    </html>
  );
}
