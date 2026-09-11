// src/hooks/useStorePages.ts
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { StorePage } from '@/types/store-builder';
import { toast } from 'sonner';

export function useStorePages(sellerId: string) {
  const [pages, setPages] = useState<StorePage[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchPages = async () => {
    const { data, error } = await supabase
      .from('store_pages')
      .select('*')
      .eq('seller_id', sellerId)
      .order('sort_order', { ascending: true });

    if (data) setPages(data);
    setLoading(false);
  };

  useEffect(() => {
    if (!sellerId) return;
    fetchPages();
  }, [sellerId, supabase]);

  const createPage = async (page: Partial<StorePage>) => {
    try {
      const { data, error } = await supabase
        .from('store_pages')
        .insert({ ...page, seller_id: sellerId })
        .select()
        .single();

      if (error) throw error;
      setPages([...pages, data]);
      toast.success('Page créée');
      return data;
    } catch (error) {
      toast.error('Erreur lors de la création');
      console.error(error);
      return null;
    }
  };

  const updatePage = async (id: string, updates: Partial<StorePage>) => {
    try {
      const { data, error } = await supabase
        .from('store_pages')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setPages(pages.map(p => p.id === id ? data : p));
      toast.success('Page mise à jour');
      return data;
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
      console.error(error);
      return null;
    }
  };

  const deletePage = async (id: string) => {
    try {
      const { error } = await supabase
        .from('store_pages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setPages(pages.filter(p => p.id !== id));
      toast.success('Page supprimée');
      return true;
    } catch (error) {
      toast.error('Erreur lors de la suppression');
      console.error(error);
      return false;
    }
  };

  return { pages, loading, createPage, updatePage, deletePage, refetch: fetchPages };
}
