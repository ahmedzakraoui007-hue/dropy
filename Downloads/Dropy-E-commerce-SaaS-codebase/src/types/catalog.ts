export interface CatalogProduct {
  id: string;
  name: string;
  base_price: number;
  suggested_price: number;
  market_avg_price: number;
  is_trending: boolean;
  category: string;
  images: string[];
  supplier_id: string;
  stock_quantity: number;
  categories: {
    name: string;
  };
  profiles: {
    full_name: string;
    avatar_url: string;
    city: string;
  };
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export interface Filters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  trending?: boolean;
  sortBy?: string;
}
