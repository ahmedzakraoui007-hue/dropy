"use client";

import { useState } from "react";
import { ArrowRight, Plus } from "lucide-react";

type Hotspot = { x: number; y: number; label?: string; price?: string; link?: string };

export function Lookbook({ config, navigate }: { config: any; navigate: (url: string) => void }) {
  const [open, setOpen] = useState<number | null>(null);
  const hotspots: Hotspot[] = Array.isArray(config.hotspots) ? config.hotspots : [];
  if (!config.image) return null;
  return (
    <section className="px-4 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          {config.badge && <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.25em] opacity-60">{config.badge}</p>}
          {config.title && <h2 className="text-3xl font-black tracking-tight md:text-5xl">{config.title}</h2>}
          {config.subtitle && <p className="mx-auto mt-3 max-w-xl text-lg opacity-70">{config.subtitle}</p>}
        </div>
        <div className="relative mx-auto aspect-[4/5] max-w-xl overflow-hidden rounded-[2rem] shadow-2xl" onClick={() => setOpen(null)} dir="ltr">
          <img src={config.image} alt={config.title || ""} className="h-full w-full object-cover" />
          {hotspots.map((spot, i) => (
            <div key={i} className="absolute" style={{ left: `${Math.min(95, Math.max(5, Number(spot.x) || 50))}%`, top: `${Math.min(95, Math.max(5, Number(spot.y) || 50))}%` }}>
              <button
                type="button"
                aria-label={spot.label || `Produit ${i + 1}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(open === i ? null : i);
                }}
                className="relative flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-black shadow-xl"
              >
                <span className="absolute inset-0 animate-ping rounded-full bg-white/70" />
                <Plus className={`relative h-4 w-4 transition-transform ${open === i ? "rotate-45" : ""}`} />
              </button>
              {open === i && (
                <div className={`absolute top-6 z-10 w-52 rounded-2xl bg-white p-4 text-start text-black shadow-2xl ${Number(spot.x) > 60 ? "right-0" : "left-0"}`} onClick={(e) => e.stopPropagation()}>
                  {spot.label && <p className="font-bold leading-snug" dir="auto">{spot.label}</p>}
                  {spot.price && <p className="mt-1 text-sm font-black">{spot.price}</p>}
                  {spot.link && (
                    <button type="button" onClick={() => navigate(spot.link!)} className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-primary">
                      {config.ctaText || "Voir le produit"}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
