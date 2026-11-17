import ApplicationClient from "@/components/landing/ApplicationClient";
import type { Metadata } from "next";

const title = "Application Dropy Vendeur pour Android | Dropy";
const description = "Téléchargez l'application Dropy Vendeur : notification à chaque nouvelle commande, confirmation en un geste, appel et WhatsApp du client, prix et stock de vos produits.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/application" },
  openGraph: { title, description, url: "/application" },
};

export default function ApplicationPage() {
  return <ApplicationClient />;
}
