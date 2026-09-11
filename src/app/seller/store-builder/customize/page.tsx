// src/app/seller/store-builder/customize/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useStoreConfig } from '@/hooks/store-builder/useStoreConfig';
import { ColorPicker } from '@/components/store-builder/ColorPicker';
import { FontPicker } from '@/components/store-builder/FontPicker';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Palette, Type, ImageIcon, Upload, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function CustomizePage() {
  const [sellerId, setSellerId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('seller_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();
        if (profile) setSellerId(profile.id);
      }
    }
    load();
  }, [supabase]);

  const { 
    config, 
    loading, 
    saving, 
    updateColors, 
    updateTypography, 
    uploadAsset,
    updateConfig 
  } = useStoreConfig(sellerId || '');

  if (loading || !sellerId) return <div className="p-8">Chargement...</div>;

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'logo_dark' | 'favicon') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const url = await uploadAsset(file, type);
    if (url) toast.success("Fichier mis à jour !");
    else toast.error("Erreur lors de l'upload");
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link 
            href="/seller/store-builder" 
            className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 hover:text-primary transition-colors mb-2"
          >
            <ArrowLeft className="w-3 h-3" /> Dashboard
          </Link>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase flex items-center gap-3">
            Personnalisation
            <Palette className="w-6 h-6 text-primary" />
          </h1>
          <p className="text-gray-500 font-medium">Configurez l'identité visuelle de votre boutique</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonne Gauche: Couleurs et Typo */}
        <div className="lg:col-span-2 space-y-8">
          {/* Couleurs */}
          <Card className="border-none shadow-xl shadow-gray-200/50 rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-gray-50 p-6">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                Palette de Couleurs
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ColorPicker 
                  label="Couleur Primaire" 
                  value={config?.colors?.primary || '#000000'} 
                  onChange={(color) => updateColors({ primary: color })}
                />
                <ColorPicker 
                  label="Couleur d'Accent" 
                  value={config?.colors?.accent || '#3b82f6'} 
                  onChange={(color) => updateColors({ accent: color })}
                />
                <ColorPicker 
                  label="Fond de page" 
                  value={config?.colors?.background || '#ffffff'} 
                  onChange={(color) => updateColors({ background: color })}
                />
                <ColorPicker 
                  label="Texte principal" 
                  value={config?.colors?.text || '#111111'} 
                  onChange={(color) => updateColors({ text: color })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Typographie */}
          <Card className="border-none shadow-xl shadow-gray-200/50 rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-gray-50 p-6">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Type className="w-5 h-5 text-primary" />
                Typographie
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FontPicker 
                  label="Police des Titres" 
                  value={config?.typography?.heading_font || 'Inter'} 
                  type="heading"
                  onChange={(font) => updateTypography({ heading_font: font })}
                />
                <FontPicker 
                  label="Police de Corps" 
                  value={config?.typography?.body_font || 'Inter'} 
                  type="body"
                  onChange={(font) => updateTypography({ body_font: font })}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Colonne Droite: Logo et Favicon */}
        <div className="space-y-8">
          <Card className="border-none shadow-xl shadow-gray-200/50 rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-gray-50 p-6">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-primary" />
                Logos & Identité
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Logo Principal */}
              <div className="space-y-4">
                <Label className="text-xs font-bold uppercase tracking-widest text-gray-400">Logo Principal</Label>
                <div className="relative aspect-video bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100 flex items-center justify-center group overflow-hidden">
                  {config?.logo_url ? (
                    <>
                      <img src={config.logo_url} alt="Logo" className="max-h-full max-w-full p-4 object-contain" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button size="icon" variant="destructive" className="rounded-full" onClick={() => updateConfig({ logo_url: null })}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                      <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Cliquez pour uploader</p>
                    </div>
                  )}
                  <input 
                    type="file" 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    accept="image/*" 
                    onChange={(e) => handleLogoUpload(e, 'logo')}
                  />
                </div>
              </div>

              {/* Favicon */}
              <div className="space-y-4">
                <Label className="text-xs font-bold uppercase tracking-widest text-gray-400">Favicon (32x32)</Label>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center overflow-hidden">
                    {config?.favicon_url ? (
                      <img src={config.favicon_url} alt="Favicon" className="w-8 h-8 object-contain" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-gray-200" />
                    )}
                  </div>
                  <Button variant="outline" className="rounded-xl relative">
                    Modifier
                    <input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      accept="image/*" 
                      onChange={(e) => handleLogoUpload(e, 'favicon')}
                    />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
