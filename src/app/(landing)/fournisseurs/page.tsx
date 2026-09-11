import FournisseursClient from "@/components/landing/FournisseursClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Devenir Fournisseur Dropy | Vendez Votre Textile en Ligne - Tunisie",
  description: "Rejoignez le réseau Dropy et vendez vos produits textiles à des centaines de vendeurs. Plateforme B2B textile tunisienne. Monastir, Ksar Hellal, Sfax.",
  alternates: {
    canonical: "/fournisseurs",
  },
  openGraph: {
    title: "Fournisseurs Textile - Rejoignez le Réseau Dropy",
    description: "Connectez votre production textile aux vendeurs e-commerce tunisiens. Gestion des commandes simplifiée.",
    url: "https://dropy.store/fournisseurs",
    images: [{ url: "https://dropy.store/og-image-fournisseurs.jpg" }],
  },
};

export default function FournisseursPage() {
  return <FournisseursClient />;
}
