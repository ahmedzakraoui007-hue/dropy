import type { createAdminClient } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof createAdminClient>;

export async function confirmStoreOrder(admin: Admin, orderId: string, handledBy: string | null = null) {
  const now = new Date().toISOString();
  const { data: updated, error } = await admin
    .from("store_orders")
    .update({ status: "confirmed", confirmed_at: now, ...(handledBy ? { handled_by: handledBy } : {}) })
    .eq("id", orderId)
    .eq("status", "new")
    .select("id");
  if (error) throw error;
  if (!updated?.length) return false;

  const { data: links } = await admin.from("store_order_items").select("supplier_order_id").eq("store_order_id", orderId);
  const supplierOrderIds = [...new Set((links || []).map((l) => l.supplier_order_id).filter(Boolean))] as string[];
  if (!supplierOrderIds.length) return true;
  const { data: supplierOrders } = await admin
    .from("supplier_orders")
    .select("id, supplier_id, supplier_order_number, status")
    .in("id", supplierOrderIds)
    .eq("status", "awaiting_confirmation");

  for (const so of supplierOrders || []) {
    await admin.from("supplier_orders").update({ status: "pending", updated_at: now }).eq("id", so.id);
    await admin.from("notifications").insert({
      user_id: so.supplier_id,
      type: "new_order",
      title: "📦 Nouvelle commande",
      message: `Commande ${so.supplier_order_number} confirmée par le vendeur : à accepter et préparer.`,
      link: "/supplier/orders",
      is_read: false,
    });
  }
  return true;
}
