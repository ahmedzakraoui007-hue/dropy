"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Languages, Sparkles } from "lucide-react";
import { premiumThemes } from "@/lib/themes/premium";
import { useTranslation } from "@/context/LanguageContext";
import { MiniStore, PhoneFrame } from "./MiniStore";

export function PhoneStage() {
  const { t, locale } = useTranslation();
  const lang = locale === "ar" ? "ar" : "fr";
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const stage = useRef<HTMLDivElement | null>(null);
  const count = premiumThemes.length;

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), 4200);
    return () => clearInterval(timer);
  }, [paused, count]);

  const at = (offset: number) => premiumThemes[(index + offset + count) % count];
  const current = at(0);

  return (
    <div className="relative">
      <div
        ref={stage}
        className="relative mx-auto h-[460px] w-full max-w-[520px] sm:h-[600px]"
        style={{ perspective: "1600px", ["--rx" as string]: "4deg", ["--ry" as string]: "-14deg" }}
        onPointerMove={(e) => {
          const node = stage.current;
          if (!node || e.pointerType !== "mouse") return;
          const rect = node.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width - 0.5;
          const y = (e.clientY - rect.top) / rect.height - 0.5;
          node.style.setProperty("--ry", `${(x * 26 - 6).toFixed(2)}deg`);
          node.style.setProperty("--rx", `${(-y * 14 + 2).toFixed(2)}deg`);
        }}
        onPointerLeave={() => {
          stage.current?.style.setProperty("--ry", "-14deg");
          stage.current?.style.setProperty("--rx", "4deg");
        }}
        dir="ltr"
      >
        <PhoneFrame className="absolute left-[4%] top-[16%] hidden w-[34%] opacity-60 blur-[1px] sm:block" style={{ transform: "rotateY(28deg) rotateZ(-6deg) translateZ(-200px)" }}>
          <MiniStore theme={at(-1)} lang={lang} />
        </PhoneFrame>
        <PhoneFrame className="absolute right-[4%] top-[16%] hidden w-[34%] opacity-60 blur-[1px] sm:block" style={{ transform: "rotateY(-28deg) rotateZ(6deg) translateZ(-200px)" }}>
          <MiniStore theme={at(1)} lang={lang} />
        </PhoneFrame>

        <div className="absolute left-1/2 top-2 w-[58%] max-w-[270px] -translate-x-1/2 sm:w-[52%]">
          <div className="dropy-float">
          <PhoneFrame
            className="w-full transition-transform duration-300 ease-out"
            style={{ transform: "rotateX(var(--rx)) rotateY(var(--ry))", transformStyle: "preserve-3d" }}
          >
            <div key={current.id} className="dropy-screen-in h-full">
              <MiniStore theme={current} lang={lang} scroll />
            </div>
          </PhoneFrame>
          </div>
        </div>

        <div className="dropy-float-slow absolute left-0 top-[58%] flex items-center gap-2.5 rounded-2xl border border-white/15 bg-white/10 px-3.5 py-2.5 text-white shadow-2xl backdrop-blur-xl sm:left-[-4%]">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-400/90 text-emerald-950"><Bell className="h-4 w-4" /></span>
          <span className="text-start">
            <span className="block text-[11px] font-bold opacity-70">{t("home.hero.float_order_label")}</span>
            <span className="block text-sm font-black">{t("home.hero.float_order")}</span>
          </span>
        </div>
        <div className="dropy-float absolute right-0 top-[8%] flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-sm font-bold text-white shadow-2xl backdrop-blur-xl sm:right-[-2%]" style={{ animationDelay: "-2s" }}>
          <Languages className="h-4 w-4 text-teal-300" />
          Français · العربية
        </div>
        <div className="dropy-float-slow absolute bottom-[10%] right-[2%] flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-teal-400 px-4 py-2 text-sm font-black text-white shadow-2xl" style={{ animationDelay: "-3s" }}>
          <Sparkles className="h-4 w-4" />
          {t("home.hero.float_3d")}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap justify-center gap-2">
        {premiumThemes.map((theme, i) => (
          <button
            key={theme.id}
            type="button"
            onClick={() => {
              setIndex(i);
              setPaused(true);
            }}
            className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${i === index ? "border-white bg-white text-slate-900" : "border-white/20 text-white/70 hover:border-white/50 hover:text-white"}`}
          >
            <span className="me-1.5 inline-block h-2 w-2 rounded-full align-middle" style={{ background: theme.colors.primary }} />
            {t(`store_builder.themes.${theme.id}.name`)}
          </button>
        ))}
      </div>
    </div>
  );
}
