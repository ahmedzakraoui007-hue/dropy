export type OrderStatus = "new" | "confirmed" | "preparing" | "shipped" | "delivered" | "cancelled";

export const ORDER_STATUSES: OrderStatus[] = ["new", "confirmed", "preparing", "shipped", "delivered", "cancelled"];

export const CANCEL_REASONS = ["unreachable", "customer_cancelled", "fake_order", "out_of_stock", "other"] as const;

export type OrderItem = {
  id: string;
  store_product_id: string | null;
  product_name: string;
  product_image: string | null;
  variant_info: Record<string, string> | null;
  quantity: number;
  unit_price: number;
  total_price: number;
};

export type Order = {
  id: string;
  order_number: string;
  store_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_governorate: string | null;
  customer_delegation: string | null;
  status: OrderStatus;
  subtotal: number;
  discount_amount: number | null;
  shipping_cost: number | null;
  total_amount: number;
  tracking_number: string | null;
  shipping_company: string | null;
  notes: string | null;
  risk_flags: string[] | null;
  created_at: string;
  items?: OrderItem[];
};

export const ORDER_LIST_COLUMNS =
  "id, order_number, store_id, customer_name, customer_phone, customer_governorate, status, total_amount, risk_flags, created_at, items:store_order_items(id, product_name, product_image, quantity)";

export function variantText(info: Record<string, string> | null | undefined) {
  if (!info || typeof info !== "object") return "";
  return Object.values(info).filter(Boolean).join(" · ");
}
