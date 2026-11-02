"use client";

import { useState } from "react";
import { MoveHorizontal } from "lucide-react";

export function BeforeAfter({ config }: { config: any }) {
  const [position, setPosition] = useState(50);
  if (!config.before || !config.after) return null;
  return (
    <section className="px-4 py-16 md:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
        <div>
          {config.badge && <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.25em] opacity-60">{config.badge}</p>}
          {config.title && <h2 className="text-3xl font-black tracking-tight md:text-5xl">{config.title}</h2>}
          {config.text && <p className="mt-4 text-lg leading-relaxed opacity-75">{config.text}</p>}
        </div>
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] shadow-2xl select-none" dir="ltr">
          <img src={config.after} alt={config.afterLabel || ""} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
          <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
            <img src={config.before} alt={config.beforeLabel || ""} className="h-full w-full object-cover" draggable={false} />
          </div>
          <span className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white backdrop-blur">{config.beforeLabel || "Avant"}</span>
          <span className="absolute right-4 top-4 rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-black backdrop-blur">{config.afterLabel || "Après"}</span>
          <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_12px_rgba(0,0,0,0.4)]" style={{ left: `${position}%` }}>
            <span className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-black shadow-xl">
              <MoveHorizontal className="h-5 w-5" />
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={position}
            onChange={(e) => setPosition(Number(e.target.value))}
            aria-label={`${config.beforeLabel || "Avant"} / ${config.afterLabel || "Après"}`}
            className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
          />
        </div>
      </div>
    </section>
  );
}
