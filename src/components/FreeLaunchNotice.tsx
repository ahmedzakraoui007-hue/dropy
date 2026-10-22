"use client";

import Link from "next/link";
import { Gift } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/context/LanguageContext";

export function FreeLaunchNotice({ className = "" }: { className?: string }) {
  const { t, locale } = useTranslation();
  const isAr = locale === "ar";

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className={`rounded-3xl border border-emerald-200 bg-emerald-50 p-6 md:p-8 ${isAr ? "text-right" : "text-left"} ${className}`}
    >
      <div className="flex items-start gap-4">
        <div className="hidden sm:flex w-12 h-12 shrink-0 rounded-2xl bg-emerald-500 text-white items-center justify-center">
          <Gift className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <Badge className="bg-emerald-500 text-white border-0">{t("launch.badge")}</Badge>
          <h2 className="text-xl md:text-2xl font-black text-slate-900">{t("launch.title")}</h2>
          <p className="text-slate-600 leading-relaxed">{t("launch.body")}</p>
          <Link href="/contact" className="inline-block text-sm font-bold text-emerald-700 hover:underline">
            {t("launch.contact")}
          </Link>
        </div>
      </div>
    </div>
  );
}
