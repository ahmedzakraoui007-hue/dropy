import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Mentions légales | Dropy" },
  description: "Mentions légales de la plateforme Dropy.",
  alternates: { canonical: "/mentions-legales" },
  openGraph: { title: "Mentions légales | Dropy", description: "Mentions légales de la plateforme Dropy.", url: "/mentions-legales" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
