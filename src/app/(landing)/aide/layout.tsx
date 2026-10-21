import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Centre d'aide Dropy | Guides et réponses" },
  description: "Guides pas à pas pour créer votre boutique, importer des produits, gérer vos commandes et la livraison avec Dropy.",
  alternates: { canonical: "/aide" },
  openGraph: { title: "Centre d'aide Dropy | Guides et réponses", description: "Guides pas à pas pour créer votre boutique, importer des produits, gérer vos commandes et la livraison avec Dropy.", url: "/aide" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
