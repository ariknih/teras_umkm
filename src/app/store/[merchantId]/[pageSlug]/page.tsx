import { getUserProfileById } from "@/app/actions/auth";
import { getProducts } from "@/app/actions/products";
import { notFound } from "next/navigation";
import StorePageViewerClient from "./StorePageViewerClient";
import { Metadata } from "next";

interface PageProps {
  params: Promise<{ merchantId: string; pageSlug: string }>;
}

export async function generateMetadata(
  { params }: PageProps
): Promise<Metadata> {
  const { merchantId, pageSlug } = await params;
  const user = await getUserProfileById(merchantId);
  
  if (!user || user.role !== 'MERCHANT') {
    return { title: "Halaman Tidak Ditemukan" };
  }

  try {
    const config = JSON.parse(user.landingPageConfig || '{}');
    const pg = (config.pages || []).find(
      (p: any) => 
        (p.slug && p.slug.toLowerCase() === pageSlug.toLowerCase()) ||
        (pageSlug.toLowerCase() === 'main' && (p.id === 'page-main' || p.slug === ''))
    );
    if (pg) {
      return {
        title: `${pg.name} - ${user.name}`,
        description: `Halaman khusus ${pg.name} dari toko resmi ${user.name} di Saloka.id.`,
      };
    }
  } catch (e) {}

  return { title: `${user.name} - Halaman Khusus` };
}

export default async function StoreSubPage({ params }: PageProps) {
  const { merchantId, pageSlug } = await params;
  const user = await getUserProfileById(merchantId);
  
  if (!user || user.role !== 'MERCHANT') {
    notFound();
  }

  let pageData: any = null;
  try {
    const config = JSON.parse(user.landingPageConfig || '{}');
    pageData = (config.pages || []).find(
      (p: any) => 
        (p.slug && p.slug.toLowerCase() === pageSlug.toLowerCase()) ||
        (pageSlug.toLowerCase() === 'main' && (p.id === 'page-main' || p.slug === ''))
    );
  } catch (e) {}

  if (!pageData) {
    notFound();
  }

  // Get all products and filter for this user
  const allProducts = await getProducts();
  const merchantProducts = allProducts.filter((p) => p.merchantId === user.id);

  // Resolve components
  const rawComps = pageData.builderComponents || [];
  const resolvedComps = rawComps.map((comp: any) => {
    if (comp.type === 'product_showcase') {
      const ids: string[] = comp.content.productIds || [];
      const resolved = merchantProducts.filter((p: any) => ids.includes(p.id));
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
      pageName={pageData.name}
      components={resolvedComps}
      user={{
        id: user.id,
        name: user.name,
        role: user.role,
      }}
    />
  );
}
