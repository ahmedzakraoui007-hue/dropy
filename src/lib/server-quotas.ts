import { createClient } from '@/lib/supabase/client'; // Note: In server components/routes use server client
import { QUOTAS, getPlanFromStatus, SubscriptionPlan } from './quotas';

export async function checkQuota(
  supabase: any,
  userId: string,
  type: 'maxStores' | 'maxProducts' | 'maxBriefsPerMonth'
) {
  // Fetch user profile for plan
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_plan')
    .eq('id', userId)
    .single();

  const plan = getPlanFromStatus(profile?.subscription_plan);
  const limit = QUOTAS[plan][type];

  let currentCount = 0;

  if (type === 'maxStores') {
    const { count } = await supabase
      .from('stores')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', userId);
    currentCount = count || 0;
  } else if (type === 'maxProducts') {
    const { data: stores } = await supabase.from('stores').select('id').eq('vendor_id', userId);
    const ids = (stores || []).map((s: { id: string }) => s.id);
    const { count } = await supabase
      .from('store_products')
      .select('*', { count: 'exact', head: true })
      .in('store_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
    currentCount = count || 0;
  } else if (type === 'maxBriefsPerMonth') {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    
    const { data: stores } = await supabase.from('stores').select('id').eq('vendor_id', userId);
    const ids = (stores || []).map((s: { id: string }) => s.id);
    const { count } = await supabase
      .from('content_briefs')
      .select('*', { count: 'exact', head: true })
      .in('store_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000'])
      .gte('created_at', firstDayOfMonth);
    currentCount = count || 0;
  }

  return {
    allowed: currentCount < limit,
    current: currentCount,
    limit,
    plan
  };
}
