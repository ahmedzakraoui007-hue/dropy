"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, Download, Eye, Loader2, Lock, MessageSquare, Package, Shield, ShieldAlert, Star, Users, Video } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import { fetchProfileCards } from "@/lib/profile-cards";
import { normalizeSpecialty } from "@/lib/matching";
import { isVideoUrl } from "@/lib/portfolio";
import { formatPrice } from "@/lib/utils";
import { SELLER_BRIEF_TONES, SELLER_STEPS, sellerBriefState, sellerStepsReached } from "@/lib/seller-briefs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DisputeDialog } from "@/components/content/DisputeDialog";
import { CreatorPortfolioDialog } from "@/components/content/CreatorPortfolioDialog";
import { AddReviewForm } from "@/components/reviews/AddReviewForm";
import { ReviewList } from "@/components/reviews/ReviewList";
import { BackLink, PageSkeleton, Panel, Steps } from "@/components/cockpit/ui";

function Media({ url, type, className }: { url: string; type?: string; className: string }) {
  const video = type ? type.startsWith("video") : isVideoUrl(url);
  return video ? <video src={url} className={className} controls preload="metadata" playsInline /> : <img src={url} alt="" className={className} />;
}

export default function BriefDetailsPage() {
  const { t, locale } = useTranslation();
  const tr = (key: string) => t(`seller_app.brief_detail.${key}`);
  const u = (key: string) => t(`seller_app.ugc.${key}`);
  const { id } = useParams();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [brief, setBrief] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [payment, setPayment] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState("");
  const [payMethod, setPayMethod] = useState("bank_transfer");
  const [payReference, setPayReference] = useState("");
  const [revisionNotes, setRevisionNotes] = useState("");
  const [showRevision, setShowRevision] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    async function load() {
      const { data: row } = await supabase.from("content_briefs").select("*").eq("id", id).maybeSingle();
      if (!row) {
        toast.error(tr("not_found"));
        router.push("/seller/content/briefs");
        return;
      }

      const [{ data: apps }, { data: deliveryRows }, { data: reviewRows }, { data: paymentRow }] = await Promise.all([
        supabase.from("content_applications").select("*").eq("brief_id", id).order("created_at", { ascending: true }),
        supabase.from("content_deliveries").select("*").eq("brief_id", id).order("delivered_at", { ascending: false }),
        supabase.from("creator_reviews").select("*").eq("brief_id", id),
        supabase.from("content_payments").select("*").eq("brief_id", id).maybeSingle(),
      ]);

      const creatorIds = (apps || []).map((a) => a.creator_id);
      const [cards, { data: profiles }] = await Promise.all([
        fetchProfileCards(supabase, creatorIds),
        creatorIds.length
          ? supabase.from("creator_profiles").select("user_id, display_name, rating, total_reviews, total_projects, specialties, specialty, is_verified").in("user_id", creatorIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);
      const byUser = new Map((profiles || []).map((p: any) => [p.user_id, p]));

      setBrief(row);
      setApplications((apps || []).map((a) => {
        const card = cards.get(a.creator_id);
        const cp: any = byUser.get(a.creator_id) || {};
        const raw = cp.specialties?.length ? cp.specialties : cp.specialty ? [cp.specialty] : [];
        return {
          ...a,
          creator: {
            name: cp.display_name || card?.full_name || tr("creator"),
            avatar: card?.avatar_url || null,
            rating: cp.total_reviews > 0 ? Number(cp.rating) : null,
            reviews: cp.total_reviews || 0,
            projects: cp.total_projects || 0,
            verified: cp.is_verified === true,
            types: Array.from(new Set(raw.map((s: string) => normalizeSpecialty(String(s))))) as string[],
          },
        };
      }));
      setDeliveries(deliveryRows || []);
      setReviews(reviewRows || []);
      setPayment(paymentRow);
      setLoading(false);
    }
    load();
  }, [id, reloadKey, supabase, router]);

  useEffect(() => {
    if (brief?.status === "published" && brief?.selected_creator_id && !payment && !paymentDetails) {
      fetch("/api/content/escrow-details")
        .then((r) => r.json())
        .then((d) => setPaymentDetails(d.paymentDetails || ""))
        .catch(() => null);
    }
  }, [brief, payment, paymentDetails]);

  const callApi = async (path: string, init: RequestInit, success: string) => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/content/briefs/${id}/${path}`, { headers: { "Content-Type": "application/json" }, ...init });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || tr("error"));
      toast.success(success);
      setReloadKey((k) => k + 1);
      return data;
    } catch (error: any) {
      toast.error(error.message || tr("error"));
      return null;
    } finally {
      setProcessing(false);
    }
  };

  const accept = async (application: any) => {
    const data = await callApi("accept-creator", { method: "POST", body: JSON.stringify({ applicationId: application.id }) }, tr("accepted_toast"));
    if (data) setPaymentDetails(data.paymentDetails || "");
  };
  const unselect = () => callApi("accept-creator", { method: "DELETE" }, tr("unselected_toast"));
  const declarePayment = () => callApi("payment", { method: "POST", body: JSON.stringify({ method: payMethod, reference: payReference }) }, tr("payment_toast"));
  const requestRevision = async () => {
    const data = await callApi("request-revision", { method: "POST", body: JSON.stringify({ notes: revisionNotes }) }, tr("revision_toast"));
    if (data) {
      setRevisionNotes("");
      setShowRevision(false);
    }
  };
  const release = () => callApi("release-funds", { method: "POST" }, tr("released_toast"));

  if (loading) return <PageSkeleton />;

  const state = sellerBriefState(brief, Boolean(payment));
  const chosen = applications.find((a) => a.creator_id === brief.selected_creator_id);
  const amount = Number(payment?.amount ?? chosen?.proposed_price ?? brief.budget ?? 0);
  const latest = deliveries[0];
  const dateLocale = locale === "ar" ? "ar-TN" : "fr-FR";
  const date = (value: string) => new Date(value).toLocaleDateString(dateLocale, { day: "numeric", month: "short", year: "numeric" });
  const typeLabel = (value: string) => t(`seller_app.create_brief.types.${value}`);
  const budget = brief.budget_min && brief.budget_max && brief.budget_min !== brief.budget_max
    ? `${formatPrice(brief.budget_min)} - ${formatPrice(brief.budget_max)}`
    : formatPrice(Number(brief.budget_max || brief.budget_min || brief.budget || 0));
  const canDispute = !brief.is_disputed && (brief.status === "assigned" || brief.status === "delivered");
  const sorted = [...applications].sort((a, b) => Number(b.status === "accepted") - Number(a.status === "accepted"));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <BackLink href="/seller/content/briefs" label={tr("back")} />

      <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="break-words text-2xl font-black tracking-tight text-gray-900 md:text-3xl">{brief.title}</h1>
            <p className="mt-1 text-sm text-gray-500">{[brief.content_type && typeLabel(brief.content_type), budget, brief.deadline && `${tr("deadline")} : ${date(brief.deadline)}`].filter(Boolean).join(" · ")}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${SELLER_BRIEF_TONES[state]}`}>{u(`state_${state}`)}</span>
            {brief.is_disputed && <span className="rounded-full bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white">{tr("disputed")}</span>}
          </div>
        </div>
        {state !== "cancelled" && state !== "draft" && (
          <div className="mt-6"><Steps labels={SELLER_STEPS.map((step) => u(`step_${step}`))} reached={sellerStepsReached(state)} /></div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          {state === "pay" && (
            <section className="rounded-2xl border-2 border-amber-300 bg-white p-5">
              <h2 className="flex items-center gap-2 text-lg font-black text-gray-900"><Lock className="h-5 w-5 text-amber-600" />{tr("payment_send")}</h2>
              <p className="mt-1 text-sm text-gray-500">{tr("payment_send_text").replace("{amount}", formatPrice(amount))}</p>
              <div className="mt-4 whitespace-pre-wrap rounded-xl bg-amber-50 p-4 text-sm text-amber-950">{paymentDetails || tr("payment_details_fallback")}</div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pay-method">{tr("payment_method")}</Label>
                  <select id="pay-method" value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="bank_transfer">{tr("bank_transfer")}</option>
                    <option value="d17">D17</option>
                    <option value="flouci">Flouci</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pay-ref">{tr("payment_ref")}</Label>
                  <Input id="pay-ref" value={payReference} onChange={(e) => setPayReference(e.target.value)} placeholder={tr("payment_ref_ph")} />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={declarePayment} disabled={processing || payReference.trim().length < 3} className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-black text-white disabled:opacity-50">
                  {processing && <Loader2 className="h-4 w-4 animate-spin" />}
                  {u("paid_cta")}
                </button>
                <button type="button" onClick={unselect} disabled={processing} className="h-11 rounded-xl px-4 text-sm font-bold text-gray-500 hover:bg-gray-50">{tr("change_creator")}</button>
              </div>
            </section>
          )}

          {state === "checking" && (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <h2 className="flex items-center gap-2 font-black text-amber-900"><Lock className="h-5 w-5" />{tr("payment_checking")}</h2>
              <p className="mt-1 text-sm text-amber-800">{tr("payment_checking_text").replace("{amount}", formatPrice(amount)).replace("{ref}", String(payment?.transaction_ref || "-"))}</p>
            </section>
          )}

          {state === "review" && (
            <section className="rounded-2xl border-2 border-emerald-300 bg-white p-5">
              <h2 className="flex items-center gap-2 text-lg font-black text-gray-900"><Package className="h-5 w-5 text-emerald-600" />{tr("review_deliverables")}</h2>
              <p className="mt-1 text-sm text-gray-500">{tr("review_help")}</p>
              {latest && (
                <>
                  {latest.message && <p className="mt-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-700">{latest.message}</p>}
                  <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                    {(latest.files || []).map((file: any, i: number) => (
                      <div key={i} className="group relative aspect-square overflow-hidden rounded-xl bg-gray-100">
                        <Media url={file.url} type={file.type} className="h-full w-full object-cover" />
                        <div className="absolute end-2 top-2 flex gap-1.5">
                          <a href={file.url} target="_blank" rel="noopener noreferrer" aria-label={u("open")} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-800"><Eye className="h-4 w-4" /></a>
                          <a href={file.url} download={file.filename || true} aria-label={u("download")} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-800"><Download className="h-4 w-4" /></a>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {showRevision && (
                <div className="mt-4 space-y-3 rounded-xl border border-gray-200 p-4">
                  <Label htmlFor="revision">{tr("revision_label")}</Label>
                  <Textarea id="revision" value={revisionNotes} onChange={(e) => setRevisionNotes(e.target.value)} placeholder={tr("revision_ph")} />
                  <button type="button" onClick={requestRevision} disabled={processing || revisionNotes.trim().length < 5} className="inline-flex h-10 items-center rounded-xl bg-gray-900 px-4 text-sm font-black text-white disabled:opacity-50">{tr("send_request")}</button>
                </div>
              )}
              <div className="mt-5 flex flex-wrap gap-2">
                <button type="button" onClick={release} disabled={processing || brief.is_disputed} className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-black text-white disabled:opacity-50">
                  {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  {tr(processing ? "validating" : "validate")}
                </button>
                {!showRevision && <button type="button" onClick={() => setShowRevision(true)} disabled={processing || brief.is_disputed} className="h-11 rounded-xl border border-gray-200 px-4 text-sm font-bold text-gray-700 hover:bg-gray-50">{tr("ask_revision")}</button>}
              </div>
            </section>
          )}

          {(state === "working" || state === "revision") && (
            <section className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
              <h2 className="font-black text-indigo-950">{u(state === "revision" ? "revision_title" : "working_title")}</h2>
              <p className="mt-1 text-sm text-indigo-900">{u(state === "revision" ? "revision_text" : "working_text").replace("{name}", chosen?.creator.name || tr("creator"))}</p>
            </section>
          )}

          {state === "done" && (
            <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <h2 className="flex items-center gap-2 font-black text-emerald-900"><CheckCircle2 className="h-5 w-5" />{tr("done_title")}</h2>
              <p className="mt-1 text-sm text-emerald-800">{tr("done_help")}</p>
              <Link href="/seller/content/library" className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-black text-gray-900 ring-1 ring-emerald-200"><Package className="h-4 w-4" />{tr("see_library")}</Link>
            </section>
          )}

          {state === "done" && (
            <Panel title={tr("review_title")}>
              {reviews.length > 0 ? (
                <ReviewList reviews={reviews} type="creator" />
              ) : (
                <>
                  <p className="mb-4 text-sm text-gray-500">{tr("review_prompt")} {chosen?.creator.name}.</p>
                  <AddReviewForm type="creator" targetId={brief.selected_creator_id} briefId={brief.id} storeId={brief.store_id} onSuccess={() => setReloadKey((k) => k + 1)} />
                </>
              )}
            </Panel>
          )}

          <section>
            <h2 className="mb-3 text-lg font-black text-gray-900">{tr("applications")} ({applications.length})</h2>
            {applications.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
                <Users className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-3 font-black text-gray-900">{tr("no_applications")}</p>
                <p className="mt-1 text-sm text-gray-500">{tr("no_applications_text")}</p>
                <Link href="/seller/creators" className="mt-4 inline-flex text-sm font-bold text-primary">{u("browse_creators")}</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {sorted.map((app) => {
                  const canChoose = state === "open" && app.status === "pending";
                  const samples: string[] = (Array.isArray(app.portfolio_samples) ? app.portfolio_samples : []).filter((s: unknown) => typeof s === "string").slice(0, 4);
                  return (
                    <article key={app.id} className={`rounded-2xl border bg-white p-5 ${app.status === "accepted" ? "border-primary ring-1 ring-primary/20" : "border-gray-200"} ${app.status === "rejected" ? "opacity-60" : ""}`}>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 font-black text-primary">
                            {app.creator.avatar ? <img src={app.creator.avatar} alt="" className="h-full w-full object-cover" /> : app.creator.name[0]?.toUpperCase()}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-black text-gray-900">{app.creator.name}</span>
                            <span className="flex flex-wrap items-center gap-x-2 text-xs text-gray-500">
                              {app.creator.rating !== null ? <span className="inline-flex items-center gap-0.5"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{app.creator.rating.toFixed(1)} ({app.creator.reviews})</span> : <span>{tr("new_creator")}</span>}
                              {app.creator.projects > 0 && <span>{u("missions_done").replace("{count}", String(app.creator.projects))}</span>}
                              {app.creator.types.slice(0, 2).map((value: string) => <span key={value}>{typeLabel(value)}</span>)}
                            </span>
                          </span>
                        </div>
                        <div className="shrink-0 sm:text-end">
                          <p className="text-xl font-black text-gray-900">{formatPrice(Number(app.proposed_price || 0))}</p>
                          <p className="text-xs text-gray-500">{u("delivery_days").replace("{n}", String(app.delivery_days || "-"))}</p>
                        </div>
                      </div>
                      {app.message && <p className="mt-4 whitespace-pre-wrap text-sm text-gray-600">{app.message}</p>}
                      {samples.length > 0 && (
                        <div className="mt-4 grid grid-cols-4 gap-2">
                          {samples.map((src) => (
                            <a key={src} href={src} target="_blank" rel="noopener noreferrer" className="block aspect-square overflow-hidden rounded-lg bg-gray-100">
                              {isVideoUrl(src) ? <span className="flex h-full w-full items-center justify-center text-gray-400"><Video className="h-6 w-6" /></span> : <img src={src} alt="" className="h-full w-full object-cover" />}
                            </a>
                          ))}
                        </div>
                      )}
                      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                        {canChoose ? (
                          <button type="button" onClick={() => accept(app)} disabled={processing} className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-black text-white disabled:opacity-50">{tr("choose")}</button>
                        ) : (
                          <span className={`inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-bold ${app.status === "accepted" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                            {app.status === "accepted" ? tr("chosen") : tr(app.status === "pending" ? "pending" : "not_chosen")}
                          </span>
                        )}
                        <div className="sm:w-48"><CreatorPortfolioDialog creatorId={app.creator_id} creatorName={app.creator.name} /></div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <Panel title={tr("description")}>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">{brief.description}</p>
            {brief.deliverables && (
              <>
                <h3 className="mb-2 mt-5 font-black text-gray-900">{tr("deliverables")}</h3>
                <p className="whitespace-pre-wrap rounded-xl bg-gray-50 p-4 text-sm leading-relaxed text-gray-600">{brief.deliverables}</p>
              </>
            )}
            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-gray-500">{tr("place")}</dt><dd className="font-bold text-gray-900">{brief.preferred_city || u("remote")}</dd></div>
              <div><dt className="text-gray-500">{tr("rights")}</dt><dd className="font-bold text-gray-900">{brief.rights_type ? t(`seller_app.create_brief.rights.${brief.rights_type}`) : "-"}</dd></div>
            </dl>
            {(brief.products || []).length > 0 && (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {brief.products.map((product: any, i: number) => (
                  <div key={product.id || i} className="flex min-w-0 items-center gap-3 rounded-xl bg-gray-50 p-3">
                    {(product.image_url || product.image) ? <img src={product.image_url || product.image} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" /> : <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-200 text-gray-400"><Package className="h-5 w-5" /></span>}
                    <span className="min-w-0 truncate text-sm font-bold text-gray-900">{product.name}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <div className="min-w-0 space-y-6">
          {chosen && (
            <Panel title={tr("chat")}>
              <p className="text-sm text-gray-500">{tr("chat_help")}</p>
              <Link href={`/seller/content/messages?briefId=${id}`} className="mt-3 flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 text-sm font-black text-gray-900 hover:bg-gray-50">
                <MessageSquare className="h-4 w-4" />
                {tr("open_chat")}
              </Link>
            </Panel>
          )}

          <Panel>
            <p className="flex items-center gap-2 font-black text-gray-900"><Shield className="h-5 w-5 text-emerald-600" />{tr("escrow")}</p>
            <ol className="mt-3 space-y-3">
              {["escrow_1", "escrow_2", "escrow_3", "escrow_4"].map((key, i) => (
                <li key={key} className="flex gap-3 text-sm text-gray-600">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">{i + 1}</span>
                  {tr(key)}
                </li>
              ))}
            </ol>
          </Panel>

          {canDispute && (
            <button type="button" onClick={() => setDisputeOpen(true)} className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 transition-colors hover:text-rose-600">
              <ShieldAlert className="h-4 w-4" />
              {tr("open_dispute")}
            </button>
          )}
        </div>
      </div>

      <DisputeDialog isOpen={disputeOpen} onClose={() => setDisputeOpen(false)} briefId={id as string} onSuccess={() => setBrief({ ...brief, is_disputed: true })} />
    </div>
  );
}
