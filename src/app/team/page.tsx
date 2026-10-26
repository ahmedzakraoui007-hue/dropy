"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Languages, Loader2, LogOut, MapPin, MessageCircle, Phone, RefreshCw, ShieldAlert, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/context/LanguageContext";
import { sellerConfirmationMessage, whatsappLink } from "@/lib/order-messages";

type Store = { id: string; name: string; storefront_language: string | null };
type Order = {
  id: string;
  store_id: string;
  order_number: string;
  created_at: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  notes: string | null;
  customer_governorate: string | null;
  total_amount: number | null;
  risk_flags: string[] | null;
  items: { product_name: string | null; quantity: number | null; variant_info: Record<string, string> | null }[] | null;
};

const CANCEL_REASONS = ["unreachable", "customer_cancelled", "fake_order", "out_of_stock", "other"] as const;

export default function TeamWorkspace() {
  const router = useRouter();
  const { t, locale, setLocale } = useTranslation();
  const tr = (key: string) => t(`team_app.${key}`);
  const [stores, setStores] = useState<Store[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [handledToday, setHandledToday] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    const res = await fetch("/api/team/stores", { cache: "no-store" });
    const list = res.ok ? (((await res.json()).stores || []) as Store[]) : [];
    setStores(list);
    if (!list.length) {
      setOrders([]);
      setLoading(false);
      return;
    }
    const ids = list.map((s) => s.id);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const [{ data: pending }, { count }] = await Promise.all([
      supabase
        .from("store_orders")
        .select("id, store_id, order_number, created_at, customer_name, customer_phone, customer_address, customer_governorate, notes, total_amount, risk_flags, items:store_order_items(product_name, quantity, variant_info)")
        .in("store_id", ids)
        .eq("status", "new")
        .order("created_at", { ascending: true })
        .limit(100),
      supabase
        .from("store_orders")
        .select("id", { count: "exact", head: true })
        .in("store_id", ids)
        .eq("handled_by", user.id)
        .or(`confirmed_at.gte.${startOfDay.toISOString()},cancelled_at.gte.${startOfDay.toISOString()}`),
    ]);
    setOrders((pending as Order[]) || []);
    setHandledToday(count ?? 0);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (order: Order, action: "confirm" | "cancel") => {
    setBusy(order.id);
    const res = await fetch(`/api/seller/orders/${order.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason: reasons[order.id] || "unreachable" }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) {
      toast.error(data.error || tr("action_error"));
      if (res.status === 409) void load();
      return;
    }
    toast.success(tr(action === "confirm" ? "confirmed" : "cancelled"));
    setOrders((prev) => prev.filter((o) => o.id !== order.id));
    setHandledToday((n) => n + 1);
  };

  const logout = async () => {
    await createClient().auth.signOut();
    router.push("/login");
  };

  const storeOf = (id: string) => stores.find((s) => s.id === id);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 border-b bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-purple-600">{tr("eyebrow")}</p>
            <p className="truncate font-bold">{stores.map((s) => s.name).join(" · ") || "Dropy"}</p>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setLocale(locale === "ar" ? "fr" : "ar")} aria-label={tr("language")}>
              <Languages className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => void load()} aria-label={tr("refresh")} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button variant="ghost" size="icon" onClick={logout} aria-label={tr("logout")}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-4 py-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border bg-white p-4">
            <p className="text-xs text-gray-500">{tr("to_confirm")}</p>
            <p className="text-3xl font-black">{orders.length}</p>
          </div>
          <div className="rounded-2xl border bg-white p-4">
            <p className="text-xs text-gray-500">{tr("handled_today")}</p>
            <p className="text-3xl font-black">{handledToday}</p>
          </div>
        </div>

        {loading && orders.length === 0 ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : stores.length === 0 ? (
          <p className="rounded-2xl border-2 border-dashed bg-white p-10 text-center text-sm text-gray-500">{tr("no_store")}</p>
        ) : orders.length === 0 ? (
          <p className="rounded-2xl border-2 border-dashed bg-white p-10 text-center text-sm text-gray-500">{tr("empty")}</p>
        ) : (
          orders.map((order) => {
            const store = storeOf(order.store_id);
            const lang = store?.storefront_language === "ar" ? "ar" : "fr";
            return (
              <article key={order.id} className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-gray-500">#{order.order_number}{stores.length > 1 && store ? ` · ${store.name}` : ""}</p>
                    <p className="truncate text-lg font-bold" dir="auto">{order.customer_name}</p>
                    <p className="text-sm font-semibold" dir="ltr">{order.customer_phone}</p>
                  </div>
                  <p className="shrink-0 text-lg font-black text-purple-700">
                    {(Number(order.total_amount) || 0).toFixed(3).replace(".", ",")} DT
                  </p>
                </div>
                <p className="flex items-start gap-1.5 text-sm text-gray-600" dir="auto">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                  {[order.customer_address, order.customer_governorate].filter(Boolean).join(", ")}
                </p>
                {order.notes && (
                  <p className="whitespace-pre-line rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800" dir="auto">{order.notes}</p>
                )}
                <p className="rounded-xl bg-gray-50 px-3 py-2 text-sm" dir="auto">
                  {(order.items || []).map((i) => `${i.quantity || 1} × ${i.product_name}${i.variant_info ? ` (${Object.values(i.variant_info).join(" / ")})` : ""}`).join(", ")}
                </p>
                {(order.risk_flags?.length ?? 0) > 0 && (
                  <div className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{(order.risk_flags || []).map((f) => t(`seller_app.protection.flags.${f}`)).join(" ")}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <Button asChild variant="outline" className="h-11">
                    <a href={`tel:${order.customer_phone}`}>
                      <Phone className="me-2 h-4 w-4" />
                      {tr("call")}
                    </a>
                  </Button>
                  <Button asChild className="h-11 bg-[#25D366] text-white hover:bg-[#1ebe5b]">
                    <a href={whatsappLink(order.customer_phone, sellerConfirmationMessage(order, store?.name || "", lang))} target="_blank" rel="noreferrer">
                      <MessageCircle className="me-2 h-4 w-4" />
                      WhatsApp
                    </a>
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto]">
                  <Select value={reasons[order.id] || "unreachable"} onValueChange={(v) => setReasons((prev) => ({ ...prev, [order.id]: v }))}>
                    <SelectTrigger className="h-11 w-full" aria-label={tr("cancel_reason")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CANCEL_REASONS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {t(`seller_app.stats.reason_labels.${r}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" className="h-11 border-red-200 text-red-600" disabled={busy === order.id} onClick={() => act(order, "cancel")}>
                    <XCircle className="me-2 h-4 w-4" />
                    {tr("cancel")}
                  </Button>
                  <Button className="h-11 bg-emerald-600 hover:bg-emerald-700" disabled={busy === order.id} onClick={() => act(order, "confirm")}>
                    {busy === order.id ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="me-2 h-4 w-4" />}
                    {tr("confirm")}
                  </Button>
                </div>
              </article>
            );
          })
        )}
      </main>
    </div>
  );
}
