"use client";

import { useEffect, useRef } from "react";
import { Play } from "lucide-react";
import { formatDt, useStoreItems, type ShowcaseItem } from "./useStoreItems";

function ReelCard({ item, cta, navigate, index }: { item: ShowcaseItem & { caption?: string }; cta: string; navigate: (url: string) => void; index: number }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => (entry.isIntersecting ? video.play().catch(() => {}) : video.pause()), { threshold: 0.6 });
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative aspect-[9/16] w-[68vw] max-w-[290px] shrink-0 snap-center overflow-hidden rounded-[2rem] bg-black shadow-2xl">
      {item.video ? (
        <video ref={videoRef} src={item.video} poster={item.image} muted loop playsInline className="h-full w-full object-cover" />
      ) : (
        <img src={item.image} alt={item.title || ""} className="h-full w-full object-cover dropy-reel-zoom" style={{ animationDelay: `${index * -2}s` }} />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/20" />
      {!item.video && (
        <span className="absolute end-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur">
          <Play className="h-4 w-4 fill-white text-white" />
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 p-5 text-white">
        {(item.caption || item.title) && <p className="line-clamp-2 text-base font-bold leading-snug" dir="auto">{item.caption || item.title}</p>}
        {item.price && <p className="mt-1 text-sm font-black opacity-90">{formatDt(item.price)}</p>}
        {item.link && (
          <button type="button" onClick={() => navigate(item.link!)} className="mt-4 w-full rounded-full bg-white py-3 text-sm font-black text-black transition-transform active:scale-95">
            {cta}
          </button>
        )}
      </div>
    </div>
  );
}

export function Reels({ config, storeId, navigate }: { config: any; storeId?: string; navigate: (url: string) => void }) {
  const items = useStoreItems(config, storeId, 6) as (ShowcaseItem & { caption?: string })[];
  if (!items.length) return null;
  return (
    <section className="py-16 md:py-24" style={{ backgroundColor: config.backgroundColor || undefined, color: config.textColor || undefined }}>
      <div className="mx-auto max-w-6xl px-4">
        {config.badge && <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.25em] opacity-60">{config.badge}</p>}
        {config.title && <h2 className="text-3xl font-black tracking-tight md:text-5xl">{config.title}</h2>}
        {config.subtitle && <p className="mt-3 max-w-xl text-lg opacity-70">{config.subtitle}</p>}
      </div>
      <div className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>*:first-child]:ms-auto [&>*:last-child]:me-auto">
        {items.map((item, i) => (
          <ReelCard key={i} item={item} index={i} cta={config.ctaText || "Commander"} navigate={navigate} />
        ))}
      </div>
    </section>
  );
}
