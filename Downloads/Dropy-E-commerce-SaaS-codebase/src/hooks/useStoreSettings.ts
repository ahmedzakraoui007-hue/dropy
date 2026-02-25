// src/hooks/useStoreSettings.ts
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { StoreSettings } from '@/types/store-builder';
import { toast } from 'sonner';

export function useStoreSettings(sellerProfile: any) {
  const sellerId = sellerProfile?.id;
  const userId = sellerProfile?.user_id;
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!sellerId) return;

    async function fetchSettings() {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('seller_id', sellerId)
        .single();

      if (data) {
        setSettings(data);
      } else if (error && error.code === 'PGRST116') {
        // Not found, create default
        const { data: newSettings, error: createError } = await supabase
          .from('store_settings')
          .insert({ seller_id: sellerId })
          .select()
          .single();
        
        if (newSettings) setSettings(newSettings);
        if (createError) console.error('Error creating default settings:', createError);
      }
      setLoading(false);
    }

    fetchSettings();
  }, [sellerId, supabase]);

  const updateSettings = async (updates: Partial<StoreSettings>) => {
    try {
      // Update store_settings table
      const { data, error } = await supabase
        .from('store_settings')
        .update(updates)
        .eq('seller_id', sellerId)
        .select()
        .single();

      if (error) throw error;

      // Sync common fields to stores table (using vendor_id which is user_id)
      const storeFields = ['logo_url', 'primary_color', 'secondary_color', 'font_heading', 'font_body'];
      const storeUpdates: any = {};
      let hasStoreUpdates = false;

      storeFields.forEach(field => {
        if (field in updates) {
          storeUpdates[field] = (updates as any)[field];
          hasStoreUpdates = true;
        }
      });

      if (hasStoreUpdates && userId) {
        await supabase
          .from('stores')
          .update(storeUpdates)
          .eq('vendor_id', userId);
      }

      setSettings(data);
      toast.success('Paramètres enregistrés');
      return data;
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
      console.error(error);
      return null;
    }
  };

  return { settings, loading, updateSettings };
}
