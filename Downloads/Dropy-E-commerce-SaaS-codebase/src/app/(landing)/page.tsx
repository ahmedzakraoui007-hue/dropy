import LandingClient from "@/components/landing/LandingClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DROPY | Plateforme E-commerce #1 en Tunisie - Sans Stock",
  description: "Lancez votre boutique en ligne sans stock en Tunisie. Dropy connecte vendeurs, fournisseurs locaux et créateurs UGC. La solution tout-en-un pour réussir.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "DROPY | L'E-commerce sans les contraintes en Tunisie",
    description: "Vendez sans stock, livrez sans stress. La plateforme qui révolutionne le commerce en ligne local.",
    url: "https://dropy.store",
  }
};

export default function LandingHomePage() {
  return <LandingClient />;
}
