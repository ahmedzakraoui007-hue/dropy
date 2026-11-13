"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, ExternalLink, FileText, Film, Image as ImageIcon, Loader2, Search, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import { isVideoUrl } from "@/lib/portfolio";
import { ChipRow, EmptyState, FilterChip, PageHero, PageSkeleton, PrimaryLink } from "@/components/cockpit/ui";

const FILTERS = ["all", "image", "video", "favorite"] as const;

function kind(item: any) {
  const type = String(item.file_type || "");
  if (type === "video" || type.startsWith("video/") || isVideoUrl(item.file_url)) return "video";
  if (type === "image" || type.startsWith("image/")) return "image";
  return "file";
}

function fileName(item: any) {
  if (item.filename) return item.filename;
  try {
    return decodeURIComponent(new URL(item.file_url).pathname.split("/").pop() || "");
  } catch {
    return "";
  }
}

export default function ContentLibraryPage() {
  const { t, locale } = useTranslation();
  const tr = (key: string) => t(`seller_app.library_page.${key}`);
  const u = (key: string) => t(`seller_app.ugc.${key}`);
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: store } = await supabase.from("stores").select("id").eq("vendor_id", user.id).order("created_at", { ascending: true }).limit(1).maybeSingle();
      if (store) {
        const { data } = await supabase.from("content_library").select("*, brief:content_briefs(title)").eq("store_id", store.id).order("created_at", { ascending: false });
        setItems(data || []);
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  if (loading) return <PageSkeleton />;

  const toggleFavorite = async (item: any) => {
    const next = !item.is_favorite;
    setItems((list) => list.map((i) => (i.id === item.id ? { ...i, is_favorite: next } : i)));
    const { error } = await supabase.from("content_library").update({ is_favorite: next }).eq("id", item.id);
    if (error) {
      setItems((list) => list.map((i) => (i.id === item.id ? { ...i, is_favorite: !next } : i)));
      toast.error(u("error"));
    }
  };

  const remove = async (item: any) => {
    if (!window.confirm(u("delete_confirm"))) return;
    setBusy(item.id);
    const { error } = await supabase.from("content_library").delete().eq("id", item.id);
    setBusy(null);
    if (error) toast.error(u("error"));
    else setItems((list) => list.filter((i) => i.id !== item.id));
  };

  const needle = query.trim().toLowerCase();
  const count = (key: string) => items.filter((item) => key === "all" || (key === "favorite" ? item.is_favorite : kind(item) === key)).length;
  const shown = items.filter((item) => {
    if (filter === "favorite" ? !item.is_favorite : filter !== "all" && kind(item) !== filter) return false;
    return !needle || [fileName(item), item.brief?.title].some((v) => String(v || "").toLowerCase().includes(needle));
  });
  const dateLocale = locale === "ar" ? "ar-TN" : "fr-FR";

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHero title={tr("title")} subtitle={items.length ? u(items.length > 1 ? "files_many" : "files_one").replace("{count}", String(items.length)) : tr("subtitle")}>
        {items.length > 0 && (
          <div className="relative mt-6 max-w-xl">
            <Search className="absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tr("search")} className="h-12 w-full rounded-xl border border-white/15 bg-white/10 pe-4 ps-11 text-sm font-semibold text-white outline-none placeholder:text-slate-300 focus:border-white/40" />
          </div>
        )}
      </PageHero>

      {items.length === 0 ? (
        <EmptyState icon={ImageIcon} title={tr("empty_title")} text={tr("empty_text")} action={<PrimaryLink href="/seller/content/briefs">{u("see_briefs")}</PrimaryLink>} />
      ) : (
        <>
          <ChipRow>
            {FILTERS.map((key) => (
              <FilterChip key={key} active={filter === key} onClick={() => setFilter(key)}>
                {u(`filter_${key}`)}
                <span className={`rounded-full px-1.5 text-xs ${filter === key ? "bg-white/20" : "bg-gray-100"}`}>{count(key)}</span>
              </FilterChip>
            ))}
          </ChipRow>

          {shown.length === 0 ? (
            <EmptyState icon={Search} title={u("no_result")} />
          ) : (
            <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {shown.map((item) => {
                const type = kind(item);
                const name = fileName(item);
                return (
                  <article key={item.id} className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-gray-100">
                    {type === "video" ? (
                      <video src={item.file_url} className="h-full w-full object-cover" muted loop playsInline preload="metadata" onMouseEnter={(e) => e.currentTarget.play().catch(() => {})} onMouseLeave={(e) => e.currentTarget.pause()} />
                    ) : type === "image" ? (
                      <img src={item.thumbnail_url || item.file_url} alt={name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-gray-300"><FileText className="h-10 w-10" /></span>
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                    <button type="button" onClick={() => toggleFavorite(item)} aria-pressed={Boolean(item.is_favorite)} aria-label={u("favorite")} className="absolute start-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-700 transition-colors hover:bg-white">
                      <Star className={`h-4 w-4 ${item.is_favorite ? "fill-amber-400 text-amber-400" : ""}`} />
                    </button>
                    <div className="absolute end-2 top-2 flex gap-1.5">
                      <a href={item.file_url} target="_blank" rel="noopener noreferrer" aria-label={u("open")} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-800 transition-colors hover:bg-white"><ExternalLink className="h-4 w-4" /></a>
                      <a href={item.file_url} download={name || true} aria-label={tr("download")} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-800 transition-colors hover:bg-white"><Download className="h-4 w-4" /></a>
                      <button type="button" onClick={() => remove(item)} disabled={busy === item.id} aria-label={u("delete")} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-rose-600 transition-colors hover:bg-white">
                        {busy === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </div>
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3 text-white">
                      <p className="flex items-center gap-1.5 truncate text-sm font-black">
                        {type === "video" ? <Film className="h-3.5 w-3.5 shrink-0" /> : <ImageIcon className="h-3.5 w-3.5 shrink-0" />}
                        <span className="truncate">{item.brief?.title || name}</span>
                      </p>
                      <p className="truncate text-xs text-white/75">{new Date(item.created_at).toLocaleDateString(dateLocale, { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
