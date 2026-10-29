import VendeursClient from "@/components/landing/VendeursClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Boutique en ligne pour entreprises tunisiennes | Dropy" },
  description: "Votre site e-commerce créé gratuitement par l'équipe Dropy : vos produits, votre logo, paiement à la livraison et suivi des commandes au même endroit.",
  alternates: { canonical: "/vendeurs" },
  openGraph: { title: "Boutique en ligne pour entreprises tunisiennes | Dropy", description: "Votre site e-commerce créé gratuitement par l'équipe Dropy : vos produits, votre logo, paiement à la livraison et suivi des commandes au même endroit.", url: "/vendeurs" },
};

export default function VendeursPage() {
  return <VendeursClient />;
}
