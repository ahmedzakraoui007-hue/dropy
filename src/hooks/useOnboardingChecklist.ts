import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { OnboardingChecklist } from '@/types/seller';

export function useOnboardingChecklist(sellerId: string) {
  const [checklist, setChecklist] = useState<OnboardingChecklist>({
    profile: false,
    store: false,
    products: false,
    payment: false,
    shipping: false,
    domain: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStatus() {
      if (!sellerId) return;
      
      const supabase = createClient();
      
      try {
        const [profile, storeData] = await Promise.all([
          supabase.from('profiles').select('full_name, avatar_url, bank_rib').eq('id', sellerId).single(),
          supabase.from('stores').select('id, pickup_address, custom_domain').eq('vendor_id', sellerId).order('created_at').limit(1).maybeSingle(),
        ]);

        const storeId = storeData.data?.id;
        let finalProductsCount = 0;
        let finalPagesCount = 0;

        if (storeId) {
          const [storeProducts, storePages] = await Promise.all([
            supabase.from('store_products').select('id', { count: 'exact', head: true }).eq('store_id', storeId),
            supabase.from('store_pages').select('id', { count: 'exact', head: true }).eq('store_id', storeId),
          ]);
          finalProductsCount = storeProducts.count ?? finalProductsCount;
          finalPagesCount = storePages.count ?? finalPagesCount;
        }

        setChecklist({
          profile: !!profile.data?.full_name && !!profile.data?.avatar_url,
          store: finalPagesCount > 0,
          products: finalProductsCount > 0,
          payment: !!profile.data?.bank_rib,
          shipping: !!storeData.data?.pickup_address,
          domain: !!storeData.data?.custom_domain,
        });
      } catch (error) {
        console.error('Error fetching onboarding status:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStatus();
  }, [sellerId]);

  return { checklist, loading };
}
