"use client";

import Link from "next/link";
import { useState } from "react";
import { BookOpen, Clock } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import { BLOG_CATEGORIES } from "@/lib/blog";
import { cn } from "@/lib/utils";

type Card = {
  slug: string;
  locale: "fr" | "ar";
  title: string;
  excerpt: string | null;
  cover_url: string | null;
  category: string | null;
  published_at: string | null;
  minutes: number;
};

export default function BlogIndex({ posts }: { posts: Card[] }) {
  const { t, dir, locale } = useTranslation();
  const tr = (key: string) => t(`pages.blog.${key}`);
  const [category, setCategory] = useState<string | null>(null);
  const shown = category ? posts.filter((p) => p.category === category) : posts;
  const used = BLOG_CATEGORIES.filter((c) => posts.some((p) => p.category === c));
  const date = (value: string | null) =>
    value ? new Intl.DateTimeFormat(locale === "ar" ? "ar-TN" : "fr-TN", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value)) : "";

  return (
    <div className="bg-white" dir={dir}>
      <section className="border-b border-slate-100 bg-slate-50/60 px-6 py-16 lg:py-24">
        <div className="mx-auto max-w-5xl">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-black uppercase tracking-widest text-[#2E3192]">
            <BookOpen className="h-3.5 w-3.5" />
            {tr("badge")}
          </p>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 md:text-5xl">{tr("title")}</h1>
          <p className="mt-4 max-w-2xl text-lg font-medium text-slate-500">{tr("subtitle")}</p>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto max-w-5xl">
          {used.length > 1 && (
            <div className="mb-8 flex flex-wrap gap-2">
              {[null, ...used].map((c) => (
                <button
                  key={c ?? "all"}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-sm font-bold transition-colors",
                    category === c ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-600 hover:border-slate-400"
                  )}
                >
                  {c ? tr(`categories.${c}`) : tr("all")}
                </button>
              ))}
            </div>
          )}

          {shown.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center">
              <p className="font-bold text-slate-700">{tr("empty_title")}</p>
              <p className="mt-2 text-sm text-slate-500">{tr("empty_text")}</p>
              <Link href="/aide" className="mt-6 inline-block font-bold text-[#00A99D] hover:underline">{tr("empty_cta")}</Link>
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="group flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-xl" dir={post.locale === "ar" ? "rtl" : "ltr"}>
                  <div className="aspect-[16/9] bg-gradient-to-br from-[#2E3192]/10 to-[#00A99D]/10">
                    {post.cover_url && <img src={post.cover_url} alt="" loading="lazy" className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    {post.category && <span className="mb-2 text-xs font-black uppercase tracking-widest text-[#00A99D]">{tr(`categories.${post.category}`)}</span>}
                    <h2 className="text-lg font-black leading-snug text-slate-900 group-hover:text-[#2E3192]">{post.title}</h2>
                    {post.excerpt && <p className="mt-2 line-clamp-3 text-sm text-slate-500">{post.excerpt}</p>}
                    <p className="mt-auto flex items-center gap-3 pt-4 text-xs font-medium text-slate-400">
                      <span>{date(post.published_at)}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{tr("minutes").replace("{n}", String(post.minutes))}</span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
