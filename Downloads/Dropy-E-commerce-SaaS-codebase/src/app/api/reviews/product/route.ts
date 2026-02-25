import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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

  // Check for verified purchase if order_id is provided or search for an order with this email
  let is_verified_purchase = false;
  if (store_order_id) {
    const { data: order } = await supabase
      .from("store_orders")
      .select("id")
      .eq("id", store_order_id)
      .eq("customer_email", customer_email)
      .single();
    
    if (order) is_verified_purchase = true;
  } else if (customer_email) {
    const { data: orders } = await supabase
      .from("store_orders")
      .select("id")
      .eq("customer_email", customer_email)
      .limit(1);
    
    if (orders && orders.length > 0) is_verified_purchase = true;
  }

  const { data: review, error } = await supabase
    .from("product_reviews")
    .insert({
      store_product_id,
      rating,
      comment,
      customer_name,
      store_order_id,
      is_verified_purchase,
      status: "published"
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(review);
}
