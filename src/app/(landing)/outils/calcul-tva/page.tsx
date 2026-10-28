import type { Metadata } from "next";
import TvaCalculator from "@/components/tools/TvaCalculator";
import { toolFaqJsonLd } from "@/lib/tools-seo";

export const metadata: Metadata = {
  title: { absolute: "Calcul TVA Tunisie 19 %, 13 %, 7 % (HT et TTC) | Dropy" },
  description: "Calculez la TVA en Tunisie en un clic : passez du HT au TTC ou du TTC au HT avec les taux de 19 %, 13 % et 7 %, FODEC en option. Gratuit, sans inscription.",
  alternates: { canonical: "/outils/calcul-tva" },
  openGraph: { title: "Calcul TVA Tunisie 19 %, 13 %, 7 % (HT et TTC) | Dropy", description: "Calculez la TVA en Tunisie en un clic : passez du HT au TTC ou du TTC au HT avec les taux de 19 %, 13 % et 7 %, FODEC en option. Gratuit, sans inscription.", url: "/outils/calcul-tva" },
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toolFaqJsonLd("calcul-tva") }} />
      <TvaCalculator />
    </>
  );
}
