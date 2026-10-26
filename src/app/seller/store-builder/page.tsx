"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Copy,
  ExternalLink,
  LayoutTemplate,
  Loader2,
  Navigation,
  Package,
  Palette,
  Settings,
  ShoppingCart,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { storeDisplayUrl, storeUrl, storeViewHref } from "@/lib/store-url";
import { useSellerStore } from "@/hooks/useSellerStore";
import { useTranslation } from "@/context/LanguageContext";

const TOOLS = [
  { key: "editor", icon: LayoutTemplate, href: "/seller/store-builder/builder" },
  { key: "themes", icon: Sparkles, href: "/seller/store-builder/themes" },
  { key: "menus", icon: Navigation, href: "/seller/store-builder/navigation" },
  { key: "checkout", icon: ShoppingCart, href: "/seller/store-builder/checkout" },
  { key: "settings", icon: Settings, href: "/seller/store-builder/settings" },
];

export default function StoreBuilderDashboard() {
  const { store, setStore, loading, error } = useSellerStore();
  const { t } = useTranslation();
  const tr = (key: string) => t(`store_builder.${key}`);
  const [productCount, setProductCount] = useState<number | null>(null);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (!store) return;
    createClient()
      .from("store_products")
      .select("id", { count: "exact", head: true })
      .eq("store_id", store.id)
      .eq("is_active", true)
      .then(({ count }) => setProductCount(count ?? 0));
  }, [store]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!store) {
    return <div className="p-8 text-muted-foreground">{error || tr("hub.not_found")}</div>;
  }

  const isOnline = store.is_active !== false;
  const publicUrl = storeUrl(store.slug);

  const steps = [
    {
      title: tr("hub.steps.theme"),
      description: tr("hub.steps.theme_desc"),
      done: Boolean(store.theme_config?.theme_id),
      href: "/seller/store-builder/themes",
      icon: Palette,
    },
    {
      title: tr("hub.steps.logo"),
      description: tr("hub.steps.logo_desc"),
      done: Boolean(store.logo_url),
      href: "/seller/store-builder/settings",
      icon: Settings,
    },
    {
      title: tr("hub.steps.products"),
      description: tr("hub.steps.products_desc"),
      done: (productCount ?? 0) > 0,
      href: "/seller/products/catalog",
      icon: Package,
    },
    {
      title: tr("hub.steps.home"),
      description: tr("hub.steps.home_desc"),
      done: false,
      optional: true,
      href: "/seller/store-builder/builder",
      icon: LayoutTemplate,
    },
  ];
  const required = steps.filter((s) => !s.optional);
  const progress = Math.round((required.filter((s) => s.done).length / required.length) * 100);

  const togglePublished = async (next: boolean) => {
    if (next && (productCount ?? 0) === 0) {
      toast.error(tr("hub.need_product"));
      return;
    }
    setPublishing(true);
    const { error: updateError } = await createClient().from("stores").update({ is_active: next }).eq("id", store.id);
    setPublishing(false);
    if (updateError) {
      toast.error(tr("hub.status_error"));
      return;
    }
    setStore({ ...store, is_active: next });
    toast.success(next ? tr("hub.now_online") : tr("hub.now_offline"));
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2 min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{tr("hub.eyebrow")}</p>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight truncate">{store.name}</h1>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-mono text-gray-600 truncate">{storeDisplayUrl(store.slug)}</span>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-700"
              onClick={() => {
                navigator.clipboard.writeText(publicUrl);
                toast.success(tr("hub.copied"));
              }}
              aria-label={tr("hub.copy")}
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-3 rounded-xl border bg-white px-4 h-11 cursor-pointer">
            <Switch checked={isOnline} disabled={publishing} onCheckedChange={togglePublished} />
            <span className={cn("text-sm font-bold", isOnline ? "text-emerald-600" : "text-gray-500")}>
              {isOnline ? tr("hub.online") : tr("hub.offline")}
            </span>
          </label>
          <Button variant="outline" asChild className="rounded-xl h-11">
            <a href={storeViewHref(store.slug, store.is_active)} target="_blank" rel="noreferrer">
              <ExternalLink className="w-4 h-4 me-2" />
              {tr("hub.view")}
            </a>
          </Button>
          <Button asChild className="rounded-xl h-11 bg-purple-600 hover:bg-purple-700">
            <Link href="/seller/store-builder/builder">
              <LayoutTemplate className="w-4 h-4 me-2" />
              {tr("hub.edit")}
            </Link>
          </Button>
        </div>
      </div>

      {(progress < 100 || !isOnline) && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-purple-600 to-teal-500 p-6 text-white shadow-xl shadow-purple-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="text-lg font-black">{t("store_builder.wizard.banner.title")}</p>
              <p className="text-sm text-white/80">{t("store_builder.wizard.banner.desc")}</p>
            </div>
          </div>
          <Button asChild className="rounded-xl bg-white text-purple-700 hover:bg-white/90 font-bold h-11 shrink-0">
            <Link href="/seller/store-builder/start">
              {t("store_builder.wizard.banner.cta")}
              <ArrowRight className="w-4 h-4 ms-2 rtl:rotate-180" />
            </Link>
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1 border-none shadow-xl shadow-purple-900/5 rounded-3xl">
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-gray-900">{tr("hub.prepare")}</h2>
                <span className="text-sm font-bold text-purple-600">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            <ol className="space-y-2">
              {steps.map((step) => (
                <li key={step.title}>
                  <Link
                    href={step.href}
                    className="flex items-start gap-3 rounded-2xl p-3 hover:bg-gray-50 transition-colors"
                  >
                    {step.done ? (
                      <CheckCircle2 className="w-5 h-5 mt-0.5 text-emerald-500 shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 mt-0.5 text-gray-300 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className={cn("text-sm font-bold", step.done ? "text-gray-400 line-through" : "text-gray-900")}>
                        {step.title}
                        {step.optional && <span className="ms-2 text-xs font-medium text-gray-400">{tr("hub.recommended")}</span>}
                      </p>
                      <p className="text-xs text-gray-500">{step.description}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
            {!isOnline && (
              <p className="text-xs text-gray-500">
                {tr("hub.offline_note")}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {TOOLS.map((tool) => (
            <Card key={tool.href} className="border-none shadow-xl shadow-gray-200/50 rounded-3xl group hover:shadow-2xl transition-all">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                  <tool.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{tr(`nav.${tool.key}`)}</h3>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed flex-1">{tr(`hub.tools.${tool.key}_desc`)}</p>
                <Button asChild variant="outline" className="w-full rounded-xl font-bold h-11">
                  <Link href={tool.href}>
                    {tr("hub.open")}
                    <ArrowRight className="w-4 h-4 ms-2 rtl:rotate-180 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
