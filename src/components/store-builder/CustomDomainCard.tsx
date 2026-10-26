"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Clock, Copy, ExternalLink, Globe, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/context/LanguageContext";
import type { DnsRecord } from "@/lib/custom-domain";

type DomainInfo = { enabled: boolean; domain: string | null; status: "none" | "pending" | "active"; records: DnsRecord[] };

export function CustomDomainCard() {
  const { t } = useTranslation();
  const tr = (key: string) => t(`store_builder.settings.domain.${key}`);
  const [info, setInfo] = useState<DomainInfo | null>(null);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState<"load" | "add" | "check" | "remove" | null>("load");

  const load = useCallback(async (mode: "load" | "check" = "load") => {
    setBusy(mode);
    const res = await fetch("/api/seller/domain", { cache: "no-store" });
    const data = await res.json().catch(() => null);
    setBusy(null);
    if (res.ok && data) setInfo(data);
    if (mode === "check" && data?.status === "active") toast.success(tr("now_active"));
    else if (mode === "check") toast.info(tr("still_pending"));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const connect = async () => {
    setBusy("add");
    const res = await fetch("/api/seller/domain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain: value }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) {
      toast.error(tr(`errors.${data.error || "generic"}`));
      return;
    }
    setInfo(data);
    setValue("");
  };

  const remove = async () => {
    if (!info?.domain || !window.confirm(tr("remove_confirm").replace("{domain}", info.domain))) return;
    setBusy("remove");
    const res = await fetch("/api/seller/domain", { method: "DELETE" });
    const data = await res.json().catch(() => null);
    setBusy(null);
    if (res.ok && data) setInfo(data);
  };

  const copy = (text: string) => {
    void navigator.clipboard.writeText(text);
    toast.success(tr("copied"));
  };

  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Globe className="w-5 h-5 text-purple-600" />
          {tr("title")}
        </CardTitle>
        <CardDescription>{tr("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {busy === "load" || !info ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !info.enabled && !info.domain ? (
          <p className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">{tr("not_available")}</p>
        ) : !info.domain ? (
          <div className="space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input dir="ltr" value={value} onChange={(e) => setValue(e.target.value)} placeholder="maboutique.tn" aria-label={tr("title")} />
              <Button onClick={connect} disabled={busy === "add" || !value.trim()} className="shrink-0 rounded-xl bg-purple-600 hover:bg-purple-700">
                {busy === "add" && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {tr("connect")}
              </Button>
            </div>
            <p className="text-xs text-gray-500">{tr("connect_help")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4">
              <div className="min-w-0">
                <p className="truncate font-mono text-sm font-bold" dir="ltr">{info.domain}</p>
                <p className={`mt-1 flex items-center gap-1 text-xs font-semibold ${info.status === "active" ? "text-emerald-600" : "text-amber-600"}`}>
                  {info.status === "active" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                  {tr(`status.${info.status}`)}
                </p>
              </div>
              <div className="flex gap-2">
                {info.status === "active" ? (
                  <Button asChild variant="outline" size="sm" className="rounded-xl">
                    <a href={`https://${info.domain}`} target="_blank" rel="noreferrer">
                      <ExternalLink className="me-1 h-4 w-4" />
                      {tr("open")}
                    </a>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" className="rounded-xl" onClick={() => load("check")} disabled={busy === "check"}>
                    {busy === "check" ? <Loader2 className="me-1 h-4 w-4 animate-spin" /> : <RefreshCw className="me-1 h-4 w-4" />}
                    {tr("check")}
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="text-red-600" onClick={remove} disabled={busy === "remove"} aria-label={tr("remove")}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {info.status !== "active" && (
              <div className="space-y-3">
                <p className="text-sm font-semibold">{tr("dns_title")}</p>
                <p className="text-xs text-gray-500">{tr("dns_help")}</p>
                <div className="overflow-x-auto rounded-2xl border">
                  <table className="w-full text-sm" dir="ltr">
                    <thead className="bg-gray-50 text-xs text-gray-500">
                      <tr>
                        <th className="px-3 py-2 text-start">{tr("dns_type")}</th>
                        <th className="px-3 py-2 text-start">{tr("dns_name")}</th>
                        <th className="px-3 py-2 text-start">{tr("dns_value")}</th>
                        <th className="w-10" />
                      </tr>
                    </thead>
                    <tbody>
                      {info.records.map((record, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-3 py-2 font-mono font-bold">{record.type}</td>
                          <td className="px-3 py-2 font-mono">{record.name}</td>
                          <td className="max-w-[220px] break-all px-3 py-2 font-mono">{record.value}</td>
                          <td className="px-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copy(record.value)} aria-label={tr("copy")}>
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-500">{tr("propagation")}</p>
              </div>
            )}
            {info.status === "active" && <p className="text-xs text-gray-500">{tr("active_help")}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
