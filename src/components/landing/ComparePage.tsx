"use client";

import Link from "next/link";
import { ArrowRight, Check, ExternalLink } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

export type Competitor = "converty" | "shopify";

const NAMES: Record<Competitor, string> = { converty: "Converty", shopify: "Shopify" };

const SOURCES: Record<Competitor, { label: string; href: string }[]> = {
  converty: [{ label: "converty.shop/en/about", href: "https://converty.shop/en/about" }],
  shopify: [
    { label: "shopify.com/pricing", href: "https://www.shopify.com/pricing" },
    { label: "help.shopify.com : pays de Shopify Payments", href: "https://help.shopify.com/en/manual/payments/shopify-payments/supported-countries" },
  ],
};

export const COMPARE_ROWS = 10;

export default function ComparePage({ competitor }: { competitor: Competitor }) {
  const { t, dir } = useTranslation();
  const name = NAMES[competitor];
  const other: Competitor = competitor === "converty" ? "shopify" : "converty";
  const tr = (key: string) => t(`pages.compare.${competitor}.${key}`);
  const common = (key: string) => t(`pages.compare.common.${key}`).replace("{name}", name);
  const has = (key: string) => {
    const value = tr(key);
    return value && value !== `pages.compare.${competitor}.${key}`;
  };

  return (
    <div className="bg-white" dir={dir}>
      <section className="relative overflow-hidden border-b border-slate-100 bg-slate-50/60 px-6 py-14 lg:py-20">
        <div className="absolute -top-20 end-0 h-[420px] w-[420px] rounded-full bg-[#00A99D]/10 blur-[120px]" />
        <div className="relative mx-auto max-w-5xl">
          <p className="mb-5 inline-flex rounded-full bg-[#2E3192] px-4 py-1.5 text-xs font-black uppercase tracking-widest text-white">{common("badge")}</p>
          <h1 className="max-w-3xl text-3xl font-black leading-[1.1] tracking-tight text-slate-900 md:text-5xl">{tr("title")}</h1>
          <p className="mt-5 max-w-2xl text-lg font-medium text-slate-600">{tr("subtitle")}</p>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="overflow-hidden rounded-3xl border border-slate-200">
            <table className="w-full table-fixed border-collapse text-start text-sm">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="w-[28%] p-3 text-start text-xs font-black uppercase tracking-wider sm:p-4">{common("feature")}</th>
                  <th className="p-3 text-start text-base font-black sm:p-4">
                    <span className="bg-gradient-to-r from-[#8B8EF5] to-[#2DD4BF] bg-clip-text text-transparent">Dropy</span>
                  </th>
                  <th className="p-3 text-start text-base font-black sm:p-4">{name}</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: COMPARE_ROWS }, (_, i) => i + 1).map((n) => (
                  <tr key={n} className="border-t border-slate-100 align-top odd:bg-white even:bg-slate-50/60">
                    <th scope="row" className="p-3 text-start text-xs font-black uppercase tracking-wide text-slate-500 sm:p-4">{tr(`row${n}_label`)}</th>
                    <td className="p-3 font-semibold text-slate-900 sm:p-4">{tr(`row${n}_us`)}</td>
                    <td className="p-3 text-slate-600 sm:p-4">{has(`row${n}_them`) ? tr(`row${n}_them`) : <span className="italic text-slate-400">{common("not_stated")}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-slate-500">{common("verified")}</p>
        </div>
      </section>

      <section className="px-4 pb-12 sm:px-6">
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2">
          {[
            { title: common("our_strengths"), prefix: "us", tone: "border-[#00A99D]/30 bg-[#00A99D]/5", icon: "text-[#00A99D]" },
            { title: common("their_strengths"), prefix: "them", tone: "border-slate-200 bg-white", icon: "text-slate-400" },
          ].map((block) => (
            <div key={block.prefix} className={`rounded-3xl border p-6 ${block.tone}`}>
              <h2 className="text-lg font-black text-slate-900">{block.title}</h2>
              <ul className="mt-4 space-y-3">
                {[1, 2, 3].map((n) => (
                  <li key={n} className="flex gap-3 text-sm font-medium text-slate-700">
                    <Check className={`mt-0.5 h-4 w-4 shrink-0 ${block.icon}`} />
                    <span>{tr(`${block.prefix}${n}`)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 pb-12 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-black text-slate-900">{common("faq_title")}</h2>
          <div className="mt-6 divide-y divide-slate-100 rounded-3xl border border-slate-200">
            {[1, 2, 3].map((n) => (
              <details key={n} className="group p-5" open={n === 1}>
                <summary className="cursor-pointer list-none text-base font-black text-slate-900">{tr(`faq${n}_q`)}</summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{tr(`faq${n}_a`)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6">
        <div className="mx-auto max-w-5xl rounded-[2rem] bg-[#070A1F] p-8 text-white md:p-12">
          <h2 className="max-w-2xl text-2xl font-black md:text-3xl">{common("cta_title")}</h2>
          <p className="mt-3 max-w-2xl text-slate-300">{common("cta_text")}</p>
          <Link
            href="/creation-site-ecommerce-tunisie#demande"
            className="mt-6 inline-flex h-12 items-center gap-2 rounded-2xl bg-white px-6 font-black text-slate-900 transition-transform hover:-translate-y-0.5"
          >
            {common("cta_button")}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </div>
        <div className="mx-auto mt-8 flex max-w-5xl flex-col gap-4 text-sm sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-black text-slate-900">{common("sources")}</p>
            <ul className="mt-2 space-y-1">
              {SOURCES[competitor].map((s) => (
                <li key={s.href}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 text-slate-600 underline-offset-2 hover:underline">
                    {s.label}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <Link href={`/comparatif/dropy-vs-${other}`} className="font-black text-[#2E3192] hover:underline">
            {t("pages.compare.common.other").replace("{name}", NAMES[other])}
          </Link>
        </div>
      </section>
    </div>
  );
}
