"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Package, 
  Users, 
  ArrowRight, 
  Check, 
  Sparkles,
  Truck,
  BarChart3,
  ShieldCheck,
  Smartphone,
  DollarSign,
  Clock,
  Shirt,
  Baby,
  Footprints,
  ShoppingBag,
  Factory,
  Zap,
  Lock,
  Rocket,
  Layers
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

const categories = [
  { icon: Shirt, name: "Prêt-à-porter" },
  { icon: Baby, name: "Enfants" },
  { icon: Footprints, name: "Chaussures" },
  { icon: ShoppingBag, name: "Accessoires" },
  { icon: Layers, name: "Lingerie" },
  { icon: Shirt, name: "Sport" }
];

export default function SupplierLanding() {
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-amber-100">
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-amber-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-50/30 rounded-full blur-3xl translate-y-1/4 -translate-x-1/4" />
        </div>
        
        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial="initial"
              animate="animate"
              variants={stagger}
            >
              <motion.div variants={fadeInUp}>
                <Badge className="bg-amber-50 text-amber-600 border-amber-100 mb-6 px-4 py-1.5 rounded-full uppercase tracking-wider text-[10px] font-black">
                  Partenaire de Production
                </Badge>
              </motion.div>

              <motion.h1 
                variants={fadeInUp}
                className="text-5xl lg:text-8xl font-black tracking-tighter mb-8 text-slate-900 leading-[0.9] font-heading"
              >
                Digitalisez <br />
                votre <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600">Atelier.</span>
              </motion.h1>
              
              <motion.p 
                variants={fadeInUp}
                className="text-xl text-slate-600 mb-10 max-w-xl leading-relaxed font-light"
              >
                Connectez votre production à des milliers de revendeurs en Tunisie. Liquidez votre stock et automatisez votre distribution textile.
              </motion.p>
              
              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-6 mb-12">
                <Link href="/inscription">
                  <Button className="h-16 px-10 text-xl font-bold bg-slate-900 text-white hover:bg-slate-800 rounded-2xl shadow-2xl transition-all hover:scale-105">
                    Devenir Fournisseur
                    <ArrowRight className="ml-2 w-6 h-6" />
                  </Button>
                </Link>
                <Link href="#how-it-works">
                  <Button variant="ghost" className="h-16 px-8 text-lg font-semibold text-slate-600 hover:bg-slate-50 rounded-2xl">
                    Comment ça marche ?
                  </Button>
                </Link>
              </motion.div>

              <motion.div 
                variants={fadeInUp}
                className="flex items-center gap-8 py-6 border-t border-slate-100"
              >
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-amber-500" />
                  <span className="text-sm font-bold text-slate-700">Paiements Hebdo</span>
                </div>
                <div className="flex items-center gap-2">
                  <Factory className="w-5 h-5 text-orange-500" />
                  <span className="text-sm font-bold text-slate-700">Gestion de Stock Live</span>
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
                  src="https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&h=1000&fit=crop"
                  alt="Textile Factory"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
                <div className="absolute top-10 right-10 p-6 glass rounded-2xl border border-white/20">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-teal-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Production Active</span>
                    </div>
                    <p className="text-2xl font-black text-slate-900 font-heading">Saison 2026</p>
                  </div>
                </div>
              </div>
              {/* Floating Interactions */}
              <motion.div 
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 5, repeat: Infinity }}
                className="absolute -bottom-10 -left-10 w-48 h-48 bg-white rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 flex flex-col justify-center text-center"
              >
                <Users className="w-10 h-10 text-orange-500 mx-auto mb-4" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Réseau de</p>
                <p className="text-xl font-black text-slate-900 font-heading">Vendeurs</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4 font-heading uppercase tracking-widest">Secteurs Recherchés</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((cat, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.05 }}
                className="bg-white p-6 rounded-3xl border border-slate-100 flex flex-col items-center shadow-sm hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 mb-4">
                  <cat.icon className="w-6 h-6" />
                </div>
                <span className="font-bold text-slate-900 text-sm">{cat.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Dropy for Suppliers */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <Badge className="bg-orange-50 text-orange-600 mb-6 px-4 py-1">Optimisation</Badge>
              <h2 className="text-4xl lg:text-6xl font-bold text-slate-900 mb-8 font-heading leading-tight">
                Zéro <span className="text-orange-600">Invendus.</span> <br />
                Zéro Problèmes.
              </h2>
              <ul className="space-y-8">
                {[
                  { title: "Distribution Massive", desc: "Vos produits sont exposés instantanément à des centaines d'e-commerçants." },
                  { title: "Logistique Simplifiée", desc: "Préparez vos colis, on passe les chercher. Finie la gestion des transporteurs." },
                  { title: "Sécurité Financière", desc: "Paiements sécurisés par Escrow. Vous savez exactement quand vous serez payé." },
                  { title: "Insights de Marché", desc: "Voyez quels designs cartonnent et adaptez votre production en temps réel." }
                ].map((item, idx) => (
                  <li key={idx} className="flex gap-6 group">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center flex-shrink-0 group-hover:bg-orange-600 transition-colors">
                      <Check className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-slate-900 mb-1">{item.title}</h4>
                      <p className="text-slate-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-orange-600 rounded-[3rem] rotate-3 blur-3xl opacity-10" />
              <div className="relative bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-slate-500" />
                      </div>
                      <span className="font-bold">Tableau de Bord</span>
                    </div>
                    <Badge variant="outline" className="border-teal-500 text-teal-600">Live</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-32 rounded-3xl bg-slate-50 p-6 flex flex-col justify-end">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Commandes</p>
                      <p className="text-2xl font-black text-slate-900 font-heading">+1,240</p>
                    </div>
                    <div className="h-32 rounded-3xl bg-orange-50 p-6 flex flex-col justify-end">
                      <p className="text-xs font-black uppercase tracking-widest text-orange-400 mb-1">Profit</p>
                      <p className="text-2xl font-black text-orange-900 font-heading">+32%</p>
                    </div>
                  </div>
                  <div className="p-6 rounded-3xl bg-slate-900 text-white">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-black uppercase tracking-widest opacity-60">Prochain Versement</span>
                      <Clock className="w-4 h-4 opacity-60" />
                    </div>
                    <p className="text-3xl font-black font-heading mb-2">Vendredi</p>
                    <p className="text-xs opacity-60 italic">Virement automatique vers votre compte...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-20 opacity-10">
          <Rocket className="w-64 h-64 text-orange-400 fill-orange-400 rotate-12" />
        </div>
        
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/10 border border-white/20 mb-12">
            <Zap className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-black uppercase tracking-widest">Early Partner Access</span>
          </div>
          <h2 className="text-4xl lg:text-7xl font-bold mb-8 font-heading leading-tight">
            Passez à la vitesse <br /> <span className="text-orange-500 italic underline decoration-white/20 underline-offset-8">Supérieure.</span>
          </h2>
          <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Nous sélectionnons rigoureusement nos partenaires pour garantir une expérience premium à nos vendeurs. Postulez dès aujourd'hui.
          </p>
          <Link href="/inscription">
            <Button className="h-20 px-16 text-2xl font-black bg-white text-slate-900 hover:bg-slate-100 rounded-2xl shadow-3xl shadow-white/5 transition-all">
              Rejoindre le Réseau
            </Button>
          </Link>
          <div className="mt-12 flex items-center justify-center gap-8 opacity-40 grayscale">
             <div className="flex items-center gap-2">
               <ShieldCheck className="w-5 h-5" />
               <span className="text-xs font-bold uppercase tracking-widest">Accès Sécurisé</span>
             </div>
             <div className="flex items-center gap-2">
               <Lock className="w-5 h-5" />
               <span className="text-xs font-bold uppercase tracking-widest">Données Protégées</span>
             </div>
          </div>
        </div>
      </section>
    </div>
  );
}
