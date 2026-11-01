"use client";

import { useEffect, useState } from "react";
import { Copy, ExternalLink, ImagePlus, KeyRound, Loader2, MessageCircle, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

type ClientStore = {
  id: string;
  name: string;
  slug: string;
  url: string;
  logo_url: string | null;
  online: boolean;
  handed_over_at: string | null;
  created_at: string;
  products: number;
  owner: { email: string; full_name: string | null; phone: string | null } | null;
};
type Token = { id: string; name: string; token_prefix: string; created_at: string; last_used_at: string | null };
type Handover = { link: string; email: string; emailSent: boolean };

const copy = (text: string, label = "Copié") =>
  navigator.clipboard
    .writeText(text)
    .then(() => toast.success(label))
    .catch(() => toast.error("Copie impossible"));

export default function ClientStoresPage() {
  const [stores, setStores] = useState<ClientStore[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [uploads, setUploads] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [handover, setHandover] = useState<Record<string, Handover>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    const [s, t] = await Promise.all([fetch("/api/admin/client-stores").then((r) => r.json()), fetch("/api/admin/agency-tokens").then((r) => r.json())]);
    setStores(s.stores || []);
    setTokens(t.tokens || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const createToken = async () => {
    const res = await fetch("/api/admin/agency-tokens", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "Claude agence" }) });
    const data = await res.json();
    if (!res.ok) return toast.error(data.error || "Création impossible");
    setNewToken(data.token);
    load();
  };

  const revokeToken = async (id: string) => {
    if (!window.confirm("Révoquer cette clé ? Claude ne pourra plus l'utiliser.")) return;
    await fetch(`/api/admin/agency-tokens?id=${id}`, { method: "DELETE" });
    load();
  };

  const uploadPhotos = async (files: FileList) => {
    setUploading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setUploading(false);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} : image de 5 Mo maximum`);
        continue;
      }
      const path = `${user.id}/agency/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (error) {
        toast.error(`${file.name} : envoi impossible`);
        continue;
      }
      urls.push(supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl);
    }
    setUploads((prev) => [...urls, ...prev]);
    setUploading(false);
  };

  const handOver = async (store: ClientStore, sendEmail: boolean) => {
    setBusy(store.id);
    const res = await fetch("/api/admin/client-stores/handover", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ storeId: store.id, sendEmail }) });
    const data = await res.json();
    setBusy(null);
    if (!res.ok) return toast.error(data.error || "Impossible");
    setHandover((prev) => ({ ...prev, [store.id]: data }));
    toast.success(sendEmail ? (data.emailSent ? "E-mail envoyé au client" : "Lien créé (e-mail non envoyé)") : "Lien créé");
    load();
  };

  const mcpUrl = newToken ? `${window.location.origin}/api/mcp/${newToken}` : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Boutiques clients</h1>
        <p className="text-muted-foreground">Créez les boutiques de vos clients avec Claude, puis remettez-leur l&apos;accès.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><KeyRound className="h-5 w-5" />Clé agence pour Claude</CardTitle>
          <CardDescription>
            Dans Claude : Paramètres → Connecteurs → Ajouter un connecteur personnalisé, puis collez l&apos;adresse ci-dessous. Cette clé peut créer des comptes clients et modifier toutes les boutiques de l&apos;agence : ne la partagez pas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {mcpUrl && (
            <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm font-medium text-amber-900">Copiez cette adresse maintenant : elle ne sera plus affichée.</p>
              <div className="flex gap-2">
                <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded bg-white px-2 py-1.5 text-xs">{mcpUrl}</code>
                <Button size="sm" variant="outline" onClick={() => copy(mcpUrl)}><Copy className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
          {tokens.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
              <div>
                <p className="font-medium">{t.name} <span className="text-muted-foreground">({t.token_prefix}…)</span></p>
                <p className="text-xs text-muted-foreground">Créée le {formatDate(t.created_at)} · {t.last_used_at ? `utilisée le ${formatDate(t.last_used_at)}` : "jamais utilisée"}</p>
              </div>
              <Button size="sm" variant="ghost" className="text-red-600" onClick={() => revokeToken(t.id)} aria-label="Révoquer"><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          <Button onClick={createToken} variant="outline">Créer une clé agence</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><ImagePlus className="h-5 w-5" />Photos des clients</CardTitle>
          <CardDescription>Envoyez ici les photos et logos reçus des clients, puis copiez les liens pour les donner à Claude.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            Choisir des images
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files?.length && uploadPhotos(e.target.files)} />
          </label>
          {uploads.length > 0 && (
            <>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                {uploads.map((u) => <img key={u} src={u} alt="" className="aspect-square w-full rounded-lg object-cover" />)}
              </div>
              <Button size="sm" variant="outline" onClick={() => copy(uploads.join("\n"), "Liens copiés")}><Copy className="me-2 h-4 w-4" />Copier les {uploads.length} liens</Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Boutiques de l&apos;agence</CardTitle>
          <CardDescription>Créées avec la clé agence (« crée la boutique de … pour … »).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : stores.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune boutique pour l&apos;instant.</p>
          ) : (
            stores.map((s) => (
              <div key={s.id} className="space-y-3 rounded-xl border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {s.logo_url ? <img src={s.logo_url} alt="" className="h-10 w-10 rounded-lg object-contain" /> : <div className="h-10 w-10 rounded-lg bg-muted" />}
                    <div>
                      <p className="font-semibold">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.owner?.email} · {s.products} produit(s) · créée le {formatDate(s.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={s.online ? "default" : "secondary"}>{s.online ? "En ligne" : "Hors ligne"}</Badge>
                    {s.handed_over_at && <Badge variant="outline">Remise le {formatDate(s.handed_over_at)}</Badge>}
                    <a href={s.url} target="_blank" rel="noopener noreferrer"><Button size="sm" variant="outline"><ExternalLink className="me-1 h-4 w-4" />Voir</Button></a>
                    <Button size="sm" disabled={busy === s.id} onClick={() => handOver(s, true)}>
                      {busy === s.id ? <Loader2 className="me-1 h-4 w-4 animate-spin" /> : <Send className="me-1 h-4 w-4" />}
                      {s.handed_over_at ? "Renvoyer l'accès" : "Remettre au client"}
                    </Button>
                  </div>
                </div>
                {handover[s.id] && (
                  <div className="space-y-2 rounded-lg bg-muted/50 p-3 text-sm">
                    <p>
                      {handover[s.id].emailSent ? `E-mail envoyé à ${handover[s.id].email}. ` : "E-mail non envoyé. "}
                      Vous pouvez aussi envoyer ce lien sur WhatsApp (valable pour une durée limitée) :
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => copy(handover[s.id].link, "Lien copié")}><Copy className="me-1 h-4 w-4" />Copier le lien</Button>
                      <a
                        href={`https://wa.me/${(s.owner?.phone || "").replace(/\D/g, "").replace(/^(?=[2-9]\d{7}$)/, "216")}?text=${encodeURIComponent(`Bonjour, votre boutique ${s.name} est prête : ${s.url}\nChoisissez votre mot de passe ici : ${handover[s.id].link}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button size="sm" variant="outline"><MessageCircle className="me-1 h-4 w-4" />WhatsApp</Button>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
