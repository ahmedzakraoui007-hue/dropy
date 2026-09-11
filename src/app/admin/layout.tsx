import type { Metadata } from "next";
import AdminLayout from "./AdminLayoutClient";

export const metadata: Metadata = {
  title: "Administration | DROPY",
  description: "Tableau de bord administrateur Dropy.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
