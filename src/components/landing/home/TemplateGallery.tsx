"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { premiumThemes } from "@/lib/themes/premium";
import { firstFont } from "@/lib/theme-look";
import { tiltProps } from "@/components/storefront/sections/tilt";
import { useTranslation } from "@/context/LanguageContext";
import { MiniStore, PhoneFrame } from "./MiniStore";

export function TemplateGallery() {
  const { t, locale } = useTranslation();
  const lang = locale === "ar" ? "ar" : "fr";

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {premiumThemes.map((theme) => (
        <div
          key={theme.id}
          {...tiltProps(true)}
          className="group relative overflow-hidden rounded-[2rem] border border-slate-200 p-6 pb-0"
          style={{ ...tiltProps(true).style, background: `linear-gradient(160deg, ${theme.colors.surface}, ${theme.colors.background})` }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-3xl font-bold leading-none" style={{ fontFamily: firstFont(theme.typography.headingFont), color: theme.colors.text }}>
                {t(`store_builder.themes.${theme.id}.name`)}
              </p>
              <p className="mt-2 text-sm font-semibold" style={{ color: theme.colors.textMuted }}>{t(`store_builder.themes.${theme.id}.niche`)}</p>
            </div>
            <div className="flex -space-x-1.5 rtl:space-x-reverse">
              {[theme.colors.primary, theme.colors.secondary, theme.colors.text].map((color, i) => (
                <span key={i} className="h-6 w-6 rounded-full border-2 border-white" style={{ background: color }} />
              ))}
            </div>
          </div>
          <p className="mt-4 min-h-[3rem] text-sm leading-relaxed" style={{ color: theme.colors.textMuted }}>{t(`home.templates.concepts.${theme.id}`)}</p>
          <PhoneFrame className="mx-auto mt-6 w-[62%] translate-y-10 transition-transform duration-500 group-hover:translate-y-4">
            <MiniStore theme={theme} lang={lang} />
          </PhoneFrame>
          <Link
            href={`/creation-site-ecommerce-tunisie?style=${theme.id}#demande`}
            className="absolute inset-x-6 bottom-6 z-10 flex translate-y-3 items-center justify-center gap-2 rounded-full bg-slate-900 py-3 text-sm font-black text-white opacity-0 shadow-2xl transition-all duration-300 focus:translate-y-0 focus:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 max-lg:translate-y-0 max-lg:opacity-100"
          >
            {t("home.templates.cta")}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </div>
      ))}
    </div>
  );
}
