import ComparePage from "@/components/landing/ComparePage";
import { compareJsonLd, compareMetadata } from "@/lib/compare-page";

export const metadata = compareMetadata("converty");

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: compareJsonLd("converty") }} />
      <ComparePage competitor="converty" />
    </>
  );
}
