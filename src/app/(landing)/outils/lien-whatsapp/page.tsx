import type { Metadata } from "next";
import WhatsappLinkGenerator from "@/components/tools/WhatsappLinkGenerator";
import { toolFaqJsonLd } from "@/lib/tools-seo";

export const metadata: Metadata = {
  title: { absolute: "Générateur de lien WhatsApp gratuit + QR code | Dropy" },
  description: "Créez un lien WhatsApp (wa.me) avec un message prérempli et son QR code, pour votre boutique, votre page Facebook ou votre bio Instagram. Gratuit.",
  alternates: { canonical: "/outils/lien-whatsapp" },
  openGraph: { title: "Générateur de lien WhatsApp gratuit + QR code | Dropy", description: "Créez un lien WhatsApp (wa.me) avec un message prérempli et son QR code, pour votre boutique, votre page Facebook ou votre bio Instagram. Gratuit.", url: "/outils/lien-whatsapp" },
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toolFaqJsonLd("lien-whatsapp") }} />
      <WhatsappLinkGenerator />
    </>
  );
}
