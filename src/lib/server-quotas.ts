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
      .eq('seller_id', userId);
    currentCount = count || 0;
  } else if (type === 'maxProducts') {
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', userId);
    currentCount = count || 0;
  } else if (type === 'maxBriefsPerMonth') {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    
    const { count } = await supabase
      .from('content_briefs')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', userId)
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
