import type { Metadata } from "next";
import RegisterPage from "./RegisterClient";

export const metadata: Metadata = {
  title: "Inscription | DROPY - Rejoignez l'e-commerce en Tunisie",
  description: "Créez votre compte Dropy gratuitement. Que vous soyez vendeur, fournisseur ou créateur UGC, lancez votre activité en quelques minutes.",
};

export default function Page() {
  return <RegisterPage />;
}
