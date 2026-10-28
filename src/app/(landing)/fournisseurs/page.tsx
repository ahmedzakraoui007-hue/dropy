import FournisseursClient from "@/components/landing/FournisseursClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Devenir fournisseur textile en Tunisie | Dropy" },
  description: "Proposez vos vêtements et articles textiles aux vendeurs e-commerce tunisiens. Ils font la publicité, vous préparez les commandes depuis votre tableau de bord.",
  alternates: { canonical: "/fournisseurs" },
  openGraph: { title: "Devenir fournisseur textile en Tunisie | Dropy", description: "Proposez vos vêtements et articles textiles aux vendeurs e-commerce tunisiens. Ils font la publicité, vous préparez les commandes depuis votre tableau de bord.", url: "/fournisseurs" },
};

export default function FournisseursPage() {
  return <FournisseursClient />;
}
