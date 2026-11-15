import StorePreview from "@/components/storefront/StoreView";
import { headers } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import { isUuid, productPath, storeBasePath } from "@/lib/store-url";
import { storeMetadata, storeSlugExists } from "@/lib/store-metadata";
import { loadStorefront } from "@/lib/storefront-data";
import { ProductJsonLd } from "@/components/storefront/StoreJsonLd";

export async function generateMetadata({ params }: { params: Promise<{ storeSlug: string; slug: string[] }> }) {
  const { storeSlug, slug } = await params;
  return storeMetadata(storeSlug, slug || []);
}

export default async function StoreSubPage({ params }: { params: Promise<{ storeSlug: string; slug: string[] }> }) {
  const { storeSlug, slug } = await params;
  const productId = slug?.[0] === "p" ? slug[1] : null;
  const initial = await loadStorefront(storeSlug, productId);
  if (!initial && !(await storeSlugExists(storeSlug))) notFound();
  const product = initial?.product;
  if (productId && product?.slug && isUuid(product.requestedKey) && product.slug !== product.requestedKey) {
    const host = (await headers()).get("host");
    const hostname = String(host || "").split(":")[0].toLowerCase();
    permanentRedirect(`${storeBasePath(storeSlug, "", hostname)}${productPath({ id: product.id, slug: product.slug })}`);
  }
  return (
    <>
      {productId && <ProductJsonLd storeSlug={storeSlug} productId={productId} />}
      <StorePreview params={Promise.resolve({ slug: storeSlug })} initial={initial} initialPath={slug || []} />
    </>
  );
}
