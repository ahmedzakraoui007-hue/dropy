'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { themes, getThemeById } from '@/lib/themes';
import { Theme } from '@/types/themes';
import { toast } from 'sonner';

export function useThemes() {
  const [currentThemeId, setCurrentThemeId] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  // Charger le thème actuel
  useEffect(() => {
    async function loadCurrentTheme() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: storeRow } = await supabase
          .from('stores')
          .select('theme_config')
          .eq('vendor_id', user.id)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();
        const storeThemeId = (storeRow?.theme_config as any)?.theme_id;
        if (storeThemeId) setCurrentThemeId(storeThemeId);
      } catch (error) {
        console.error('Error loading theme:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadCurrentTheme();
  }, [supabase]);

  // Appliquer un thème
  const applyTheme = async (theme: Theme, options: { replaceHome?: boolean } = {}) => {
    setIsApplying(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ User not authenticated');
        throw new Error('Non authentifié');
      }


      // 0. Récupérer le store_id et le nom
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id, name, theme_config')
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: true }).limit(1).maybeSingle();

      if (storeError || !store) {
        console.error('❌ Store not found:', storeError);
        throw new Error('Boutique introuvable');
      }

      const firstFont = (f?: string) => (f || '').replace(/['"]/g, '').split(',')[0].trim() || 'Inter';
      const radiusPx = parseFloat(theme.layout?.borderRadius || '8');
      const current = (store.theme_config || {}) as Record<string, any>;
      const { error: storeThemeError } = await supabase
        .from('stores')
        .update({
          theme_config: {
            ...current,
            theme_id: theme.id,
            colors: {
              ...(current.colors || {}),
              primary: theme.colors.primary,
              secondary: theme.colors.secondary,
              accent: theme.colors.accent,
              background: theme.colors.background,
              text: theme.colors.text,
            },
            typography: {
              ...(current.typography || {}),
              fontHeading: firstFont(theme.typography?.headingFont),
              fontBody: firstFont(theme.typography?.bodyFont),
            },
            fonts: { heading: firstFont(theme.typography?.headingFont), body: firstFont(theme.typography?.bodyFont) },
            spacing: { ...(current.spacing || {}), borderRadius: radiusPx <= 0 ? 'none' : radiusPx >= 999 ? 'full' : 'md' },
          },
        })
        .eq('id', store.id);
      if (storeThemeError) throw new Error(`Erreur thème boutique: ${storeThemeError.message}`);

      const homeSections = (theme.defaultSections || []).map((section) => ({
        ...section,
        id: crypto.randomUUID(),
      }));

      const { data: homePage, error: queryError } = await supabase
        .from('store_pages')
        .select('id')
        .eq('store_id', store.id)
        .eq('is_homepage', true)
        .order('sort_order', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (queryError) throw new Error(`Erreur pages: ${queryError.message}`);

      if (!homePage && homeSections.length > 0) {
        const { error: pageError } = await supabase.from('store_pages').insert({
          store_id: store.id,
          slug: 'home',
          title: 'Accueil',
          page_type: 'content',
          sections: homeSections,
          is_published: true,
          is_homepage: true,
          show_in_navigation: true,
          sort_order: 0,
        });
        if (pageError) throw new Error(`Erreur page d'accueil: ${pageError.message}`);
      } else if (homePage && options.replaceHome && homeSections.length > 0) {
        const { error: pageError } = await supabase
          .from('store_pages')
          .update({ sections: homeSections })
          .eq('id', homePage.id);
        if (pageError) throw new Error(`Erreur page d'accueil: ${pageError.message}`);
      }

      setCurrentThemeId(theme.id);
      toast.success(`Thème "${theme.name}" appliqué avec succès !`);

      router.push('/seller/store-builder/builder');

    } catch (error: any) {
      console.error('Error applying theme (Full details):', JSON.stringify(error, null, 2));
      console.error('Error applying theme (Message):', error?.message);

      const errorMessage = error?.message || 'Erreur inconnue lors de l\'application';

      toast.error(`Erreur: ${errorMessage}`);
    } finally {
      setIsApplying(false);
    }
  };

  return {
    themes,           // Liste de tous les thèmes disponibles
    currentThemeId,   // ID du thème actuellement appliqué
    isApplying,       // État de chargement
    isLoading,
    applyTheme,       // Fonction pour appliquer un thème
    getThemeById,     // Helper pour récupérer un thème par ID
  };
}
