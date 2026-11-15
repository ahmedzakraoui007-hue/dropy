import ComparePage from "@/components/landing/ComparePage";
import { compareJsonLd, compareMetadata } from "@/lib/compare-page";

export const metadata = compareMetadata("shopify");

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: compareJsonLd("shopify") }} />
      <ComparePage competitor="shopify" />
    </>
  );
}
