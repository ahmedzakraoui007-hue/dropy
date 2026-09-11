import type { Metadata } from "next";
import LoginPage from "./LoginClient";

export const metadata: Metadata = {
  title: "Connexion | DROPY - Accédez à votre tableau de bord",
  description: "Connectez-vous à votre compte Dropy pour gérer votre boutique, vos produits ou vos missions UGC.",
};

export default function Page() {
  return <LoginPage />;
}
