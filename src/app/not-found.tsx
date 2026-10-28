"use client";

import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/context/LanguageContext";

export default function NotFound() {
  const { t, dir } = useTranslation();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6 text-center" dir={dir}>
      <Link href="/" className="mb-10">
        <Logo className="h-12 w-auto" />
      </Link>
      <p className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#2E3192] to-[#00A99D]">404</p>
      <h1 className="mt-4 text-2xl md:text-3xl font-black text-slate-900">{t("pages.not_found.title")}</h1>
      <p className="mt-3 max-w-md text-slate-500 font-medium">{t("pages.not_found.desc")}</p>
      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Link href="/">
          <Button className="h-12 px-8 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white">{t("pages.not_found.home")}</Button>
        </Link>
        <Link href="/contact">
          <Button variant="outline" className="h-12 px-8 rounded-xl font-bold">{t("pages.not_found.contact")}</Button>
        </Link>
      </div>
    </div>
  );
}
