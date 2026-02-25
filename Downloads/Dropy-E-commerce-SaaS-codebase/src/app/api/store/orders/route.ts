import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const {
      storeId,
      cart,
      customer,
      appliedPromo,
      paymentMethod = "cod",
      slug
    } = body;

    if (!storeId || !cart || cart.length === 0 || !customer) {
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
    }

    // 1. Calculate subtotal
    const subtotal = cart.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);

    // 2. Re-validate Promo Code if exists
    let discountAmount = 0;
    let promoId = null;
    let promoCodeStr = "";

    if (appliedPromo) {
      const { data: promo } = await supabase
        .from("promo_codes")
        .select("*")
        .eq("id", appliedPromo.id)
        .eq("is_active", true)
        .single();

      if (promo) {
        const now = new Date();
        const isValid = (!promo.start_date || new Date(promo.start_date) <= now) &&
          (!promo.end_date || new Date(promo.end_date) >= now) &&
          (!promo.usage_limit || promo.usage_count < promo.usage_limit) &&
          (!promo.min_purchase || subtotal >= promo.min_purchase);

        if (isValid) {
          promoId = promo.id;
          promoCodeStr = promo.code;
          discountAmount = promo.type === "percentage"
            ? (subtotal * promo.value / 100)
            : promo.value;
        }
      }
    }

    const totalAmount = Math.max(0, subtotal - discountAmount);
    const orderNumber = `DRP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // 3. Create Order in DB
    const { data: order, error: orderError } = await supabase
      .from("store_orders")
      .insert({
        store_id: storeId,
        order_number: orderNumber,
        customer_name: customer.name,
        customer_email: customer.email || "",
        customer_phone: customer.phone,
        customer_address: customer.address,
        subtotal,
        discount_amount: discountAmount,
        promo_code: promoCodeStr,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        status: "new",
        payment_status: "pending"
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // 4. Create Order Items & Update Stock
    const supplierItemsMap = new Map<string, any[]>();

    for (const item of cart) {
      // Fetch product details to get supplier_id and fulfillment type
      const { data: productData } = await supabase
        .from("store_products")
        .select("supplier_id, fulfillment_type, cost_price")
        .eq("id", item.id)
        .single();

      const fulfillmentType = productData?.fulfillment_type || 'own';
      const supplierId = productData?.supplier_id;

      // Insert Store Order Item
      await supabase.from("store_order_items").insert({
        store_order_id: order.id,
        store_product_id: item.id,
        product_name: item.title,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        product_image: item.image,
        fulfillment_type: fulfillmentType,
        supplier_id: supplierId,
        cost_price: productData?.cost_price || 0
      });

      // Update Stocks
      await supabase.rpc('decrement_store_stock', { p_id: item.id, p_qty: item.quantity });
      if (fulfillmentType === 'dropshipping' && supplierId) {
        await supabase.rpc('decrement_supplier_stock', { p_store_product_id: item.id, p_qty: item.quantity });

        // Add to supplier map for order creation
        if (!supplierItemsMap.has(supplierId)) {
          supplierItemsMap.set(supplierId, []);
        }
        supplierItemsMap.get(supplierId)?.push({
          ...item,
          cost_price: productData?.cost_price
        });
      }
    }

    // 4b. Create Supplier Orders
    for (const [supplierId, items] of supplierItemsMap) {
      const supplierOrderNumber = `SUP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      const { data: supplierOrder, error: supOrderError } = await supabase
        .from("supplier_orders")
        .insert({
          supplier_id: supplierId,
          store_order_id: order.id, // Link to store order
          supplier_order_number: supplierOrderNumber,
          status: "pending",
          total_amount: items.reduce((sum, i) => sum + (i.cost_price * i.quantity), 0), // Basic cost calculation
          delivery_address: customer.address, // Pass customer info (privacy handled in UI)
          customer_name: customer.name,
          customer_phone: customer.phone,
          customer_city: customer.city
        })
        .select()
        .single();

      if (!supOrderError && supplierOrder) {
        for (const item of items) {
          await supabase.from("supplier_order_items").insert({
            supplier_order_id: supplierOrder.id,
            product_name: item.title,
            quantity: item.quantity,
            product_image: item.image,
            variant_info: item.variantInfo // If available
          });
        }
      }
    }

    // 5. Update Promo Usage
    if (promoId) {
      await supabase.rpc('increment_promo_usage', { p_id: promoId });
    }

    // 6. Stripe Integration for card payments
    if (paymentMethod === "card") {
      const headersList = await headers();
      const origin = headersList.get('origin') || '';

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: cart.map((item: any) => ({
          price_data: {
            currency: 'tnd',
            product_data: {
              name: item.title,
              images: [item.image].filter(Boolean),
            },
            unit_amount: Math.round(item.price * 100),
          },
          quantity: item.quantity,
        })),
        mode: 'payment',
        success_url: `${origin}/preview/${slug}/merci/${order.id}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/preview/${slug}/checkout?error=payment_cancelled`,
        metadata: {
          order_id: order.id,
          store_id: storeId,
          type: 'store_order'
        }
      });

      return NextResponse.json({ success: true, url: session.url, orderId: order.id });
    }

    // 7. Notify Seller
    const { data: storeData } = await supabase.from("stores").select("seller_id").eq("id", storeId).single();
    if (storeData?.seller_id) {
      await supabase.from("notifications").insert({
        user_id: storeData.seller_id,
        type: "new_order",
        title: "🛍️ Nouvelle commande !",
        message: `Vous avez reçu une nouvelle commande (${orderNumber}) de ${totalAmount.toFixed(2)} TND.`,
        link: `/seller/orders/${order.id}`,
        is_read: false
      });
    }

    return NextResponse.json({ success: true, orderId: order.id, orderNumber });
  } catch (error: any) {
    console.error("Order error:", error);
    return NextResponse.json({ error: error.message || "Une erreur est survenue" }, { status: 500 });
  }
}
