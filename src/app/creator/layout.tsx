import type { Metadata } from "next";
import CreatorLayout from "./CreatorLayoutClient";

export const metadata: Metadata = {
  title: "Tableau de bord Créateur | DROPY",
  description: "Gérez vos missions UGC, votre portfolio et vos paiements sur Dropy.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <CreatorLayout>{children}</CreatorLayout>;
}
