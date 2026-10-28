"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/context/LanguageContext";
import { formatPrice } from "@/lib/utils";
import { ResultRow, ToolShell, parseAmount } from "@/components/tools/ToolShell";

const FIELDS = [
  { key: "price", init: "79", suffix: "DT" },
  { key: "cost", init: "40", suffix: "DT" },
  { key: "delivery", init: "8", suffix: "DT" },
  { key: "return_cost", init: "8", suffix: "DT" },
  { key: "ad_cost", init: "10", suffix: "DT" },
  { key: "confirm_rate", init: "70", suffix: "%" },
  { key: "delivery_rate", init: "80", suffix: "%" },
] as const;

type Key = (typeof FIELDS)[number]["key"];

export default function MargeEcommerceCalculator() {
  const { t } = useTranslation();
  const tr = (key: string) => t(`tools.calcul-marge-ecommerce.${key}`);
  const [values, setValues] = useState<Record<Key, string>>(() => Object.fromEntries(FIELDS.map((f) => [f.key, f.init])) as Record<Key, string>);
  const v = (k: Key) => parseAmount(values[k]);

  const confirm = Math.min(100, v("confirm_rate")) / 100;
  const deliver = Math.min(100, v("delivery_rate")) / 100;
  const delivered = confirm * deliver;
  const returned = confirm * (1 - deliver);
  const perOrder = delivered * (v("price") - v("cost") - v("delivery")) - returned * v("return_cost") - v("ad_cost");
  const perDelivered = delivered > 0 ? perOrder / delivered : 0;
  const breakEvenAd = delivered * (v("price") - v("cost") - v("delivery")) - returned * v("return_cost");

  return (
    <ToolShell slug="calcul-marge-ecommerce">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="grid gap-4 rounded-3xl border border-slate-100 p-6 shadow-sm sm:grid-cols-2">
          {FIELDS.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label htmlFor={f.key} className="text-xs">{tr(f.key)}</Label>
              <div className="flex items-center gap-2">
                <Input id={f.key} inputMode="decimal" value={values[f.key]} onChange={(e) => setValues((prev) => ({ ...prev, [f.key]: e.target.value }))} dir="ltr" />
                <span className="w-6 text-sm font-bold text-slate-400">{f.suffix}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-3xl bg-slate-50 p-6">
          <p className="mb-2 text-sm font-black uppercase tracking-widest text-slate-400">{t("tools.calcul-tva.result")}</p>
          <ResultRow label={tr("per_100")} value={`${Math.round(delivered * 100)} / ${Math.round(returned * 100)}`} />
          <ResultRow label={tr("profit_order")} value={formatPrice(perOrder)} />
          <ResultRow label={tr("max_ad")} value={formatPrice(Math.max(0, breakEvenAd))} />
          <ResultRow label={tr("profit_delivered")} value={formatPrice(perDelivered)} strong />
          <p className={`mt-4 rounded-xl p-3 text-sm font-medium ${perOrder >= 0 ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
            {tr(perOrder >= 0 ? "verdict_ok" : "verdict_loss")}
          </p>
        </div>
      </div>
    </ToolShell>
  );
}
