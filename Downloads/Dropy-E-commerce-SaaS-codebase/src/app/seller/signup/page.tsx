import RoleSignup from "@/components/auth/RoleSignup";
import { Store } from "lucide-react";

export default function SellerSignupPage() {
  return (
    <RoleSignup 
      role="seller"
      title="Lancez votre business"
      subtitle="Créez votre boutique et commencez à vendre vos produits en quelques minutes."
      accentColor="from-violet-500 to-purple-600"
    />
  );
}
