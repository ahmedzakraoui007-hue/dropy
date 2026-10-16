import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_LINES = 50;
const MAX_QUANTITY = 100;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type CartLine = { productId: string; variantId: string | null; quantity: number };

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
      merged.set(key, { productId, variantId, quantity });
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
        .select("*, values:store_product_variant_values(custom_value, type:variant_types(name), option:variant_options(label, value))")
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
      let variant: { id: string; info: Record<string, string> } | null = null;

      if (line.variantId) {
        const tableVariant = variantMap.get(line.variantId);
        const jsonVariant = Array.isArray(product.variants)
          ? product.variants.find((v: any) => v?.id === line.variantId)
          : null;

        if (tableVariant && tableVariant.product_id === product.id && tableVariant.is_active !== false) {
          if (tableVariant.price != null) unitPrice = Number(tableVariant.price);
          stock = tableVariant.stock ?? null;
          variant = {
            id: tableVariant.id,
            info: Object.fromEntries(
              (tableVariant.values || []).map((v: any) => [
                v.type?.name || "Option",
                v.option?.label || v.option?.value || v.custom_value || "",
              ])
            ),
          };
        } else if (jsonVariant) {
          if (jsonVariant.price != null) unitPrice = Number(jsonVariant.price);
          stock = jsonVariant.stock ?? null;
          const typeName = String(jsonVariant.type || "Option");
          variant = {
            id: jsonVariant.id,
            info: { [typeName.charAt(0).toUpperCase() + typeName.slice(1)]: String(jsonVariant.value ?? "") },
          };
        } else {
          return fail("product_unavailable", "Une variante de votre panier n'est plus disponible", 409, {
            productId: line.productId,
          });
        }
      } else if (product.has_variants) {
        return fail("variant_required", `Veuillez choisir une option pour « ${product.name} »`, 409, {
          productId: line.productId,
        });
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

    const dropshipSourceIds = [
      ...new Set(priced.filter((p) => p.product.is_dropship && p.product.product_id).map((p) => p.product.product_id)),
    ];
    const sourceMap = new Map<string, any>();
    if (dropshipSourceIds.length) {
      const { data: sources, error: sourcesError } = await supabase
        .from("products")
        .select("id, supplier_id, base_price, sku")
        .in("id", dropshipSourceIds);
      if (sourcesError) throw sourcesError;
      for (const source of sources || []) sourceMap.set(source.id, source);
    }

    const lineItems = priced.map((p) => {
      const source = p.product.is_dropship ? sourceMap.get(p.product.product_id) : null;
      return { ...p, source, supplierId: (source?.supplier_id as string | undefined) ?? null };
    });
    const hasDropship = lineItems.some((l) => l.supplierId);
    const hasOwn = lineItems.some((l) => !l.supplierId);

    const { data: order, error: orderError } = await supabase
      .from("store_orders")
      .insert({
        store_id: storeId,
        order_number: number,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        customer_address: customerCity ? `${customerAddress}, ${customerCity}` : customerAddress,
        customer_governorate: customer.governorate ? String(customer.governorate) : null,
        subtotal,
        discount_amount: discountAmount,
        promo_code: promoCode,
        total_amount: totalAmount,
        payment_method: "cod",
        status: "new",
        payment_status: "pending",
        has_own_products: hasOwn,
        has_dropshipping_products: hasDropship,
      })
      .select()
      .single();
    if (orderError) throw orderError;

    const { error: itemsError } = await supabase.from("store_order_items").insert(
      lineItems.map((l) => ({
        store_order_id: order.id,
        store_product_id: l.product.id,
        product_name: l.product.name,
        quantity: l.line.quantity,
        unit_price: l.unitPrice,
        total_price: l.total,
        product_image: l.product.images?.[0] ?? null,
        variant_info: l.variant?.info ?? null,
        fulfillment_type: l.supplierId ? "dropshipping" : "own",
        supplier_id: l.supplierId,
      }))
    );
    if (itemsError) {
      await supabase.from("store_orders").delete().eq("id", order.id);
      throw itemsError;
    }

    const bySupplier = new Map<string, typeof lineItems>();
    for (const l of lineItems) {
      await supabase.rpc("decrement_store_stock", { p_id: l.product.id, p_qty: l.line.quantity });
      if (l.variant) {
        const tableVariant = variantMap.get(l.variant.id);
        if (tableVariant && tableVariant.stock != null) {
          await supabase
            .from("store_product_variants")
            .update({ stock: Math.max(0, tableVariant.stock - l.line.quantity) })
            .eq("id", tableVariant.id);
        } else if (Array.isArray(l.product.variants)) {
          const variants = l.product.variants.map((v: any) =>
            v?.id === l.variant!.id && v.stock != null ? { ...v, stock: Math.max(0, v.stock - l.line.quantity) } : v
          );
          l.product.variants = variants;
          await supabase.from("store_products").update({ variants }).eq("id", l.product.id);
        }
      }
      if (l.supplierId) {
        await supabase.rpc("decrement_supplier_stock", { p_store_product_id: l.product.id, p_qty: l.line.quantity });
        const list = bySupplier.get(l.supplierId) || [];
        list.push(l);
        bySupplier.set(l.supplierId, list);
      }
    }

    let firstSupplierOrderId: string | null = null;
    for (const [supplierId, items] of bySupplier) {
      const { data: supplierOrder, error: supplierOrderError } = await supabase
        .from("supplier_orders")
        .insert({
          supplier_order_number: orderNumber("SUP"),
          supplier_id: supplierId,
          status: "pending",
          delivery_address: {
            name: customerName,
            phone: customerPhone,
            address: customerAddress,
            city: customerCity,
            store_order_number: number,
          },
        })
        .select("id")
        .single();

      if (supplierOrderError || !supplierOrder) {
        console.error("Supplier order error:", supplierOrderError);
        continue;
      }
      firstSupplierOrderId ??= supplierOrder.id;

      await supabase.from("supplier_order_items").insert(
        items.map((i) => ({
          supplier_order_id: supplierOrder.id,
          product_id: i.source.id,
          product_name: i.product.name,
          product_sku: i.source.sku ?? null,
          product_image: i.product.images?.[0] ?? null,
          variant_info: i.variant?.info ?? null,
          quantity: i.line.quantity,
          unit_price: i.source.base_price ?? null,
        }))
      );

      await supabase
        .from("store_order_items")
        .update({ supplier_order_id: supplierOrder.id })
        .eq("store_order_id", order.id)
        .eq("supplier_id", supplierId);
    }

    if (firstSupplierOrderId) {
      await supabase.from("store_orders").update({ supplier_order_id: firstSupplierOrderId }).eq("id", order.id);
    }

    if (promoId) {
      await supabase.rpc("increment_promo_usage", { p_id: promoId });
    }

    if (store.vendor_id) {
      await supabase.from("notifications").insert({
        user_id: store.vendor_id,
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
