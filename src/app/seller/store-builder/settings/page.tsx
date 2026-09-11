"use client";

import { useEffect, useState } from "react";
import { 
  Globe, 
  Search, 
  BarChart3, 
  Code, 
  Check, 
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Zap,
  Facebook,
  Share2,
  Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [store, setStore] = useState<any>(null);

  useEffect(() => {
    async function loadStore() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
          const { data } = await supabase
            .from("stores")
            .select("*")
            .eq("vendor_id", user.id)
            .single();
        setStore(data);
      }
      setLoading(false);
    }
    loadStore();
  }, []);

  const handleUpdate = (field: string, value: any) => {
    setStore((prev: any) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSave = async () => {
    if (!store) return;
    setSaving(true);
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("stores")
        .update({
          slug: store.slug,
          custom_domain: store.custom_domain,
          meta_title: store.meta_title,
          meta_description: store.meta_description,
          meta_keywords: store.meta_keywords,
          google_analytics_id: store.google_analytics_id,
          facebook_pixel_id: store.facebook_pixel_id,
          custom_head_scripts: store.custom_head_scripts,
          custom_body_scripts: store.custom_body_scripts,
        })
        .eq("id", store.id);

      if (error) throw error;
      toast.success("Paramètres enregistrés !");
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Chargement...</div>;

  if (!store) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h1 className="text-xl font-bold text-gray-900">Aucune boutique trouvée</h1>
        <p className="text-gray-500">Vous devez d'abord créer une boutique pour accéder à ces paramètres.</p>
        <Button asChild>
          <a href="/seller/store/create">Créer une boutique</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">PARAMÈTRES BOUTIQUE</h1>
          <p className="text-gray-500 font-medium">Domaine, SEO, Analytics et configurations avancées</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 px-8"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
          Enregistrer
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Domain Settings */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              Adresse de la boutique
            </h2>
            <Card className="border-gray-100 rounded-3xl shadow-sm overflow-hidden">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-widest text-gray-400">Lien Dropy (Gratuit)</Label>
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center bg-gray-50 rounded-xl px-4 border border-transparent focus-within:border-blue-500 transition-colors">
                      <span className="text-gray-400 text-sm font-medium mr-1">dropy.store/shop/</span>
                        <Input 
                          value={store?.slug || ""} 
                          onChange={(e) => handleUpdate('slug', e.target.value)}
                          className="border-none bg-transparent h-11 p-0 focus-visible:ring-0 font-bold"
                        />
                      </div>
                      <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-gray-100" asChild>
                        <a href={`/preview/${store?.slug}`} target="_blank"><ExternalLink className="w-4 h-4" /></a>
                      </Button>
                  </div>
                  <p className="text-[10px] text-gray-400 italic">Lien unique pour partager votre boutique.</p>
                </div>

                <div className="pt-6 border-t border-gray-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="font-bold text-gray-900 flex items-center gap-2">
                        Domaine Personnalisé
                        <Badge className="bg-blue-600 text-white border-none text-[8px] font-black uppercase">PREMIUM</Badge>
                      </h4>
                      <p className="text-xs text-gray-500">Utilisez votre propre domaine (ex: www.maboutique.com)</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="www.votre-domaine.com" 
                      value={store.custom_domain || ''}
                      onChange={(e) => handleUpdate('custom_domain', e.target.value)}
                      className="h-11 rounded-xl bg-gray-50 border-none"
                    />
                    <Button variant="outline" className="rounded-xl h-11 font-bold border-gray-200">
                      Configurer DNS
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* SEO Settings */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-600" />
              Référencement (SEO)
            </h2>
            <Card className="border-gray-100 rounded-3xl shadow-sm overflow-hidden">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-gray-400">Meta Title</Label>
                  <Input 
                    value={store.meta_title || ''}
                    onChange={(e) => handleUpdate('meta_title', e.target.value)}
                    placeholder="Titre affiché sur Google"
                    className="h-11 rounded-xl bg-gray-50 border-none"
                    maxLength={60}
                  />
                  <div className="flex justify-between items-center px-1">
                    <p className="text-[10px] text-gray-400">Recommandé : 50-60 caractères</p>
                    <span className="text-[10px] font-bold text-gray-400">{(store.meta_title || '').length}/60</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-gray-400">Meta Description</Label>
                  <Textarea 
                    value={store.meta_description || ''}
                    onChange={(e) => handleUpdate('meta_description', e.target.value)}
                    placeholder="Description courte de votre boutique pour les moteurs de recherche"
                    className="rounded-xl bg-gray-50 border-none min-h-[100px] resize-none"
                    maxLength={160}
                  />
                  <div className="flex justify-between items-center px-1">
                    <p className="text-[10px] text-gray-400">Recommandé : 150-160 caractères</p>
                    <span className="text-[10px] font-bold text-gray-400">{(store.meta_description || '').length}/160</span>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100 space-y-4">
                  <h4 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                    <Share2 className="w-4 h-4 text-blue-600" />
                    Aperçu sur les réseaux sociaux
                  </h4>
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <div className="aspect-[1200/630] bg-gray-200 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                      {store.og_image_url ? (
                        <img src={store.og_image_url} alt="Aperçu" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center p-4">
                          <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Image Sociale</p>
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-tight mb-1">DROPY.STORE</p>
                    <h5 className="font-bold text-gray-900 text-sm">{store.meta_title || store.name}</h5>
                    <p className="text-[10px] text-gray-500 line-clamp-1">{store.meta_description || "Visitez ma boutique sur Dropy !"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        <div className="space-y-8">
          {/* Tracking & Analytics */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Tracking
            </h2>
            <Card className="border-gray-100 rounded-3xl shadow-sm overflow-hidden">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Globe className="w-4 h-4 text-emerald-500" />
                    <Label className="text-xs font-bold uppercase tracking-widest text-gray-400">Google Analytics ID</Label>
                  </div>
                  <Input 
                    placeholder="G-XXXXXXXXXX" 
                    value={store.google_analytics_id || ''}
                    onChange={(e) => handleUpdate('google_analytics_id', e.target.value)}
                    className="h-11 rounded-xl bg-gray-50 border-none"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Facebook className="w-4 h-4 text-blue-600" />
                    <Label className="text-xs font-bold uppercase tracking-widest text-gray-400">Facebook Pixel ID</Label>
                  </div>
                  <Input 
                    placeholder="XXXXXXXXXXXX" 
                    value={store.facebook_pixel_id || ''}
                    onChange={(e) => handleUpdate('facebook_pixel_id', e.target.value)}
                    className="h-11 rounded-xl bg-gray-50 border-none"
                  />
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Advanced Scripts */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Code className="w-5 h-5 text-blue-600" />
              Scripts Personnalisés
            </h2>
            <Card className="border-gray-100 rounded-3xl shadow-sm overflow-hidden">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-gray-400">Scripts &lt;head&gt;</Label>
                  <Textarea 
                    placeholder="Ex: <script>...</script>" 
                    value={store.custom_head_scripts || ''}
                    onChange={(e) => handleUpdate('custom_head_scripts', e.target.value)}
                    className="rounded-xl bg-gray-50 border-none min-h-[100px] font-mono text-[10px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-gray-400">Scripts &lt;body&gt;</Label>
                  <Textarea 
                    placeholder="Ex: <script>...</script>" 
                    value={store.custom_body_scripts || ''}
                    onChange={(e) => handleUpdate('custom_body_scripts', e.target.value)}
                    className="rounded-xl bg-gray-50 border-none min-h-[100px] font-mono text-[10px]"
                  />
                </div>
              </CardContent>
            </Card>
          </section>

          <div className="p-6 rounded-[2rem] bg-gray-900 text-white shadow-xl">
            <ShieldCheck className="w-8 h-8 mb-4 text-emerald-400" />
            <h3 className="font-bold mb-2">Sécurité & RGPD</h3>
            <p className="text-xs text-gray-400 leading-relaxed">Toutes vos données et celles de vos clients sont protégées et conformes aux normes de sécurité.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
