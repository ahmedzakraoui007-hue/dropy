// src/app/seller/store-builder/page.tsx
"use client";

import { useEffect, useState } from "react";
import { 
  Palette, 
  FileText, 
  Navigation, 
  Settings, 
  Eye, 
  CheckCircle2, 
  Circle,
  ArrowRight,
  Zap,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useStoreBuilderChecklist } from "@/hooks/useStoreBuilderChecklist";
import { SetupChecklist } from "@/components/store-builder/SetupChecklist";

export default function StoreBuilderDashboard() {
  const [loading, setLoading] = useState(true);
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        let { data: profile } = await supabase
          .from("seller_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();
        
        if (!profile) {
          // Create profile if missing
          const { data: newProfile } = await supabase
            .from("seller_profiles")
            .insert({ user_id: user.id, store_name: "Ma Boutique" })
            .select()
            .single();
          profile = newProfile;
        }
        setSellerProfile(profile);
      }
      setLoading(false);
    }
    loadProfile();
  }, [supabase]);

  const { checklist, loading: checklistLoading } = useStoreBuilderChecklist(sellerProfile?.id);

  if (loading || checklistLoading) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">STORE BUILDER</h1>
          <p className="text-gray-500 font-medium">Configurez et personnalisez votre boutique en ligne</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild className="rounded-xl border-gray-200">
            <Link href={`/shop/${sellerProfile?.store_slug || ''}`} target="_blank">
              <Eye className="w-4 h-4 mr-2" />
              Aperçu
            </Link>
          </Button>
          <Button className="rounded-xl bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-100">
            <Zap className="w-4 h-4 mr-2" />
            Publier
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card className="border-none shadow-xl shadow-purple-900/5 bg-white rounded-3xl overflow-hidden">
            <CardContent className="p-6">
              {checklist && <SetupChecklist checklist={checklist} />}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ActionCard 
                title="Galerie des Thèmes"
                description="Changez l'apparence complète de votre boutique en 1 clic."
                icon={Sparkles}
                href="/seller/store-builder/themes"
                buttonText="Voir les thèmes"
                status={checklist?.design.completed ? "Thème actif" : "À choisir"}
                color="orange"
              />
              <ActionCard 
                title="Branding & Styles"
                description="Couleurs, polices et logos personnalisés."
                icon={Palette}
                href="/seller/store-builder/customize"
                buttonText="Personnaliser"
                status={checklist?.design.completed ? "Configuré" : "À faire"}
                color="blue"
              />
              <ActionCard 
                title="Pages & Contenu"
                description="Modifiez vos pages via l'éditeur visuel."
                icon={FileText}
                href="/seller/store-builder/pages"
                buttonText="Gérer les pages"
                status={`${checklist?.pages.count || 0} pages`}
                color="purple"
              />
              <ActionCard 
                title="Domaine & SEO"
                description="Connectez votre domaine et boostez votre SEO."
                icon={Settings}
                href="/seller/store-builder/settings"
                buttonText="Paramètres"
                status={checklist?.domain.completed ? "Vérifié" : "À faire"}
                color="emerald"
              />
            </div>
        </div>
      </div>
    </div>
  );
}


function ActionCard({ title, description, icon: Icon, href, buttonText, status, color }: any) {
  const colorClasses: any = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    gray: "bg-gray-50 text-gray-600 border-gray-100",
  };

  return (
    <Card className="border-none shadow-xl shadow-gray-200/50 bg-white rounded-3xl overflow-hidden group hover:shadow-2xl transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border", colorClasses[color])}>
            <Icon className="w-6 h-6" />
          </div>
          <span className={cn("text-[10px] font-bold px-2 py-1 rounded-full border uppercase tracking-wider", colorClasses[color])}>
            {status}
          </span>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">{description}</p>
        <Button asChild variant="outline" className="w-full rounded-xl border-gray-100 hover:bg-gray-50 group-hover:border-gray-200 transition-colors font-bold h-11">
          <Link href={href}>
            {buttonText}
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
