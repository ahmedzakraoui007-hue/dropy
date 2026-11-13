"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Camera, ExternalLink, MapPin, Plus, Search, Star } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import { fetchProfileCards } from "@/lib/profile-cards";
import { normalizeSpecialty } from "@/lib/matching";
import { formatPrice } from "@/lib/utils";
import { CreatorPortfolioDialog } from "@/components/content/CreatorPortfolioDialog";
import { ChipRow, EmptyState, FilterChip, HeroLink, PageHero, PageSkeleton, Panel } from "@/components/cockpit/ui";

const TYPES = ["photography", "video", "ugc", "design", "copywriting"];

export default function CreatorMarketplace() {
  const { t } = useTranslation();
  const tr = (key: string) => t(`seller_app.creators_page.${key}`);
  const u = (key: string) => t(`seller_app.ugc.${key}`);
  const supabase = useMemo(() => createClient(), []);
  const [creators, setCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("creator_profiles")
        .select("user_id, display_name, bio, city, specialties, specialty, rating, total_reviews, total_projects, min_project_budget, is_verified, public_slug, portfolio_public")
        .in("status", ["active", "approved"]);
      const rows = data || [];
      const ids = rows.map((c) => c.user_id);
      const [cards, { data: works }] = await Promise.all([
        fetchProfileCards(supabase, ids),
        ids.length
          ? supabase.from("creator_portfolio").select("creator_id, thumbnail_url").in("creator_id", ids).not("thumbnail_url", "is", null).order("created_at", { ascending: false })
          : Promise.resolve({ data: [] as any[] }),
      ]);
      const covers = new Map<string, string[]>();
      for (const work of works || []) {
        const list = covers.get(work.creator_id) || [];
        if (list.length < 3 && /^https?:\/\//.test(work.thumbnail_url)) list.push(work.thumbnail_url);
        covers.set(work.creator_id, list);
      }
      setCreators(rows.map((c) => {
        const card = cards.get(c.user_id);
        const raw = Array.isArray(c.specialties) && c.specialties.length ? c.specialties : c.specialty ? [c.specialty] : [];
        return {
          ...c,
          name: c.display_name || card?.full_name?.split(" ")[0] || tr("creator"),
          avatar: card?.avatar_url || null,
          types: Array.from(new Set(raw.map((s: string) => normalizeSpecialty(String(s))))).filter((s) => TYPES.includes(s as string)) as string[],
          covers: covers.get(c.user_id) || [],
        };
      }).sort((a, b) => b.covers.length - a.covers.length || (b.total_projects || 0) - (a.total_projects || 0)));
      setLoading(false);
    }
    load();
  }, [supabase]);

  if (loading) return <PageSkeleton />;

  const needle = search.trim().toLowerCase();
  const shown = creators.filter((c) => {
    if (type !== "all" && !c.types.includes(type)) return false;
    return !needle || [c.name, c.bio, c.city].some((v) => String(v || "").toLowerCase().includes(needle));
  });
  const typeLabel = (value: string) => t(`seller_app.create_brief.types.${value}`);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHero
        title={tr("title")}
        subtitle={creators.length ? u(creators.length > 1 ? "creators_many" : "creators_one").replace("{count}", String(creators.length)) : tr("subtitle")}
        action={<HeroLink href="/seller/content/create-brief"><Plus className="h-4 w-4" />{tr("new_brief")}</HeroLink>}
      >
        {creators.length > 0 && (
          <div className="relative mt-6 max-w-xl">
            <Search className="absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tr("search")} className="h-12 w-full rounded-xl border border-white/15 bg-white/10 pe-4 ps-11 text-sm font-semibold text-white outline-none placeholder:text-slate-300 focus:border-white/40" />
          </div>
        )}
      </PageHero>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="min-w-0 space-y-4 lg:col-span-3">
          {creators.length > 0 && (
            <ChipRow>
              <FilterChip active={type === "all"} onClick={() => setType("all")}>{tr("all_specialties")}</FilterChip>
              {TYPES.map((value) => <FilterChip key={value} active={type === value} onClick={() => setType(value)}>{typeLabel(value)}</FilterChip>)}
            </ChipRow>
          )}

          {shown.length === 0 ? (
            <EmptyState icon={Camera} title={tr("empty_title")} text={creators.length ? tr("empty_text") : u("no_creators")} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {shown.map((creator) => (
                <article key={creator.user_id} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white">
                  <div className="grid aspect-[16/9] grid-cols-3 gap-0.5 bg-gray-100">
                    {creator.covers.length > 0 ? (
                      creator.covers.map((src: string, i: number) => <img key={src} src={src} alt="" className={`h-full w-full object-cover ${creator.covers.length === 1 ? "col-span-3" : creator.covers.length === 2 && i === 0 ? "col-span-2" : ""}`} />)
                    ) : (
                      <span className="col-span-3 flex items-center justify-center text-gray-300"><Camera className="h-8 w-8" /></span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 font-black text-primary">
                        {creator.avatar ? <img src={creator.avatar} alt="" className="h-full w-full object-cover" /> : creator.name[0]?.toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1 font-black text-gray-900">
                          <span className="truncate">{creator.name}</span>
                          {creator.is_verified && <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />}
                        </span>
                        {creator.city && <span className="flex items-center gap-1 text-xs text-gray-500"><MapPin className="h-3 w-3" />{creator.city}</span>}
                      </span>
                      {creator.total_reviews > 0 && (
                        <span className="shrink-0 text-end">
                          <span className="flex items-center gap-1 text-sm font-black text-gray-900"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{Number(creator.rating).toFixed(1)}</span>
                          <span className="block text-[11px] text-gray-500">{creator.total_reviews} {tr("reviews")}</span>
                        </span>
                      )}
                    </div>
                    {creator.types.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {creator.types.map((value: string) => <span key={value} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-600">{typeLabel(value)}</span>)}
                      </div>
                    )}
                    {creator.bio && <p className="mt-3 line-clamp-2 text-sm text-gray-500">{creator.bio}</p>}
                    <div className="mt-auto flex items-end justify-between gap-3 pt-4">
                      <span className="text-sm text-gray-500">
                        {Number(creator.min_project_budget) > 0 && <><span className="block text-[11px] font-bold uppercase text-gray-400">{tr("from")}</span><span className="font-black text-gray-900">{formatPrice(Number(creator.min_project_budget))}</span></>}
                        {!(Number(creator.min_project_budget) > 0) && creator.total_projects > 0 && u("missions_done").replace("{count}", String(creator.total_projects))}
                      </span>
                      {creator.portfolio_public && creator.public_slug && (
                        <a href={`/createurs/${creator.public_slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-bold text-primary">
                          {u("public_page")}
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                    <div className="mt-4"><CreatorPortfolioDialog creatorId={creator.user_id} creatorName={creator.name} /></div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="min-w-0 space-y-6">
          <Panel title={tr("how")}>
            <ol className="space-y-3">
              {["step1", "step2", "step3", "step4"].map((key, i) => (
                <li key={key} className="flex gap-3 text-sm text-gray-600">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">{i + 1}</span>
                  {tr(key)}
                </li>
              ))}
            </ol>
          </Panel>
          <Panel title={tr("help_title")}>
            <p className="text-sm text-gray-500">{tr("help_text")}</p>
            <Link href="/contact" className="mt-3 inline-flex h-10 items-center rounded-xl border border-gray-200 px-4 text-sm font-black text-gray-900 hover:bg-gray-50">{tr("help_cta")}</Link>
          </Panel>
        </div>
      </div>
    </div>
  );
}
