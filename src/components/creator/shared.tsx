"use client";

import { Check } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import { formatPrice } from "@/lib/utils";
import { MISSION_STEPS, MISSION_TONES, type MissionState } from "@/lib/creator-missions";

export { BackLink, EmptyState, PageHero, PageSkeleton, Panel, PrimaryLink } from "@/components/cockpit/ui";

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
