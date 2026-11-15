import StorePreview from "@/components/storefront/StoreView";
import { notFound } from "next/navigation";
import { storeMetadata, storeSlugExists } from "@/lib/store-metadata";
import { loadStorefront } from "@/lib/storefront-data";

export async function generateMetadata({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  return storeMetadata(storeSlug, []);
}

export default async function StorePage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  const initial = await loadStorefront(storeSlug);
  if (!initial && !(await storeSlugExists(storeSlug))) notFound();
  return <StorePreview params={Promise.resolve({ slug: storeSlug })} initial={initial} initialPath={[]} />;
}
