"use client";

import { useEffect, useState } from "react";
import { Globe, ImageIcon, Loader2, Save, Search, Store, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { slugError, slugify } from "@/lib/store-slug";
import { storeDisplayUrl } from "@/lib/store-url";
import { StoreAddressInput } from "@/components/store-builder/StoreAddressInput";
import { useSellerStore } from "@/hooks/useSellerStore";
import { useTranslation } from "@/context/LanguageContext";

type Form = {
  name: string;
  description: string;
  logo_url: string;
  slug: string;
  seo_title: string;
  seo_description: string;
};

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

  const update = (field: keyof Form, value: string) => setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
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
    </div>
  );
}
