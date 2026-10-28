import type { Metadata } from "next";
import QrCodeGenerator from "@/components/tools/QrCodeGenerator";
import { toolFaqJsonLd } from "@/lib/tools-seo";

export const metadata: Metadata = {
  title: { absolute: "Générateur de QR code gratuit | Dropy" },
  description: "Créez un QR code gratuit pour votre boutique en ligne, votre page ou votre menu, choisissez sa couleur et téléchargez-le en image. Sans inscription.",
  alternates: { canonical: "/outils/generateur-qr-code" },
  openGraph: { title: "Générateur de QR code gratuit | Dropy", description: "Créez un QR code gratuit pour votre boutique en ligne, votre page ou votre menu, choisissez sa couleur et téléchargez-le en image. Sans inscription.", url: "/outils/generateur-qr-code" },
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toolFaqJsonLd("generateur-qr-code") }} />
      <QrCodeGenerator />
    </>
  );
}
