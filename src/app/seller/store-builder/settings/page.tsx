"use client";

import { useEffect, useState } from "react";
import { BarChart3, Copy, Globe, ImageIcon, Loader2, Megaphone, Plus, Save, Search, Store, Trash2, Truck, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { slugError } from "@/lib/store-slug";
import { isValidFacebookPixelId, isValidGoogleAnalyticsId, isValidTiktokPixelId } from "@/lib/storefront-tracking";
import { SITE_URL } from "@/lib/store-url";
import { MAX_OFFERS, normalizeOffers } from "@/lib/store-pricing";
import { storeDisplayUrl } from "@/lib/store-url";
import { StoreAddressInput } from "@/components/store-builder/StoreAddressInput";
import { McpConnectCard } from "@/components/store-builder/McpConnectCard";
import { SubscribersCard } from "@/components/store-builder/SubscribersCard";
import { useSellerStore } from "@/hooks/useSellerStore";
import { useTranslation } from "@/context/LanguageContext";

type Form = {
  name: string;
  description: string;
  logo_url: string;
  slug: string;
  seo_title: string;
  seo_description: string;
  whatsapp_number: string;
  facebook_pixel_id: string;
  tiktok_pixel_id: string;
  delivery_fee: string;
  free_delivery_threshold: string;
  google_analytics_id: string;
  google_site_verification: string;
  facebook_domain_verification: string;
  offers: { min_quantity: string; discount_percent: string }[];
};

const whatsappDigits = (value: string) => value.replace(/\D/g, "");

const verificationToken = (value: string) => {
  const trimmed = value.trim();
  const fromTag = trimmed.match(/content\s*=\s*["']([^"']+)["']/i);
  return (fromTag ? fromTag[1] : trimmed).trim();
};
const VALID_TOKEN = /^[A-Za-z0-9_-]{8,100}$/;

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

export default function StoreSettingsPage() {
  const { store, setStore, loading, error } = useSellerStore();
  const { t } = useTranslation();
  const tr = (key: string) => t(`store_builder.settings.${key}`);
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!store) return;
    setForm({
      name: store.name || "",
      description: store.description || "",
      logo_url: store.logo_url || "",
      slug: store.slug || "",
      seo_title: store.seo_title || "",
      seo_description: store.seo_description || "",
      whatsapp_number: store.whatsapp_number || "",
      facebook_pixel_id: store.facebook_pixel_id || "",
      tiktok_pixel_id: store.tiktok_pixel_id || "",
      google_analytics_id: store.google_analytics_id || "",
      google_site_verification: store.google_site_verification || "",
      facebook_domain_verification: store.facebook_domain_verification || "",
      delivery_fee: store.delivery_fee != null ? String(Number(store.delivery_fee)) : "0",
      free_delivery_threshold: store.free_delivery_threshold != null ? String(Number(store.free_delivery_threshold)) : "",
      offers: normalizeOffers(store.quantity_offers).map((o) => ({
        min_quantity: String(o.min_quantity),
        discount_percent: String(o.discount_percent),
      })),
    });
  }, [store]);

  if (loading || (store && !form)) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!store || !form) {
    return <div className="p-8 text-muted-foreground">{error || t("store_builder.hub.not_found")}</div>;
  }

  const update = (field: Exclude<keyof Form, "offers">, value: string) => setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  const setOffers = (offers: Form["offers"]) => setForm((prev) => (prev ? { ...prev, offers } : prev));
  const slugCode = form.slug === store.slug ? null : slugError(form.slug);
  const slugProblem = slugCode ? tr(`errors.${slugCode}`) : null;
  const defaultDescription = tr("default_description").replace("{name}", form.name);

  const uploadLogo = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error(tr("errors.image_type"));
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      toast.error(tr("errors.image_size"));
      return;
    }
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${store.vendor_id}/logo-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("store-assets").upload(path, file, { upsert: true });
    if (uploadError) {
      setUploading(false);
      toast.error(tr("errors.upload"));
      return;
    }
    const { data } = supabase.storage.from("store-assets").getPublicUrl(path);
    update("logo_url", data.publicUrl);
    setUploading(false);
    toast.success(tr("logo_ready"));
  };

  const save = async () => {
    const name = form.name.trim();
    if (!name) {
      toast.error(tr("errors.name_required"));
      return;
    }
    if (slugProblem) {
      toast.error(slugProblem);
      return;
    }
    const whatsapp = whatsappDigits(form.whatsapp_number);
    if (whatsapp && !(whatsapp.length === 8 || (whatsapp.length >= 11 && whatsapp.length <= 15))) {
      toast.error(tr("marketing.errors.whatsapp"));
      return;
    }
    if (form.facebook_pixel_id.trim() && !isValidFacebookPixelId(form.facebook_pixel_id)) {
      toast.error(tr("marketing.errors.facebook"));
      return;
    }
    if (form.tiktok_pixel_id.trim() && !isValidTiktokPixelId(form.tiktok_pixel_id)) {
      toast.error(tr("marketing.errors.tiktok"));
      return;
    }
    const gaId = form.google_analytics_id.trim().toUpperCase();
    if (gaId && !isValidGoogleAnalyticsId(gaId)) {
      toast.error(tr("integrations.errors.ga"));
      return;
    }
    const gscToken = verificationToken(form.google_site_verification);
    const metaToken = verificationToken(form.facebook_domain_verification);
    if ((gscToken && !VALID_TOKEN.test(gscToken)) || (metaToken && !VALID_TOKEN.test(metaToken))) {
      toast.error(tr("integrations.errors.token"));
      return;
    }
    const deliveryFee = Number(form.delivery_fee.replace(",", ".") || 0);
    if (!Number.isFinite(deliveryFee) || deliveryFee < 0 || deliveryFee > 100) {
      toast.error(tr("delivery.errors.fee"));
      return;
    }
    const thresholdRaw = form.free_delivery_threshold.trim().replace(",", ".");
    const threshold = thresholdRaw ? Number(thresholdRaw) : null;
    if (threshold !== null && (!Number.isFinite(threshold) || threshold <= 0)) {
      toast.error(tr("delivery.errors.threshold"));
      return;
    }
    const filledOffers = form.offers.filter((o) => o.min_quantity.trim() || o.discount_percent.trim());
    const offers = normalizeOffers(
      filledOffers.map((o) => ({ min_quantity: Number(o.min_quantity), discount_percent: Number(o.discount_percent.replace(",", ".")) }))
    );
    if (offers.length !== filledOffers.length) {
      toast.error(tr("delivery.errors.offer"));
      return;
    }

    setSaving(true);
    const supabase = createClient();

    if (form.slug !== store.slug) {
      const { data: taken } = await supabase.from("stores").select("id").eq("slug", form.slug).neq("id", store.id).maybeSingle();
      if (taken) {
        setSaving(false);
        toast.error(tr("errors.slug_taken"));
        return;
      }
    }

    const changes = {
      name,
      description: form.description.trim() || null,
      logo_url: form.logo_url || null,
      slug: form.slug,
      seo_title: form.seo_title.trim() || null,
      seo_description: form.seo_description.trim() || null,
      whatsapp_number: whatsapp || null,
      facebook_pixel_id: form.facebook_pixel_id.trim() || null,
      tiktok_pixel_id: form.tiktok_pixel_id.trim().toUpperCase() || null,
      google_analytics_id: gaId || null,
      google_site_verification: gscToken || null,
      facebook_domain_verification: metaToken || null,
      delivery_fee: deliveryFee,
      free_delivery_threshold: threshold,
      quantity_offers: offers,
    };
    const { error: saveError } = await supabase.from("stores").update(changes).eq("id", store.id);
    setSaving(false);

    if (saveError) {
      toast.error(saveError.code === "23505" ? tr("errors.slug_taken") : tr("errors.save"));
      return;
    }
    setStore({ ...store, ...changes });
    toast.success(tr("saved"));
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">{tr("title")}</h1>
          <p className="text-gray-500">{tr("subtitle")}</p>
        </div>
        <Button onClick={save} disabled={saving || uploading} className="rounded-xl bg-purple-600 hover:bg-purple-700 shrink-0">
          {saving ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : <Save className="w-4 h-4 me-2" />}
          {tr("save")}
        </Button>
      </div>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><Store className="w-5 h-5 text-purple-600" />{tr("identity")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">{tr("name")}</Label>
            <Input id="name" value={form.name} maxLength={60} onChange={(e) => update("name", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">{tr("description")}</Label>
            <Textarea
              id="description"
              rows={3}
              maxLength={300}
              value={form.description}
              placeholder={tr("description_ph")}
              onChange={(e) => update("description", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>{tr("logo")}</Label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl border bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                {form.logo_url ? (
                  <img src={form.logo_url} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-gray-300" />
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" className="rounded-xl" disabled={uploading} asChild>
                  <label className="cursor-pointer">
                    {uploading ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : <Upload className="w-4 h-4 me-2" />}
                    {form.logo_url ? tr("change") : tr("upload")}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadLogo(file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </Button>
                {form.logo_url && (
                  <Button variant="ghost" className="rounded-xl text-red-600" onClick={() => update("logo_url", "")}>
                    <Trash2 className="w-4 h-4 me-2" />
                    {tr("remove")}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><Globe className="w-5 h-5 text-purple-600" />{tr("address")}</CardTitle>
          <CardDescription>{tr("address_note")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <StoreAddressInput value={form.slug} onChange={(value) => update("slug", value)} />
          {slugProblem && <p className="text-sm text-red-600">{slugProblem}</p>}
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><Truck className="w-5 h-5 text-purple-600" />{tr("delivery.title")}</CardTitle>
          <CardDescription>{tr("delivery.desc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="delivery_fee">{tr("delivery.fee")}</Label>
              <Input id="delivery_fee" dir="ltr" inputMode="decimal" value={form.delivery_fee} onChange={(e) => update("delivery_fee", e.target.value)} />
              <p className="text-xs text-gray-400">{tr("delivery.fee_help")}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="free_delivery_threshold">{tr("delivery.threshold")}</Label>
              <Input id="free_delivery_threshold" dir="ltr" inputMode="decimal" value={form.free_delivery_threshold} onChange={(e) => update("free_delivery_threshold", e.target.value)} />
              <p className="text-xs text-gray-400">{tr("delivery.threshold_help")}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <Label>{tr("delivery.offers")}</Label>
              <p className="text-xs text-gray-400">{tr("delivery.offers_help")}</p>
            </div>
            {form.offers.map((offer, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  className="w-20"
                  dir="ltr"
                  inputMode="numeric"
                  value={offer.min_quantity}
                  onChange={(e) => setOffers(form.offers.map((o, i) => (i === index ? { ...o, min_quantity: e.target.value } : o)))}
                />
                <span className="text-sm text-gray-500">{tr("delivery.pieces")}</span>
                <Input
                  className="w-20"
                  dir="ltr"
                  inputMode="decimal"
                  value={offer.discount_percent}
                  onChange={(e) => setOffers(form.offers.map((o, i) => (i === index ? { ...o, discount_percent: e.target.value } : o)))}
                />
                <span className="text-sm text-gray-500">{tr("delivery.percent")}</span>
                <Button type="button" variant="ghost" size="icon" className="ms-auto text-red-600" aria-label={tr("delivery.remove")} onClick={() => setOffers(form.offers.filter((_, i) => i !== index))}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {form.offers.length < MAX_OFFERS && (
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() =>
                  setOffers([
                    ...form.offers,
                    { min_quantity: String((Number(form.offers[form.offers.length - 1]?.min_quantity) || 1) + 1), discount_percent: form.offers.length ? "15" : "10" },
                  ])
                }
              >
                <Plus className="w-4 h-4 me-2" />
                {tr("delivery.add")}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><Megaphone className="w-5 h-5 text-purple-600" />{tr("marketing.title")}</CardTitle>
          <CardDescription>{tr("marketing.desc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="whatsapp_number">{tr("marketing.whatsapp")}</Label>
            <Input id="whatsapp_number" dir="ltr" inputMode="tel" value={form.whatsapp_number} placeholder={tr("marketing.whatsapp_ph")} onChange={(e) => update("whatsapp_number", e.target.value)} />
            <p className="text-xs text-gray-400">{tr("marketing.whatsapp_help")}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="facebook_pixel_id">{tr("marketing.facebook")}</Label>
            <Input id="facebook_pixel_id" dir="ltr" inputMode="numeric" value={form.facebook_pixel_id} placeholder="123456789012345" onChange={(e) => update("facebook_pixel_id", e.target.value.trim())} />
            <p className="text-xs text-gray-400">{tr("marketing.facebook_help")}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tiktok_pixel_id">{tr("marketing.tiktok")}</Label>
            <Input id="tiktok_pixel_id" dir="ltr" value={form.tiktok_pixel_id} placeholder="C4A1B2C3D4E5F6G7H8I9" onChange={(e) => update("tiktok_pixel_id", e.target.value.trim())} />
            <p className="text-xs text-gray-400">{tr("marketing.tiktok_help")}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><BarChart3 className="w-5 h-5 text-purple-600" />{tr("integrations.title")}</CardTitle>
          <CardDescription>{tr("integrations.desc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="google_analytics_id">{tr("integrations.ga")}</Label>
            <Input id="google_analytics_id" dir="ltr" value={form.google_analytics_id} placeholder="G-XXXXXXXXXX" onChange={(e) => update("google_analytics_id", e.target.value.trim())} />
            <p className="text-xs text-gray-400">{tr("integrations.ga_help")}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="google_site_verification">{tr("integrations.gsc")}</Label>
            <Input id="google_site_verification" dir="ltr" value={form.google_site_verification} placeholder='<meta name="google-site-verification" content="..." />' onChange={(e) => update("google_site_verification", e.target.value)} />
            <p className="text-xs text-gray-400">{tr("integrations.gsc_help")}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="facebook_domain_verification">{tr("integrations.meta")}</Label>
            <Input id="facebook_domain_verification" dir="ltr" value={form.facebook_domain_verification} placeholder='<meta name="facebook-domain-verification" content="..." />' onChange={(e) => update("facebook_domain_verification", e.target.value)} />
            <p className="text-xs text-gray-400">{tr("integrations.meta_help")}</p>
          </div>
          <div className="space-y-2">
            <Label>{tr("integrations.feed")}</Label>
            <div className="flex items-center gap-2">
              <Input readOnly dir="ltr" value={`${SITE_URL}/api/feeds/${store.slug}/catalog.xml`} className="font-mono text-xs" />
              <Button
                type="button"
                variant="outline"
                className="shrink-0 rounded-xl"
                onClick={() => {
                  navigator.clipboard.writeText(`${SITE_URL}/api/feeds/${store.slug}/catalog.xml`);
                  toast.success(tr("integrations.copied"));
                }}
              >
                <Copy className="w-4 h-4 me-2" />
                {tr("integrations.copy")}
              </Button>
            </div>
            <p className="text-xs text-gray-400">{tr("integrations.feed_help")}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><Search className="w-5 h-5 text-purple-600" />{tr("seo")}</CardTitle>
          <CardDescription>{tr("seo_note")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="seo_title">{tr("seo_title")}</Label>
            <Input id="seo_title" value={form.seo_title} maxLength={60} placeholder={form.name} onChange={(e) => update("seo_title", e.target.value)} />
            <p className="text-xs text-gray-400">{form.seo_title.length}/60</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="seo_description">{tr("seo_description")}</Label>
            <Textarea
              id="seo_description"
              rows={3}
              maxLength={160}
              value={form.seo_description}
              placeholder={form.description || defaultDescription}
              onChange={(e) => update("seo_description", e.target.value)}
            />
            <p className="text-xs text-gray-400">{form.seo_description.length}/160</p>
          </div>
          <div className="rounded-2xl border bg-gray-50 p-4 space-y-1">
            <p className="text-xs text-gray-500">{storeDisplayUrl(form.slug)}</p>
            <p className="text-blue-700 font-medium truncate">{form.seo_title || form.name}</p>
            <p className="text-sm text-gray-600 line-clamp-2">
              {form.seo_description || form.description || defaultDescription}
            </p>
          </div>
        </CardContent>
      </Card>

      <SubscribersCard storeId={store.id} />

      <McpConnectCard />
    </div>
  );
}
