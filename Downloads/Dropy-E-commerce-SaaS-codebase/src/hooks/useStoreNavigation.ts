// src/hooks/useStoreNavigation.ts
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { NavigationItem } from '@/types/store-builder';
import { toast } from 'sonner';

export function useStoreNavigation(sellerId: string) {
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchNavigation = async () => {
    const { data, error } = await supabase
      .from('store_navigation')
      .select('*')
      .eq('seller_id', sellerId)
      .order('sort_order', { ascending: true });

    if (data) setNavigationItems(data);
    setLoading(false);
  };

  useEffect(() => {
    if (!sellerId) return;
    fetchNavigation();
  }, [sellerId, supabase]);

  const addNavigationItem = async (item: Partial<NavigationItem>) => {
    try {
      const { data, error } = await supabase
        .from('store_navigation')
        .insert({ ...item, seller_id: sellerId })
        .select()
        .single();

      if (error) throw error;
      setNavigationItems([...navigationItems, data]);
      toast.success('Lien ajouté');
      return data;
    } catch (error) {
      toast.error('Erreur lors de l\'ajout');
      console.error(error);
      return null;
    }
  };

  const updateNavigationItem = async (id: string, updates: Partial<NavigationItem>) => {
    try {
      const { data, error } = await supabase
        .from('store_navigation')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setNavigationItems(navigationItems.map(item => item.id === id ? data : item));
      toast.success('Lien mis à jour');
      return data;
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
      console.error(error);
      return null;
    }
  };

  const deleteNavigationItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('store_navigation')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setNavigationItems(navigationItems.filter(item => item.id !== id));
      toast.success('Lien supprimé');
      return true;
    } catch (error) {
      toast.error('Erreur lors de la suppression');
      console.error(error);
      return false;
    }
  };

  return { 
    navigationItems, 
    loading, 
    addNavigationItem, 
    updateNavigationItem, 
    deleteNavigationItem, 
    refetch: fetchNavigation 
  };
}
