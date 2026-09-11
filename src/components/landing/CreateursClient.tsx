"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Camera, 
  Video, 
  Sparkles, 
  DollarSign, 
  ArrowRight, 
  CheckCircle2, 
  Instagram, 
  Youtube, 
  Smartphone 
} from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import { useState, useEffect } from "react";

export default function CreateursClient() {
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
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-violet-600/5 rounded-full blur-[120px] -z-10" />
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-50 border border-violet-100 text-violet-600 text-xs font-black mb-8 tracking-widest uppercase">
                <Sparkles className="w-3 h-3 fill-current" />
                {t("pages.createurs.hero.badge")}
              </div>
              <h1 className="text-5xl lg:text-7xl font-black text-slate-900 mb-8 leading-[1.1]">
                {t("pages.createurs.hero.title_main")} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600">
                  {t("pages.createurs.hero.title_accent")}
                </span>
              </h1>
              <p className="text-xl text-slate-600 mb-10 max-w-xl font-medium leading-relaxed">
                {t("pages.createurs.hero.desc")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/inscription">
                  <Button size="lg" className="h-16 px-10 rounded-2xl font-black text-lg bg-violet-600 hover:bg-violet-700 text-white shadow-xl shadow-violet-500/20 transition-all hover:-translate-y-1">
                    {t("pages.createurs.hero.cta_primary")}
                    <ArrowRight className={`ml-2 w-5 h-5 ${locale === 'ar' ? 'rotate-180' : ''}`} />
                  </Button>
                </Link>
                <Link href="#comment-ca-marche">
                  <Button variant="outline" className="h-16 px-10 rounded-2xl font-bold text-lg border-2 border-slate-200">
                    {t("pages.createurs.hero.cta_secondary")}
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-6 pt-12">
                     <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100">
                        <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mb-4">
                           <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">{t("pages.createurs.hero.stats.revenue")}</p>
                        <p className="text-2xl font-black text-slate-900">+800 TND</p>
                     </div>
                     <div className="rounded-[2.5rem] overflow-hidden shadow-2xl">
                        <img src="https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=500&fit=crop" alt="Content" />
                     </div>
                  </div>
                  <div className="space-y-6">
                     <div className="rounded-[2.5rem] overflow-hidden shadow-2xl">
                        <img src="https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?w=400&h=500&fit=crop" alt="Influencer" />
                     </div>
                     <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100">
                        <div className="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center mb-4">
                           <Smartphone className="w-6 h-6 text-violet-600" />
                        </div>
                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">{t("pages.createurs.hero.stats.products")}</p>
                        <p className="text-2xl font-black text-slate-900">12 / mois</p>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </section>

        {/* Steps */}
        <section id="comment-ca-marche" className="py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">{t("pages.createurs.steps.title")}</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-12">
              {[
                {
                  icon: Camera,
                  title: t("pages.createurs.steps.list.0.title"),
                  desc: t("pages.createurs.steps.list.0.desc"),
                },
                {
                  icon: Video,
                  title: t("pages.createurs.steps.list.1.title"),
                  desc: t("pages.createurs.steps.list.1.desc"),
                },
                {
                  icon: DollarSign,
                  title: t("pages.createurs.steps.list.2.title"),
                  desc: t("pages.createurs.steps.list.2.desc"),
                }
              ].map((step, i) => (
                <div key={i} className="relative p-10 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm text-center group hover:shadow-2xl transition-all duration-500">
                  <div className="w-20 h-20 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-8 group-hover:bg-violet-600 group-hover:text-white transition-all duration-500">
                    <step.icon className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-4">{step.title}</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">{step.desc}</p>
                  {i < 2 && (
                     <div className={`hidden lg:block absolute top-1/2 -right-6 transform -translate-y-1/2 z-10 ${locale === 'ar' ? 'rotate-180' : ''}`}>
                        <ArrowRight className="w-12 h-12 text-slate-200" />
                     </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Socials */}
        <section className="py-32 px-6 bg-slate-900 text-white rounded-[4rem] mx-4">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-black mb-12">{t("pages.createurs.final.title")}</h2>
            <p className="text-xl text-slate-400 mb-16 font-medium">
              {t("pages.createurs.final.desc")}
            </p>
            <div className="flex justify-center gap-12">
              <Instagram className="w-12 h-12 text-slate-500 hover:text-pink-500 cursor-pointer transition-colors" />
              <Youtube className="w-12 h-12 text-slate-500 hover:text-red-500 cursor-pointer transition-colors" />
              <Smartphone className="w-12 h-12 text-slate-500 hover:text-teal-500 cursor-pointer transition-colors" />
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-32 px-6 text-center">
          <Link href="/inscription">
            <Button size="lg" className="h-24 px-16 text-2xl font-black bg-gradient-to-r from-violet-600 to-purple-600 hover:opacity-90 text-white rounded-[2.5rem] shadow-2xl transition-all hover:scale-105">
              {t("pages.createurs.final.cta")}
              <ArrowRight className={`ml-4 w-8 h-8 ${locale === 'ar' ? 'rotate-180' : ''}`} />
            </Button>
          </Link>

      </section>
    </div>
  );
}
