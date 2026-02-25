"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Camera, 
  Video, 
  DollarSign, 
  ArrowRight, 
  Check, 
  Sparkles, 
  Lock, 
  Wallet, 
  Star, 
  Users, 
  TrendingUp, 
  Zap,
  Play,
  Heart,
  Palette,
  Image as ImageIcon,
  Rocket
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const benefits = [
  {
    icon: Wallet,
    title: "Paiement Garanti",
    description: "Les fonds sont sécurisés sur Dropy avant chaque mission. Fini les retards de paiement.",
    bg: "bg-violet-50",
    color: "text-violet-600"
  },
  {
    icon: Video,
    title: "Marques Premium",
    description: "Travaillez avec les meilleures marques textiles tunisiennes et accédez à des produits exclusifs.",
    bg: "bg-fuchsia-50",
    color: "text-fuchsia-600"
  },
  {
    icon: Palette,
    title: "Liberté Créative",
    description: "Choisissez les projets qui vous inspirent et gérez votre emploi du temps comme vous le souhaitez.",
    bg: "bg-pink-50",
    color: "text-pink-600"
  }
];

export default function CreatorLanding() {
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-violet-100">
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-violet-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-pink-50/30 rounded-full blur-3xl translate-y-1/4 -translate-x-1/4" />
        </div>
        
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <motion.div 
              initial="initial"
              animate="animate"
              variants={stagger}
            >
              <motion.div variants={fadeInUp}>
                <Badge className="bg-violet-50 text-violet-600 border-violet-100 mb-8 px-4 py-1.5 rounded-full uppercase tracking-wider text-[10px] font-black">
                  UGC Creator Network
                </Badge>
              </motion.div>

              <motion.h1 
                variants={fadeInUp}
                className="text-5xl lg:text-8xl font-black tracking-tighter mb-8 text-slate-900 leading-[0.9] font-heading"
              >
                Créez. <br />
                Vibrez. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600">Gagnez.</span>
              </motion.h1>
              
              <motion.p 
                variants={fadeInUp}
                className="text-xl text-slate-600 mb-10 max-w-xl leading-relaxed font-light"
              >
                Transformez votre passion pour la vidéo en une carrière lucrative. Collaborez avec des marques locales et soyez payé pour votre talent.
              </motion.p>
              
              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-6 mb-12">
                <Link href="/inscription">
                  <Button className="h-16 px-10 text-xl font-bold bg-slate-900 text-white hover:bg-slate-800 rounded-2xl shadow-2xl transition-all hover:scale-105">
                    Devenir Créateur
                    <ArrowRight className="ml-2 w-6 h-6" />
                  </Button>
                </Link>
                <Link href="#how-it-works">
                  <Button variant="ghost" className="h-16 px-8 text-lg font-semibold text-slate-600 hover:bg-slate-50 rounded-2xl">
                    Voir les missions
                  </Button>
                </Link>
              </motion.div>

              <motion.div 
                variants={fadeInUp}
                className="flex items-center gap-10 py-8 border-t border-slate-100"
              >
                <div>
                  <div className="text-3xl font-black text-slate-900 mb-1 font-heading">85%</div>
                  <div className="text-xs uppercase tracking-widest font-bold text-slate-400">Revenu Net</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-slate-900 mb-1 font-heading">24h</div>
                  <div className="text-xs uppercase tracking-widest font-bold text-slate-400">Validation</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-slate-900 mb-1 font-heading">Secure</div>
                  <div className="text-xs uppercase tracking-widest font-bold text-slate-400">Système Escrow</div>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <div className="relative group">
                <div className="absolute inset-0 bg-violet-600 rounded-[3rem] rotate-6 blur-2xl opacity-10 group-hover:opacity-20 transition-opacity" />
                <div className="relative aspect-[4/5] bg-slate-100 rounded-[3rem] overflow-hidden border-8 border-white shadow-3xl">
                  <img 
                    src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=1000&fit=crop"
                    alt="Creator Lifestyle"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-violet-900/40 via-transparent to-transparent" />
                  
                  {/* Overlay UI */}
                  <div className="absolute bottom-8 left-8 right-8 glass p-6 rounded-2xl border border-white/20">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                        <Camera className="w-6 h-6 text-violet-600" />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Dernière Mission</p>
                        <p className="font-bold text-slate-900">Vidéo Unboxing - Pack Pro</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Interactions */}
              <motion.div 
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-6 -right-6 w-24 h-24 bg-pink-500 rounded-full flex items-center justify-center shadow-xl border-4 border-white"
              >
                <Heart className="w-10 h-10 text-white fill-white" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl lg:text-6xl font-bold text-slate-900 mb-8 font-heading">
              Votre talent mérite le meilleur.
            </h2>
            <p className="text-xl text-slate-500 font-light leading-relaxed">
              Nous avons construit la plateforme dont les créateurs tunisiens ont besoin pour passer au niveau supérieur.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, idx) => (
              <motion.div
                key={idx}
                variants={fadeInUp}
                initial="initial"
                whileInView="whileInView"
                className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all group"
              >
                <div className={`w-16 h-16 rounded-2xl ${benefit.bg} ${benefit.color} flex items-center justify-center mb-8 group-hover:rotate-12 transition-transform`}>
                  <benefit.icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4 font-heading">{benefit.title}</h3>
                <p className="text-slate-500 leading-relaxed text-lg">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works UI Preview */}
      <section className="py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="relative">
              <div className="absolute inset-0 bg-violet-600 rounded-[3rem] rotate-3 blur-3xl opacity-10" />
              <div className="relative bg-white rounded-[2.5rem] p-8 shadow-2xl border border-slate-100">
                <div className="flex items-center justify-between mb-8">
                  <h4 className="font-black uppercase tracking-widest text-xs text-slate-400">Briefs Disponibles</h4>
                  <Badge variant="secondary" className="bg-violet-50 text-violet-600">32 Nouvelles Missions</Badge>
                </div>
                <div className="space-y-4">
                  {[1,2,3].map(i => (
                    <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between group hover:bg-violet-50 hover:border-violet-100 transition-all cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-slate-400 group-hover:text-violet-500" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">Campagne Summer 2026</p>
                          <p className="text-xs text-slate-500">T-shirt Premium • 150 TND</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-violet-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <Badge className="bg-pink-50 text-pink-600 mb-6 px-4 py-1 uppercase tracking-widest font-black text-[10px]">Simple & Efficace</Badge>
              <h2 className="text-4xl lg:text-6xl font-bold text-slate-900 mb-8 font-heading leading-tight">
                Recevez des produits, <br /> <span className="text-violet-600 italic underline decoration-pink-400 underline-offset-8">filmez</span>, gagnez.
              </h2>
              <ul className="space-y-6 mb-12">
                {[
                  "Inscrivez-vous et créez votre portfolio en 2 min",
                  "Postulez aux missions qui vous correspondent",
                  "Recevez les produits gratuitement chez vous",
                  "Envoyez votre contenu et soyez payé sous 48h"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-4 text-lg font-medium text-slate-700">
                    <div className="w-6 h-6 rounded-full bg-violet-50 flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-xs font-black text-violet-600">{idx + 1}</span>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/inscription">
                <Button className="h-16 px-10 text-xl font-bold bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all">
                  Rejoindre le club
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 bg-slate-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 text-center relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-600/20 rounded-full blur-[120px] -z-10" />
          
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/10 border border-white/20 mb-12">
            <Zap className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-black uppercase tracking-widest">Places Limitées - Validation Manuelle</span>
          </div>
          
          <h2 className="text-4xl lg:text-8xl font-black mb-12 font-heading leading-tight tracking-tighter">
            Prêt à devenir la <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400">Prochaine Star</span> ?
          </h2>
          
          <Link href="/inscription">
            <Button className="h-20 px-16 text-2xl font-black bg-white text-slate-900 hover:bg-slate-100 rounded-2xl shadow-3xl shadow-white/5 transition-all mb-8">
              Postuler Maintenant
            </Button>
          </Link>
          
          <div className="flex items-center justify-center gap-6 opacity-50">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">Paiement Escrow</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">Support Dédié</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ChevronRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function ShieldCheck(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
