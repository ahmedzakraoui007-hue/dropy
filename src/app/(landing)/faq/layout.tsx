import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "FAQ Dropy | Questions fréquentes sur l'e-commerce sans stock" },
  description: "Réponses aux questions sur Dropy : création de boutique, catalogue fournisseurs, livraison, paiement à la livraison et missions UGC.",
  alternates: { canonical: "/faq" },
  openGraph: { title: "FAQ Dropy | Questions fréquentes sur l'e-commerce sans stock", description: "Réponses aux questions sur Dropy : création de boutique, catalogue fournisseurs, livraison, paiement à la livraison et missions UGC.", url: "/faq" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
