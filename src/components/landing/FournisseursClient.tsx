"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Factory, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  Globe, 
  BarChart3, 
  Users, 
  Building2 
} from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import { useState, useEffect } from "react";

export default function FournisseursClient() {
  const [mounted, setMounted] = useState(false);
  const { t, locale, dir } = useTranslation();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="bg-white min-h-screen pt-20" />;
  }

  return (
    <div className="bg-white min-h-screen pt-20" dir={dir}>
      {/* Hero */}
      <section className="relative px-6 py-24 lg:py-40 overflow-hidden bg-slate-900 text-white rounded-b-[4rem]">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#00A99D]/10 rounded-full blur-[120px] -z-10" />
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-[#00A99D] text-xs font-black mb-8 tracking-widest uppercase">
                <Building2 className="w-3 h-3 fill-current" />
                {t("pages.fournisseurs.hero.badge")}
              </div>
              <h1 className="text-5xl lg:text-7xl font-black mb-8 leading-[1.1]">
                {t("pages.fournisseurs.hero.title_main")} <br />
                <span className="text-[#00A99D]">{t("pages.fournisseurs.hero.title_accent")}</span>
              </h1>
              <p className="text-xl text-slate-400 mb-10 max-w-xl font-medium leading-relaxed">
                {t("pages.fournisseurs.hero.desc")}
              </p>
              <div className="flex flex-col sm:flex-row gap-5">
                <Link href="/inscription">
                  <Button size="lg" className="h-16 px-10 rounded-2xl font-black text-lg bg-[#00A99D] hover:bg-teal-600 text-white shadow-2xl shadow-[#00A99D]/20 transition-all hover:-translate-y-1">
                    {t("pages.fournisseurs.hero.cta_primary")}
                    <ArrowRight className={`ml-2 w-5 h-5 ${locale === 'ar' ? 'rotate-180' : ''}`} />
                  </Button>
                </Link>
                  <Link href="/contact">
                    <Button variant="outline" className="h-16 px-10 rounded-2xl font-bold text-lg border-white/20 bg-transparent hover:bg-white/10 text-white">
                      {t("pages.fournisseurs.hero.cta_secondary")}
                    </Button>
                  </Link>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-6 pt-12">
                  <div className="bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-sm">
                    <TrendingUp className="w-10 h-10 text-[#00A99D] mb-4" />
                    <p className="text-2xl font-black text-white">+300%</p>
                    <p className="text-xs font-bold text-slate-500 uppercase">{t("pages.fournisseurs.hero.stats.sales")}</p>
                  </div>
                  <div className="bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-sm">
                    <Users className="w-10 h-10 text-indigo-400 mb-4" />
                    <p className="text-2xl font-black text-white">500+</p>
                    <p className="text-xs font-bold text-slate-500 uppercase">{t("pages.fournisseurs.hero.stats.sellers")}</p>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-sm">
                    <BarChart3 className="w-10 h-10 text-amber-400 mb-4" />
                    <p className="text-2xl font-black text-white">24h</p>
                    <p className="text-xs font-bold text-slate-500 uppercase">{t("pages.fournisseurs.hero.stats.speed")}</p>
                  </div>
                  <div className="bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-sm">
                    <Globe className="w-10 h-10 text-blue-400 mb-4" />
                    <p className="text-2xl font-black text-white">Tunisie</p>
                    <p className="text-xs font-bold text-slate-500 uppercase">{t("pages.fournisseurs.hero.stats.coverage")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-3 gap-12">
              {[
                {
                  icon: Factory,
                  title: t("pages.fournisseurs.benefits.list.0.title"),
                  desc: t("pages.fournisseurs.benefits.list.0.desc"),
                },
                {
                  icon: ShieldCheck,
                  title: t("pages.fournisseurs.benefits.list.1.title"),
                  desc: t("pages.fournisseurs.benefits.list.1.desc"),
                },
                {
                  icon: Zap,
                  title: t("pages.fournisseurs.benefits.list.2.title"),
                  desc: t("pages.fournisseurs.benefits.list.2.desc"),
                }
              ].map((benefit, i) => (
                <div key={i} className="group p-10 rounded-[2.5rem] bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-2xl hover:border-transparent transition-all duration-500">
                  <div className="w-20 h-20 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                    <benefit.icon className="w-10 h-10 text-slate-900" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-4">{benefit.title}</h3>
                  <p className="text-slate-500 font-medium leading-relaxed text-lg">{benefit.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Locations */}
        <section className="py-32 px-6 bg-slate-50 border-y border-slate-100">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-black text-slate-900 mb-8 leading-tight">{t("pages.fournisseurs.network.title")}</h2>
            <p className="text-xl text-slate-500 font-medium mb-12">
              {t("pages.fournisseurs.network.desc")}
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              {(t("pages.fournisseurs.network.badges") as unknown as string[]).map((badge) => (
                <div key={badge} className="flex items-center gap-2 px-6 py-3 bg-white rounded-2xl border border-slate-200 text-slate-900 font-bold shadow-sm">
                  <CheckCircle2 className="w-5 h-5 text-[#00A99D]" />
                  {badge}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-32 px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="inline-block p-4 rounded-3xl bg-indigo-50 text-[#2E3192] font-black uppercase tracking-widest text-sm mb-8">
              {t("pages.fournisseurs.final.badge")}
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-8 leading-tight">{t("pages.fournisseurs.final.title")}</h2>
            <Link href="/inscription">
              <Button size="lg" className="h-20 px-12 text-xl font-black bg-slate-900 hover:bg-slate-800 text-white rounded-3xl shadow-2xl transition-all hover:scale-105">
                {t("pages.fournisseurs.final.cta")}
                <ArrowRight className={`ml-3 w-6 h-6 ${locale === 'ar' ? 'rotate-180' : ''}`} />
              </Button>
            </Link>

        </div>
      </section>
    </div>
  );
}
