// src/app/preview/[slug]/[pageSlug]/page.tsx
'use client';

import { useEffect, useState, useRef, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ShoppingCart, Star, CheckCircle2, ArrowRight, Play, Mail, Truck, Shield, RefreshCw, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StorePagePreview({ params }: { params: Promise<{ slug: string, pageSlug: string }> }) {
  const { slug, pageSlug } = use(params);
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const hasReceivedInitialUpdate = useRef(false);

  useEffect(() => {
    const loadData = async () => {
      // Disable auth persistence in iframe to avoid 'navigatorLock' conflicts with parent window
      const supabase = createClient({
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      });

      const { data: storeData } = await supabase
        .from("store_configs")
        .select("*")
        .eq("store_slug", slug)
        .single();

      if (storeData) {
        setConfig(storeData);
      }

      const { data: pageData } = await supabase
        .from("store_pages")
        .select("*")
        .eq("slug", pageSlug)
        .single();

      if (pageData && !hasReceivedInitialUpdate.current) {
        setSections(pageData.sections || []);
      }

      setLoading(false);
    };

    loadData();
  }, [slug, pageSlug]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'STORE_UPDATE') {
        hasReceivedInitialUpdate.current = true;
        if (event.data.sections) setSections(event.data.sections);
        if (event.data.config) setConfig(event.data.config);
      }

      if (event.data.type === 'UPDATE_CSS_VARIABLES') {
        const cssVars = event.data.payload;
        let styleEl = document.getElementById('dropy-css-vars');
        if (!styleEl) {
          styleEl = document.createElement('style');
          styleEl.id = 'dropy-css-vars';
          document.head.appendChild(styleEl);
        }
        styleEl.textContent = cssVars;
      }

      if (event.data.type === 'SCROLL_TO_SECTION') {
        const sectionId = event.data.sectionId;
        const element = document.getElementById(`section-${sectionId}`);

        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });

          // Highlight effect
          element.classList.add('ring-4', 'ring-primary/50', 'z-10', 'relative');
          setTimeout(() => {
            element.classList.remove('ring-4', 'ring-primary/50', 'z-10', 'relative');
          }, 2000);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  const primaryColor = config?.colors?.primary || '#7c3aed';
  const textColor = config?.colors?.text || '#111111';
  const bgColor = config?.colors?.background || '#ffffff';

  return (
    <div
      className="min-h-screen transition-colors duration-500"
      style={{
        backgroundColor: bgColor,
        color: textColor,
        fontFamily: config?.typography?.body_font || 'Inter, sans-serif'
      }}
    >
      <style jsx global>{`
        :root {
          --primary: ${primaryColor};
        }
        h1, h2, h3, h4, h5, h6 {
          font-family: ${config?.typography?.heading_font || 'Inter'}, sans-serif !important;
        }
      `}</style>

      {/* Modern Dynamic Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 py-4 px-8 flex items-center justify-between">
        <div className="text-2xl font-black uppercase tracking-tighter text-gray-900">
          {config?.logo_url ? (
            <img src={config.logo_url} alt="Logo" className="h-10 w-auto" />
          ) : (
            config?.store_name || "DROPY STORE"
          )}
        </div>
        <nav className="hidden lg:flex items-center gap-10 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">
          <span className="text-primary cursor-pointer">Accueil</span>
          <span className="hover:text-gray-900 transition-colors cursor-pointer">Collections</span>
          <span className="hover:text-gray-900 transition-colors cursor-pointer">Nouveautés</span>
          <span className="hover:text-gray-900 transition-colors cursor-pointer">Contact</span>
        </nav>
        <div className="flex items-center gap-6">
          <div className="relative cursor-pointer group">
            <ShoppingCart className="w-6 h-6 text-gray-900 group-hover:text-primary transition-colors" />
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-white text-[10px] font-black flex items-center justify-center rounded-full shadow-lg shadow-primary/20">0</span>
          </div>
        </div>
      </header>

      <main className="overflow-x-hidden">
        {sections.map((section, idx) => (
          (section.is_visible ?? true) && (
            <div
              key={section.id || idx}
              id={`section-${section.id}`}
              className="transition-all duration-300"
            >
              <SectionRenderer
                type={section.type}
                data={section.content || section.data}
                config={config}
              />
            </div>
          )
        ))}
        {sections.length === 0 && (
          <div className="py-60 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-gray-200" />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-gray-300">Conception en cours...</p>
          </div>
        )}
      </main>

      {/* Modern Dynamic Footer */}
      <footer className="py-32 px-10 bg-[#0f172a] text-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-20">
          <div className="space-y-8">
            <div className="text-3xl font-black uppercase tracking-tighter">
              {config?.store_name || "DROPY"}
            </div>
            <p className="text-sm font-medium text-gray-400 leading-relaxed max-w-xs">
              {config?.store_tagline || "La meilleure expérience shopping en Tunisie, livrée directement chez vous."}
            </p>
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-8">Navigation</h4>
            <ul className="space-y-4 text-sm font-bold text-gray-300">
              <li className="hover:text-primary transition-colors cursor-pointer">Boutique</li>
              <li className="hover:text-primary transition-colors cursor-pointer">À Propos</li>
              <li className="hover:text-primary transition-colors cursor-pointer">FAQ</li>
              <li className="hover:text-primary transition-colors cursor-pointer">Contact</li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-8">Légal</h4>
            <ul className="space-y-4 text-sm font-bold text-gray-300">
              <li className="hover:text-primary transition-colors cursor-pointer">Conditions Générales</li>
              <li className="hover:text-primary transition-colors cursor-pointer">Livraison</li>
              <li className="hover:text-primary transition-colors cursor-pointer">Politique de retour</li>
            </ul>
          </div>
          <div className="space-y-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-8">Newsletter</h4>
            <div className="flex gap-2">
              <input type="email" placeholder="votre@email.tn" className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm flex-1 outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
              <button className="bg-primary text-white p-3 rounded-xl shadow-lg shadow-primary/20">
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-white/5 mt-20 pt-10 flex flex-col md:flex-row items-center justify-between gap-6 opacity-40">
          <p className="text-[10px] font-bold uppercase tracking-widest">© 2026 {config?.store_name}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <div className="h-6 w-10 bg-white/10 rounded" />
            <div className="h-6 w-10 bg-white/10 rounded" />
            <div className="h-6 w-10 bg-white/10 rounded" />
          </div>
        </div>
      </footer>
    </div>
  );
}

