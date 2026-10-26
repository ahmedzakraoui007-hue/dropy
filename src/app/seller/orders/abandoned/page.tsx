"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, MessageCircle, Phone, PhoneOff, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

type Lead = {
  id: string;
  customer_name: string | null;
  customer_phone: string;
  customer_governorate: string | null;
  customer_city: string | null;
  customer_address: string | null;
  quantity: number;
  status: "open" | "contacted" | "converted" | "dismissed";
  created_at: string;
  product: { name: string; images: string[] | null; selling_price: number } | null;
};

type Filter = "open" | "contacted" | "converted";

function timeAgo(value: string, locale: string) {
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60000);
  const rtf = new Intl.RelativeTimeFormat(locale === "ar" ? "ar" : "fr", { numeric: "auto" });
  if (minutes < 60) return rtf.format(-Math.max(1, minutes), "minute");
  const hours = Math.round(minutes / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  return rtf.format(-Math.round(hours / 24), "day");
}

export default function AbandonedOrdersPage() {
  const { t, locale } = useTranslation();
  const tr = (key: string) => t(`seller_app.leads.${key}`);
  const [storeName, setStoreName] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("open");
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: store } = await supabase
      .from("stores")
      .select("id, name")
      .eq("vendor_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!store) {
      setLoading(false);
      return;
    }
    setStoreName(store.name);
    const { data, error } = await supabase
      .from("store_order_leads")
      .select("id, customer_name, customer_phone, customer_governorate, customer_city, customer_address, quantity, status, created_at, product:store_products(name, images, selling_price)")
      .eq("store_id", store.id)
      .neq("status", "dismissed")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) toast.error(tr("load_error"));
    setLeads((data as unknown as Lead[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const setStatus = async (lead: Lead, status: Lead["status"]) => {
    setBusy(lead.id);
    const { error } = await createClient()
      .from("store_order_leads")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", lead.id);
    setBusy(null);
    if (error) {
      toast.error(tr("update_error"));
      return;
    }
    setLeads((prev) => (status === "dismissed" ? prev.filter((l) => l.id !== lead.id) : prev.map((l) => (l.id === lead.id ? { ...l, status } : l))));
  };

  const whatsappHref = (lead: Lead) => {
    const message = tr("whatsapp_message")
      .replace("{name}", lead.customer_name || "")
      .replace("{store}", storeName)
      .replace("{product}", lead.product?.name || "");
    return `https://wa.me/216${lead.customer_phone}?text=${encodeURIComponent(message.replace(/\s+/g, " ").trim())}`;
  };

  const counts = {
    open: leads.filter((l) => l.status === "open").length,
    contacted: leads.filter((l) => l.status === "contacted").length,
    converted: leads.filter((l) => l.status === "converted").length,
  };
  const visible = leads.filter((l) => l.status === filter);

  return (
    <div className="container mx-auto max-w-4xl space-y-6 py-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">{tr("title")}</h1>
        <p className="text-sm text-muted-foreground">{tr("subtitle")}</p>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-xl bg-muted p-1">
        {(["open", "contacted", "converted"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn("rounded-lg px-2 py-2 text-xs font-semibold sm:text-sm", filter === key ? "bg-background shadow-sm" : "text-muted-foreground")}
          >
            {tr(`tabs.${key}`)} ({counts[key]})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed p-10 text-center">
          <PhoneOff className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-semibold">{tr(`empty.${filter}`)}</p>
          {filter === "open" && <p className="mt-1 text-sm text-muted-foreground">{tr("empty_help")}</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((lead) => (
            <div key={lead.id} className="flex flex-col gap-4 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 gap-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                  {lead.product?.images?.[0] && <img src={lead.product.images[0]} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 space-y-0.5">
                  <p className="truncate font-semibold">{lead.customer_name || tr("no_name")}</p>
                  <p className="text-sm" dir="ltr">
                    {lead.customer_phone.replace(/(\d{2})(\d{3})(\d{3})/, "$1 $2 $3")}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[lead.product?.name, lead.quantity > 1 ? `× ${lead.quantity}` : null, lead.customer_governorate, timeAgo(lead.created_at, locale)].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <a href={`tel:+216${lead.customer_phone}`} onClick={() => lead.status === "open" && void setStatus(lead, "contacted")}>
                    <Phone className="me-1 h-4 w-4" />
                    {tr("call")}
                  </a>
                </Button>
                <Button asChild size="sm" className="bg-[#25D366] text-white hover:bg-[#1ebe5b]">
                  <a href={whatsappHref(lead)} target="_blank" rel="noreferrer" onClick={() => lead.status === "open" && void setStatus(lead, "contacted")}>
                    <MessageCircle className="me-1 h-4 w-4" />
                    WhatsApp
                  </a>
                </Button>
                {lead.status !== "converted" && (
                  <>
                    {lead.status === "open" && (
                      <Button size="sm" variant="ghost" disabled={busy === lead.id} onClick={() => setStatus(lead, "contacted")}>
                        <Check className="me-1 h-4 w-4" />
                        {tr("mark_contacted")}
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-muted-foreground" disabled={busy === lead.id} onClick={() => setStatus(lead, "dismissed")} aria-label={tr("dismiss")}>
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="text-center text-xs text-muted-foreground">{tr("retention")}</p>
    </div>
  );
}
