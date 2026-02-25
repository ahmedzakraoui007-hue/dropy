"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { 
  Store, 
  Package, 
  Camera, 
  ArrowRight, 
  Check,
  Zap,
  Rocket,
  Users,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/context/LanguageContext";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function LandingClient() {
  const [mounted, setMounted] = useState(false);
  const { t, locale, dir } = useTranslation();

  useEffect(() => {
    setMounted(true);
  }, []);

  const pillars = [
    {
      icon: Store,
      title: t("landing.pillars.vendeurs.title"),
      description: t("landing.pillars.vendeurs.desc"),
      gradient: "from-[#2E3192] to-[#4F46E5]",
      href: "/vendeurs"
    },
    {
      icon: Package,
      title: t("landing.pillars.fournisseurs.title"),
      description: t("landing.pillars.fournisseurs.desc"),
      gradient: "from-[#00A99D] to-[#0D9488]",
      href: "/fournisseurs"
    },
    {
      icon: Camera,
      title: t("landing.pillars.createurs.title"),
      description: t("landing.pillars.createurs.desc"),
      gradient: "from-violet-600 to-purple-600",
      href: "/createurs"
    }
  ];

  if (!mounted) {
    return (
      <div className="bg-[#FDFDFD] min-h-screen selection:bg-[#00A99D]/20" />
    );
  }

  return (
    <div className="bg-[#FDFDFD] min-h-screen selection:bg-[#00A99D]/20" dir={dir}>
      {/* Hero Section */}
      <section className="relative pt-20 pb-24 px-6 overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#00A99D]/5 rounded-full blur-[120px] -z-10" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-[#2E3192]/5 rounded-full blur-[100px] -z-10" />
        
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial="initial"
              animate="animate"
              variants={stagger}
            >
              <motion.div
                variants={fadeInUp}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 border border-slate-200 text-[#2E3192] text-xs font-black mb-8 tracking-widest uppercase"
              >
                <Zap className="w-3 h-3 fill-current" />
                {t("hero.badge")}
              </motion.div>

              <motion.h1 
                variants={fadeInUp}
                className="text-5xl md:text-7xl font-black tracking-tight mb-8 text-slate-900 leading-[1.05]"
              >
                {t("hero.title1")} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2E3192] to-[#00A99D]">{t("hero.title2")}</span>
              </motion.h1>
              
              <motion.p 
                variants={fadeInUp}
                className="text-xl text-slate-600 mb-10 max-w-xl leading-relaxed font-medium"
              >
                {t("hero.description")}
              </motion.p>
              
                <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-5">
                  <Link href="/inscription">
                    <Button size="lg" className="h-16 px-10 text-lg font-black bg-slate-900 hover:bg-slate-800 text-white rounded-2xl shadow-2xl transition-all hover:-translate-y-1">
                      {t("hero.cta_primary")}
                      <ArrowRight className={`ml-3 w-6 h-6 ${locale === 'ar' ? 'rotate-180' : ''}`} />
                    </Button>
                  </Link>
                <Link href="/vendeurs">
                  <Button size="lg" variant="outline" className="h-16 px-10 text-lg font-bold border-2 border-slate-200 hover:bg-slate-50 text-slate-700 rounded-2xl transition-all">
                    {t("hero.cta_secondary")}
                  </Button>
                </Link>
              </motion.div>

              <motion.div 
                variants={fadeInUp}
                className="mt-12 flex items-center gap-6"
              >
                <div className="flex -space-x-4">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-slate-200 overflow-hidden shadow-sm">
                      <img src={`https://i.pravatar.cc/150?u=${i}`} alt="user" />
                    </div>
                  ))}
                  <div className="w-12 h-12 rounded-full border-4 border-white bg-[#00A99D] flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    +500
                  </div>
                </div>
                <p className="text-sm font-bold text-slate-500">
                  {t("hero.waitlist")}
                </p>
              </motion.div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative z-10 rounded-[2.5rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border-8 border-white">
                <img 
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=1200&fit=crop"
                  alt="Dropy Dashboard"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -top-10 -right-10 bg-white p-6 rounded-3xl shadow-2xl z-20 animate-bounce-slow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400">{locale === 'ar' ? 'مبيعة جديدة' : 'Nouvelle Vente'}</p>
                    <p className="text-lg font-black text-slate-900">+145.00 TND</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Logos */}
      <section className="py-12 border-y border-slate-100 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
             <div className="text-xl font-black text-slate-800 tracking-tighter">ARAMEX</div>
             <div className="text-xl font-black text-slate-800 tracking-tighter">KONNECT</div>
             <div className="text-xl font-black text-slate-800 tracking-tighter">FLOUCI</div>
             <div className="text-xl font-black text-slate-800 tracking-tighter">{t("landing.trust.made_in_tunisia")}</div>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">{t("landing.pillars.title")}</h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium">
              {t("landing.pillars.subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {pillars.map((pillar, index) => (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <div className="h-full bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm hover:shadow-2xl hover:border-transparent transition-all duration-500 relative overflow-hidden">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${pillar.gradient} flex items-center justify-center mb-8 shadow-xl group-hover:scale-110 transition-transform duration-500`}>
                    <pillar.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-4">{pillar.title}</h3>
                  <p className="text-slate-500 mb-8 leading-relaxed font-medium">
                    {pillar.description}
                  </p>
                  <Link href={pillar.href} className="inline-flex items-center gap-2 text-sm font-black text-[#2E3192] group-hover:gap-4 transition-all uppercase tracking-widest">
                    {t("landing.pillars.cta")} <ArrowRight className={`w-4 h-4 ${locale === 'ar' ? 'rotate-180' : ''}`} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-32 px-6 bg-slate-900 text-white rounded-[4rem] mx-4 sm:mx-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-black mb-6">{t("landing.how_it_works.title")}</h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto font-medium">
              {t("landing.how_it_works.subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-16">
            {[
              { number: "01", title: t("landing.how_it_works.step1.title"), description: t("landing.how_it_works.step1.desc"), icon: Users },
              { number: "02", title: t("landing.how_it_works.step2.title"), description: t("landing.how_it_works.step2.desc"), icon: Shield },
              { number: "03", title: t("landing.how_it_works.step3.title"), description: t("landing.how_it_works.step3.desc"), icon: Rocket }
            ].map((step, index) => (
              <div key={step.number} className="text-center">
                <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-[#2E3192] to-[#00A99D] flex items-center justify-center mx-auto mb-8 shadow-2xl">
                  <step.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-black mb-4">{step.title}</h3>
                <p className="text-slate-400 font-medium">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-[#2E3192] via-[#2E3192] to-[#00A99D] rounded-[4rem] p-16 text-center text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-black mb-8">{t("landing.final_cta.title")}</h2>
              <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto font-medium">
                {t("landing.final_cta.subtitle")}
              </p>
                <Link href="/inscription">
                  <Button size="lg" className="h-20 px-12 text-xl font-black bg-white text-[#2E3192] hover:bg-slate-50 rounded-3xl shadow-2xl transition-all hover:scale-105">
                    {t("landing.final_cta.cta")}
                    <ArrowRight className={`ml-4 w-8 h-8 ${locale === 'ar' ? 'rotate-180' : ''}`} />
                  </Button>
                </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
