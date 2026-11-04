"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, Camera, MapPin } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import { isVideoUrl } from "@/lib/portfolio";
import type { DirectoryCreator } from "@/lib/creator-portfolio";

function Cover({ creator }: { creator: DirectoryCreator }) {
  const cover = creator.cover;
  if (cover?.thumbnail_url) return <img src={cover.thumbnail_url} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />;
  if (cover?.content_url && (cover.type === "video" || isVideoUrl(cover.content_url))) return <video src={`${cover.content_url}#t=0.1`} muted playsInline preload="metadata" className="h-full w-full object-cover" />;
  return <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#2E3192] to-[#00A99D] text-6xl font-black text-white">{creator.name.charAt(0).toUpperCase()}</span>;
}

export function PortfolioDirectory({ creators }: { creators: DirectoryCreator[] }) {
  const { t, dir } = useTranslation();
  const p = (key: string) => t(`portfolio_public.directory.${key}`);

  return (
    <div className="min-h-screen bg-[#FBFBFD]" dir={dir}>
      <section className="relative overflow-hidden bg-[#070A1F] px-6 pb-16 pt-36 text-center text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(79,70,229,0.4),transparent_55%),radial-gradient(ellipse_at_85%_100%,rgba(0,169,157,0.35),transparent_55%)]" />
        <div className="relative mx-auto max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-teal-200">{p("eyebrow")}</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">{p("title")}</h1>
          <p className="mt-5 text-lg text-slate-300">{p("subtitle")}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        {creators.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {creators.map((creator) => (
              <Link key={creator.slug} href={`/createurs/${creator.slug}`} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition-shadow hover:shadow-xl">
                <span className="block aspect-[4/5] overflow-hidden bg-slate-100"><Cover creator={creator} /></span>
                <span className="block p-4">
                  <span className="flex items-center gap-1.5 font-black text-slate-900">
                    <span className="truncate">{creator.name}</span>
                    {creator.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-[#00A99D]" />}
                  </span>
                  <span className="mt-1 flex flex-col gap-0.5 text-xs font-semibold text-slate-500">
                    {creator.city ? <span className="flex min-w-0 items-center gap-1"><MapPin className="h-3 w-3 shrink-0" /><span className="truncate">{creator.city}</span></span> : null}
                    <span className="shrink-0">{p("works").replace("{count}", String(creator.count))}</span>
                  </span>
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2E3192]/10 text-[#2E3192]"><Camera className="h-6 w-6" /></span>
            <p className="mt-4 text-xl font-black text-slate-900">{p("empty_title")}</p>
            <p className="mx-auto mt-2 max-w-md text-slate-600">{p("empty_desc")}</p>
          </div>
        )}
      </section>

      <section className="px-4 pb-20 md:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 rounded-3xl bg-gradient-to-r from-[#2E3192] to-[#00A99D] p-8 text-center text-white md:flex-row md:text-start">
          <div>
            <p className="text-2xl font-black">{t("portfolio_public.cta_title")}</p>
            <p className="mt-1 text-white/80">{t("portfolio_public.cta_desc")}</p>
          </div>
          <Link href="/inscription" className="inline-flex h-12 shrink-0 items-center gap-2 rounded-xl bg-white px-6 text-sm font-black text-slate-900">
            {t("portfolio_public.cta_button")}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </div>
      </section>
    </div>
  );
}
