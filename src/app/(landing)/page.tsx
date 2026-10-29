import LandingClient from "@/components/landing/LandingClient";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/store-url";
import { CONTACT_EMAIL, WHATSAPP_NUMBER } from "@/lib/contact";

export const metadata: Metadata = {
  title: { absolute: "Dropy | Votre boutique en ligne gratuite en Tunisie" },
  description: "L'équipe Dropy crée gratuitement la boutique en ligne de votre entreprise : vos produits, paiement à la livraison, en français et en arabe.",
  alternates: { canonical: "/" },
  openGraph: { title: "Dropy | Votre boutique en ligne gratuite en Tunisie", description: "L'équipe Dropy crée gratuitement la boutique en ligne de votre entreprise : vos produits, paiement à la livraison, en français et en arabe.", url: "/" },
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
