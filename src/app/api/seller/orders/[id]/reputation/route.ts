import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { customerReputation } from "@/lib/customer-reputation";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(["seller", "admin", "agent"]);
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("store_orders")
    .select("id, store_id, customer_phone, stores(vendor_id)")
    .eq("id", id)
    .maybeSingle();
  if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });

  const vendorId = (order.stores as { vendor_id?: string } | null)?.vendor_id;
  let allowed = vendorId === auth.user.id || auth.role === "admin";
  if (!allowed && auth.role === "agent") {
    const { data: member } = await admin
      .from("store_members")
      .select("id")
      .eq("store_id", order.store_id)
      .eq("user_id", auth.user.id)
      .eq("status", "active")
      .maybeSingle();
    allowed = Boolean(member);
  }
  if (!allowed) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });

  const reputation = await customerReputation(admin, order.customer_phone, order.id);
  return NextResponse.json(reputation, { headers: { "Cache-Control": "private, max-age=60" } });
}
