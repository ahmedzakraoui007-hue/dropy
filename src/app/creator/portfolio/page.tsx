"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Image as ImageIcon, Video, Trash2, ExternalLink, Loader2, LayoutGrid, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { PORTFOLIO_CATEGORIES, portfolioCategoryLabel, isVideoUrl } from "@/lib/portfolio";

const MAX_SIZE_MB = 50;

const EMPTY = { title: "", description: "", category: "product_photo", link: "" };

export default function PortfolioPage() {
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState<File | null>(null);

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
    if (error) toast.error("Impossible de charger le portfolio");
    else setPortfolio(data || []);
    setLoading(false);
  }

  function pickFile(f: File | null) {
    if (f && f.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Fichier trop lourd (${MAX_SIZE_MB} Mo maximum)`);
      return;
    }
    if (f && !/^(image|video)\//.test(f.type)) {
      toast.error("Seules les images et vidéos sont acceptées");
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
      if (!user) throw new Error("Non connecté");

      let mediaUrl = link;
      let type = isVideoUrl(link) ? "video" : "image";
      if (file) {
        const path = `${user.id}/portfolio/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const { error: uploadError } = await supabase.storage.from("store-assets").upload(path, file);
        if (uploadError) throw new Error("Échec de l'envoi du fichier");
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
      if (error) throw new Error("Impossible d'ajouter le projet");

      toast.success("Projet ajouté au portfolio");
      setIsAdding(false);
      setForm(EMPTY);
      setFile(null);
      loadPortfolio();
    } catch (e: any) {
      toast.error(e.message || "Impossible d'ajouter le projet");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteProject(item: any) {
    if (!window.confirm(`Supprimer « ${item.title} » de votre portfolio ?`)) return;
    setIsDeleting(item.id);
    const { error } = await supabase.from("creator_portfolio").delete().eq("id", item.id);
    if (error) {
      toast.error("Impossible de supprimer le projet");
    } else {
      const prefix = "/storage/v1/object/public/store-assets/";
      const url: string = item.content_url || item.thumbnail_url || "";
      const i = url.indexOf(prefix);
      if (i >= 0) await supabase.storage.from("store-assets").remove([decodeURIComponent(url.slice(i + prefix.length))]);
      toast.success("Projet supprimé");
      setPortfolio((prev) => prev.filter((p) => p.id !== item.id));
    }
    setIsDeleting(null);
  }

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const canSave = form.title.trim() && (file || /^https?:\/\//i.test(form.link.trim()));

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black mb-2">Mon portfolio</h1>
          <p className="text-muted-foreground">
            Présentez vos meilleures réalisations : les vendeurs le consultent quand vous postulez à leurs briefs.
          </p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20 gap-2">
          <Plus className="w-4 h-4" />
          Ajouter un projet
        </Button>
      </div>

      <Dialog open={isAdding} onOpenChange={(open) => !saving && setIsAdding(open)}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter un projet</DialogTitle>
            <DialogDescription>Envoyez une photo ou une vidéo, ou collez un lien (Instagram, TikTok, YouTube...).</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="title">Titre du projet *</Label>
              <Input id="title" placeholder="ex : Vidéo UGC pour une marque de cosmétiques" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Catégorie</Label>
              <select
                id="category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {Object.entries(PORTFOLIO_CATEGORIES).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="media">Fichier (image ou vidéo, {MAX_SIZE_MB} Mo max.)</Label>
              <label
                htmlFor="media"
                className="flex items-center gap-3 rounded-xl border-2 border-dashed border-border p-4 cursor-pointer hover:border-primary/50 transition-colors"
              >
                <Upload className="w-5 h-5 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground truncate">{file ? file.name : "Choisir un fichier"}</span>
              </label>
              <input id="media" type="file" accept="image/*,video/*" className="hidden" onChange={(e) => pickFile(e.target.files?.[0] || null)} />
            </div>
            {!file && (
              <div className="grid gap-2">
                <Label htmlFor="link">ou lien vers la réalisation</Label>
                <Input id="link" placeholder="https://..." value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} />
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="description">Description (facultatif)</Label>
              <Textarea id="description" placeholder="Marque, objectif, résultats obtenus..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdding(false)} disabled={saving}>Annuler</Button>
            <Button onClick={handleAddProject} className="bg-primary text-primary-foreground" disabled={!canSave || saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Ajouter au portfolio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {portfolio.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed">
            <LayoutGrid className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <h3 className="text-xl font-bold mb-2">Votre portfolio est vide</h3>
            <p className="text-muted-foreground mb-6">Ajoutez au moins 3 réalisations pour convaincre les vendeurs.</p>
            <Button className="bg-primary text-primary-foreground hover:opacity-90" onClick={() => setIsAdding(true)}>
              Ajouter mon premier projet
            </Button>
          </div>
        ) : (
          portfolio.map((item) => {
            const media = item.content_url || item.thumbnail_url;
            const video = item.type === "video";
            return (
              <Card key={item.id} className="overflow-hidden border-border/50 hover:border-primary/50 transition-all bg-card">
                <div className="aspect-video relative bg-muted">
                  {video && isVideoUrl(media) ? (
                    <video src={media} className="w-full h-full object-cover" controls preload="metadata" />
                  ) : item.thumbnail_url ? (
                    <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {video ? <Video className="w-12 h-12 opacity-20" /> : <ImageIcon className="w-12 h-12 opacity-20" />}
                    </div>
                  )}
                </div>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold truncate">{item.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {video ? "Vidéo" : "Image"} • {portfolioCategoryLabel(item.category)}
                    </p>
                    {item.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{item.description}</p>}
                  </div>
                  <div className="flex gap-2">
                    {media && (
                      <Button size="sm" variant="outline" className="gap-2 flex-1" asChild>
                        <a href={media} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                          Voir
                        </a>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteProject(item)}
                      disabled={isDeleting === item.id}
                      aria-label="Supprimer"
                    >
                      {isDeleting === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
