import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Order, OrderStatus, OrderFilters } from '@/types/orders';

export function useOrders(sellerId: string, filters: OrderFilters) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<OrderStatus | 'all', number>>({
    all: 0, pending: 0, confirmed: 0, processing: 0,
    shipped: 0, delivered: 0, cancelled: 0, returned: 0
  });

  const fetchOrders = useCallback(async () => {
    if (!sellerId) return;
    const supabase = createClient();
    setLoading(true);
    try {
      let query = supabase
        .from('store_orders')
        .select(`
          *,
          items:store_order_items(*)
        `)
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.search) {
        query = query.or(`order_number.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%,customer_phone.ilike.%${filters.search}%`);
      }

      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom.toISOString());
      }

      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo.toISOString());
      }

      if (filters.governorate) {
        query = query.eq('customer_governorate', filters.governorate);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      setOrders(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [sellerId, filters]);

  const fetchCounts = useCallback(async () => {
    if (!sellerId) return;
    const supabase = createClient();
    const { data } = await supabase
      .from('store_orders')
      .select('status')
      .eq('seller_id', sellerId);

    if (data) {
      const newCounts: Record<OrderStatus | 'all', number> = {
        all: data.length,
        pending: 0,
        confirmed: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        returned: 0
      };
      data.forEach(o => {
        if (newCounts[o.status as OrderStatus] !== undefined) {
          newCounts[o.status as OrderStatus]++;
        }
      });
      setCounts(newCounts);
    }
  }, [sellerId]);

  useEffect(() => {
    fetchOrders();
    fetchCounts();
  }, [fetchOrders, fetchCounts]);

  return { orders, loading, error, counts, refetch: fetchOrders };
}
