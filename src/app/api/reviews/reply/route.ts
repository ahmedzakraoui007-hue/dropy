import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";

const REVIEW_TYPES = {
  product: { table: "product_reviews", column: "admin_reply" },
  store: { table: "store_reviews", column: "seller_reply" },
  creator: { table: "creator_reviews", column: "creator_reply" },
  supplier: { table: "supplier_reviews", column: "supplier_reply" },
} as const;

type ReviewType = keyof typeof REVIEW_TYPES;

export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { user, role, supabase } = auth;

  const body = await request.json().catch(() => null);
  const reviewId = body?.review_id;
  const type = body?.type as ReviewType;
  const reply = body?.reply;

  if (!reviewId || reply === undefined || !(type in REVIEW_TYPES)) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (typeof reply !== "string" || reply.length > 2000) {
    return NextResponse.json({ error: "Invalid reply" }, { status: 400 });
  }

  const { table, column } = REVIEW_TYPES[type];
  const { data: review } = await supabase.from(table).select("*").eq("id", reviewId).maybeSingle();
  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  if (role !== "admin") {
    let ownerId: string | null = null;

    if (type === "store" || type === "product") {
      let storeId = review.store_id;
      if (type === "product") {
        const { data: product } = await supabase
          .from("store_products")
          .select("store_id")
          .eq("id", review.store_product_id)
          .maybeSingle();
        storeId = product?.store_id;
      }
      const { data: store } = await supabase.from("stores").select("vendor_id").eq("id", storeId).maybeSingle();
      ownerId = store?.vendor_id ?? null;
    } else {
      const ref = type === "creator" ? review.creator_id : review.supplier_id;
      if (ref === user.id) {
        ownerId = user.id;
      } else {
        const { data: profile } = await supabase
          .from(type === "creator" ? "creator_profiles" : "supplier_profiles")
          .select("user_id")
          .eq("id", ref)
          .maybeSingle();
        ownerId = profile?.user_id ?? null;
      }
    }

    if (ownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { data: updatedReview, error } = await supabase
    .from(table)
    .update({ [column]: reply.trim() })
    .eq("id", reviewId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Could not save reply" }, { status: 500 });
  }

  return NextResponse.json(updatedReview);
}
