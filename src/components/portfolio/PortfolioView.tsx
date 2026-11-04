"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BadgeCheck, ChevronLeft, ChevronRight, ExternalLink, Instagram, MapPin, Play, Share2, Star, X } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/context/LanguageContext";
import { isVideoUrl, portfolioCategoryKey } from "@/lib/portfolio";
import type { PublicCreator, PublicItem } from "@/lib/creator-portfolio";

const mediaUrl = (item: PublicItem) => item.content_url || item.thumbnail_url || "";
const isVideo = (item: PublicItem) => item.type === "video" || isVideoUrl(item.content_url);

function Tile({ item, onOpen, linkLabel }: { item: PublicItem; onOpen: () => void; linkLabel: string }) {
  const [broken, setBroken] = useState(false);
  const video = isVideo(item);

  if (broken) {
    return (
      <a href={mediaUrl(item)} target="_blank" rel="noopener noreferrer nofollow" className="mb-3 flex aspect-square break-inside-avoid flex-col items-center justify-center gap-2 rounded-2xl bg-slate-100 p-4 text-center text-sm font-bold text-slate-700">
        <ExternalLink className="h-5 w-5" />
        {item.title}
        <span className="text-xs font-semibold text-slate-500">{linkLabel}</span>
      </a>
    );
  }

  return (
    <button type="button" onClick={onOpen} className="group relative mb-3 block w-full break-inside-avoid overflow-hidden rounded-2xl bg-slate-100 text-start">
      {video ? (
        <video src={`${item.content_url}#t=0.1`} muted playsInline preload="metadata" onError={() => setBroken(true)} className="w-full" />
      ) : (
        <img src={item.thumbnail_url || mediaUrl(item)} alt={item.title} loading="lazy" onError={() => setBroken(true)} className="w-full transition-transform duration-500 group-hover:scale-105" />
      )}
      {video && (
        <span className="absolute end-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur">
          <Play className="h-4 w-4 fill-current" />
        </span>
      )}
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-10 text-sm font-bold text-white opacity-0 transition-opacity group-hover:opacity-100 max-md:opacity-100">
        {item.title}
      </span>
    </button>
  );
}

