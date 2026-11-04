"use client";

import { formatPrice } from "@/lib/utils";
import { useTranslation } from "@/context/LanguageContext";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BadgeCheck, Briefcase, Calendar, Camera, Check, CheckCircle2, Clock, Copy, CreditCard, ExternalLink, Globe, Instagram, MessageCircle, Plus, RefreshCw, Sparkles, Star, Upload, Wallet } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { SITE_URL } from "@/lib/store-url";

interface Mission {
  id: string;
  title: string;
  status: string;
  updated_at: string | null;
  created_at: string;
  store: { name: string | null } | null;
}

interface Brief {
  id: string;
  title: string;
  content_type: string | null;
  budget: number | null;
  budget_min: number | null;
  budget_max: number | null;
  deadline: string | null;
  store: { name: string | null; logo_url: string | null } | null;
}

const MISSION_TONES: Record<string, string> = {
  published: "bg-gray-100 text-gray-600",
  assigned: "bg-amber-50 text-amber-700",
  in_progress: "bg-rose-50 text-rose-700",
  delivered: "bg-sky-50 text-sky-700",
  completed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-gray-100 text-gray-500",
};

const TILES = [
  { key: "assigned", icon: Upload, tone: "from-amber-400 to-orange-500", href: "/creator/missions" },
  { key: "in_progress", icon: RefreshCw, tone: "from-rose-400 to-pink-600", href: "/creator/missions" },
  { key: "delivered", icon: Clock, tone: "from-sky-400 to-blue-600", href: "/creator/missions" },
  { key: "briefs", icon: Sparkles, tone: "from-violet-500 to-[#00A99D]", href: "/creator/opportunities" },
] as const;

function since(date: string, tr: (key: string) => string) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86400000));
  return days === 0 ? tr("today") : tr(days > 1 ? "days_ago" : "day_ago").replace("{n}", String(days));
}

function budgetLabel(brief: Brief) {
  if (brief.budget_min && brief.budget_max && brief.budget_min !== brief.budget_max) return `${formatPrice(brief.budget_min)} - ${formatPrice(brief.budget_max)}`;
  const value = brief.budget_max || brief.budget_min || brief.budget;
  return value ? formatPrice(value) : "";
}

