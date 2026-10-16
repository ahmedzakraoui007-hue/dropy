import StorePreview from "@/app/preview/[slug]/page";

export default async function StorePagePreview({ params }: { params: Promise<{ slug: string; pageSlug: string }> }) {
  const { slug } = await params;
  return <StorePreview params={Promise.resolve({ slug })} />;
}
