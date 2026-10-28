import type { Metadata } from "next";
import InvoiceGenerator from "@/components/tools/InvoiceGenerator";
import { toolFaqJsonLd } from "@/lib/tools-seo";

export const metadata: Metadata = {
  title: { absolute: "Générateur de facture et devis gratuit (Tunisie) | Dropy" },
  description: "Créez une facture ou un devis gratuit avec matricule fiscal, TVA tunisienne et timbre fiscal, puis enregistrez-le en PDF. Sans inscription.",
  alternates: { canonical: "/outils/generateur-facture" },
  openGraph: { title: "Générateur de facture et devis gratuit (Tunisie) | Dropy", description: "Créez une facture ou un devis gratuit avec matricule fiscal, TVA tunisienne et timbre fiscal, puis enregistrez-le en PDF. Sans inscription.", url: "/outils/generateur-facture" },
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toolFaqJsonLd("generateur-facture") }} />
      <InvoiceGenerator />
    </>
  );
}
