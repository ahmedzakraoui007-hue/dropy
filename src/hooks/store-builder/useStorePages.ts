// src/hooks/store-builder/useStorePages.ts
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { StorePage, PageType } from '@/types/store-builder';
import { slugify } from '@/lib/utils';

export function useStorePages(sellerId: string) {
  const [pages, setPages] = useState<StorePage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      if (!sellerId) return;
      const supabase = createClient();
      const { data } = await supabase
        .from('store_pages')
        .select('*')
        .eq('seller_id', sellerId)
        .order('sort_order');
      
      setPages((data as StorePage[]) || []);
      setLoading(false);
    }
    fetch();
  }, [sellerId]);

  const createPage = async (page: Partial<StorePage>) => {
    if (!sellerId) return { data: null, error: 'No seller ID' };
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('store_pages')
      .insert({
        seller_id: sellerId,
        slug: page.slug || slugify(page.title || 'new-page'),
        title: page.title || 'Nouvelle page',
        page_type: page.page_type || 'content',
        is_published: false,
        sections: [],
        ...page
      })
      .select()
      .single();

    if (data) {
      setPages(prev => [...prev, data as StorePage]);
    }
    return { data, error };
  };

  const updatePage = async (pageId: string, updates: Partial<StorePage>) => {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('store_pages')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', pageId);

    if (!error) {
      setPages(prev => prev.map(p => p.id === pageId ? { ...p, ...updates } : p));
    }
    return !error;
  };

  const deletePage = async (pageId: string) => {
    const page = pages.find(p => p.id === pageId);
    if (page?.is_system) return false; // Impossible de supprimer pages système

    const supabase = createClient();
    const { error } = await supabase.from('store_pages').delete().eq('id', pageId);
    
    if (!error) {
      setPages(prev => prev.filter(p => p.id !== pageId));
    }
    return !error;
  };

  const setHomepage = async (pageId: string) => {
    const supabase = createClient();
    
    // Retirer l'ancien homepage
    await supabase
      .from('store_pages')
      .update({ is_homepage: false })
      .eq('seller_id', sellerId)
      .eq('is_homepage', true);

    // Définir le nouveau
    const { error } = await supabase
      .from('store_pages')
      .update({ is_homepage: true })
      .eq('id', pageId);

    if (!error) {
      setPages(prev => prev.map(p => ({
        ...p,
        is_homepage: p.id === pageId
      })));
    }
    return !error;
  };

  const reorderPages = async (orderedIds: string[]) => {
    const supabase = createClient();
    
    const updates = orderedIds.map((id, index) => ({
      id,
      sort_order: index,
      updated_at: new Date().toISOString()
    }));

    for (const update of updates) {
      await supabase
        .from('store_pages')
        .update({ sort_order: update.sort_order, updated_at: update.updated_at })
        .eq('id', update.id);
    }

    setPages(prev => {
      const sorted = [...prev].sort((a, b) => {
        const aIndex = orderedIds.indexOf(a.id);
        const bIndex = orderedIds.indexOf(b.id);
        return aIndex - bIndex;
      });
      return sorted;
    });
  };

  return {
    pages,
    loading,
    createPage,
    updatePage,
    deletePage,
    setHomepage,
    reorderPages,
    homepage: pages.find(p => p.is_homepage),
    publishedPages: pages.filter(p => p.is_published),
    draftPages: pages.filter(p => !p.is_published)
  };
}
