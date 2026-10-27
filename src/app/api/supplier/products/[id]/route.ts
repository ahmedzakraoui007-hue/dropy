import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const money = (value: unknown) => {
  const n = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 1000) / 1000 : null;
};

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(["supplier"]);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const { data: product } = await auth.supabase
    .from("products")
    .select("id, name, is_active, stock_quantity")
    .eq("id", id)
    .eq("supplier_id", auth.user.id)
    .maybeSingle();
  if (!product) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const update: Record<string, unknown> = {};
  if (typeof body.name === "string") {
    const name = body.name.trim().slice(0, 200);
    if (name.length < 2) return NextResponse.json({ error: "invalid_name" }, { status: 400 });
    update.name = name;
  }
  if (typeof body.description === "string") update.description = body.description.trim().slice(0, 5000);
  if (body.base_price !== undefined) {
    const price = money(body.base_price);
    if (price == null || price <= 0) return NextResponse.json({ error: "invalid_price" }, { status: 400 });
    update.base_price = price;
  }
  if (body.compare_price !== undefined) {
    const advised = body.compare_price === "" || body.compare_price === null ? null : money(body.compare_price);
    update.compare_price = advised;
  }
  if (body.stock_quantity !== undefined) {
    const stock = Number(body.stock_quantity);
    if (!Number.isInteger(stock) || stock < 0) return NextResponse.json({ error: "invalid_stock" }, { status: 400 });
    update.stock_quantity = stock;
  }
  if (typeof body.is_active === "boolean") update.is_active = body.is_active;

  const { error } = await auth.supabase.from("products").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: "update_failed" }, { status: 500 });

  const admin = createAdminClient();
  if (update.stock_quantity !== undefined) {
    await admin.from("store_products").update({ stock_quantity: update.stock_quantity }).eq("product_id", id).eq("is_dropship", true);
  }
  if (update.is_active === false && product.is_active !== false) {
    const { data: listings } = await admin
      .from("store_products")
      .update({ is_active: false })
      .eq("product_id", id)
      .eq("is_dropship", true)
      .eq("is_active", true)
      .select("store_id");
    const storeIds = [...new Set((listings || []).map((l) => l.store_id))];
    if (storeIds.length) {
      const { data: stores } = await admin.from("stores").select("vendor_id").in("id", storeIds);
      const vendors = [...new Set((stores || []).map((s) => s.vendor_id).filter(Boolean))];
      if (vendors.length) {
        await admin.from("notifications").insert(
          vendors.map((vendorId) => ({
            user_id: vendorId,
            type: "product_update",
            title: "Produit retiré par le fournisseur",
            message: `« ${product.name} » n'est plus disponible chez le fournisseur : il a été masqué dans votre boutique.`,
            link: "/seller/products/add",
            is_read: false,
          }))
        );
      }
    }
  }

  return NextResponse.json({ success: true });
}
