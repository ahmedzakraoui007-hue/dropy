"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, MailCheck, RotateCw } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

export function SignupSuccess({ email, onChangeEmail }: { email: string; onChangeEmail: () => void }) {
  const { t, dir } = useTranslation();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  async function resend() {
    setResending(true);
    await fetch("/api/auth/resend-confirmation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => null);
    setResending(false);
    setResent(true);
  }

  const steps = [t("register.success.step1"), t("register.success.step2"), t("register.success.step3")];

  return (
    <div className="space-y-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2E3192] to-[#00A99D] shadow-lg shadow-[#2E3192]/20">
        <MailCheck className="h-8 w-8 text-white" />
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">{t("register.success.title")}</h1>
        <p className="text-slate-500">
          {t("register.success.desc").split("{email}")[0]}
          <span className="font-semibold text-slate-900 break-all">{email}</span>
          {t("register.success.desc").split("{email}")[1]}
        </p>
      </div>

      <ol className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-5 text-start">
        {steps.map((step, i) => (
          <li key={step} className="flex items-start gap-3 text-sm text-slate-700">
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                i === 0 ? "bg-[#2E3192] text-white" : "bg-white text-slate-500 ring-1 ring-slate-200"
              )}
            >
              {i + 1}
            </span>
            <span className="pt-0.5">{step}</span>
          </li>
        ))}
      </ol>

      <div className="space-y-3">
        <Link
          href="/login"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2E3192] to-[#3a43b5] text-[15px] font-semibold text-white shadow-lg shadow-[#2E3192]/20 transition-all hover:brightness-110"
        >
          {t("register.success.go_login")}
          <ArrowRight className={`h-4 w-4 ${dir === "rtl" ? "rotate-180" : ""}`} />
        </Link>
        <p className="text-sm text-slate-500">{t("register.success.spam_hint")}</p>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-semibold">
          <button
            type="button"
            onClick={resend}
            disabled={resending || resent}
            className="inline-flex items-center gap-1.5 text-[#2E3192] hover:text-[#00A99D] disabled:text-emerald-600 transition-colors"
          >
            {resent ? <Check className="h-4 w-4" /> : <RotateCw className={cn("h-4 w-4", resending && "animate-spin")} />}
            {resent ? t("register.success.resent") : t("register.success.resend")}
          </button>
          <button type="button" onClick={onChangeEmail} className="text-slate-500 hover:text-slate-800 transition-colors">
            {t("register.success.change_email")}
          </button>
        </div>
      </div>
    </div>
  );
}
