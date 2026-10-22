import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Politique de confidentialité | Dropy" },
  description: "Comment Dropy collecte, utilise et protège vos données personnelles, conformément à la loi tunisienne.",
  alternates: { canonical: "/politique-confidentialite" },
  openGraph: { title: "Politique de confidentialité | Dropy", description: "Comment Dropy collecte, utilise et protège vos données personnelles, conformément à la loi tunisienne.", url: "/politique-confidentialite" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
