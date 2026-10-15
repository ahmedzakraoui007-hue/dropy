import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");

  if (!productId) {
    return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: reviews, error } = await supabase
    .from("product_reviews")
    .select("*")
    .eq("store_product_id", productId)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(reviews);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();
  const { store_product_id, rating, comment, customer_name, customer_email, store_order_id } = body;

  if (!store_product_id || !rating || !customer_name) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const ratingValue = Number(rating);
  if (!Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5) {
    return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
  }
  if ((comment && String(comment).length > 2000) || String(customer_name).length > 100) {
    return NextResponse.json({ error: "Review too long" }, { status: 400 });
  }
  const admin = createAdminClient();

  // Check for verified purchase if order_id is provided or search for an order with this email
  let is_verified_purchase = false;
  if (store_order_id && customer_email) {
    const { data: item } = await admin
      .from("store_order_items")
      .select("id, store_order:store_orders!inner(customer_email)")
      .eq("store_order_id", store_order_id)
      .eq("store_product_id", store_product_id)
      .eq("store_order.customer_email", String(customer_email).toLowerCase())
      .limit(1)
      .maybeSingle();

    if (item) is_verified_purchase = true;
  }

  const { data: review, error } = await supabase
    .from("product_reviews")
    .insert({
      store_product_id,
      rating: ratingValue,
      comment,
      customer_name,
      store_order_id: is_verified_purchase ? store_order_id : null,
      is_verified_purchase,
      status: "pending"
    })
    .select("id, status")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(review);
}
