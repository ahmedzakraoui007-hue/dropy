"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, Clock, Loader2, MessageSquare, Send, Shield, ShieldAlert, XCircle, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import { missionState, needsDelivery, stepsReached, type MissionState } from "@/lib/creator-missions";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DisputeDialog } from "@/components/content/DisputeDialog";
import { FileUpload } from "@/components/ui/file-upload";
import { BackLink, MissionChip, MissionSteps, PageSkeleton, Panel, useCreatorText } from "@/components/creator/shared";

function Notice({ icon: Icon, tone, title, text, children }: { icon: LucideIcon; tone: string; title: string; text: string; children?: React.ReactNode }) {
  return (
    <section className={`rounded-2xl border p-6 text-center ${tone}`}>
      <Icon className="mx-auto h-10 w-10" />
      <h2 className="mt-3 text-lg font-black text-gray-900">{title}</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-gray-600">{text}</p>
      {children}
    </section>
  );
}

export default function MissionDetailsPage() {
  const { t } = useTranslation();
  const tr = (key: string) => t(`creator_app.mission.${key}`);
  const { common, typeLabel, date, deadline } = useCreatorText();
  const { id } = useParams();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [brief, setBrief] = useState<any>(null);
  const [application, setApplication] = useState<any>(null);
  const [payment, setPayment] = useState<any>(null);
  const [lastDelivery, setLastDelivery] = useState<any>(null);
  const [delivering, setDelivering] = useState(false);
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [disputeOpen, setDisputeOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: row }, { data: myApplication }, { data: paymentRow }, { data: delivery }] = await Promise.all([
        supabase.from("content_briefs").select("*, store:stores(name, logo_url)").eq("id", id).maybeSingle(),
        supabase.from("content_applications").select("*").eq("brief_id", id).eq("creator_id", user.id).maybeSingle(),
        supabase.from("content_payments").select("status, escrowed_at, released_at, stripe_transfer_id, creator_amount").eq("brief_id", id).maybeSingle(),
        supabase.from("content_deliveries").select("status, revision_count, delivered_at").eq("brief_id", id).order("delivered_at", { ascending: false }).limit(1).maybeSingle(),
      ]);

      if (!row) {
        toast.error(tr("mission_introuvable"));
        router.push("/creator/missions");
        return;
      }
      if (!myApplication && row.selected_creator_id !== user.id) {
        router.replace(`/creator/opportunities/${id}`);
        return;
      }
      setUserId(user.id);
      setBrief(row);
      setApplication(myApplication);
      setPayment(paymentRow);
      setLastDelivery(delivery);
      setLoading(false);
    }
    load();
  }, [id, supabase, router]);

  const deliver = async () => {
    if (files.length === 0) {
      toast.error(tr("veuillez_envoyer_au_moins_un"));
      return;
    }

    setDelivering(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(common("not_signed_in"));

      const uploaded = [];
      for (const file of files) {
        const path = `${id}/${user.id}/${Math.random().toString(36).substring(2)}.${file.name.split(".").pop()}`;
        const { error } = await supabase.storage.from("content-deliverables").upload(path, file);
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from("content-deliverables").getPublicUrl(path);
        uploaded.push({ url: publicUrl, filename: file.name, type: file.type, size: file.size, path });
      }

      const response = await fetch(`/api/content/briefs/${id}/deliver`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: uploaded, message: note }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || tr("deliver_error"));

      toast.success(tr("projet_livre_en_attente_de"));
      setBrief({ ...brief, status: "delivered" });
      setLastDelivery({ status: "submitted", revision_count: lastDelivery?.revision_count || 0 });
      setFiles([]);
      setNote("");
    } catch (error: any) {
      toast.error(error.message || tr("deliver_error"));
    } finally {
      setDelivering(false);
    }
  };

  if (loading) return <PageSkeleton />;

  const state: MissionState = missionState(brief, userId, application);
  const paid = Boolean(payment?.stripe_transfer_id);
  const hired = brief.selected_creator_id === userId;
  const left = deadline(brief.deadline);
  const price = application?.proposed_price ?? (hired ? brief.budget : null);
  const products = (brief.products || []) as any[];
  const references: string[] = (Array.isArray(brief.reference_images) ? brief.reference_images : []).filter((src: unknown) => typeof src === "string");
  const canDispute = !brief.is_disputed && (brief.status === "assigned" || brief.status === "delivered");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <BackLink href="/creator/missions" label={tr("retour_aux_missions")} />

      <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="break-words text-2xl font-black tracking-tight text-gray-900 md:text-3xl">{brief.title}</h1>
            <p className="mt-1 text-sm text-gray-500">{[tr("by_store").replace("{store}", brief.store?.name || ""), typeLabel(brief.content_type)].filter(Boolean).join(" · ")}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <MissionChip state={state} />
            {brief.is_disputed && <span className="rounded-full bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white">{tr("en_litige")}</span>}
          </div>
        </div>
        {state !== "rejected" && state !== "cancelled" && (
          <div className="mt-6"><MissionSteps reached={stepsReached(state, paid)} /></div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          {hired && needsDelivery(state) && !brief.is_disputed && (
            <section className="rounded-2xl border-2 border-primary/30 bg-white p-5">
              <h2 className="text-lg font-black text-gray-900">{tr(state === "revision" ? "deliver_revision" : "deliver_work")}</h2>
              <p className="mt-1 text-sm text-gray-500">{lastDelivery?.status === "revision_requested" ? tr("revision_help") : tr("deliver_help")}</p>
              <div className="mt-5 space-y-5">
                <div className="space-y-2">
                  <Label>{tr("fichiers_finaux")}</Label>
                  <FileUpload onFilesSelected={setFiles} maxFiles={10} maxSize={500} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="note">{tr("message_pour_le_vendeur")}</Label>
                  <Textarea id="note" placeholder={tr("incluez_des_notes_sur_la")} value={note} onChange={(e) => setNote(e.target.value)} />
                </div>
                <button type="button" onClick={deliver} disabled={delivering || files.length === 0} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-black text-white transition-transform hover:-translate-y-0.5 disabled:opacity-50">
                  {delivering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 rtl:rotate-180" />}
                  {tr(delivering ? "sending" : "deliver")}
                </button>
              </div>
            </section>
          )}

          {state === "payment" && <Notice icon={Clock} tone="border-amber-200 bg-amber-50 text-amber-500" title={tr("vous_avez_ete_retenu")} text={tr(payment ? "payment_sent" : "payment_wait")} />}
          {state === "delivered" && <Notice icon={CheckCircle2} tone="border-sky-200 bg-sky-50 text-sky-500" title={tr("travail_soumis")} text={tr("votre_travail_a_ete_soumis")} />}
          {state === "rejected" && <Notice icon={XCircle} tone="border-gray-200 bg-white text-gray-400" title={tr("rejected_title")} text={tr("rejected_text")} />}
          {state === "completed" && (
            <Notice icon={CheckCircle2} tone="border-emerald-200 bg-emerald-50 text-emerald-500" title={tr("projet_termine")} text={tr(paid ? "done_paid" : "done_pending")}>
              <Link href="/creator/payments" className="mt-4 inline-flex h-10 items-center rounded-xl bg-white px-4 text-sm font-black text-gray-900 ring-1 ring-gray-200">{tr("voir_mes_revenus")}</Link>
            </Notice>
          )}

          <Panel title={tr("details_du_brief")}>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">{brief.description}</p>
            {brief.deliverables && (
              <>
                <h3 className="mb-2 mt-5 font-black text-gray-900">{tr("livrables_specifiques")}</h3>
                <p className="whitespace-pre-wrap rounded-xl bg-gray-50 p-4 text-sm leading-relaxed text-gray-600">{brief.deliverables}</p>
              </>
            )}
          </Panel>

          {products.length > 0 && (
            <Panel title={tr("produits")}>
              <div className="grid gap-3 sm:grid-cols-2">
                {products.map((product, index) => (
                  <div key={product.id || index} className="flex min-w-0 items-center gap-3 rounded-xl bg-gray-50 p-3">
                    {(product.image || product.image_url) && <img src={product.image || product.image_url} alt={product.name} className="h-12 w-12 shrink-0 rounded-lg object-cover" />}
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
          <Panel>
            <dl className="space-y-3 text-sm">
              {price != null && (
                <div className="flex items-center justify-between gap-3"><dt className="text-gray-500">{tr("mon_prix")}</dt><dd className="text-lg font-black text-gray-900">{formatPrice(Number(price))}</dd></div>
              )}
              {payment?.creator_amount != null && Number(payment.creator_amount) !== Number(price) && (
                <div className="flex items-center justify-between gap-3"><dt className="text-gray-500">{tr("net")}</dt><dd className="font-black text-primary">{formatPrice(Number(payment.creator_amount))}</dd></div>
              )}
              {brief.deadline && (
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-500">{tr("date_limite")}</dt>
                  <dd className="text-end font-bold text-gray-900">
                    {date(brief.deadline, true)}
                    {left && needsDelivery(state) && <span className={`block text-xs ${left.urgent ? "text-rose-600" : "text-gray-500"}`}>{left.label}</span>}
                  </dd>
                </div>
              )}
              {application?.delivery_days && (
                <div className="flex justify-between gap-3"><dt className="text-gray-500">{tr("livraison")}</dt><dd className="font-bold text-gray-900">{common("days").replace("{n}", String(application.delivery_days))}</dd></div>
              )}
            </dl>
            {hired && payment?.escrowed_at && (
              <p className="mt-4 flex gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
                <Shield className="h-4 w-4 shrink-0" />
                {tr("les_fonds_sont_conserves_par")}
              </p>
            )}
            {state === "pending" && <p className="mt-4 rounded-xl bg-gray-50 p-3 text-xs font-semibold text-gray-600">{tr("le_vendeur_examine_encore_les")}</p>}
          </Panel>

          {state !== "rejected" && (
            <Panel title={tr("chat_de_mission")}>
              <p className="text-sm text-gray-500">{tr("discutez_des_details_du_projet")}</p>
              <Link href={`/creator/messages?briefId=${id}`} className="mt-3 flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 text-sm font-black text-gray-900 transition-colors hover:bg-gray-50">
                <MessageSquare className="h-4 w-4" />
                {tr("ouvrir_le_chat")}
              </Link>
            </Panel>
          )}

          {canDispute && hired && (
            <button type="button" onClick={() => setDisputeOpen(true)} className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 transition-colors hover:text-rose-600">
              <ShieldAlert className="h-4 w-4" />
              {tr("ouvrir_un_litige")}
            </button>
          )}
        </div>
      </div>

      <DisputeDialog isOpen={disputeOpen} onClose={() => setDisputeOpen(false)} briefId={id as string} onSuccess={() => setBrief({ ...brief, is_disputed: true })} />
    </div>
  );
}
