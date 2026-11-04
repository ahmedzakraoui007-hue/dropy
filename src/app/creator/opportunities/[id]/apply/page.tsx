"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Check, Clock, Loader2, Send, ShieldCheck, Video } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/context/LanguageContext";
import { createClient } from "@/lib/supabase/client";
import { FREE_LAUNCH } from "@/lib/launch";
import { formatPrice } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/ui/file-upload";
import { BackLink, PageSkeleton, Panel, budgetLabel, useCreatorText } from "@/components/creator/shared";

const MIN_MESSAGE = 10;
const MAX_SAMPLES = 5;
const DAY_CHOICES = [3, 5, 7, 14];

export default function ApplyPage() {
  const { t } = useTranslation();
  const tr = (key: string) => t(`creator_app.apply.${key}`);
  const { common, date } = useCreatorText();
  const { id } = useParams();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [brief, setBrief] = useState<any>(null);
  const [works, setWorks] = useState<any[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [price, setPrice] = useState("");
  const [days, setDays] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: row }, { data: application }, { data: portfolio }] = await Promise.all([
        supabase.from("content_briefs").select("*, store:stores(name)").eq("id", id).maybeSingle(),
        supabase.from("content_applications").select("id").eq("brief_id", id).eq("creator_id", user.id).maybeSingle(),
        supabase.from("creator_portfolio").select("id, title, type, thumbnail_url, content_url").eq("creator_id", user.id).order("created_at", { ascending: false }).limit(12),
      ]);

      if (!row) {
        toast.error(tr("brief_introuvable"));
        router.push("/creator/opportunities");
        return;
      }
      if (application || row.status !== "published" || row.selected_creator_id) {
        router.replace(`/creator/opportunities/${id}`);
        return;
      }
      setBrief(row);
      setWorks((portfolio || []).filter((item) => String(item.content_url || item.thumbnail_url || "").includes(`/store-assets/${user.id}/`)));
    }
    load();
  }, [id, supabase, router]);

  const toggle = (url: string) => {
    setPicked((current) => {
      if (current.includes(url)) return current.filter((value) => value !== url);
      return current.length < MAX_SAMPLES ? [...current, url] : current;
    });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!(Number(price) > 0) || !(Number(days) > 0) || !message.trim()) {
      toast.error(tr("veuillez_remplir_tous_les_champs"));
      return;
    }
    if (message.trim().length < MIN_MESSAGE) {
      toast.error(tr("message_short"));
      return;
    }

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(common("not_signed_in"));

      const samples = [...picked];
      for (const file of files.slice(0, MAX_SAMPLES - samples.length)) {
        const path = `${user.id}/applications/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const { error } = await supabase.storage.from("store-assets").upload(path, file);
        if (error) throw new Error(tr("sample_error"));
        samples.push(supabase.storage.from("store-assets").getPublicUrl(path).data.publicUrl);
      }

      const response = await fetch(`/api/content/briefs/${id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposed_price: price, delivery_days: days, message, portfolio_samples: samples }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || tr("send_error"));

      toast.success(tr("proposition_envoyee"));
      router.push("/creator/missions");
    } catch (error: any) {
      toast.error(error.message || tr("send_error"));
    } finally {
      setSending(false);
    }
  };

  if (!brief) return <PageSkeleton />;

  const min = Number(brief.budget_min || 0);
  const max = Number(brief.budget_max || 0);
  const priceChoices = min && max && min !== max ? [min, Math.round((min + max) / 2), max] : [];
  const field = "h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-900 outline-none focus:border-primary";
  const pill = (active: boolean) => `rounded-full px-3 py-1 text-xs font-bold transition-colors ${active ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`;
  const messageLength = message.trim().length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <BackLink href={`/creator/opportunities/${id}`} label={common("back")} />

      <div>
        <h1 className="text-2xl font-black tracking-tight text-gray-900 md:text-3xl">{tr("envoyer_la_proposition")}</h1>
        <p className="mt-1 text-gray-500">{[brief.title, brief.store?.name].filter(Boolean).join(" · ")}</p>
      </div>

      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <Panel title={tr("details_de_la_proposition")}>
            <div className="grid gap-5 md:grid-cols-2">
              <div className="min-w-0 space-y-2">
                <Label htmlFor="price">{tr("proposed_price_tnd")}</Label>
                <input id="price" type="number" min="1" step="any" inputMode="decimal" className={field} value={price} onChange={(e) => setPrice(e.target.value)} />
                {priceChoices.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {priceChoices.map((value) => <button key={value} type="button" onClick={() => setPrice(String(value))} className={pill(Number(price) === value)}>{formatPrice(value)}</button>)}
                  </div>
                )}
              </div>
              <div className="min-w-0 space-y-2">
                <Label htmlFor="days">{tr("delai_de_livraison_jours")}</Label>
                <input id="days" type="number" min="1" inputMode="numeric" className={field} value={days} onChange={(e) => setDays(e.target.value)} />
                <div className="flex flex-wrap gap-2">
                  {DAY_CHOICES.map((value) => <button key={value} type="button" onClick={() => setDays(String(value))} className={pill(Number(days) === value)}>{common("days").replace("{n}", String(value))}</button>)}
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <Label htmlFor="message">{tr("pourquoi_etes_vous_le_bon")}</Label>
              <Textarea id="message" placeholder={tr("presentez_votre_experience_au_vendeur")} className="min-h-[150px]" value={message} maxLength={4000} onChange={(e) => setMessage(e.target.value)} />
              {messageLength > 0 && messageLength < MIN_MESSAGE && <p className="text-xs font-semibold text-amber-700">{tr("message_short")}</p>}
            </div>
          </Panel>

          <Panel title={tr("exemples_de_travaux")}>
            {works.length > 0 && (
              <>
                <p className="text-sm text-gray-500">{tr("from_portfolio").replace("{max}", String(MAX_SAMPLES))}</p>
                <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {works.map((item) => {
                    const url = item.content_url || item.thumbnail_url;
                    const active = picked.includes(url);
                    return (
                      <button key={item.id} type="button" onClick={() => toggle(url)} aria-pressed={active} aria-label={item.title} className={`relative aspect-square overflow-hidden rounded-xl bg-gray-100 ring-2 transition-all ${active ? "ring-primary" : "ring-transparent hover:ring-gray-300"}`}>
                        {item.thumbnail_url ? <img src={item.thumbnail_url} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center text-gray-400"><Video className="h-6 w-6" /></span>}
                        {active && <span className="absolute end-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white"><Check className="h-3.5 w-3.5" /></span>}
                      </button>
                    );
                  })}
                </div>
                <p className="mb-3 mt-5 text-sm font-bold text-gray-700">{tr("or_upload")}</p>
              </>
            )}
            {works.length === 0 && <p className="mb-3 text-sm text-gray-500">{tr("ajoutez_3_a_5_exemples")}</p>}
            <FileUpload onFilesSelected={setFiles} maxFiles={MAX_SAMPLES} acceptedTypes={["image/*", "video/*"]} />
          </Panel>
        </div>

        <div className="min-w-0">
          <div className="space-y-4 lg:sticky lg:top-24">
            <Panel title={tr("recap")}>
              <dl className="space-y-3 text-sm">
                {budgetLabel(brief) && (
                  <div className="flex justify-between gap-3"><dt className="text-gray-500">{tr("seller_budget")}</dt><dd className="text-end font-bold text-gray-900">{budgetLabel(brief)}</dd></div>
                )}
                {brief.deadline && (
                  <div className="flex justify-between gap-3"><dt className="text-gray-500">{tr("deadline")}</dt><dd className="font-bold text-gray-900">{date(brief.deadline)}</dd></div>
                )}
                {Number(days) > 0 && (
                  <div className="flex justify-between gap-3"><dt className="inline-flex items-center gap-1 text-gray-500"><Clock className="h-3.5 w-3.5" />{tr("your_delivery")}</dt><dd className="font-bold text-gray-900">{common("days").replace("{n}", days)}</dd></div>
                )}
                {Number(price) > 0 && (
                  <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
                    <dt className="font-bold text-gray-900">{tr("your_price")}</dt>
                    <dd className="text-xl font-black text-primary">{formatPrice(Number(price))}</dd>
                  </div>
                )}
              </dl>
              <button type="submit" disabled={sending} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-black text-white transition-transform hover:-translate-y-0.5 disabled:opacity-60">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 rtl:rotate-180" />}
                {tr(sending ? "sending" : "send")}
              </button>
            </Panel>

            <p className="flex gap-2 rounded-2xl bg-violet-50 p-4 text-xs leading-relaxed text-violet-900">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              {FREE_LAUNCH ? tr("note_free") : tr("si_vous_etes_retenu_le")}
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