export default function CreatorDashboard() {
  const { t: tt, locale } = useTranslation();
  const tr = (key: string) => tt(`creator_app.dashboard.${key}`);
  const c = (key: string) => tt(`creator_app.cockpit.${key}`);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [creator, setCreator] = useState<any>(null);
  const [name, setName] = useState("");
  const [missions, setMissions] = useState<Mission[]>([]);
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [briefCount, setBriefCount] = useState(0);
  const [covers, setCovers] = useState<string[]>([]);
  const [paid, setPaid] = useState(0);
  const [escrow, setEscrow] = useState(0);
  const [steps, setSteps] = useState<{ id: string; done: boolean; href: string; icon: typeof Camera }[]>([]);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: cp } = await supabase.from("creator_profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (!cp) {
        router.replace("/creator/signup");
        return;
      }

      const [{ data: ownBriefs }, { data: open, count: openCount }, { data: payments }, { data: items, count: portfolioCount }, { data: profile }] = await Promise.all([
        supabase
          .from("content_briefs")
          .select("id, title, status, updated_at, created_at, store:stores(name)")
          .eq("selected_creator_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(20),
        supabase
          .from("content_briefs")
          .select("id, title, content_type, budget, budget_min, budget_max, deadline, store:stores(name, logo_url)", { count: "exact" })
          .eq("status", "published")
          .is("selected_creator_id", null)
          .order("created_at", { ascending: false })
          .limit(3),
        supabase.from("content_payments").select("creator_amount, status, escrowed_at").eq("creator_id", user.id),
        supabase.from("creator_portfolio").select("thumbnail_url", { count: "exact" }).eq("creator_id", user.id).order("created_at", { ascending: false }).limit(12),
        supabase.from("profiles").select("full_name, bank_rib, d17_number, flouci_number").eq("id", user.id).maybeSingle(),
      ]);

      const total = (rows: any[]) => rows.reduce((sum, p) => sum + Number(p.creator_amount || 0), 0);
      setCreator(cp);
      setName(cp.display_name || profile?.full_name?.split(" ")[0] || "");
      setMissions((ownBriefs as unknown as Mission[]) || []);
      setBriefs((open as unknown as Brief[]) || []);
      setBriefCount(openCount || 0);
      setCovers((items || []).map((item) => item.thumbnail_url).filter((url): url is string => Boolean(url && /^https?:\/\//.test(url))).slice(0, 3));
      setPaid(total((payments || []).filter((p) => p.status === "released")));
      setEscrow(total((payments || []).filter((p) => p.escrowed_at && !["released", "refunded"].includes(p.status))));
      setSteps([
        { id: "portfolio", done: (portfolioCount || 0) >= 3, href: "/creator/portfolio", icon: Camera },
        { id: "publish", done: cp.portfolio_public === true, href: "/creator/portfolio", icon: Globe },
        { id: "social", done: Boolean(cp.instagram_handle || cp.instagram_username || cp.tiktok_handle), href: "/creator/settings", icon: Instagram },
        { id: "payout", done: Boolean(profile?.bank_rib || profile?.d17_number || profile?.flouci_number), href: "/creator/settings", icon: CreditCard },
      ]);
      setLoading(false);
    }
    loadData();
  }, [router]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl animate-pulse space-y-6">
        <div className="h-56 rounded-3xl bg-gray-200" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-28 rounded-2xl bg-gray-200" />)}
        </div>
      </div>
    );
  }

  const isPublic = creator?.portfolio_public === true && Boolean(creator?.public_slug);
  const url = `${SITE_URL}/createurs/${creator?.public_slug}`;
  const shareText = encodeURIComponent(`${c("share_text")} ${url}`);
  const count = (status: string) => missions.filter((m) => m.status === status).length;
  const tileValue = { assigned: count("assigned"), in_progress: count("in_progress"), delivered: count("delivered"), briefs: briefCount };
  const active = missions.filter((m) => ["published", "assigned", "in_progress", "delivered"].includes(m.status));
  const shown = active.length ? active : missions;
  const todo = tileValue.assigned + tileValue.in_progress;
  const doneSteps = steps.filter((step) => step.done).length;
  const hasEarnings = paid > 0 || escrow > 0;
  const hasRating = creator?.total_reviews > 0;

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    toast.success(c("copied"));
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-[#0E0A24] p-6 text-white md:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_0%,rgba(139,92,246,0.5),transparent_55%),radial-gradient(ellipse_at_90%_100%,rgba(0,169,157,0.35),transparent_55%)]" />
        <div className="relative flex items-center justify-between gap-8">
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight md:text-4xl">
              <span className="min-w-0 break-words">{name ? c("hello_name").replace("{name}", name) : c("hello")}</span>
              {creator?.is_verified && <BadgeCheck className="h-6 w-6 shrink-0 text-teal-300" />}
            </h1>
            <p className="mt-2 text-slate-300">{todo > 0 ? c("subtitle_todo").replace("{count}", String(todo)) : briefCount > 0 ? c("subtitle_briefs").replace("{count}", String(briefCount)) : c("subtitle_calm")}</p>

            {isPublic ? (
              <>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    {c("public")}
                  </span>
                  <button type="button" onClick={copyLink} className="inline-flex min-w-0 items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/10" dir="ltr">
                    <span className="truncate">{url.replace(/^https?:\/\//, "")}</span>
                    <Copy className="h-3.5 w-3.5 shrink-0" />
                  </button>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
                  <a href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noopener noreferrer" className="col-span-2 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 text-sm font-black text-white transition-transform hover:-translate-y-0.5">
                    <MessageCircle className="h-4 w-4" />
                    {c("share")}
                  </a>
                  <a href={`/createurs/${creator.public_slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/20 px-3 text-sm font-bold transition-colors hover:bg-white/10 sm:px-5">
                    <ExternalLink className="h-4 w-4" />
                    {c("view")}
                  </a>
                  <Link href="/creator/portfolio" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/20 px-3 text-sm font-bold transition-colors hover:bg-white/10 sm:px-5">
                    <Plus className="h-4 w-4" />
                    {c("add_work")}
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="mt-6 max-w-md text-sm text-slate-300">{c("publish_desc")}</p>
                <Link href="/creator/portfolio" className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-slate-900 transition-transform hover:-translate-y-0.5">
                  <Globe className="h-4 w-4" />
                  {c("publish")}
                </Link>
              </>
            )}
          </div>

          <div className="relative hidden h-52 w-64 shrink-0 md:block" aria-hidden>
            {[0, 1, 2].map((i) => {
              const cover = covers[i];
              const transform = ["translateX(-72px) rotate(-10deg) scale(0.9)", "translateX(72px) rotate(10deg) scale(0.9)", "translateY(-6px)"][i];
              return (
                <div key={i} className="absolute left-1/2 top-0 -ml-[68px] h-48 w-[136px] overflow-hidden rounded-2xl bg-white/10 shadow-2xl ring-1 ring-white/20" style={{ transform, zIndex: i }}>
                  {cover ? <img src={cover} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center text-white/40"><Camera className="h-7 w-7" /></span>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <section>
            <h2 className="mb-3 text-lg font-black text-gray-900">{c("todo_title")}</h2>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {TILES.map(({ key, icon: Icon, tone, href }) => {
                const value = tileValue[key];
                return (
                  <Link key={key} href={href} className={`rounded-2xl border bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg ${value > 0 ? "border-gray-200" : "border-gray-100"}`}>
                    <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-white ${value > 0 ? tone : "from-gray-200 to-gray-300"}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <p className={`mt-3 text-3xl font-black ${value > 0 ? "text-gray-900" : "text-gray-300"}`}>{value}</p>
                    <p className="mt-0.5 text-sm font-semibold text-gray-500">{c(`tiles.${key}`)}</p>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b border-gray-100 p-5">
              <h2 className="text-lg font-black text-gray-900">{c("briefs_title")}</h2>
              {briefs.length > 0 && (
                <Link href="/creator/opportunities" className="inline-flex items-center gap-1 text-sm font-bold text-primary">
                  {c("see_all")}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
              )}
            </div>
            {briefs.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {briefs.map((brief) => (
                  <li key={brief.id}>
                    <Link href={`/creator/opportunities/${brief.id}`} className="flex items-center gap-3 p-4 transition-colors hover:bg-gray-50">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10 text-primary">
                        {brief.store?.logo_url ? <img src={brief.store.logo_url} alt="" className="h-full w-full object-cover" /> : <Briefcase className="h-5 w-5" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-bold text-gray-900">{brief.title}</span>
                        <span className="flex items-center gap-2 truncate text-xs text-gray-500">
                          {brief.store?.name}
                          {brief.deadline && (
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(brief.deadline).toLocaleDateString(locale === "ar" ? "ar-TN" : "fr-FR", { day: "numeric", month: "short" })}
                            </span>
                          )}
                        </span>
                        {budgetLabel(brief) && <span className="mt-0.5 block text-sm font-black text-gray-900 sm:hidden">{budgetLabel(brief)}</span>}
                      </span>
                      {budgetLabel(brief) && <span className="hidden whitespace-nowrap text-sm font-black text-gray-900 sm:block">{budgetLabel(brief)}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-10 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Sparkles className="h-6 w-6" /></span>
                <p className="mt-4 text-lg font-black text-gray-900">{c("no_briefs_title")}</p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">{c("no_briefs_desc")}</p>
              </div>
            )}
          </section>

          {shown.length > 0 && (
            <section className="rounded-2xl border border-gray-200 bg-white">
              <div className="flex items-center justify-between border-b border-gray-100 p-5">
                <h2 className="text-lg font-black text-gray-900">{c("missions_title")}</h2>
                <Link href="/creator/missions" className="inline-flex items-center gap-1 text-sm font-bold text-primary">
                  {c("see_all")}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
              </div>
              <ul className="divide-y divide-gray-100">
                {shown.slice(0, 5).map((mission) => (
                  <li key={mission.id}>
                    <Link href={`/creator/missions/${mission.id}`} className="flex items-center gap-3 p-4 transition-colors hover:bg-gray-50">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-bold text-gray-900">{mission.title}</span>
                        <span className="block truncate text-xs text-gray-500">{mission.store?.name} · {since(mission.updated_at || mission.created_at, tr)}</span>
                      </span>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${MISSION_TONES[mission.status] || MISSION_TONES.cancelled}`}>{tr(`mission_${mission.status}`)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="min-w-0 space-y-6">
          {doneSteps < steps.length && (
            <section className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-gray-900">{c("setup_title")}</h2>
                <span className="text-sm font-bold text-gray-500">{doneSteps}/{steps.length}</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-[#00A99D] transition-all" style={{ width: `${(doneSteps / steps.length) * 100}%` }} />
              </div>
              <ul className="mt-4 space-y-1">
                {steps.map(({ id, done, icon: Icon, href }) => (
                  <li key={id}>
                    <Link href={href} className={`flex items-center gap-3 rounded-xl p-2 transition-colors ${done ? "text-gray-400" : "text-gray-800 hover:bg-gray-50"}`}>
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${done ? "bg-emerald-50 text-emerald-600" : "bg-primary/10 text-primary"}`}>
                        {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                      </span>
                      <span className={`min-w-0 flex-1 truncate text-sm font-bold ${done ? "line-through" : ""}`}>{c(`steps.${id}`)}</span>
                      {!done && <ArrowRight className="h-4 w-4 shrink-0 text-gray-400 rtl:rotate-180" />}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {hasEarnings ? (
            <section className="rounded-2xl border border-gray-200 bg-white p-5">
              <h2 className="text-lg font-black text-gray-900">{c("earnings_title")}</h2>
              <p className="mt-3 text-3xl font-black text-gray-900">{formatPrice(paid)}</p>
              <p className="text-sm font-semibold text-gray-500">{c("earned")}</p>
              {escrow > 0 && (
                <div className="mt-4 flex items-center justify-between rounded-xl bg-violet-50 p-3">
                  <span className="text-sm font-semibold text-violet-800">{c("escrow")}</span>
                  <span className="text-sm font-black text-violet-900">{formatPrice(escrow)}</span>
                </div>
              )}
              <Link href="/creator/payments" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary">
                {c("see_payments")}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </section>
          ) : (
            <section className="rounded-2xl border border-gray-200 bg-white p-5 text-center">
              <Wallet className="mx-auto h-8 w-8 text-primary" />
              <p className="mt-3 font-black text-gray-900">{c("first_earnings_title")}</p>
              <p className="mt-1 text-sm text-gray-500">{c("first_earnings_desc")}</p>
            </section>
          )}

          {hasRating && (
            <Link href="/creator/reviews" className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-lg">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-500"><Star className="h-5 w-5 fill-current" /></span>
              <span>
                <span className="block text-2xl font-black text-gray-900">{Number(creator.rating).toFixed(1)}/5</span>
                <span className="block text-sm font-semibold text-gray-500">{c("reviews").replace("{count}", String(creator.total_reviews))}</span>
              </span>
            </Link>
          )}

          {doneSteps === steps.length && !hasEarnings && (
            <p className="flex items-center justify-center gap-2 text-sm font-semibold text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
              {c("profile_ready")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
