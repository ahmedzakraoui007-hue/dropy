"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Store, 
  Package, 
  ArrowRight, 
  Check, 
  Play,
  Sparkles,
  Palette,
  ShoppingCart,
  Video,
  Truck,
  Zap,
  Star,
  ShieldCheck,
  TrendingUp,
  Target,
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

const features = [
  {
    icon: Palette,
    title: "Builder Sans Code",
    description: "Créez une boutique d'aspect professionnel en quelques minutes. Pas besoin d'être designer ou développeur.",
    bg: "bg-blue-50",
    color: "text-blue-600"
  },
  {
    icon: ShoppingCart,
    title: "Dropshipping Textile",
    description: "Vendez du textile premium fabriqué en Tunisie sans jamais toucher au stock. On gère tout pour vous.",
    bg: "bg-indigo-50",
    color: "text-indigo-600"
  },
  {
    icon: Video,
    title: "Vidéos de Vente UGC",
    description: "Accédez à notre réseau de créateurs pour obtenir des vidéos authentiques qui multiplient vos conversions.",
    bg: "bg-violet-50",
    color: "text-violet-600"
  }
];

export default function SellerLanding() {
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-sky-100">
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sky-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-50/30 rounded-full blur-3xl translate-y-1/4 -translate-x-1/4" />
        </div>
        
        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial="initial"
              animate="animate"
              variants={stagger}
            >
              <motion.div variants={fadeInUp}>
                <Badge className="bg-sky-50 text-sky-600 border-sky-100 mb-6 px-4 py-1.5 rounded-full uppercase tracking-wider text-[10px] font-black">
                  Pour les Entrepreneurs Ambitieux
                </Badge>
              </motion.div>

              <motion.h1 
                variants={fadeInUp}
                className="text-5xl lg:text-8xl font-black tracking-tighter mb-8 text-slate-900 leading-[0.9] font-heading"
              >
                Vendez. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-indigo-600">Encaissez.</span> <br />
                On s'occupe du reste.
              </motion.h1>
              
              <motion.p 
                variants={fadeInUp}
                className="text-xl text-slate-600 mb-10 max-w-xl leading-relaxed font-light"
              >
                L'infrastructure e-commerce la plus avancée en Tunisie. Zéro stock, zéro logistique, 100% focus sur votre croissance.
              </motion.p>
              
              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-6 mb-12">
                <Link href="/inscription" className="group">
                  <Button className="h-16 px-10 text-xl font-bold bg-slate-900 text-white hover:bg-slate-800 rounded-2xl shadow-2xl transition-all hover:scale-105">
                    Lancer mon projet
                    <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="#how-it-works">
                  <Button variant="ghost" className="h-16 px-8 text-lg font-semibold text-slate-600 hover:bg-slate-50 rounded-2xl">
                    Voir la démo
                  </Button>
                </Link>
              </motion.div>

              <motion.div 
                variants={fadeInUp}
                className="flex items-center gap-8 py-6 border-t border-slate-100"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-teal-500" />
                  <span className="text-sm font-bold text-slate-700">Audit Fournisseurs</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-indigo-500" />
                  <span className="text-sm font-bold text-slate-700">Expédition 24/48h</span>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative"
            >
              <div className="relative aspect-square lg:aspect-auto lg:h-[600px] bg-slate-100 rounded-[3rem] overflow-hidden shadow-3xl border-8 border-white">
                <img 
                  src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=1000&fit=crop"
                  alt="Premium Product"
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
                <div className="absolute bottom-10 left-10 right-10 p-8 glass rounded-3xl border border-white/20">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500">Stock Live</span>
                    <Badge className="bg-teal-500 text-white border-none">Disponible</Badge>
                  </div>
                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500 w-[85%] animate-pulse" />
                  </div>
                </div>
              </div>
              {/* Floating Element */}
              <motion.div 
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-600 rounded-[2rem] p-6 text-white shadow-2xl flex flex-col justify-between"
              >
                <TrendingUp className="w-8 h-8" />
                <div className="text-sm font-black italic">+240%</div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl lg:text-6xl font-bold text-slate-900 mb-8 font-heading">
              Tout pour dominer le marché local.
            </h2>
            <p className="text-xl text-slate-500 font-light">
              Dropy n'est pas juste un outil, c'est votre partenaire stratégique.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                variants={fadeInUp}
                initial="initial"
                whileInView="whileInView"
                className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all group"
              >
                <div className={`w-16 h-16 rounded-2xl ${feature.bg} ${feature.color} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4 font-heading">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed text-lg">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* The "Made in Tunisia" Edge */}
      <section className="py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative order-2 lg:order-1"
            >
              <div className="absolute inset-0 bg-sky-600 rounded-[3rem] -rotate-3 blur-3xl opacity-10" />
              <div className="relative grid grid-cols-2 gap-4">
                <div className="space-y-4 pt-12">
                  <div className="h-64 rounded-3xl bg-slate-100 overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&h=600&fit=crop" className="w-full h-full object-cover" alt="Fashion" />
                  </div>
                  <div className="h-48 rounded-3xl bg-sky-600 p-8 text-white flex flex-col justify-end">
                    <Target className="w-8 h-8 mb-4" />
                    <p className="font-bold uppercase tracking-widest text-[10px]">Ciblage Local</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="h-48 rounded-3xl bg-slate-900 p-8 text-white flex flex-col justify-end">
                    <Zap className="w-8 h-8 mb-4 text-sky-400" />
                    <p className="font-bold uppercase tracking-widest text-[10px]">Rapidité</p>
                  </div>
                  <div className="h-64 rounded-3xl bg-slate-100 overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=600&fit=crop" className="w-full h-full object-cover" alt="Logistics" />
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="order-1 lg:order-2">
              <Badge className="bg-indigo-50 text-indigo-600 mb-6 px-4 py-1">Pourquoi le Textile ?</Badge>
              <h2 className="text-4xl lg:text-6xl font-bold text-slate-900 mb-8 font-heading leading-tight">
                La Tunisie est une <span className="text-sky-600">Puissance Textile.</span> Profitez-en.
              </h2>
              <p className="text-xl text-slate-600 mb-10 leading-relaxed font-light">
                Nous avons sélectionné les meilleurs ateliers de confection du pays pour vous offrir des produits compétitifs, de haute qualité, et surtout... déjà sur place. 
              </p>
              <ul className="space-y-6 mb-12">
                {[
                  "Délais de livraison ultra-courts (24-48h)",
                  "Aucun problème de douane ou de change",
                  "Qualité européenne à prix local",
                  "Support client en tunisien par WhatsApp"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-4 text-lg font-medium text-slate-800">
                    <div className="w-6 h-6 rounded-full bg-teal-50 flex items-center justify-center">
                      <Check className="w-4 h-4 text-teal-600" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Early Access */}
      <section className="py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/10 border border-white/20 mb-12">
            <Rocket className="w-4 h-4 text-sky-400" />
            <span className="text-sm font-black uppercase tracking-widest">Early Adopter Program</span>
          </div>
          <h2 className="text-4xl lg:text-7xl font-bold mb-12 font-heading">
            Ne soyez pas le <br className="hidden md:block" /> dernier à savoir.
          </h2>
          <div className="max-w-xl mx-auto p-1 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-xl mb-12">
            <div className="bg-slate-800/50 rounded-[1.4rem] p-8">
              <p className="text-xl text-slate-300 italic mb-6">
                "Dropy n'est pas juste une plateforme, c'est la pièce manquante de l'e-commerce en Tunisie."
              </p>
              <div className="flex items-center justify-center gap-4">
                <div className="w-12 h-12 rounded-full bg-sky-500" />
                <div className="text-left">
                  <p className="font-bold">Hassen</p>
                  <p className="text-xs text-slate-500 font-black uppercase tracking-widest">E-commerçant @ Tunis</p>
                </div>
              </div>
            </div>
          </div>
          
          <Link href="/inscription">
            <Button className="h-20 px-16 text-2xl font-black bg-white text-slate-900 hover:bg-slate-100 rounded-2xl shadow-3xl shadow-white/5 transition-all">
              Postuler pour l'accès
            </Button>
          </Link>
          <p className="mt-8 text-slate-500 text-sm uppercase tracking-widest font-black">
            Places limitées • Validation Manuelle
          </p>
        </div>
      </section>
    </div>
  );
}
