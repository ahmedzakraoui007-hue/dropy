import { createAdminClient } from "@/lib/supabase/admin";

const STORE_STATUS_FROM_SUPPLIER: Record<string, string> = {
  accepted: "confirmed",
  preparing: "preparing",
  ready_for_pickup: "preparing",
  shipped: "shipped",
  delivered: "delivered",
};

const STATUS_RANK = ["new", "confirmed", "preparing", "shipped", "delivered"];
const SUPPLIER_RANK = ["pending", "accepted", "preparing", "ready_for_pickup", "shipped", "delivered"];
const IGNORED_SUPPLIER_STATUSES = new Set(["rejected", "cancelled"]);

async function slowestSupplierStatus(storeOrderId: string, fallback: string) {
  const supabase = createAdminClient();
  const { data: items } = await supabase.from("store_order_items").select("supplier_order_id").eq("store_order_id", storeOrderId);
  const ids = [...new Set((items || []).map((i) => i.supplier_order_id).filter(Boolean))];
  if (ids.length <= 1) return fallback;
  const { data: parcels } = await supabase.from("supplier_orders").select("status").in("id", ids);
  const ranks = (parcels || [])
    .map((p) => String(p.status))
    .filter((s) => !IGNORED_SUPPLIER_STATUSES.has(s))
    .map((s) => Math.max(0, SUPPLIER_RANK.indexOf(s)));
  return ranks.length ? SUPPLIER_RANK[Math.min(...ranks)] : fallback;
}

const SELLER_MESSAGES: Record<string, string> = {
  confirmed: "a été acceptée par le fournisseur",
  shipped: "a été enlevée par le livreur",
  delivered: "a été livrée au client",
};

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

export async function parcelCodAmount(storeOrderId: string, supplierOrderId: string) {
  const supabase = createAdminClient();
  const [{ data: order }, { data: items }] = await Promise.all([
    supabase.from("store_orders").select("total_amount, shipping_cost, discount_amount, payment_method, has_own_products").eq("id", storeOrderId).maybeSingle(),
    supabase.from("store_order_items").select("supplier_order_id, total_price").eq("store_order_id", storeOrderId),
  ]);
  if (!order || order.payment_method !== "cod" || order.has_own_products) return 0;
  const parcels = [...new Set((items || []).map((i) => i.supplier_order_id).filter(Boolean))].sort();
  if (parcels.length <= 1) return Number(order.total_amount);
  const own = (items || []).filter((i) => i.supplier_order_id === supplierOrderId).reduce((sum, i) => sum + Number(i.total_price || 0), 0);
  const extra = parcels[0] === supplierOrderId ? Number(order.shipping_cost || 0) - Number(order.discount_amount || 0) : 0;
  return Math.max(0, Math.round((own + extra) * 1000) / 1000);
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

  for (const order of orders) {
    const overall = await slowestSupplierStatus(order.id, supplierStatus);
    const mapped = STORE_STATUS_FROM_SUPPLIER[overall];
    const update: Record<string, unknown> = { dropshipping_status: overall };

    if (!order.has_own_products) {
      if (mapped && STATUS_RANK.indexOf(mapped) > STATUS_RANK.indexOf(order.status) && order.status !== "cancelled") {
        update.status = mapped;
        if (mapped === "shipped") update.shipped_at = new Date().toISOString();
        if (mapped === "delivered") {
          update.delivered_at = new Date().toISOString();
          if (order.payment_method === "cod") update.payment_status = "paid";
        }
      }
      if (extra.tracking_number) update.tracking_number = extra.tracking_number;
      if (extra.shipping_company) update.shipping_company = extra.shipping_company;
      if (extra.estimated_delivery) update.estimated_delivery = extra.estimated_delivery;
    }

    await supabase.from("store_orders").update(update).eq("id", order.id);

    const message = typeof update.status === "string" ? SELLER_MESSAGES[update.status] : undefined;
    if (message) {
      const { data: store } = await supabase.from("stores").select("vendor_id").eq("id", order.store_id).maybeSingle();
      if (store?.vendor_id) {
        await supabase.from("notifications").insert({
          user_id: store.vendor_id,
          type: "order_update",
          title: "📦 Commande mise à jour",
          message: `La commande ${order.order_number} ${message}.`,
          link: `/seller/orders`,
          is_read: false,
        });
      }
    }
  }

  return orders;
}
