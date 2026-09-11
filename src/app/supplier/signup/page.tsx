import RoleSignup from "@/components/auth/RoleSignup";
import { Building2 } from "lucide-react";

export default function SupplierSignupPage() {
  return (
    <RoleSignup 
      role="supplier"
      title="Devenez fournisseur Dropy"
      subtitle="Accédez à un vaste réseau de revendeurs et augmentez votre volume de ventes."
      accentColor="from-cyan-500 to-teal-600"
    />
  );
}
