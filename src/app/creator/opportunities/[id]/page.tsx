"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, Calendar, CheckCircle2, MapPin, Package, Shield, Sparkles, Wallet } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import { calculateMatchScore, type MatchReason } from "@/lib/matching";
import { FREE_LAUNCH } from "@/lib/launch";
import { BackLink, PageHero, PageSkeleton, Panel, budgetLabel, useCreatorText } from "@/components/creator/shared";

export default function OpportunityDetailsPage() {
  const { t } = useTranslation();
  const tr = (key: string) => t(`creator_app.opportunity.${key}`);
  const { common, typeLabel, rightsLabel, date, deadline } = useCreatorText();
  const { id } = useParams();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [brief, setBrief] = useState<any>(null);
  const [match, setMatch] = useState<{ score: number; reasons: MatchReason[] } | null>(null);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: profile }, { data: row }, { data: application }] = await Promise.all([
        supabase.from("creator_profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("content_briefs").select("*, store:stores(name, logo_url)").eq("id", id).maybeSingle(),
        supabase.from("content_applications").select("id").eq("brief_id", id).eq("creator_id", user.id).maybeSingle(),
      ]);

      if (!row) {
        toast.error(tr("opportunite_introuvable"));
        router.push("/creator/opportunities");
        return;
      }
      setBrief(row);
      setHasApplied(Boolean(application));
      if (profile) setMatch(await calculateMatchScore(profile, row));
      setLoading(false);
    }
    load();
  }, [id, supabase, router]);

  if (loading) return <PageSkeleton />;

  const reasonLabel = (reason: MatchReason) => {
    const value = reason.key === "specialty" ? typeLabel(String(reason.value)) : String(reason.value ?? "");
    return tr(`reason_${reason.key}`).replace("{value}", value);
  };
  const closed = brief.status !== "published" || Boolean(brief.selected_creator_id);
  const left = deadline(brief.deadline);
  const references: string[] = (Array.isArray(brief.reference_images) ? brief.reference_images : []).filter((src: unknown) => typeof src === "string");
  const products = (brief.products || []) as any[];
  const facts = [
    { label: tr("budget"), value: budgetLabel(brief) || tr("negotiable") },
    { label: tr("date_limite"), value: brief.deadline ? date(brief.deadline, true) : "-", hint: left },
    { label: tr("lieu"), value: brief.preferred_city || tr("remote") },
    { label: tr("rights"), value: rightsLabel(brief.rights_type) || tr("rights_standard") },
  ];

  const cta = hasApplied ? (
    <Link href={`/creator/missions/${id}`} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white text-sm font-black text-gray-900">
      {tr("voir_mes_candidatures")}
    </Link>
  ) : closed ? null : (
    <Link href={`/creator/opportunities/${id}/apply`} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-black text-white transition-transform hover:-translate-y-0.5">
      {tr("postuler_maintenant")}
      <ArrowRight className="h-4 w-4 rtl:rotate-180" />
    </Link>
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-20 lg:pb-0">
      <BackLink href="/creator/opportunities" label={tr("retour_aux_opportunites")} />

      <PageHero
        title={brief.title}
        subtitle={[brief.store?.name, typeLabel(brief.content_type), `${tr("published_on")} ${date(brief.created_at)}`].filter(Boolean).join(" · ")}
        action={match && match.score >= 70 ? (
          <span className="inline-flex shrink-0 items-center gap-2 self-start rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
            <Sparkles className="h-5 w-5 text-teal-300" />
            <span>
              <span className="block text-xl font-black leading-none">{match.score}%</span>
              <span className="block text-[11px] font-semibold text-slate-300">{tr("score_de_compatibilite")}</span>
            </span>
          </span>
        ) : undefined}
      >
        <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {facts.map(({ label, value, hint }) => (
            <div key={label} className="min-w-0 rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
              <dt className="text-xs font-semibold text-slate-300">{label}</dt>
              <dd className="mt-1 break-words font-black">{value}</dd>
              {hint && <dd className={`text-xs font-semibold ${hint.urgent ? "text-rose-300" : "text-slate-300"}`}>{hint.label}</dd>}
            </div>
          ))}
        </dl>
      </PageHero>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          {match && match.reasons.length > 0 && (
            <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <h2 className="font-black text-emerald-900">{tr("pourquoi_vous_correspondez")}</h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {match.reasons.map((reason) => (
                  <li key={reason.key} className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    {reasonLabel(reason)}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <Panel title={tr("description_du_projet")}>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">{brief.description}</p>
          </Panel>

          {brief.deliverables && (
            <Panel title={tr("livrables_attendus")}>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">{brief.deliverables}</p>
            </Panel>
          )}

          {products.length > 0 && (
            <Panel title={tr("produits_a_promouvoir")}>
              <div className="grid gap-3 sm:grid-cols-2">
                {products.map((product, index) => (
                  <div key={product.id || index} className="flex min-w-0 items-center gap-3 rounded-xl bg-gray-50 p-3">
                    {product.image || product.image_url ? (
                      <img src={product.image || product.image_url} alt={product.name} className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                    ) : (
                      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gray-200 text-gray-400"><Package className="h-5 w-5" /></span>
                    )}
                    <span className="min-w-0 truncate text-sm font-bold text-gray-900">{product.name}</span>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {references.length > 0 && (
            <Panel title={common("references")}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {references.map((src) => (
                  <a key={src} href={src} target="_blank" rel="noopener noreferrer">
                    <img src={src} alt="" className="aspect-square w-full rounded-xl object-cover" />
                  </a>
                ))}
              </div>
            </Panel>
          )}
        </div>

        <div className="min-w-0 space-y-6">
          <div className="space-y-6 lg:sticky lg:top-24">
            <Panel>
              <p className="text-lg font-black text-gray-900">{hasApplied ? tr("applied") : closed ? tr("closed") : tr("interested")}</p>
              <p className="mt-1 text-sm text-gray-500">{hasApplied ? tr("applied_text") : closed ? tr("closed_text") : tr("apply_text")}</p>
              {cta && <div className="mt-4 hidden lg:block">{cta}</div>}
            </Panel>

            <Panel>
              <p className="flex items-center gap-2 font-black text-gray-900"><Shield className="h-5 w-5 text-emerald-600" />{tr("protection_escrow")}</p>
              <p className="mt-2 text-sm text-gray-500">{tr("escrow_text")}</p>
              <ul className="mt-3 space-y-2 text-sm font-semibold text-gray-700">
                <li className="flex items-center gap-2"><Wallet className="h-4 w-4 text-primary" />{FREE_LAUNCH ? tr("share_free") : tr("share_paid")}</li>
                <li className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" />{FREE_LAUNCH ? tr("fee_free") : tr("fee_paid")}</li>
              </ul>
            </Panel>

            {brief.preferred_city && (
              <p className="flex items-center gap-2 text-sm font-semibold text-gray-500"><MapPin className="h-4 w-4" />{brief.preferred_city}</p>
            )}
          </div>
        </div>
      </div>

      {cta && <div className="fixed inset-x-0 bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-30 border-t border-gray-200 bg-white/95 p-3 backdrop-blur lg:hidden">{cta}</div>}
    </div>
  );
}
