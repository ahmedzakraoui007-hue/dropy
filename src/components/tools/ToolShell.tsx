"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Calculator, FileText, Link2, Percent, QrCode, TrendingUp, Wrench } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

export const TOOLS = [
  { slug: "calcul-tva", icon: Percent },
  { slug: "calcul-prix-de-vente", icon: Calculator },
  { slug: "calcul-marge-ecommerce", icon: TrendingUp },
  { slug: "generateur-facture", icon: FileText },
  { slug: "lien-whatsapp", icon: Link2 },
  { slug: "generateur-qr-code", icon: QrCode },
] as const;

export type ToolSlug = (typeof TOOLS)[number]["slug"];

export function ToolShell({ slug, children }: { slug: ToolSlug; children: ReactNode }) {
  const { t, dir } = useTranslation();
  const tr = (key: string) => t(`tools.${slug}.${key}`);
  const faq = [1, 2, 3].map((n) => ({ q: tr(`faq${n}_q`), a: tr(`faq${n}_a`) })).filter((f) => !f.q.startsWith("tools."));

  return (
    <div className="bg-white" dir={dir}>
      <section className="border-b border-slate-100 bg-slate-50/60 px-6 py-12 lg:py-16">
        <div className="mx-auto max-w-4xl">
          <Link href="/outils" className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-black uppercase tracking-widest text-[#2E3192]">
            <Wrench className="h-3.5 w-3.5" />
            {t("tools.badge")}
          </Link>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 md:text-5xl">{tr("title")}</h1>
          <p className="mt-4 max-w-2xl text-lg font-medium text-slate-500">{tr("subtitle")}</p>
        </div>
      </section>

      <section className="px-6 py-10">
        <div className="mx-auto max-w-4xl">{children}</div>
      </section>

      {faq.length > 0 && (
        <section className="px-6 pb-12">
          <div className="mx-auto max-w-4xl space-y-4">
            <h2 className="text-2xl font-black text-slate-900">{t("tools.faq_title")}</h2>
            {faq.map((item) => (
              <details key={item.q} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5 open:bg-white">
                <summary className="cursor-pointer font-bold text-slate-900">{item.q}</summary>
                <p className="mt-3 text-slate-600">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      <section className="px-6 pb-16">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="rounded-3xl bg-gradient-to-br from-[#2E3192] to-[#00A99D] p-8 text-white">
            <p className="text-2xl font-black">{t("tools.cta_title")}</p>
            <p className="mt-2 text-white/80">{t("tools.cta_text")}</p>
            <Link href="/inscription" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 font-black text-slate-900 hover:bg-slate-100">
              {t("tools.cta_button")}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </div>
          <div>
            <p className="mb-3 font-black text-slate-900">{t("tools.other_tools")}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {TOOLS.filter((tool) => tool.slug !== slug).map((tool) => (
                <Link key={tool.slug} href={`/outils/${tool.slug}`} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-4 font-bold text-slate-700 hover:border-[#2E3192]/30 hover:text-[#2E3192]">
                  <tool.icon className="h-5 w-5 shrink-0 text-[#00A99D]" />
                  {t(`tools.${tool.slug}.title`)}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function ResultRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-4 py-2 ${strong ? "border-t pt-3 text-lg font-black text-slate-900" : "text-slate-600"}`}>
      <span>{label}</span>
      <span className="tabular-nums" dir="ltr">{value}</span>
    </div>
  );
}

export function parseAmount(value: string) {
  const n = Number(value.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}
