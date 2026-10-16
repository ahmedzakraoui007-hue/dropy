import { createAdminClient } from "@/lib/supabase/admin";

const STORE_STATUS_FROM_SUPPLIER: Record<string, string> = {
  accepted: "confirmed",
  preparing: "preparing",
  ready_for_pickup: "preparing",
  shipped: "shipped",
  delivered: "delivered",
};

const STATUS_RANK = ["new", "confirmed", "preparing", "shipped", "delivered"];

export async function linkedStoreOrders(supplierOrderId: string) {
  const supabase = createAdminClient();
  const { data: items } = await supabase
    .from("store_order_items")
    .select("store_order_id")
    .eq("supplier_order_id", supplierOrderId);
  const ids = new Set((items || []).map((i) => i.store_order_id));

  const { data: direct } = await supabase.from("store_orders").select("id").eq("supplier_order_id", supplierOrderId);
  for (const o of direct || []) ids.add(o.id);

  if (!ids.size) return [];
  const { data: orders } = await supabase
    .from("store_orders")
    .select("id, order_number, status, total_amount, payment_method, has_own_products, customer_name, customer_phone, customer_address, customer_governorate, store_id")
    .in("id", [...ids]);
  return orders || [];
}

export async function syncStoreOrdersFromSupplier(
  supplierOrderId: string,
  supplierStatus: string,
  extra: { tracking_number?: string; shipping_company?: string; estimated_delivery?: string } = {}
) {
  const supabase = createAdminClient();
  const itemStatus = supplierStatus === "ready_for_pickup" ? "ready" : supplierStatus;

  await supabase.from("store_order_items").update({ item_status: itemStatus }).eq("supplier_order_id", supplierOrderId);

  const orders = await linkedStoreOrders(supplierOrderId);
  const mapped = STORE_STATUS_FROM_SUPPLIER[supplierStatus];

  for (const order of orders) {
    const update: Record<string, unknown> = { dropshipping_status: supplierStatus };

    if (!order.has_own_products) {
      if (mapped && STATUS_RANK.indexOf(mapped) > STATUS_RANK.indexOf(order.status) && order.status !== "cancelled") {
        update.status = mapped;
        if (mapped === "shipped") update.shipped_at = new Date().toISOString();
        if (mapped === "delivered") update.delivered_at = new Date().toISOString();
      }
      if (extra.tracking_number) update.tracking_number = extra.tracking_number;
      if (extra.shipping_company) update.shipping_company = extra.shipping_company;
      if (extra.estimated_delivery) update.estimated_delivery = extra.estimated_delivery;
    }

    await supabase.from("store_orders").update(update).eq("id", order.id);
  }

  return orders;
}
