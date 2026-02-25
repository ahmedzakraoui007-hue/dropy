import type { Metadata } from "next";
import ResetPasswordClient from "./ResetPasswordClient";

export const metadata: Metadata = {
  title: "Réinitialiser le mot de passe | DROPY",
  description: "Choisissez un nouveau mot de passe pour votre compte Dropy.",
};

export default function Page() {
  return <ResetPasswordClient />;
}
