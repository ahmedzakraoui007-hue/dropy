"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/context/LanguageContext";
import { cn, formatPrice } from "@/lib/utils";
import { ResultRow, ToolShell, parseAmount } from "@/components/tools/ToolShell";

const RATES = [19, 13, 7, 0];

export default function TvaCalculator() {
  const { t } = useTranslation();
  const tr = (key: string) => t(`tools.calcul-tva.${key}`);
  const [mode, setMode] = useState<"ht" | "ttc">("ht");
  const [amount, setAmount] = useState("100");
  const [rate, setRate] = useState(19);
  const [fodec, setFodec] = useState(false);
  const [fodecRate, setFodecRate] = useState("1");

  const value = parseAmount(amount);
  const f = fodec ? parseAmount(fodecRate) / 100 : 0;
  const factor = (1 + f) * (1 + rate / 100);
  const ht = mode === "ht" ? value : value / factor;
  const fodecAmount = ht * f;
  const tva = (ht + fodecAmount) * (rate / 100);
  const ttc = ht + fodecAmount + tva;

  return (
    <ToolShell slug="calcul-tva">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-5 rounded-3xl border border-slate-100 p-6 shadow-sm">
          <div className="flex rounded-xl bg-slate-100 p-1">
            {(["ht", "ttc"] as const).map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)} className={cn("flex-1 rounded-lg py-2 text-sm font-bold", mode === m ? "bg-white shadow-sm" : "text-slate-500")}>
                {tr(`from_${m}`)}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">{tr(mode === "ht" ? "amount_ht" : "amount_ttc")}</Label>
            <Input id="amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-12 text-lg" dir="ltr" />
          </div>
          <div className="space-y-2">
            <Label>{tr("rate")}</Label>
            <div className="grid grid-cols-4 gap-2">
              {RATES.map((r) => (
                <button key={r} type="button" onClick={() => setRate(r)} className={cn("rounded-xl border-2 py-2 font-bold", rate === r ? "border-[#2E3192] bg-[#2E3192]/5 text-[#2E3192]" : "border-slate-200 text-slate-600")}>
                  {r} %
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" checked={fodec} onChange={(e) => setFodec(e.target.checked)} className="mt-1 h-4 w-4" />
            <span>
              <span className="font-bold text-slate-800">{tr("fodec")}</span>
              <span className="block text-slate-500">{tr("fodec_help")}</span>
            </span>
          </label>
          {fodec && (
            <div className="flex items-center gap-2">
              <Input inputMode="decimal" value={fodecRate} onChange={(e) => setFodecRate(e.target.value)} className="w-24" dir="ltr" aria-label={tr("fodec_rate")} />
              <span className="text-sm text-slate-500">%</span>
            </div>
          )}
        </div>
        <div className="rounded-3xl bg-slate-50 p-6">
          <p className="mb-2 text-sm font-black uppercase tracking-widest text-slate-400">{tr("result")}</p>
          <ResultRow label={tr("ht")} value={formatPrice(ht)} />
          {fodec && <ResultRow label={`FODEC (${fodecRate} %)`} value={formatPrice(fodecAmount)} />}
          <ResultRow label={`${tr("tva")} (${rate} %)`} value={formatPrice(tva)} />
          <ResultRow label={tr("ttc")} value={formatPrice(ttc)} strong />
          {fodec && <p className="mt-4 text-xs text-slate-500">{tr("fodec_note")}</p>}
        </div>
      </div>
    </ToolShell>
  );
}
