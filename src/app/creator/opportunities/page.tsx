"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, Camera, Check, MapPin, Search, Sparkles, Target } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import { calculateMatchScore } from "@/lib/matching";
import { EmptyState, PageHero, PageSkeleton, PrimaryLink, budgetLabel, useCreatorText } from "@/components/creator/shared";

const SORTS = ["best", "recent", "budget"] as const;

const topBudget = (brief: any) => Number(brief.budget_max || brief.budget_min || brief.budget || 0);

export default function OpportunitiesPage() {
  const { t } = useTranslation();
  const tr = (key: string) => t(`creator_app.opportunities.${key}`);
  const { typeLabel, date, deadline } = useCreatorText();
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [briefs, setBriefs] = useState<any[]>([]);
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [sort, setSort] = useState<(typeof SORTS)[number]>("best");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: profile }, { data: rows }, { data: applications }] = await Promise.all([
        supabase.from("creator_profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase
          .from("content_briefs")
          .select("*, store:stores(name, logo_url)")
          .eq("status", "published")
          .is("selected_creator_id", null)
          .order("created_at", { ascending: false }),
        supabase.from("content_applications").select("brief_id").eq("creator_id", user.id),
      ]);

      const scored = await Promise.all(
        (rows || []).map(async (brief) => ({ ...brief, matchScore: profile ? (await calculateMatchScore(profile, brief)).score : 0 }))
      );
      setBriefs(scored);
      setApplied(new Set((applications || []).map((a) => a.brief_id)));
      setLoading(false);
    }
    load();
  }, [supabase]);

  if (loading) return <PageSkeleton />;

  const types = Array.from(new Set(briefs.map((b) => b.content_type).filter(Boolean))) as string[];
  const needle = query.trim().toLowerCase();
  const filtered = briefs.filter((brief) => {
    if (type !== "all" && brief.content_type !== type) return false;
    if (!needle) return true;
    return [brief.title, brief.description, brief.store?.name, typeLabel(brief.content_type)].some((v) => String(v || "").toLowerCase().includes(needle));
  });
  const shown = sort === "best"
    ? [...filtered].sort((a, b) => b.matchScore - a.matchScore)
    : sort === "budget"
      ? [...filtered].sort((a, b) => topBudget(b) - topBudget(a))
      : filtered;

  const chip = (active: boolean) => `shrink-0 rounded-full px-3.5 py-1.5 text-sm font-bold transition-colors ${active ? "bg-primary text-white" : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"}`;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHero
        title={tr("opportunites_de_projets")}
        subtitle={briefs.length > 0 ? tr(briefs.length > 1 ? "open_count" : "open_count_one").replace("{count}", String(briefs.length)) : tr("trouvez_les_missions_parfaites_correspondant")}
      >
        {briefs.length > 0 && (
          <div className="relative mt-6 max-w-xl">
            <Search className="absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tr("rechercher_des_missions")}
              className="h-12 w-full rounded-xl border border-white/15 bg-white/10 pe-4 ps-11 text-sm font-semibold text-white outline-none placeholder:text-slate-300 focus:border-white/40"
            />
          </div>
        )}
      </PageHero>

      {briefs.length === 0 ? (
        <EmptyState
          icon={Target}
          title={tr("aucune_opportunite_pour_le_moment")}
          text={tr("revenez_plus_tard_pour_de")}
          action={<PrimaryLink href="/creator/portfolio"><Camera className="h-4 w-4" />{tr("empty_cta")}</PrimaryLink>}
        />
      ) : (
        <>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
              <button type="button" onClick={() => setType("all")} className={chip(type === "all")}>{tr("all")}</button>
              {types.map((value) => <button key={value} type="button" onClick={() => setType(value)} className={chip(type === value)}>{typeLabel(value)}</button>)}
            </div>
            <div className="flex shrink-0 rounded-xl bg-gray-100 p-1">
              {SORTS.map((value) => (
                <button key={value} type="button" onClick={() => setSort(value)} className={`flex-1 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-bold transition-colors ${sort === value ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
                  {tr(`sort_${value}`)}
                </button>
              ))}
            </div>
          </div>

          {shown.length === 0 ? (
            <EmptyState
              icon={Search}
              title={tr("no_result_title")}
              text={tr("no_result_desc")}
              action={<button type="button" onClick={() => { setQuery(""); setType("all"); }} className="text-sm font-bold text-primary">{tr("clear")}</button>}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {shown.map((brief) => {
                const images = (brief.products || []).map((p: any) => p.image || p.image_url).filter(Boolean).slice(0, 3);
                const left = deadline(brief.deadline);
                return (
                  <Link key={brief.id} href={`/creator/opportunities/${brief.id}`} className="group flex min-w-0 flex-col rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/10 font-black text-primary">
                        {brief.store?.logo_url ? <img src={brief.store.logo_url} alt="" className="h-full w-full object-cover" /> : (brief.store?.name?.[0] || "D").toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-gray-900">{brief.store?.name}</span>
                        <span className="block truncate text-xs text-gray-500">{typeLabel(brief.content_type)}</span>
                      </span>
                      {applied.has(brief.id) ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700"><Check className="h-3 w-3" />{tr("applied")}</span>
                      ) : brief.matchScore >= 70 ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-white"><Sparkles className="h-3 w-3" />{tr("match").replace("{score}", String(brief.matchScore))}</span>
                      ) : null}
                    </div>

                    <h2 className="mt-4 line-clamp-2 text-lg font-black leading-snug text-gray-900 transition-colors group-hover:text-primary">{brief.title}</h2>
                    <p className="mt-1 line-clamp-2 text-sm text-gray-500">{brief.description}</p>

                    {images.length > 0 && (
                      <div className="mt-3 flex items-center gap-2">
                        <div className="flex -space-x-2 rtl:space-x-reverse">
                          {images.map((src: string) => <img key={src} src={src} alt="" className="h-8 w-8 rounded-lg border-2 border-white object-cover" />)}
                        </div>
                        <span className="text-xs text-gray-500">{tr("products").replace("{count}", String(brief.products.length))}</span>
                      </div>
                    )}

                    <div className="mt-auto pt-4">
                      <p className="text-lg font-black text-gray-900">{budgetLabel(brief) || tr("negotiable")}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-gray-500">
                        {brief.deadline && (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {date(brief.deadline)}
                            {left && <span className={left.urgent ? "text-rose-600" : ""}>· {left.label}</span>}
                          </span>
                        )}
                        {brief.preferred_city && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{brief.preferred_city}</span>}
                      </div>
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
