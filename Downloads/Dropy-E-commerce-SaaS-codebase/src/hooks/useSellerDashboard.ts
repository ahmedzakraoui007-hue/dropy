import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DashboardStats, SellerProfile } from '@/types/seller';
import { toast } from 'sonner';

export function useSellerDashboard(sellerId: string) {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalVisitors: 0,
    conversionRate: 0,
    revenueChange: 0,
    ordersChange: 0,
  });
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!sellerId) return;
    const supabase = createClient();

    try {
      // Fetch Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sellerId)
        .single();

      if (profileData) {
        setProfile({
          id: profileData.id,
          user_id: profileData.id,
          store_name: profileData.full_name || '',
          store_slug: '', // Will be updated if store found
          logo_url: profileData.avatar_url,
          is_verified: profileData.status === 'verified',
          subscription_tier: (profileData.subscription_plan as any) || 'free',
          created_at: profileData.created_at,
        });
      }

      // Fetch Store to get store_id for orders
      const { data: store } = await supabase
        .from('stores')
        .select('id, slug')
        .eq('vendor_id', sellerId)
        .single();

      if (store) {
        setProfile(prev => prev ? { ...prev, store_slug: store.slug } : null);

        // Date ranges for "This Month" and "Last Month"
        const now = new Date();
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString(); // Last day of prev month

        // Fetch Orders
        const { data: orders } = await supabase
          .from('store_orders')
          .select('status, total_amount, created_at')
          .eq('store_id', store.id)
          .gte('created_at', startOfLastMonth); // Fetch last 2 months approx

        // Fetch Visitors
        const { data: visits } = await supabase
          .from('store_visits')
          .select('created_at')
          .eq('store_id', store.id)
          .gte('created_at', startOfLastMonth);

        if (orders && visits) {
          // --- Calculate This Month Stats ---
          const thisMonthOrders = orders.filter(o => o.created_at >= startOfThisMonth);
          const thisMonthRevenue = thisMonthOrders
            .filter(o => o.status === 'delivered' || o.status === 'shipped')
            .reduce((sum, o) => sum + Number(o.total_amount), 0);

          const thisMonthVisits = visits.filter(v => v.created_at >= startOfThisMonth).length;
          const conversionRate = thisMonthVisits > 0
            ? (thisMonthOrders.length / thisMonthVisits) * 100
            : 0;

          // --- Calculate Last Month Stats (for change %) ---
          const lastMonthOrders = orders.filter(o => o.created_at >= startOfLastMonth && o.created_at <= endOfLastMonth);
          const lastMonthRevenue = lastMonthOrders
            .filter(o => o.status === 'delivered' || o.status === 'shipped')
            .reduce((sum, o) => sum + Number(o.total_amount), 0);

          // Calculate Changes
          const revenueChange = lastMonthRevenue > 0
            ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
            : thisMonthRevenue > 0 ? 100 : 0;

          const ordersChange = lastMonthOrders.length > 0
            ? ((thisMonthOrders.length - lastMonthOrders.length) / lastMonthOrders.length) * 100
            : thisMonthOrders.length > 0 ? 100 : 0;

          setStats({
            totalRevenue: thisMonthRevenue,
            totalOrders: thisMonthOrders.length,
            totalVisitors: thisMonthVisits,
            conversionRate: parseFloat(conversionRate.toFixed(1)),
            revenueChange: parseFloat(revenueChange.toFixed(1)),
            ordersChange: parseFloat(ordersChange.toFixed(1)),
          });
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Real-time listener
  useEffect(() => {
    if (!sellerId) return;
    const supabase = createClient();

    const channel = supabase
      .channel('new-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'store_orders',
        },
        async (payload) => {
          // Verify if this order belongs to the seller's store
          const { data: store } = await supabase
            .from('stores')
            .select('id')
            .eq('vendor_id', sellerId)
            .single();

          if (store && payload.new.store_id === store.id) {
            toast.success(`Nouvelle commande ! ${payload.new.total_amount} TND`);
            fetchStats();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sellerId, fetchStats]);

  return { stats, profile, loading, refetchStats: fetchStats };
}
