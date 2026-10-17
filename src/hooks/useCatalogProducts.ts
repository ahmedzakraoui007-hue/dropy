import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { CatalogProduct, Filters, PaginationState } from "@/types/catalog";
import { toast } from "sonner";
import { fetchProfileCards } from "@/lib/profile-cards";

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
        .from('products')
        .select('id, name, base_price, compare_price, images, supplier_id, stock_quantity, sub_category, gender, created_at', { count: 'exact' })
        .eq('is_active', true)
        .eq('status', 'approved');

      if (filters.category && filters.category !== 'all') query = query.eq('sub_category', filters.category);
      if (filters.minPrice !== undefined) query = query.gte('base_price', filters.minPrice);
      if (filters.maxPrice !== undefined) query = query.lte('base_price', filters.maxPrice);
      if (filters.search) query = query.ilike('name', `%${filters.search}%`);

      const from = pagination.page * pagination.pageSize;
      const to = from + pagination.pageSize - 1;
      query = query.range(from, to);

      if (filters.sortBy === "price_asc") {
        query = query.order('base_price', { ascending: true });
      } else if (filters.sortBy === "price_desc") {
        query = query.order('base_price', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data: rows, error: fetchError, count } = await query;
      if (fetchError) throw fetchError;

      const supplierIds = (rows || []).map((r) => r.supplier_id);
      const cards = await fetchProfileCards(supabase, supplierIds);
      const { data: reviews } = supplierIds.length
        ? await supabase.from('supplier_reviews').select('supplier_id, rating').in('supplier_id', supplierIds)
        : { data: [] as { supplier_id: string; rating: number }[] };
      const ratings = new Map<string, number[]>();
      for (const r of reviews || []) ratings.set(r.supplier_id, [...(ratings.get(r.supplier_id) || []), Number(r.rating)]);

      const products = (rows || []).map((r) => {
        const base = Number(r.base_price || 0);
        const suggested = Number(r.compare_price) > base ? Number(r.compare_price) : Math.round(base * 1.35 * 100) / 100;
        const supplierRatings = ratings.get(r.supplier_id) || [];
        return {
          ...r,
          suggested_price: suggested,
          market_avg_price: suggested,
          is_trending: false,
          category: r.sub_category || '',
          categories: { name: r.sub_category || '' },
          profiles: {
            full_name: cards.get(r.supplier_id)?.full_name || 'Fournisseur',
            avatar_url: cards.get(r.supplier_id)?.avatar_url || '',
            city: '',
          },
          supplier_rating: supplierRatings.length
            ? supplierRatings.reduce((a, b) => a + b, 0) / supplierRatings.length
            : null,
        };
      });

      setData(products as unknown as CatalogProduct[]);
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
