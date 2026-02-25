"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { 
  ShoppingCart, 
  CheckCircle2, 
  TrendingUp, 
  Users, 
  Percent,
  ChevronDown,
  AlertCircle,
  Package,
  Store,
  CreditCard,
  Truck,
  Globe,
  ArrowRight,
  Check
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/context/LanguageContext";
import { useSellerDashboard } from "@/hooks/useSellerDashboard";
import { useOnboardingChecklist } from "@/hooks/useOnboardingChecklist";
import { RealtimeOrdersListener } from "@/components/seller/RealtimeOrdersListener";

export default function SellerDashboard() {
  const { t } = useTranslation();
  const [sellerId, setSellerId] = useState<string | null>(null);
  
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setSellerId(data.user.id);
    });
  }, []);

  const { stats, profile, loading: statsLoading, refetchStats } = useSellerDashboard(sellerId || "");
  const { checklist, loading: checklistLoading } = useOnboardingChecklist(sellerId || "");

  const steps = [
    { id: 1, title: "Compléter votre profil", description: "Ajoutez vos informations personnelles et de contact", status: checklist.profile ? "completed" : "pending", icon: Users },
    { id: 2, title: "Créer votre boutique", description: "Configurez le nom et le logo de votre boutique", status: checklist.store ? "completed" : "pending", icon: Store },
    { id: 3, title: "Ajouter vos premiers produits", description: "Importez des produits depuis le catalogue Dropy", status: checklist.products ? "completed" : "pending", icon: Package },
    { id: 4, title: "Configurer les paiements", description: "Liez votre compte bancaire pour recevoir vos gains", status: checklist.payment ? "completed" : "pending", icon: CreditCard },
    { id: 5, title: "Définir vos frais de livraison", description: "Configurez vos zones et tarifs de livraison", status: checklist.shipping ? "completed" : "pending", icon: Truck },
    { id: 6, title: "Lier un nom de domaine", description: "Utilisez votre propre domaine pour plus de professionnalisme", status: checklist.domain ? "completed" : "pending", icon: Globe },
  ];

  const completedSteps = steps.filter(s => s.status === "completed").length;

  if (statsLoading || checklistLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {sellerId && <RealtimeOrdersListener sellerId={sellerId} onNewOrder={refetchStats} />}
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bienvenue {profile?.store_name?.split(' ')[0]} sur votre tableau de bord
          </h1>
          <p className="text-gray-500 mt-1">
            Configurez votre boutique en quelques étapes simples
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-white border-gray-200 text-gray-700 font-medium h-10 px-4">
                Aujourd'hui
                <ChevronDown className="ml-2 w-4 h-4 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem>Aujourd'hui</DropdownMenuItem>
              <DropdownMenuItem>Hier</DropdownMenuItem>
              <DropdownMenuItem>7 derniers jours</DropdownMenuItem>
              <DropdownMenuItem>30 derniers jours</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard 
          title="CMD REÇUES" 
          value={stats.totalOrders.toString()} 
          icon={<ShoppingCart className="w-5 h-5 text-blue-600" />} 
          iconBg="bg-blue-50"
          change={stats.ordersChange}
        />
        <StatCard 
          title="VENTES" 
          value={`${stats.totalRevenue.toLocaleString()} TND`} 
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />} 
          iconBg="bg-emerald-50"
          change={stats.revenueChange}
        />
        <StatCard 
          title="VISITEURS" 
          value={stats.totalVisitors.toString()} 
          icon={<Users className="w-5 h-5 text-blue-600" />} 
          iconBg="bg-blue-50"
        />
        <StatCard 
          title="TAUX CONVERSION" 
          value={`${stats.conversionRate}%`} 
          icon={<Percent className="w-5 h-5 text-blue-600" />} 
          iconBg="bg-blue-50"
          badge={stats.conversionRate < 1 ? { text: "Faible", color: "bg-red-50 text-red-600 border-red-100" } : undefined}
        />
        <StatCard 
          title="STATUT" 
          value={profile?.is_verified ? "Vérifié" : "En attente"} 
          icon={<CheckCircle2 className={`w-5 h-5 ${profile?.is_verified ? "text-emerald-600" : "text-orange-600"}`} />} 
          iconBg={profile?.is_verified ? "bg-emerald-50" : "bg-orange-50"}
        />
      </div>

      {/* Alert Section */}
      {!checklist.domain && (
        <div className="bg-orange-50/50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
          <div className="text-sm text-orange-800">
            <p className="font-semibold">Action requise : Nom de domaine</p>
            <p>Vous devez disposer d'un nom de domaine pour professionnaliser votre boutique et activer les paiements par carte.</p>
          </div>
        </div>
      )}

      {/* Progress Section */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-bold text-gray-900">Configuration de votre boutique</h2>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-600">{completedSteps}/{steps.length} Étapes complétées</span>
              <div className="w-32">
                <Progress value={(completedSteps / steps.length) * 100} className="h-2 bg-gray-100" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {steps.map((step) => (
              <div key={step.id} className="flex gap-4 group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
                  step.status === 'completed' 
                    ? 'bg-emerald-50 border-emerald-100' 
                    : 'bg-gray-50 border-gray-100 group-hover:bg-white group-hover:border-primary/20'
                }`}>
                  <step.icon className={`w-5 h-5 ${step.status === 'completed' ? 'text-emerald-600' : 'text-gray-400 group-hover:text-primary'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-gray-900 truncate">{step.title}</h3>
                    {step.status === 'completed' && <Check className="w-4 h-4 text-emerald-500" />}
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2">{step.description}</p>
                  <Button 
                    asChild={step.status !== 'completed'}
                    variant={step.status === 'completed' ? "ghost" : "outline"} 
                    size="sm" 
                    className={`h-8 text-xs font-semibold rounded-lg ${
                      step.status === 'completed' 
                        ? 'text-emerald-600 hover:bg-emerald-50 cursor-default' 
                        : 'text-primary border-primary/20 hover:bg-primary/5 hover:border-primary'
                    }`}
                  >
                    {step.status === 'completed' ? (
                      <span>Terminé ✓</span>
                    ) : (
                      <Link href={
                        step.id === 1 ? "/seller/settings" :
                        step.id === 2 ? "/seller/store-builder" :
                        step.id === 3 ? "/seller/products/catalog" :
                        step.id === 4 ? "/seller/settings?tab=payments" :
                        step.id === 5 ? "/seller/shipping" :
                        step.id === 6 ? "/seller/store-builder/settings" :
                        "#"
                      }>
                        {step.id === 6 ? 'À valider' : 'À configurer'}
                        <ArrowRight className="ml-1.5 w-3 h-3" />
                      </Link>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 bg-gray-50 flex justify-center">
          <Button variant="link" className="text-sm text-primary font-bold">
            Voir toutes les étapes de configuration
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon, 
  iconBg, 
  badge, 
  change 
}: { 
  title: string; 
  value: string; 
  icon: React.ReactNode; 
  iconBg: string; 
  badge?: { text: string; color: string };
  change?: number;
}) {
  return (
    <Card className="border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
            {icon}
          </div>
          <span className="text-[11px] font-bold text-gray-500 tracking-wider uppercase">{title}</span>
        </div>
        <div className="flex items-baseline justify-between">
          <div className="flex flex-col">
            <span className="text-xl font-black text-gray-900">{value}</span>
            {change !== undefined && (
              <span className={`text-[10px] font-bold ${change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {change >= 0 ? '+' : ''}{change}% vs mois dernier
              </span>
            )}
          </div>
          {badge && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.color}`}>
              {badge.text}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
