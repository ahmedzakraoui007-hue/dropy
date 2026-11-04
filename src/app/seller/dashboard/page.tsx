"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  ExternalLink,
  Globe,
  MessageCircle,
  Package,
  PackageCheck,
  Palette,
  Phone,
  PhoneCall,
  Rocket,
  ShoppingBag,
  Store,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/context/LanguageContext";
import { useSellerDashboard } from "@/hooks/useSellerDashboard";
import { useOnboardingChecklist } from "@/hooks/useOnboardingChecklist";
import { useSellerCockpit, type CockpitOrder } from "@/hooks/useSellerCockpit";
import { formatPrice } from "@/lib/utils";
import { storeDisplayUrl, storeUrl, storeViewHref } from "@/lib/store-url";
import { RealtimeOrdersListener } from "@/components/seller/RealtimeOrdersListener";
import { PhoneFrame } from "@/components/landing/home/MiniStore";
import { DROPSHIPPING_ENABLED } from "@/lib/launch";

const STATUS_TONES: Record<string, string> = {
  new: "bg-amber-50 text-amber-700",
  confirmed: "bg-blue-50 text-blue-700",
  preparing: "bg-violet-50 text-violet-700",
  shipped: "bg-sky-50 text-sky-700",
  delivered: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-gray-100 text-gray-500",
};

const TODO_TILES = [
  { status: "new", icon: PhoneCall, tone: "from-amber-400 to-orange-500" },
  { status: "confirmed", icon: Package, tone: "from-blue-500 to-indigo-600" },
  { status: "preparing", icon: PackageCheck, tone: "from-violet-500 to-purple-600" },
  { status: "shipped", icon: Truck, tone: "from-[#00A99D] to-teal-600" },
] as const;

function whatsappNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 8 ? `216${digits}` : digits;
}

function timeAgo(value: string, locale: string) {
  const minutes = Math.round((new Date(value).getTime() - Date.now()) / 60000);
  const format = new Intl.RelativeTimeFormat(locale === "ar" ? "ar-TN" : "fr-TN", { numeric: "auto" });
  if (minutes > -60) return format.format(minutes, "minute");
  if (minutes > -1440) return format.format(Math.round(minutes / 60), "hour");
  return format.format(Math.round(minutes / 1440), "day");
}

