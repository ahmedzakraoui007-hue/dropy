import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { linkedStoreOrders } from "@/lib/order-sync";

const REASONS = ["out_of_stock", "discontinued", "cannot_ship", "other"] as const;
const REASON_LABELS: Record<(typeof REASONS)[number], string> = {
  out_of_stock: "rupture de stock",
  discontinued: "produit arrêté",
  cannot_ship: "expédition impossible",
  other: "autre raison",
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const reason = REASONS.includes(body?.reason) ? (body.reason as (typeof REASONS)[number]) : "other";
  const note = typeof body?.note === "string" ? body.note.trim().slice(0, 300) : "";

  const { data: order } = await supabase
    .from("supplier_orders")
    .select("id, supplier_order_number, status")
    .eq("id", id)
    .eq("supplier_id", user.id)
    .maybeSingle();
  if (!order) return NextResponse.json({ error: "Commande non trouvée" }, { status: 404 });
  if (!["pending", "accepted", "preparing"].includes(order.status)) {
    return NextResponse.json({ error: "Cette commande ne peut plus être refusée" }, { status: 409 });
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();
  const rejection = note ? `${REASON_LABELS[reason]} : ${note}` : REASON_LABELS[reason];
  const { data: updated, error } = await admin
    .from("supplier_orders")
    .update({ status: "rejected", rejection_reason: rejection, updated_at: now })
    .eq("id", id)
    .in("status", ["pending", "accepted", "preparing"])
    .select("id");
  if (error || !updated?.length) return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });

  const { data: items } = await admin.from("supplier_order_items").select("product_id, quantity").eq("supplier_order_id", id);
  await admin.from("supplier_order_items").update({ status: "rejected" }).eq("supplier_order_id", id);
  for (const item of items || []) {
    if (!item.product_id || !item.quantity) continue;
    const { data: product } = await admin.from("products").select("stock_quantity").eq("id", item.product_id).maybeSingle();
    if (product && product.stock_quantity != null) {
      const next = Number(product.stock_quantity) + Number(item.quantity);
      await admin.from("products").update({ stock_quantity: next }).eq("id", item.product_id);
      await admin.from("store_products").update({ stock_quantity: next }).eq("product_id", item.product_id).eq("is_dropship", true);
    }
  }

  await admin.from("store_order_items").update({ item_status: "rejected" }).eq("supplier_order_id", id);
  const storeOrders = await linkedStoreOrders(id);
  for (const storeOrder of storeOrders) {
    await admin.from("store_orders").update({ dropshipping_status: "rejected" }).eq("id", storeOrder.id);
    const { data: store } = await admin.from("stores").select("vendor_id").eq("id", storeOrder.store_id).maybeSingle();
    if (store?.vendor_id) {
      await admin.from("notifications").insert({
        user_id: store.vendor_id,
        type: "order_update",
        title: "⚠️ Commande refusée par le fournisseur",
        message: `Le fournisseur ne peut pas livrer la commande ${storeOrder.order_number} (${rejection}). Prévenez le client puis annulez la commande.`,
        link: `/seller/orders/${storeOrder.id}`,
        is_read: false,
      });
    }
  }

  return NextResponse.json({ success: true, status: "rejected" });
}
