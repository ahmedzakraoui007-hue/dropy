import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Conditions d'utilisation | Dropy" },
  description: "Conditions générales d'utilisation de la plateforme Dropy.",
  alternates: { canonical: "/conditions-utilisation" },
  openGraph: { title: "Conditions d'utilisation | Dropy", description: "Conditions générales d'utilisation de la plateforme Dropy.", url: "/conditions-utilisation" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
