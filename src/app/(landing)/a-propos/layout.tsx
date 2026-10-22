import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "À propos de Dropy | L'e-commerce tunisien sans stock" },
  description: "Dropy connecte vendeurs, fournisseurs et créateurs tunisiens pour lancer une boutique en ligne sans stock, avec paiement à la livraison.",
  alternates: { canonical: "/a-propos" },
  openGraph: { title: "À propos de Dropy | L'e-commerce tunisien sans stock", description: "Dropy connecte vendeurs, fournisseurs et créateurs tunisiens pour lancer une boutique en ligne sans stock, avec paiement à la livraison.", url: "/a-propos" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
