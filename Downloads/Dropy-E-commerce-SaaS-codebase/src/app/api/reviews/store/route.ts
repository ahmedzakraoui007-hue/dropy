import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get("storeId");

  if (!storeId) {
    return NextResponse.json({ error: "Store ID is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: reviews, error } = await supabase
    .from("store_reviews")
    .select("*")
    .eq("store_id", storeId)
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
  const { store_id, rating, comment, customer_name, customer_email } = body;

  if (!store_id || !rating || !customer_name) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Check for verified purchase (any order from this store with this email)
  let is_verified_purchase = false;
  if (customer_email) {
    const { data: orders } = await supabase
      .from("store_orders")
      .select("id")
      .eq("store_id", store_id)
      .eq("customer_email", customer_email)
      .limit(1);
    
    if (orders && orders.length > 0) is_verified_purchase = true;
  }

  const { data: review, error } = await supabase
    .from("store_reviews")
    .insert({
      store_id,
      rating,
      comment,
      customer_name,
      customer_email,
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
