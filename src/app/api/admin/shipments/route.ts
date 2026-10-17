import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const auth = await requireUser(["admin"]);
  if (!auth.ok) return auth.response;

  const supabase = createAdminClient();
  const { data: shipments, error } = await supabase
    .from("delivery_shipments")
    .select("*, supplier_order:supplier_orders(supplier_order_number, status, supplier_id, delivery_address)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const supplierIds = [...new Set((shipments || []).map((s) => s.supplier_order?.supplier_id).filter(Boolean))];
  const { data: suppliers } = supplierIds.length
    ? await supabase.from("profiles").select("id, full_name, email, phone").in("id", supplierIds)
    : { data: [] };
  const byId = Object.fromEntries((suppliers || []).map((s) => [s.id, s]));

  return NextResponse.json({
    shipments: (shipments || []).map((s) => ({ ...s, supplier: byId[s.supplier_order?.supplier_id] || null })),
  });
}
