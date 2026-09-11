import type { Metadata } from "next";
import ForgotPasswordPage from "./ForgotPasswordClient";

export const metadata: Metadata = {
  title: "Mot de passe oublié | DROPY",
  description: "Réinitialisez votre mot de passe Dropy pour retrouver l'accès à votre compte.",
};

export default function Page() {
  return <ForgotPasswordPage />;
}
