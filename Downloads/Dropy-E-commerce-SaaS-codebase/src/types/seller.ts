export interface SellerProfile {
  id: string;
  user_id: string;
  store_name: string;
  store_slug: string;
  logo_url: string | null;
  is_verified: boolean;
  subscription_tier: 'free' | 'pro' | 'enterprise';
  created_at: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalVisitors: number;
  conversionRate: number;
  revenueChange: number;
  ordersChange: number;
}

export interface OnboardingChecklist {
  profile: boolean;
  store: boolean;
  products: boolean;
  payment: boolean;
  shipping: boolean;
  domain: boolean;
}
