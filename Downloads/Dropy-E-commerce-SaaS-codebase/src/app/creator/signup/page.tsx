import RoleSignup from "@/components/auth/RoleSignup";
import { Camera } from "lucide-react";

export default function CreatorSignupPage() {
  return (
    <RoleSignup 
      role="creator"
      title="Rejoignez les meilleurs créateurs"
      subtitle="Monétisez votre créativité en collaborant avec des marques tunisiennes."
      accentColor="from-emerald-500 to-green-600"
    />
  );
}
