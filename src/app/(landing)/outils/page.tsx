import type { Metadata } from "next";
import ToolsIndex from "@/components/tools/ToolsIndex";

export const metadata: Metadata = {
  title: { absolute: "Outils gratuits pour vendre en ligne en Tunisie | Dropy" },
  description: "Calcul TVA Tunisie, calcul prix de vente et marge, générateur de facture et devis, lien WhatsApp, QR code : des outils gratuits pour les commerçants tunisiens.",
  alternates: { canonical: "/outils" },
  openGraph: { title: "Outils gratuits pour vendre en ligne en Tunisie | Dropy", description: "Calculatrices et générateurs gratuits pour les commerçants tunisiens.", url: "/outils" },
};

export default function ToolsPage() {
  return <ToolsIndex />;
}
