"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ChevronRight, Loader2, MapPin, Palette, Save, ShieldCheck, ShoppingCart, Store, Truck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SettingsForm } from "@/components/profile/SettingsForm";
import { TUNISIAN_GOVERNORATES } from "@/components/storefront/ExpressOrderForm";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/context/LanguageContext";

const SHORTCUTS = [
  { key: "store", href: "/seller/store-builder/settings", icon: Store },
  { key: "checkout", href: "/seller/store-builder/checkout", icon: ShoppingCart },
  { key: "design", href: "/seller/store-builder/themes", icon: Palette },
  { key: "delivery", href: "/seller/store-builder/settings#delivery", icon: Truck },
  { key: "team", href: "/seller/orders/team", icon: Users },
  { key: "protection", href: "/seller/orders/protection", icon: ShieldCheck },
];

type Pickup = { street: string; city: string; governorate: string; contact: string; phone: string };

export default function SellerSettingsPage() {
  const { t } = useTranslation();
  const tr = (key: string) => t(`seller_app.settings_page.${key}`);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [pickup, setPickup] = useState<Pickup>({ street: "", city: "", governorate: "", contact: "", phone: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: store } = await supabase
        .from("stores")
        .select("id, pickup_address, pickup_contact_name, pickup_contact_phone")
        .eq("vendor_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (!store) return;
      setStoreId(store.id);
      const address = (store.pickup_address || {}) as Record<string, string>;
      setPickup({
        street: address.street || "",
        city: address.city || "",
        governorate: address.governorate || "",
        contact: store.pickup_contact_name || "",
        phone: store.pickup_contact_phone || "",
      });
    })();
  }, []);

  const savePickup = async () => {
    if (!storeId) return;
    setSaving(true);
    const { error } = await createClient()
      .from("stores")
      .update({
        pickup_address: { street: pickup.street.trim(), city: pickup.city.trim(), governorate: pickup.governorate, country: "TN" },
        pickup_contact_name: pickup.contact.trim() || null,
        pickup_contact_phone: pickup.phone.trim() || null,
      })
      .eq("id", storeId);
    setSaving(false);
    if (error) toast.error(tr("save_error"));
    else toast.success(tr("saved"));
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{tr("title")}</h1>
        <p className="mt-1 text-gray-500">{tr("subtitle")}</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{tr("store_settings")}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SHORTCUTS.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="group flex items-start gap-3 rounded-2xl border bg-white p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <item.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{tr(`shortcuts.${item.key}`)}</p>
                <p className="text-sm text-muted-foreground">{tr(`shortcuts.${item.key}_desc`)}</p>
              </div>
              <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
            </Link>
          ))}
        </div>
      </section>

      {storeId && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5 text-primary" />
              {tr("pickup_title")}
            </CardTitle>
            <CardDescription>{tr("pickup_help")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="pickup-street">{tr("street")}</Label>
              <Input id="pickup-street" value={pickup.street} onChange={(e) => setPickup({ ...pickup, street: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{tr("governorate")}</Label>
              <Select value={pickup.governorate} onValueChange={(governorate) => setPickup({ ...pickup, governorate })}>
                <SelectTrigger aria-label={tr("governorate")}>
                  <SelectValue placeholder={tr("governorate")} />
                </SelectTrigger>
                <SelectContent>
                  {TUNISIAN_GOVERNORATES.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pickup-city">{tr("city")}</Label>
              <Input id="pickup-city" value={pickup.city} onChange={(e) => setPickup({ ...pickup, city: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pickup-contact">{tr("contact")}</Label>
              <Input id="pickup-contact" value={pickup.contact} onChange={(e) => setPickup({ ...pickup, contact: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pickup-phone">{tr("phone")}</Label>
              <Input id="pickup-phone" type="tel" dir="ltr" value={pickup.phone} onChange={(e) => setPickup({ ...pickup, phone: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Button onClick={savePickup} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {tr("save")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{tr("account")}</h2>
        <SettingsForm />
      </section>
    </div>
  );
}
