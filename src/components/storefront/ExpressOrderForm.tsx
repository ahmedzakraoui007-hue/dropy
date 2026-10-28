"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Minus, Plus, ShieldCheck, Truck } from "lucide-react";
import { deliveryFeeFor, discountedUnitPrice, offerPercentFor, roundMoney, type QuantityOffer } from "@/lib/store-pricing";
import { governorateLabel, orderErrorText } from "@/lib/storefront-i18n";
import { useStoreText } from "@/components/storefront/StoreLanguage";
import { TurnstileWidget } from "@/components/storefront/TurnstileWidget";
import { CheckoutExtraFields } from "@/components/storefront/CheckoutExtraFields";
import { checkExtras, emptyExtras, normalizeCheckout, type CheckoutSettings, type ExtrasError } from "@/lib/checkout-settings";

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
  offers?: QuantityOffer[];
  delivery?: { delivery_fee?: number | string | null; free_delivery_threshold?: number | string | null };
  checkout?: CheckoutSettings;
  upsell?: { productId: string; name: string; image?: string | null; price: number; regularPrice: number } | null;
};

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
  offers = [],
  delivery = {},
  checkout = normalizeCheckout({}),
  upsell = null,
}: Props) {
  const { t, money: formatTnd, lang } = useStoreText();
  const [form, setForm] = useState({ name: "", phone: "", governorate: "", city: "", address: "" });
  const [quantity, setQuantity] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const leadIdRef = useRef<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const submittedRef = useRef(false);
  const [extras, setExtras] = useState(emptyExtras);
  const [extraErrors, setExtraErrors] = useState<ExtrasError[]>([]);
  const [withUpsell, setWithUpsell] = useState(false);

  useEffect(() => {
    if (preview || !storeId || !productId || submittedRef.current) return;
    const phone = form.phone.replace(/\D/g, "").replace(/^216/, "");
    if (!/^[2-9]\d{7}$/.test(phone)) return;
    const timer = setTimeout(() => {
      if (submittedRef.current) return;
      fetch("/api/store/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, productId, variantId: variantId || null, quantity, leadId: leadIdRef.current, ...form, phone }),
        keepalive: true,
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.leadId) leadIdRef.current = data.leadId;
        })
        .catch(() => {});
    }, 1500);
    return () => clearTimeout(timer);
  }, [form, quantity, variantId, preview, storeId, productId]);

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
    if (form.name.trim().length < 2) next.name = t("express.err_name");
    const digits = form.phone.replace(/\D/g, "").replace(/^216/, "");
    if (!/^[2-9]\d{7}$/.test(digits)) next.phone = t("express.err_phone");
    if (!form.governorate) next.governorate = t("express.err_governorate");
    if (form.address.trim().length < 5) next.address = t("express.err_address");
    const extraIssues = checkExtras(checkout, { ...extras, city: form.city });
    setErrors(next);
    setExtraErrors(extraIssues);
    return Object.keys(next).length === 0 && extraIssues.length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    if (beforeSubmit && !beforeSubmit()) return;
    if (!validate()) return;
    if (preview || !storeId || !productId) {
      setServerError(t("express.preview"));
      return;
    }

    setSubmitting(true);
    submittedRef.current = true;
    try {
      const response = await fetch("/api/store/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          cart: [
            { productId, variantId: variantId || null, quantity },
            ...(upsell && withUpsell ? [{ productId: upsell.productId, variantId: null, quantity: 1, upsellOf: productId }] : []),
          ],
          customer: {
            name: form.name.trim(),
            phone: form.phone.replace(/\D/g, "").replace(/^216/, ""),
            governorate: form.governorate,
            city: checkout.city === "hidden" ? null : form.city.trim() || null,
            address: form.address.trim(),
            email: checkout.email === "hidden" ? null : extras.email.trim() || null,
          },
          extras: { note: extras.note, answers: extras.answers },
          paymentMethod: "cod",
          turnstileToken,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.success) onOrdered(data.orderId, Number(data.totalAmount ?? total), quantity);
      else {
        submittedRef.current = false;
        setServerError(orderErrorText(data.code, t));
      }
    } catch {
      submittedRef.current = false;
      setServerError(t("express.network"));
    } finally {
      setSubmitting(false);
    }
  };

  const field = "w-full rounded-xl border border-border bg-background px-4 py-3 text-base outline-none focus:ring-2 ring-primary";
  const lineUnit = discountedUnitPrice(unitPrice, quantity, offers);
  const upsellAmount = upsell && withUpsell ? upsell.price : 0;
  const merchandise = roundMoney(lineUnit * quantity + upsellAmount);
  const shipping = deliveryFeeFor(merchandise, delivery);
  const total = roundMoney(merchandise + shipping);
  const savedPercent = offerPercentFor(quantity, offers);
  const quantityChoices = offers.length ? [1, ...offers.map((o) => o.min_quantity)] : [];

  return (
    <form onSubmit={submit} className="space-y-3 rounded-3xl border-2 border-primary/30 bg-card p-4 md:p-6 shadow-lg" noValidate>
      <p className="text-lg font-black text-center">{title || t("express.title")}</p>

      <div>
        <input className={field} placeholder={t("express.name")} aria-label={t("express.name")} autoComplete="name" value={form.name} onChange={(e) => update("name", e.target.value)} />
        {errors.name && <p className="mt-1 text-xs font-medium text-red-600">{errors.name}</p>}
      </div>
      <div>
        <input
          className={field}
          placeholder={t("express.phone")}
          aria-label={t("express.phone")}
          inputMode="tel"
          autoComplete="tel"
          dir="ltr"
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
        />
        {errors.phone && <p className="mt-1 text-xs font-medium text-red-600">{errors.phone}</p>}
        <p className="mt-1 text-[11px] opacity-60">{t("express.privacy")}</p>
      </div>
      <div className={checkout.city === "hidden" ? "" : "grid grid-cols-2 gap-3"}>
        <div>
          <select className={field} aria-label={t("express.governorate")} value={form.governorate} onChange={(e) => update("governorate", e.target.value)}>
            <option value="">{t("express.governorate")}</option>
            {TUNISIAN_GOVERNORATES.map((g) => (
              <option key={g} value={g}>{governorateLabel(g, lang)}</option>
            ))}
          </select>
          {errors.governorate && <p className="mt-1 text-xs font-medium text-red-600">{errors.governorate}</p>}
        </div>
        {checkout.city !== "hidden" && (
          <div>
            <input
              className={field}
              placeholder={checkout.city === "optional" ? `${t("express.city")} (${t("form.optional")})` : t("express.city")}
              aria-label={t("express.city")}
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
            />
            {extraErrors.includes("city") && <p className="mt-1 text-xs font-medium text-red-600">{t("form.required")}</p>}
          </div>
        )}
      </div>
      <div>
        <input className={field} placeholder={t("express.address")} aria-label={t("express.address")} autoComplete="street-address" value={form.address} onChange={(e) => update("address", e.target.value)} />
        {errors.address && <p className="mt-1 text-xs font-medium text-red-600">{errors.address}</p>}
      </div>
      <CheckoutExtraFields
        settings={checkout}
        value={extras}
        onChange={(next) => {
          setExtras(next);
          setExtraErrors([]);
        }}
        errors={extraErrors}
        fieldClass={field}
        showCity={false}
      />

      {quantityChoices.length > 0 && (
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${quantityChoices.length}, minmax(0, 1fr))` }}>
          {quantityChoices.map((choice) => {
            const percent = offerPercentFor(choice, offers);
            const price = roundMoney(discountedUnitPrice(unitPrice, choice, offers) * choice);
            const active = quantity === choice;
            return (
              <button
                key={choice}
                type="button"
                onClick={() => setQuantity(choice)}
                className={`relative rounded-xl border-2 px-2 py-3 text-center transition-colors ${active ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
              >
                {percent > 0 && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-2 py-0.5 text-[10px] font-black text-primary-foreground">
                    -{percent}%
                  </span>
                )}
                <span className="block text-sm font-black">{choice} {choice > 1 ? t("pieces") : t("piece")}</span>
                <span className="block text-xs opacity-70">{formatTnd(price)}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3">
        <div className="flex items-center gap-3">
          <button type="button" aria-label={t("express.less")} className="h-9 w-9 rounded-lg bg-background border border-border flex items-center justify-center disabled:opacity-40" disabled={quantity <= 1} onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-6 text-center font-black">{quantity}</span>
          <button type="button" aria-label={t("express.more")} className="h-9 w-9 rounded-lg bg-background border border-border flex items-center justify-center disabled:opacity-40" disabled={quantity >= 10} onClick={() => setQuantity((q) => Math.min(10, q + 1))}>
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="text-end">
          <p className="text-xs opacity-60">
            {shipping > 0 ? t("express.delivery", { amount: formatTnd(shipping) }) : t("express.free_delivery")}
            {savedPercent > 0 && ` · -${savedPercent}%`}
          </p>
          <p className="text-xl font-black">{formatTnd(total)}</p>
        </div>
      </div>

      {upsell && (
        <button
          type="button"
          onClick={() => setWithUpsell((v) => !v)}
          aria-pressed={withUpsell}
          className={`flex w-full items-center gap-3 rounded-xl border-2 border-dashed p-3 text-start transition-colors ${withUpsell ? "border-primary bg-primary/5" : "border-primary/40 hover:border-primary"}`}
        >
          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${withUpsell ? "border-primary bg-primary text-primary-foreground" : "border-primary/50"}`}>
            {withUpsell && <Check className="h-4 w-4" />}
          </span>
          {upsell.image && <img src={upsell.image} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />}
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-bold uppercase tracking-wide text-primary">{t("express.upsell_title")}</span>
            <span className="block truncate text-sm font-bold">{upsell.name}</span>
            <span className="block text-xs">
              {t("express.upsell_add", { price: formatTnd(upsell.price) })}
              {upsell.regularPrice > upsell.price && <span className="ms-1 line-through opacity-50">{formatTnd(upsell.regularPrice)}</span>}
            </span>
          </span>
        </button>
      )}

      <TurnstileWidget onToken={setTurnstileToken} lang={lang} />

      {serverError && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{serverError}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-2xl bg-primary py-4 text-lg font-black text-primary-foreground shadow-xl transition-transform hover:scale-[1.01] active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : buttonText || checkout.buttonText || t("express.button")}
      </button>

      <div className="flex items-center justify-center gap-4 text-xs opacity-70">
        <span className="flex items-center gap-1"><Truck className="h-3.5 w-3.5" />{t("trust.delivery")}</span>
        <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" />{t("trust.cod")}</span>
      </div>
    </form>
  );
}
