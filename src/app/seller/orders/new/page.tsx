"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, Minus, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/context/LanguageContext";
import { TUNISIAN_GOVERNORATES } from "@/components/storefront/ExpressOrderForm";
import { governorateLabel } from "@/lib/storefront-i18n";

type VariantOption = { id: string; label: string; price: number | null; stock: number | null };
type Product = {
  id: string;
  name: string;
  price: number;
  image: string | null;
  stock: number | null;
  hasVariants: boolean;
  variants: VariantOption[];
};
type Line = { key: string; product: Product; variant: VariantOption | null; quantity: number };

const ERROR_KEYS = ["missing_fields", "invalid_phone", "invalid_email", "invalid_cart", "product_unavailable", "variant_required", "out_of_stock", "store_unavailable"];

function money(value: number) {
  return `${value.toFixed(3).replace(/\.?0+$/, "")} TND`;
}

export default function NewManualOrderPage() {
  const { t, language } = useTranslation();
  const tr = (key: string) => t(`seller_app.manual_order.${key}`);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [customer, setCustomer] = useState({ name: "", phone: "", governorate: "", city: "", address: "" });
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: store } = await supabase
        .from("stores")
        .select("id")
        .eq("vendor_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (!store) {
        setLoading(false);
        return;
      }
      const { data: rows } = await supabase
        .from("store_products")
        .select("id, name, selling_price, images, stock_quantity, has_variants, variants")
        .eq("store_id", store.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      const ids = (rows || []).filter((r) => r.has_variants && !(Array.isArray(r.variants) && r.variants.length)).map((r) => r.id);
      const { data: variantRows } = ids.length
        ? await supabase
            .from("store_product_variants")
            .select("id, product_id, price, stock, is_active, values:store_product_variant_values(custom_value, option:variant_options(label, value))")
            .in("product_id", ids)
        : { data: [] as any[] };
      setProducts(
        (rows || []).map((r: any) => {
          const fromJson: VariantOption[] = Array.isArray(r.variants)
            ? r.variants.filter((v: any) => v?.id).map((v: any) => ({ id: v.id, label: String(v.value ?? ""), price: v.price ?? null, stock: v.stock ?? null }))
            : [];
          const fromTable: VariantOption[] = (variantRows || [])
            .filter((v: any) => v.product_id === r.id && v.is_active !== false)
            .map((v: any) => ({
              id: v.id,
              label: (v.values || []).map((x: any) => x.option?.label || x.option?.value || x.custom_value).filter(Boolean).join(" / "),
              price: v.price ?? null,
              stock: v.stock ?? null,
            }));
          return {
            id: r.id,
            name: r.name,
            price: Number(r.selling_price ?? 0),
            image: r.images?.[0] ?? null,
            stock: r.stock_quantity ?? null,
            hasVariants: Boolean(r.has_variants),
            variants: fromJson.length ? fromJson : fromTable,
          };
        })
      );
      setLoading(false);
    })();
  }, []);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (q ? products.filter((p) => p.name.toLowerCase().includes(q)) : products).slice(0, 8);
  }, [products, query]);

  const addProduct = (product: Product) => {
    const variant = product.hasVariants && product.variants.length ? product.variants[0] : null;
    const key = `${product.id}:${variant?.id ?? ""}`;
    setLines((prev) => {
      const existing = prev.find((l) => l.key === key);
      if (existing) return prev.map((l) => (l.key === key ? { ...l, quantity: Math.min(100, l.quantity + 1) } : l));
      return [...prev, { key, product, variant, quantity: 1 }];
    });
  };

  const setVariant = (key: string, variantId: string) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.key !== key) return l;
        const variant = l.product.variants.find((v) => v.id === variantId) || null;
        return { ...l, variant, key: `${l.product.id}:${variant?.id ?? ""}` };
      })
    );
  };

  const setQuantity = (key: string, quantity: number) => {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, quantity: Math.max(1, Math.min(100, quantity)) } : l)));
  };

  const unitPrice = (line: Line) => Number(line.variant?.price ?? line.product.price);
  const subtotal = lines.reduce((sum, l) => sum + unitPrice(l) * l.quantity, 0);
  const canSubmit = lines.length > 0 && customer.name.trim() && customer.phone.replace(/\D/g, "").length >= 8 && customer.governorate && customer.address.trim();

  const submit = async () => {
    if (!canSubmit || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/seller/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cart: lines.map((l) => ({ productId: l.product.id, variantId: l.variant?.id ?? null, quantity: l.quantity })),
          customer: {
            name: customer.name.trim(),
            phone: customer.phone.trim(),
            governorate: customer.governorate,
            city: customer.city.trim() || null,
            address: customer.address.trim(),
          },
          notes,
          confirmed,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        toast.error(ERROR_KEYS.includes(data.code) ? tr(`errors.${data.code}`) : tr("errors.generic"));
        return;
      }
      toast.success(tr("created").replace("{number}", data.orderNumber));
      router.push(`/seller/orders/${data.orderId}`);
    } catch {
      toast.error(tr("errors.generic"));
    } finally {
      setSaving(false);
    }
  };

  const lang = language === "ar" ? "ar" : "fr";

  return (
    <div className="container mx-auto max-w-5xl py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild aria-label={tr("back")}>
          <Link href="/seller/orders">
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{tr("title")}</h1>
          <p className="text-sm text-muted-foreground">{tr("subtitle")}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">{tr("products")}</CardTitle>
              <CardDescription>{tr("products_help")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input className="ps-9" placeholder={tr("search_ph")} value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              {loading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : products.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {tr("no_products")}{" "}
                  <Link href="/seller/products/add" className="font-medium text-primary underline">
                    {tr("add_product")}
                  </Link>
                </p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {matches.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addProduct(p)}
                      className="flex items-center gap-3 rounded-xl border p-2 text-start transition-colors hover:border-primary hover:bg-primary/5"
                    >
                      {p.image ? (
                        <img src={p.image} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                      ) : (
                        <div className="h-12 w-12 shrink-0 rounded-lg bg-muted" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{p.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {money(p.price)}
                          {p.stock != null && ` · ${tr("stock")} ${p.stock}`}
                        </span>
                      </span>
                      <Plus className="w-4 h-4 shrink-0 text-primary" />
                    </button>
                  ))}
                </div>
              )}

              {lines.length > 0 && (
                <div className="divide-y rounded-xl border">
                  {lines.map((line) => (
                    <div key={line.key} className="flex flex-wrap items-center gap-3 p-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{line.product.name}</p>
                        <p className="text-xs text-muted-foreground">{money(unitPrice(line))}</p>
                      </div>
                      {line.product.hasVariants && line.product.variants.length > 0 && (
                        <Select value={line.variant?.id ?? ""} onValueChange={(v) => setVariant(line.key, v)}>
                          <SelectTrigger className="h-9 w-40" aria-label={tr("variant")}>
                            <SelectValue placeholder={tr("variant")} />
                          </SelectTrigger>
                          <SelectContent>
                            {line.product.variants.map((v) => (
                              <SelectItem key={v.id} value={v.id}>
                                {v.label || "—"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="h-8 w-8" aria-label={tr("less")} disabled={line.quantity <= 1} onClick={() => setQuantity(line.key, line.quantity - 1)}>
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-semibold tabular-nums">{line.quantity}</span>
                        <Button variant="outline" size="icon" className="h-8 w-8" aria-label={tr("more")} onClick={() => setQuantity(line.key, line.quantity + 1)}>
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        aria-label={tr("remove")}
                        onClick={() => setLines((prev) => prev.filter((l) => l.key !== line.key))}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">{tr("customer")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="mo-name">{tr("name")}</Label>
                <Input id="mo-name" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mo-phone">{tr("phone")}</Label>
                <Input id="mo-phone" type="tel" inputMode="tel" dir="ltr" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{tr("governorate")}</Label>
                <Select value={customer.governorate} onValueChange={(v) => setCustomer({ ...customer, governorate: v })}>
                  <SelectTrigger aria-label={tr("governorate")}>
                    <SelectValue placeholder={tr("governorate")} />
                  </SelectTrigger>
                  <SelectContent>
                    {TUNISIAN_GOVERNORATES.map((g) => (
                      <SelectItem key={g} value={g}>
                        {governorateLabel(g, lang)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mo-city">{tr("city")}</Label>
                <Input id="mo-city" value={customer.city} onChange={(e) => setCustomer({ ...customer, city: e.target.value })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="mo-address">{tr("address")}</Label>
                <Input id="mo-address" value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="mo-notes">{tr("notes")}</Label>
                <Textarea id="mo-notes" rows={2} placeholder={tr("notes_ph")} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit rounded-2xl lg:sticky lg:top-6">
          <CardHeader>
            <CardTitle className="text-lg">{tr("summary")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{tr("subtotal")}</span>
              <span className="font-semibold tabular-nums">{money(subtotal)}</span>
            </div>
            <p className="text-xs text-muted-foreground">{tr("total_note")}</p>
            <label className="flex items-start justify-between gap-3 rounded-xl border p-3">
              <span>
                <span className="block text-sm font-medium">{tr("confirmed")}</span>
                <span className="block text-xs text-muted-foreground">{tr("confirmed_help")}</span>
              </span>
              <Switch checked={confirmed} onCheckedChange={setConfirmed} aria-label={tr("confirmed")} />
            </label>
            <Button className="w-full" size="lg" disabled={!canSubmit || saving} onClick={submit}>
              {saving && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
              {tr("create")}
            </Button>
            {!canSubmit && <p className="text-xs text-muted-foreground">{tr("required_hint")}</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
