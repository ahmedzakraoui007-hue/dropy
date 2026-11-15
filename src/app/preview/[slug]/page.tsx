import StoreView from "@/components/storefront/StoreView";

export default function StorePreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  return <StoreView params={params} />;
}
