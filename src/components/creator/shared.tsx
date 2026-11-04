"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Check, type LucideIcon } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import { formatPrice } from "@/lib/utils";
import { MISSION_STEPS, MISSION_TONES, type MissionState } from "@/lib/creator-missions";

type Budget = { budget?: number | null; budget_min?: number | null; budget_max?: number | null };

export function budgetLabel(brief: Budget) {
  if (brief.budget_min && brief.budget_max && brief.budget_min !== brief.budget_max) return `${formatPrice(brief.budget_min)} - ${formatPrice(brief.budget_max)}`;
  const value = brief.budget_max || brief.budget_min || brief.budget;
  return value ? formatPrice(value) : "";
}

export function useCreatorText() {
  const { t, locale } = useTranslation();
  const dateLocale = locale === "ar" ? "ar-TN" : "fr-FR";
  const common = (key: string) => t(`creator_app.common.${key}`);
  const known = (key: string, fallback: string) => {
    const value = t(key);
    return value === key ? fallback : value;
  };

  return {
    common,
    typeLabel: (type: string | null | undefined) => (type ? known(`creator_app.common.type_${type}`, type) : ""),
    rightsLabel: (rights: string | null | undefined) => (rights ? known(`seller_app.create_brief.rights.${rights}`, rights) : ""),
    date: (value: string, withYear = false) =>
      new Date(value).toLocaleDateString(dateLocale, { day: "numeric", month: "short", ...(withYear ? { year: "numeric" } : {}) }),
    deadline: (value: string | null | undefined) => {
      if (!value) return null;
      const days = Math.ceil((new Date(value).getTime() - Date.now()) / 86400000);
      if (days < 0) return { label: common("expired"), urgent: true };
      if (days === 0) return { label: common("last_day"), urgent: true };
      return { label: common("days_left").replace("{n}", String(days)), urgent: days <= 3 };
    },
  };
}

export function PageHero({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: ReactNode; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-[#0E0A24] p-6 text-white md:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_0%,rgba(139,92,246,0.5),transparent_55%),radial-gradient(ellipse_at_90%_100%,rgba(0,169,157,0.35),transparent_55%)]" />
      <div className="relative">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-black tracking-tight md:text-4xl">{title}</h1>
            {subtitle && <p className="mt-2 text-slate-300">{subtitle}</p>}
          </div>
          {action}
        </div>
        {children}
      </div>
    </section>
  );
}

export function EmptyState({ icon: Icon, title, text, action }: { icon: LucideIcon; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-6 w-6" /></span>
      <p className="mt-4 text-lg font-black text-gray-900">{title}</p>
      {text && <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function PrimaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-black text-white transition-transform hover:-translate-y-0.5">
      {children}
    </Link>
  );
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 transition-colors hover:text-gray-900">
      <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
      {label}
    </Link>
  );
}

export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse space-y-6">
      <div className="h-40 rounded-3xl bg-gray-200" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => <div key={i} className="h-48 rounded-2xl bg-gray-200" />)}
      </div>
    </div>
  );
}

export function Panel({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-gray-200 bg-white p-5 ${className}`}>
      {title && <h2 className="mb-3 text-lg font-black text-gray-900">{title}</h2>}
      {children}
    </section>
  );
}

const CHIP_LABELS: Record<MissionState, string> = {
  pending: "missions.candidature_envoyee_en_attente",
  rejected: "missions.non_retenu",
  payment: "missions.retenu_paiement_en_attente",
  assigned: "missions.retenu_mission_en_cours",
  revision: "missions.retouches_demandees",
  delivered: "missions.livre_en_attente_de_validation",
  completed: "missions.termine",
  cancelled: "common.brief_cancelled",
};

export function MissionChip({ state }: { state: MissionState }) {
  const { t } = useTranslation();
  return <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-bold ${MISSION_TONES[state]}`}>{t(`creator_app.${CHIP_LABELS[state]}`)}</span>;
}

export function MissionSteps({ reached, compact = false }: { reached: number; compact?: boolean }) {
  const { t } = useTranslation();
  if (compact) {
    return (
      <div className="flex gap-1" aria-label={`${reached}/${MISSION_STEPS.length}`}>
        {MISSION_STEPS.map((step, i) => <span key={step} className={`h-1.5 flex-1 rounded-full ${i < reached ? "bg-primary" : "bg-gray-100"}`} />)}
      </div>
    );
  }
  return (
    <ol className="grid grid-cols-6">
      {MISSION_STEPS.map((step, i) => {
        const done = i < reached;
        const current = i === reached - 1;
        return (
          <li key={step} className="relative flex min-w-0 flex-col items-center text-center">
            {i > 0 && <span className={`absolute top-4 h-0.5 w-full -translate-y-1/2 ltr:right-1/2 rtl:left-1/2 ${done ? "bg-primary" : "bg-gray-200"}`} />}
            <span className={`relative flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${done ? "bg-primary text-white" : "bg-gray-100 text-gray-400"} ${current ? "ring-4 ring-primary/20" : ""}`}>
              {done ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <span className={`mt-2 hidden px-0.5 text-xs font-bold leading-tight sm:block ${current ? "text-gray-900" : done ? "text-gray-600" : "text-gray-400"}`}>
              {t(`creator_app.mission.steps.${step}`)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