export function PortfolioView({ creator, items, url }: { creator: PublicCreator; items: PublicItem[]; url: string }) {
  const { t, dir } = useTranslation();
  const p = (key: string) => t(`portfolio_public.${key}`);
  const [filter, setFilter] = useState<string | null>(null);
  const [open, setOpen] = useState<number | null>(null);

  const categories = useMemo(() => [...new Set(items.map((item) => portfolioCategoryKey(item.category)).filter(Boolean))] as string[], [items]);
  const visible = filter ? items.filter((item) => portfolioCategoryKey(item.category) === filter) : items;
  const current = open === null ? null : visible[open];

  const step = (delta: number) => setOpen((value) => (value === null ? null : (value + delta + visible.length) % visible.length));

  useEffect(() => {
    if (open === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(null);
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title: creator.name, url }).catch(() => {});
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success(p("copied"));
  };

  return (
    <div className="min-h-screen bg-[#FBFBFD]" dir={dir}>
      <section className="relative overflow-hidden bg-[#070A1F] px-6 pb-16 pt-36 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(79,70,229,0.4),transparent_55%),radial-gradient(ellipse_at_85%_100%,rgba(0,169,157,0.35),transparent_55%)]" />
        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-8 text-center md:flex-row md:items-start md:text-start">
          <span className="block h-32 w-32 shrink-0 rounded-full bg-gradient-to-br from-violet-400 to-teal-300 p-1">
            {creator.avatar ? (
              <img src={creator.avatar} alt={creator.name} className="h-full w-full rounded-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center rounded-full bg-[#070A1F] text-5xl font-black">{creator.name.charAt(0).toUpperCase()}</span>
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-teal-200">{p("eyebrow")}</p>
            <h1 className="mt-2 flex items-center justify-center gap-2 text-4xl font-black tracking-tight md:justify-start md:text-6xl">
              <span className="min-w-0 break-words">{creator.name}</span>
              {creator.verified && <BadgeCheck className="h-7 w-7 shrink-0 text-teal-300" aria-label={p("verified")} />}
            </h1>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-semibold text-slate-300 md:justify-start">
              {creator.city && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{creator.city}</span>}
              {creator.instagram && (
                <a href={`https://instagram.com/${creator.instagram}`} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center gap-1.5 hover:text-white" dir="ltr">
                  <Instagram className="h-4 w-4" />@{creator.instagram}
                </a>
              )}
              {creator.tiktok && (
                <a href={`https://www.tiktok.com/@${creator.tiktok}`} target="_blank" rel="noopener noreferrer nofollow" className="hover:text-white" dir="ltr">
                  TikTok @{creator.tiktok}
                </a>
              )}
              {creator.rating !== null && <span className="flex items-center gap-1.5"><Star className="h-4 w-4 fill-amber-300 text-amber-300" />{creator.rating.toFixed(1)} ({creator.reviews})</span>}
              {creator.projects > 0 && <span>{p("projects").replace("{count}", String(creator.projects))}</span>}
            </div>
            {creator.bio && <p className="mt-5 max-w-2xl whitespace-pre-wrap leading-relaxed text-slate-300">{creator.bio}</p>}
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row md:justify-start">
              <Link href="/inscription" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-black text-slate-900 transition-transform hover:-translate-y-0.5">
                {p("hire").replace("{name}", creator.name)}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
              <button type="button" onClick={share} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/20 px-6 text-sm font-bold transition-colors hover:bg-white/10">
                <Share2 className="h-4 w-4" />
                {p("share")}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        {categories.length > 1 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {[null, ...categories].map((key) => (
              <button key={key || "all"} type="button" onClick={() => setFilter(key)} className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${filter === key ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-slate-400"}`}>
                {key ? t(`portfolio_public.categories.${key}`) : p("all")}
              </button>
            ))}
          </div>
        )}
        {visible.length > 0 ? (
          <div className="columns-2 gap-3 md:columns-3 lg:columns-4">
            {visible.map((item, i) => <Tile key={item.id} item={item} onOpen={() => setOpen(i)} linkLabel={p("open_link")} />)}
          </div>
        ) : (
          <p className="py-16 text-center text-slate-500">{p("empty")}</p>
        )}
      </section>

      <section className="px-4 pb-20 md:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 rounded-3xl bg-gradient-to-r from-[#2E3192] to-[#00A99D] p-8 text-center text-white md:flex-row md:text-start">
          <div>
            <p className="text-2xl font-black">{p("cta_title")}</p>
            <p className="mt-1 text-white/80">{p("cta_desc")}</p>
          </div>
          <Link href="/inscription" className="inline-flex h-12 shrink-0 items-center gap-2 rounded-xl bg-white px-6 text-sm font-black text-slate-900">
            {p("cta_button")}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </div>
      </section>

      {current && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4" role="dialog" aria-modal="true" aria-label={current.title} onClick={() => setOpen(null)}>
          <button type="button" aria-label={p("close")} onClick={() => setOpen(null)} className="absolute end-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white">
            <X className="h-5 w-5" />
          </button>
          {visible.length > 1 && (
            <>
              <button type="button" aria-label={p("previous")} onClick={(e) => { e.stopPropagation(); step(-1); }} className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white"><ChevronLeft className="h-5 w-5" /></button>
              <button type="button" aria-label={p("next")} onClick={(e) => { e.stopPropagation(); step(1); }} className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white"><ChevronRight className="h-5 w-5" /></button>
            </>
          )}
          <figure className="flex max-h-full max-w-3xl flex-col items-center" onClick={(e) => e.stopPropagation()}>
            {isVideo(current) ? (
              <video key={current.id} src={current.content_url || ""} controls autoPlay playsInline className="max-h-[78vh] rounded-xl" />
            ) : (
              <img src={mediaUrl(current)} alt={current.title} className="max-h-[78vh] rounded-xl object-contain" />
            )}
            <figcaption className="mt-3 max-w-xl text-center text-white">
              <p className="font-bold">{current.title}</p>
              {current.description && <p className="mt-1 text-sm text-white/70">{current.description}</p>}
            </figcaption>
          </figure>
        </div>
      )}
    </div>
  );
}
