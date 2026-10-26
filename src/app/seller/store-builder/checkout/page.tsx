"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Save, ShoppingBag, ShoppingCart, Trash2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/context/LanguageContext";
import { MAX_CUSTOM_FIELDS, normalizeCheckout, type CheckoutMode, type CheckoutSettings, type FieldRule } from "@/lib/checkout-settings";

const MODES: { value: CheckoutMode; icon: typeof Zap }[] = [
  { value: "express", icon: Zap },
  { value: "both", icon: ShoppingBag },
  { value: "cart", icon: ShoppingCart },
];

export default function CheckoutSettingsPage() {
  const { t } = useTranslation();
  const tr = (key: string) => t(`store_builder.checkout.${key}`);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [settings, setSettings] = useState<CheckoutSettings>(normalizeCheckout({}));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setLoading(false);
      const { data: store } = await supabase
        .from("stores")
        .select("*")
        .eq("vendor_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (store) {
        setStoreId(store.id);
        setSettings(normalizeCheckout(store.checkout_settings));
      }
      setLoading(false);
    })();
  }, []);

  const change = (patch: Partial<CheckoutSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
    setDirty(true);
  };

  const save = async () => {
    if (!storeId) return;
    if (settings.customFields.some((f) => !f.label.trim())) {
      toast.error(tr("field_label_required"));
      return;
    }
    setSaving(true);
    const { error } = await createClient().from("stores").update({ checkout_settings: settings }).eq("id", storeId);
    setSaving(false);
    if (error) {
      toast.error(tr("save_error"));
      return;
    }
    setDirty(false);
    toast.success(tr("saved"));
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!storeId) return <p className="p-8 text-center text-gray-500">{tr("no_store")}</p>;

  const ruleSelect = (key: "city" | "email" | "note") => (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium">{tr(`field_${key}`)}</p>
        <p className="text-xs text-muted-foreground">{tr(`field_${key}_help`)}</p>
      </div>
      <Select value={settings[key]} onValueChange={(v) => change({ [key]: v as FieldRule })}>
        <SelectTrigger className="w-36 shrink-0" aria-label={tr(`field_${key}`)}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="hidden">{tr("rule_hidden")}</SelectItem>
          <SelectItem value="optional">{tr("rule_optional")}</SelectItem>
          <SelectItem value="required">{tr("rule_required")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-8 pb-24">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900">{tr("title")}</h1>
          <p className="mt-1 text-gray-500">{tr("subtitle")}</p>
        </div>
        <Button onClick={save} disabled={saving || !dirty} className="h-11 rounded-xl bg-purple-600 px-6 font-bold hover:bg-purple-700">
          {saving ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : <Save className="w-4 h-4 me-2" />}
          {tr("save")}
        </Button>
      </div>

      <Card className="rounded-3xl border-none shadow-xl shadow-gray-200/50">
        <CardHeader>
          <CardTitle className="text-lg">{tr("mode_title")}</CardTitle>
          <CardDescription>{tr("mode_help")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {MODES.map(({ value, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => change({ mode: value })}
              aria-pressed={settings.mode === value}
              className={cn(
                "rounded-2xl border-2 p-4 text-start transition-colors",
                settings.mode === value ? "border-purple-600 bg-purple-50" : "border-gray-100 hover:border-purple-200"
              )}
            >
              <Icon className={cn("mb-2 w-5 h-5", settings.mode === value ? "text-purple-600" : "text-gray-400")} />
              <p className="font-bold">{tr(`mode_${value}`)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{tr(`mode_${value}_help`)}</p>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-none shadow-xl shadow-gray-200/50">
        <CardHeader>
          <CardTitle className="text-lg">{tr("fields_title")}</CardTitle>
          <CardDescription>{tr("fields_help")}</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          {ruleSelect("city")}
          {ruleSelect("email")}
          {ruleSelect("note")}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-none shadow-xl shadow-gray-200/50">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="text-lg">{tr("custom_title")}</CardTitle>
            <CardDescription className="mt-1">{tr("custom_help")}</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 rounded-xl"
            disabled={settings.customFields.length >= MAX_CUSTOM_FIELDS}
            onClick={() => change({ customFields: [...settings.customFields, { id: crypto.randomUUID().slice(0, 8), label: "", required: false }] })}
          >
            <Plus className="w-4 h-4 me-1" />
            {tr("custom_add")}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {settings.customFields.length === 0 && <p className="rounded-2xl border-2 border-dashed p-6 text-center text-sm text-gray-400">{tr("custom_empty")}</p>}
          {settings.customFields.map((field) => (
            <div key={field.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-100 p-3">
              <Input
                className="h-10 min-w-0 flex-1 rounded-xl"
                dir="auto"
                maxLength={60}
                placeholder={tr("custom_placeholder")}
                aria-label={tr("custom_label")}
                value={field.label}
                onChange={(e) => change({ customFields: settings.customFields.map((f) => (f.id === field.id ? { ...f, label: e.target.value } : f)) })}
              />
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={field.required}
                  onCheckedChange={(required) => change({ customFields: settings.customFields.map((f) => (f.id === field.id ? { ...f, required } : f)) })}
                />
                {tr("rule_required")}
              </label>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-gray-400 hover:bg-red-50 hover:text-red-500"
                aria-label={tr("custom_remove")}
                onClick={() => change({ customFields: settings.customFields.filter((f) => f.id !== field.id) })}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-none shadow-xl shadow-gray-200/50">
        <CardHeader>
          <CardTitle className="text-lg">{tr("button_title")}</CardTitle>
          <CardDescription>{tr("button_help")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="checkout-button-text">{tr("button_text")}</Label>
            <Input
              id="checkout-button-text"
              dir="auto"
              maxLength={40}
              placeholder={tr("button_text_placeholder")}
              value={settings.buttonText}
              onChange={(e) => change({ buttonText: e.target.value })}
            />
          </div>
          <label className="flex items-start justify-between gap-4 rounded-2xl border border-gray-100 p-4">
            <span>
              <span className="block text-sm font-medium">{tr("sticky")}</span>
              <span className="block text-xs text-muted-foreground">{tr("sticky_help")}</span>
            </span>
            <Switch checked={settings.stickyButton} onCheckedChange={(stickyButton) => change({ stickyButton })} />
          </label>
          <label className="flex items-start justify-between gap-4 rounded-2xl border border-gray-100 p-4">
            <span>
              <span className="block text-sm font-medium">{tr("shake")}</span>
              <span className="block text-xs text-muted-foreground">{tr("shake_help")}</span>
            </span>
            <Switch checked={settings.shakeButton} onCheckedChange={(shakeButton) => change({ shakeButton })} />
          </label>
          <div className="flex justify-center rounded-2xl bg-gray-50 p-6">
            <span className={cn("rounded-xl bg-purple-600 px-8 py-3 font-black text-white shadow-lg", settings.shakeButton && "dropy-shake")}>
              {settings.buttonText || tr("button_text_placeholder")}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
