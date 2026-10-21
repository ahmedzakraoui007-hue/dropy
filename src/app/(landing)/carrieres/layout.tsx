import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Carrières chez Dropy | Rejoignez l'équipe" },
  description: "Rejoignez l'équipe Dropy et construisez l'e-commerce tunisien de demain.",
  alternates: { canonical: "/carrieres" },
  openGraph: { title: "Carrières chez Dropy | Rejoignez l'équipe", description: "Rejoignez l'équipe Dropy et construisez l'e-commerce tunisien de demain.", url: "/carrieres" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
