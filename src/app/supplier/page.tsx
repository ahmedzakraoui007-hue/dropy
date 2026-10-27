"use client";

import { useTranslation } from "@/context/LanguageContext";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import SupplierLanding from "@/components/landing/SupplierLanding";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";

export default function SupplierLandingPage() {
  const { t: tt } = useTranslation();
  const tr = (key: string) => tt(`supplier_app.landing.${key}`);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function getUser() {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    }
    getUser();
  }, []);

  return (
    <div className="relative">
      {user && (
        <div className="fixed bottom-8 right-8 z-50">
          <Link href="/supplier/dashboard">
            <Button size="lg" className="shadow-2xl gap-2 bg-cyan-600 hover:bg-cyan-700">
              <LayoutDashboard className="w-5 h-5" />
              {tr("acceder_au_dashboard")}
            </Button>
          </Link>
        </div>
      )}
      <SupplierLanding />
    </div>
  );
}
