import type { Metadata } from "next";
import PrixVenteCalculator from "@/components/tools/PrixVenteCalculator";
import { toolFaqJsonLd } from "@/lib/tools-seo";

export const metadata: Metadata = {
  title: { absolute: "Calcul prix de vente avec taux de marge (HT et TTC) | Dropy" },
  description: "Calculez votre prix de vente à partir du prix d'achat, avec un taux de marge ou un taux de marque, et la TVA tunisienne. Gratuit, sans inscription.",
  alternates: { canonical: "/outils/calcul-prix-de-vente" },
  openGraph: { title: "Calcul prix de vente avec taux de marge (HT et TTC) | Dropy", description: "Calculez votre prix de vente à partir du prix d'achat, avec un taux de marge ou un taux de marque, et la TVA tunisienne. Gratuit, sans inscription.", url: "/outils/calcul-prix-de-vente" },
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toolFaqJsonLd("calcul-prix-de-vente") }} />
      <PrixVenteCalculator />
    </>
  );
}
