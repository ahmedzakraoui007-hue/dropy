"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatDt, useStoreItems } from "./useStoreItems";

export function Showcase3D({ config, storeId, navigate }: { config: any; storeId?: string; navigate: (url: string) => void }) {
  const items = useStoreItems(config, storeId, 8);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const startX = useRef<number | null>(null);
  const count = items.length;

  useEffect(() => {
    if (paused || count < 2 || config.autoplay === false) return;
    const timer = setInterval(() => setActive((a) => (a + 1) % count), 3200);
    return () => clearInterval(timer);
  }, [paused, count, config.autoplay]);

  if (!count) return null;
  const go = (step: number) => {
    setPaused(true);
    setActive((a) => (a + step + count) % count);
  };
  const current = items[active % count];

  return (
    <section className="relative overflow-hidden px-4 py-20 md:py-28" style={{ backgroundColor: config.backgroundColor || undefined, color: config.textColor || undefined, backgroundImage: "radial-gradient(ellipse at 50% 40%, color-mix(in srgb, var(--primary) 18%, transparent), transparent 70%)" }}>
      <div className="mx-auto max-w-6xl text-center">
        {config.badge && <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.25em] opacity-60">{config.badge}</p>}
        {config.title && <h2 className="text-4xl font-black tracking-tight md:text-6xl">{config.title}</h2>}
        {config.subtitle && <p className="mx-auto mt-4 max-w-xl text-lg opacity-70">{config.subtitle}</p>}
      </div>

      <div
        className="relative mx-auto mt-12 h-[380px] max-w-5xl select-none md:h-[480px]"
        style={{ perspective: "1400px" }}
        onPointerDown={(e) => {
          startX.current = e.clientX;
          setPaused(true);
        }}
        onPointerUp={(e) => {
          if (startX.current === null) return;
          const dx = e.clientX - startX.current;
          if (Math.abs(dx) > 30) go(dx < 0 ? 1 : -1);
          startX.current = null;
        }}
        dir="ltr"
      >
        {items.map((item, i) => {
          let offset = i - active;
          if (offset > count / 2) offset -= count;
          if (offset < -count / 2) offset += count;
          const abs = Math.abs(offset);
          return (
            <button
              key={i}
              type="button"
              onClick={() => (offset === 0 ? item.link && navigate(item.link) : go(offset))}
              className="absolute left-1/2 top-1/2 aspect-[4/5] w-[62%] max-w-[300px] overflow-hidden rounded-[2rem] shadow-2xl transition-all duration-700 ease-out md:w-[34%]"
              style={{
                transform: `translate(-50%, -50%) translateX(${offset * 58}%) translateZ(${-abs * 220}px) rotateY(${-offset * 38}deg)`,
                opacity: abs > 2 ? 0 : 1 - abs * 0.18,
                zIndex: 10 - abs,
                pointerEvents: abs > 2 ? "none" : "auto",
              }}
              aria-label={item.title || ""}
            >
              <img src={item.image} alt={item.title || ""} className="h-full w-full object-cover" draggable={false} />
              <span className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </button>
          );
        })}
        <button type="button" aria-label="Précédent" onClick={() => go(-1)} className="absolute left-1 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black shadow-lg md:flex">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button type="button" aria-label="Suivant" onClick={() => go(1)} className="absolute right-1 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black shadow-lg md:flex">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {(current.title || current.price) && (
        <div className="mt-6 text-center">
          {current.title && <p className="text-xl font-bold" dir="auto">{current.title}</p>}
          {current.price && (
            <p className="mt-1 text-lg font-black">
              {formatDt(current.price)}
              {current.compareAt && Number(current.compareAt) > Number(current.price) && <span className="ms-2 text-sm font-medium line-through opacity-50">{formatDt(current.compareAt)}</span>}
            </p>
          )}
          {current.link && (
            <button type="button" onClick={() => navigate(current.link!)} className="mt-5 rounded-full bg-primary px-8 py-3 font-bold text-primary-foreground shadow-xl transition-transform hover:scale-105">
              {config.ctaText || "Découvrir"}
            </button>
          )}
        </div>
      )}
      <div className="mt-6 flex justify-center gap-1.5">
        {items.map((_, i) => (
          <span key={i} className={`h-1.5 rounded-full transition-all ${i === active ? "w-6 bg-primary" : "w-1.5 bg-current opacity-25"}`} />
        ))}
      </div>
    </section>
  );
}
