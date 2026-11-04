"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock, Landmark, Search, ShieldCheck, Wallet } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import { FREE_LAUNCH } from "@/lib/launch";
import { formatPrice } from "@/lib/utils";
import { EmptyState, PageHero, PageSkeleton, Panel, PrimaryLink, useCreatorText } from "@/components/creator/shared";

const STAGES = [
  { key: "verifying", icon: Search },
  { key: "escrow", icon: ShieldCheck },
  { key: "released", icon: Clock },
  { key: "paid_out", icon: CheckCircle2 },
] as const;

const TONES: Record<string, string> = {
  verifying: "bg-amber-50 text-amber-700",
  escrow: "bg-sky-50 text-sky-700",
  released: "bg-violet-50 text-violet-700",
  paid_out: "bg-emerald-50 text-emerald-700",
  refunded: "bg-gray-100 text-gray-600",
};

function paymentState(p: any) {
  if (p.status === "refunded") return "refunded";
  if (p.status === "released") return p.stripe_transfer_id ? "paid_out" : "released";
  return p.escrowed_at ? "escrow" : "verifying";
}

export default function CreatorPaymentsPage() {
  const { t } = useTranslation();
  const tr = (key: string) => t(`creator_app.payments.${key}`);
  const { date } = useCreatorText();
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [methods, setMethods] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data }, { data: profile }] = await Promise.all([
        supabase.from("content_payments").select("*, brief:content_briefs(title)").eq("creator_id", user.id).order("created_at", { ascending: false }),
        supabase.from("profiles").select("bank_rib, d17_number, flouci_number").eq("id", user.id).maybeSingle(),
      ]);
      setPayments(data || []);
      setMethods([profile?.bank_rib && "rib", profile?.d17_number && "d17", profile?.flouci_number && "flouci"].filter(Boolean) as string[]);
      setLoading(false);
    }
    load();
  }, [supabase]);

  if (loading) return <PageSkeleton />;

  const sum = (state: string) => payments.filter((p) => paymentState(p) === state).reduce((acc, p) => acc + Number(p.creator_amount || 0), 0);
  const steps = ["how_1", "how_2", FREE_LAUNCH ? "how_3_free" : "how_3"];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHero title={tr("revenus_et_paiements")} subtitle={tr("suivez_vos_missions_payees_et")}>
        {payments.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {STAGES.map(({ key, icon: Icon }) => (
              <div key={key} className={`rounded-2xl p-4 ring-1 ${key === "paid_out" ? "bg-white text-slate-900 ring-white" : "bg-white/10 ring-white/15"}`}>
                <Icon className={`h-5 w-5 ${key === "paid_out" ? "text-emerald-600" : "text-teal-300"}`} />
                <p className="mt-3 break-words text-xl font-black md:text-2xl">{formatPrice(sum(key))}</p>
                <p className={`mt-0.5 text-xs font-semibold ${key === "paid_out" ? "text-gray-500" : "text-slate-300"}`}>{tr(`stage_${key}`)}</p>
              </div>
            ))}
          </div>
        )}
      </PageHero>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          {payments.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title={tr("aucune_transaction_pour_le_moment")}
              text={tr("empty_text")}
              action={<PrimaryLink href="/creator/opportunities"><Search className="h-4 w-4" />{tr("empty_cta")}</PrimaryLink>}
            />
          ) : (
            <section className="rounded-2xl border border-gray-200 bg-white">
              <h2 className="border-b border-gray-100 p-5 text-lg font-black text-gray-900">{tr("historique_des_transactions")}</h2>
              <ul className="divide-y divide-gray-100">
                {payments.map((payment) => {
                  const state = paymentState(payment);
                  return (
                    <li key={payment.id}>
                      <Link href={`/creator/missions/${payment.brief_id}`} className="flex items-center gap-3 p-4 transition-colors hover:bg-gray-50">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-bold text-gray-900">{payment.brief?.title}</span>
                          <span className="block text-xs text-gray-500">{date(payment.created_at, true)}</span>
                        </span>
                        <span className="shrink-0 text-end">
                          <span className="block font-black text-gray-900">{formatPrice(Number(payment.creator_amount || 0))}</span>
                          <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${TONES[state]}`}>{tr(`state_${state}`)}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>

        <div className="min-w-0 space-y-6">
          {methods.length > 0 ? (
            <Panel title={tr("moyens_de_versement")}>
              <div className="flex flex-wrap gap-2">
                {methods.map((method) => (
                  <span key={method} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    {tr(`method_${method}`)}
                  </span>
                ))}
              </div>
              <Link href="/creator/settings" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary">
                {tr("gerer_mes_coordonnees")}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </Panel>
          ) : (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="flex items-center gap-2 font-black text-amber-900"><AlertTriangle className="h-5 w-5 shrink-0" />{tr("payout_missing_title")}</p>
              <p className="mt-2 text-sm text-amber-800">{tr("payout_missing_text")}</p>
              <Link href="/creator/settings" className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-amber-900 px-4 text-sm font-black text-white">
                <Landmark className="h-4 w-4" />
                {tr("coordonnees_de_versement")}
              </Link>
            </section>
          )}

          <Panel title={tr("quand_suis_je_paye")}>
            <ol className="space-y-3">
              {steps.map((key, i) => (
                <li key={key} className="flex gap-3 text-sm text-gray-600">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">{i + 1}</span>
                  {tr(key)}
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>
    </div>
  );
}
