import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();
  const { review_id, type, reply } = body;

  if (!review_id || !type || reply === undefined) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  let table = "";
  let column = "";

  switch (type) {
    case "product":
      table = "product_reviews";
      column = "admin_reply"; // We'll use admin_reply as a generic seller reply for products
      break;
    case "store":
      table = "store_reviews";
      column = "seller_reply";
      break;
    case "creator":
      table = "creator_reviews";
      column = "creator_reply";
      break;
    case "supplier":
      table = "supplier_reviews";
      column = "supplier_reply";
      break;
    default:
      return NextResponse.json({ error: "Invalid review type" }, { status: 400 });
  }

  const { data: updatedReview, error } = await supabase
    .from(table)
    .update({ [column]: reply })
    .eq("id", review_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(updatedReview);
}
