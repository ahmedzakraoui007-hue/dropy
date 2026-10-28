import VendeursClient from "@/components/landing/VendeursClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Vendre en ligne sans stock en Tunisie | Dropy" },
  description: "Lancez votre boutique sans acheter de stock : choisissez des produits de fournisseurs tunisiens, fixez votre prix et vendez avec paiement à la livraison.",
  alternates: { canonical: "/vendeurs" },
  openGraph: { title: "Vendre en ligne sans stock en Tunisie | Dropy", description: "Lancez votre boutique sans acheter de stock : choisissez des produits de fournisseurs tunisiens, fixez votre prix et vendez avec paiement à la livraison.", url: "/vendeurs" },
};

export default function VendeursPage() {
  return <VendeursClient />;
}
