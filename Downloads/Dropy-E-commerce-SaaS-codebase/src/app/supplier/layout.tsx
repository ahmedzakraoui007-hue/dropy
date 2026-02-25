import type { Metadata } from "next";
import SupplierLayout from "./SupplierLayoutClient";

export const metadata: Metadata = {
  title: "Tableau de bord Fournisseur | DROPY",
  description: "Gérez vos stocks, vos commandes et vos expéditions sur Dropy.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <SupplierLayout>{children}</SupplierLayout>;
}
