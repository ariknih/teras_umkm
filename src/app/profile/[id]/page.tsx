import { getUserProfileById, getCurrentUser } from "@/app/actions/auth";
import { getProducts } from "@/app/actions/products";
import { notFound } from "next/navigation";
import ProfileViewerClient from "./ProfileViewerClient";
import { Metadata } from "next";
import { DataStore } from "@/lib/data-store";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(
  { params }: PageProps
): Promise<Metadata> {
  const { id } = await params;
  const user = id !== 'undefined' && id !== 'null' ? await getUserProfileById(id) : null;
  
  if (!user) {
    return {
      title: "Profil Tidak Ditemukan - Saloka.id",
      description: "Halaman profil merchant tidak ditemukan."
    };
  }

  let bio = `Selamat datang di profil resmi ${user.name}. Kami adalah pelaku usaha terdaftar di ekosistem premium Saloka.id.`;
  if (user.landingPageConfig) {
    try {
      const cfg = JSON.parse(user.landingPageConfig);
      if (cfg.bio) {
        bio = cfg.bio;
      }
    } catch (e) {}
  }

  const desc = bio.substring(0, 150) + (bio.length > 150 ? '...' : '');

  return {
    title: `${user.name} - Profil Merchant Saloka.id`,
    description: desc,
    openGraph: {
      title: `${user.name} - Profil Merchant Saloka.id`,
      description: desc,
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${user.name} - Profil Merchant Saloka.id`,
      description: desc,
    }
  };
}

export default async function ProfilePage({ params }: PageProps) {
  const { id } = await params;
  
  const user = id !== 'undefined' && id !== 'null' ? await getUserProfileById(id) : null;
  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F7F9] text-[#111111] font-sans pb-24 overflow-hidden relative flex items-center justify-center px-4">
        {/* Decorative glows */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(45,178,74,0.05)_0%,transparent_70%)] pointer-events-none z-0" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[radial-gradient(circle_at_center,rgba(198,169,107,0.03)_0%,transparent_70%)] pointer-events-none z-0" />

        <div className="relative z-10 w-full max-w-md text-center border border-black/5 bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-[#2DB24A]/10 border border-[#2DB24A]/20 flex items-center justify-center mx-auto text-[#2DB24A] mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0V10.5m-2.25 13.5h13.5c.621 0 1.125-.504 1.125-1.125V11.25c0-.621-.504-1.125-1.125-1.125H4.25c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125Z" />
            </svg>
          </div>
          <h2 className="font-sora text-2xl font-bold text-[#111111] mb-3">Belum Masuk Akun</h2>
          <p className="text-xs text-text-secondary leading-relaxed mb-8">
            Silakan masuk atau daftar akun baru Saloka.id untuk mengelola profil, melihat saldo dompet, dan mengakses fitur premium.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/auth?tab=login"
              className="w-full py-3 bg-[#2DB24A] hover:bg-[#2DB24A]/90 text-white text-center font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-lg"
            >
              Masuk Sekarang
            </Link>
            <Link
              href="/auth?tab=register"
              className="w-full py-3 bg-[#F5F7F9] hover:bg-neutral-200 border border-black/10 text-[#111111] text-center font-bold text-xs uppercase tracking-wider rounded-xl transition-colors"
            >
              Daftar Akun Baru
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Get current user to determine ownership
  const currentUser = await getCurrentUser();
  const isOwner = currentUser?.id === user.id;

  // Get wallet details
  let wallet = null;
  try {
    wallet = await DataStore.getWalletByUserId(user.id);
  } catch (e) {
    console.error("Failed to fetch wallet:", e);
  }

  // Get affiliate stats
  let affiliateStats = null;
  try {
    affiliateStats = await DataStore.getAffiliateStats(user.id);
  } catch (e) {
    console.error("Failed to fetch affiliate stats:", e);
  }

  // Get merchant stats if the user is a merchant
  let merchantStats = {
    totalOrders: 0,
    totalRevenue: 0,
  };
  if (user.role === 'MERCHANT') {
    try {
      const allOrders = await DataStore.getAllOrders();
      const detailedOrders = await Promise.all(
        allOrders.map(async (o: any) => {
          return await DataStore.findOrderById(o.id);
        })
      );
      const merchantOrders = detailedOrders.filter((o: any) => {
        if (!o || !o.items) return false;
        return o.items.some((item: any) => item.product?.merchantId === user.id);
      });
      merchantStats.totalOrders = merchantOrders.length;
      merchantStats.totalRevenue = merchantOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    } catch (e) {
      console.error("Failed to fetch merchant stats:", e);
    }
  }

  // Get all products and filter for this user
  const allProducts = await getProducts();
  const userProducts = allProducts.filter((p) => p.merchantId === user.id);

  // Get induk community info
  let indukCommunity = null;
  if (user.indukCommunityId) {
    try {
      indukCommunity = await DataStore.getCommunityById(user.indukCommunityId);
    } catch (e) {
      console.error("Failed to fetch induk community:", e);
    }
  }

  // Dynamically generate default template and configs if they haven't set it up
  const template = user.landingPageTemplate || 'modern-gold';
  const config = user.landingPageConfig || JSON.stringify({
    title: user.name,
    bio: `Selamat datang di profil resmi kami. Kami adalah pelaku usaha ${user.role === 'MERCHANT' ? 'Merchant' : user.role === 'AFFILIATE' ? 'Mitra Afiliasi' : 'Pelanggan'} terdaftar di ekosistem premium Saloka.id. Silakan jelajahi katalog produk, jasa, dan lokasi kami.`,
    phone: "08123456789",
    instagram: `@${user.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
    sections: ["hero", "profile", "products", "map"]
  });

  return (
    <ProfileViewerClient
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        level: user.level,
        xp: user.xp,
        membershipLevel: user.membershipLevel,
        membershipAccess: user.membershipAccess,
        landingPageTemplate: template,
        landingPageConfig: config,
        landingPageSetup: true, // Always force true for viewing
        latitude: user.latitude || -6.2088,
        longitude: user.longitude || 106.8456,
        kycStatus: user.kycStatus || 'NOT_SUBMITTED',
        indukCommunityId: user.indukCommunityId,
        indukCommunityName: indukCommunity ? indukCommunity.name : null,
      }}
      products={userProducts.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        price: p.price,
        category: p.category,
        stock: p.stock,
        imageUrl: p.imageUrl,
        latitude: p.latitude,
        longitude: p.longitude,
      }))}
      currentUser={currentUser}
      isOwner={isOwner}
      wallet={wallet}
      affiliateStats={affiliateStats}
      merchantStats={merchantStats}
    />
  );
}
