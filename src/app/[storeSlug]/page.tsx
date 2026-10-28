import StorePreview from "@/app/preview/[slug]/page";
import { notFound } from "next/navigation";
import { storeMetadata, storeSlugExists } from "@/lib/store-metadata";

export async function generateMetadata({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  return storeMetadata(storeSlug, []);
}

export default async function StorePage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  if (!(await storeSlugExists(storeSlug))) notFound();
  return <StorePreview params={Promise.resolve({ slug: storeSlug })} />;
}
