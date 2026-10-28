"use client";

import Link from "next/link";
import { ArrowRight, Wrench } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import { TOOLS } from "@/components/tools/ToolShell";

export default function ToolsIndex() {
  const { t, dir } = useTranslation();
  return (
    <div className="bg-white" dir={dir}>
      <section className="border-b border-slate-100 bg-slate-50/60 px-6 py-16 lg:py-24">
        <div className="mx-auto max-w-5xl">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-black uppercase tracking-widest text-[#2E3192]">
            <Wrench className="h-3.5 w-3.5" />
            {t("tools.badge")}
          </p>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 md:text-5xl">{t("tools.index_title")}</h1>
          <p className="mt-4 max-w-2xl text-lg font-medium text-slate-500">{t("tools.index_subtitle")}</p>
        </div>
      </section>
      <section className="px-6 py-12">
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => (
            <Link key={tool.slug} href={`/outils/${tool.slug}`} className="group flex flex-col rounded-3xl border border-slate-100 p-6 shadow-sm transition-shadow hover:shadow-xl">
              <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2E3192] to-[#00A99D] text-white">
                <tool.icon className="h-6 w-6" />
              </span>
              <p className="text-lg font-black text-slate-900 group-hover:text-[#2E3192]">{t(`tools.${tool.slug}.title`)}</p>
              <p className="mt-2 flex-1 text-sm text-slate-500">{t(`tools.${tool.slug}.subtitle`)}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#00A99D]">
                {t("tools.open")}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
