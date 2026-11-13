"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Calendar, Plus, Search, Sparkles, Users } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import { SELLER_BRIEF_TONES, sellerBriefState, sellerNeedsAction, type SellerBriefState } from "@/lib/seller-briefs";
import { ChipRow, EmptyState, FilterChip, HeroLink, PageHero, PageSkeleton, PrimaryLink } from "@/components/cockpit/ui";

const TABS: { key: string; states: SellerBriefState[] | null }[] = [
  { key: "all", states: null },
  { key: "todo", states: [] },
  { key: "active", states: ["open", "pay", "checking", "working", "revision", "review"] },
  { key: "done", states: ["done", "cancelled"] },
];

const PRIORITY: Record<SellerBriefState, number> = { review: 0, pay: 1, open: 2, checking: 3, revision: 4, working: 5, draft: 6, done: 7, cancelled: 8 };

const budget = (b: any) => {
  if (b.budget_min && b.budget_max && b.budget_min !== b.budget_max) return `${formatPrice(b.budget_min)} - ${formatPrice(b.budget_max)}`;
  const value = b.budget_max || b.budget_min || b.budget;
  return value ? formatPrice(value) : "";
};

export default function BriefsListPage() {
  const { t, locale } = useTranslation();
  const tr = (key: string) => t(`seller_app.briefs_page.${key}`);
  const u = (key: string) => t(`seller_app.ugc.${key}`);
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [briefs, setBriefs] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: store } = await supabase.from("stores").select("id").eq("vendor_id", user.id).order("created_at", { ascending: true }).limit(1).maybeSingle();
      if (!store) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("content_briefs")
        .select("*, applications:content_applications(status)")
        .eq("store_id", store.id)
        .order("created_at", { ascending: false });
      const ids = (data || []).map((b) => b.id);
      const { data: payments } = ids.length ? await supabase.from("content_payments").select("brief_id").in("brief_id", ids) : { data: [] as any[] };
      const paid = new Set((payments || []).map((p) => p.brief_id));
      const rows = (data || []).map((brief) => {
        const state = sellerBriefState(brief, paid.has(brief.id));
        const pending = (brief.applications || []).filter((a: any) => a.status === "pending").length;
        return { ...brief, state, pending, total: (brief.applications || []).length, action: sellerNeedsAction(state, pending) };
      });
      setBriefs(rows.sort((a, b) => Number(b.action) - Number(a.action) || PRIORITY[a.state as SellerBriefState] - PRIORITY[b.state as SellerBriefState]));
      setLoading(false);
    }
    load();
  }, [supabase]);

  if (loading) return <PageSkeleton />;

  const inTab = (key: string) => {
    if (key === "todo") return briefs.filter((b) => b.action);
    const states = TABS.find((item) => item.key === key)?.states;
    return states ? briefs.filter((b) => states.includes(b.state)) : briefs;
  };
  const needle = query.trim().toLowerCase();
  const shown = inTab(tab).filter((b) => !needle || String(b.title || "").toLowerCase().includes(needle));
  const todo = inTab("todo").length;
  const dateLocale = locale === "ar" ? "ar-TN" : "fr-FR";
  const newBrief = <><Plus className="h-4 w-4" />{tr("new")}</>;

  const actionLabel = (b: any) => {
    if (b.state === "open" && b.pending > 0) return u(b.pending > 1 ? "action_choose_many" : "action_choose_one").replace("{count}", String(b.pending));
    if (b.state === "pay") return u("action_pay");
    if (b.state === "review") return u("action_review");
    return "";
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHero
        title={tr("title")}
        subtitle={todo > 0 ? u(todo > 1 ? "todo_many" : "todo_one").replace("{count}", String(todo)) : tr("subtitle")}
        action={briefs.length > 0 ? <HeroLink href="/seller/content/create-brief">{newBrief}</HeroLink> : undefined}
      >
        {briefs.length > 0 && (
          <div className="relative mt-6 max-w-xl">
            <Search className="absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tr("search")} className="h-12 w-full rounded-xl border border-white/15 bg-white/10 pe-4 ps-11 text-sm font-semibold text-white outline-none placeholder:text-slate-300 focus:border-white/40" />
          </div>
        )}
      </PageHero>

      {briefs.length === 0 ? (
        <EmptyState icon={Sparkles} title={tr("empty_title")} text={tr("empty_text")} action={<PrimaryLink href="/seller/content/create-brief">{newBrief}</PrimaryLink>} />
      ) : (
        <>
          <ChipRow>
            {TABS.map(({ key }) => (
              <FilterChip key={key} active={tab === key} onClick={() => setTab(key)}>
                {u(`tab_${key}`)}
                <span className={`rounded-full px-1.5 text-xs ${tab === key ? "bg-white/20" : "bg-gray-100"}`}>{inTab(key).length}</span>
              </FilterChip>
            ))}
          </ChipRow>

          {shown.length === 0 ? (
            <EmptyState icon={Search} title={u("no_result")} />
          ) : (
            <div className="space-y-3">
              {shown.map((brief) => {
                const action = actionLabel(brief);
                return (
                  <Link key={brief.id} href={`/seller/content/briefs/${brief.id}`} className={`group block rounded-2xl border bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg ${brief.action ? "border-primary/40" : "border-gray-200"}`}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-black text-gray-900 transition-colors group-hover:text-primary">{brief.title}</h2>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                          {brief.content_type && <span>{t(`seller_app.create_brief.types.${brief.content_type}`)}</span>}
                          {budget(brief) && <span className="font-bold text-gray-900">{budget(brief)}</span>}
                          {brief.deadline && <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(brief.deadline).toLocaleDateString(dateLocale, { day: "numeric", month: "short" })}</span>}
                          <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{u(brief.total === 1 ? "applications_one" : "applications_many").replace("{count}", String(brief.total))}</span>
                        </p>
                      </div>
                      <span className={`shrink-0 self-start rounded-full px-2.5 py-1 text-[11px] font-bold ${SELLER_BRIEF_TONES[brief.state as SellerBriefState]}`}>{u(`state_${brief.state}`)}</span>
                    </div>
                    <div className="mt-4 flex items-center justify-end">
                      {action ? (
                        <span className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-black text-white">
                          {action}
                          <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-sm font-bold text-primary">
                          {tr("details")}
                          <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
