import type { Metadata } from "next";
import LoginPage from "./LoginClient";

export const metadata: Metadata = {
  title: { absolute: "Connexion | Dropy" },
  description: "Connectez-vous à votre compte Dropy pour gérer votre boutique, vos produits ou vos missions UGC.",
};

export default function Page() {
  return <LoginPage />;
}
