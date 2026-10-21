import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Demande en cours d'examen | Dropy" },
  description: "Votre compte Dropy est en cours de vérification.",
  alternates: { canonical: "/demande-en-attente" },
  openGraph: { title: "Demande en cours d'examen | Dropy", description: "Votre compte Dropy est en cours de vérification.", url: "/demande-en-attente" },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
