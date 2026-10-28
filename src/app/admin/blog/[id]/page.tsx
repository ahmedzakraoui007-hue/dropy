"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BLOG_CATEGORIES, plainExcerpt, readingMinutes, renderMarkdown, slugify } from "@/lib/blog";
import { cn } from "@/lib/utils";

type Form = {
  title: string;
  slug: string;
  locale: "fr" | "ar";
  category: string;
  excerpt: string;
  content: string;
  cover_url: string;
  seo_title: string;
  seo_description: string;
  status: "draft" | "published";
  published_at: string | null;
};

const EMPTY: Form = { title: "", slug: "", locale: "fr", category: "", excerpt: "", content: "", cover_url: "", seo_title: "", seo_description: "", status: "draft", published_at: null };

const CATEGORY_LABELS: Record<string, string> = { vendre: "Vendre en ligne", publicite: "Publicité", fournisseurs: "Fournisseurs", createurs: "Créateurs UGC", dropy: "Nouveautés Dropy" };

const HELP = "## Titre de section\n### Sous-titre\n**gras**, *italique*, [lien](https://...), ![image](https://...)\n- liste\n1. liste numérotée\n> citation";

export default function AdminBlogEditor() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const isNew = id === "new";
  const [form, setForm] = useState<Form>(EMPTY);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [savedSlug, setSavedSlug] = useState<string | null>(null);

  const refreshSite = (slug: string, previousSlug?: string | null) =>
    fetch("/api/admin/blog/revalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, previousSlug }),
    }).catch(() => undefined);

  useEffect(() => {
    if (isNew) return;
    createClient()
      .from("blog_posts")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) {
          toast.error("Article introuvable");
          router.push("/admin/blog");
          return;
        }
        setForm({
          title: data.title,
          slug: data.slug,
          locale: data.locale,
          category: data.category || "",
          excerpt: data.excerpt || "",
          content: data.content || "",
          cover_url: data.cover_url || "",
          seo_title: data.seo_title || "",
          seo_description: data.seo_description || "",
          status: data.status,
          published_at: data.published_at,
        });
        setSavedSlug(data.slug);
        setLoading(false);
      });
  }, [id, isNew, router]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  const setTitle = (title: string) => setForm((prev) => ({ ...prev, title, slug: slugTouched ? prev.slug : slugify(title) }));

  const uploadCover = async (file: File) => {
    if (!file.type.startsWith("image/")) return toast.error("Choisissez une image");
    if (file.size > 3 * 1024 * 1024) return toast.error("Image trop lourde (3 Mo maximum)");
    setUploading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setUploading(false);
      return;
    }
    const path = `${user.id}/blog/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error } = await supabase.storage.from("store-assets").upload(path, file);
    setUploading(false);
    if (error) return toast.error("Échec de l'envoi de l'image");
    set("cover_url", supabase.storage.from("store-assets").getPublicUrl(path).data.publicUrl);
  };

  const save = async (status: Form["status"]) => {
    const slug = slugify(form.slug || form.title);
    if (form.title.trim().length < 3) return toast.error("Ajoutez un titre");
    if (!slug) return toast.error("Indiquez une adresse en lettres latines, par exemple vendre-en-ligne");
    if (status === "published" && form.content.trim().length < 200) return toast.error("Article trop court pour être publié (200 caractères minimum)");
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const payload = {
      title: form.title.trim(),
      slug,
      locale: form.locale,
      category: form.category || null,
      excerpt: form.excerpt.trim() || plainExcerpt(form.content),
      content: form.content,
      cover_url: form.cover_url.trim() || null,
      seo_title: form.seo_title.trim() || null,
      seo_description: form.seo_description.trim() || null,
      status,
      published_at: status === "published" ? form.published_at || new Date().toISOString() : form.published_at,
      updated_at: new Date().toISOString(),
    };
    const query = isNew
      ? supabase.from("blog_posts").insert({ ...payload, author_id: user?.id }).select("id").single()
      : supabase.from("blog_posts").update(payload).eq("id", id).select("id").single();
    const { data, error } = await query;
    setSaving(false);
    if (error) {
      toast.error(error.code === "23505" ? "Cette adresse est déjà utilisée par un autre article" : "Enregistrement impossible");
      return;
    }
    setForm((prev) => ({ ...prev, slug, status, published_at: payload.published_at }));
    await refreshSite(slug, savedSlug !== slug ? savedSlug : null);
    setSavedSlug(slug);
    toast.success(status === "published" ? "Article publié" : "Brouillon enregistré");
    if (isNew && data) router.replace(`/admin/blog/${data.id}`);
  };

  const remove = async () => {
    if (!window.confirm("Supprimer définitivement cet article ?")) return;
    const { error } = await createClient().from("blog_posts").delete().eq("id", id);
    if (error) return toast.error("Suppression impossible");
    await refreshSite(form.slug, savedSlug);
    toast.success("Article supprimé");
    router.push("/admin/blog");
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const seoTitle = form.seo_title || `${form.title} | Blog Dropy`;
  const seoDescription = form.seo_description || form.excerpt || plainExcerpt(form.content);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/blog" aria-label="Retour"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="text-2xl font-bold tracking-tight">{isNew ? "Nouvel article" : "Modifier l'article"}</h1>
          <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", form.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600")}>
            {form.status === "published" ? "Publié" : "Brouillon"}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isNew && (
            <Button variant="ghost" className="text-red-600" onClick={remove} disabled={saving}>
              <Trash2 className="me-2 h-4 w-4" />
              Supprimer
            </Button>
          )}
          {form.status === "published" ? (
            <Button variant="outline" onClick={() => save("draft")} disabled={saving}>Dépublier</Button>
          ) : (
            <Button variant="outline" onClick={() => save("draft")} disabled={saving}>Enregistrer le brouillon</Button>
          )}
          <Button onClick={() => save("published")} disabled={saving}>
            {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {form.status === "published" ? "Mettre à jour" : "Publier"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Input value={form.title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre de l'article" className="h-12 text-lg font-semibold" dir={form.locale === "ar" ? "rtl" : "ltr"} />
          <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
            {(["write", "preview"] as const).map((value) => (
              <button key={value} type="button" onClick={() => setTab(value)} className={cn("rounded-md px-3 py-1 text-sm font-medium", tab === value ? "bg-background shadow-sm" : "text-muted-foreground")}>
                {value === "write" ? "Écrire" : "Aperçu"}
              </button>
            ))}
          </div>
          {tab === "write" ? (
            <Textarea
              value={form.content}
              onChange={(e) => set("content", e.target.value)}
              rows={24}
              placeholder={HELP}
              className="font-mono text-sm"
              dir={form.locale === "ar" ? "rtl" : "ltr"}
            />
          ) : (
            <Card>
              <CardContent className="p-6" dir={form.locale === "ar" ? "rtl" : "ltr"}>
                {form.content.trim() ? <div className="blog-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(form.content) }} /> : <p className="text-sm text-muted-foreground">Rien à afficher.</p>}
              </CardContent>
            </Card>
          )}
          <p className="text-xs text-muted-foreground">{form.content.trim().split(/\s+/).filter(Boolean).length} mots · {readingMinutes(form.content)} min de lecture · Markdown : ## titre, **gras**, [lien](url), ![image](url), - liste</p>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Réglages</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="slug">Adresse</Label>
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-muted-foreground">/blog/</span>
                  <Input id="slug" value={form.slug} onChange={(e) => { setSlugTouched(true); set("slug", e.target.value.toLowerCase()); }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="locale">Langue</Label>
                  <select id="locale" value={form.locale} onChange={(e) => set("locale", e.target.value as Form["locale"])} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="fr">Français</option>
                    <option value="ar">العربية</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="category">Catégorie</Label>
                  <select id="category" value={form.category} onChange={(e) => set("category", e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">Aucune</option>
                    {BLOG_CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="excerpt">Résumé (affiché dans la liste)</Label>
                <Textarea id="excerpt" rows={3} maxLength={300} value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} placeholder="Laissez vide pour utiliser le début de l'article" />
              </div>
              <div className="space-y-1.5">
                <Label>Image de couverture</Label>
                {form.cover_url && <img src={form.cover_url} alt="" className="aspect-video w-full rounded-lg object-cover" />}
                <div className="flex gap-2">
                  <Input value={form.cover_url} onChange={(e) => set("cover_url", e.target.value)} placeholder="https://..." />
                  <label className="inline-flex h-10 cursor-pointer items-center rounded-md border px-3 hover:bg-muted" aria-label="Envoyer une image">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadCover(e.target.files[0])} />
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Google</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="seo-title">Titre Google <span className="text-muted-foreground">({seoTitle.length}/60)</span></Label>
                <Input id="seo-title" value={form.seo_title} onChange={(e) => set("seo_title", e.target.value)} placeholder={`${form.title || "Titre"} | Blog Dropy`} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="seo-desc">Description Google <span className="text-muted-foreground">({seoDescription.length}/160)</span></Label>
                <Textarea id="seo-desc" rows={3} value={form.seo_description} onChange={(e) => set("seo_description", e.target.value)} placeholder="Laissez vide pour utiliser le résumé" />
              </div>
              <div className="rounded-lg border p-3">
                <p className="truncate text-xs text-emerald-700">dropy.store › blog › {form.slug || "adresse"}</p>
                <p className="truncate text-base text-blue-700">{seoTitle}</p>
                <p className="line-clamp-2 text-xs text-slate-600">{seoDescription}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
