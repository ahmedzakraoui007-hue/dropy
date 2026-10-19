import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { escrowState } from "@/lib/content-escrow";

export async function GET() {
  const auth = await requireUser(["admin"]);
  if (!auth.ok) return auth.response;

  const admin = createAdminClient();
  const { data: payments, error } = await admin
    .from("content_payments")
    .select("*, brief:content_briefs(id, title, status, is_disputed), store:stores(name, vendor_id)")
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const userIds = [
    ...new Set((payments || []).flatMap((p) => [p.creator_id, p.store?.vendor_id]).filter(Boolean)),
  ];
  const { data: profiles } = userIds.length
    ? await admin
        .from("profiles")
        .select("id, full_name, email, phone, bank_name, bank_rib, d17_number, flouci_number")
        .in("id", userIds)
    : { data: [] };
  const byId = Object.fromEntries((profiles || []).map((p) => [p.id, p]));

  return NextResponse.json({
    payments: (payments || []).map((p) => ({
      ...p,
      state: escrowState(p),
      creator: byId[p.creator_id] || null,
      seller: byId[p.store?.vendor_id] || null,
    })),
  });
}
