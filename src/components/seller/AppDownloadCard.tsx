"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, Download, X } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import { APK_DOWNLOAD_PATH } from "@/lib/mobile-app";

const STORAGE_KEY = "dropy_app_card_hidden";

export function AppDownloadCard() {
  const { t } = useTranslation();
  const c = (key: string) => t(`seller_app.cockpit.${key}`);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    try {
      setHidden(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      setHidden(false);
    }
  }, []);

  if (hidden) return null;

  const hide = () => {
    setHidden(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
  };

  return (
    <section className="relative overflow-hidden rounded-2xl bg-[#070A1F] p-5 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_100%_0%,rgba(0,169,157,0.35),transparent_60%)]" />
      <button type="button" onClick={hide} aria-label={c("app_dismiss")} className="absolute end-3 top-3 rounded-lg p-1 text-slate-400 transition-colors hover:bg-white/10 hover:text-white">
        <X className="h-4 w-4" />
      </button>
      <div className="relative">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#2E3192] to-[#00A99D]">
          <Bell className="h-5 w-5" />
        </span>
        <h2 className="mt-4 text-lg font-black">{c("app_title")}</h2>
        <p className="mt-1 text-sm text-slate-300">{c("app_desc")}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <a href={APK_DOWNLOAD_PATH} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-black text-[#1B1F6B] transition-transform hover:-translate-y-0.5">
            <Download className="h-4 w-4" />
            {c("app_download")}
          </a>
          <Link href="/application" className="rounded-xl px-3 py-2 text-sm font-bold text-slate-300 transition-colors hover:bg-white/10 hover:text-white">
            {c("app_more")}
          </Link>
        </div>
      </div>
    </section>
  );
}
