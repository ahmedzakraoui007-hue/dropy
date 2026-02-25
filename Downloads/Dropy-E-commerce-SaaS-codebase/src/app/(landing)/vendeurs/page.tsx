import VendeursClient from "@/components/landing/VendeursClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Devenir Vendeur Dropshipping Tunisie | Dropy - Sans Stock, Sans Risque",
  description: "Lancez votre boutique e-commerce en Tunisie sans investissement initial. Catalogue textile local, paiement à la livraison, support WhatsApp. Commencez gratuitement.",
  alternates: {
    canonical: "/vendeurs",
  },
  openGraph: {
    title: "Devenez Vendeur sur Dropy - E-commerce Sans Stock",
    description: "Accédez à un catalogue textile Made in Tunisia et vendez sans gérer de stock. Formation et accompagnement inclus.",
    url: "https://dropy.store/vendeurs",
    images: [{ url: "https://dropy.store/og-image-vendeurs.jpg" }],
  },
};

export default function VendeursPage() {
  return <VendeursClient />;
}
