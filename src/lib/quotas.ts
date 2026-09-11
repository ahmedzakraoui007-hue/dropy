export type SubscriptionPlan = 'starter' | 'pro' | 'enterprise';

export interface PlanQuotas {
  maxStores: number;
  maxProducts: number;
  maxBriefsPerMonth: number;
  maxPages: number;
  storageLimitMB: number;
}

export const QUOTAS: Record<SubscriptionPlan, PlanQuotas> = {
  starter: {
    maxStores: 1,
    maxProducts: 50,
    maxBriefsPerMonth: 5,
    maxPages: 5,
    storageLimitMB: 500,
  },
  pro: {
    maxStores: 10, // Not truly unlimited but very high for practical "Unlimited" label
    maxProducts: 10000,
    maxBriefsPerMonth: 25,
    maxPages: 50,
    storageLimitMB: 5000,
  },
  enterprise: {
    maxStores: 100,
    maxProducts: 100000,
    maxBriefsPerMonth: 100,
    maxPages: 500,
    storageLimitMB: 50000,
  },
};

export const getPlanFromStatus = (plan: string | null): SubscriptionPlan => {
  if (!plan) return 'starter';
  const p = plan.toLowerCase();
  if (p === 'pro') return 'pro';
  if (p === 'enterprise') return 'enterprise';
  return 'starter';
};
