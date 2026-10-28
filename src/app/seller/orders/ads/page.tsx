"use client";

import { Fragment, useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Copy, Loader2, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/context/LanguageContext";
import { cn, formatPrice } from "@/lib/utils";
import { FACEBOOK_URL_PARAMS, TIKTOK_URL_PARAMS } from "@/lib/ad-attribution";

type Metrics = {
  name: string;
  orders: number;
  confirmed: number;
  delivered: number;
  cancelled: number;
  deliveredRevenue: number;
  margin: number;
  unknownCost: boolean;
  children?: Metrics[];
};
type Report = { days: number; totals: Metrics; platforms: Metrics[] };

const RANGES = ["7d", "30d", "90d"] as const;
const PLATFORM_COLORS: Record<string, string> = {
  facebook: "bg-blue-600",
  tiktok: "bg-black",
  google: "bg-amber-500",
  snapchat: "bg-yellow-400",
  manual: "bg-slate-400",
  direct: "bg-slate-300",
  other: "bg-purple-400",
  unknown: "bg-slate-200",
};

const pct = (part: number, whole: number) => (whole > 0 ? `${Math.round((part / whole) * 100)} %` : "—");

export default function AdStatsPage() {
  const { t } = useTranslation();
  const tr = (key: string) => t(`seller_app.ads.${key}`);
  const [range, setRange] = useState<(typeof RANGES)[number]>("30d");
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setLoading(true);
    fetch(`/api/seller/ads?range=${range}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setReport(data))
      .finally(() => setLoading(false));
  }, [range]);

  const platformName = (key: string) => {
    const label = tr(`platforms.${key}`);
    return label.startsWith("seller_app.") ? key : label;
  };
  const label = (name: string, kind: "campaign" | "ad") => name || tr(kind === "campaign" ? "no_campaign" : "no_ad");

  const copy = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success(tr("copied")))
      .catch(() => toast.error(tr("copy_failed")));
  };

  const row = (m: Metrics, depth: number, key: string, name: string) => {
    const hasChildren = Boolean(m.children?.length) && !(m.children!.length === 1 && !m.children![0].name);
    const expanded = open[key];
    return (
      <Fragment key={key}>
        <tr className={cn("border-b last:border-0", depth === 0 && "bg-muted/30 font-semibold")}>
          <td className="py-2.5 pe-3" style={{ paddingInlineStart: `${depth * 20 + 8}px` }}>
            <button
              type="button"
              disabled={!hasChildren}
              onClick={() => setOpen((prev) => ({ ...prev, [key]: !prev[key] }))}
              className="flex items-center gap-1.5 text-start disabled:cursor-default"
            >
              {hasChildren ? (
                expanded ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0 rtl:rotate-180" />
              ) : (
                <span className="w-4" />
              )}
              {depth === 0 && <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", PLATFORM_COLORS[m.name] || "bg-slate-300")} />}
              <span className="max-w-[260px] truncate">{name}</span>
            </button>
          </td>
          <td className="px-3 text-end tabular-nums">{m.orders}</td>
          <td className="px-3 text-end tabular-nums">{pct(m.confirmed, m.orders)}</td>
          <td className="px-3 text-end tabular-nums">{pct(m.delivered, m.confirmed)}</td>
          <td className="px-3 text-end tabular-nums">{m.cancelled}</td>
          <td className="px-3 text-end tabular-nums whitespace-nowrap">{formatPrice(m.deliveredRevenue)}</td>
          <td className="ps-3 pe-2 text-end tabular-nums whitespace-nowrap">
            {formatPrice(m.margin)}
            {m.unknownCost && <span title={tr("unknown_cost")}> *</span>}
          </td>
        </tr>
        {expanded &&
          m.children?.map((c, i) =>
            row(c, depth + 1, `${key}/${i}`, depth === 0 ? label(c.name, "campaign") : label(c.name, "ad"))
          )}
      </Fragment>
    );
  };

  const totals = report?.totals;
  const kpis = totals
    ? [
        { label: tr("orders"), value: String(totals.orders) },
        { label: tr("confirmation"), value: pct(totals.confirmed, totals.orders) },
        { label: tr("delivery"), value: pct(totals.delivered, totals.confirmed) },
        { label: tr("delivered_revenue"), value: formatPrice(totals.deliveredRevenue) },
        { label: tr("margin"), value: formatPrice(totals.margin) },
        { label: tr("tracked"), value: pct(totals.orders - (report!.platforms.find((p) => p.name === "unknown")?.orders || 0), totals.orders) },
      ]
    : [];

  return (
    <div className="container mx-auto max-w-6xl space-y-6 py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
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
              {t(`seller_app.stats.ranges.${value}`)}
            </button>
          ))}
        </div>
      </div>

      {loading && !report ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !report ? (
        <p className="rounded-2xl bg-muted/50 p-10 text-center text-sm text-muted-foreground">{tr("error")}</p>
      ) : report.totals.orders === 0 ? (
        <p className="rounded-2xl border-2 border-dashed p-10 text-center text-sm text-muted-foreground">{tr("empty")}</p>
      ) : (
        <>
          <div className={cn("grid grid-cols-2 gap-3 lg:grid-cols-6", loading && "opacity-60")}>
            {kpis.map((kpi) => (
              <Card key={kpi.label} className="rounded-2xl">
                <CardContent className="space-y-1 p-4">
                  <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
                  <p className="text-xl font-black">{kpi.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">{tr("by_source")}</CardTitle>
              <CardDescription>{tr("by_source_help")}</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="py-2 ps-2 text-start font-medium">{tr("source")}</th>
                    <th className="px-3 text-end font-medium">{tr("orders")}</th>
                    <th className="px-3 text-end font-medium">{tr("confirmation")}</th>
                    <th className="px-3 text-end font-medium">{tr("delivery")}</th>
                    <th className="px-3 text-end font-medium">{tr("cancelled")}</th>
                    <th className="px-3 text-end font-medium">{tr("delivered_revenue")}</th>
                    <th className="ps-3 pe-2 text-end font-medium">{tr("margin")}</th>
                  </tr>
                </thead>
                <tbody>{report.platforms.map((p) => row(p, 0, p.name, platformName(p.name)))}</tbody>
              </table>
              <p className="mt-3 text-xs text-muted-foreground">{tr("margin_help")}</p>
            </CardContent>
          </Card>
        </>
      )}

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Megaphone className="h-5 w-5 text-primary" />
            {tr("setup_title")}
          </CardTitle>
          <CardDescription>{tr("setup_help")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { name: "Facebook / Instagram", value: FACEBOOK_URL_PARAMS, help: tr("setup_facebook") },
            { name: "TikTok", value: TIKTOK_URL_PARAMS, help: tr("setup_tiktok") },
          ].map((item) => (
            <div key={item.name} className="space-y-2">
              <p className="text-sm font-semibold">{item.name}</p>
              <div className="flex gap-2">
                <code dir="ltr" className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-lg bg-muted px-3 py-2 text-xs">{item.value}</code>
                <Button type="button" variant="outline" size="icon" aria-label={tr("copy")} onClick={() => copy(item.value)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{item.help}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
