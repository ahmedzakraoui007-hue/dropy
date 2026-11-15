import StorePreview from "@/components/storefront/StoreView";
import { notFound } from "next/navigation";
import { storeMetadata, storeSlugExists } from "@/lib/store-metadata";
import { loadStorefront } from "@/lib/storefront-data";
import { ProductJsonLd } from "@/components/storefront/StoreJsonLd";

export async function generateMetadata({ params }: { params: Promise<{ storeSlug: string; slug: string[] }> }) {
  const { storeSlug, slug } = await params;
  return storeMetadata(storeSlug, slug || []);
}

export default async function StoreSubPage({ params }: { params: Promise<{ storeSlug: string; slug: string[] }> }) {
  const { storeSlug, slug } = await params;
  const initial = await loadStorefront(storeSlug);
  if (!initial && !(await storeSlugExists(storeSlug))) notFound();
  const productId = slug?.[0] === "p" ? slug[1] : null;
  return (
    <>
      {productId && <ProductJsonLd storeSlug={storeSlug} productId={productId} />}
      <StorePreview params={Promise.resolve({ slug: storeSlug })} initial={initial} initialPath={slug || []} />
    </>
  );
}
