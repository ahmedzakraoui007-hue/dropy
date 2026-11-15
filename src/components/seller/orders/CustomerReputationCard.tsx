"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, ShieldAlert, ShieldQuestion, UserPlus } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import type { CustomerReputation, ReputationLevel } from "@/lib/customer-reputation";

const TONES: Record<ReputationLevel, { box: string; badge: string; Icon: typeof ShieldCheck }> = {
  new: { box: "border-slate-200 bg-white", badge: "bg-slate-100 text-slate-700", Icon: UserPlus },
  trusted: { box: "border-emerald-200 bg-emerald-50", badge: "bg-emerald-600 text-white", Icon: ShieldCheck },
  watch: { box: "border-amber-200 bg-amber-50", badge: "bg-amber-500 text-white", Icon: ShieldQuestion },
  risky: { box: "border-red-200 bg-red-50", badge: "bg-red-600 text-white", Icon: ShieldAlert },
};

export function CustomerReputationCard({ orderId }: { orderId: string }) {
  const { t } = useTranslation();
  const [data, setData] = useState<CustomerReputation | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/seller/orders/${orderId}/reputation`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => active && setData(json))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [orderId]);

  if (!data) return null;
  const tr = (key: string) => t(`seller_app.protection.reputation.${key}`);
  const tone = TONES[data.level];
  const stats = [
    { key: "orders", value: data.orders },
    { key: "delivered", value: data.delivered },
    { key: "refused", value: data.refused },
    { key: "unreachable", value: data.unreachable },
    { key: "fake", value: data.fake },
  ];

  return (
    <div className={`rounded-xl border p-4 sm:p-5 ${tone.box}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <tone.Icon className="mt-0.5 h-5 w-5 shrink-0 text-slate-700" />
          <div>
            <p className="font-bold text-slate-900">{tr("title")}</p>
            <p className="text-xs text-slate-600">{tr("subtitle")}</p>
          </div>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-black ${tone.badge}`}>{tr(`level_${data.level}`)}</span>
      </div>
      {data.orders > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {stats.map((s) => (
            <div key={s.key} className="rounded-lg bg-white/80 px-3 py-2 text-center ring-1 ring-black/5">
              <p className="text-lg font-black text-slate-900">{s.value}</p>
              <p className="text-[11px] font-semibold text-slate-500">{tr(s.key)}</p>
            </div>
          ))}
        </div>
      )}
      <p className="mt-3 text-sm text-slate-700">{tr(`hint_${data.level}`)}</p>
    </div>
  );
}
