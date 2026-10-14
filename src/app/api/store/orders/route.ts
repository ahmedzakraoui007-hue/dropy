import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_LINES = 50;
const MAX_QUANTITY = 100;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type CartLine = { productId: string; variantId: string | null; quantity: number; variantInfo: string | null };

function fail(code: string, error: string, status = 400, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ success: false, code, error, ...extra }, { status });
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function orderNumber(prefix: string) {
  return `${prefix}-${randomBytes(5).toString("hex").toUpperCase()}`;
}

function parseCart(raw: unknown): CartLine[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_LINES) return null;
  const merged = new Map<string, CartLine>();
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") return null;
    const line = entry as Record<string, unknown>;
    const productId = String(line.productId ?? line.id ?? "").trim();
    const variantId = line.variantId ? String(line.variantId) : null;
    const quantity = Number(line.quantity ?? 1);
    if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) return null;
    const key = `${productId}:${variantId ?? ""}`;
    const existing = merged.get(key);
    if (existing) {
      existing.quantity += quantity;
      if (existing.quantity > MAX_QUANTITY) return null;
    } else {
      merged.set(key, {
        productId,
        variantId,
        quantity,
        variantInfo: line.variantInfo ? String(line.variantInfo).slice(0, 200) : null,
      });
    }
  }
  return [...merged.values()];
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) return fail("invalid_request", "Requête invalide");

    const storeId = String(body.storeId || "");
    const paymentMethod = body.paymentMethod || "cod";
    const customer = body.customer || {};
    const customerName = String(customer.name || "").trim();
    const customerPhone = String(customer.phone || "").trim();
    const customerAddress = String(customer.address || "").trim();
    const customerEmail = String(customer.email || "").trim().toLowerCase();
    const customerCity = customer.city ? String(customer.city).trim() : null;

    if (!storeId) return fail("invalid_request", "Boutique manquante");
    if (!customerName || !customerAddress) return fail("missing_fields", "Champs obligatoires manquants");
    if (customerPhone.replace(/\D/g, "").length < 8) return fail("invalid_phone", "Numéro de téléphone invalide");
    if (customerEmail && !EMAIL_REGEX.test(customerEmail)) return fail("invalid_email", "Adresse email invalide");
    if (paymentMethod !== "cod") {
      return fail("payment_method_unavailable", "Seul le paiement à la livraison est disponible pour le moment");
    }

    const lines = parseCart(body.cart);
    if (!lines) return fail("invalid_cart", "Panier invalide");

    const supabase = createAdminClient();

    const { data: store } = await supabase.from("stores").select("*").eq("id", storeId).maybeSingle();
    if (!store || store.is_active === false) return fail("store_unavailable", "Boutique introuvable", 404);

    const productIds = [...new Set(lines.map((l) => l.productId))];
    const { data: products, error: productsError } = await supabase
      .from("store_products")
      .select("*")
      .eq("store_id", storeId)
      .in("id", productIds);
    if (productsError) throw productsError;
    const productMap = new Map((products || []).map((p) => [p.id, p]));

    const variantIds = lines.map((l) => l.variantId).filter((v): v is string => Boolean(v));
    const variantMap = new Map<string, any>();
    if (variantIds.length) {
      const { data: variants, error: variantsError } = await supabase
        .from("store_product_variants")
        .select("*")
        .in("id", variantIds);
      if (variantsError) throw variantsError;
      for (const v of variants || []) variantMap.set(v.id, v);
    }

    const priced = [];
    for (const line of lines) {
      const product = productMap.get(line.productId);
      if (!product || product.is_active === false) {
        return fail("product_unavailable", "Un produit de votre panier n'est plus disponible", 409, {
          productId: line.productId,
        });
      }

      let unitPrice = Number(product.selling_price ?? product.price);
      let stock: number | null = product.stock_quantity ?? null;
      let variant = null;

      if (line.variantId) {
        variant = variantMap.get(line.variantId);
        if (!variant || variant.product_id !== product.id || variant.is_active === false) {
          return fail("product_unavailable", "Une variante de votre panier n'est plus disponible", 409, {
            productId: line.productId,
          });
        }
        if (variant.price != null) unitPrice = Number(variant.price);
        stock = variant.stock ?? null;
      }

      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        return fail("product_unavailable", "Prix du produit invalide", 409, { productId: line.productId });
      }
      if (stock != null && stock < line.quantity) {
        return fail("out_of_stock", `Stock insuffisant pour « ${product.name} »`, 409, {
          productId: line.productId,
          available: Math.max(0, stock),
        });
      }

      priced.push({ line, product, variant, unitPrice: round2(unitPrice), total: round2(unitPrice * line.quantity) });
    }

    const subtotal = round2(priced.reduce((sum, p) => sum + p.total, 0));

    let discountAmount = 0;
    let promoId: string | null = null;
    let promoCode = "";
    const promoRef = body.appliedPromo?.id || body.promoCode;
    if (promoRef) {
      const query = supabase.from("promo_codes").select("*").eq("store_id", storeId).eq("is_active", true);
      const { data: promo } = body.appliedPromo?.id
        ? await query.eq("id", body.appliedPromo.id).maybeSingle()
        : await query.eq("code", String(body.promoCode).toUpperCase()).maybeSingle();

      if (promo) {
        const now = new Date();
        const valid =
          (!promo.start_date || new Date(promo.start_date) <= now) &&
          (!promo.end_date || new Date(promo.end_date) >= now) &&
          (!promo.usage_limit || promo.usage_count < promo.usage_limit) &&
          (!promo.min_purchase || subtotal >= promo.min_purchase);
        if (valid) {
          promoId = promo.id;
          promoCode = promo.code;
          const raw = promo.type === "percentage" ? (subtotal * Number(promo.value)) / 100 : Number(promo.value);
          discountAmount = round2(Math.min(Math.max(raw, 0), subtotal));
        }
      }
    }

    const totalAmount = round2(subtotal - discountAmount);
    const number = orderNumber("DRP");

    const { data: order, error: orderError } = await supabase
      .from("store_orders")
      .insert({
        store_id: storeId,
        order_number: number,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        customer_address: customerCity ? `${customerAddress}, ${customerCity}` : customerAddress,
        subtotal,
        discount_amount: discountAmount,
        promo_code: promoCode,
        total_amount: totalAmount,
        payment_method: "cod",
        status: "new",
        payment_status: "pending",
      })
      .select()
      .single();
    if (orderError) throw orderError;

    const { error: itemsError } = await supabase.from("store_order_items").insert(
      priced.map(({ line, product, unitPrice, total }) => ({
        store_order_id: order.id,
        store_product_id: product.id,
        product_name: product.name,
        quantity: line.quantity,
        unit_price: unitPrice,
        total_price: total,
        product_image: product.images?.[0] ?? null,
        fulfillment_type: product.fulfillment_type || "own",
        supplier_id: product.supplier_id ?? null,
        cost_price: product.cost_price || 0,
      }))
    );
    if (itemsError) {
      await supabase.from("store_orders").delete().eq("id", order.id);
      throw itemsError;
    }

    const supplierLines = new Map<string, typeof priced>();
    for (const p of priced) {
      await supabase.rpc("decrement_store_stock", { p_id: p.product.id, p_qty: p.line.quantity });
      if (p.product.fulfillment_type === "dropshipping" && p.product.supplier_id) {
        await supabase.rpc("decrement_supplier_stock", { p_store_product_id: p.product.id, p_qty: p.line.quantity });
        const list = supplierLines.get(p.product.supplier_id) || [];
        list.push(p);
        supplierLines.set(p.product.supplier_id, list);
      }
    }

    for (const [supplierId, items] of supplierLines) {
      const { data: supplierOrder, error: supplierOrderError } = await supabase
        .from("supplier_orders")
        .insert({
          supplier_id: supplierId,
          store_order_id: order.id,
          supplier_order_number: orderNumber("SUP"),
          status: "pending",
          total_amount: round2(items.reduce((sum, i) => sum + (i.product.cost_price || 0) * i.line.quantity, 0)),
          delivery_address: customerAddress,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_city: customerCity,
        })
        .select()
        .single();

      if (supplierOrderError) {
        console.error("Supplier order error:", supplierOrderError);
        continue;
      }

      await supabase.from("supplier_order_items").insert(
        items.map((i) => ({
          supplier_order_id: supplierOrder.id,
          product_name: i.product.name,
          quantity: i.line.quantity,
          product_image: i.product.images?.[0] ?? null,
          variant_info: i.line.variantInfo,
        }))
      );
    }

    if (promoId) {
      await supabase.rpc("increment_promo_usage", { p_id: promoId });
    }

    if (store.seller_id) {
      await supabase.from("notifications").insert({
        user_id: store.seller_id,
        type: "new_order",
        title: "🛍️ Nouvelle commande !",
        message: `Vous avez reçu une nouvelle commande (${number}) de ${totalAmount.toFixed(2)} TND.`,
        link: `/seller/orders/${order.id}`,
        is_read: false,
      });
    }

    return NextResponse.json({ success: true, orderId: order.id, orderNumber: number, totalAmount });
  } catch (error) {
    console.error("Order error:", error);
    return fail("order_failed", "Une erreur est survenue lors de la commande", 500);
  }
}
