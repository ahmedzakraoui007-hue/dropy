"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { QUOTAS, getPlanFromStatus, PlanQuotas } from '@/lib/quotas';

export function useQuota() {
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState('starter');
  const [usage, setUsage] = useState<{
    stores: number;
    products: number;
    briefsThisMonth: number;
  }>({ stores: 0, products: 0, briefsThisMonth: 0 });

  const supabase = createClient();

  useEffect(() => {
    async function fetchUsage() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_plan')
        .eq('id', user.id)
        .single();

      const userPlan = getPlanFromStatus(profile?.subscription_plan);
      setPlan(userPlan);

        const { data: stores } = await supabase.from('stores').select('id').eq('vendor_id', user.id);
        const storeIds = (stores || []).map((s) => s.id);
        const ids = storeIds.length ? storeIds : ['00000000-0000-0000-0000-000000000000'];
        const [productsRes, briefsRes] = await Promise.all([
          supabase.from('store_products').select('*', { count: 'exact', head: true }).in('store_id', ids),
          supabase.from('content_briefs').select('*', { count: 'exact', head: true })
            .in('store_id', ids)
            .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
        ]);
        const storesRes = { count: storeIds.length };

      setUsage({
        stores: storesRes.count || 0,
        products: productsRes.count || 0,
        briefsThisMonth: briefsRes.count || 0
      });
      setLoading(false);
    }

    fetchUsage();
  }, []);

  const limits = QUOTAS[plan as keyof typeof QUOTAS];

  const check = (type: keyof PlanQuotas) => {
    if (loading) return true; // Assume okay while loading to prevent flicker
    
    if (type === 'maxStores') return usage.stores < limits.maxStores;
    if (type === 'maxProducts') return usage.products < limits.maxProducts;
    if (type === 'maxBriefsPerMonth') return usage.briefsThisMonth < limits.maxBriefsPerMonth;
    
    return true;
  };

  return {
    loading,
    plan,
    usage,
    limits,
    check
  };
}
