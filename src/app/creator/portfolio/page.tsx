"use client";

import { useTranslation } from "@/context/LanguageContext";
import { useState, useEffect, useMemo } from "react";
import { Plus, Image as ImageIcon, Video, Trash2, ExternalLink, Loader2, Camera, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PORTFOLIO_CATEGORIES, portfolioCategoryKey, isVideoUrl } from "@/lib/portfolio";
import { PortfolioShareCard } from "@/components/portfolio/PortfolioShareCard";
import { EmptyState, PageHero, PageSkeleton } from "@/components/creator/shared";

const MAX_SIZE_MB = 50;

const EMPTY = { title: "", description: "", category: "product_photo", link: "" };

export default function PortfolioPage() {
  const { t: tt } = useTranslation();
  const tr = (key: string) => tt(`creator_app.portfolio.${key}`);
  const tc = (key: string) => tt(`creator_app.common.${key}`);
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState<File | null>(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadPortfolio();
  }, []);

  async function loadPortfolio() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from("creator_portfolio")
      .select("*")
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false });
    if (error) toast.error(tr("impossible_de_charger_le_portfolio"));
    else setPortfolio(data || []);
    setLoading(false);
  }

  function pickFile(f: File | null) {
    if (f && f.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(tr("too_large").replace("{max}", String(MAX_SIZE_MB)));
      return;
    }
    if (f && !/^(image|video)\//.test(f.type)) {
      toast.error(tr("seules_les_images_et_videos"));
      return;
    }
    setFile(f);
  }

  async function handleAddProject() {
    const link = form.link.trim();
    if (!form.title.trim() || (!file && !/^https?:\/\//i.test(link))) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(tc("not_signed_in"));

      let mediaUrl = link;
      let type = isVideoUrl(link) ? "video" : "image";
      if (file) {
        const path = `${user.id}/portfolio/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const { error: uploadError } = await supabase.storage.from("store-assets").upload(path, file);
        if (uploadError) throw new Error(tr("upload_error"));
        mediaUrl = supabase.storage.from("store-assets").getPublicUrl(path).data.publicUrl;
        type = file.type.startsWith("video/") ? "video" : "image";
      }

      const { error } = await supabase.from("creator_portfolio").insert({
        creator_id: user.id,
        title: form.title.trim().slice(0, 120),
        description: form.description.trim().slice(0, 1000),
        category: form.category,
        type,
        thumbnail_url: type === "image" ? mediaUrl : null,
        content_url: mediaUrl,
      });
      if (error) throw new Error(tr("add_error"));

      toast.success(tr("projet_ajoute_au_portfolio"));
      setIsAdding(false);
      setForm(EMPTY);
      setFile(null);
      loadPortfolio();
    } catch (e: any) {
      toast.error(e.message || tr("add_error"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteProject(item: any) {
    if (!window.confirm(tr("delete_confirm").replace("{title}", item.title))) return;
    setIsDeleting(item.id);
    const { error } = await supabase.from("creator_portfolio").delete().eq("id", item.id);
    if (error) {
      toast.error(tr("impossible_de_supprimer_le_projet"));
    } else {
      const prefix = "/storage/v1/object/public/store-assets/";
      const url: string = item.content_url || item.thumbnail_url || "";
      const i = url.indexOf(prefix);
      if (i >= 0) await supabase.storage.from("store-assets").remove([decodeURIComponent(url.slice(i + prefix.length))]);
      toast.success(tr("projet_supprime"));
      setPortfolio((prev) => prev.filter((p) => p.id !== item.id));
    }
    setIsDeleting(null);
  }

  if (loading) {
    return <PageSkeleton />;
  }

  const categoryLabel = (value: string | null) => {
    const key = portfolioCategoryKey(value) || "general";
    return tc(`cat_${key}`);
  };
  const categories = Array.from(new Set(portfolio.map((item) => portfolioCategoryKey(item.category) || "general")));
  const shown = filter === "all" ? portfolio : portfolio.filter((item) => (portfolioCategoryKey(item.category) || "general") === filter);

  const canSave = form.title.trim() && (file || /^https?:\/\//i.test(form.link.trim()));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHero
        title={tr("mon_portfolio")}
        subtitle={tr("presentez_vos_meilleures_realisations_les")}
        action={
          <button type="button" onClick={() => setIsAdding(true)} className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-slate-900 transition-transform hover:-translate-y-0.5">
            <Plus className="h-4 w-4" />
            {tr("ajouter_un_projet")}
          </button>
        }
      />

      <PortfolioShareCard itemCount={portfolio.length} />

      <Dialog open={isAdding} onOpenChange={(open) => !saving && setIsAdding(open)}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{tr("ajouter_un_projet")}</DialogTitle>
            <DialogDescription>{tr("envoyez_une_photo_ou_une")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="title">{tr("titre_du_projet")}</Label>
              <Input id="title" placeholder={tr("ex_video_ugc_pour_une")} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">{tr("categorie")}</Label>
              <select
                id="category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {Object.keys(PORTFOLIO_CATEGORIES).map((value) => (
                  <option key={value} value={value}>{categoryLabel(value)}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="media">{tr("file_label").replace("{max}", String(MAX_SIZE_MB))}</Label>
              <label
                htmlFor="media"
                className="flex items-center gap-3 rounded-xl border-2 border-dashed border-border p-4 cursor-pointer hover:border-primary/50 transition-colors"
              >
                <Upload className="w-5 h-5 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground truncate">{file ? file.name : tr("choose_file")}</span>
              </label>
              <input id="media" type="file" accept="image/*,video/*" className="hidden" onChange={(e) => pickFile(e.target.files?.[0] || null)} />
            </div>
            {!file && (
              <div className="grid gap-2">
                <Label htmlFor="link">{tr("ou_lien_vers_la_realisation")}</Label>
                <Input id="link" placeholder="https://..." value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} />
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="description">{tr("description_facultatif")}</Label>
              <Textarea id="description" placeholder={tr("marque_objectif_resultats_obtenus")} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdding(false)} disabled={saving}>{tr("annuler")}</Button>
            <Button onClick={handleAddProject} className="bg-primary text-primary-foreground" disabled={!canSave || saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {tr("add_cta")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {portfolio.length === 0 ? (
        <EmptyState
          icon={Camera}
          title={tr("votre_portfolio_est_vide")}
          text={tr("ajoutez_au_moins_3_realisations")}
          action={
            <button type="button" onClick={() => setIsAdding(true)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-black text-white">
              <Plus className="h-4 w-4" />
              {tr("ajouter_mon_premier_projet")}
            </button>
          }
        />
      ) : (
        <>
          {categories.length > 1 && (
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
              {["all", ...categories].map((value) => (
                <button key={value} type="button" onClick={() => setFilter(value)} className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-bold transition-colors ${filter === value ? "bg-primary text-white" : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"}`}>
                  {value === "all" ? tr("all") : categoryLabel(value)}
                </button>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {shown.map((item) => {
              const media = item.content_url || item.thumbnail_url;
              const video = item.type === "video";
              return (
                <article key={item.id} className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-gray-100">
                  {video && isVideoUrl(media) ? (
                    <video src={media} className="h-full w-full object-cover" muted loop playsInline preload="metadata" onMouseEnter={(e) => e.currentTarget.play().catch(() => {})} onMouseLeave={(e) => e.currentTarget.pause()} />
                  ) : item.thumbnail_url ? (
                    <img src={item.thumbnail_url} alt={item.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-gray-300">{video ? <Video className="h-10 w-10" /> : <ImageIcon className="h-10 w-10" />}</span>
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                  <div className="absolute end-2 top-2 flex gap-1.5">
                    {media && (
                      <a href={media} target="_blank" rel="noopener noreferrer" aria-label={tr("view")} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-800 transition-colors hover:bg-white">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    <button type="button" onClick={() => handleDeleteProject(item)} disabled={isDeleting === item.id} aria-label={tr("supprimer")} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-rose-600 transition-colors hover:bg-white">
                      {isDeleting === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3 text-white">
                    <h3 className="truncate text-sm font-black">{item.title}</h3>
                    <p className="truncate text-xs text-white/75">{categoryLabel(item.category)}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
