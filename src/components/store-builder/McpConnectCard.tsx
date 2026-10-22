"use client";

import { useCallback, useEffect, useState } from "react";
import { Bot, Copy, KeyRound, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/context/LanguageContext";
import { SITE_URL } from "@/lib/store-url";

type McpToken = { id: string; name: string; token_prefix: string; created_at: string; last_used_at: string | null };

function CopyBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-start gap-2">
      <pre dir="ltr" className="flex-1 overflow-x-auto rounded-xl bg-gray-900 p-3 text-xs text-gray-100 whitespace-pre-wrap break-all">{value}</pre>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0 rounded-xl"
        onClick={() => {
          navigator.clipboard.writeText(value);
          toast.success(label);
        }}
      >
        <Copy className="w-4 h-4" />
      </Button>
    </div>
  );
}

export function McpConnectCard() {
  const { t, locale } = useTranslation();
  const tr = (key: string) => t(`store_builder.settings.mcp.${key}`);
  const [tokens, setTokens] = useState<McpToken[]>([]);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/seller/mcp-tokens");
    if (response.ok) setTokens((await response.json()).tokens || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    setBusy(true);
    const response = await fetch("/api/seller/mcp-tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Claude" }),
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      toast.error(data.error || tr("error"));
      return;
    }
    setNewKey(data.token);
    load();
  };

  const revoke = async (id: string) => {
    const response = await fetch(`/api/seller/mcp-tokens?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!response.ok) {
      toast.error(tr("error"));
      return;
    }
    toast.success(tr("revoked"));
    load();
  };

  const connectorUrl = newKey ? `${SITE_URL}/api/mcp/${newKey}` : "";
  const desktopConfig = newKey
    ? JSON.stringify(
        {
          mcpServers: {
            dropy: {
              command: "npx",
              args: ["-y", "mcp-remote", `${SITE_URL}/api/mcp`, "--header", `Authorization: Bearer ${newKey}`],
            },
          },
        },
        null,
        2
      )
    : "";
  const dateFormat = new Intl.DateTimeFormat(locale === "ar" ? "ar-TN" : "fr-TN", { dateStyle: "medium", timeStyle: "short" });

  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="w-5 h-5 text-purple-600" />
          {tr("title")}
        </CardTitle>
        <CardDescription>{tr("desc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-gray-600">{tr("examples")}</p>

        {newKey ? (
          <div className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-bold text-amber-900">{tr("key_once")}</p>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-900">{tr("connector_title")}</p>
              <p className="text-xs text-gray-600">{tr("connector_steps")}</p>
              <CopyBlock value={connectorUrl} label={tr("copied")} />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-900">{tr("config_title")}</p>
              <CopyBlock value={desktopConfig} label={tr("copied")} />
            </div>
          </div>
        ) : (
          <Button onClick={create} disabled={busy} className="rounded-xl bg-purple-600 hover:bg-purple-700">
            {busy ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : <KeyRound className="w-4 h-4 me-2" />}
            {busy ? tr("creating") : tr("create")}
          </Button>
        )}

        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-900">{tr("keys")}</p>
          {tokens.length === 0 ? (
            <p className="text-sm text-gray-500">{tr("no_keys")}</p>
          ) : (
            <ul className="divide-y rounded-2xl border">
              {tokens.map((token) => (
                <li key={token.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p dir="ltr" className="font-mono text-sm text-gray-900 truncate">{token.token_prefix}…</p>
                    <p className="text-xs text-gray-500">
                      {tr("last_used")} : {token.last_used_at ? dateFormat.format(new Date(token.last_used_at)) : tr("never")}
                    </p>
                  </div>
                  <Button type="button" variant="ghost" size="sm" className="text-red-600 shrink-0" onClick={() => revoke(token.id)}>
                    <Trash2 className="w-4 h-4 me-1" />
                    {tr("revoke")}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="text-xs text-gray-400">{tr("security")}</p>
      </CardContent>
    </Card>
  );
}
