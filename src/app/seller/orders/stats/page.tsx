"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Clock, Loader2, PackageCheck, PhoneCall, ShieldAlert, XCircle } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

type Bucket = { received: number; confirmed: number; cancelled: number; delivered: number };
type Row = Bucket & { name: string; confirmationRate: number | null; deliveryRate: number | null };
type Stats = {
  days: number;
  totals: Bucket & { pending: number; suspicious: number; confirmedValue: number; deliveredValue: number };
  rates: { confirmation: number | null; cancellation: number | null; delivery: number | null };
  medianConfirmHours: number | null;
  reasons: { reason: string; total: number }[];
  byDay: (Bucket & { date: string })[];
  byProduct: Row[];
  byGovernorate: Row[];
  agents: { id: string; name: string | null; confirmed: number; cancelled: number; confirmationRate: number | null }[];
  leads: { total: number; recovered: number };
};

const RANGES = ["7d", "30d", "90d"] as const;

const money = (value: number) => `${value.toFixed(3).replace(".", ",")} DT`;
const pct = (value: number | null) => (value === null ? "—" : `${value.toString().replace(".", ",")} %`);

function RateBar({ value, tone }: { value: number | null; tone: "green" | "red" | "blue" }) {
  const color = tone === "green" ? "bg-emerald-500" : tone === "red" ? "bg-red-500" : "bg-blue-500";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${Math.min(100, value ?? 0)}%` }} />
    </div>
  );
}

export default function ConfirmationStatsPage() {
  const { t, locale } = useTranslation();
  const tr = (key: string) => t(`seller_app.stats.${key}`);
  const [range, setRange] = useState<(typeof RANGES)[number]>("30d");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/seller/stats/confirmation?range=${range}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setStats(data))
      .finally(() => setLoading(false));
  }, [range]);

  const dayLabel = (date: string) =>
    new Intl.DateTimeFormat(locale === "ar" ? "ar-TN" : "fr-TN", { day: "numeric", month: "short" }).format(new Date(`${date}T12:00:00`));

  const kpis = stats
    ? [
        { icon: PackageCheck, label: tr("received"), value: String(stats.totals.received), help: tr("pending").replace("{count}", String(stats.totals.pending)) },
        { icon: CheckCircle2, label: tr("confirmation_rate"), value: pct(stats.rates.confirmation), help: `${stats.totals.confirmed} ${tr("confirmed_lower")}`, rate: stats.rates.confirmation, tone: "green" as const },
        { icon: XCircle, label: tr("cancellation_rate"), value: pct(stats.rates.cancellation), help: `${stats.totals.cancelled} ${tr("cancelled_lower")}`, rate: stats.rates.cancellation, tone: "red" as const },
        { icon: PackageCheck, label: tr("delivery_rate"), value: pct(stats.rates.delivery), help: `${stats.totals.delivered} ${tr("delivered_lower")}`, rate: stats.rates.delivery, tone: "blue" as const },
        { icon: Clock, label: tr("confirm_time"), value: stats.medianConfirmHours === null ? "—" : `${String(stats.medianConfirmHours).replace(".", ",")} h`, help: tr("confirm_time_help") },
        { icon: ShieldAlert, label: tr("suspicious"), value: String(stats.totals.suspicious), help: tr("suspicious_help") },
        { icon: PhoneCall, label: tr("recovered"), value: String(stats.leads.recovered), help: tr("recovered_help").replace("{count}", String(stats.leads.total)) },
        { icon: CheckCircle2, label: tr("delivered_value"), value: money(stats.totals.deliveredValue), help: `${tr("confirmed_value")} ${money(stats.totals.confirmedValue)}` },
      ]
    : [];

  return (
    <div className="container mx-auto max-w-6xl space-y-6 py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Link href="/seller/orders" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            {t("seller_app.leads.back")}
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{tr("title")}</h1>
          <p className="text-sm text-muted-foreground">{tr("subtitle")}</p>
        </div>
        <div className="flex rounded-xl bg-muted p-1" role="group" aria-label={tr("period")}>
          {RANGES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRange(value)}
              className={cn("rounded-lg px-3 py-1.5 text-sm font-semibold", range === value ? "bg-background shadow-sm" : "text-muted-foreground")}
            >
              {tr(`ranges.${value}`)}
            </button>
          ))}
        </div>
      </div>

      {loading && !stats ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !stats ? (
        <p className="rounded-2xl bg-muted/50 p-10 text-center text-sm text-muted-foreground">{tr("error")}</p>
      ) : stats.totals.received === 0 ? (
        <p className="rounded-2xl border-2 border-dashed p-10 text-center text-sm text-muted-foreground">{tr("empty")}</p>
      ) : (
        <>
          <div className={cn("grid grid-cols-2 gap-3 lg:grid-cols-4", loading && "opacity-60")}>
            {kpis.map((kpi) => (
              <Card key={kpi.label} className="rounded-2xl">
                <CardContent className="space-y-2 p-4">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <kpi.icon className="h-3.5 w-3.5" />
                    {kpi.label}
                  </p>
                  <p className="text-2xl font-black">{kpi.value}</p>
                  {"rate" in kpi && <RateBar value={kpi.rate ?? null} tone={kpi.tone!} />}
                  <p className="text-xs text-muted-foreground">{kpi.help}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">{tr("per_day")}</CardTitle>
            </CardHeader>
            <CardContent className="h-72" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.byDay.map((d) => ({ ...d, label: dayLabel(d.date) }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" fontSize={11} tickLine={false} interval="preserveStartEnd" />
                  <YAxis allowDecimals={false} fontSize={11} tickLine={false} width={28} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="confirmed" name={tr("confirmed")} stackId="a" fill="#10b981" />
                  <Bar dataKey="cancelled" name={tr("cancelled")} stackId="a" fill="#ef4444" />
                  <Bar dataKey="received" name={tr("received")} fill="#a78bfa" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">{tr("reasons")}</CardTitle>
                <CardDescription>{tr("reasons_help")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats.reasons.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{tr("no_cancel")}</p>
                ) : (
                  stats.reasons.map((r) => (
                    <div key={r.reason} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{t(`seller_app.stats.reason_labels.${r.reason}`)}</span>
                        <span className="font-semibold">{r.total}</span>
                      </div>
                      <RateBar value={(r.total / Math.max(1, stats.totals.cancelled)) * 100} tone="red" />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {(["byProduct", "byGovernorate"] as const).map((key) => (
              <Card key={key} className="rounded-2xl lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg">{tr(key === "byProduct" ? "by_product" : "by_governorate")}</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto p-0">
                  <table className="w-full text-sm">
                    <thead className="text-xs text-muted-foreground">
                      <tr className="border-b">
                        <th className="px-4 py-2 text-start font-medium">{tr(key === "byProduct" ? "product" : "governorate")}</th>
                        <th className="px-2 py-2 text-end font-medium">{tr("orders_short")}</th>
                        <th className="px-4 py-2 text-end font-medium">{tr("confirmation_short")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats[key].map((row) => (
                        <tr key={row.name} className="border-b last:border-0">
                          <td className="max-w-[160px] truncate px-4 py-2" dir="auto">{row.name}</td>
                          <td className="px-2 py-2 text-end tabular-nums">{row.received}</td>
                          <td className={cn("px-4 py-2 text-end font-semibold tabular-nums", (row.confirmationRate ?? 100) < 50 && "text-red-600")}>
                            {pct(row.confirmationRate)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">{tr("by_agent")}</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              {stats.agents.length === 0 ? (
                <p className="px-6 pb-6 text-sm text-muted-foreground">{tr("no_agent")}</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground">
                    <tr className="border-b">
                      <th className="px-4 py-2 text-start font-medium">{tr("agent")}</th>
                      <th className="px-2 py-2 text-end font-medium">{tr("confirmed")}</th>
                      <th className="px-2 py-2 text-end font-medium">{tr("cancelled")}</th>
                      <th className="px-4 py-2 text-end font-medium">{tr("confirmation_short")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.agents.map((agent) => (
                      <tr key={agent.id} className="border-b last:border-0">
                        <td className="px-4 py-2">{agent.name ?? tr("owner")}</td>
                        <td className="px-2 py-2 text-end tabular-nums">{agent.confirmed}</td>
                        <td className="px-2 py-2 text-end tabular-nums">{agent.cancelled}</td>
                        <td className="px-4 py-2 text-end font-semibold tabular-nums">{pct(agent.confirmationRate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground">{tr("definitions")}</p>
        </>
      )}
    </div>
  );
}
