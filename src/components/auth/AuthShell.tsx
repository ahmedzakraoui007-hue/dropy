"use client";

import Link from "next/link";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useTranslation } from "@/context/LanguageContext";

interface AuthShellProps {
  children: React.ReactNode;
  wide?: boolean;
}

export function AuthShell({ children, wide = false }: AuthShellProps) {
  const { t, dir } = useTranslation();

  const points = [t("auth.shell.point1"), t("auth.shell.point2"), t("auth.shell.point3")];
  const stats = [
    { value: "100 %", label: t("auth.shell.stat_sellers") },
    { value: "24", label: t("auth.shell.stat_delivery") },
    { value: "0 DT", label: t("auth.shell.stat_stock") },
  ];

  return (
    <div className="flex min-h-screen bg-white" dir={dir}>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" aria-label="Dropy" className="flex items-center">
            <Logo className="h-9 w-auto" />
          </Link>
          <LanguageSwitcher />
        </header>

        <main className="flex flex-1 items-center justify-center px-5 pb-10 sm:px-8">
          <div className={`w-full ${wide ? "max-w-md" : "max-w-sm"}`}>{children}</div>
        </main>

        <footer className="flex items-center justify-between gap-4 px-5 py-5 text-xs text-slate-400 sm:px-8">
          <span>{t("login.footer")}</span>
          <Link href="/" className="inline-flex items-center gap-1 font-medium hover:text-slate-600 transition-colors">
            <ArrowLeft className={`h-3.5 w-3.5 ${dir === "rtl" ? "rotate-180" : ""}`} />
            {t("auth.shell.back_home")}
          </Link>
        </footer>
      </div>

      <aside className="sticky top-0 hidden h-screen w-[44%] max-w-2xl shrink-0 overflow-hidden bg-gradient-to-br from-[#2E3192] via-[#2a3a9c] to-[#00A99D] lg:flex">
        <div className="pointer-events-none absolute -top-32 -end-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -start-24 h-[28rem] w-[28rem] rounded-full bg-[#00A99D]/40 blur-3xl" />

        <div className="relative flex w-full flex-col justify-between p-12 xl:p-16 text-white">
          <div />

          <div className="space-y-8">
            <h2 className="text-4xl font-black leading-tight tracking-tight xl:text-5xl">
              {t("auth.shell.headline")}
            </h2>
            <p className="max-w-md text-lg text-white/75">{t("auth.shell.sub")}</p>
            <ul className="space-y-4">
              {points.map((point) => (
                <li key={point} className="flex items-center gap-3 text-base font-medium">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-[#5EEAD4]" />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <dl className="grid grid-cols-3 gap-6 border-t border-white/15 pt-8">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd className="text-2xl font-black xl:text-3xl">{stat.value}</dd>
                <dd className="mt-1 text-sm text-white/70">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </aside>
    </div>
  );
}
