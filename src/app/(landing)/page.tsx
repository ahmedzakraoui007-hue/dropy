import LandingClient from "@/components/landing/LandingClient";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/store-url";
import { CONTACT_EMAIL, WHATSAPP_NUMBER } from "@/lib/contact";

export const metadata: Metadata = {
  title: { absolute: "Dropy | Boutique en ligne sans stock en Tunisie" },
  description: "Créez votre boutique en ligne gratuitement, vendez les produits de fournisseurs tunisiens avec paiement à la livraison et travaillez avec des créateurs UGC.",
  alternates: { canonical: "/" },
  openGraph: { title: "Dropy | Boutique en ligne sans stock en Tunisie", description: "Créez votre boutique en ligne gratuitement, vendez les produits de fournisseurs tunisiens avec paiement à la livraison et travaillez avec des créateurs UGC.", url: "/" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Dropy",
      url: SITE_URL,
      logo: `${SITE_URL}/android-chrome-512x512.png`,
      email: CONTACT_EMAIL,
      areaServed: "TN",
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: CONTACT_EMAIL,
        telephone: `+${WHATSAPP_NUMBER}`,
        availableLanguage: ["French", "Arabic"],
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Dropy",
      inLanguage: ["fr-TN", "ar-TN"],
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};

export default function LandingHomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LandingClient />
    </>
  );
}
