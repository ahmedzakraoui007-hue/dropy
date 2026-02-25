"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  ShoppingBag, 
  Package, 
  ArrowRight, 
  CheckCircle2, 
  PlayCircle, 
  BarChart3, 
  Truck, 
  Star,
  HeartHandshake 
} from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import { useState, useEffect } from "react";

export default function VendeursClient() {
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
      <section className="relative px-6 py-24 lg:py-40 overflow-hidden bg-slate-50/50">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#00A99D]/5 rounded-full blur-[120px] -z-10" />
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-[#2E3192] text-xs font-black mb-8 tracking-widest uppercase">
                <Star className="w-3 h-3 fill-current" />
                {t("pages.vendeurs.hero.badge")}
              </div>
              <h1 className="text-5xl lg:text-7xl font-black text-slate-900 mb-8 leading-[1.1]">
                {t("pages.vendeurs.hero.title_main")} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2E3192] to-[#00A99D]">
                  {t("pages.vendeurs.hero.title_accent")}
                </span>
              </h1>
              <p className="text-xl text-slate-600 mb-10 max-w-xl font-medium leading-relaxed">
                {t("pages.vendeurs.hero.desc")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/inscription">
                  <Button className="bg-[#2E3192] hover:bg-indigo-800 text-white h-16 px-10 rounded-2xl font-black text-lg shadow-xl shadow-indigo-500/20 transition-all hover:-translate-y-1">
                    {t("pages.vendeurs.hero.cta_primary")}
                    <ArrowRight className={`ml-2 w-5 h-5 ${locale === 'ar' ? 'rotate-180' : ''}`} />
                  </Button>
                </Link>
                <Link href="/aide">
                  <Button variant="outline" className="h-16 px-10 rounded-2xl font-bold text-lg border-2 border-slate-200">
                    <PlayCircle className="mr-2 w-5 h-5" />
                    {t("pages.vendeurs.hero.cta_secondary")}
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white bg-white">
                <img 
                  src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=800&fit=crop" 
                  alt="Seller Success"
                  className="w-full"
                />
              </div>
              {/* Stats card overlay */}
              <div className="absolute -bottom-10 -left-10 bg-white p-8 rounded-3xl shadow-2xl border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center">
                    <BarChart3 className="w-8 h-8 text-[#2E3192]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{t("pages.vendeurs.hero.income_label")}</p>
                    <p className="text-2xl font-black text-slate-900">{t("pages.vendeurs.hero.income_value")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">{t("pages.vendeurs.benefits.title")}</h2>
              <p className="text-xl text-slate-500 font-medium">{t("pages.vendeurs.benefits.subtitle")}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
              {[
                {
                  icon: ShoppingBag,
                  title: t("pages.vendeurs.benefits.risk.title"),
                  desc: t("pages.vendeurs.benefits.risk.desc"),
                },
                {
                  icon: Package,
                  title: t("pages.vendeurs.benefits.quality.title"),
                  desc: t("pages.vendeurs.benefits.quality.desc"),
                },
                {
                  icon: Truck,
                  title: t("pages.vendeurs.benefits.logistic.title"),
                  desc: t("pages.vendeurs.benefits.logistic.desc"),
                },
                {
                  icon: HeartHandshake,
                  title: t("pages.vendeurs.benefits.support.title"),
                  desc: t("pages.vendeurs.benefits.support.desc"),
                }
              ].map((benefit, i) => (
                <div key={i} className="group p-8 rounded-[2rem] bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-2xl hover:border-transparent transition-all duration-500">
                  <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <benefit.icon className="w-8 h-8 text-slate-900" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-4">{benefit.title}</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">{benefit.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Focus */}
        <section className="py-32 px-6 bg-slate-900 text-white rounded-[4rem] mx-4">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl md:text-5xl font-black leading-tight">{t("pages.vendeurs.features.title")}</h2>
              <div className="space-y-6">
                {(t("pages.vendeurs.features.list") as unknown as string[]).map((text, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <CheckCircle2 className="w-6 h-6 text-[#00A99D]" />
                    <span className="text-lg font-bold text-slate-300">{text}</span>
                  </div>
                ))}
              </div>
              <Link href="/inscription" className="inline-block pt-4">
                <Button size="lg" className="h-16 px-10 rounded-2xl font-black text-lg bg-[#00A99D] hover:bg-teal-600 text-white">
                  {t("pages.vendeurs.features.cta")}
                </Button>
              </Link>
            </div>
            <div className="bg-white/5 p-8 rounded-[3rem] backdrop-blur-sm border border-white/10">
               <div className="aspect-video bg-slate-800 rounded-2xl flex items-center justify-center">
                  <PlayCircle className="w-20 h-20 text-white/20" />
               </div>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-32 px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-8">{t("pages.vendeurs.final.title")}</h2>
            <p className="text-xl text-slate-500 font-medium mb-12">{t("pages.vendeurs.final.subtitle")}</p>
            <Link href="/inscription">
              <Button size="lg" className="h-20 px-12 text-xl font-black bg-gradient-to-r from-[#2E3192] to-[#00A99D] hover:opacity-90 text-white rounded-3xl shadow-2xl transition-all hover:scale-105">
                {t("pages.vendeurs.final.cta")}
                <ArrowRight className={`ml-3 w-6 h-6 ${locale === 'ar' ? 'rotate-180' : ''}`} />
              </Button>
            </Link>

        </div>
      </section>
    </div>
  );
}
