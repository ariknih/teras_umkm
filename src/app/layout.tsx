import type { Metadata } from "next";
import { Inter, Poppins, Geist } from "next/font/google";
import "./globals.css";
import { getCurrentUser, logout } from "@/app/actions/auth";
import { getWalletDetails } from "@/app/actions/wallet-affiliate";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DataStore } from "@/lib/data-store";
import OnboardingGuard from "./components/OnboardingGuard";
import { headers } from "next/headers";
import FloatingChat from "@/components/FloatingChat";
import HeaderNavigation from "./components/HeaderNavigation";
import MobileBottomNav from "@/components/MobileBottomNav";
import { GsapScrollTrigger } from "@/components/GsapScrollTrigger";
import Script from "next/script";
import { Logo } from "@/components/Logo";
import GoeyToastProvider from "@/components/GoeyToastProvider";

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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://saloka.id"),
  title: "Saloka.id | Platform Digital UMKM Premium Indonesia",
  description: "Ekosistem digital terlengkap untuk UMKM Indonesia: Marketplace, LMS Academy, Affiliate Hub, dan Community Forum dalam satu platform premium.",
  keywords: "UMKM, marketplace, toko online, jasa, affiliate, kursus bisnis, Indonesia",
  openGraph: {
    title: "Saloka.id | Platform Digital UMKM Premium",
    description: "Marketplace, LMS Academy, Affiliate & Community untuk UMKM Indonesia.",
    type: "website",
    locale: "id_ID",
    siteName: "Saloka.id",
    images: [
      {
        url: "/images/logo+nama_saloka.webp",
        width: 1200,
        height: 630,
        alt: "Saloka.id - Platform Digital UMKM Premium Indonesia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Saloka.id | Platform Digital UMKM Premium",
    description: "Marketplace, LMS Academy, Affiliate & Community untuk UMKM Indonesia.",
    images: ["/images/logo+nama_saloka.webp"],
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
    ? (dbUser.role === 'MERCHANT' ? dbUser.landingPageSetup : true)
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
      <head suppressHydrationWarning>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <Script
          id="theme-script"
          strategy="beforeInteractive"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              try {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
              } catch (_) {}
            `,
          }}
        />
        <Script
          id="bis-cleaner-script"
          strategy="beforeInteractive"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const clean = (node) => {
                  if (node && node.nodeType === 1) {
                    if (node.hasAttribute('bis_skin_checked')) {
                      node.removeAttribute('bis_skin_checked');
                    }
                    const kids = node.querySelectorAll('[bis_skin_checked]');
                    for (let i = 0; i < kids.length; i++) {
                      kids[i].removeAttribute('bis_skin_checked');
                    }
                  }
                };
                if (typeof window !== 'undefined') {
                  const observer = new MutationObserver((mutations) => {
                    for (let i = 0; i < mutations.length; i++) {
                      const m = mutations[i];
                      if (m.type === 'attributes' && m.attributeName === 'bis_skin_checked') {
                        m.target.removeAttribute('bis_skin_checked');
                      }
                      if (m.addedNodes) {
                        for (let j = 0; j < m.addedNodes.length; j++) {
                          clean(m.addedNodes[j]);
                        }
                      }
                    }
                  });
                  if (document.documentElement) {
                    observer.observe(document.documentElement, {
                      childList: true,
                      subtree: true,
                      attributes: true,
                      attributeFilter: ['bis_skin_checked']
                    });
                  }
                  document.addEventListener('DOMContentLoaded', () => {
                    clean(document.body);
                  });
                }
              })();
            `
          }}
        />
        <Script 
          id="midtrans-script"
          src={process.env.MIDTRANS_IS_PRODUCTION === 'true' 
            ? "https://app.midtrans.com/snap/snap.js" 
            : "https://app.sandbox.midtrans.com/snap/snap.js"
          } 
          strategy="beforeInteractive" 
          suppressHydrationWarning
        />
      </head>
      <body
        suppressHydrationWarning
        className={`min-h-full flex flex-col text-on-surface font-inter select-none overflow-x-hidden ${
          isAdminRoute ? "bg-[#0c0d0e]" : isBuilderRoute ? "bg-[#e8eaed]" : "bg-bg-dark pb-16 md:pb-0"
        }`}
        suppressHydrationWarning
      >
        <GoeyToastProvider />
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
        <main className="flex-grow flex flex-col pt-[100px]">
          {children}
        </main>

        {/* ── GLOBAL FOOTER ──────────────────────────────────────────────── */}
        <footer className="w-full py-16 border-t border-outline-variant/20 bg-surface-container-low print:hidden" suppressHydrationWarning>
          <div className="max-w-[1280px] mx-auto px-4 md:px-10 grid grid-cols-1 md:grid-cols-4 gap-10" suppressHydrationWarning>
            {/* Brand */}
            <div className="md:col-span-1" suppressHydrationWarning>
              <div className="flex items-center mb-4" suppressHydrationWarning>
                <img src="/images/logo+nama_saloka.webp" alt="Saloka.id" className="h-8 object-contain" />
              </div>
              <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
                Platform ekosistem digital terlengkap untuk pelaku UMKM Indonesia yang ingin berkembang.
              </p>
              <div className="flex gap-3" suppressHydrationWarning>
                {/* Instagram */}
                <a href="https://instagram.com/saloka.id" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-white border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary/40 transition-all" aria-label="Instagram">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                  </svg>
                </a>
                {/* TikTok */}
                <a href="https://tiktok.com/@saloka.id" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-white border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary/40 transition-all" aria-label="TikTok">
                  <svg width="14" height="16" viewBox="0 0 448 512" fill="currentColor">
                    <path d="M448 209.91a210.06 210.06 0 0 1-122.77-39.25v178.72A162.55 162.55 0 1 1 185 188.31v89.89a74.62 74.62 0 1 0 52.23 71.18V0h88a121.18 121.18 0 0 0 1.86 22.17A122.18 122.18 0 0 0 381 102.39a121.43 121.43 0 0 0 67 20.14z"/>
                  </svg>
                </a>
                {/* WhatsApp */}
                <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-white border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary/40 transition-all" aria-label="WhatsApp">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Platform links */}
            <div className="space-y-4" suppressHydrationWarning>
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
            <div className="space-y-4" suppressHydrationWarning>
              <h5 className="text-xs font-geist font-bold text-on-surface uppercase tracking-widest flex items-center gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
                Legal
              </h5>
              <nav className="flex flex-col gap-2">
                <Link href="/privacy" className="text-sm text-on-surface-variant hover:text-primary transition-colors">Kebijakan Privasi</Link>
                <Link href="/terms" className="text-sm text-on-surface-variant hover:text-primary transition-colors">Syarat & Ketentuan</Link>
                <Link href="/terms" className="text-sm text-on-surface-variant hover:text-primary transition-colors">Merchant Agreement</Link>
                <Link href="/cs" className="text-sm text-on-surface-variant hover:text-primary transition-colors">Pusat Bantuan</Link>
              </nav>
            </div>

            {/* Newsletter */}
            <div className="space-y-4" suppressHydrationWarning>
              <h5 className="text-xs font-geist font-bold text-on-surface uppercase tracking-widest flex items-center gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
                Newsletter
              </h5>
              <p className="text-sm text-on-surface-variant leading-relaxed">Insight bisnis UMKM setiap minggu, gratis.</p>
              <div className="flex bg-white border border-outline-variant/30 rounded-lg p-1 overflow-hidden" suppressHydrationWarning>
                <input className="bg-transparent border-none focus:ring-0 text-on-surface flex-1 px-3 text-sm outline-none" placeholder="Email Anda" type="email" />
                <button className="bg-primary hover:bg-primary/95 text-white rounded-md text-xs font-geist font-bold uppercase tracking-wider px-5 py-2.5 transition-colors cursor-pointer border-none outline-none">
                  Daftar
                </button>
              </div>
            </div>
          </div>

          <div className="max-w-[1280px] mx-auto px-4 md:px-10 mt-12 pt-6 border-t border-outline-variant/20 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left" suppressHydrationWarning>
            <p className="text-xs text-on-surface-variant">© 2026 Saloka.id. Dibuat dengan ❤️ untuk UMKM Indonesia.</p>
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 sm:gap-6 text-xs text-on-surface-variant" suppressHydrationWarning>
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

        <MobileBottomNav isLoggedIn={!!user} />
        <FloatingChat />
        </>
        )}
      </body>
    </html>
  );
}
