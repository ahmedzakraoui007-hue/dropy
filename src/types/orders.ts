export type OrderStatus = 'new' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  order_number: string;
  store_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  customer_address: string;
  customer_governorate: string | null;
  status: OrderStatus;
  subtotal: number;
  discount_amount: number | null;
  shipping_cost: number | null;
  total_amount: number;
  payment_method: string | null;
  payment_status: string | null;
  tracking_number: string | null;
  shipping_company: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  notes: string | null;
  seller_notes: string | null;
  created_at: string;
  items?: OrderItem[];
  timeline?: OrderTimelineEntry[];
}

export interface OrderItem {
  id: string;
  store_product_id: string | null;
  product_name: string;
  product_image: string | null;
  variant_info: Record<string, string> | null;
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
  new: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: []
};
