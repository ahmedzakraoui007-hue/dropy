import StorePreview from "@/app/preview/[slug]/page";

export default async function StorePage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  return <StorePreview params={Promise.resolve({ slug: storeSlug })} />;
}
