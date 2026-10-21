"use client";

import { useState } from "react";
import { Loader2, Minus, Plus, ShieldCheck, Truck } from "lucide-react";

export const TUNISIAN_GOVERNORATES = [
  "Ariana", "Béja", "Ben Arous", "Bizerte", "Gabès", "Gafsa", "Jendouba", "Kairouan", "Kasserine", "Kébili",
  "Le Kef", "Mahdia", "La Manouba", "Médenine", "Monastir", "Nabeul", "Sfax", "Sidi Bouzid", "Siliana",
  "Sousse", "Tataouine", "Tozeur", "Tunis", "Zaghouan",
];

type Props = {
  storeId?: string;
  productId?: string;
  variantId?: string | null;
  unitPrice: number;
  beforeSubmit?: () => boolean;
  onOrdered: (orderId: string, total: number, quantity: number) => void;
  onStart?: () => void;
  title?: string;
  buttonText?: string;
  preview?: boolean;
};

const formatTnd = (value: number) => `${value.toFixed(3).replace(".", ",")} DT`;

export function ExpressOrderForm({
  storeId,
  productId,
  variantId,
  unitPrice,
  beforeSubmit,
  onOrdered,
  onStart,
  title,
  buttonText,
  preview,
}: Props) {
  const [form, setForm] = useState({ name: "", phone: "", governorate: "", city: "", address: "" });
  const [quantity, setQuantity] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);

  const update = (field: keyof typeof form, value: string) => {
    if (!started) {
      setStarted(true);
      onStart?.();
    }
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = "Indiquez votre nom.";
    const digits = form.phone.replace(/\D/g, "").replace(/^216/, "");
    if (!/^[2-9]\d{7}$/.test(digits)) next.phone = "Numéro tunisien à 8 chiffres.";
    if (!form.governorate) next.governorate = "Choisissez votre gouvernorat.";
    if (form.address.trim().length < 5) next.address = "Indiquez votre adresse.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    if (beforeSubmit && !beforeSubmit()) return;
    if (!validate()) return;
    if (preview || !storeId || !productId) {
      setServerError("Aperçu : la commande n'est pas envoyée depuis l'éditeur.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/store/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          cart: [{ productId, variantId: variantId || null, quantity }],
          customer: {
            name: form.name.trim(),
            phone: form.phone.replace(/\D/g, "").replace(/^216/, ""),
            governorate: form.governorate,
            city: form.city.trim() || null,
            address: [form.address.trim(), form.city.trim(), form.governorate].filter(Boolean).join(", "),
          },
          paymentMethod: "cod",
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.success) onOrdered(data.orderId, unitPrice * quantity, quantity);
      else setServerError(data.error || "La commande n'a pas pu être envoyée. Réessayez.");
    } catch {
      setServerError("Problème de connexion. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  };

  const field = "w-full rounded-xl border border-border bg-background px-4 py-3 text-base outline-none focus:ring-2 ring-primary";
  const total = unitPrice * quantity;

  return (
    <form onSubmit={submit} className="space-y-3 rounded-3xl border-2 border-primary/30 bg-card p-4 md:p-6 shadow-lg" noValidate>
      <p className="text-lg font-black text-center">{title || "Commandez maintenant, payez à la livraison"}</p>

      <div>
        <input className={field} placeholder="Nom et prénom" autoComplete="name" value={form.name} onChange={(e) => update("name", e.target.value)} />
        {errors.name && <p className="mt-1 text-xs font-medium text-red-600">{errors.name}</p>}
      </div>
      <div>
        <input
          className={field}
          placeholder="Téléphone (ex. 22 123 456)"
          inputMode="tel"
          autoComplete="tel"
          dir="ltr"
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
        />
        {errors.phone && <p className="mt-1 text-xs font-medium text-red-600">{errors.phone}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <select className={field} value={form.governorate} onChange={(e) => update("governorate", e.target.value)}>
            <option value="">Gouvernorat</option>
            {TUNISIAN_GOVERNORATES.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          {errors.governorate && <p className="mt-1 text-xs font-medium text-red-600">{errors.governorate}</p>}
        </div>
        <input className={field} placeholder="Ville / délégation" value={form.city} onChange={(e) => update("city", e.target.value)} />
      </div>
      <div>
        <input className={field} placeholder="Adresse (rue, numéro, repère)" autoComplete="street-address" value={form.address} onChange={(e) => update("address", e.target.value)} />
        {errors.address && <p className="mt-1 text-xs font-medium text-red-600">{errors.address}</p>}
      </div>

      <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3">
        <div className="flex items-center gap-3">
          <button type="button" aria-label="Moins" className="h-9 w-9 rounded-lg bg-background border border-border flex items-center justify-center disabled:opacity-40" disabled={quantity <= 1} onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-6 text-center font-black">{quantity}</span>
          <button type="button" aria-label="Plus" className="h-9 w-9 rounded-lg bg-background border border-border flex items-center justify-center disabled:opacity-40" disabled={quantity >= 10} onClick={() => setQuantity((q) => Math.min(10, q + 1))}>
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="text-end">
          <p className="text-xs opacity-60">Total</p>
          <p className="text-xl font-black">{formatTnd(total)}</p>
        </div>
      </div>

      {serverError && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{serverError}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-2xl bg-primary py-4 text-lg font-black text-primary-foreground shadow-xl transition-transform hover:scale-[1.01] active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : buttonText || "Commander maintenant"}
      </button>

      <div className="flex items-center justify-center gap-4 text-xs opacity-70">
        <span className="flex items-center gap-1"><Truck className="h-3.5 w-3.5" />Livraison partout en Tunisie</span>
        <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" />Paiement à la livraison</span>
      </div>
    </form>
  );
}
