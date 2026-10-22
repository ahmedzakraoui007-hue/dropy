import StorePreview from "@/app/preview/[slug]/page";
import { storeMetadata } from "@/lib/store-metadata";
import { ProductJsonLd } from "@/components/storefront/StoreJsonLd";

export async function generateMetadata({ params }: { params: Promise<{ storeSlug: string; slug: string[] }> }) {
  const { storeSlug, slug } = await params;
  return storeMetadata(storeSlug, slug || []);
}

export default async function StoreSubPage({ params }: { params: Promise<{ storeSlug: string; slug: string[] }> }) {
  const { storeSlug, slug } = await params;
  const productId = slug?.[0] === "p" ? slug[1] : null;
  return (
    <>
      {productId && <ProductJsonLd storeSlug={storeSlug} productId={productId} />}
      <StorePreview params={Promise.resolve({ slug: storeSlug })} />
    </>
  );
}
