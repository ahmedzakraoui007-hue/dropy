import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const creatorId = searchParams.get("creatorId");

  if (!creatorId) {
    return NextResponse.json({ error: "Creator ID is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: reviews, error } = await supabase
    .from("creator_reviews")
    .select("*")
    .eq("creator_id", creatorId)
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
  const { brief_id, creator_id, store_id, rating, quality_rating, communication_rating, deadline_rating, comment } = body;

  if (!creator_id || !rating) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data: review, error } = await supabase
    .from("creator_reviews")
    .insert({
      brief_id,
      creator_id,
      store_id,
      rating,
      quality_rating,
      communication_rating,
      deadline_rating,
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
