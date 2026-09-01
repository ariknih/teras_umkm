import type { Metadata } from "next";
import { Inter, Poppins, Geist } from "next/font/google";
import "./globals.css";
import { getCurrentUser, logout } from "@/app/actions/auth";
import { getWalletDetails } from "@/app/actions/wallet-affiliate";
import { DataStore } from "@/lib/data-store";
import { cacheWrap } from "@/lib/cache";
import Script from "next/script";
import GoeyToastProvider from "@/components/GoeyToastProvider";
import ClientLayoutWrapper from "./components/ClientLayoutWrapper";


const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://saloka.id"),
  title: "Saloka.id | Platform Digital UMKM Premium Indonesia",
  description: "Ekosistem digital terlengkap untuk UMKM Indonesia: Marketplace, LMS Academy, Affiliate Hub, dan Community Forum dalam satu platform premium.",
  keywords: "UMKM, marketplace, toko online, jasa, affiliate, kursus bisnis, Indonesia",
  icons: {
    icon: [
      { url: "/images/Variant=Icon.webp", type: "image/webp" },
      { url: "/favicon.ico" }
    ],
    shortcut: "/images/Variant=Icon.webp",
    apple: "/images/Variant=Icon.webp",
  },
  openGraph: {
    title: "Saloka.id | Platform Digital UMKM Premium",
    description: "Marketplace, LMS Academy, Affiliate & Community untuk UMKM Indonesia.",
    type: "website",
    locale: "id_ID",
    siteName: "Saloka.id",
    images: [
      {
        url: "/images/Variant=Full.webp",
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
    images: ["/images/Variant=Full.webp"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  let [dbUser, wallet] = user
    ? await Promise.all([
        cacheWrap(`user:db:${user.id}`, () => DataStore.findUserById(user.id), 60),
        cacheWrap(`user:wallet:${user.id}`, () => getWalletDetails(user), 60)
      ])
    : [null, null];
  if (user && !dbUser) {
    dbUser = await DataStore.recreateMissingUser({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });
  }
  const userSetupCompleted = dbUser 
    ? (dbUser.role === 'MERCHANT' ? dbUser.landingPageSetup : true)
    : true;

  return (
    <html
      lang="id"
      className={`${inter.variable} ${poppins.variable} ${geist.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head suppressHydrationWarning>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/images/Variant=Icon.webp" type="image/webp" />
        <link rel="shortcut icon" href="/images/Variant=Icon.webp" type="image/webp" />
        <link rel="apple-touch-icon" href="/images/Variant=Icon.webp" />
        <link rel="preload" href="/images/Variant=Full.webp" as="image" type="image/webp" fetchPriority="high" />
        <script
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
      </head>
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col text-on-surface font-inter select-none overflow-x-hidden"
      >
        <Script 
          id="midtrans-script"
          src={process.env.MIDTRANS_IS_PRODUCTION === 'true' 
            ? "https://app.midtrans.com/snap/snap.js" 
            : "https://app.sandbox.midtrans.com/snap/snap.js"
          } 
          strategy="lazyOnload" 
          suppressHydrationWarning
        />
        <GoeyToastProvider />
        <ClientLayoutWrapper
          user={user}
          dbUser={dbUser}
          wallet={wallet}
          userSetupCompleted={!!userSetupCompleted}
          logoutAction={logout}
        >
          {children}
        </ClientLayoutWrapper>
      </body>
    </html>
  );
}
