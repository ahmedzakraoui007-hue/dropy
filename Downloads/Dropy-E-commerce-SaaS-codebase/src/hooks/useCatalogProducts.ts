import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { CatalogProduct, Filters, PaginationState } from "@/types/catalog";
import { toast } from "sonner";

export function useCatalogProducts(filters: Filters, pagination: PaginationState) {
  const [data, setData] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    
    try {
      let query = supabase
        .from('product_catalog_stats')
        .select('*', { count: 'exact' });

      if (filters.category && filters.category !== 'all') query = query.eq('category', filters.category);
      if (filters.minPrice !== undefined) query = query.gte('base_price', filters.minPrice);
      if (filters.maxPrice !== undefined) query = query.lte('base_price', filters.maxPrice);
      if (filters.search) query = query.ilike('name', `%${filters.search}%`);
      if (filters.trending) query = query.eq('is_trending', true);

      // Pagination
      const from = pagination.page * pagination.pageSize;
      const to = from + pagination.pageSize - 1;
      query = query.range(from, to);

      // Sorting
      if (filters.sortBy === "price_asc") {
        query = query.order('base_price', { ascending: true });
      } else if (filters.sortBy === "price_desc") {
        query = query.order('base_price', { ascending: false });
      } else if (filters.sortBy === "margin") {
        // Since we can't order by a calculated column in real-time easily without another view or RPC, 
        // and trending is a good default
        query = query.order('is_trending', { ascending: false });
      } else {
        query = query.order('is_trending', { ascending: false });
      }

      const { data: products, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      setData(products as CatalogProduct[] || []);
      setTotalCount(count || 0);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching catalog products:", err);
      setError(err);
      toast.error("Erreur lors du chargement des produits");
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.pageSize]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { data, loading, error, totalCount, refresh: fetchProducts };
}
