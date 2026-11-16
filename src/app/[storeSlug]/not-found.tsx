"use client";

import Link from "next/link";
import { useTranslation } from "@/context/LanguageContext";

export default function StoreNotFound() {
  const { t, dir } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center" dir={dir}>
      <p className="text-6xl font-black text-slate-200">404</p>
      <h1 className="mt-4 text-2xl font-black text-slate-900 md:text-3xl">{t("pages.not_found.store_title")}</h1>
      <p className="mt-3 max-w-md font-medium text-slate-500">{t("pages.not_found.store_desc")}</p>
      <Link href="/" className="mt-8 inline-flex h-12 items-center rounded-xl bg-slate-900 px-8 font-bold text-white hover:bg-slate-800">
        {t("pages.not_found.store_back")}
      </Link>
    </div>
  );
}
