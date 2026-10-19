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

        const { data: sellerProfile } = await supabase
          .from('seller_profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        const { data: config } = await supabase
          .from('store_configs')
          .select('theme_id')
          .in('seller_id', [user.id, sellerProfile?.id].filter(Boolean) as string[])
          .limit(1)
          .maybeSingle();

        const { data: storeRow } = await supabase
          .from('stores')
          .select('theme_config')
          .eq('vendor_id', user.id)
          .maybeSingle();
        const storeThemeId = (storeRow?.theme_config as any)?.theme_id;
        if (storeThemeId || config?.theme_id) {
          setCurrentThemeId(storeThemeId || config?.theme_id);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadCurrentTheme();
  }, [supabase]);

  // Appliquer un thème
  const applyTheme = async (theme: Theme) => {
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
        .single();

      if (storeError || !store) {
        console.error('❌ Store not found:', storeError);
        throw new Error('Boutique introuvable');
      }

      // 1. Mettre à jour store_configs avec les valeurs du thème
      const configData = {
        seller_id: user.id,
        theme_id: theme.id,
        store_name: store.name,
        colors: theme.colors,         // Ensure colors are passed
        typography: theme.typography, // Ensure typography is passed
        layout: theme.layout,         // Ensure layout is passed
        updated_at: new Date().toISOString(),
      };


      const { data: sellerProfile } = await supabase
        .from('seller_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      const ownerIds = [user.id, sellerProfile?.id].filter(Boolean) as string[];
      const { data: existingConfig } = await supabase
        .from('store_configs')
        .select('id')
        .in('seller_id', ownerIds)
        .limit(1)
        .maybeSingle();

      const { error: configError } = existingConfig
        ? await supabase.from('store_configs').update({ ...configData, seller_id: undefined }).eq('id', existingConfig.id)
        : await supabase.from('store_configs').insert({ ...configData, seller_id: sellerProfile?.id ?? user.id });

      if (configError) {
        console.error('[applyTheme] Config Error:', configError);
        throw new Error(`Erreur config: ${configError.message} (${configError.code})`);
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

      // 2. Vérifier si des pages existent déjà pour ce store
      const { data: existingPages, error: queryError } = await supabase
        .from('store_pages')
        .select('id')
        .eq('store_id', store.id);

      if (queryError) {
        console.error('[applyTheme] Query Error:', queryError);
        throw new Error(`Erreur query: ${queryError.message}`);
      }


      // 3. Si aucune page, créer les pages par défaut du thème
      if (!existingPages || existingPages.length === 0) {
        if (theme.defaultSections && theme.defaultSections.length > 0) {

          // Map sections to ensure valid JSON structure if needed
          const sectionsPayload = theme.defaultSections.map(s => ({
            ...s,
            id: s.id || crypto.randomUUID()
          }));

          const { error: pageError } = await supabase
            .from('store_pages')
            .insert({
              store_id: store.id,
              slug: 'home',
              title: 'Accueil',
              page_type: 'content',
              sections: sectionsPayload,
              is_published: true,
              is_homepage: true,
              show_in_navigation: true,
              sort_order: 0
            });

          if (pageError) {
            console.error('[applyTheme] Page Insert Error:', pageError);
            throw new Error(`Erreur insertion pages: ${pageError.message}`);
          }
        } else {
        }
      } else {
      }

      setCurrentThemeId(theme.id);
      toast.success(`Thème "${theme.name}" appliqué avec succès !`);

      router.push('/seller/store-builder/design');
      router.refresh(); // Force reload to ensure /design gets new colors

    } catch (error: any) {
      console.error('Error applying theme (Full details):', JSON.stringify(error, null, 2));
      console.error('Error applying theme (Message):', error?.message);

      const errorMessage = error?.message || 'Erreur inconnue lors de l\'application';

      // Specific handling for UUID error (Migration missing)
      if (error?.message?.includes('invalid input syntax for type uuid') || error?.code === '22P02') {
        toast.error("⚠️ MIGRATION REQUISE: La base de données attend un UUID. Veuillez exécuter le script SQL 'urgent_fix_theme_id.sql'.", {
          duration: 10000,
        });
      } else {
        toast.error(`Erreur: ${errorMessage}`);
      }
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
