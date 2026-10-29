import type { Metadata } from "next";
import FreeSiteOffer from "@/components/landing/FreeSiteOffer";
import fr from "@/locales/fr.json";

export const metadata: Metadata = {
  title: { absolute: "Création site e-commerce gratuite en Tunisie | Dropy" },
  description: "Entreprises et commerçants tunisiens : l'équipe Dropy crée gratuitement votre boutique en ligne avec vos produits, en français et en arabe, avec paiement à la livraison.",
  alternates: { canonical: "/creation-site-ecommerce-tunisie" },
  openGraph: {
    title: "Création site e-commerce gratuite en Tunisie | Dropy",
    description: "On crée votre boutique en ligne gratuitement, avec vos produits et le paiement à la livraison.",
    url: "/creation-site-ecommerce-tunisie",
  },
};

const texts = (fr as unknown as { pages: { free_site: Record<string, string> } }).pages.free_site;
const faqJsonLd = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [1, 2, 3, 4].map((n) => ({
    "@type": "Question",
    name: texts[`faq${n}_q`],
    acceptedAnswer: { "@type": "Answer", text: texts[`faq${n}_a`] },
  })),
});

export default function FreeSitePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqJsonLd }} />
      <FreeSiteOffer />
    </>
  );
}
