import type { Metadata } from "next";
import MargeEcommerceCalculator from "@/components/tools/MargeEcommerceCalculator";
import { toolFaqJsonLd } from "@/lib/tools-seo";

export const metadata: Metadata = {
  title: { absolute: "Calcul marge e-commerce : bénéfice réel par commande | Dropy" },
  description: "Calculez le bénéfice réel de votre boutique en ligne avec paiement à la livraison : confirmations, retours, livraison et coût de la publicité. Gratuit.",
  alternates: { canonical: "/outils/calcul-marge-ecommerce" },
  openGraph: { title: "Calcul marge e-commerce : bénéfice réel par commande | Dropy", description: "Calculez le bénéfice réel de votre boutique en ligne avec paiement à la livraison : confirmations, retours, livraison et coût de la publicité. Gratuit.", url: "/outils/calcul-marge-ecommerce" },
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toolFaqJsonLd("calcul-marge-ecommerce") }} />
      <MargeEcommerceCalculator />
    </>
  );
}
