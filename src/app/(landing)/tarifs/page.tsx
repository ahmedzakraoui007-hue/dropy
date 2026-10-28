import type { Metadata } from "next";
import TarifsPage from "./TarifsClient";

export const metadata: Metadata = {
  title: { absolute: "Tarifs Dropy | Gratuit pendant le lancement" },
  description: "Dropy est gratuit pendant le lancement : boutique, catalogue fournisseurs, commandes et missions UGC, sans abonnement ni commission. Vous serez prévenu avant tout changement.",
  alternates: { canonical: "/tarifs" },
  openGraph: { title: "Tarifs Dropy | Gratuit pendant le lancement", description: "Dropy est gratuit pendant le lancement : boutique, catalogue fournisseurs, commandes et missions UGC, sans abonnement ni commission. Vous serez prévenu avant tout changement.", url: "/tarifs" },
};

export default function Page() {
  return <TarifsPage />;
}
