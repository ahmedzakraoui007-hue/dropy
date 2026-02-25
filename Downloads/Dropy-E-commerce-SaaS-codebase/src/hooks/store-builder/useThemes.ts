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

        const { data: config } = await supabase
          .from('store_configs')
          .select('theme_id')
          .eq('seller_id', user.id)
          .single();

        if (config?.theme_id) {
          setCurrentThemeId(config.theme_id);
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
    console.log('🎨 Applying theme:', theme.id, theme.name);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ User not authenticated');
        throw new Error('Non authentifié');
      }

      console.log('👤 User ID:', user.id);

      // 0. Récupérer le store_id et le nom
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id, name')
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

      console.log('📝 Config data to save:', configData);

      const { error: configError } = await supabase
        .from('store_configs')
        .upsert(configData, {
          onConflict: 'seller_id',
        });

      if (configError) {
        console.error('[applyTheme] Config Error:', configError);
        throw new Error(`Erreur config: ${configError.message} (${configError.code})`);
      }

      console.log('✅ Config saved successfully');

      // 2. Vérifier si des pages existent déjà pour ce store
      const { data: existingPages, error: queryError } = await supabase
        .from('store_pages')
        .select('id')
        .eq('store_id', store.id);

      if (queryError) {
        console.error('[applyTheme] Query Error:', queryError);
        throw new Error(`Erreur query: ${queryError.message}`);
      }

      console.log('📄 Existing pages:', existingPages?.length || 0);

      // 3. Si aucune page, créer les pages par défaut du thème
      if (!existingPages || existingPages.length === 0) {
        if (theme.defaultSections && theme.defaultSections.length > 0) {
          console.log('[applyTheme] Creating default pages...');

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
              page_type: 'home',
              sections: sectionsPayload,
              is_published: true,
              is_visible_in_menu: true,
              menu_order: 1
            });

          if (pageError) {
            console.error('[applyTheme] Page Insert Error:', pageError);
            throw new Error(`Erreur insertion pages: ${pageError.message}`);
          }
          console.log('✅ Default pages created');
        } else {
          console.log('⚠️ Theme has no defaultSections');
        }
      } else {
        console.log('Pages existantes conservées.');
      }

      setCurrentThemeId(theme.id);
      toast.success(`Thème "${theme.name}" appliqué avec succès !`);

      console.log('🔄 Redirecting to /design...');
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
