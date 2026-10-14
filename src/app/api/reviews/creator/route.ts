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

  if (!creator_id || !rating || !store_id) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const ratingValue = Number(rating);
  if (!Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5) {
    return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
  }
  if (comment && String(comment).length > 2000) {
    return NextResponse.json({ error: "Review too long" }, { status: 400 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: store } = await supabase.from("stores").select("seller_id").eq("id", store_id).maybeSingle();
  if (store?.seller_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: review, error } = await supabase
    .from("creator_reviews")
    .insert({
      brief_id,
      creator_id,
      store_id,
      rating: ratingValue,
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
