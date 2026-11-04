"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, MessageSquare, Search, Star } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import { StarRating } from "@/components/reviews/StarRating";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, PageHero, PageSkeleton, Panel, PrimaryLink, useCreatorText } from "@/components/creator/shared";

const DETAILS = [
  { key: "qualite", column: "quality_rating" },
  { key: "communication", column: "communication_rating" },
  { key: "delais", column: "deadline_rating" },
];

export default function CreatorReviewsPage() {
  const { t } = useTranslation();
  const tr = (key: string) => t(`creator_app.reviews.${key}`);
  const { date } = useCreatorText();
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("creator_reviews")
      .select("*, store:stores(name), brief:content_briefs(title)")
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false });
    setReviews(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const reply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    setSending(true);
    const response = await fetch("/api/reviews/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ review_id: reviewId, type: "creator", reply: replyText.trim() }),
    }).catch(() => null);
    setSending(false);
    if (!response?.ok) {
      toast.error(tr("reply_error"));
      return;
    }
    toast.success(tr("reply_ok"));
    setReplyingTo(null);
    setReplyText("");
    load();
  };

  if (loading) return <PageSkeleton />;

  if (reviews.length === 0) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHero title={tr("mes_avis_reputation")} subtitle={tr("decouvrez_ce_que_les_vendeurs")} />
        <EmptyState
          icon={Star}
          title={tr("vous_n_avez_pas_encore")}
          text={tr("empty_text")}
          action={<PrimaryLink href="/creator/opportunities"><Search className="h-4 w-4" />{tr("empty_cta")}</PrimaryLink>}
        />
      </div>
    );
  }

  const average = (column: string) => {
    const values = reviews.map((r) => Number(r[column])).filter((v) => v > 0);
    return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  };
  const overall = average("rating");

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHero title={tr("mes_avis_reputation")} subtitle={tr("decouvrez_ce_que_les_vendeurs")}>
        <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-center">
          <div className="shrink-0">
            <p className="text-5xl font-black">{overall.toFixed(1)}</p>
            <div className="mt-2 flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => <Star key={i} className={`h-4 w-4 ${i <= Math.round(overall) ? "fill-amber-400 text-amber-400" : "fill-white/20 text-white/20"}`} />)}
            </div>
            <p className="mt-2 text-sm text-slate-300">{tr(reviews.length > 1 ? "count_many" : "count_one").replace("{count}", String(reviews.length))}</p>
          </div>
          <div className="min-w-0 flex-1 space-y-3 md:max-w-md md:border-s md:border-white/15 md:ps-6">
            {DETAILS.map(({ key, column }) => {
              const value = average(column);
              if (!value) return null;
              return (
                <div key={key} className="flex items-center gap-3 text-sm">
                  <span className="w-28 shrink-0 font-semibold text-slate-200">{tr(key)}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-white/15"><span className="block h-full rounded-full bg-teal-300" style={{ width: `${(value / 5) * 100}%` }} /></span>
                  <span className="w-7 shrink-0 text-end font-black">{value.toFixed(1)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </PageHero>

      <div className="space-y-4">
        <h2 className="text-lg font-black text-gray-900">{tr("derniers_avis_recus")}</h2>
        {reviews.map((review) => (
          <Panel key={review.id}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-black text-primary">{(review.store?.name?.[0] || "D").toUpperCase()}</span>
                <span className="min-w-0">
                  <span className="block truncate font-bold text-gray-900">{review.store?.name}</span>
                  <span className="block truncate text-xs text-gray-500">{[review.brief?.title, date(review.created_at, true)].filter(Boolean).join(" · ")}</span>
                </span>
              </div>
              <div className="shrink-0"><StarRating rating={review.rating} readonly size="sm" /></div>
            </div>

            {review.comment && <p className="mt-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-700">{review.comment}</p>}

            {review.creator_reply ? (
              <div className="mt-3 rounded-xl border-s-4 border-primary bg-violet-50 p-4">
                <p className="text-xs font-black text-primary">{tr("votre_reponse")}</p>
                <p className="mt-1 text-sm text-gray-700">{review.creator_reply}</p>
              </div>
            ) : replyingTo === review.id ? (
              <div className="mt-3 space-y-3">
                <Textarea placeholder={tr("votre_reponse_au_vendeur")} value={replyText} onChange={(e) => setReplyText(e.target.value)} className="min-h-[100px] text-sm" maxLength={2000} />
                <div className="flex gap-2">
                  <button type="button" onClick={() => reply(review.id)} disabled={sending || !replyText.trim()} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-black text-white disabled:opacity-50">
                    {sending && <Loader2 className="h-4 w-4 animate-spin" />}
                    {tr("publish")}
                  </button>
                  <button type="button" onClick={() => { setReplyingTo(null); setReplyText(""); }} className="h-10 rounded-xl px-4 text-sm font-bold text-gray-500 hover:bg-gray-50">{tr("cancel")}</button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => { setReplyingTo(review.id); setReplyText(""); }} className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-primary">
                <MessageSquare className="h-4 w-4" />
                {tr("repondre")}
              </button>
            )}
          </Panel>
        ))}
      </div>
    </div>
  );
}
