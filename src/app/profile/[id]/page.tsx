import { getUserProfileById } from "@/app/actions/auth";
import { getProducts } from "@/app/actions/products";
import { notFound } from "next/navigation";
import ProfileViewerClient from "./ProfileViewerClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProfilePage({ params }: PageProps) {
  const { id } = await params;
  
  const user = await getUserProfileById(id);
  if (!user) {
    notFound();
  }

  // Get all products and filter for this user
  const allProducts = await getProducts();
  const userProducts = allProducts.filter((p) => p.merchantId === user.id);

  // Dynamically generate default template and configs if they haven't set it up
  const template = user.landingPageTemplate || 'modern-gold';
  const config = user.landingPageConfig || JSON.stringify({
    title: user.name,
    bio: `Selamat datang di profil resmi kami. Kami adalah pelaku usaha ${user.role === 'MERCHANT' ? 'Merchant' : user.role === 'AFFILIATE' ? 'Mitra Afiliasi' : 'Pelanggan'} terdaftar di ekosistem premium Teras UMKM. Silakan jelajahi katalog produk, jasa, dan lokasi kami.`,
    phone: "08123456789",
    instagram: `@${user.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
    sections: ["hero", "profile", "products", "map"]
  });

  return (
    <ProfileViewerClient
      user={{
        id: user.id,
        name: user.name,
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
    />
  );
}
