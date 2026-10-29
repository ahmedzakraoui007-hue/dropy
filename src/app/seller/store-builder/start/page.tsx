"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ExternalLink, Loader2, Package, PartyPopper } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { cn, formatPrice } from "@/lib/utils";
import { slugError, slugify } from "@/lib/store-slug";
import { themeHeroImage, themes } from "@/lib/themes";
import { normalizeStorefrontLanguage } from "@/lib/storefront-i18n";
import { useThemes } from "@/hooks/store-builder/useThemes";
import { storeDisplayUrl, storeViewHref } from "@/lib/store-url";
import { StoreAddressInput } from "@/components/store-builder/StoreAddressInput";
import { useSellerStore } from "@/hooks/useSellerStore";
import { useTranslation } from "@/context/LanguageContext";
import { importCatalogProduct } from "@/lib/catalog-import";
import { DROPSHIPPING_ENABLED } from "@/lib/launch";
import { STORE_NICHES, generateStore, nicheScore, nicheTheme } from "@/lib/store-generator";

type CatalogItem = { id: string; name: string; image: string | null; base: number; price: number; text: string };

const STEPS = ["store", "style", "products", "launch"] as const;

export default function StoreSetupWizard() {
  const { store, setStore, loading, reload } = useSellerStore();
  const { applyTheme, isApplying, currentThemeId } = useThemes();
  const { t } = useTranslation();
  const tr = (key: string) => t(`store_builder.wizard.${key}`);

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [language, setLanguage] = useState<"fr" | "ar" | "both">("fr");
  const [niche, setNiche] = useState<string | null>(null);
  const [replaceHome, setReplaceHome] = useState(false);
  const [saving, setSaving] = useState(false);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [imported, setImported] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [productCount, setProductCount] = useState(0);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (!store) return;
    setName((prev) => prev || store.name);
    setSlug((prev) => prev || store.slug);
    setLanguage(normalizeStorefrontLanguage(store.storefront_language));
    const currentTheme = (store.theme_config as Record<string, any> | null)?.theme_id;
    setNiche((prev) => prev ?? STORE_NICHES.find((n) => n.themeId === currentTheme)?.id ?? null);
  }, [store]);

  useEffect(() => {
    if (!store) return;
    const supabase = createClient();
    Promise.all([
      supabase
        .from("products")
        .select("id, name, description, sub_category, images, base_price, compare_price")
        .eq("is_active", true)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(12),
      supabase.from("store_products").select("product_id, is_active").eq("store_id", store.id),
    ]).then(([{ data: products }, { data: storeProducts }]) => {
      setCatalog(
        (products || []).map((p: any) => {
          const base = Number(p.base_price || 0);
          const compare = Number(p.compare_price || 0);
          return {
            id: p.id,
            name: p.name,
            image: p.images?.[0] ?? null,
            base,
            price: compare > base ? compare : Math.round(base * 1.35 * 100) / 100,
            text: `${p.name} ${p.sub_category || ""} ${p.description || ""}`,
          };
        })
      );
      setImported(new Set((storeProducts || []).map((sp: any) => sp.product_id).filter(Boolean)));
      setProductCount((storeProducts || []).filter((sp: any) => sp.is_active !== false).length);
    });
  }, [store]);

  if (loading || !store) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const slugCode = slug === store.slug ? null : slugError(slug);

  const saveStore = async () => {
    if (!name.trim()) {
      toast.error(t("store_builder.settings.errors.name_required"));
      return;
    }
    if (slugCode) {
      toast.error(t(`store_builder.settings.errors.${slugCode}`));
      return;
    }
    const hasTheme = Boolean((store.theme_config as Record<string, any> | null)?.theme_id);
    if (!niche && !hasTheme) {
      toast.error(tr("store.niche_required"));
      return;
    }
    setSaving(true);
    const supabase = createClient();
    if (slug !== store.slug) {
      const { data: taken } = await supabase.from("stores").select("id").eq("slug", slug).neq("id", store.id).maybeSingle();
      if (taken) {
        setSaving(false);
        toast.error(t("store_builder.settings.errors.slug_taken"));
        return;
      }
    }
    const { error } = await supabase.from("stores").update({ name: name.trim(), slug, storefront_language: language }).eq("id", store.id);
    if (error) {
      setSaving(false);
      toast.error(t("store_builder.settings.errors.save"));
      return;
    }
    setStore({ ...store, name: name.trim(), slug, storefront_language: language });
    if (!niche) {
      setSaving(false);
      setStep(1);
      return;
    }
    try {
      const currentTheme = (store.theme_config as Record<string, any> | null)?.theme_id;
      const result = await generateStore(supabase, store, {
        niche,
        lang: language === "ar" ? "ar" : "fr",
        replaceHome: !hasTheme || replaceHome,
        applyLook: !hasTheme || replaceHome || nicheTheme(niche)?.id !== currentTheme,
      });
      toast.success(tr("store.generated").replace("{pages}", String(result.pagesCreated)));
      await reload();
      setStep(2);
    } catch (error) {
      console.error("Store generation failed:", error);
      toast.error(t("store_builder.settings.errors.save"));
    } finally {
      setSaving(false);
    }
  };

  const chooseTheme = async (themeId: string) => {
    const theme = themes.find((item) => item.id === themeId);
    if (!theme) return;
    const ok = await applyTheme(theme, { replaceHome: !store.theme_config?.theme_id, redirect: false });
    if (ok) {
      await reload();
      setStep(2);
    }
  };

  const importSelected = async () => {
    setImporting(true);
    const supabase = createClient();
    let added = 0;
    for (const item of catalog.filter((c) => selected.has(c.id))) {
      const result = await importCatalogProduct(supabase, item.id, item.price);
      if (result.ok || result.reason === "duplicate") {
        if (result.ok) added += 1;
        setImported((prev) => new Set(prev).add(item.id));
      }
    }
    setImporting(false);
    setSelected(new Set());
    setProductCount((count) => count + added);
    if (added > 0) toast.success(tr("products.done").replace("{count}", String(added)));
    setStep(3);
  };

  const publish = async () => {
    if (productCount === 0) {
      toast.error(tr("launch.need_product"));
      return;
    }
    setSaving(true);
    const { error } = await createClient().from("stores").update({ is_active: true }).eq("id", store.id);
    setSaving(false);
    if (error) {
      toast.error(t("store_builder.hub.status_error"));
      return;
    }
    setStore({ ...store, is_active: true });
  };

  const isOnline = store.is_active !== false;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-1">
        <h1 className="text-2xl md:text-3xl font-black text-gray-900">{tr("title")}</h1>
        <p className="text-gray-500">{tr("subtitle")}</p>
      </div>

      <ol className="flex items-center justify-center gap-2 md:gap-4">
        {STEPS.map((key, index) => (
          <li key={key} className="flex items-center gap-2">
            <button
              type="button"
              disabled={index > step}
              onClick={() => setStep(index)}
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs md:text-sm font-bold transition-colors",
                index === step ? "bg-purple-600 text-white" : index < step ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-400"
              )}
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                {index < step ? <Check className="w-3.5 h-3.5" /> : index + 1}
              </span>
              <span className="hidden sm:inline">{tr(`steps.${key}`)}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className="rounded-3xl bg-white border border-gray-100 shadow-xl shadow-purple-900/5 p-5 md:p-8">
        {step === 0 && (
          <div className="max-w-md mx-auto space-y-6">
            <h2 className="text-xl font-black text-gray-900">{tr("store.heading")}</h2>
            <div className="space-y-2">
              <Label htmlFor="wizard-name">{tr("store.name")}</Label>
              <Input
                id="wizard-name"
                value={name}
                maxLength={60}
                placeholder={tr("store.name_ph")}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slugTouched) setSlug(slugify(e.target.value));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>{tr("store.address")}</Label>
              <StoreAddressInput
                value={slug}
                onChange={(value) => {
                  setSlugTouched(true);
                  setSlug(value);
                }}
              />
              {slugCode && <p className="text-sm text-red-600">{t(`store_builder.settings.errors.${slugCode}`)}</p>}
            </div>
            <div className="space-y-2">
              <Label>{tr("store.niche")}</Label>
              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={tr("store.niche")}>
                {STORE_NICHES.map((item) => {
                  const theme = nicheTheme(item.id);
                  const active = niche === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setNiche(item.id)}
                      className={cn(
                        "relative overflow-hidden rounded-xl border-2 text-start transition-all",
                        active ? "border-purple-600 ring-2 ring-purple-200" : "border-gray-100 hover:border-purple-300"
                      )}
                    >
                      {theme && <img src={themeHeroImage(theme, 300)} alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" />}
                      <span className="block px-2 py-1.5 text-[11px] font-bold leading-tight">{tr(`niches.${item.id}`)}</span>
                      {active && (
                        <span className="absolute top-1.5 end-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-white">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500">{tr("store.niche_help")}</p>
              {Boolean((store.theme_config as Record<string, any> | null)?.theme_id) && (
                <label className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
                  <input type="checkbox" className="mt-0.5" checked={replaceHome} onChange={(e) => setReplaceHome(e.target.checked)} />
                  <span>{tr("store.replace_home")}</span>
                </label>
              )}
            </div>
            <div className="space-y-2">
              <Label>{t("store_builder.settings.language.label")}</Label>
              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={t("store_builder.settings.language.label")}>
                {(["fr", "ar", "both"] as const).map((code) => (
                  <button
                    key={code}
                    type="button"
                    role="radio"
                    aria-checked={language === code}
                    onClick={() => setLanguage(code)}
                    className={cn(
                      "rounded-xl border-2 px-2 py-2.5 text-sm font-bold transition-colors",
                      language === code ? "border-purple-600 bg-purple-50 text-purple-700" : "border-gray-100 hover:border-purple-200"
                    )}
                  >
                    {t(`store_builder.settings.language.${code}`)}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={saveStore} disabled={saving} className="w-full h-12 rounded-xl bg-purple-600 hover:bg-purple-700 font-bold">
              {saving && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
              {saving && niche ? tr("store.generating") : niche ? tr("store.generate") : tr("next")}
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-gray-900">{tr("style.heading")}</h2>
              <p className="text-sm text-gray-500">{tr("style.desc")}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {themes.map((theme) => {
                const isCurrent = (store.theme_config?.theme_id || currentThemeId) === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    disabled={isApplying}
                    onClick={() => chooseTheme(theme.id)}
                    className={cn(
                      "group text-start rounded-2xl border-2 overflow-hidden transition-all hover:shadow-lg disabled:opacity-60",
                      isCurrent ? "border-purple-600" : "border-gray-100 hover:border-purple-300"
                    )}
                  >
                    <div className="aspect-[4/3] bg-gray-50 overflow-hidden">
                      <img src={themeHeroImage(theme, 600)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="flex items-center justify-between gap-2 p-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-4 h-4 rounded-full shrink-0" style={{ background: theme.colors.primary }} />
                        <span className="font-bold text-sm truncate">{t(`store_builder.themes.${theme.id}.name`)}</span>
                      </div>
                      <span className="text-[11px] font-bold text-purple-600 shrink-0">
                        {isCurrent ? tr("style.current") : isApplying ? tr("style.applying") : tr("style.choose")}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(0)}>{tr("back")}</Button>
              <Button variant="ghost" onClick={() => setStep(2)}>{tr("skip")}</Button>
            </div>
          </div>
        )}

        {step === 2 && !DROPSHIPPING_ENABLED && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-gray-900">{tr("products.own_heading")}</h2>
              <p className="text-sm text-gray-500">{tr("products.own_desc")}</p>
            </div>
            <div className="rounded-2xl border border-purple-100 bg-purple-50/60 p-6 text-center">
              <Package className="mx-auto mb-3 h-8 w-8 text-purple-600" />
              <Link href="/seller/products/add?new=1">
                <Button className="rounded-xl bg-purple-600 hover:bg-purple-700 font-bold">{tr("products.own_cta")}</Button>
              </Link>
              <p className="mt-4 text-xs text-gray-500">{tr("products.dropshipping_soon")}</p>
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-between gap-3">
              <Button variant="ghost" onClick={() => setStep(1)}>{tr("back")}</Button>
              <Button variant="ghost" onClick={() => setStep(3)}>{tr("skip")}</Button>
            </div>
          </div>
        )}

        {step === 2 && DROPSHIPPING_ENABLED && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-gray-900">{tr("products.heading")}</h2>
              <p className="text-sm text-gray-500">{tr("products.desc")}</p>
            </div>
            {catalog.length === 0 ? (
              <p className="rounded-2xl bg-gray-50 p-6 text-center text-sm text-gray-500">{tr("products.empty")}</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[...catalog].sort((a, b) => (niche ? nicheScore(niche, b.text) - nicheScore(niche, a.text) : 0)).map((item) => {
                  const done = imported.has(item.id);
                  const checked = selected.has(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={done || importing}
                      onClick={() =>
                        setSelected((prev) => {
                          const next = new Set(prev);
                          if (next.has(item.id)) next.delete(item.id);
                          else next.add(item.id);
                          return next;
                        })
                      }
                      className={cn(
                        "relative text-start rounded-2xl border-2 overflow-hidden transition-all",
                        done ? "border-emerald-200 opacity-70" : checked ? "border-purple-600 shadow-lg" : "border-gray-100 hover:border-purple-300"
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-2 end-2 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center",
                          done ? "bg-emerald-500 border-emerald-500 text-white" : checked ? "bg-purple-600 border-purple-600 text-white" : "bg-white border-gray-300"
                        )}
                      >
                        {(done || checked) && <Check className="w-3.5 h-3.5" />}
                      </span>
                      <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                        {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <Package className="w-8 h-8 text-gray-300" />}
                      </div>
                      <div className="p-3 space-y-1">
                        <p className="font-bold text-sm line-clamp-1">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          {tr("products.price")} : <span className="font-bold text-gray-900">{formatPrice(item.price)}</span>
                        </p>
                        <p className="text-xs text-emerald-600 font-bold">
                          {done ? tr("products.added") : `${tr("products.margin")} : +${formatPrice(item.price - item.base)}`}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="flex flex-col-reverse sm:flex-row justify-between gap-3">
              <Button variant="ghost" onClick={() => setStep(1)}>{tr("back")}</Button>
              <div className="flex flex-col-reverse sm:flex-row gap-3">
                <Button variant="ghost" onClick={() => setStep(3)}>{tr("skip")}</Button>
                <Button onClick={importSelected} disabled={selected.size === 0 || importing} className="rounded-xl bg-purple-600 hover:bg-purple-700 font-bold">
                  {importing && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
                  {importing ? tr("products.adding") : tr("products.add").replace("{count}", String(selected.size))}
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-purple-600 to-teal-500 text-white flex items-center justify-center">
              <PartyPopper className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-gray-900">{isOnline ? tr("launch.online") : tr("launch.heading")}</h2>
              {!isOnline && <p className="text-gray-500">{tr("launch.desc")}</p>}
              <p className="font-mono text-sm text-gray-600" dir="ltr">{storeDisplayUrl(store.slug)}</p>
            </div>
            {!isOnline &&
              (productCount > 0 ? (
                <Button onClick={publish} disabled={saving} className="w-full h-12 rounded-xl bg-purple-600 hover:bg-purple-700 font-bold">
                  {saving && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
                  {tr("launch.publish")}
                </Button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-amber-700 bg-amber-50 rounded-xl p-3">{tr("launch.need_product")}</p>
                  <Button variant="outline" className="w-full rounded-xl" onClick={() => setStep(2)}>{tr("launch.add_products")}</Button>
                </div>
              ))}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild variant="outline" className="flex-1 rounded-xl">
                <a href={storeViewHref(store.slug, store.is_active)} target="_blank" rel="noreferrer">
                  <ExternalLink className="w-4 h-4 me-2" />
                  {tr("launch.view")}
                </a>
              </Button>
              <Button asChild className="flex-1 rounded-xl bg-gray-900 hover:bg-gray-800">
                <Link href="/seller/store-builder/builder">{tr("launch.edit")}</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
