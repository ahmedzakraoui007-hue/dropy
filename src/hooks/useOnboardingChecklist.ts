import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { OnboardingChecklist } from '@/types/seller';

export function useOnboardingChecklist(sellerId: string) {
  const [checklist, setChecklist] = useState<OnboardingChecklist>({
    profile: false,
    store: false,
    products: false,
    online: false,
    payment: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStatus() {
      if (!sellerId) return;
      const supabase = createClient();

      try {
        const [profile, storeData] = await Promise.all([
          supabase.from('profiles').select('full_name, phone, bank_rib, d17_number, flouci_number').eq('id', sellerId).single(),
          supabase.from('stores').select('id, is_active, theme_config').eq('vendor_id', sellerId).order('created_at').limit(1).maybeSingle(),
        ]);

        let productsCount = 0;
        if (storeData.data?.id) {
          const { count } = await supabase
            .from('store_products')
            .select('id', { count: 'exact', head: true })
            .eq('store_id', storeData.data.id)
            .eq('is_active', true);
          productsCount = count ?? 0;
        }

        setChecklist({
          profile: Boolean(profile.data?.full_name && profile.data?.phone),
          store: Boolean((storeData.data?.theme_config as any)?.theme_id),
          products: productsCount > 0,
          online: storeData.data?.is_active === true,
          payment: Boolean(profile.data?.bank_rib || profile.data?.d17_number || profile.data?.flouci_number),
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
