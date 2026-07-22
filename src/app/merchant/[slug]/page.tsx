import { DataStore } from "@/lib/data-store";
import { getProducts } from "@/app/actions/products";
import { notFound } from "next/navigation";
import ProfileViewerClient from "@/app/profile/[id]/ProfileViewerClient";
import StorePageViewerClient from "@/app/store/[merchantId]/[pageSlug]/StorePageViewerClient";
import { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(
  { params }: PageProps
): Promise<Metadata> {
  const { slug } = await params;
  const user = await DataStore.findUserBySubdomain(slug);
  
  if (!user || user.role !== 'MERCHANT') {
    return {
      title: "Profil Merchant Tidak Ditemukan - Saloka.id",
    };
  }

  let bio = `Selamat datang di toko/profil resmi ${user.name}. Kami adalah pelaku usaha terdaftar di ekosistem premium Saloka.id.`;
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
    title: `${user.name} - Storefront Saloka.id`,
    description: desc,
  };
}

export default async function MerchantSubdomainPage({ params }: PageProps) {
  // Reading the slug parameter (in Next.js 15+, params is a Promise)
  const { slug } = await params;
  
  // Find merchant user by subdomain slug
  const user = await DataStore.findUserBySubdomain(slug);
  if (!user || user.role !== 'MERCHANT') {
    notFound();
  }

  // Get all products and filter for this merchant
  const allProducts = await getProducts();
  const userProducts = allProducts.filter((p) => p.merchantId === user.id);

  // Check if merchant has designed a custom landing page in page builder
  let pageData: any = null;
  try {
    const configObj = JSON.parse(user.landingPageConfig || '{}');
    if (configObj && configObj.pages && Array.isArray(configObj.pages)) {
      pageData = configObj.pages.find(
        (p: any) => p.id === 'page-main' || p.slug === '' || p.slug === 'main'
      );
    }
  } catch (e) {}

  if (pageData && pageData.builderComponents && pageData.builderComponents.length > 0) {
    const rawComps = pageData.builderComponents || [];
    const resolvedComps = rawComps.map((comp: any) => {
      if (comp.type === 'product_showcase') {
        const ids: string[] = comp.content.productIds || [];
        const resolved = userProducts.filter((p) => ids.includes(p.id));
        return { 
          ...comp, 
          content: { 
            ...comp.content, 
            _resolvedProducts: resolved.map(p => ({
              id: p.id,
              title: p.title,
              description: p.description,
              price: p.price,
              category: p.category,
              stock: p.stock,
              imageUrl: p.imageUrl
            })) 
          } 
        };
      }
      return comp;
    });

    return (
      <StorePageViewerClient
        pageName={pageData.name || 'Halaman Utama'}
        components={resolvedComps}
        user={{
          id: user.id,
          name: user.name,
          role: user.role,
        }}
      />
    );
  }

  // Default storefront template if page builder hasn't been configured
  const template = user.landingPageTemplate || 'modern-gold';
  const config = user.landingPageConfig || JSON.stringify({
    title: user.name,
    bio: `Selamat datang di toko resmi kami. Kami adalah pelaku usaha terdaftar di ekosistem premium Saloka.id.`,
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
        landingPageSetup: true,
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
