import StorePreview from "@/app/preview/[slug]/page";
import { storeMetadata } from "@/lib/store-metadata";

export async function generateMetadata({ params }: { params: Promise<{ storeSlug: string; slug: string[] }> }) {
  const { storeSlug, slug } = await params;
  return storeMetadata(storeSlug, slug?.[0]);
}

export default async function StoreSubPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  return <StorePreview params={Promise.resolve({ slug: storeSlug })} />;
}
