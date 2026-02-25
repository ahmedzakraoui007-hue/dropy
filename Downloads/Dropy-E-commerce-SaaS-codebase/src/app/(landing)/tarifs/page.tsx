import type { Metadata } from "next";
import TarifsPage from "./TarifsClient";

export const metadata: Metadata = {
  title: "Tarifs & Plans Dropy | Commencez l'E-commerce Gratuitement en Tunisie",
  description: "Découvrez les tarifs de Dropy. Plan Starter gratuit pour débuter, plan Pro pour passer à l'échelle, et solutions Enterprise. Pas de frais cachés.",
  alternates: {
    canonical: "https://dropy.store/tarifs",
  },
  openGraph: {
    title: "Tarifs Dropy - Des Plans Adaptés à Votre Croissance",
    description: "Lancez votre boutique gratuitement et évoluez avec nos plans Pro et Enterprise.",
    url: "https://dropy.store/tarifs",
    images: [{ url: "https://dropy.store/og-image-tarifs.jpg" }],
  },
};

export default function Page() {
  return <TarifsPage />;
}
