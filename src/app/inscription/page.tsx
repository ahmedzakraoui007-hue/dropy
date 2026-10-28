import type { Metadata } from "next";
import RegisterPage from "./RegisterClient";

export const metadata: Metadata = {
  title: { absolute: "Inscription gratuite | Dropy" },
  description: "Créez votre compte Dropy gratuitement, comme vendeur, fournisseur ou créateur UGC, et lancez votre activité en quelques minutes.",
};

export default function Page() {
  return <RegisterPage />;
}
