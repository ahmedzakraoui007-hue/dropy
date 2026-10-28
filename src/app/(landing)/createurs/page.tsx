import CreateursClient from "@/components/landing/CreateursClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Devenir créateur UGC en Tunisie | Dropy" },
  description: "Réalisez des vidéos et photos UGC pour des marques tunisiennes, fixez votre prix et soyez payé pour chaque mission validée, avec paiement sous séquestre.",
  alternates: { canonical: "/createurs" },
  openGraph: { title: "Devenir créateur UGC en Tunisie | Dropy", description: "Réalisez des vidéos et photos UGC pour des marques tunisiennes, fixez votre prix et soyez payé pour chaque mission validée, avec paiement sous séquestre.", url: "/createurs" },
};

export default function CreateursPage() {
  return <CreateursClient />;
}
