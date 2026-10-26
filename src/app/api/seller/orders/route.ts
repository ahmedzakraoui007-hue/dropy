import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createStoreOrder } from "@/lib/create-store-order";
import { confirmStoreOrder } from "@/lib/confirm-store-order";

export async function POST(request: Request) {
  const auth = await requireUser(["seller"]);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ code: "invalid_request", error: "Requête invalide" }, { status: 400 });

  const { data: store } = await auth.supabase
    .from("stores")
    .select("id")
    .eq("vendor_id", auth.user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!store) return NextResponse.json({ code: "store_unavailable", error: "Boutique introuvable" }, { status: 404 });

  try {
    const result = await createStoreOrder({
      storeId: store.id,
      cart: body.cart,
      customer: body.customer || {},
      paymentMethod: "cod",
      promoCode: typeof body.promoCode === "string" && body.promoCode.trim() ? body.promoCode.trim() : undefined,
      ip: null,
      userAgent: null,
      manual: true,
      notes: typeof body.notes === "string" ? body.notes.trim() : null,
    });
    if (!result.ok) {
      return NextResponse.json({ code: result.code, error: result.error, ...(result.extra || {}) }, { status: result.status });
    }
    const confirmed = body.confirmed === true ? await confirmStoreOrder(createAdminClient(), result.orderId) : false;
    return NextResponse.json({ success: true, orderId: result.orderId, orderNumber: result.orderNumber, totalAmount: result.totalAmount, confirmed });
  } catch (error) {
    console.error("Manual order error:", error);
    return NextResponse.json({ code: "order_failed", error: "Une erreur est survenue" }, { status: 500 });
  }
}
