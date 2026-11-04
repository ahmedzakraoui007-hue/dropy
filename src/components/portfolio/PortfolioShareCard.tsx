"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Copy, Download, ExternalLink, Facebook, Globe, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "@/context/LanguageContext";
import { SITE_URL } from "@/lib/store-url";

type State = { slug: string; displayName: string; isPublic: boolean; canPublish: boolean };

export function PortfolioShareCard({ itemCount }: { itemCount: number }) {
  const { t } = useTranslation();
  const s = (key: string) => t(`creator_app.portfolio.share.${key}`);
  const [state, setState] = useState<State | null>(null);
  const [saved, setSaved] = useState<State | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/creator/public-profile")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!data) return;
        const next = { slug: data.slug || data.suggestedSlug, displayName: data.displayName, isPublic: data.isPublic, canPublish: data.canPublish };
        setState(next);
        setSaved(data.slug ? next : null);
      });
  }, []);

  if (!state) return null;

  const url = `${SITE_URL}/createurs/${state.slug}`;
  const live = Boolean(saved?.isPublic && saved.slug === state.slug);
  const shareText = encodeURIComponent(`${s("share_text")} ${url}`);

  const save = async (isPublic: boolean) => {
    setSaving(true);
    const next = { ...state, isPublic };
    const response = await fetch("/api/creator/public-profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    setSaving(false);
    if (response.ok) {
      setState(next);
      setSaved(next);
      toast.success(isPublic ? s("published") : s("saved"));
      return;
    }
    const { code } = await response.json().catch(() => ({ code: "failed" }));
    toast.error(s(`errors.${code}`));
  };

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    toast.success(s("copied"));
  };

  const downloadQr = async () => {
    const link = document.createElement("a");
    link.href = await QRCode.toDataURL(url, { width: 800, margin: 2 });
    link.download = `portfolio-${state.slug}.png`;
    link.click();
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between gap-4 border-b border-border p-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Globe className="h-5 w-5" /></span>
          <div className="min-w-0">
            <h2 className="font-black">{s("title")}</h2>
            <p className="text-sm text-muted-foreground">{live ? s("status_live") : s("status_private")}</p>
          </div>
        </div>
        <Switch checked={state.isPublic} disabled={saving || !state.canPublish} onCheckedChange={save} aria-label={s("title")} />
      </div>

      <div className="space-y-4 p-5">
        {!state.canPublish && <p className="rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">{s("pending")}</p>}
        {state.canPublish && itemCount === 0 && <p className="rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">{s("no_items")}</p>}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="public-name">{s("name")}</Label>
            <Input id="public-name" maxLength={60} value={state.displayName} onChange={(e) => setState({ ...state, displayName: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="public-slug">{s("address")}</Label>
            <div className="flex items-center overflow-hidden rounded-md border border-input" dir="ltr">
              <span className="whitespace-nowrap bg-muted px-3 py-2 text-sm text-muted-foreground">/createurs/</span>
              <input id="public-slug" maxLength={40} value={state.slug} onChange={(e) => setState({ ...state, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} className="w-full min-w-0 bg-transparent px-3 py-2 text-sm outline-none" />
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" disabled={saving || !state.slug || !state.displayName.trim()} onClick={() => save(state.isPublic)}>
          {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
          {s("save")}
        </Button>

        {live && (
          <div className="border-t border-border pt-4">
            <p className="mb-3 text-sm font-bold">{s("share_title")}</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={copy}><Copy className="me-2 h-4 w-4" />{s("copy")}</Button>
              <Button size="sm" variant="outline" asChild>
                <a href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noopener noreferrer"><MessageCircle className="me-2 h-4 w-4" />WhatsApp</a>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer"><Facebook className="me-2 h-4 w-4" />Facebook</a>
              </Button>
              <Button size="sm" variant="outline" onClick={downloadQr}><Download className="me-2 h-4 w-4" />{s("qr")}</Button>
              <Button size="sm" variant="ghost" asChild>
                <a href={`/createurs/${state.slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="me-2 h-4 w-4" />{s("view")}</a>
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{s("bio_tip")}</p>
          </div>
        )}
      </div>
    </section>
  );
}
