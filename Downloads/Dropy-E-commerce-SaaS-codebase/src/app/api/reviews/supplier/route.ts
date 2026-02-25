import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const supplierId = searchParams.get("supplierId");

  if (!supplierId) {
    return NextResponse.json({ error: "Supplier ID is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: reviews, error } = await supabase
    .from("supplier_reviews")
    .select("*")
    .eq("supplier_id", supplierId)
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
  const { supplier_id, seller_id, rating, comment } = body;

  if (!supplier_id || !seller_id || !rating) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data: review, error } = await supabase
    .from("supplier_reviews")
    .insert({
      supplier_id,
      seller_id,
      rating,
      comment,
      status: "published"
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(review);
}
