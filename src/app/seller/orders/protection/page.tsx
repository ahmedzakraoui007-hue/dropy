"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Loader2, Monitor, Plus, Save, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/context/LanguageContext";
import { normalizeProtection, phoneKey } from "@/lib/order-protection";

type BlockEntry = { id: string; kind: "phone" | "ip"; value: string; note: string | null; created_at: string };

export default function OrderProtectionPage() {
  const { t } = useTranslation();
  const tr = (key: string) => t(`seller_app.protection.${key}`);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [maxQuantity, setMaxQuantity] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [blockDesktop, setBlockDesktop] = useState(false);
  const [entries, setEntries] = useState<BlockEntry[]>([]);
  const [kind, setKind] = useState<"phone" | "ip">("phone");
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: store } = await supabase
      .from("stores")
      .select("id, order_protection")
      .eq("vendor_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!store) {
      setLoading(false);
      return;
    }
    setStoreId(store.id);
    const protection = normalizeProtection(store.order_protection);
    setMaxQuantity(protection.maxQuantity ? String(protection.maxQuantity) : "");
    setMaxAmount(protection.maxAmount ? String(protection.maxAmount) : "");
    setBlockDesktop(protection.blockDesktop);
    const { data } = await supabase
      .from("store_blocklist")
      .select("id, kind, value, note, created_at")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false });
    setEntries((data as BlockEntry[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveSettings = async () => {
    if (!storeId) return;
    setSaving(true);
    const order_protection = normalizeProtection({ maxQuantity, maxAmount: maxAmount.replace(",", "."), blockDesktop });
    const { error } = await createClient().from("stores").update({ order_protection }).eq("id", storeId);
    setSaving(false);
    if (error) toast.error(tr("save_error"));
    else toast.success(tr("saved"));
  };

  const addEntry = async () => {
    if (!storeId) return;
    const cleaned = kind === "phone" ? phoneKey(value) : value.trim();
    if (kind === "phone" ? !/^\d{8}$/.test(cleaned) : !/^[0-9a-f:.]{3,64}$/i.test(cleaned)) {
      toast.error(tr(kind === "phone" ? "invalid_phone" : "invalid_ip"));
      return;
    }
    setAdding(true);
    const { data, error } = await createClient()
      .from("store_blocklist")
      .upsert({ store_id: storeId, kind, value: cleaned, note: note.trim() || null }, { onConflict: "store_id,kind,value" })
      .select("id, kind, value, note, created_at")
      .single();
    setAdding(false);
    if (error) {
      toast.error(tr("save_error"));
      return;
    }
    setEntries((prev) => [data as BlockEntry, ...prev.filter((e) => e.id !== data.id)]);
    setValue("");
    setNote("");
  };

  const removeEntry = async (entry: BlockEntry) => {
    const { error } = await createClient().from("store_blocklist").delete().eq("id", entry.id);
    if (error) {
      toast.error(tr("save_error"));
      return;
    }
    setEntries((prev) => prev.filter((e) => e.id !== entry.id));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl space-y-6 py-6">
      <div className="space-y-2">
        <Link href="/seller/orders" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t("seller_app.leads.back")}
        </Link>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <ShieldCheck className="h-6 w-6 text-emerald-600" />
          {tr("title")}
        </h1>
        <p className="text-sm text-muted-foreground">{tr("subtitle")}</p>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">{tr("limits")}</CardTitle>
          <CardDescription>{tr("limits_help")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="max-quantity">{tr("max_quantity")}</Label>
              <Input id="max-quantity" type="number" min={1} inputMode="numeric" placeholder={tr("no_limit")} value={maxQuantity} onChange={(e) => setMaxQuantity(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-amount">{tr("max_amount")}</Label>
              <Input id="max-amount" type="number" min={1} inputMode="decimal" placeholder={tr("no_limit")} value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} />
            </div>
          </div>
          <label className="flex items-start justify-between gap-4 rounded-xl border p-4">
            <span className="flex gap-3">
              <Monitor className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
              <span>
                <span className="block text-sm font-semibold">{tr("block_desktop")}</span>
                <span className="block text-xs text-muted-foreground">{tr("block_desktop_help")}</span>
              </span>
            </span>
            <Switch checked={blockDesktop} onCheckedChange={setBlockDesktop} />
          </label>
          <Button onClick={saveSettings} disabled={saving} className="rounded-xl">
            {saving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Save className="me-2 h-4 w-4" />}
            {tr("save")}
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">{tr("blocklist")}</CardTitle>
          <CardDescription>{tr("blocklist_help")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-[140px_1fr_1fr_auto]">
            <Select value={kind} onValueChange={(v) => setKind(v as "phone" | "ip")}>
              <SelectTrigger className="w-full" aria-label={tr("kind")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="phone">{tr("kind_phone")}</SelectItem>
                <SelectItem value="ip">{tr("kind_ip")}</SelectItem>
              </SelectContent>
            </Select>
            <Input dir="ltr" value={value} onChange={(e) => setValue(e.target.value)} placeholder={kind === "phone" ? "22 123 456" : "196.203.0.1"} aria-label={tr("value")} />
            <Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={120} placeholder={tr("note_ph")} aria-label={tr("note_ph")} />
            <Button onClick={addEntry} disabled={adding || !value.trim()}>
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 sm:me-1" />}
              <span className="sm:inline">{tr("add")}</span>
            </Button>
          </div>
          {entries.length === 0 ? (
            <p className="rounded-xl bg-muted/50 p-6 text-center text-sm text-muted-foreground">{tr("empty")}</p>
          ) : (
            <ul className="divide-y rounded-xl border">
              {entries.map((entry) => (
                <li key={entry.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold">{tr(entry.kind === "phone" ? "kind_phone" : "kind_ip")}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-mono text-sm" dir="ltr">{entry.value}</span>
                    {entry.note && <span className="block truncate text-xs text-muted-foreground">{entry.note}</span>}
                  </span>
                  <Button variant="ghost" size="icon" className="text-red-600" onClick={() => removeEntry(entry)} aria-label={tr("remove")}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-muted-foreground">{tr("blocklist_tip")}</p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-amber-200 bg-amber-50/50">
        <CardHeader>
          <CardTitle className="text-lg">{tr("flags_title")}</CardTitle>
          <CardDescription>{tr("flags_help")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1 ps-5 text-sm">
            <li>{tr("flags.repeat_phone")}</li>
            <li>{tr("flags.previous_fake")}</li>
            <li>{tr("flags.ip_burst")}</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
