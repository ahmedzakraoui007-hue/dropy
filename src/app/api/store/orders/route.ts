import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { requestIp } from "@/lib/order-protection";
import { createStoreOrder } from "@/lib/create-store-order";

export async function POST(request: Request) {
  const limited = rateLimit(request, "checkout", 20, 3600);
  if (limited) return limited;
  try {
    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ success: false, code: "invalid_request", error: "Requête invalide" }, { status: 400 });
    const result = await createStoreOrder({
      storeId: body.storeId,
      cart: body.cart,
      customer: body.customer || {},
      paymentMethod: body.paymentMethod,
      appliedPromo: body.appliedPromo,
      promoCode: body.promoCode,
      turnstileToken: body.turnstileToken,
      extras: body.extras && typeof body.extras === "object" ? body.extras : undefined,
      ip: requestIp(request),
      userAgent: request.headers.get("user-agent"),
    });
    if (!result.ok) {
      return NextResponse.json({ success: false, code: result.code, error: result.error, ...(result.extra || {}) }, { status: result.status });
    }
    return NextResponse.json({ success: true, orderId: result.orderId, orderNumber: result.orderNumber, totalAmount: result.totalAmount });
  } catch (error) {
    console.error("Order error:", error);
    return NextResponse.json({ success: false, code: "order_failed", error: "Une erreur est survenue lors de la commande" }, { status: 500 });
  }
}
