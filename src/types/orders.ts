export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';

export interface Order {
  id: string;
  order_number: string;
  seller_id: string;
  supplier_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_city: string;
  customer_governorate: string;
  status: OrderStatus;
  subtotal: number;
  shipping_cost: number;
  total: number;
  seller_profit: number;
  supplier_amount: number;
  platform_fee: number;
  tracking_number: string | null;
  shipping_carrier: string | null;
  confirmed_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  timeline?: OrderTimelineEntry[];
}

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  variant_name: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface OrderTimelineEntry {
  id: string;
  order_id: string;
  action: string;
  old_status: OrderStatus | null;
  new_status: OrderStatus | null;
  actor_id: string | null;
  actor_type: 'seller' | 'supplier' | 'system' | 'customer';
  note: string | null;
  created_at: string;
}

export interface OrderFilters {
  status: OrderStatus | 'all';
  search: string;
  dateFrom: Date | null;
  dateTo: Date | null;
  governorate: string | null;
}

export const SELLER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: [],
  shipped: [],
  delivered: ['returned'],
  cancelled: [],
  returned: []
};
