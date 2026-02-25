"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Zap, ShieldCheck, Lock, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/context/LanguageContext";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
};

export default function TarifsPage() {
  const { t, locale } = useTranslation();
  const isAr = locale === "ar";

  const plansStyles = [
    {
      highlight: false,
      color: "bg-slate-50",
      borderColor: "border-slate-100",
      buttonColor: "bg-slate-900 text-white"
    },
    {
      highlight: true,
      color: "bg-white",
      borderColor: "border-indigo-200",
      buttonColor: "bg-gradient-to-r from-[#2E3192] to-[#4F46E5] text-white shadow-xl shadow-indigo-200"
    },
    {
      highlight: false,
      color: "bg-slate-900",
      textColor: "text-white",
      descriptionColor: "text-slate-400",
      borderColor: "border-slate-800",
      buttonColor: "bg-white text-slate-900"
    },
  ];

  const plans = t("pages.tarifs.plans").map((plan: any, idx: number) => ({
    ...plan,
    ...plansStyles[idx]
  }));

  return (
    <div className={`min-h-screen bg-white font-sans selection:bg-[#00A99D]/20 ${isAr ? "text-right" : "text-left"}`} dir={isAr ? "rtl" : "ltr"}>
      {/* Header */}
      <section className="relative pt-24 md:pt-32 lg:pt-40 pb-16 lg:pb-24 px-6 overflow-hidden bg-slate-50/50">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_at_top,rgba(46,49,146,0.05),transparent_50%)]" />

        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Badge className="bg-indigo-50 text-[#2E3192] border-indigo-100 mb-8 px-5 py-2 rounded-full uppercase tracking-widest text-[10px] font-black">
              {t("pages.tarifs.hero.badge")}
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-8xl font-black tracking-tighter text-slate-900 mb-8 leading-[1.1] lg:leading-[0.9]">
              {t("pages.tarifs.hero.title_main")} <br className="hidden md:block" /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2E3192] to-[#00A99D]">{t("pages.tarifs.hero.title_accent")}</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium">
              {t("pages.tarifs.hero.desc")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 md:py-24 px-4 md:px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {plans.map((plan: any) => (
              <motion.div
                key={plan.name}
                variants={fadeInUp}
                initial="initial"
                whileInView="whileInView"
                className={`relative p-8 lg:p-12 rounded-[2.5rem] lg:rounded-[3.5rem] border ${plan.borderColor} ${plan.color} ${plan.textColor || "text-slate-900"} flex flex-col h-full shadow-sm hover:shadow-2xl transition-all duration-500 group`}
              >
                {plan.badge && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                    <Badge className="bg-[#00A99D] text-white border-none px-6 py-2 uppercase tracking-widest text-[10px] font-black rounded-full shadow-lg whitespace-nowrap">
                      {plan.badge}
                    </Badge>
                  </div>
                )}

                <div className="mb-8 lg:mb-12">
                  <h3 className="text-2xl lg:text-3xl font-black mb-2 lg:mb-3 tracking-tight">{plan.name}</h3>
                  <p className={`${plan.descriptionColor || "text-slate-500"} text-base lg:text-lg font-medium mb-8 lg:mb-10`}>{plan.description}</p>
                  <div className={`flex items-baseline gap-2 ${isAr ? "flex-row-reverse justify-end" : ""}`}>
                    <span className="text-5xl lg:text-7xl font-black tracking-tighter">{plan.price}</span>
                    <span className={`${plan.descriptionColor || "text-slate-500"} font-bold uppercase text-[10px] lg:text-xs tracking-widest`}>{plan.period}</span>
                  </div>
                </div>

                <div className="h-px w-full bg-slate-100 mb-8 lg:mb-10 group-hover:bg-[#00A99D]/20 transition-colors" />

                <ul className="space-y-4 lg:space-y-6 mb-8 lg:mb-12 flex-grow">
                  {plan.features.map((feature: string) => (
                    <li key={feature} className={`flex items-start gap-3 lg:gap-4 text-base lg:text-lg ${isAr ? "flex-row-reverse" : ""}`}>
                      <div className="mt-1 flex-shrink-0">
                        <Check className="w-4 h-4 lg:w-5 lg:h-5 text-[#00A99D]" />
                      </div>
                      <span className="font-bold opacity-80">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/inscription">
                  <Button className={`w-full h-16 lg:h-20 rounded-[1.5rem] lg:rounded-[2rem] text-lg lg:text-xl font-black transition-all hover:scale-[1.02] active:scale-[0.98] ${plan.buttonColor} border-none`}>
                    {plan.cta}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & FAQ Preview */}
      <section className="py-16 lg:py-32 bg-slate-900 text-white rounded-[2.5rem] lg:rounded-[4rem] mx-2 md:mx-4 mb-16 lg:mb-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2E3192]/20 to-transparent" />
        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
              <div className={`${isAr ? "order-1 lg:order-2" : ""}`}>
                <h2 className="text-3xl lg:text-6xl font-black mb-6 lg:mb-10 leading-tight text-center lg:text-left">
                  {t("pages.tarifs.trust.title")}
                </h2>
                <div className="space-y-6 lg:space-y-10">
                  <div className={`flex flex-col sm:flex-row items-center sm:items-start gap-4 lg:gap-8 ${isAr ? "sm:flex-row-reverse text-center sm:text-right" : "text-center sm:text-left"}`}>
                    <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl lg:rounded-3xl bg-white/10 flex items-center justify-center text-[#00A99D] flex-shrink-0">
                      <ShieldCheck className="w-8 h-8 lg:w-10 lg:h-10" />
                    </div>
                    <div>
                      <h4 className="text-xl lg:text-2xl font-black mb-1 lg:mb-2">{t("pages.tarifs.trust.security_title")}</h4>
                      <p className="text-slate-400 font-medium text-base lg:text-lg">{t("pages.tarifs.trust.security_desc")}</p>
                    </div>
                  </div>
                  <div className={`flex flex-col sm:flex-row items-center sm:items-start gap-4 lg:gap-8 ${isAr ? "sm:flex-row-reverse text-center sm:text-right" : "text-center sm:text-left"}`}>
                    <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl lg:rounded-3xl bg-white/10 flex items-center justify-center text-indigo-400 flex-shrink-0">
                      <Zap className="w-8 h-8 lg:w-10 lg:h-10" />
                    </div>
                    <div>
                      <h4 className="text-xl lg:text-2xl font-black mb-1 lg:mb-2">{t("pages.tarifs.trust.speed_title")}</h4>
                      <p className="text-slate-400 font-medium text-base lg:text-lg">{t("pages.tarifs.trust.speed_desc")}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className={`bg-white/5 backdrop-blur-md p-8 lg:p-12 rounded-[2.5rem] lg:rounded-[3.5rem] border border-white/10 ${isAr ? "order-2 lg:order-1 text-right" : ""}`}>
                <div className={`flex items-center gap-4 mb-6 lg:mb-8 ${isAr ? "flex-row-reverse" : ""}`}>
                  <Info className="w-6 h-6 lg:w-8 lg:h-8 text-[#00A99D]" />
                  <h3 className="text-xl lg:text-2xl font-black">{t("pages.tarifs.trust.help_title")}</h3>
                </div>
                <p className="text-slate-400 text-base lg:text-lg mb-8 lg:mb-10 font-medium">
                  {t("pages.tarifs.trust.help_desc")}
                </p>
                <Link href="/contact">
                  <Button variant="outline" className="h-16 lg:h-20 px-8 lg:px-10 rounded-[1.5rem] lg:rounded-[2rem] border-white/20 text-white text-lg lg:text-xl font-black hover:bg-white hover:text-slate-900 transition-all w-full uppercase tracking-widest">
                    {t("pages.tarifs.trust.help_cta")}
                  </Button>
                </Link>
                <div className={`mt-6 lg:mt-8 flex items-center justify-center gap-4 text-[10px] lg:text-xs font-black text-slate-500 uppercase tracking-[0.2em] ${isAr ? "flex-row-reverse" : ""}`}>
                  <Lock className="w-4 h-4" />
                  {t("pages.tarifs.trust.secure_transactions")}
                </div>
              </div>
          </div>
        </div>
      </section>
    </div>
  );
}
