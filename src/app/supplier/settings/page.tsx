"use client";

import { useTranslation } from "@/context/LanguageContext";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, MapPin, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SettingsForm } from "@/components/profile/SettingsForm";
import { TUNISIAN_GOVERNORATES } from "@/components/storefront/ExpressOrderForm";
import { createClient } from "@/lib/supabase/client";

type Pickup = { street: string; city: string; governorate: string; contact: string; notes: string };

export default function SettingsPage() {
  const { t: tt } = useTranslation();
  const tr = (key: string) => tt(`supplier_app.settings.${key}`);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [pickup, setPickup] = useState<Pickup>({ street: "", city: "", governorate: "", contact: "", notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("supplier_profiles")
        .select("id, pickup_address, contact_name, pickup_notes")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!data) return;
      setProfileId(data.id);
      const address = (data.pickup_address || {}) as Record<string, string>;
      setPickup({
        street: address.street || "",
        city: address.city || "",
        governorate: address.governorate || "",
        contact: data.contact_name || "",
        notes: data.pickup_notes || "",
      });
    })();
  }, []);

  const save = async () => {
    if (!profileId) return;
    if (!pickup.street.trim() || !pickup.governorate) {
      toast.error(tr("indiquez_au_moins_l_adresse"));
      return;
    }
    setSaving(true);
    const { error } = await createClient()
      .from("supplier_profiles")
      .update({
        pickup_address: { street: pickup.street.trim(), city: pickup.city.trim(), governorate: pickup.governorate, country: "TN" },
        contact_name: pickup.contact.trim() || null,
        pickup_notes: pickup.notes.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profileId);
    setSaving(false);
    if (error) toast.error(tr("impossible_d_enregistrer_reessayez"));
    else toast.success(tr("adresse_d_enlevement_enregistree"));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{tr("parametres")}</h1>
        <p className="text-muted-foreground">Votre adresse d&apos;enlèvement, votre compte et vos coordonnées de paiement.</p>
      </div>

      {profileId && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5 text-primary" />
              Adresse d&apos;enlèvement
            </CardTitle>
            <CardDescription>{tr("le_livreur_dropy_vient_recuperer")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="pickup-street">{tr("adresse")}</Label>
              <Input id="pickup-street" value={pickup.street} onChange={(e) => setPickup({ ...pickup, street: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{tr("gouvernorat")}</Label>
              <Select value={pickup.governorate} onValueChange={(governorate) => setPickup({ ...pickup, governorate })}>
                <SelectTrigger aria-label={tr("gouvernorat")}>
                  <SelectValue placeholder={tr("gouvernorat")} />
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
              <Label htmlFor="pickup-city">{tr("ville_delegation")}</Label>
              <Input id="pickup-city" value={pickup.city} onChange={(e) => setPickup({ ...pickup, city: e.target.value })} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="pickup-contact">{tr("personne_a_contacter_sur_place")}</Label>
              <Input id="pickup-contact" value={pickup.contact} onChange={(e) => setPickup({ ...pickup, contact: e.target.value })} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="pickup-notes">{tr("instructions_pour_le_livreur_facultatif")}</Label>
              <Textarea id="pickup-notes" rows={2} placeholder={tr("horaires_etage_repere")} value={pickup.notes} onChange={(e) => setPickup({ ...pickup, notes: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Button onClick={save} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Enregistrer l&apos;adresse
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <SettingsForm />
    </div>
  );
}