export default function SellerDashboard() {
  const { t, locale } = useTranslation();
  const c = (key: string) => t(`seller_app.cockpit.${key}`);
  const [sellerId, setSellerId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setSellerId(data.user.id);
    });
  }, []);

  const { stats, profile, loading: statsLoading, refetchStats } = useSellerDashboard(sellerId || "");
  const { checklist, loading: checklistLoading } = useOnboardingChecklist(sellerId || "");
  const { store, todo, recent, week, loading: cockpitLoading, refetch } = useSellerCockpit(sellerId || "");

  const steps = [
    { id: "store", done: checklist.store, icon: Store, href: "/seller/store-builder/start" },
    { id: "products", done: checklist.products, icon: Package, href: DROPSHIPPING_ENABLED ? "/seller/products/catalog" : "/seller/products/add?new=1" },
    { id: "online", done: checklist.online, icon: Globe, href: "/seller/store-builder" },
    { id: "payment", done: checklist.payment, icon: CreditCard, href: "/seller/settings" },
    { id: "profile", done: checklist.profile, icon: Users, href: "/seller/settings" },
  ];
  const completedSteps = steps.filter((step) => step.done).length;

  if (statsLoading || checklistLoading || cockpitLoading) {
    return (
      <div className="mx-auto max-w-7xl animate-pulse space-y-6">
        <div className="h-56 rounded-3xl bg-gray-200" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-28 rounded-2xl bg-gray-200" />)}
        </div>
      </div>
    );
  }

  const domain = store?.custom_domain_status === "active" ? store.custom_domain : null;
  const online = store?.is_active === true;
  const link = store ? storeUrl(store.slug, "", domain) : "";
  const shareText = encodeURIComponent(`${c("share_text")} ${link}`);
  const firstName = profile?.store_name?.split(" ")[0];
  const todoTotal = todo.new + todo.confirmed + todo.preparing + todo.shipped;
  const hasActivity = stats.totalOrders > 0 || stats.totalVisitors > 0;
  const weekMax = Math.max(1, ...week.map((day) => day.count));

  const copyLink = async () => {
    await navigator.clipboard.writeText(link);
    toast.success(c("copied"));
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {sellerId && (
        <RealtimeOrdersListener
          sellerId={sellerId}
          onNewOrder={() => {
            refetchStats();
            refetch();
          }}
        />
      )}

      <section className="relative overflow-hidden rounded-3xl bg-[#070A1F] p-6 text-white md:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_0%,rgba(79,70,229,0.4),transparent_55%),radial-gradient(ellipse_at_90%_100%,rgba(0,169,157,0.35),transparent_55%)]" />
        <div className="relative flex items-center justify-between gap-8">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-black tracking-tight md:text-4xl">
              {firstName ? c("hello_name").replace("{name}", firstName) : c("hello")}
            </h1>
            <p className="mt-2 text-slate-300">{todoTotal > 0 ? c("subtitle_todo").replace("{count}", String(todoTotal)) : c("subtitle_calm")}</p>

            {store ? (
              <>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${online ? "bg-emerald-400/15 text-emerald-300" : "bg-amber-400/15 text-amber-200"}`}>
                    <span className={`h-2 w-2 rounded-full ${online ? "bg-emerald-400" : "bg-amber-300"}`} />
                    {online ? c("online") : c("offline")}
                  </span>
                  <button type="button" onClick={copyLink} className="inline-flex min-w-0 items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/10" dir="ltr">
                    <span className="truncate">{storeDisplayUrl(store.slug, domain)}</span>
                    <Copy className="h-3.5 w-3.5 shrink-0" />
                  </button>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
                  {online ? (
                    <a href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noopener noreferrer" className="col-span-2 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 text-sm font-black text-white transition-transform hover:-translate-y-0.5">
                      <MessageCircle className="h-4 w-4" />
                      {c("share")}
                    </a>
                  ) : (
                    <Link href="/seller/store-builder" className="col-span-2 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-slate-900 transition-transform hover:-translate-y-0.5">
                      <Rocket className="h-4 w-4" />
                      {c("go_online")}
                    </Link>
                  )}
                  <a href={storeViewHref(store.slug, store.is_active, domain)} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/20 px-3 text-sm font-bold transition-colors hover:bg-white/10 sm:px-5">
                    <ExternalLink className="h-4 w-4" />
                    {c("view")}
                  </a>
                  <Link href="/seller/store-builder" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/20 px-3 text-sm font-bold transition-colors hover:bg-white/10 sm:px-5">
                    <Palette className="h-4 w-4" />
                    {c("edit")}
                  </Link>
                </div>
              </>
            ) : (
              <Link href="/seller/store-builder/start" className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-slate-900">
                <Store className="h-4 w-4" />
                {c("create_store")}
              </Link>
            )}
          </div>

          {store && (
            <div className="relative -mb-24 hidden h-[300px] w-[170px] shrink-0 md:block" style={{ perspective: "1200px" }} aria-hidden>
              <PhoneFrame className="w-full" style={{ transform: "rotateY(-14deg) rotateX(4deg)" }}>
                <iframe
                  src={`/preview/${store.slug}`}
                  title={store.name}
                  tabIndex={-1}
                  loading="lazy"
                  className="pointer-events-none origin-top-left border-0"
                  style={{ width: 375, height: 790, transform: "scale(0.408)" }}
                />
              </PhoneFrame>
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <section>
            <h2 className="mb-3 text-lg font-black text-gray-900">{c("todo_title")}</h2>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {TODO_TILES.map(({ status, icon: Icon, tone }) => {
                const count = todo[status];
                return (
                  <Link key={status} href={`/seller/orders?status=${status}`} className={`group rounded-2xl border bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg ${count > 0 ? "border-gray-200" : "border-gray-100"}`}>
                    <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-white ${count > 0 ? tone : "from-gray-200 to-gray-300"}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <p className={`mt-3 text-3xl font-black ${count > 0 ? "text-gray-900" : "text-gray-300"}`}>{count}</p>
                    <p className="mt-0.5 text-sm font-semibold text-gray-500">{c(`todo.${status}`)}</p>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b border-gray-100 p-5">
              <h2 className="text-lg font-black text-gray-900">{c("recent_title")}</h2>
              {recent.length > 0 && (
                <Link href="/seller/orders" className="inline-flex items-center gap-1 text-sm font-bold text-primary">
                  {c("see_all")}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
              )}
            </div>
            {recent.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {recent.map((order) => (
                  <OrderRow key={order.id} order={order} label={c(`status.${order.status}`)} when={timeAgo(order.created_at, locale)} callLabel={c("call")} />
                ))}
              </ul>
            ) : (
              <div className="p-10 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <ShoppingBag className="h-6 w-6" />
                </span>
                <p className="mt-4 text-lg font-black text-gray-900">{c("empty_title")}</p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">{online ? c("empty_online") : c("empty_offline")}</p>
                {online && (
                  <a href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-black text-white">
                    <MessageCircle className="h-4 w-4" />
                    {c("share")}
                  </a>
                )}
              </div>
            )}
          </section>
        </div>

        <div className="min-w-0 space-y-6">
          {completedSteps < steps.length && (
            <section className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-gray-900">{c("setup_title")}</h2>
                <span className="text-sm font-bold text-gray-500">{completedSteps}/{steps.length}</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-gradient-to-r from-[#2E3192] to-[#00A99D] transition-all" style={{ width: `${(completedSteps / steps.length) * 100}%` }} />
              </div>
              <ul className="mt-4 space-y-1">
                {steps.map(({ id, done, icon: Icon, href }) => (
                  <li key={id}>
                    <Link href={href} className={`flex items-center gap-3 rounded-xl p-2 transition-colors ${done ? "text-gray-400" : "text-gray-800 hover:bg-gray-50"}`}>
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${done ? "bg-emerald-50 text-emerald-600" : "bg-primary/10 text-primary"}`}>
                        {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                      </span>
                      <span className={`min-w-0 flex-1 truncate text-sm font-bold ${done ? "line-through" : ""}`}>{t(`seller_app.dashboard.steps.${id}`)}</span>
                      {!done && <ArrowRight className="h-4 w-4 shrink-0 text-gray-400 rtl:rotate-180" />}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {hasActivity ? (
            <section className="rounded-2xl border border-gray-200 bg-white p-5">
              <h2 className="text-lg font-black text-gray-900">{c("month_title")}</h2>
              <p className="mt-3 text-3xl font-black text-gray-900">{formatPrice(stats.totalRevenue)}</p>
              <p className="flex items-center gap-2 text-sm font-semibold text-gray-500">
                {c("delivered_sales")}
                <Change value={stats.revenueChange} />
              </p>
              <div className="mt-5 flex h-24 items-end gap-2" dir="ltr">
                {week.map((day) => (
                  <div key={day.date.toISOString()} className="flex h-full flex-1 flex-col justify-end gap-1 text-center">
                    {day.count > 0 && <span className="text-[10px] font-bold text-gray-500">{day.count}</span>}
                    <span className="block rounded-t-md bg-gradient-to-t from-[#2E3192] to-[#00A99D]" style={{ height: `${Math.max(4, (day.count / weekMax) * 70)}%`, opacity: day.count > 0 ? 1 : 0.2 }} />
                    <span className="text-[10px] font-bold uppercase text-gray-400">{day.date.toLocaleDateString(locale === "ar" ? "ar-TN" : "fr-FR", { weekday: "narrow" })}</span>
                  </div>
                ))}
              </div>
              <dl className="mt-5 grid grid-cols-3 gap-2 border-t border-gray-100 pt-4 text-center">
                {[
                  { key: "orders", value: stats.totalOrders },
                  { key: "visitors", value: stats.totalVisitors },
                  { key: "conversion", value: `${stats.conversionRate}%` },
                ].map(({ key, value }) => (
                  <div key={key}>
                    <dd className="text-lg font-black text-gray-900">{value}</dd>
                    <dt className="text-xs font-semibold text-gray-500">{t(`seller_app.dashboard.stats.${key}`)}</dt>
                  </div>
                ))}
              </dl>
            </section>
          ) : (
            completedSteps === steps.length && (
              <section className="rounded-2xl border border-gray-200 bg-white p-5 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
                <p className="mt-3 font-black text-gray-900">{c("ready_title")}</p>
                <p className="mt-1 text-sm text-gray-500">{c("ready_desc")}</p>
              </section>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function Change({ value }: { value: number }) {
  if (!value) return null;
  const up = value > 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${up ? "text-emerald-600" : "text-red-500"}`} dir="ltr">
      <Icon className="h-3.5 w-3.5" />
      {Math.abs(value)}%
    </span>
  );
}

function OrderRow({ order, label, when, callLabel }: { order: CockpitOrder; label: string; when: string; callLabel: string }) {
  return (
    <li className="flex items-center gap-3 p-4">
      <Link href={`/seller/orders/${order.id}`} className="min-w-0 flex-1">
        <p className="truncate font-bold text-gray-900">{order.customer_name}</p>
        <p className="truncate text-xs text-gray-500"><span className="hidden sm:inline">#{order.order_number} · </span>{when}</p>
      </Link>
      <div className="text-end">
        <p className="whitespace-nowrap text-sm font-black text-gray-900">{formatPrice(order.total_amount)}</p>
        <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${STATUS_TONES[order.status] || STATUS_TONES.cancelled}`}>{label}</span>
      </div>
      <div className="flex shrink-0 gap-1">
        <a href={`tel:${order.customer_phone}`} aria-label={callLabel} className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200">
          <Phone className="h-4 w-4" />
        </a>
        <a href={`https://wa.me/${whatsappNumber(order.customer_phone)}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors hover:bg-emerald-100">
          <MessageCircle className="h-4 w-4" />
        </a>
      </div>
    </li>
  );
}
