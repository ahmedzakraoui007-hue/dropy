import StorePreview from "@/app/preview/[slug]/page";

export default async function StorePagePreview({ params }: { params: Promise<{ slug: string; path: string[] }> }) {
  const { slug } = await params;
  return <StorePreview params={Promise.resolve({ slug })} />;
}
