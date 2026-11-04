"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Briefcase, Clock, Search, Upload } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import { missionState, needsDelivery, stepsReached, type MissionState } from "@/lib/creator-missions";
import { EmptyState, MissionChip, MissionSteps, PageHero, PageSkeleton, PrimaryLink, useCreatorText } from "@/components/creator/shared";

const TABS: { key: string; label: string; states: MissionState[] | null }[] = [
  { key: "all", label: "tous", states: null },
  { key: "active", label: "missions_en_cours", states: ["payment", "assigned", "revision", "delivered"] },
  { key: "proposals", label: "propositions", states: ["pending"] },
  { key: "done", label: "termine", states: ["completed", "rejected", "cancelled"] },
];

const PRIORITY: Record<MissionState, number> = { revision: 0, assigned: 1, payment: 2, delivered: 3, pending: 4, completed: 5, rejected: 6, cancelled: 7 };

export default function CreatorMissionsPage() {
  const { t } = useTranslation();
  const tr = (key: string) => t(`creator_app.missions.${key}`);
  const { typeLabel, date } = useCreatorText();
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [missions, setMissions] = useState<any[]>([]);
  const [tab, setTab] = useState("all");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: applications }, { data: payments }] = await Promise.all([
        supabase.from("content_applications").select("brief_id, status, proposed_price, delivery_days, created_at").eq("creator_id", user.id),
        supabase.from("content_payments").select("brief_id, stripe_transfer_id").eq("creator_id", user.id),
      ]);
      const ids = (applications || []).map((a) => a.brief_id);
      const filter = ids.length ? `selected_creator_id.eq.${user.id},id.in.(${ids.join(",")})` : `selected_creator_id.eq.${user.id}`;
      const { data: briefs } = await supabase
        .from("content_briefs")
        .select("id, title, status, content_type, deadline, created_at, selected_creator_id, store:stores(name)")
        .or(filter);

      const rows = (briefs || []).map((brief) => {
        const application = (applications || []).find((a) => a.brief_id === brief.id) || null;
        const state = missionState(brief, user.id, application);
        const paid = Boolean((payments || []).find((p) => p.brief_id === brief.id)?.stripe_transfer_id);
        return { ...brief, application, state, reached: stepsReached(state, paid) };
      });
      setMissions(rows.sort((a, b) => PRIORITY[a.state] - PRIORITY[b.state]));
      setLoading(false);
    }
    load();
  }, [supabase]);

  if (loading) return <PageSkeleton />;

  const inTab = (key: string) => {
    const states = TABS.find((item) => item.key === key)?.states;
    return states ? missions.filter((m) => states.includes(m.state)) : missions;
  };
  const shown = inTab(tab);
  const todo = missions.filter((m) => needsDelivery(m.state)).length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHero
        title={tr("mes_missions")}
        subtitle={todo > 0 ? tr(todo > 1 ? "todo_many" : "todo_one").replace("{count}", String(todo)) : tr("suivez_vos_propositions_et_vos")}
        action={missions.length > 0 ? (
          <Link href="/creator/opportunities" className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-slate-900 transition-transform hover:-translate-y-0.5">
            <Search className="h-4 w-4" />
            {tr("trouver_de_nouvelles_opportunites")}
          </Link>
        ) : undefined}
      />

      {missions.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={tr("aucune_mission_pour_le_moment")}
          text={tr("empty_text")}
          action={<PrimaryLink href="/creator/opportunities"><Search className="h-4 w-4" />{tr("voir_les_opportunites")}</PrimaryLink>}
        />
      ) : (
        <>
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
            {TABS.map(({ key, label }) => (
              <button key={key} type="button" onClick={() => setTab(key)} className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-bold transition-colors ${tab === key ? "bg-primary text-white" : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"}`}>
                {tr(label)}
                <span className={`rounded-full px-1.5 text-xs ${tab === key ? "bg-white/20" : "bg-gray-100"}`}>{inTab(key).length}</span>
              </button>
            ))}
          </div>

          {shown.length === 0 ? (
            <EmptyState icon={Clock} title={tr("no_tab")} />
          ) : (
            <div className="space-y-3">
              {shown.map((mission) => (
                <Link key={mission.id} href={`/creator/missions/${mission.id}`} className="group block rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-black text-gray-900 transition-colors group-hover:text-primary">{mission.title}</h2>
                      <p className="truncate text-sm text-gray-500">{[mission.store?.name, typeLabel(mission.content_type)].filter(Boolean).join(" · ")}</p>
                    </div>
                    <div className="shrink-0"><MissionChip state={mission.state} /></div>
                  </div>

                  <div className="mt-4"><MissionSteps reached={mission.reached} compact /></div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                      {mission.application?.proposed_price != null && <span className="font-black text-gray-900">{formatPrice(Number(mission.application.proposed_price))}</span>}
                      {mission.application?.delivery_days && <span>{tr("delivery").replace("{n}", String(mission.application.delivery_days))}</span>}
                      {mission.deadline && <span>{tr("deadline").replace("{date}", date(mission.deadline))}</span>}
                      {mission.application?.created_at && <span>{tr("applied_on").replace("{date}", date(mission.application.created_at))}</span>}
                    </div>
                    {needsDelivery(mission.state) ? (
                      <span className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-black text-white">
                        <Upload className="h-4 w-4" />
                        {tr(mission.state === "revision" ? "fix_cta" : "deliver_cta")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-sm font-bold text-primary">
                        {tr("details")}
                        <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
