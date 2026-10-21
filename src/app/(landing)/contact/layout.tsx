import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Contactez Dropy | Support vendeurs, fournisseurs et créateurs" },
  description: "Une question sur Dropy ? Contactez notre équipe par e-mail ou WhatsApp, 7 jours sur 7.",
  alternates: { canonical: "/contact" },
  openGraph: { title: "Contactez Dropy | Support vendeurs, fournisseurs et créateurs", description: "Une question sur Dropy ? Contactez notre équipe par e-mail ou WhatsApp, 7 jours sur 7.", url: "/contact" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
