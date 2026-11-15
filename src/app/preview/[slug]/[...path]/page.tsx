import StorePreview from "@/components/storefront/StoreView";

export default async function StorePagePreview({ params }: { params: Promise<{ slug: string; path: string[] }> }) {
  const { slug } = await params;
  return <StorePreview params={Promise.resolve({ slug })} />;
}
