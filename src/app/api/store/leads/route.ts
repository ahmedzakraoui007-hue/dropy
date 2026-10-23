import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RETENTION_DAYS = 30;

const text = (value: unknown, max: number) => {
  const v = String(value ?? "").trim().slice(0, max);
  return v || null;
};

export async function POST(request: Request) {
  const limited = rateLimit(request, "order-leads", 30, 3600);
  if (limited) return limited;

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ success: false }, { status: 400 });

  const storeId = String(body.storeId || "");
  const productId = String(body.productId || "");
  const leadId = typeof body.leadId === "string" && UUID.test(body.leadId) ? body.leadId : null;
  const phone = String(body.phone || "").replace(/\D/g, "").replace(/^216/, "");
  if (!UUID.test(storeId) || !UUID.test(productId) || !/^[2-9]\d{7}$/.test(phone)) {
    return NextResponse.json({ success: false }, { status: 400 });
  }
  const quantity = Math.min(100, Math.max(1, Math.floor(Number(body.quantity) || 1)));

  const admin = createAdminClient();
  const { data: product } = await admin
    .from("store_products")
    .select("id, store_id, stores!inner(is_active)")
    .eq("id", productId)
    .eq("store_id", storeId)
    .maybeSingle();
  const storeActive = (product as any)?.stores?.is_active !== false;
  if (!product || !storeActive) return NextResponse.json({ success: false }, { status: 404 });

  const fields = {
    store_product_id: productId,
    variant_id: text(body.variantId, 64),
    quantity,
    customer_name: text(body.name, 120),
    customer_phone: phone,
    customer_governorate: text(body.governorate, 60),
    customer_city: text(body.city, 120),
    customer_address: text(body.address, 300),
    updated_at: new Date().toISOString(),
  };

  if (leadId) {
    const { data: updated } = await admin
      .from("store_order_leads")
      .update(fields)
      .eq("id", leadId)
      .eq("store_id", storeId)
      .eq("status", "open")
      .select("id")
      .maybeSingle();
    if (updated) return NextResponse.json({ success: true, leadId: updated.id });
  }

  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { data: recent } = await admin
    .from("store_order_leads")
    .select("id")
    .eq("store_id", storeId)
    .eq("customer_phone", phone)
    .eq("status", "open")
    .gte("created_at", since)
    .limit(1)
    .maybeSingle();
  if (recent) {
    await admin.from("store_order_leads").update(fields).eq("id", recent.id);
    return NextResponse.json({ success: true, leadId: recent.id });
  }

  const { data: created, error } = await admin
    .from("store_order_leads")
    .insert({ store_id: storeId, ...fields })
    .select("id")
    .single();
  if (error) return NextResponse.json({ success: false }, { status: 500 });

  await admin
    .from("store_order_leads")
    .delete()
    .eq("store_id", storeId)
    .lt("created_at", new Date(Date.now() - RETENTION_DAYS * 86400000).toISOString());

  return NextResponse.json({ success: true, leadId: created.id });
}
