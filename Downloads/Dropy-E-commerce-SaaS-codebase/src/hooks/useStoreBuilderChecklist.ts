// src/hooks/useStoreBuilderChecklist.ts
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { StoreBuilderChecklist } from '@/types/store-builder';

export function useStoreBuilderChecklist(sellerId: string) {
  const [checklist, setChecklist] = useState<StoreBuilderChecklist | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!sellerId) return;

    async function fetchChecklist() {
      try {
        const [settings, pages, navigation, domains] = await Promise.all([
          supabase.from('store_settings').select('logo_url, primary_color, hero_image_url').eq('seller_id', sellerId).single(),
          supabase.from('store_pages').select('id, is_homepage, is_published').eq('seller_id', sellerId),
          supabase.from('store_navigation').select('id, location').eq('seller_id', sellerId).eq('is_visible', true),
          supabase.from('store_domains').select('domain, is_verified, is_primary').eq('seller_id', sellerId).eq('is_primary', true).maybeSingle()
        ]);

        const designComplete = !!(settings.data?.logo_url && settings.data?.hero_image_url);
        const pagesData = pages.data || [];
        const pagesComplete = pagesData.length >= 1 && pagesData.some(p => p.is_homepage);
        const navData = navigation.data || [];
        const navComplete = navData.filter(n => n.location === 'header').length >= 1;
        const domainComplete = !!domains.data?.is_verified;

        const completedSteps = [designComplete, pagesComplete, navComplete, domainComplete].filter(Boolean).length;

        setChecklist({
          design: {
            completed: designComplete,
            details: {
              hasLogo: !!settings.data?.logo_url,
              hasColors: !!settings.data?.primary_color,
              hasHero: !!settings.data?.hero_image_url
            }
          },
          pages: {
            completed: pagesComplete,
            count: pagesData.length,
            hasHomepage: pagesData.some(p => p.is_homepage)
          },
          navigation: {
            completed: navComplete,
            headerCount: navData.filter(n => n.location === 'header').length,
            footerCount: navData.filter(n => n.location === 'footer').length
          },
          domain: {
            completed: domainComplete,
            domain: domains.data?.domain || null,
            isVerified: !!domains.data?.is_verified
          },
          overall: Math.round((completedSteps / 4) * 100)
        });
      } catch (error) {
        console.error('Error fetching store builder checklist:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchChecklist();
  }, [sellerId, supabase]);

  return { checklist, loading };
}
