import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();
  const { code, storeId, subtotal } = body;

  if (!code || !storeId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data: promo, error } = await supabase
    .from("promo_codes")
    .select("*")
    .eq("store_id", storeId)
    .eq("code", code.toUpperCase())
    .eq("is_active", true)
    .single();

  if (error || !promo) {
    return NextResponse.json({ error: "Code promo invalide" }, { status: 404 });
  }

  // Validation logic
  const now = new Date();
  if (promo.start_date && new Date(promo.start_date) > now) {
    return NextResponse.json({ error: "Ce code n'est pas encore actif" }, { status: 400 });
  }
  if (promo.end_date && new Date(promo.end_date) < now) {
    return NextResponse.json({ error: "Ce code a expiré" }, { status: 400 });
  }
  if (promo.usage_limit && promo.usage_count >= promo.usage_limit) {
    return NextResponse.json({ error: "Ce code a atteint sa limite d'utilisation" }, { status: 400 });
  }
  if (promo.min_purchase && subtotal < promo.min_purchase) {
    return NextResponse.json({ error: `Le montant minimum pour ce code est de ${promo.min_purchase} TND` }, { status: 400 });
  }

  return NextResponse.json({
    valid: true,
    promo: {
      id: promo.id,
      code: promo.code,
      type: promo.type,
      value: promo.value
    }
  });
}