function SectionRenderer({ type, data, config }: { type: string, data: any, config: any }) {
  const paddingY = data.paddingY || 100;
  const bgColor = data.backgroundColor || 'transparent';
  const primaryColor = config?.colors?.primary || '#7c3aed';

  switch (type) {
    case 'hero':
      return (
        <section
          className="relative px-8 overflow-hidden flex flex-col items-center justify-center min-h-[70vh] text-center"
          style={{
            backgroundImage: `url(${data.backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            color: data.textColor || '#ffffff'
          }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" style={{ opacity: data.overlay || 0.4 }} />
          <div className="relative z-10 max-w-4xl space-y-10">
            {data.badge && (
              <span className="inline-block px-6 py-2 bg-primary/20 backdrop-blur-md border border-primary/30 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-white">
                {data.badge}
              </span>
            )}
            <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[0.9] uppercase italic italic-shadow">
              {data.title}
            </h1>
            <p className="text-xl md:text-2xl font-medium opacity-80 max-w-2xl mx-auto leading-relaxed">
              {data.subtitle}
            </p>
            {data.ctaText && (
              <button className="group relative px-12 py-5 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/40 transition-all hover:scale-105 active:scale-95 overflow-hidden">
                <span className="relative z-10 flex items-center gap-3">
                  {data.ctaText}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500" />
              </button>
            )}
          </div>
        </section>
      );

    case 'featured_products':
    case 'product_grid':
      return (
        <section className="px-10 max-w-7xl mx-auto" style={{ paddingTop: paddingY, paddingBottom: paddingY, backgroundColor: bgColor }}>
          <div className="flex flex-col md:flex-row items-end justify-between mb-20 gap-8">
            <div className="space-y-4">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Le Meilleur du Shop</span>
              <h2 className="text-5xl font-black uppercase tracking-tighter italic">{data.title}</h2>
              <p className="text-gray-500 font-medium max-w-lg">{data.subtitle}</p>
            </div>
            <button className="group flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] hover:text-primary transition-colors">
              Voir tout le catalogue
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          <div className={`grid gap-10 grid-cols-2 lg:grid-cols-${data.columns || 4}`}>
            {(data.items || [1, 2, 3, 4, 5, 6, 7, 8]).map((item: any, i: number) => (
              <div key={i} className="group cursor-pointer">
                <div className="aspect-[3/4] bg-gray-50 rounded-3xl overflow-hidden relative mb-6 border border-gray-100 shadow-sm transition-all group-hover:shadow-2xl group-hover:-translate-y-2">
                  {typeof item === 'object' ? (
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-gray-200 uppercase tracking-widest">Produit #{i + 1}</div>
                  )}
                  <div className="absolute top-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                    <button className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl text-gray-900 hover:bg-primary hover:text-white transition-colors">
                      <ShoppingCart className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-gray-900 uppercase tracking-tight text-sm truncate">
                    {typeof item === 'object' ? item.title : `Produit Signature v.${i + 1}`}
                  </h4>
                  <p className="text-primary font-black text-lg">
                    {typeof item === 'object' ? `${item.price} DT` : `${(Math.random() * 100 + 50).toFixed(0)} DT`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      );

    case 'benefits':
    case 'trust_badges':
    case 'features':
      return (
        <section className="px-10" style={{ paddingTop: paddingY, paddingBottom: paddingY, backgroundColor: bgColor }}>
          <div className="max-w-7xl mx-auto">
            <div className={`grid gap-12 lg:grid-cols-${data.columns || 4}`}>
              {(data.items || data.features || []).map((item: any, i: number) => (
                <div key={i} className="p-10 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm transition-all hover:shadow-2xl hover:border-primary/20 group text-center">
                  <div className="w-20 h-20 rounded-3xl bg-gray-50 text-gray-400 group-hover:bg-primary group-hover:text-white flex items-center justify-center mx-auto mb-10 transition-all group-hover:rotate-6 group-hover:scale-110 shadow-sm">
                    {i === 0 ? <Truck className="w-10 h-10" /> : i === 1 ? <Shield className="w-10 h-10" /> : i === 2 ? <RefreshCw className="w-10 h-10" /> : <Star className="w-10 h-10" />}
                  </div>
                  <h4 className="font-black text-gray-900 uppercase tracking-tight mb-4 text-base italic">{item.title}</h4>
                  <p className="text-sm text-gray-500 font-medium leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case 'promo_banner':
      return (
        <div
          className="py-4 px-10 text-center relative overflow-hidden group cursor-pointer"
          style={{ backgroundColor: data.backgroundColor || primaryColor, color: data.textColor || '#ffffff' }}
        >
          <div className="relative z-10 flex items-center justify-center gap-3">
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">{data.text}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
          </div>
          <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-700" />
        </div>
      );

    case 'testimonials':
      return (
        <section className="px-10 overflow-hidden" style={{ paddingTop: paddingY, paddingBottom: paddingY, backgroundColor: bgColor }}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-24 space-y-6">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Témoignages</span>
              <h2 className="text-6xl font-black uppercase tracking-tighter italic italic-shadow">{data.title}</h2>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {(data.testimonials || []).map((item: any, i: number) => (
                <div key={i} className="p-10 bg-white rounded-[3rem] border border-gray-100 shadow-sm flex flex-col gap-8 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 text-primary/10 transition-transform group-hover:scale-125">
                    <MessageSquare className="w-20 h-20" />
                  </div>
                  <div className="flex gap-1 text-primary">
                    {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-4 h-4 fill-current" />)}
                  </div>
                  <p className="text-lg font-bold text-gray-900 leading-relaxed relative z-10 italic">"{item.text}"</p>
                  <div className="flex items-center gap-4 mt-auto relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-gray-100 border-2 border-white shadow-xl overflow-hidden grayscale group-hover:grayscale-0 transition-all">
                      <img src={item.avatar} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="font-black text-gray-900 uppercase tracking-tight text-sm">{item.name}</h4>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{item.location}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );

    case 'video':
      return (
        <section className="px-10" style={{ paddingTop: paddingY, paddingBottom: paddingY, backgroundColor: bgColor }}>
          <div className="max-w-7xl mx-auto text-center space-y-12">
            <h2 className="text-4xl font-black uppercase tracking-tighter italic">{data.title}</h2>
            <div className="aspect-video bg-gray-900 rounded-[3rem] overflow-hidden relative shadow-2xl group cursor-pointer">
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="w-24 h-24 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl shadow-primary/50 group-hover:scale-125 transition-transform">
                  <Play className="w-10 h-10 fill-current ml-2" />
                </div>
              </div>
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all" />
              <div className="absolute bottom-10 left-10 right-10 flex items-end justify-between text-white text-left opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                <div className="max-w-md">
                  <h4 className="text-2xl font-black uppercase italic italic-shadow">Regarder la vidéo</h4>
                  <p className="text-sm font-medium opacity-70">Découvrez comment nous révolutionnons le commerce en Tunisie.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      );

    default:
      return (
        <div className="py-20 px-8 text-center border-y border-dashed border-gray-100 bg-gray-50/20">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Zap className="w-8 h-8 text-gray-200" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300">Section {type}</p>
          <p className="text-[9px] font-bold text-gray-300 mt-2 uppercase tracking-widest">Aperçu en cours de déploiement</p>
        </div>
      );
  }
}

function MessageSquare(props: any) {
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
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
