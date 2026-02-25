"use client";

import { useEffect, useState } from "react";
import {
  Palette,
  Type,
  ImageIcon,
  Check,
  Upload,
  Trash2,
  RefreshCw,
  Layout,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useThemes } from "@/hooks/store-builder/useThemes";
import { getThemeById } from "@/lib/themes";

export default function DesignPage() {
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();
  const { currentThemeId } = useThemes();
  const currentTheme = currentThemeId ? getThemeById(currentThemeId) : null;

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("seller_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();
        setSellerProfile(profile);
      }
    }
    loadProfile();
  }, [supabase]);

  const { settings, loading, updateSettings } = useStoreSettings(sellerProfile);

  if (loading || !sellerProfile) return <div className="p-8">Chargement...</div>;

  const handleUpdate = async (field: string, value: any) => {
    await updateSettings({ [field]: value });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image trop lourde (max 5MB)");
      return;
    }

    const fileExt = file.name.split('.').pop();
    // Use user_id for the folder to match RLS policy (auth.uid())
    const fileName = `${sellerProfile.user_id}/logo-${Math.random()}.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('store-assets')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('store-assets')
        .getPublicUrl(fileName);

      await handleUpdate('logo_url', publicUrl);
      toast.success("Logo uploadé !");
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(`Erreur upload: ${error.message || 'Problème inconnu'}`);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">DESIGN & THÈMES</h1>
          <p className="text-gray-500 font-medium">Personnalisez l'apparence de votre boutique</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Active Theme Info */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Layout className="w-5 h-5 text-purple-600" />
              Thème Actif
            </h2>

            {currentTheme ? (
              <Card className="border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/3 aspect-video relative bg-muted">
                    {currentTheme.thumbnail ? (
                      <img src={currentTheme.thumbnail} className="w-full h-full object-cover" alt={currentTheme.name} />
                    ) : (
                      <div className="w-full h-full p-4">
                        <div className="w-full h-full rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400">
                          Pas d'aperçu
                        </div>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-6 flex-1 flex flex-col justify-center">
                    <div className="mb-4">
                      <h3 className="font-black text-2xl text-gray-900">{currentTheme.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{currentTheme.description}</p>
                    </div>

                    <div className="bg-purple-50 text-purple-900 p-3 rounded-xl text-xs font-medium flex items-start gap-2">
                      <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
                      <div>
                        Ce thème définit l'apparence de base. Vous pouvez personnaliser les couleurs et polices ci-dessous pour le rendre unique.
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ) : (
              <Card className="border-dashed border-2 border-gray-200 shadow-none rounded-3xl p-8 text-center bg-gray-50">
                <p className="text-gray-500 mb-4">Aucun thème sélectionné.</p>
                <Button asChild>
                  <a href="/seller/store-builder/themes">Parcourir la galerie</a>
                </Button>
              </Card>
            )}
          </section>

          {/* Logo Upload */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-purple-600" />
              Logo de la boutique
            </h2>
            <Card className="border-gray-100 rounded-3xl overflow-hidden shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="w-40 h-40 rounded-3xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative group">
                    {settings?.logo_url ? (
                      <>
                        <img src={settings.logo_url} className="max-w-full max-h-full object-contain p-4" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button variant="destructive" size="icon" className="rounded-full" onClick={() => handleUpdate('logo_url', null)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-4">
                        <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Aperçu Logo</p>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-4 w-full">
                    <div className="space-y-1">
                      <h4 className="font-bold text-gray-900">Upload Logo</h4>
                      <p className="text-xs text-gray-500">Format PNG, JPG ou SVG recommandé. Taille max 2MB.</p>
                    </div>
                    <div className="flex gap-3">
                      <Button asChild className="bg-gray-900 hover:bg-black text-white font-bold rounded-xl h-11 px-6">
                        <label className="cursor-pointer">
                          <Upload className="w-4 h-4 mr-2" />
                          Choisir un fichier
                          <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                        </label>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        <div className="space-y-8">
          {/* Colors Customization */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Palette className="w-5 h-5 text-purple-600" />
              Couleurs
            </h2>
            <Card className="border-gray-100 rounded-3xl shadow-sm">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-widest text-gray-400">Couleur Primaire</Label>
                  <div className="flex gap-3">
                    <Input
                      type="color"
                      className="w-12 h-12 p-1 rounded-xl cursor-pointer"
                      value={settings?.primary_color || '#000000'}
                      onChange={(e) => handleUpdate('primary_color', e.target.value)}
                    />
                    <Input
                      className="flex-1 h-12 font-mono text-sm bg-gray-50 border-none rounded-xl"
                      value={settings?.primary_color || '#000000'}
                      onChange={(e) => handleUpdate('primary_color', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Typography */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Type className="w-5 h-5 text-purple-600" />
              Typographie
            </h2>
            <Card className="border-gray-100 rounded-3xl shadow-sm">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-widest text-gray-400">Police des Titres</Label>
                  <Select value={settings?.font_heading || 'Inter'} onValueChange={(v) => handleUpdate('font_heading', v)}>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter">Inter</SelectItem>
                      <SelectItem value="Poppins">Poppins</SelectItem>
                      <SelectItem value="Space Grotesk">Space Grotesk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}

