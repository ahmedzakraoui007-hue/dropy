import CreateursClient from "@/components/landing/CreateursClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Devenir Créateur UGC Tunisie | Gagnez de l'Argent avec Votre Contenu - Dropy",
  description: "Monétisez votre créativité sur Dropy. Recevez des produits textiles gratuits, créez du contenu UGC et touchez des commissions sur les ventes. Le futur de l'influence en Tunisie.",
  alternates: {
    canonical: "/createurs",
  },
  openGraph: {
    title: "Créateurs UGC Tunisie - Rejoignez la Communauté Dropy",
    description: "Transformez vos vidéos en revenus. Collaborez avec les meilleures marques locales.",
    url: "https://dropy.store/createurs",
    images: [{ url: "https://dropy.store/og-image-creators.jpg" }],
  },
};

export default function CreateursPage() {
  return <CreateursClient />;
}
