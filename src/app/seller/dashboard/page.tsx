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
import { formatPrice } from "@/lib/utils";
import { RealtimeOrdersListener } from "@/components/seller/RealtimeOrdersListener";
import { DROPSHIPPING_ENABLED } from "@/lib/launch";

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

  const stepDefs = [
    { id: "store", done: checklist.store, icon: Store, href: "/seller/store-builder/start" },
    { id: "products", done: checklist.products, icon: Package, href: DROPSHIPPING_ENABLED ? "/seller/products/catalog" : "/seller/products/add?new=1" },
    { id: "online", done: checklist.online, icon: Globe, href: "/seller/store-builder" },
    { id: "payment", done: checklist.payment, icon: CreditCard, href: "/seller/settings" },
    { id: "profile", done: checklist.profile, icon: Users, href: "/seller/settings" },
  ];
  const steps = stepDefs.map((step) => ({
    ...step,
    title: t(`seller_app.dashboard.steps.${step.id}`),
    description: t(`seller_app.dashboard.steps.${step.id}_desc`),
    status: step.done ? "completed" : "pending",
  }));

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
            {profile?.store_name ? t("seller_app.dashboard.welcome_name").replace("{name}", profile.store_name.split(" ")[0]) : t("seller_app.dashboard.welcome")}
          </h1>
          <p className="text-gray-500 mt-1">
            {completedSteps < steps.length ? t("seller_app.dashboard.subtitle_setup") : t("seller_app.dashboard.subtitle_active")}
          </p>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard 
          title={t("seller_app.dashboard.stats.orders")}
          value={stats.totalOrders.toString()} 
          icon={<ShoppingCart className="w-5 h-5 text-blue-600" />} 
          iconBg="bg-blue-50"
          change={stats.ordersChange}
        />
        <StatCard 
          title={t("seller_app.dashboard.stats.sales")}
          value={formatPrice(stats.totalRevenue)}
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />} 
          iconBg="bg-emerald-50"
          change={stats.revenueChange}
        />
        <StatCard 
          title={t("seller_app.dashboard.stats.visitors")}
          value={stats.totalVisitors.toString()} 
          icon={<Users className="w-5 h-5 text-blue-600" />} 
          iconBg="bg-blue-50"
        />
        <StatCard 
          title={t("seller_app.dashboard.stats.conversion")}
          value={`${stats.conversionRate}%`} 
          icon={<Percent className="w-5 h-5 text-blue-600" />} 
          iconBg="bg-blue-50"
          badge={stats.conversionRate < 1 ? { text: t("seller_app.dashboard.stats.low"), color: "bg-red-50 text-red-600 border-red-100" } : undefined}
        />
        <StatCard 
          title={t("seller_app.dashboard.stats.status")}
          value={profile?.is_verified ? t("seller_app.dashboard.stats.verified") : t("seller_app.dashboard.stats.pending")}
          icon={<CheckCircle2 className={`w-5 h-5 ${profile?.is_verified ? "text-emerald-600" : "text-orange-600"}`} />} 
          iconBg={profile?.is_verified ? "bg-emerald-50" : "bg-orange-50"}
        />
      </div>

      {completedSteps < steps.length && (
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-bold text-gray-900">{t("seller_app.dashboard.setup_title")}</h2>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-600">{t("seller_app.dashboard.steps_done").replace("{done}", String(completedSteps)).replace("{total}", String(steps.length))}</span>
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
                      <span>{t("seller_app.dashboard.done")}</span>
                    ) : (
                      <Link href={step.href}>
                        {step.id === "store" ? t("seller_app.dashboard.start") : t("seller_app.dashboard.configure")}
                        <ArrowRight className="ml-1.5 w-3 h-3 rtl:rotate-180" />
                      </Link>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}
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
  const { t } = useTranslation();
  const vsLabel = t("seller_app.dashboard.stats.vs_last_month");
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
                {change >= 0 ? '+' : ''}{change}% {vsLabel}
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
