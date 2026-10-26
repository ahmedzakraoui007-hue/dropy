import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { confirmStoreOrder } from "@/lib/confirm-store-order";

const CANCEL_REASONS = ["unreachable", "customer_cancelled", "fake_order", "out_of_stock", "other"] as const;

const SUPPLIER_LOCKED = ["ready_for_pickup", "scheduled", "picked_up", "shipped", "delivered"];

type Admin = ReturnType<typeof createAdminClient>;

async function restoreStock(admin: Admin, orderId: string) {
  const { data: items } = await admin
    .from("store_order_items")
    .select("store_product_id, variant_id, quantity")
    .eq("store_order_id", orderId);

  for (const item of items || []) {
    const quantity = Number(item.quantity || 0);
    if (!item.store_product_id || quantity <= 0) continue;

    const { data: storeProduct } = await admin
      .from("store_products")
      .select("id, product_id, is_dropship, stock_quantity, variants")
      .eq("id", item.store_product_id)
      .maybeSingle();
    if (!storeProduct) continue;

    if (storeProduct.is_dropship && storeProduct.product_id) {
      const { data: source } = await admin.from("products").select("stock_quantity").eq("id", storeProduct.product_id).maybeSingle();
      if (source && source.stock_quantity != null) {
        const next = Number(source.stock_quantity) + quantity;
        await admin.from("products").update({ stock_quantity: next }).eq("id", storeProduct.product_id);
        await admin.from("store_products").update({ stock_quantity: next }).eq("product_id", storeProduct.product_id).eq("is_dropship", true);
      }
    } else if (storeProduct.stock_quantity != null) {
      await admin
        .from("store_products")
        .update({ stock_quantity: Number(storeProduct.stock_quantity) + quantity })
        .eq("id", storeProduct.id);
    }

    if (item.variant_id) {
      const { data: variant } = await admin.from("store_product_variants").select("id, stock").eq("id", item.variant_id).maybeSingle();
      if (variant && variant.stock != null) {
        await admin.from("store_product_variants").update({ stock: Number(variant.stock) + quantity }).eq("id", variant.id);
      } else if (Array.isArray(storeProduct.variants)) {
        const variants = storeProduct.variants.map((v: any) =>
          v?.id === item.variant_id && v.stock != null ? { ...v, stock: Number(v.stock) + quantity } : v
        );
        await admin.from("store_products").update({ variants }).eq("id", storeProduct.id);
      }
    }
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(["seller", "admin", "agent"]);
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const body = await request.json().catch(() => null);
  const action = body?.action as "confirm" | "cancel" | undefined;
  if (action !== "confirm" && action !== "cancel") {
    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("store_orders")
    .select("id, order_number, status, store_id, stores(vendor_id)")
    .eq("id", id)
    .maybeSingle();
  const vendorId = (order?.stores as any)?.vendor_id;
  let allowed = Boolean(order) && (vendorId === auth.user.id || auth.role === "admin");
  if (order && !allowed && auth.role === "agent") {
    const { data: member } = await admin
      .from("store_members")
      .select("id")
      .eq("store_id", order.store_id)
      .eq("user_id", auth.user.id)
      .eq("status", "active")
      .maybeSingle();
    allowed = Boolean(member);
  }
  if (!order || !allowed) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  const { data: links } = await admin.from("store_order_items").select("supplier_order_id").eq("store_order_id", order.id);
  const supplierOrderIds = [...new Set((links || []).map((l) => l.supplier_order_id).filter(Boolean))] as string[];
  const { data: supplierOrders } = supplierOrderIds.length
    ? await admin.from("supplier_orders").select("id, supplier_id, supplier_order_number, status").in("id", supplierOrderIds)
    : { data: [] as { id: string; supplier_id: string; supplier_order_number: string; status: string }[] };
  const now = new Date().toISOString();

  if (action === "confirm") {
    if (order.status !== "new" || !(await confirmStoreOrder(admin, order.id, auth.user.id))) {
      return NextResponse.json({ error: "Cette commande n'est plus à confirmer" }, { status: 409 });
    }
    return NextResponse.json({ success: true, status: "confirmed" });
  }

  const rawReason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 200) : "";
  const reason = CANCEL_REASONS.includes(rawReason as (typeof CANCEL_REASONS)[number]) ? rawReason : rawReason || "other";
  if (!["new", "confirmed", "preparing"].includes(order.status)) {
    return NextResponse.json({ error: "Cette commande ne peut plus être annulée" }, { status: 409 });
  }
  if ((supplierOrders || []).some((s) => SUPPLIER_LOCKED.includes(s.status))) {
    return NextResponse.json({ error: "Le colis est déjà prêt ou chez le livreur : contactez le support Dropy" }, { status: 409 });
  }

  const { error } = await admin
    .from("store_orders")
    .update({ status: "cancelled", cancelled_at: now, cancel_reason: reason, handled_by: auth.user.id })
    .eq("id", order.id)
    .in("status", ["new", "confirmed", "preparing"]);
  if (error) throw error;

  for (const so of (supplierOrders || []).filter((s) => s.status !== "cancelled")) {
    await admin.from("supplier_orders").update({ status: "cancelled", rejection_reason: `Annulée par le vendeur (${reason})`, updated_at: now }).eq("id", so.id);
    if (so.status !== "awaiting_confirmation") {
      await admin.from("notifications").insert({
        user_id: so.supplier_id,
        type: "order_update",
        title: "❌ Commande annulée",
        message: `La commande ${so.supplier_order_number} a été annulée par le vendeur. Ne l'expédiez pas.`,
        link: "/supplier/orders",
        is_read: false,
      });
    }
  }
  await admin.from("store_order_items").update({ item_status: "cancelled" }).eq("store_order_id", order.id);
  await restoreStock(admin, order.id);

  return NextResponse.json({ success: true, status: "cancelled" });
}
