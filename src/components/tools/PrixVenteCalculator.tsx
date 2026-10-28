"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/context/LanguageContext";
import { cn, formatPrice } from "@/lib/utils";
import { ResultRow, ToolShell, parseAmount } from "@/components/tools/ToolShell";

const RATES = [19, 13, 7, 0];

export default function PrixVenteCalculator() {
  const { t } = useTranslation();
  const tr = (key: string) => t(`tools.calcul-prix-de-vente.${key}`);
  const [cost, setCost] = useState("40");
  const [percent, setPercent] = useState("50");
  const [mode, setMode] = useState<"marge" | "marque">("marge");
  const [rate, setRate] = useState(0);

  const c = parseAmount(cost);
  const p = parseAmount(percent) / 100;
  const priceHt = mode === "marge" ? c * (1 + p) : p < 1 ? c / (1 - p) : 0;
  const margin = priceHt - c;
  const ttc = priceHt * (1 + rate / 100);
  const marginRate = c > 0 ? (margin / c) * 100 : 0;
  const markRate = priceHt > 0 ? (margin / priceHt) * 100 : 0;
  const pct = (v: number) => `${v.toFixed(1).replace(".", ",")} %`;

  return (
    <ToolShell slug="calcul-prix-de-vente">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-5 rounded-3xl border border-slate-100 p-6 shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="cost">{tr("cost")}</Label>
            <Input id="cost" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} className="h-12 text-lg" dir="ltr" />
          </div>
          <div className="flex rounded-xl bg-slate-100 p-1">
            {(["marge", "marque"] as const).map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)} className={cn("flex-1 rounded-lg py-2 text-sm font-bold", mode === m ? "bg-white shadow-sm" : "text-slate-500")}>
                {tr(`mode_${m}`)}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="percent">{tr(`percent_${mode}`)}</Label>
            <div className="flex items-center gap-2">
              <Input id="percent" inputMode="decimal" value={percent} onChange={(e) => setPercent(e.target.value)} className="h-12 text-lg" dir="ltr" />
              <span className="font-bold text-slate-500">%</span>
            </div>
            <p className="text-xs text-slate-500">{tr(`help_${mode}`)}</p>
          </div>
          <div className="space-y-2">
            <Label>{t("tools.calcul-tva.rate")}</Label>
            <div className="grid grid-cols-4 gap-2">
              {RATES.map((r) => (
                <button key={r} type="button" onClick={() => setRate(r)} className={cn("rounded-xl border-2 py-2 font-bold", rate === r ? "border-[#2E3192] bg-[#2E3192]/5 text-[#2E3192]" : "border-slate-200 text-slate-600")}>
                  {r} %
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="rounded-3xl bg-slate-50 p-6">
          <p className="mb-2 text-sm font-black uppercase tracking-widest text-slate-400">{t("tools.calcul-tva.result")}</p>
          <ResultRow label={tr("price_ht")} value={formatPrice(priceHt)} />
          {rate > 0 && <ResultRow label={tr("price_ttc")} value={formatPrice(ttc)} />}
          <ResultRow label={tr("margin")} value={formatPrice(margin)} />
          <ResultRow label={tr("margin_rate")} value={pct(marginRate)} />
          <ResultRow label={tr("mark_rate")} value={pct(markRate)} />
          <ResultRow label={tr("final_price")} value={formatPrice(rate > 0 ? ttc : priceHt)} strong />
          {mode === "marque" && p >= 1 && <p className="mt-3 text-sm font-medium text-red-600">{tr("mark_invalid")}</p>}
        </div>
      </div>
    </ToolShell>
  );
}
