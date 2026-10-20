import { rateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NUMBER_REGEX = /^[A-Za-z0-9-]{4,40}$/;

function lastDigits(phone: string | null | undefined) {
  return (phone || "").replace(/\D/g, "").slice(-8);
}

export async function GET(request: Request) {
  const limited = rateLimit(request, "order-track", 30, 600);
  if (limited) return limited;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const number = searchParams.get("number")?.trim();
  const phone = searchParams.get("phone");

  if (id ? !UUID_REGEX.test(id) : !number || !NUMBER_REGEX.test(number)) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  const supabase = createAdminClient();
  const query = supabase
    .from("store_orders")
    .select(
      `id, order_number, status, tracking_number, shipping_company, estimated_delivery, created_at,
       shipped_at, delivered_at, total_amount, subtotal, discount_amount, shipping_cost, payment_method,
       customer_name, customer_phone, customer_address, customer_governorate,
       items:store_order_items(product_name, quantity, unit_price, total_price, product_image, variant_info),
       store:stores(name, logo_url, slug)`
    );

  const { data: order } = id
    ? await query.eq("id", id).maybeSingle()
    : await query.or(`order_number.eq.${number},tracking_number.eq.${number}`).limit(1).maybeSingle();

  if (!order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  const verified =
    Boolean(id) || (Boolean(phone) && lastDigits(phone).length === 8 && lastDigits(phone) === lastDigits(order.customer_phone));

  const { customer_name, customer_phone, customer_address, customer_governorate, ...publicOrder } = order;

  return NextResponse.json({
    order: verified
      ? { ...publicOrder, customer_name, customer_phone, customer_address, customer_governorate }
      : publicOrder,
    verified,
  });
}
