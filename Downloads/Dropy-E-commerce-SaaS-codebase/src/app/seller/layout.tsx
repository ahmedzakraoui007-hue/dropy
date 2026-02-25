import type { Metadata } from "next";
import SellerLayout from "./SellerLayoutClient";

export const metadata: Metadata = {
  title: "Tableau de bord Vendeur | DROPY",
  description: "Gérez votre boutique, vos produits et vos commandes sur Dropy.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <SellerLayout>{children}</SellerLayout>;
}
