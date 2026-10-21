import StorePreview from "@/app/preview/[slug]/page";
import { storeMetadata } from "@/lib/store-metadata";

export async function generateMetadata({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  return storeMetadata(storeSlug, []);
}

export default async function StorePage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  return <StorePreview params={Promise.resolve({ slug: storeSlug })} />;
}
