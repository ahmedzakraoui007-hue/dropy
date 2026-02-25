"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import CreatorLanding from "@/components/landing/CreatorLanding";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";

export default function CreatorLandingPage() {
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
          <Link href="/creator/dashboard">
            <Button size="lg" className="shadow-2xl gap-2 bg-emerald-600 hover:bg-emerald-700">
              <LayoutDashboard className="w-5 h-5" />
              Accéder au Dashboard
            </Button>
          </Link>
        </div>
      )}
      <CreatorLanding />
    </div>
  );
}
