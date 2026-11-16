import type { Metadata } from "next";
import fr from "@/locales/fr.json";

const title = "FAQ Dropy | Questions sur votre boutique en ligne en Tunisie";
const description = "Réponses sur Dropy : création de boutique offerte, contrôle total de votre site, prix, paiement à la livraison et protection contre les fausses commandes.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/faq" },
  openGraph: { title, description, url: "/faq" },
};

const faq = fr.pages.faq as Record<string, string>;
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [1, 2, 3, 4, 5, 6].map((n) => ({
    "@type": "Question",
    name: faq[`q${n}`],
    acceptedAnswer: { "@type": "Answer", text: faq[`a${n}`] },
  })),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      {children}
    </>
  );
}
